import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';

// Deslocamento por CEP: opt-in (checkbox), o vendedor digita o CEP do cliente
// + tempo estimado de instalação, e a Edge Function calc-deslocamento-cep
// (ViaCEP + Nominatim + OpenRouteService + motor calc_deslocamento da skill)
// pré-preenche o valor em R$. O vendedor ainda pode ajustar antes de confirmar.
export interface InfoDeslocamentoCep {
  distanciaIdaKm: number;
  trecho: string;
}

export function useDeslocamentoCep() {
  const [incluirDeslocamento, setIncluirDeslocamento] = useState(false);
  const [cepDestino, setCepDestino] = useState('');
  const [tempoInstalacaoHoras, setTempoInstalacaoHoras] = useState('');
  const [custoDeslocamento, setCustoDeslocamento] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [infoCep, setInfoCep] = useState<InfoDeslocamentoCep | null>(null);

  useEffect(() => {
    if (!incluirDeslocamento) {
      setErroCep(null);
      setInfoCep(null);
      return;
    }
    const digitos = cepDestino.replace(/\D/g, '');
    if (digitos.length !== 8) {
      setErroCep(null);
      setInfoCep(null);
      return;
    }
    let ativo = true;
    const timer = setTimeout(async () => {
      setBuscandoCep(true);
      setErroCep(null);
      try {
        const { data, error } = await supabase.functions.invoke('calc-deslocamento-cep', {
          body: {
            cep_destino: digitos,
            tempo_instalacao_horas: parseFloat(tempoInstalacaoHoras) || 0,
          },
        });
        if (!ativo) return;
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const r = data?.resultado;
        if (r?.custo_deslocamento_total == null) throw new Error('Resposta inesperada do cálculo de deslocamento.');
        setCustoDeslocamento(String(r.custo_deslocamento_total));
        setInfoCep({ distanciaIdaKm: Number(r.distancia_ida_km ?? data.distancia_ida_km), trecho: String(r.trecho ?? '') });
      } catch (e) {
        if (!ativo) return;
        setErroCep(e instanceof Error ? e.message : 'Não foi possível calcular o deslocamento pelo CEP.');
        setInfoCep(null);
      } finally {
        if (ativo) setBuscandoCep(false);
      }
    }, 600);
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [incluirDeslocamento, cepDestino, tempoInstalacaoHoras]);

  return {
    incluirDeslocamento,
    setIncluirDeslocamento,
    cepDestino,
    setCepDestino,
    tempoInstalacaoHoras,
    setTempoInstalacaoHoras,
    custoDeslocamento,
    setCustoDeslocamento,
    buscandoCep,
    erroCep,
    infoCep,
  };
}

export type UseDeslocamentoCepReturn = ReturnType<typeof useDeslocamentoCep>;
