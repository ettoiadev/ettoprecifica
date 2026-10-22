/*
 * Estado da precificação por arquivo: leitura do vetor, escala, chapa e
 * encaixe. Mora num hook porque a tela é dividida em duas colunas — os
 * controles ficam na esquerda e a visualização na direita — e as duas precisam
 * dos mesmos dados.
 */
import { useCallback, useMemo, useState } from 'react';
import { lerArquivoVetorial } from '../lib/nesting/lerArquivo';
import { escalarPecas, type LeituraVetorial } from '../lib/nesting/geometria';
import { useNesting } from './useNesting';

/**
 * Regras de produção, não preferências: o corte precisa de vão entre as letras
 * e de uma borda de respeito na chapa. Abaixo disso a peça não sai da máquina,
 * então o cálculo usa esses mínimos mesmo que o vendedor digite menos.
 */
export const VAO_MINIMO_MM = 10;
export const MARGEM_MINIMA_MM = 5;

/**
 * Em que ângulos as peças podem girar para encaixar.
 *
 * É o controle de velocidade do encaixe, não um detalhe estético: cada
 * combinação (giro da peça A, giro da peça B) exige um no-fit-polygon novo, e
 * o NFP é ~98% do tempo. Num letreiro de 36 letras, medido: sem giro 5s,
 * 0°/180° 14s, 4 ângulos 37s — com a MESMA área de chapa, porque letra baixa
 * numa chapa larga não ganha nada girando. Girar rende quando a peça é grande
 * perto da chapa; aí vale esperar.
 */
export type Giro = 'sem' | 'meia' | 'quarto' | 'oitavo';

export const GIRO_LABEL: Record<Giro, string> = {
  sem: 'Sem giro — mais rápido',
  meia: '180° — meia volta',
  quarto: '90° — 4 ângulos',
  oitavo: '45° — 8 ângulos, mais lento',
};

const GIRO_ANGULOS: Record<Giro, number[]> = {
  sem: [0],
  meia: [0, 180],
  quarto: [0, 90, 180, 270],
  oitavo: [0, 45, 90, 135, 180, 225, 270, 315],
};

/**
 * O giro é SEMPRE o que o vendedor escolheu — não existe modo automático.
 * Existiu, e era ruim: a regra "até 12 peças usa 4 ângulos, acima usa 0°/180°"
 * fazia o PREÇO mudar ao acrescentar uma letra no letreiro, por um motivo
 * invisível que não dá para explicar ao cliente.
 */
export const GIRO_PADRAO: Giro = 'meia';

/**
 * Quantas ordens/giros diferentes testar antes de escolher o melhor encaixe.
 *
 * 20 não é chute: é onde o cache de no-fit-polygon satura. Abaixo disso o giro
 * é desperdiçado — com 6 tentativas, 2 giros davam 0,822 m² e ficavam PIORES
 * que não girar (0,769); com 20, dão 0,673 m². No mesmo letreiro de 5 letras,
 * R$431 contra R$353. Acima de 20 não melhorou mais (60 deu o mesmo).
 */
const TENTATIVAS = 20;

export interface AreaOcupada {
  /** o que entra no preço: a faixa de chapa que o corte consome */
  areaM2: number;
  /** só o contorno das letras, para mostrar o aproveitamento */
  areaContornoM2: number;
  areaChapasM2: number;
  totalFolhas: number;
  totalPecas: number;
  aproveitamento: number;
}

