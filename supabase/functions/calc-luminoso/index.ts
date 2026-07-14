import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-luminoso
// Ponte SOMENTE LEITURA entre o app e o motor de precificação de luminoso da skill.
// Usa a service_role (bypassa RLS) internamente para chamar a função calc_luminoso.
// Não escreve em nenhuma tabela. Exige JWT válido (verify_jwt=true).

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

    const tipoLuz = String(body?.tipo_luz ?? "modulo").toLowerCase();
    const material = String(body?.material ?? "lona").toLowerCase();
    // Forma: 'circular' usa largura como diâmetro (altura é ignorada pela função).
    const forma = String(body?.forma ?? "retangular").toLowerCase();
    const faces = Number(body?.faces);
    const largura = Number(body?.largura);
    const altura = forma === "circular" ? Number(body?.largura) : Number(body?.altura);
    const cidade = String(body?.cidade ?? "Jacareí");

    if (tipoLuz !== "modulo" && tipoLuz !== "tubular") {
      return json({ error: "tipo_luz inválido (use 'modulo' ou 'tubular')" }, 400);
    }
    if (material !== "lona" && material !== "acm_vazado" && material !== "acrilico") {
      return json(
        { error: "material inválido (use 'lona', 'acm_vazado' ou 'acrilico')" },
        400,
      );
    }
    if (forma !== "retangular" && forma !== "circular") {
      return json({ error: "forma inválida (use 'retangular' ou 'circular')" }, 400);
    }
    if (faces !== 1 && faces !== 2) {
      return json({ error: "faces inválido (use 1 ou 2)" }, 400);
    }
    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "dimensões devem ser maiores que zero" }, 400);
    }

    // p_forma sempre explícito: sem ele a chamada fica ambígua entre os dois
    // overloads de calc_luminoso (6 e 7 argumentos).
    const { data, error } = await supabase.rpc("calc_luminoso", {
      largura_m: largura,
      altura_m: altura,
      p_tipo_luz: tipoLuz,
      p_cidade: cidade,
      p_faces: faces,
      p_material: material,
      p_forma: forma,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ tipo_luz: tipoLuz, material, forma, faces, largura, altura, cidade, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
