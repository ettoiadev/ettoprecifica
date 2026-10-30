/*
 * Worker de nesting (encaixe de peças numa chapa).
 *
 * Usa o NÚCLEO GEOMÉTRICO do SVGnest (Jack Qiao, MIT — ver LICENSE-svgnest.txt):
 * geometryutil.js (no-fit-polygon), clipper.js (Minkowski/offset), matrix.js e
 * placementworker.js, todos vendorizados aqui sem modificação.
 *
 * O que NÃO veio do SVGnest é o orquestrador: o original usa parallel.js, que
 * cria workers via blob + eval — frágil dentro de bundler. Aqui é um worker
 * clássico único, que é exatamente o ambiente para o qual aqueles arquivos
 * foram escritos (eles já se registram em `self`). A rotina de NFP abaixo é
 * porte fiel do callback `p.map()` do svgnest.js.
 *
 * Protocolo: recebe {bin, parts, config} e devolve {placements, fitness, ...}.
 * Coordenadas em milímetros.
 */

/* global GeometryUtil, ClipperLib, PlacementWorker */

// placementworker.js lê `global.env.self` — era o ambiente que o parallel.js
// injetava no worker dele. Recriamos o shim aqui para manter os arquivos
// vendorizados BYTE A BYTE iguais ao upstream (dá para diferenciar contra o
// SVGnest original quando precisar atualizar).
self.global = { env: {} };

importScripts('clipper.js', 'matrix.js', 'geometryutil.js', 'placementworker.js');

function rotatePolygon(polygon, degrees) {
  var rotated = [];
  var angle = (degrees * Math.PI) / 180;
  for (var i = 0; i < polygon.length; i++) {
    var x = polygon[i].x;
    var y = polygon[i].y;
    rotated.push({
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle),
    });
  }
  if (polygon.children && polygon.children.length > 0) {
    rotated.children = [];
    for (var j = 0; j < polygon.children.length; j++) {
      rotated.children.push(rotatePolygon(polygon.children[j], degrees));
    }
  }
  return rotated;
}

function toClipperCoordinates(polygon) {
  var clone = [];
  for (var i = 0; i < polygon.length; i++) clone.push({ X: polygon[i].x, Y: polygon[i].y });
  return clone;
}

function toNestCoordinates(polygon, scale) {
  var clone = [];
  for (var i = 0; i < polygon.length; i++)
    clone.push({ x: polygon[i].X / scale, y: polygon[i].Y / scale });
  return clone;
}

/*
 * Afasta o contorno em `offset` mm. Porte do SvgNest.polygonOffset, que no
 * original roda fora do worker (offsetTree) e por isso faltava aqui — era o
 * motivo de `config.spacing` não ter efeito nenhum.
 *
 * Inflar a PEÇA em metade do vão resolve os dois lados de uma vez: duas peças
 * encostadas ficam a `spacing` uma da outra, e a peça real fica a spacing/2 da
 * borda da chapa (porque é o contorno inflado que precisa caber). Por isso, ao
 * contrário do svgnest.js, a chapa aqui não é reduzida.
 */
