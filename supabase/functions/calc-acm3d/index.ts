import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-acm3d
// Ponte SOMENTE LEITURA entre o app e o motor da skill: chama calc_fachada_acm
// com p_acabamento='3d' (caminho de custeio real "motor 2 — ACM 3D"). Aceita
// quantidades opcionais de chapas de ACM e de barras de metalon para maior
// precisão; se não informadas, o motor estima. service_role interna (bypassa
// RLS); não escreve em nenhuma tabela. verify_jwt=true (só usuários logados).

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

    const largura = Number(body?.largura);
    const altura = Number(body?.altura);
    // Deslocamento é opcional (informado manualmente pelo vendedor).
    const incluirDeslocamento = body?.incluirDeslocamento === true;
    const custoDeslocamento = Number(body?.custoDeslocamento) || 0;
    // Quantidades opcionais para custeio preciso; nulo => motor estima.
    const qtdChapas = Number(body?.qtdChapas);
    const qtdBarrasMetalon = Number(body?.qtdBarrasMetalon);
    const pQtdChapas =
      Number.isFinite(qtdChapas) && qtdChapas > 0 ? Math.round(qtdChapas) : null;
    const pQtdBarras =
      Number.isFinite(qtdBarrasMetalon) && qtdBarrasMetalon > 0
        ? Math.round(qtdBarrasMetalon)
        : null;

    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "largura e altura devem ser maiores que zero" }, 400);
    }

    const { data, error } = await supabase.rpc("calc_fachada_acm", {
      largura_m: largura,
      altura_m: altura,
      p_acabamento: "3d",
      qtd_chapas_informada: pQtdChapas,
      qtd_barras_metalon_informada: pQtdBarras,
      p_custo_deslocamento: custoDeslocamento,
      p_incluir_deslocamento: incluirDeslocamento,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({
      largura,
      altura,
      qtdChapas: pQtdChapas,
      qtdBarrasMetalon: pQtdBarras,
      incluirDeslocamento,
      custoDeslocamento,
      resultado,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
