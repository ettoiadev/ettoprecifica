import React from 'react';
import { Trash2, X, ShoppingCart } from 'lucide-react';
import { useCotacao } from '../contexts/CotacaoContext';
import { formatCurrency } from '../types/pricing';

// Box de "carrinho de cotação": lista os itens adicionados de qualquer
// calculadora, com preço sem/com nota, totais e botão de limpar.
const CotacaoBar: React.FC = () => {
  const { itens, removeItem, limpar, totalSemNota, totalComNota } = useCotacao();

  if (itens.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Cotação ({itens.length} {itens.length === 1 ? 'item' : 'itens'})
          </h3>
          <button
            type="button"
            onClick={limpar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Limpar
          </button>
        </div>

        {/* Cabeçalho da tabela */}
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_2rem] gap-4 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <span>Item</span>
          <span className="text-right w-32">Sem nota</span>
          <span className="text-right w-32">Com nota</span>
          <span />
        </div>

        <div className="divide-y divide-gray-100">
          {itens.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_auto_2rem] sm:grid-cols-[1fr_auto_auto_2rem] gap-2 sm:gap-4 items-center px-3 py-3"
            >
              <span className="text-sm text-gray-800">{item.descricao}</span>
              <span className="hidden sm:block text-sm text-gray-600 text-right w-32">
                {formatCurrency(item.precoSemNota)}
              </span>
              <span className="text-sm text-gray-900 font-medium text-right w-32">
                <span className="sm:hidden text-xs text-gray-400 mr-1">c/ nota</span>
                {formatCurrency(item.precoComNota)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remover ${item.descricao}`}
                className="justify-self-end p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Totais */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-8">
          <div className="text-sm text-gray-600">
            Total sem nota:{' '}
            <span className="font-semibold text-gray-900">{formatCurrency(totalSemNota)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Total com nota:{' '}
            <span className="font-bold text-blue-600 text-base">{formatCurrency(totalComNota)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotacaoBar;
