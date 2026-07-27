import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-laser
// Ponte SOMENTE LEITURA entre o app e o motor de precificação de laser da skill.
// Usa a service_role (bypassa RLS) internamente para chamar a função calc_laser.
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

    // Metadados para o select do app: materiais
    if (body?.action === "meta") {
      const { data, error } = await supabase
        .from("laser_materiais")
        .select("nome, categoria")
        .eq("ativo", true)
        .order("categoria")
        .order("nome");
      if (error) throw error;
      return json({ materiais: data ?? [] });
    }

    const material = String(body?.material ?? "");
    const forma = String(body?.forma ?? "retangular").toLowerCase();
    const complexidade = String(body?.complexidade ?? "padrao").toLowerCase();
    const comLed = Boolean(body?.com_led);
    const largura = Number(body?.largura);
    const altura = forma === "circular" ? Number(body?.largura) : Number(body?.altura);
    const materialCamada2 = body?.material_camada2 ? String(body.material_camada2) : null;
    const percentualCamada2 = body?.percentual_camada2 != null ? Number(body.percentual_camada2) : 100;
    // Deslocamento é opcional (informado manualmente pelo vendedor) — não é mais
    // resolvido por cidade, a tabela deslocamento_cidades ficou obsoleta.
    const incluirDeslocamento = body?.incluirDeslocamento === true;
    const custoDeslocamento = Number(body?.custoDeslocamento) || 0;

    if (!material) return json({ error: "material é obrigatório" }, 400);
    if (forma !== "retangular" && forma !== "circular") {
      return json({ error: "forma inválida (use 'retangular' ou 'circular')" }, 400);
    }
    if (complexidade !== "padrao" && complexidade !== "complexo") {
      return json({ error: "complexidade inválida (use 'padrao' ou 'complexo')" }, 400);
    }
    if (!(largura > 0) || !(altura > 0)) {
      return json({ error: "dimensões devem ser maiores que zero" }, 400);
    }

    const { data, error } = await supabase.rpc("calc_laser", {
      p_material: material,
      largura_m: largura,
      altura_m: altura,
      p_complexidade: complexidade,
      p_com_led: comLed,
      p_material_camada2: materialCamada2,
      p_percentual_camada2: percentualCamada2,
      p_forma: forma,
      p_custo_deslocamento: custoDeslocamento,
      p_incluir_deslocamento: incluirDeslocamento,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ material, forma, complexidade, com_led: comLed, largura, altura, incluirDeslocamento, custoDeslocamento, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
