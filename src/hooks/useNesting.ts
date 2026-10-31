/*
 * Roda o encaixe (nesting) num Web Worker — ver `public/nesting/nest-worker.js`.
 * O worker é clássico (importScripts), servido de /public, então não passa pelo
 * bundler: o caminho é sempre '/nesting/nest-worker.js'.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PecaVetorial, Ponto } from '../lib/nesting/geometria';

export interface PecaEncaixada {
  id: number;
  rotation: number;
  pontos: Ponto[];
  furos: Ponto[][];
}

export interface FolhaEncaixe {
  pecas: PecaEncaixada[];
  envolvente: { x: number; y: number; largura: number; altura: number } | null;
  /** área real dos contornos nesta folha, em mm² */
  areaPecas: number;
  /** quanto da chapa foi consumido no sentido do comprimento, em mm */
  comprimentoUsado: number;
  /** comprimentoUsado × largura cheia da chapa, em mm² */
  areaFaixaOcupada: number;
  aproveitamento: number;
}

export interface ResultadoEncaixe {
  fitness: number;
  /** largura = comprimento da chapa (eixo X), altura = largura útil (eixo Y) */
  chapa: { largura: number; altura: number; area: number };
  folhas: FolhaEncaixe[];
  totalFolhas: number;
  totalPecas: number;
  areaPecas: number;
  areaChapasInteiras: number;
  areaFaixaOcupada: number;
  /** peças que entraram e não saíram colocadas — se > 0, não dá para orçar */
  pecasFora: number;
}

export interface ChapaMm {
  /** largura útil da chapa (ex.: 1220) */
  largura: number;
  /** comprimento útil da chapa (ex.: 2440) */
  comprimento: number;
}

export interface OpcoesEncaixe {
  /** vão entre peças, em mm */
  espacamento?: number;
  /** distância mínima entre a peça e a borda da chapa, em mm */
  margem?: number;
  tentativas?: number;
  /**
   * Giros permitidos. O padrão é só 0° e 180° porque cada combinação de giro
   * entre duas formas exige um no-fit-polygon novo (a parte cara): liberar os
   * quatro ângulos quadruplica o trabalho e, em letra, ganha pouco de encaixe.
   */
  rotacoes?: number[];
}

type Estado = 'ocioso' | 'rodando' | 'pronto' | 'erro';

