import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-placa-acm
// Ponte SOMENTE LEITURA entre o app e o motor da skill (funcao calc_placa_acm).
// Placa ACM avulsa (nao e fachada). service_role interna; nao escreve. verify_jwt=true.

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));

    // Metadados: espessuras disponiveis
    if (body?.action === "meta") {
      const { data, error } = await supabase
        .from("acm_placa_opcoes")
        .select("espessura_mm")
        .eq("ativo", true)
        .order("espessura_mm");
      if (error) throw error;
      const espessuras = [
        ...new Set((data ?? []).map((r: { espessura_mm: number | string }) => Number(r.espessura_mm))),
      ];
      return json({ espessuras });
    }

    const largura = Number(body?.largura);
    const altura = Number(body?.altura);
    const espessura = Number(body?.espessura) > 0 ? Number(body.espessura) : 3;
    // Deslocamento é opcional (informado manualmente pelo vendedor) — não é mais
    // resolvido por cidade, a tabela deslocamento_cidades ficou obsoleta.
    const incluirDeslocamento = body?.incluirDeslocamento === true;
    const custoDeslocamento = Number(body?.custoDeslocamento) || 0;

    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "largura e altura devem ser maiores que zero" }, 400);
    }

    const { data, error } = await supabase.rpc("calc_placa_acm", {
      largura_m: largura,
      altura_m: altura,
      p_acabamento: "sem_impressao",
      p_espessura_mm: espessura,
      p_custo_deslocamento: custoDeslocamento,
      p_incluir_deslocamento: incluirDeslocamento,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ largura, altura, espessura, incluirDeslocamento, custoDeslocamento, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
