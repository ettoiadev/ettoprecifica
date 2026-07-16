import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-letra-caixa
// Ponte SOMENTE LEITURA entre o app e o motor de precificação da skill.
// Usa a service_role (bypassa RLS) internamente para chamar a função
// calc_letra_caixa. Não escreve em nenhuma tabela.
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

const MATERIAIS = ["pvc", "acm", "galvanizado", "inox", "impressao_3d"];

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

    // Metadados: espessuras de PVC cadastradas (para o dropdown do app)
    if (body?.action === "meta") {
      const { data, error } = await supabase
        .from("letra_caixa_pvc_mercado")
        .select("espessura_mm")
        .eq("ativo", true)
        .order("espessura_mm");
      if (error) throw error;
      const espessuras = (data ?? []).map((r: { espessura_mm: number | string }) =>
        Number(r.espessura_mm)
      );
      return json({ materiais: MATERIAIS, espessurasPvc: espessuras });
    }

    const material = String(body?.material ?? "").toLowerCase();
    const iluminado = body?.iluminado === true;
    // Tipo de iluminação (novo overload da skill): 'frontal_acrilico' usa a
    // tabela de mercado própria (LED já incluso, sem +45%); vazio/null = padrão
    // (retroiluminado usa p_iluminado). Sempre enviado ao RPC para desambiguar
    // os dois overloads de calc_letra_caixa (evita "function is not unique").
    const tipoIluminacao = body?.tipoIluminacao
      ? String(body.tipoIluminacao).toLowerCase()
      : null;

    if (!MATERIAIS.includes(material)) {
      return json(
        { error: "material inválido (use pvc, acm, galvanizado, inox ou impressao_3d)" },
        400,
      );
    }

    // Modo PVC: por m² da placa. Demais: por altura (cm) × nº de caracteres.
    const larguraPlaca = Number(body?.larguraPlaca);
    const alturaPlaca = Number(body?.alturaPlaca);
    const espessura = Number(body?.espessura) > 0 ? Number(body.espessura) : 20;
    const alturaCm = Number(body?.alturaCm);
    const nCaracteres = Math.trunc(Number(body?.nCaracteres));
    const larguraTotalCm = Number(body?.larguraTotalCm) > 0 ? Number(body.larguraTotalCm) : null;

    if (material === "pvc") {
      if (!(larguraPlaca > 0) || !(alturaPlaca > 0)) {
        return json({ error: "PVC precisa de largura e altura da placa (m)" }, 400);
      }
    } else {
      if (!(alturaCm > 0) || !(nCaracteres > 0)) {
        return json({ error: "informe a altura da letra (cm) e o nº de caracteres" }, 400);
      }
    }

    const { data, error } = await supabase.rpc("calc_letra_caixa", {
      p_material: material,
      altura_cm: material === "pvc" ? null : alturaCm,
      n_caracteres: material === "pvc" ? null : nCaracteres,
      largura_total_cm: material === "pvc" ? null : larguraTotalCm,
      largura_placa_m: material === "pvc" ? larguraPlaca : null,
      altura_placa_m: material === "pvc" ? alturaPlaca : null,
      p_espessura_mm: espessura,
      p_iluminado: iluminado,
      p_tipo_iluminacao: tipoIluminacao,
    });
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({ material, iluminado, tipoIluminacao, resultado });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