export function useNesting() {
  const [estado, setEstado] = useState<Estado>('ocioso');
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoEncaixe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // quanto demorou: é o que deixa o vendedor entender o custo de cada ângulo
  const [duracaoMs, setDuracaoMs] = useState<number | null>(null);
  const workersRef = useRef<Worker[]>([]);

  const encerrar = useCallback(() => {
    for (const w of workersRef.current) w.terminate();
    workersRef.current = [];
  }, []);

  useEffect(() => encerrar, [encerrar]);

  const limpar = useCallback(() => {
    encerrar();
    setEstado('ocioso');
    setProgresso(0);
    setResultado(null);
    setErro(null);
    setDuracaoMs(null);
  }, [encerrar]);

  const rodar = useCallback(
    (pecas: PecaVetorial[], chapa: ChapaMm, opcoes: OpcoesEncaixe = {}) => {
      encerrar();
      setEstado('rodando');
      setProgresso(0);
      setResultado(null);
      setErro(null);
      setDuracaoMs(null);
      const inicio = performance.now();

      const espacamento = opcoes.espacamento ?? 0;
      const margem = opcoes.margem ?? 0;
      // O worker garante o vão inflando cada peça em metade dele, o que de
      // quebra afasta a peça real em espacamento/2 da borda. Para a margem de
      // borda ser independente do vão, o retângulo de colocação é a chapa
      // recuada na diferença — que pode ser negativa (ver `desvio` no worker).
      const desvio = margem - espacamento / 2;
      const comprimentoUtil = chapa.comprimento - 2 * desvio;
      const larguraUtil = chapa.largura - 2 * desvio;

      // A chapa vai DEITADA: X = comprimento (o que queremos economizar), Y =
      // largura útil. O placementworker do SVGnest comprime no eixo X, então
      // mandar em pé faz ele empilhar numa coluna e desperdiçar comprimento.
      const bin: Ponto[] = [
        { x: 0, y: 0 },
        { x: comprimentoUtil, y: 0 },
        { x: comprimentoUtil, y: larguraUtil },
        { x: 0, y: larguraUtil },
      ];

      const tentativas = opcoes.tentativas ?? 6;
      /*
       * As tentativas são independentes, então são repartidas entre vários
       * workers — com muitas peças o posicionamento chega a 85% do tempo. Cada
       * worker refaz os mesmos sorteios e avalia só a fatia dele, então o
       * resultado é o mesmo de rodar em série (ver `fatia` no worker).
       *
       * Deixa um núcleo livre para a interface não travar, e não passa de 4:
       * cada worker recalcula os no-fit-polygons da fatia dele, então worker
       * demais só duplica trabalho.
       */
      const nucleos = navigator.hardwareConcurrency || 4;
      /*
       * Deixa um núcleo livre para a interface não travar, e não passa de 8.
       * O teto era 4 quando dividir duplicava o no-fit-polygon; com as duas
       * fases o ganho continua subindo (frase de 36 peças em 13 formas, numa
       * máquina de 16 núcleos: 4 workers 20,6s · 6 workers 14,7s · 8 workers
       * 12,8s · 10 workers 10,9s). Parou em 8 porque daí para cima o retorno
       * cai e não vale somar worker num tablet de balcão — o `núcleos − 1` já
       * cuida das máquinas pequenas.
       *
       * Houve um limiar de 26 peças aqui: enquanto cada worker recalculava os
       * mesmos no-fit-polygons, dividir deixava letreiro pequeno MAIS lento.
       * Com as duas fases (abaixo) o NFP é calculado uma vez no total, então
       * dividir passou a ganhar em tudo — 5 peças inclusive, 2,3×. O limiar
       * saiu.
       *
       * Isto muda só o TEMPO, nunca o resultado: `.playwright/teste-paralelo.mjs`
       * mostra área igual até a sexta casa e o mesmo desenho peça a peça com 1,
       * 3 e 4 workers.
       */
      const quantos = Math.max(1, Math.min(8, nucleos - 1, tentativas));

      const parciais: { resultado: ResultadoEncaixe | null; tentativa: number }[] = [];
      const progressos = new Array(quantos).fill(0);
      let encerrado = false;
      /*
       * Com vários workers o encaixe roda em DUAS fases. Sem isso cada worker
       * recalculava os mesmos no-fit-polygons, que é o grosso do tempo quando o
       * letreiro tem muitas letras diferentes — numa frase de 36 peças em 13
       * formas, 74% do tempo. Repartir só as tentativas não ajudava nada ali.
       *
       *   fase 1 'bases' — cada worker calcula a fatia dele das bases de NFP
       *   fase 2         — todas as bases voltam para todos, e aí as
       *                    tentativas são repartidas como antes
       *
       * Com um worker só não há o que compartilhar: vai direto para a fase 2.
       */
      const duasFases = quantos > 1;
      let fase: 'bases' | 'encaixe' = duasFases ? 'bases' : 'encaixe';
      const bases: Record<string, unknown> = {};
      let basesRecebidas = 0;

      const falhar = (mensagem: string) => {
        if (encerrado) return;
        encerrado = true;
        setErro(mensagem);
        setEstado('erro');
        encerrar();
      };

      const juntar = () => {
        if (encerrado || parciais.length < quantos) return;
        encerrado = true;
        // melhor fatia pelo MESMO critério de dentro do worker; empate fica com
        // a tentativa de índice menor, como ficaria em série.
        let melhor: { resultado: ResultadoEncaixe | null; tentativa: number } | null = null;
        for (const p of parciais) {
          if (!p.resultado) continue;
          if (
            !melhor ||
            !melhor.resultado ||
            p.resultado.pecasFora < melhor.resultado.pecasFora ||
            (p.resultado.pecasFora === melhor.resultado.pecasFora &&
              (p.resultado.areaFaixaOcupada < melhor.resultado.areaFaixaOcupada ||
                (p.resultado.areaFaixaOcupada === melhor.resultado.areaFaixaOcupada &&
                  p.tentativa < melhor.tentativa)))
          ) {
            melhor = p;
          }
        }
        if (!melhor || !melhor.resultado) {
          setErro('Nenhuma peça coube na chapa.');
          setEstado('erro');
          encerrar();
          return;
        }
        setDuracaoMs(performance.now() - inicio);
        setResultado(melhor.resultado);
        setEstado('pronto');
        encerrar();
      };

      const payload = {
        bin,
        parts: pecas.map((p) => p.contorno),
        furos: pecas.map((p) => p.furos),
        // qual FORMA cada peça é: num letreiro as letras se repetem, e o
        // worker calcula o no-fit-polygon uma vez por forma em vez de uma por
        // peça (ver avaliar() no worker e agruparFormas() na leitura).
        sources: pecas.map((p) => p.forma),
        config: {
          spacing: espacamento,
          margem,
          chapaReal: { largura: chapa.largura, comprimento: chapa.comprimento },
          tentativas,
          rotations: opcoes.rotacoes ?? [0, 180],
          curveTolerance: 0.3,
          exploreConcave: false,
          useHoles: false,
        },
      };

      const comecarEncaixe = () => {
        fase = 'encaixe';
        progressos.fill(0);
        workersRef.current.forEach((w, k) =>
          w.postMessage({
            ...payload,
            bases,
            config: { ...payload.config, fatia: { indice: k, total: quantos } },
          })
        );
      };

      for (let k = 0; k < quantos; k++) {
        const w = new Worker('/nesting/nest-worker.js');
        workersRef.current.push(w);
        w.onmessage = (e: MessageEvent) => {
          const d = e.data;
          if (d?.tipo === 'progresso') {
            progressos[k] = d.valor;
            const media = progressos.reduce((a, b) => a + b, 0) / quantos;
            // a fase 1 ocupa a primeira metade da barra, a 2 a segunda
            setProgresso(duasFases ? (fase === 'bases' ? media / 2 : 0.5 + media / 2) : media);
          } else if (d?.tipo === 'bases') {
            for (const [chave, nfp] of d.entradas as [string, unknown][]) bases[chave] = nfp;
            basesRecebidas++;
            if (basesRecebidas === quantos && !encerrado) comecarEncaixe();
          } else if (d?.tipo === 'resultado') {
            parciais.push({ resultado: d.resultado ?? null, tentativa: d.tentativa ?? -1 });
            juntar();
          } else if (d?.tipo === 'erro') {
            // erro do worker é condição global (peça que não cabe na chapa):
            // todas as fatias chegariam na mesma, então para tudo na primeira.
            falhar(d.mensagem || 'Falha no encaixe.');
          }
        };
        w.onerror = (ev) => falhar(ev.message || 'Falha ao carregar o encaixe.');
        w.postMessage({
          ...payload,
          config: {
            ...payload.config,
            fatia: { indice: k, total: quantos },
            ...(duasFases ? { fase: 'bases' } : {}),
          },
        });
      }
    },
    [encerrar]
  );

  return { rodar, limpar, estado, progresso, resultado, erro, duracaoMs };
}