export function useEncaixeSvg() {
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [leitura, setLeitura] = useState<LeituraVetorial | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  const [alturaRealCm, setAlturaRealCm] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [chapaLargura, setChapaLargura] = useState('1220');
  const [chapaComprimento, setChapaComprimento] = useState('2440');
  const [espacamento, setEspacamento] = useState(String(VAO_MINIMO_MM));
  const [margem, setMargem] = useState(String(MARGEM_MINIMA_MM));
  const [giro, setGiro] = useState<Giro>(GIRO_PADRAO);

  const nesting = useNesting();
  const { rodar, limpar, resultado } = nesting;

  const alturaRealNum = parseFloat(alturaRealCm) || 0;
  const quantidadeNum = Math.max(1, parseInt(quantidade, 10) || 1);
  const chapaLarguraNum = parseFloat(chapaLargura) || 0;
  const chapaComprimentoNum = parseFloat(chapaComprimento) || 0;
  // digitado pelo vendedor, só para avisar que está abaixo do mínimo
  const espacamentoDigitado = parseFloat(espacamento);
  const margemDigitada = parseFloat(margem);
  const espacamentoNum = Math.max(VAO_MINIMO_MM, espacamentoDigitado || 0);
  const margemNum = Math.max(MARGEM_MINIMA_MM, margemDigitada || 0);
  const abaixoDoMinimo =
    (Number.isFinite(espacamentoDigitado) && espacamentoDigitado < VAO_MINIMO_MM) ||
    (Number.isFinite(margemDigitada) && margemDigitada < MARGEM_MINIMA_MM);

  // O usuário informa a altura real do conjunto porque a medida gravada no
  // arquivo é pouco confiável (o Illustrator grava px querendo dizer pt).
  const fator =
    leitura && leitura.altura > 0 && alturaRealNum > 0 ? (alturaRealNum * 10) / leitura.altura : 1;

  const pecas = useMemo(
    () => (leitura ? escalarPecas(leitura.pecas, fator) : []),
    [leitura, fator]
  );

  const totalPecas = pecas.length * quantidadeNum;
  // Quantas formas DISTINTAS existem. É o número que explica a demora: o
  // encaixe custa por forma, não por peça.
  const totalFormas = useMemo(() => new Set(pecas.map((p) => p.forma)).size, [pecas]);

  const conjunto = useMemo(
    () => ({
      largura: (leitura?.largura ?? 0) * fator,
      altura: (leitura?.altura ?? 0) * fator,
    }),
    [leitura, fator]
  );

  const maiorPeca = useMemo(() => {
    let largura = 0;
    let altura = 0;
    for (const p of pecas) {
      if (p.largura > largura) largura = p.largura;
      if (p.altura > altura) altura = p.altura;
    }
    return { largura, altura };
  }, [pecas]);

  // A peça precisa caber na chapa em pelo menos uma das duas orientações.
  const pecaNaoCabe =
    chapaLarguraNum > 0 &&
    chapaComprimentoNum > 0 &&
    maiorPeca.largura > 0 &&
    !(
      (maiorPeca.largura <= chapaComprimentoNum && maiorPeca.altura <= chapaLarguraNum) ||
      (maiorPeca.altura <= chapaComprimentoNum && maiorPeca.largura <= chapaLarguraNum)
    );

  const trocarArquivo = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      limpar();
      setErroLeitura(null);
      setNomeArquivo(file.name);
      try {
        const lido = await lerArquivoVetorial(file);
        setLeitura(lido);
        setAlturaRealCm((lido.altura / 10).toFixed(1));
      } catch (e) {
        setLeitura(null);
        setErroLeitura(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
      }
    },
    [limpar]
  );

  const organizar = useCallback(() => {
    if (pecas.length === 0 || chapaLarguraNum <= 0 || chapaComprimentoNum <= 0) return;
    const todas = [];
    for (let j = 0; j < quantidadeNum; j++) todas.push(...pecas);
    rodar(
      todas,
      { largura: chapaLarguraNum, comprimento: chapaComprimentoNum },
      {
        espacamento: espacamentoNum,
        margem: margemNum,
        rotacoes: GIRO_ANGULOS[giro],
        tentativas: TENTATIVAS,
      }
    );
  }, [
    giro,
    pecas,
    quantidadeNum,
    chapaLarguraNum,
    chapaComprimentoNum,
    espacamentoNum,
    margemNum,
    rodar,
  ]);

  /*
   * O preço sai SEMPRE da faixa ocupada — a área de chapa que o corte consome.
   * Não é escolha do vendedor: cobrar o contorno das letras jogaria o retalho
   * por nossa conta, e cobrar a chapa inteira cobraria material que volta para
   * o estoque. As outras duas áreas ficam à vista só como informação.
   */
  const areaOcupada: AreaOcupada | null = useMemo(() => {
    // Peça que ficou de fora derruba o orçamento inteiro: cobrar só as que
    // couberam sairia MUITO abaixo do custo real (num teste, 0,257 m² em vez
    // de 1,843 m²). Sem preço até o encaixe fechar.
    if (!resultado || resultado.pecasFora > 0) return null;
    return {
      areaM2: resultado.areaFaixaOcupada / 1e6,
      areaContornoM2: resultado.areaPecas / 1e6,
      areaChapasM2: resultado.areaChapasInteiras / 1e6,
      totalFolhas: resultado.totalFolhas,
      totalPecas: resultado.totalPecas,
      aproveitamento: resultado.areaPecas / Math.max(resultado.areaFaixaOcupada, 1),
    };
  }, [resultado]);

  return {
    // arquivo
    nomeArquivo,
    leitura,
    erroLeitura,
    trocarArquivo,
    // escala e quantidade
    alturaRealCm,
    setAlturaRealCm,
    quantidade,
    setQuantidade,
    conjunto,
    pecas,
    totalPecas,
    totalFormas,
    maiorPeca,
    // chapa
    chapaLargura,
    setChapaLargura,
    chapaComprimento,
    setChapaComprimento,
    espacamento,
    setEspacamento,
    margem,
    setMargem,
    giro,
    setGiro,
    angulos: GIRO_ANGULOS[giro],
    abaixoDoMinimo,
    chapaLarguraNum,
    chapaComprimentoNum,
    pecaNaoCabe,
    // encaixe
    organizar,
    estado: nesting.estado,
    progresso: nesting.progresso,
    resultado,
    erro: nesting.erro,
    duracaoMs: nesting.duracaoMs,
    // preço
    areaOcupada,
    pecasFora: resultado?.pecasFora ?? 0,
  };
}

export type EncaixeSvg = ReturnType<typeof useEncaixeSvg>;
