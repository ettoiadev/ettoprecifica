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

    // Metadados para os selects do app: materiais + cidades
    if (body?.action === "meta") {
      const [mat, cid] = await Promise.all([
        supabase.from("laser_materiais").select("nome, categoria").eq("ativo", true).order("categoria").order("nome"),
        supabase.from("deslocamento_cidades").select("cidade").eq("ativo", true).order("cidade"),
      ]);
      if (mat.error) throw mat.error;
      if (cid.error) throw cid.error;
      return json({
        materiais: mat.data ?? [],
        cidades: (cid.data ?? []).map((r: { cidade: string }) => r.cidade),
      });
    }

    const material = String(body?.material ?? "");
    const forma = String(body?.forma ?? "retangular").toLowerCase();
    const complexidade = String(body?.complexidade ?? "padrao").toLowerCase();
    const comLed = Boolean(body?.com_led);
    const cidade = String(body?.cidade ?? "Jacareí");
    const largura = Number(body?.largura);
    const altura = forma === "circular" ? Number(body?.largura) : Number(body?.altura);
    const materialCamada2 = body?.material_camada2 ? String(body.material_camada2) : null;
    const percentualCamada2 = body?.percentual_camada2 != null ? Number(body.percentual_camada2) : 100;

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
      p_cidade: cidade,
      p_com_led: comLed,
      p_material_camada2: materialCamada2,
      p_percentual_camada2: percentualCamada2,
      p_forma: forma,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ material, forma, complexidade, com_led: comLed, cidade, largura, altura, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
