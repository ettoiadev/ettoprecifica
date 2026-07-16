import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-cavaletes
// Ponte SOMENTE LEITURA entre o app e o motor da skill. Uma aba unica cobre as
// duas funcoes: calc_cavaletes (metalon+lona) e calc_cavaletes_madeira.
// service_role interna (bypassa RLS); nao escreve. verify_jwt=true.

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

    // Metadados: tamanhos do metalon e combos (tamanho + painel) da madeira
    if (body?.action === "meta") {
      const [metalon, madeira] = await Promise.all([
        supabase.from("cavaletes").select("tamanho").eq("ativo", true).order("tamanho"),
        supabase
          .from("cavaletes_madeira")
          .select("tamanho, opcao_painel")
          .eq("ativo", true)
          .order("tamanho"),
      ]);
      if (metalon.error) throw metalon.error;
      if (madeira.error) throw madeira.error;
      const tamanhosMetalon = (metalon.data ?? []).map((r: { tamanho: string }) => r.tamanho);
      return json({ tamanhosMetalon, combosMadeira: madeira.data ?? [] });
    }

    const estrutura = String(body?.estrutura ?? "metalon").toLowerCase();
    const tamanho = String(body?.tamanho ?? "").trim();
    const cidade = body?.cidade ? String(body.cidade) : "Jacareí";

    if (!tamanho) return json({ error: "informe o tamanho" }, 400);

    if (estrutura === "madeira") {
      const opcaoPainel = body?.opcaoPainel ? String(body.opcaoPainel).trim() : null;
      const { data, error } = await supabase.rpc("calc_cavaletes_madeira", {
        p_tamanho: tamanho,
        p_opcao_painel: opcaoPainel,
        p_cidade: cidade,
      });
      if (error) throw error;
      const resultado = Array.isArray(data) ? data[0] : data;
      return json({ estrutura, tamanho, resultado });
    }

    const { data, error } = await supabase.rpc("calc_cavaletes", {
      p_tamanho: tamanho,
      p_cidade: cidade,
    });
    if (error) throw error;
    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ estrutura: "metalon", tamanho, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