function inflarPoligono(poly, offset, config) {
  if (!offset) return poly;
  var p = toClipperCoordinates(poly);
  ClipperLib.JS.ScaleUpPath(p, config.clipperScale);

  var co = new ClipperLib.ClipperOffset(2, config.curveTolerance * config.clipperScale);
  co.AddPath(p, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  var saida = new ClipperLib.Paths();
  co.Execute(saida, offset * config.clipperScale);
  if (!saida || saida.length === 0) return poly;

  // o offset pode devolver vários contornos; fica com o maior
  var escolhido = 0;
  var maiorArea = -Infinity;
  for (var i = 0; i < saida.length; i++) {
    var a = Math.abs(ClipperLib.Clipper.Area(saida[i]));
    if (a > maiorArea) {
      maiorArea = a;
      escolhido = i;
    }
  }

  var r = toNestCoordinates(saida[escolhido], config.clipperScale);
  if (GeometryUtil.polygonArea(r) > 0) r.reverse();
  r.id = poly.id;
  r.source = poly.source;
  return r;
}

function minkowskiDifference(A, B) {
  var Ac = toClipperCoordinates(A);
  ClipperLib.JS.ScaleUpPath(Ac, 10000000);
  var Bc = toClipperCoordinates(B);
  ClipperLib.JS.ScaleUpPath(Bc, 10000000);
  for (var i = 0; i < Bc.length; i++) {
    Bc[i].X *= -1;
    Bc[i].Y *= -1;
  }
  var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
  var clipperNfp;
  var largestArea = null;
  for (i = 0; i < solution.length; i++) {
    var n = toNestCoordinates(solution[i], 10000000);
    var sarea = GeometryUtil.polygonArea(n);
    if (largestArea === null || largestArea > sarea) {
      clipperNfp = n;
      largestArea = sarea;
    }
  }
  for (var k = 0; k < clipperNfp.length; k++) {
    clipperNfp[k].x += B[0].x;
    clipperNfp[k].y += B[0].y;
  }
  return [clipperNfp];
}

// Porte fiel do callback p.map() do svgnest.js (geração do no-fit-polygon).
function generateNfp(pair, searchEdges, useHoles) {
  if (!pair || pair.length === 0) return null;

  var A = rotatePolygon(pair.A, pair.key.Arotation);
  var B = rotatePolygon(pair.B, pair.key.Brotation);
  var nfp;
  var i;

  if (pair.key.inside) {
    if (GeometryUtil.isRectangle(A, 0.001)) {
      nfp = GeometryUtil.noFitPolygonRectangle(A, B);
    } else {
      nfp = GeometryUtil.noFitPolygon(A, B, true, searchEdges);
    }
    if (nfp && nfp.length > 0) {
      for (i = 0; i < nfp.length; i++) {
        if (GeometryUtil.polygonArea(nfp[i]) > 0) nfp[i].reverse();
      }
    } else {
      // peça maior que a chapa, ou geometria que o algoritmo não resolve
      return null;
    }
  } else {
    nfp = searchEdges
      ? GeometryUtil.noFitPolygon(A, B, false, searchEdges)
      : minkowskiDifference(A, B);

    if (!nfp || nfp.length === 0) return null;

    for (i = 0; i < nfp.length; i++) {
      if (!searchEdges || i === 0) {
        if (Math.abs(GeometryUtil.polygonArea(nfp[i])) < Math.abs(GeometryUtil.polygonArea(A))) {
          nfp.splice(i, 1);
          return null;
        }
      }
    }
    if (nfp.length === 0) return null;

    for (i = 0; i < nfp.length; i++) {
      if (GeometryUtil.polygonArea(nfp[i]) > 0) nfp[i].reverse();
      if (i > 0 && GeometryUtil.pointInPolygon(nfp[i][0], nfp[0])) {
        if (GeometryUtil.polygonArea(nfp[i]) < 0) nfp[i].reverse();
      }
    }

    if (useHoles && A.childNodes && A.childNodes.length > 0) {
      var Bbounds = GeometryUtil.getPolygonBounds(B);
      for (i = 0; i < A.childNodes.length; i++) {
        var Abounds = GeometryUtil.getPolygonBounds(A.childNodes[i]);
        if (Abounds.width > Bbounds.width && Abounds.height > Bbounds.height) {
          var cnfp = GeometryUtil.noFitPolygon(A.childNodes[i], B, true, searchEdges);
          if (cnfp && cnfp.length > 0) {
            for (var j = 0; j < cnfp.length; j++) {
              if (GeometryUtil.polygonArea(cnfp[j]) < 0) cnfp[j].reverse();
              nfp.push(cnfp[j]);
            }
          }
        }
      }
    }
  }
  return nfp;
}

/*
 * Gira um NFP já pronto. É a peça que falta para a identidade abaixo (`avaliar`):
 * girar um polígono custa uma multiplicação por vértice, contra a soma de
 * Minkowski inteira.
 */
function rotarNfp(nfp, graus) {
  if (!nfp || graus === 0) return nfp;
  var saida = [];
  for (var i = 0; i < nfp.length; i++) saida.push(rotatePolygon(nfp[i], graus));
  return saida;
}

/*
 * Espelha um NFP para obter o do par TROCADO, pela identidade:
 *
 *   NFP(P, Q girado δ) = −girar( NFP(Q, P girado −δ), δ ) + P[0] + girar(Q,δ)[0]
 *
 * Vem de { p − q } = −{ q − p }: trocar quem é fixo e quem desliza reflete o
 * no-fit-polygon pela origem. A reflexão é um giro de 180°, então preserva área
 * com sinal — o sentido do polígono não muda e a decisão de inverter cai do
 * mesmo lado.
 *
 * Devolve `undefined` quando não dá para derivar (fonte vazia), `null` quando o
 * derivado é rejeitado pela mesma regra do generateNfp (NFP menor que a peça
 * fixa — e aqui a peça fixa é OUTRA, por isso o teste é refeito, não herdado).
 */
function espelharNfp(fonte, delta, P, Q) {
  if (!fonte || fonte.length === 0) return undefined;
  var ang = (delta * Math.PI) / 180;
  var cos = Math.cos(ang);
  var sin = Math.sin(ang);
  var cx = P[0].x + (Q[0].x * cos - Q[0].y * sin);
  var cy = P[0].y + (Q[0].x * sin + Q[0].y * cos);
  var saida = [];
  for (var i = 0; i < fonte.length; i++) {
    var poly = fonte[i];
    var novo = [];
    for (var j = 0; j < poly.length; j++) {
      var x = poly[j].x;
      var y = poly[j].y;
      novo.push({ x: cx - (x * cos - y * sin), y: cy - (x * sin + y * cos) });
    }
    if (GeometryUtil.polygonArea(novo) > 0) novo.reverse();
    saida.push(novo);
  }
  if (Math.abs(GeometryUtil.polygonArea(saida[0])) < Math.abs(GeometryUtil.polygonArea(P))) return null;
  return saida;
}

/** Avalia uma ordem/rotação candidata: gera os NFPs necessários e posiciona. */
var diagnostico = { pares: 0, nfpOk: 0, nfpNulo: 0, placeNulo: 0, reaproveitados: 0, derivados: 0, espelhados: 0, calculados: 0, msNfp: 0, exemplos: [] };

/*
 * `nfpCache` é indexado por ID de peça porque é assim que o placementworker
 * (vendorizado, não mexemos) procura. Só que num letreiro as peças se REPETEM:
 * 4 jogos de 5 letras são 20 ids mas 5 formas. Indexado por id, isso vira 190
 * pares de no-fit-polygon em vez de 15 — e o NFP é a parte cara (20 peças
 * passavam de 180s).
 *
 * Então calculamos uma vez por FORMA (`formaCache`, indexado por source) e
 * apontamos todas as chaves de id para o mesmo resultado. É válido porque cada
 * peça foi levada à própria origem na leitura do SVG: duas letras iguais têm
 * coordenadas idênticas, e o NFP depende só disso.
 */
function avaliar(binPolygon, placelist, rotations, config, nfpCache, formaCache, baseCache) {
  var ids = [];
  var i, j, key;
  for (i = 0; i < placelist.length; i++) {
    ids.push(placelist[i].id);
    placelist[i].rotation = rotations[i];
  }

  var pares = [];
  var registrar = function (A, B, chave, chaveForma) {
    var str = JSON.stringify(chave);
    if (nfpCache[str]) return;
    var par = { A: A, B: B, key: chave, str: str, forma: JSON.stringify(chaveForma) };
    /*
     * Para par peça-peça, só o giro RELATIVO entre as duas importa (ver a
     * identidade em `avaliar`). Guardamos a chave da base (giro de A zerado) e
     * o giro de A, que será aplicado ao resultado.
     */
    if (!chave.inside) {
      par.giro = chaveForma.Arotation;
      par.delta = (((chaveForma.Brotation - chaveForma.Arotation) % 360) + 360) % 360;
      par.base = JSON.stringify({ A: chaveForma.A, B: chaveForma.B, delta: par.delta });
      // chave do par TROCADO, de onde o NFP pode ser espelhado em vez de calculado
      par.troca = JSON.stringify({
        A: chaveForma.B,
        B: chaveForma.A,
        delta: (360 - par.delta) % 360,
      });
    }
    pares.push(par);
  };

  for (i = 0; i < placelist.length; i++) {
    var part = placelist[i];
    registrar(
      binPolygon,
      part,
      { A: binPolygon.id, B: part.id, inside: true, Arotation: 0, Brotation: rotations[i] },
      { A: -1, B: part.source, inside: true, Arotation: 0, Brotation: rotations[i] }
    );
    for (j = 0; j < i; j++) {
      var placed = placelist[j];
      registrar(
        placed,
        part,
        {
          A: placed.id,
          B: part.id,
          inside: false,
          Arotation: rotations[j],
          Brotation: rotations[i],
        },
        {
          A: placed.source,
          B: part.source,
          inside: false,
          Arotation: rotations[j],
          Brotation: rotations[i],
        }
      );
    }
  }

  var temCache = function (cache, chave) {
    return Object.prototype.hasOwnProperty.call(cache, chave);
  };

  for (i = 0; i < pares.length; i++) {
    var par = pares[i];
    var nfp;
    if (temCache(formaCache, par.forma)) {
      nfp = formaCache[par.forma];
      diagnostico.reaproveitados++;
    } else if (par.base) {
      /*
       * Identidade que economiza a maior parte do trabalho:
       *
       *   NFP(A girado θ, B girado φ) = girar( NFP(A, B girado φ−θ), θ )
       *
       * Ou seja, só o giro RELATIVO entre as duas peças muda a forma do
       * no-fit-polygon; o giro de A apenas gira o resultado inteiro. Vale
       * porque a soma de Minkowski comuta com rotação, e o deslocamento que a
       * rotina aplica no fim (B[0]) gira junto, então os dois se cancelam.
       *
       * Sem isso, R giros permitidos custam R² pares por par de formas. Com
       * isso custam R, e os outros saem de uma multiplicação por vértice.
       * A área não muda ao girar, então as duas decisões que o generateNfp
       * toma por área — descartar NFP menor que a peça e inverter o sentido —
       * caem do mesmo lado na base e no derivado.
       */
      var base;
      if (temCache(baseCache, par.base)) {
        base = baseCache[par.base];
        diagnostico.derivados++;
      } else {
        // o par trocado serve: espelhar sai muito mais barato que refazer o Minkowski
        base = temCache(baseCache, par.troca)
          ? espelharNfp(baseCache[par.troca], par.delta, par.A, par.B)
          : undefined;
        if (base === undefined) {
          var tb = Date.now();
          base = generateNfp(
            { A: par.A, B: par.B, key: { inside: false, Arotation: 0, Brotation: par.delta } },
            config.exploreConcave,
            config.useHoles
          );
          diagnostico.msNfp += Date.now() - tb;
          diagnostico.calculados++;
        } else {
          diagnostico.espelhados++;
        }
        baseCache[par.base] = base;
      }
      nfp = par.giro ? rotarNfp(base, par.giro) : base;
      formaCache[par.forma] = nfp;
    } else {
      var t0 = Date.now();
      nfp = generateNfp(par, config.exploreConcave, config.useHoles);
      diagnostico.msNfp += Date.now() - t0;
      diagnostico.calculados++;
      formaCache[par.forma] = nfp;
    }
    if (nfp) {
      nfpCache[par.str] = nfp;
      diagnostico.nfpOk++;
    } else {
      diagnostico.nfpNulo++;
      if (diagnostico.exemplos.length < 3) diagnostico.exemplos.push(par.str);
    }
  }
  diagnostico.pares += pares.length;

  var worker = new PlacementWorker(binPolygon, placelist.slice(0), ids, rotations, config, nfpCache);
  // placementworker.js espera a si mesmo em global.env.self (ver shim no topo)
  self.global.env.self = worker;
  var saida = worker.placePaths(placelist.slice(0));
  if (!saida || saida.length === 0) diagnostico.placeNulo++;
  return saida;
}

/*
 * Preparação que o svgnest.js faz FORA do worker e que portanto precisa ser
 * refeita aqui: a chapa precisa de width/height, e chapa e peças precisam todas
 * do mesmo sentido de giro (anti-horário, área <= 0). Sem isso o NFP sai vazio
 * e nada é posicionado.
 */
function prepararBin(bin) {
  var b = bin.slice(0);
  var bounds = GeometryUtil.getPolygonBounds(b);
  for (var i = 0; i < b.length; i++) {
    b[i] = { x: b[i].x - bounds.x, y: b[i].y - bounds.y };
  }
  b.width = bounds.width;
  b.height = bounds.height;
  b.id = typeof bin.id === 'number' ? bin.id : -1;
  if (GeometryUtil.polygonArea(b) > 0) b.reverse();
  return b;
}

function prepararPeca(peca, indice) {
  var p = peca.slice(0);
  // remove ponto final duplicado (polígono fechado explicitamente)
  var ini = p[0];
  var fim = p[p.length - 1];
  if (GeometryUtil.almostEqual(ini.x, fim.x) && GeometryUtil.almostEqual(ini.y, fim.y)) p.pop();
  if (GeometryUtil.polygonArea(p) > 0) p.reverse();
  p.id = typeof peca.id === 'number' ? peca.id : indice;
  p.source = typeof peca.source === 'number' ? peca.source : p.id;
  if (peca.children && peca.children.length) p.children = peca.children;
  return p;
}

/*
 * Converte o resultado cru do placementworker nas medidas que o orçamento usa.
 * Tudo em mm / mm².
 *
 *  - areaPecas      : soma da área real dos contornos (material útil)
 *  - envolvente     : retângulo que envolve tudo que foi encaixado na folha
 *  - comprimentoUsado: quanto da chapa foi consumido no sentido do comprimento
 *  - areaFaixaOcupada: comprimentoUsado × largura cheia da chapa — o que de fato
 *                      se perde, porque o restante da chapa fica cortado
 *
 * IMPORTANTE — orientação: o placementworker do SVGnest comprime no eixo X
 * (`rectbounds.width*2 + rectbounds.height`, peso dobrado na largura). Por isso
 * a chapa precisa ser enviada DEITADA: X = comprimento da chapa (o que queremos
 * economizar), Y = largura útil (fixa). Enviar em pé faz ele empilhar numa
 * coluna estreita e desperdiçar comprimento.
 */
function medir(resultado, bin, parts, partsReais, chapa, desvio) {
  // `chapa` é a chapa REAL; `bin` é o retângulo onde as peças podem ser
  // colocadas, que não é a mesma coisa quando a margem de borda difere de
  // metade do vão (ver `desvio` no onmessage). `desvio` é a distância
  // entre o canto do bin e o canto da chapa, para medir e desenhar na chapa.
  // `parts` são os contornos inflados pelo espaçamento (é o que de fato ocupa a
  // chapa, então é deles que sai a envolvente/faixa); `partsReais` são os
  // contornos do arquivo, usados para área e para desenhar o encaixe.
  var porId = {};
  var porReal = {};
  for (var i = 0; i < parts.length; i++) porId[parts[i].id] = parts[i];
  for (var n = 0; n < partsReais.length; n++) porReal[partsReais[n].id] = partsReais[n];

  var folhas = [];
  var areaPecasTotal = 0;

  for (var f = 0; f < resultado.placements.length; f++) {
    var pos = resultado.placements[f];
    var minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    var areaFolha = 0;
    var pecasDesenhadas = [];

    for (var p = 0; p < pos.length; p++) {
      var inflada = porId[pos[p].id];
      if (!inflada) continue;
      var real = porReal[pos[p].id] || inflada;

      // envolvente/faixa: contorno inflado, que é o espaço realmente bloqueado
      var giradaInflada = rotatePolygon(inflada, pos[p].rotation);
      for (var k = 0; k < giradaInflada.length; k++) {
        var x = giradaInflada[k].x + pos[p].x;
        var y = giradaInflada[k].y + pos[p].y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      // área e desenho: contorno do arquivo (o inflado é maior que a peça)
      var girada = rotatePolygon(real, pos[p].rotation);
      var pontos = [];
      for (var q = 0; q < girada.length; q++) {
        pontos.push({ x: girada[q].x + pos[p].x + desvio, y: girada[q].y + pos[p].y + desvio });
      }
      var furos = [];
      if (girada.children) {
        for (var c = 0; c < girada.children.length; c++) {
          var furo = [];
          for (var d = 0; d < girada.children[c].length; d++) {
            furo.push({
              x: girada.children[c][d].x + pos[p].x + desvio,
              y: girada.children[c][d].y + pos[p].y + desvio,
            });
          }
          furos.push(furo);
        }
      }
      var a = Math.abs(GeometryUtil.polygonArea(girada));
      areaFolha += a;
      areaPecasTotal += a;
      pecasDesenhadas.push({
        id: pos[p].id,
        rotation: pos[p].rotation,
        pontos: pontos,
        furos: furos,
      });
    }

    // X = sentido do comprimento da chapa (ver nota de orientação acima).
    // `maxX` é a borda do contorno INFLADO no sistema do bin; somando os dois
    // desvios chega-se ao ponto de corte na chapa, já com a margem depois da
    // última peça.
    var comprimentoUsado =
      maxX === -Infinity ? 0 : Math.min(chapa.comprimento, Math.max(0, maxX + 2 * desvio));
    folhas.push({
      pecas: pecasDesenhadas,
      envolvente:
        minX === Infinity
          ? null
          : { x: minX, y: minY, largura: maxX - minX, altura: maxY - minY },
      areaPecas: areaFolha,
      comprimentoUsado: comprimentoUsado,
      areaFaixaOcupada: comprimentoUsado * chapa.largura,
      aproveitamento: areaFolha / (chapa.comprimento * chapa.largura),
    });
  }

  return {
    fitness: resultado.fitness,
    // "largura" aqui é o eixo X do desenho, que é o COMPRIMENTO da chapa
    // (ela vai deitada); "altura" é a largura útil.
    chapa: {
      largura: chapa.comprimento,
      altura: chapa.largura,
      area: chapa.comprimento * chapa.largura,
    },
    folhas: folhas,
    totalFolhas: folhas.length,
    totalPecas: resultado.placements.reduce(function (s, a) {
      return s + a.length;
    }, 0),
    areaPecas: areaPecasTotal,
    areaChapasInteiras: folhas.length * chapa.comprimento * chapa.largura,
    areaFaixaOcupada: folhas.reduce(function (s, x) {
      return s + x.areaFaixaOcupada;
    }, 0),
  };
}

/**
 * Em quais dos giros permitidos a peça ainda cabe na chapa.
 *
 * Existe porque o giro de cada peça é SORTEADO a cada tentativa: uma peça que
 * só cabe em pé podia tirar 0° em todas as tentativas, ficar de fora do
 * encaixe e, pior, sumir do preço sem avisar. Sorteando só entre os giros
 * viáveis, toda peça que cabe é colocada.
 */
function rotacoesViaveis(peca, bin, permitidas) {
  var ok = [];
  for (var i = 0; i < permitidas.length; i++) {
    var b = GeometryUtil.getPolygonBounds(rotatePolygon(peca, permitidas[i]));
    if (b.width <= bin.width && b.height <= bin.height) ok.push(permitidas[i]);
  }
  return ok;
}

function embaralhar(arr, rnd) {
  var a = arr.slice(0);
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rnd() * (i + 1));
    var t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

/** PRNG com semente — nesting precisa ser reprodutível: mesmo arquivo, mesmo preço. */
function prngComSemente(semente) {
  var s = semente >>> 0 || 1;
  return function () {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

self.onmessage = function (e) {
  var dados = e.data;
  // Defaults do SVGnest. clipperScale é obrigatório: o placementworker usa
  // self.config.clipperScale para escalar os polígonos antes do Clipper — sem
  // ele vira NaN, nenhuma peça é unida à anterior e cada peça abre uma folha.
  var config = Object.assign(
    {
      clipperScale: 10000000,
      curveTolerance: 0.3,
      spacing: 0,
      margem: 0,
      rotations: [0, 90, 180, 270],
      useHoles: false,
      exploreConcave: false,
      tentativas: 8,
    },
    dados.config || {}
  );
  var bin = prepararBin(dados.bin);
  var partsReais = dados.parts.map(prepararPeca);
  // Os furos vêm numa lista paralela, não pendurados na peça: postMessage usa
  // structured clone, que copia os ÍNDICES de um array mas descarta qualquer
  // propriedade extra colada nele (`peca.children` sumiria no caminho).
  if (dados.sources) {
    for (var si = 0; si < partsReais.length; si++) {
      if (typeof dados.sources[si] === 'number') partsReais[si].source = dados.sources[si];
    }
  }
  if (dados.furos) {
    for (var fi = 0; fi < partsReais.length; fi++) {
      if (dados.furos[fi] && dados.furos[fi].length) partsReais[fi].children = dados.furos[fi];
    }
  }
  // vão entre peças: ver inflarPoligono
  var vao = Number(config.spacing) || 0;
  var margem = Number(config.margem) || 0;
  /*
   * Vão entre peças e margem de borda são regras DIFERENTES e precisam ficar
   * independentes. Inflar a peça em vao/2 resolve só o vão: a peça real acaba
   * ficando exatamente vao/2 da borda da chapa, que só por acaso é a margem
   * desejada quando vao = 2 × margem.
   *
   * Então o retângulo onde as peças podem ser colocadas é a chapa recuada em
   * (margem − vao/2) de cada lado. O recuo pode ser NEGATIVO (bin maior que a
   * chapa): com vão de 20mm e margem de 5mm, o contorno inflado pode passar
   * 5mm da borda, porque a peça real continua 10mm para dentro.
   */
  var desvio = margem - vao / 2;
  var chapaReal = config.chapaReal || { largura: 0, comprimento: 0 };
  // O offset arredonda os cantos em facetas, e a faceta corta para DENTRO:
  // pedindo vao/2 exato, o vão medido saía ~0,3mm curto. Como o vão e a margem
  // são mínimos de produção ("pelo menos 10mm"), soma-se a tolerância da curva
  // para a folga real nunca ficar abaixo do pedido.
  var inflar = vao > 0 ? vao / 2 + config.curveTolerance : 0;
  var parts =
    inflar > 0
      ? partsReais.map(function (p) {
          return inflarPoligono(p, inflar, config);
        })
      : partsReais;
  var tentativas = config.tentativas || 8;
  var rotacoesPermitidas = config.rotations || [0, 90, 180, 270];

  try {
    diagnostico = { pares: 0, nfpOk: 0, nfpNulo: 0, placeNulo: 0, reaproveitados: 0, derivados: 0, espelhados: 0, calculados: 0, msNfp: 0, exemplos: [] };
    var rnd = prngComSemente(config.semente || 20261021);
    var nfpCache = {};
    // indexado por FORMA (source), compartilhado entre as tentativas
    var formaCache = {};
    // indexado por (formaA, formaB, giro RELATIVO) — ver a identidade em avaliar
    var baseCache = {};

    // Ordem inicial: maior área primeiro — heurística clássica, costuma ser a
    // melhor semente para o encaixe.
    var ordenado = parts.slice(0).sort(function (a, b) {
      return Math.abs(GeometryUtil.polygonArea(b)) - Math.abs(GeometryUtil.polygonArea(a));
    });

    var viaveisPorId = {};
    var foraDaChapa = [];
    for (var vi = 0; vi < parts.length; vi++) {
      var lista = rotacoesViaveis(parts[vi], bin, rotacoesPermitidas);
      viaveisPorId[parts[vi].id] = lista;
      if (lista.length === 0) foraDaChapa.push(parts[vi].id);
    }
    if (foraDaChapa.length > 0) {
      // Checa se algum giro fora dos permitidos resolveria, para a mensagem
      // poder dizer o que fazer em vez de só reclamar.
      var salvaria = rotacoesViaveis(parts[0], bin, [0, 90, 180, 270]).length > 0;
      for (var fi = 0; fi < foraDaChapa.length && salvaria; fi++) {
        var alvo = null;
        for (var pi = 0; pi < parts.length; pi++)
          if (parts[pi].id === foraDaChapa[fi]) alvo = parts[pi];
        salvaria = alvo ? rotacoesViaveis(alvo, bin, [0, 90, 180, 270]).length > 0 : false;
      }
      self.postMessage({
        tipo: 'erro',
        mensagem:
          foraDaChapa.length +
          (foraDaChapa.length === 1 ? ' peça não cabe' : ' peças não cabem') +
          ' nesta chapa' +
          (salvaria
            ? ' sem girar. Escolha um giro de 90° em "Giro das peças", ou use uma chapa maior.'
            : ', em nenhum giro. Reduza o tamanho do conjunto ou use uma chapa maior.'),
        pecasFora: foraDaChapa.length,
      });
      return;
    }

    var melhor = null;
    var melhorT = -1;
    /*
     * Fatia de tentativas deste worker. As tentativas são independentes entre
     * si, então N workers podem dividi-las — e o posicionamento é 75–85% do
     * tempo quando há muitas peças.
     *
     * O sorteio NÃO pode mudar por causa disso: o PRNG é consumido em
     * sequência, então a tentativa 7 depende de todos os sorteios anteriores.
     * Por isso cada worker percorre TODAS as tentativas e sorteia todas (custa
     * um embaralhamento, microssegundos), mas só avalia as suas. A sequência
     * sorteada é a mesma de antes e o resultado é bit a bit o mesmo — só que
     * repartido.
     */
    var fatia = config.fatia && config.fatia.total > 1 ? config.fatia : null;
    var minhas = 0;
    for (var ct = 0; ct < tentativas; ct++)
      if (!fatia || ct % fatia.total === fatia.indice) minhas++;
    var feitas = 0;

    for (var t = 0; t < tentativas; t++) {
      var candidato = t === 0 ? ordenado : embaralhar(ordenado, rnd);
      var rotations = [];
      for (var i = 0; i < candidato.length; i++) {
        var viaveis = viaveisPorId[candidato[i].id];
        rotations.push(t === 0 ? viaveis[0] : viaveis[Math.floor(rnd() * viaveis.length)]);
      }
      if (fatia && t % fatia.total !== fatia.indice) continue;

      // Atenção: placePaths devolve UM objeto {placements, fitness, area}.
      // No svgnest.js ele é chamado via Parallel.map(), que embrulha num array —
      // daí o `placements[0]` de lá. Chamando direto, o objeto já é o resultado.
      var r = avaliar(bin, candidato, rotations, config, nfpCache, formaCache, baseCache);
      if (r && typeof r.fitness === 'number') {
        /*
         * Escolhe a tentativa pelo que é COBRADO, não pelo `fitness` do
         * SVGnest. O fitness dele é nº de chapas + largura do ÚLTIMO bin
         * dividida pela área — não é a faixa ocupada somada, que é o nosso
         * preço. Escolhendo por fitness, uma tentativa de placar melhor podia
         * ter faixa pior, e foi por isso que liberar mais ângulos chegava a
         * SUBIR o preço: a tentativa boa existia e era descartada.
         *
         * Medir por tentativa é barato (percorre as peças colocadas) perto do
         * no-fit-polygon, que é ~98% do tempo.
         */
        var m = medir(r, bin, parts, partsReais, chapaReal, desvio);
        m.pecasFora = parts.length - m.totalPecas;
        if (
          !melhor ||
          m.pecasFora < melhor.pecasFora ||
          (m.pecasFora === melhor.pecasFora && m.areaFaixaOcupada < melhor.areaFaixaOcupada)
        ) {
          melhor = m;
          melhorT = t;
        }
      }
      feitas++;
      self.postMessage({ tipo: 'progresso', valor: minhas ? feitas / minhas : 1 });
    }

    /*
     * Fatia sem resultado não é erro: outra fatia pode ter conseguido. Quem
     * decide é quem junta (o hook), quando TODAS vierem vazias.
     */
    // `melhor` já vem medido (ver escolha por área acima). `pecasFora` é a
    // rede de segurança: peça que entrou e não saiu colocada não pode virar
    // preço — orçar só as que couberam cobraria menos do que o serviço custa.
    // `tentativa` serve para o desempate na junção das fatias: empate em área
    // fica com a tentativa de índice menor, como ficaria rodando em série.
    self.postMessage({
      tipo: 'resultado',
      resultado: melhor,
      tentativa: melhorT,
      diagnostico: diagnostico,
    });
  } catch (err) {
    self.postMessage({ tipo: 'erro', mensagem: (err && err.message) || String(err) });
  }
};
