import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-lona
// Ponte SOMENTE LEITURA entre o app e o motor da skill (funcao calc_lona).
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

    if (body?.action === "meta") {
      const [opc, cid] = await Promise.all([
        supabase
          .from("lona_opcoes")
          .select("tipo, nome, preco_venda_m2")
          .eq("ativo", true)
          .order("preco_venda_m2"),
        supabase.from("deslocamento_cidades").select("cidade").eq("ativo", true).order("cidade"),
      ]);
      if (opc.error) throw opc.error;
      if (cid.error) throw cid.error;
      return json({
        opcoes: opc.data ?? [],
        cidades: (cid.data ?? []).map((r: { cidade: string }) => r.cidade),
      });
    }

    const tipo = String(body?.tipo ?? "sem_acabamento").trim();
    const bastao = body?.bastao === true;
    // Laca de proteção UV: sempre enviado ao RPC para desambiguar os dois
    // overloads de calc_lona (com/sem p_laca_uv) e evitar "function is not unique".
    const laca = body?.laca === true;
    const largura = Number(body?.largura);
    const altura = Number(body?.altura);
    const cidade = body?.cidade ? String(body.cidade) : "Jacareí";

    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "largura e altura devem ser maiores que zero" }, 400);
    }

    const { data, error } = await supabase.rpc("calc_lona", {
      largura_m: largura,
      altura_m: altura,
      p_tipo: tipo,
      p_bastao: bastao,
      p_laca_uv: laca,
      p_cidade: cidade,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ tipo, bastao, laca, largura, altura, cidade, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
