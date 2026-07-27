import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-deslocamento-cep
// Converte CEP do cliente -> distância (km) -> custo de deslocamento, chamando
// o motor da skill (calc_deslocamento). Único ponto do app que fala com uma
// API externa (ViaCEP para endereço, OpenRouteService para geocodificação e
// rota); o cálculo de R$ em si continua 100% na skill. Somente leitura no
// banco: lê o CEP de origem da loja em calc_deslocamento e não escreve nada.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Coord {
  lat: number;
  lon: number;
}

interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

async function enderecoPorCep(cep: string): Promise<EnderecoViaCep> {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) {
    throw new Error(`CEP inválido: ${cep}`);
  }
  const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
  if (!res.ok) throw new Error(`ViaCEP falhou para o CEP ${cep}`);
  const data = await res.json();
  if (data?.erro) throw new Error(`CEP ${cep} não encontrado`);
  return {
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    localidade: data.localidade ?? "",
    uf: data.uf ?? "",
  };
}

// Geocodificação via Nominatim (OpenStreetMap), não OpenRouteService: em teste
// o geocoder da ORS (Pelias) errou a cidade para endereços de Jacareí (devolveu
// Conchal/Avaré, a centenas de km de distância). Nominatim com fallback
// rua+bairro -> bairro -> cidade deu resultado correto. A ORS continua sendo
// usada só para a rota/distância (Directions API), que é a parte escolhida
// pelo usuário.
async function buscarNominatim(query: string): Promise<Coord | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ettoprecifica-deslocamento/1.0" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const item = Array.isArray(data) ? data[0] : null;
  if (!item) return null;
  const lat = Number(item.lat);
  const lon = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

async function geocodificar(endereco: EnderecoViaCep): Promise<Coord> {
  const tentativas = [
    [endereco.logradouro, endereco.bairro, endereco.localidade, endereco.uf, "Brasil"],
    [endereco.bairro, endereco.localidade, endereco.uf, "Brasil"],
    [endereco.localidade, endereco.uf, "Brasil"],
  ].map((partes) => partes.filter((p) => p && p.trim() !== "").join(", "));

  for (const query of tentativas) {
    if (!query) continue;
    const coord = await buscarNominatim(query);
    if (coord) return coord;
  }
  throw new Error(`Não foi possível geocodificar "${tentativas[tentativas.length - 1]}"`);
}

async function distanciaKm(origem: Coord, destino: Coord, orsKey: string): Promise<number> {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
    method: "POST",
    headers: {
      Authorization: orsKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [origem.lon, origem.lat],
        [destino.lon, destino.lat],
      ],
    }),
  });
  if (!res.ok) throw new Error("Não foi possível calcular a rota (OpenRouteService)");
  const data = await res.json();
  const metros = data?.routes?.[0]?.summary?.distance;
  if (!(metros > 0)) throw new Error("Rota retornou distância inválida");
  return metros / 1000;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const orsKey = Deno.env.get("ORS_API_KEY");
    if (!orsKey) throw new Error("ORS_API_KEY não configurada");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const cepDestino = String(body?.cep_destino ?? "").trim();
    const tempoInstalacaoHoras = Number(body?.tempo_instalacao_horas) || 0;
    const qtdFuncionariosRaw = body?.qtd_funcionarios;
    const qtdFuncionarios =
      qtdFuncionariosRaw != null && Number(qtdFuncionariosRaw) > 0
        ? Math.trunc(Number(qtdFuncionariosRaw))
        : null;

    if (!cepDestino) {
      return json({ error: "informe o CEP de destino" }, 400);
    }

    // CEP de origem lido do banco (não hardcode) — mesma tabela que alimenta o
    // motor calc_deslocamento, sempre a linha ativa.
    const { data: origemRow, error: origemError } = await supabase
      .from("calc_deslocamento")
      .select("cep_origem_loja")
      .eq("ativo", true)
      .limit(1)
      .maybeSingle();
    if (origemError) throw origemError;
    const cepOrigem = origemRow?.cep_origem_loja;
    if (!cepOrigem) throw new Error("CEP de origem da loja não configurado em calc_deslocamento");

    let enderecoDestino: EnderecoViaCep;
    try {
      enderecoDestino = await enderecoPorCep(cepDestino);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : String(e) }, 400);
    }

    const enderecoOrigem = await enderecoPorCep(cepOrigem);
    const [coordOrigem, coordDestino] = await Promise.all([
      geocodificar(enderecoOrigem),
      geocodificar(enderecoDestino),
    ]);
    const distanciaIdaKm = await distanciaKm(coordOrigem, coordDestino, orsKey);

    const rpcArgs: Record<string, unknown> = {
      p_distancia_km: distanciaIdaKm,
      p_tempo_instalacao_horas: tempoInstalacaoHoras,
    };
    if (qtdFuncionarios != null) rpcArgs.p_qtd_funcionarios = qtdFuncionarios;

    const { data, error } = await supabase.rpc("calc_deslocamento", rpcArgs);
    if (error) throw error;
    const resultado = Array.isArray(data) ? data[0] : data;

    return json({
      cep_origem: cepOrigem,
      cep_destino: cepDestino,
      distancia_ida_km: distanciaIdaKm,
      resultado,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
