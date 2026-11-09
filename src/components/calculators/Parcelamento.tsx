import React, { useMemo, useState } from 'react';
import { CartaoCreditoConfig, formatCurrency } from '../../types/pricing';
import { useTaxasCartao } from '../../contexts/ParcelamentoContext';
import { CalcCheckbox, selectClass } from './CalcControls';

/*
 * Simulador de parcelamento no cartão, igual ao do InfinitePay que o Étto usa.
 *
 * São DUAS contas, e a diferença entre elas é o que a maquininha chama de
 * "repassar a taxa":
 *
 *   sem repasse → o cliente paga o preço do orçamento e NÓS absorvemos a taxa
 *                 você recebe = valor × (1 − taxa)
 *   com repasse → o cliente paga a mais para nós recebermos o valor inteiro
 *                 o cliente paga = valor ÷ (1 − taxa)
 *
 * Reparar que o repasse **não é** somar a taxa por cima. Somar 8,28% a R$100 dá
 * R$108,28, e 8,28% disso é R$8,97 — sobrariam R$99,31, não R$100. Dividir por
 * (1 − taxa) é o que fecha. Confere com o exemplo da própria tela do
 * InfinitePay: R$100 ÷ (1 − 5,49%) = R$105,81.
 *
 * Conferido também contra o print do Étto: R$2.300 em 6x a 8,28% → "Você
 * recebe R$ 2.109,56".
 *
 * **O preço do orçamento não muda por causa disto.** O simulador é uma camada
 * de cima: o que vai para a cotação e para a linha `Valor:` da cópia continua
 * sendo o preço à vista. O parcelamento entra na cópia como uma linha a mais.
 */

/** Taxa em % da opção escolhida. `parcelas` 1 = crédito à vista. */
const taxaDe = (taxas: CartaoCreditoConfig, parcelas: number): number => {
  if (parcelas <= 1) return taxas.creditoVista;
  const chave = `taxa${parcelas}x` as keyof CartaoCreditoConfig;
  return taxas[chave] ?? 0;
};

export const MAX_PARCELAS = 12;

export interface Parcelamento {
  /** nenhuma simulação a fazer (sem preço ainda) */
  ativo: boolean;
  parcelas: number;
  setParcelas: (n: number) => void;
  repassar: boolean;
  setRepassar: (b: boolean) => void;
  taxa: number;
  clientePaga: number;
  voceRecebe: number;
  valorParcela: number;
  /** linha a acrescentar na cópia do orçamento; '' quando não há o que dizer */
  linhaCopia: string;
}

export function useParcelamento(valor: number): Parcelamento {
  const taxas = useTaxasCartao();
  const [parcelas, setParcelas] = useState(1);
  const [repassar, setRepassar] = useState(false);

  return useMemo(() => {
    const taxa = taxaDe(taxas, parcelas);
    const fator = 1 - taxa / 100;
    // taxa de 100% ou mais nao tem conta possivel: cai para o valor cheio em
    // vez de dividir por zero e mostrar Infinity na tela do vendedor
    const seguro = fator > 0 ? fator : 1;
    const clientePaga = repassar ? valor / seguro : valor;
    const voceRecebe = repassar ? valor : valor * seguro;
    const valorParcela = parcelas > 0 ? clientePaga / parcelas : clientePaga;

    let linhaCopia = '';
    if (valor > 0 && parcelas > 1) {
      linhaCopia = `Ou ${parcelas}x de ${formatCurrency(valorParcela)}`;
      // com repasse o total parcelado é maior que o à vista, e o cliente
      // precisa ver isso — senão a conta dele não fecha
      if (repassar) linhaCopia += ` (total ${formatCurrency(clientePaga)})`;
    }

    return {
      ativo: valor > 0,
      parcelas,
      setParcelas,
      repassar,
      setRepassar,
      taxa,
      clientePaga,
      voceRecebe,
      valorParcela,
      linhaCopia,
    };
  }, [taxas, parcelas, repassar, valor]);
}

const Linha: React.FC<{ rotulo: string; children: React.ReactNode; forte?: boolean }> = ({
  rotulo,
  children,
  forte,
}) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className={forte ? 'font-medium text-gray-900' : 'text-gray-600'}>{rotulo}</span>
    <span className={`text-right tabular-nums ${forte ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
      {children}
    </span>
  </div>
);

/** Caixa do simulador, para entrar no painel "Orçamento" das calculadoras. */
export const ParcelamentoBox: React.FC<{ parc: Parcelamento }> = ({ parc }) => {
  // mesma tabela que o hook usou: cada opção da lista mostra a taxa DELA, que
  // é o que deixa o vendedor comparar antes de escolher, como na maquininha
  const taxas = useTaxasCartao();
  if (!parc.ativo) return null;
  const id = 'parcelas-cartao';
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">Parcelamento no cartão</div>

      <div>
        <label htmlFor={id} className="block text-xs text-gray-500 mb-1">
          Parcelas
        </label>
        <select
          id={id}
          className={selectClass}
          value={parc.parcelas}
          onChange={(e) => parc.setParcelas(parseInt(e.target.value, 10) || 1)}
        >
          {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n === 1 ? 'Crédito à vista' : `Crédito ${n}x`} (
              {taxaDe(taxas, n).toLocaleString('pt-BR')}%)
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Linha rotulo="Seu cliente paga" forte>
          {formatCurrency(parc.clientePaga)}
        </Linha>
        {parc.parcelas > 1 && (
          <div className="text-right text-xs text-gray-500 tabular-nums">
            {parc.parcelas}x de {formatCurrency(parc.valorParcela)}
          </div>
        )}
        <Linha rotulo="Você recebe" forte>
          {formatCurrency(parc.voceRecebe)}
        </Linha>
        <Linha rotulo={`Taxa (${parc.taxa.toLocaleString('pt-BR')}%)`}>
          − {formatCurrency(parc.clientePaga - parc.voceRecebe)}
        </Linha>
      </div>

      <CalcCheckbox checked={parc.repassar} onCheckedChange={parc.setRepassar}>
        Repassar a taxa ao cliente
      </CalcCheckbox>
    </div>
  );
};
