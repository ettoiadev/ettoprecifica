import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-ps
// Ponte SOMENTE LEITURA entre o app e o motor de precificação da skill.
// Usa a service_role (bypassa RLS) internamente para chamar a função
// calc_ps_adesivado e listar tipos de placa/cidades. Não escreve em nenhuma tabela.
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

    // Tipos de placa PS ativos para o dropdown do app
    if (body?.action === "materiais") {
      const { data, error } = await supabase
        .from("ps_placas_materiais")
        .select("nome, largura_chapa_m, comprimento_chapa_m")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return json({ materiais: data ?? [] });
    }

    // Cidades ativas (para o dropdown do app)
    if (body?.action === "cidades") {
      const { data, error } = await supabase
        .from("deslocamento_cidades")
        .select("cidade")
        .eq("ativo", true)
        .order("cidade");
      if (error) throw error;
      return json({ cidades: (data ?? []).map((r: { cidade: string }) => r.cidade) });
    }

    const tipo = String(body?.tipo ?? "").trim();
    const largura = Number(body?.largura);
    const altura = Number(body?.altura);
    const cidade = String(body?.cidade ?? "Jacareí");
    let percentual = Number(body?.percentual);
    if (!(percentual > 0) || percentual > 100) percentual = 100;

    if (!tipo) {
      return json({ error: "informe o tipo de placa" }, 400);
    }
    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "largura e altura devem ser maiores que zero" }, 400);
    }

    const { data, error } = await supabase.rpc("calc_ps_adesivado", {
      p_tipo: tipo,
      largura_m: largura,
      altura_m: altura,
      p_percentual_impressao: percentual,
      p_cidade: cidade,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ tipo, largura, altura, percentual, cidade, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
