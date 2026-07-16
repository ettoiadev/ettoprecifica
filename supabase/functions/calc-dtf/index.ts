import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-dtf
// Ponte SOMENTE LEITURA entre o app e o motor da skill (funcao calc_dtf).
// Usa service_role internamente (bypassa RLS); nao escreve em nenhuma tabela.
// verify_jwt=true: so usuarios logados podem chamar.

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

    // Metadados: tipos de DTF cadastrados (para o dropdown do app)
    if (body?.action === "meta") {
      const { data, error } = await supabase
        .from("dtf_precos")
        .select("tipo, largura_cm")
        .eq("ativo", true);
      if (error) throw error;
      // distintos por tipo
      const seen = new Map<string, number>();
      for (const r of (data ?? []) as { tipo: string; largura_cm: number }[]) {
        if (!seen.has(r.tipo)) seen.set(r.tipo, Number(r.largura_cm));
      }
      const tipos = [...seen.entries()].map(([tipo, largura_cm]) => ({ tipo, largura_cm }));
      return json({ tipos });
    }

    const tipo = String(body?.tipo ?? "").trim();
    const metros = Number(body?.metros);
    const incluirUber = body?.incluirUber !== false; // default true
    const cidade = body?.cidade ? String(body.cidade) : "Jacareí";

    if (!tipo) return json({ error: "informe o tipo de DTF" }, 400);
    if (!(metros > 0)) return json({ error: "informe os metros lineares" }, 400);

    // Sempre passa p_incluir_uber para desambiguar os dois overloads de calc_dtf.
    const { data, error } = await supabase.rpc("calc_dtf", {
      p_metros_lineares: metros,
      p_tipo: tipo,
      p_incluir_uber: incluirUber,
      p_cidade: cidade,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ tipo, metros, incluirUber, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
