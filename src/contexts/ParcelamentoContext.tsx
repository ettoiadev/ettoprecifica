import React, { createContext, useContext } from 'react';
import { CartaoCreditoConfig, defaultConfig } from '../types/pricing';

/*
 * Tabela de taxas do cartão, disponível para todas as calculadoras.
 *
 * Vai por contexto em vez de prop porque são 14 calculadoras: passar a config
 * uma a uma seria 14 mudanças de assinatura mais 14 chamadas no `Index.tsx`,
 * sem ganho nenhum. O `CotacaoContext` já resolve a cotação desse jeito.
 *
 * **O padrão é `defaultConfig.cartaoCredito`, não um objeto vazio.** Sem
 * provedor — é o caso do `dev-preview.html`, onde os testes rodam — o
 * parcelamento continua calculando com a tabela de fábrica em vez de mostrar
 * taxa zero, que pareceria um preço certo e não seria.
 */
const ParcelamentoContext = createContext<CartaoCreditoConfig>(defaultConfig.cartaoCredito);

export const ParcelamentoProvider: React.FC<{
  taxas: CartaoCreditoConfig | undefined;
  children: React.ReactNode;
}> = ({ taxas, children }) => (
  <ParcelamentoContext.Provider value={taxas ?? defaultConfig.cartaoCredito}>
    {children}
  </ParcelamentoContext.Provider>
);

export const useTaxasCartao = (): CartaoCreditoConfig => useContext(ParcelamentoContext);
