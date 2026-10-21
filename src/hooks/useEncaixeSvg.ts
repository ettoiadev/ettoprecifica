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

export type BaseCobranca = 'faixa' | 'contorno' | 'chapa';

export const BASE_LABEL: Record<BaseCobranca, string> = {
  contorno: 'Contorno real',
  faixa: 'Faixa ocupada',
  chapa: 'Chapa inteira',
};

export const BASE_AJUDA: Record<BaseCobranca, string> = {
  contorno: 'Só o material que vira letra. Joga a sobra toda por nossa conta.',
  faixa: 'O pedaço da chapa que o corte consome. É o que de fato se perde.',
  chapa: 'A chapa inteira, mesmo a parte não usada. Para quando a sobra não serve.',
};

export interface AreaEscolhida {
  areaM2: number;
  base: BaseCobranca;
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
  const [espacamento, setEspacamento] = useState('5');
  const [base, setBase] = useState<BaseCobranca>('faixa');

  const nesting = useNesting();
  const { rodar, limpar, resultado } = nesting;

  const alturaRealNum = parseFloat(alturaRealCm) || 0;
  const quantidadeNum = Math.max(1, parseInt(quantidade, 10) || 1);
  const chapaLarguraNum = parseFloat(chapaLargura) || 0;
  const chapaComprimentoNum = parseFloat(chapaComprimento) || 0;
  const espacamentoNum = Math.max(0, parseFloat(espacamento) || 0);

  // O usuário informa a altura real do conjunto porque a medida gravada no
  // arquivo é pouco confiável (o Illustrator grava px querendo dizer pt).
  const fator =
    leitura && leitura.altura > 0 && alturaRealNum > 0 ? (alturaRealNum * 10) / leitura.altura : 1;

  const pecas = useMemo(
    () => (leitura ? escalarPecas(leitura.pecas, fator) : []),
    [leitura, fator]
  );

  const totalPecas = pecas.length * quantidadeNum;

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
    // Com poucas peças, liberar os 4 giros melhora bastante o encaixe e custa
    // quase nada (medido: 5 peças, 3s, faixa 0,695 m² contra 0,808 m² só com
    // 0°/180°). Com muitas peças a chapa enche de qualquer jeito e os 4 giros
    // só triplicam a espera (20 peças: 19s contra 6,6s), sem ganho de área.
    const muitasPecas = todas.length > 12;
    rodar(
      todas,
      { largura: chapaLarguraNum, comprimento: chapaComprimentoNum },
      {
        espacamento: espacamentoNum,
        rotacoes: muitasPecas ? [0, 180] : [0, 90, 180, 270],
        tentativas: muitasPecas ? 4 : 6,
      }
    );
  }, [pecas, quantidadeNum, chapaLarguraNum, chapaComprimentoNum, espacamentoNum, rodar]);

  const areas = useMemo(() => {
    if (!resultado) return null;
    return {
      contorno: resultado.areaPecas / 1e6,
      faixa: resultado.areaFaixaOcupada / 1e6,
      chapa: resultado.areaChapasInteiras / 1e6,
    };
  }, [resultado]);

  const areaEscolhida: AreaEscolhida | null = useMemo(() => {
    if (!resultado || !areas) return null;
    return {
      areaM2: areas[base],
      base,
      totalFolhas: resultado.totalFolhas,
      totalPecas: resultado.totalPecas,
      aproveitamento: resultado.areaPecas / Math.max(resultado.areaFaixaOcupada, 1),
    };
  }, [resultado, areas, base]);

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
    maiorPeca,
    // chapa
    chapaLargura,
    setChapaLargura,
    chapaComprimento,
    setChapaComprimento,
    espacamento,
    setEspacamento,
    chapaLarguraNum,
    chapaComprimentoNum,
    pecaNaoCabe,
    // encaixe
    organizar,
    estado: nesting.estado,
    progresso: nesting.progresso,
    resultado,
    erro: nesting.erro,
    // preço
    base,
    setBase,
    areas,
    areaEscolhida,
  };
}

export type EncaixeSvg = ReturnType<typeof useEncaixeSvg>;
