import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Edge Function: calc-adesivo-recorte
// Ponte SOMENTE LEITURA entre o app e o motor de precificação da skill.
// Usa a service_role (bypassa RLS) internamente para chamar a função
// calc_adesivo_recorte e listar materiais/cidades. Não escreve em nenhuma tabela.
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

    // Materiais de recorte ativos (para o dropdown do app)
    if (body?.action === "materiais") {
      const { data, error } = await supabase
        .from("adesivo_recorte_materiais")
        .select("nome, uso, largura_rolo_m")
        .eq("ativo", true)
        .order("uso")
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

    const produto = String(body?.produto ?? "").trim();
    const largura = Number(body?.largura);
    const altura = Number(body?.altura);
    const cidade = String(body?.cidade ?? "Jacareí");
    const area = Number(body?.area); // modo área direta (m²)
    const comMascara = body?.mascara === true; // máscara de transferência (papel)
    let percentual = Number(body?.percentual);
    if (!(percentual > 0) || percentual > 100) percentual = 25;

    // 2 cores (opcional): 2ª cor de vinil recortado sobreposta à 1ª.
    const cores = Number(body?.cores) === 2 ? 2 : 1;
    const produtoCor2 = String(body?.produtoCor2 ?? "").trim();
    let percentualCor2 = Number(body?.percentualCor2);
    if (!(percentualCor2 > 0) || percentualCor2 > 100) percentualCor2 = 90;

    const temArea = area > 0;
    const temMedida = largura > 0 && altura > 0;

    if (!produto) {
      return json({ error: "informe o produto (material de recorte)" }, 400);
    }
    if (!temArea && !temMedida) {
      return json(
        { error: "informe a área (m²) OU largura e altura maiores que zero" },
        400,
      );
    }

    // Modo área direta tem prioridade; senão usa bounding box + percentual.
    // p_com_mascara sempre explícito (evita o aviso padrão da função).
    const rpcArgs: Record<string, unknown> = temArea
      ? {
          p_produto: produto,
          p_area_m2: area,
          p_cidade: cidade,
          p_com_mascara: comMascara,
        }
      : {
          p_produto: produto,
          largura_m: largura,
          altura_m: altura,
          p_percentual_area: percentual,
          p_cidade: cidade,
          p_com_mascara: comMascara,
        };

    if (cores === 2) {
      rpcArgs.p_cores = 2;
      rpcArgs.p_percentual_area_cor2 = percentualCor2;
      if (produtoCor2) rpcArgs.p_produto_cor2 = produtoCor2;
    }

    const { data, error } = await supabase.rpc("calc_adesivo_recorte", rpcArgs);
    if (error) throw error;

    const resultado = Array.isArray(data) ? data[0] : data;
    return json({
      produto,
      modo: temArea ? "area" : "medida",
      largura,
      altura,
      area,
      percentual,
      mascara: comMascara,
      cores,
      percentualCor2,
      cidade,
      resultado,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
