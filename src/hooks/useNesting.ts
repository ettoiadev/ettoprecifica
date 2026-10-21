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
  const workerRef = useRef<Worker | null>(null);

  const encerrar = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  useEffect(() => encerrar, [encerrar]);

  const limpar = useCallback(() => {
    encerrar();
    setEstado('ocioso');
    setProgresso(0);
    setResultado(null);
    setErro(null);
  }, [encerrar]);

  const rodar = useCallback(
    (pecas: PecaVetorial[], chapa: ChapaMm, opcoes: OpcoesEncaixe = {}) => {
      encerrar();
      setEstado('rodando');
      setProgresso(0);
      setResultado(null);
      setErro(null);

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

      const w = new Worker('/nesting/nest-worker.js');
      workerRef.current = w;

      w.onmessage = (e: MessageEvent) => {
        const d = e.data;
        if (d?.tipo === 'progresso') {
          setProgresso(d.valor);
        } else if (d?.tipo === 'resultado') {
          setResultado(d.resultado as ResultadoEncaixe);
          setEstado('pronto');
          encerrar();
        } else if (d?.tipo === 'erro') {
          setErro(d.mensagem || 'Falha no encaixe.');
          setEstado('erro');
          encerrar();
        }
      };
      w.onerror = (ev) => {
        setErro(ev.message || 'Falha ao carregar o encaixe.');
        setEstado('erro');
        encerrar();
      };

      w.postMessage({
        bin,
        parts: pecas.map((p) => p.contorno),
        furos: pecas.map((p) => p.furos),
        // qual FORMA cada peça é: num letreiro de 4 jogos, as 20 peças são 5
        // formas repetidas, e o worker calcula o no-fit-polygon uma vez por
        // forma em vez de uma por peça (ver avaliar() no worker).
        sources: pecas.map((p) => p.id),
        config: {
          spacing: espacamento,
          margem,
          chapaReal: { largura: chapa.largura, comprimento: chapa.comprimento },
          tentativas: opcoes.tentativas ?? 6,
          rotations: opcoes.rotacoes ?? [0, 180],
          curveTolerance: 0.3,
          exploreConcave: false,
          useHoles: false,
        },
      });
    },
    [encerrar]
  );

  return { rodar, limpar, estado, progresso, resultado, erro };
}
