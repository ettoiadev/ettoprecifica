import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-etiquetas
// Ponte SOMENTE LEITURA entre o app e o motor da skill (funcao calc_etiquetas).
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

    // Metadados: tamanhos e quantidades disponiveis (para os dropdowns em cascata)
    if (body?.action === "meta") {
      const { data, error } = await supabase
        .from("etiquetas_rotulos")
        .select("tamanho, quantidade")
        .eq("ativo", true)
        .order("tamanho")
        .order("quantidade");
      if (error) throw error;
      return json({ combos: data ?? [] });
    }

    const tamanho = String(body?.tamanho ?? "").trim();
    const quantidade = Math.trunc(Number(body?.quantidade));
    const cidade = body?.cidade ? String(body.cidade) : "Jacareí";

    if (!tamanho) return json({ error: "informe o tamanho da etiqueta" }, 400);
    if (!(quantidade > 0)) return json({ error: "informe a quantidade" }, 400);

    const { data, error } = await supabase.rpc("calc_etiquetas", {
      p_tamanho: tamanho,
      p_quantidade: quantidade,
      p_cidade: cidade,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ tamanho, quantidade, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
