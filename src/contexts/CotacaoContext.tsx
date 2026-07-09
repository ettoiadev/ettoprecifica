import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Um item da cotação em andamento (o "carrinho" do vendedor).
export interface CotacaoItem {
  id: string;
  descricao: string;
  precoSemNota: number;
  precoComNota: number;
}

interface CotacaoContextType {
  itens: CotacaoItem[];
  addItem: (item: Omit<CotacaoItem, 'id'>) => void;
  removeItem: (id: string) => void;
  limpar: () => void;
  totalSemNota: number;
  totalComNota: number;
}

const CotacaoContext = createContext<CotacaoContextType | undefined>(undefined);

const STORAGE_KEY = 'cotacaoAtual';

export const CotacaoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itens, setItens] = useState<CotacaoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CotacaoItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      /* ignora falha de storage */
    }
  }, [itens]);

  const addItem = (item: Omit<CotacaoItem, 'id'>) => {
    setItens((prev) => [
      ...prev,
      { ...item, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
    ]);
  };

  const removeItem = (id: string) => setItens((prev) => prev.filter((i) => i.id !== id));

  const limpar = () => setItens([]);

  const { totalSemNota, totalComNota } = useMemo(
    () => ({
      totalSemNota: itens.reduce((s, i) => s + i.precoSemNota, 0),
      totalComNota: itens.reduce((s, i) => s + i.precoComNota, 0),
    }),
    [itens]
  );

  return (
    <CotacaoContext.Provider
      value={{ itens, addItem, removeItem, limpar, totalSemNota, totalComNota }}
    >
      {children}
    </CotacaoContext.Provider>
  );
};

export const useCotacao = () => {
  const ctx = useContext(CotacaoContext);
  if (ctx === undefined) {
    throw new Error('useCotacao must be used within a CotacaoProvider');
  }
  return ctx;
};
