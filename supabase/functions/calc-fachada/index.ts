import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-fachada
// Ponte SOMENTE LEITURA entre o app e o motor de precificação de fachada da skill.
// Usa a service_role (bypassa RLS) internamente para chamar as funções
// calc_fachada_acm / calc_fachada_lona. Não escreve em nenhuma tabela.
// Exige JWT válido (verify_jwt=true): só usuários logados podem chamar.

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

    // Lista de cidades ativas (para o dropdown do app)
    if (body?.action === "cidades") {
      const { data, error } = await supabase
        .from("deslocamento_cidades")
        .select("cidade")
        .eq("ativo", true)
        .order("cidade");
      if (error) throw error;
      return json({ cidades: (data ?? []).map((r: { cidade: string }) => r.cidade) });
    }

    const tipo = String(body?.tipo ?? "").toLowerCase();
    const largura = Number(body?.largura);
    const altura = Number(body?.altura);
    const cidade = String(body?.cidade ?? "Jacareí");

    if (tipo !== "acm" && tipo !== "lona") {
      return json({ error: "tipo inválido (use 'acm' ou 'lona')" }, 400);
    }
    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "largura e altura devem ser maiores que zero" }, 400);
    }

    const fn = tipo === "acm" ? "calc_fachada_acm" : "calc_fachada_lona";
    const { data, error } = await supabase.rpc(fn, {
      largura_m: largura,
      altura_m: altura,
      p_cidade: cidade,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ tipo, largura, altura, cidade, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
