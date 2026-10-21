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

/** Avalia uma ordem/rotação candidata: gera os NFPs necessários e posiciona. */
var diagnostico = { pares: 0, nfpOk: 0, nfpNulo: 0, placeNulo: 0, exemplos: [] };

function avaliar(binPolygon, placelist, rotations, config, nfpCache) {
  var ids = [];
  var i, j, key;
  for (i = 0; i < placelist.length; i++) {
    ids.push(placelist[i].id);
    placelist[i].rotation = rotations[i];
  }

  var pares = [];
  for (i = 0; i < placelist.length; i++) {
    var part = placelist[i];
    key = { A: binPolygon.id, B: part.id, inside: true, Arotation: 0, Brotation: rotations[i] };
    if (!nfpCache[JSON.stringify(key)]) pares.push({ A: binPolygon, B: part, key: key });
    for (j = 0; j < i; j++) {
      var placed = placelist[j];
      key = {
        A: placed.id,
        B: part.id,
        inside: false,
        Arotation: rotations[j],
        Brotation: rotations[i],
      };
      if (!nfpCache[JSON.stringify(key)]) pares.push({ A: placed, B: part, key: key });
    }
  }

  for (i = 0; i < pares.length; i++) {
    var nfp = generateNfp(pares[i], config.exploreConcave, config.useHoles);
    if (nfp) {
      nfpCache[JSON.stringify(pares[i].key)] = nfp;
      diagnostico.nfpOk++;
    } else {
      diagnostico.nfpNulo++;
      if (diagnostico.exemplos.length < 3)
        diagnostico.exemplos.push(JSON.stringify(pares[i].key));
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
function medir(resultado, bin, parts) {
  var porId = {};
  for (var i = 0; i < parts.length; i++) porId[parts[i].id] = parts[i];

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
      var orig = porId[pos[p].id];
      if (!orig) continue;
      var girada = rotatePolygon(orig, pos[p].rotation);
      var pontos = [];
      for (var k = 0; k < girada.length; k++) {
        var x = girada[k].x + pos[p].x;
        var y = girada[k].y + pos[p].y;
        pontos.push({ x: x, y: y });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      var a = Math.abs(GeometryUtil.polygonArea(girada));
      areaFolha += a;
      areaPecasTotal += a;
      pecasDesenhadas.push({ id: pos[p].id, rotation: pos[p].rotation, pontos: pontos });
    }

    // X = sentido do comprimento da chapa (ver nota de orientação acima)
    var comprimentoUsado = maxX === -Infinity ? 0 : maxX;
    folhas.push({
      pecas: pecasDesenhadas,
      envolvente:
        minX === Infinity
          ? null
          : { x: minX, y: minY, largura: maxX - minX, altura: maxY - minY },
      areaPecas: areaFolha,
      comprimentoUsado: comprimentoUsado,
      areaFaixaOcupada: comprimentoUsado * bin.height,
      aproveitamento: areaFolha / (bin.width * bin.height),
    });
  }

  return {
    fitness: resultado.fitness,
    chapa: { largura: bin.width, altura: bin.height, area: bin.width * bin.height },
    folhas: folhas,
    totalFolhas: folhas.length,
    totalPecas: resultado.placements.reduce(function (s, a) {
      return s + a.length;
    }, 0),
    areaPecas: areaPecasTotal,
    areaChapasInteiras: folhas.length * bin.width * bin.height,
    areaFaixaOcupada: folhas.reduce(function (s, x) {
      return s + x.areaFaixaOcupada;
    }, 0),
  };
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
      rotations: [0, 90, 180, 270],
      useHoles: false,
      exploreConcave: false,
      tentativas: 8,
    },
    dados.config || {}
  );
  var bin = prepararBin(dados.bin);
  var parts = dados.parts.map(prepararPeca);
  var tentativas = config.tentativas || 8;
  var rotacoesPermitidas = config.rotations || [0, 90, 180, 270];

  try {
    diagnostico = { pares: 0, nfpOk: 0, nfpNulo: 0, placeNulo: 0, exemplos: [] };
    var rnd = prngComSemente(config.semente || 20261021);
    var nfpCache = {};

    // Ordem inicial: maior área primeiro — heurística clássica, costuma ser a
    // melhor semente para o encaixe.
    var ordenado = parts.slice(0).sort(function (a, b) {
      return Math.abs(GeometryUtil.polygonArea(b)) - Math.abs(GeometryUtil.polygonArea(a));
    });

    var melhor = null;
    for (var t = 0; t < tentativas; t++) {
      var candidato = t === 0 ? ordenado : embaralhar(ordenado, rnd);
      var rotations = [];
      for (var i = 0; i < candidato.length; i++) {
        rotations.push(
          t === 0 ? 0 : rotacoesPermitidas[Math.floor(rnd() * rotacoesPermitidas.length)]
        );
      }

      // Atenção: placePaths devolve UM objeto {placements, fitness, area}.
      // No svgnest.js ele é chamado via Parallel.map(), que embrulha num array —
      // daí o `placements[0]` de lá. Chamando direto, o objeto já é o resultado.
      var r = avaliar(bin, candidato, rotations, config, nfpCache);
      if (r && typeof r.fitness === 'number') {
        if (!melhor || r.fitness < melhor.fitness) melhor = r;
      }
      self.postMessage({ tipo: 'progresso', valor: (t + 1) / tentativas });
    }

    if (!melhor) {
      self.postMessage({
        tipo: 'erro',
        mensagem: 'Nenhuma peça coube na chapa.',
        diagnostico: diagnostico,
      });
      return;
    }

    self.postMessage({ tipo: 'resultado', resultado: medir(melhor, bin, parts) });
  } catch (err) {
    self.postMessage({ tipo: 'erro', mensagem: (err && err.message) || String(err) });
  }
};
