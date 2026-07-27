import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";
import { assessPurchaseRisk, applyAiAdjustment, type PurchaseRiskSignals } from "./risk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const BodySchema = z.object({
  purchase_id: z.string().uuid(),
});

const AI_TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "review_redemption",
    description:
      "Emitir parecer de risco sobre um resgate de recompensa corporativa, ajustando levemente a pontuação heurística.",
    parameters: {
      type: "object",
      properties: {
        score_adjustment: {
          type: "integer",
          minimum: -15,
          maximum: 15,
          description: "Ajuste da pontuação heurística. Use 0 quando concordar plenamente.",
        },
        summary: {
          type: "string",
          maxLength: 600,
          description: "Parecer objetivo em português (PT-BR), 2 a 4 frases, citando os sinais decisivos.",
        },
        recommendation: {
          type: "string",
          enum: ["approve", "review", "reject"],
          description: "Recomendação — nunca é executada automaticamente, apenas orienta o aprovador humano.",
        },
      },
      required: ["score_adjustment", "summary", "recommendation"],
      additionalProperties: false,
    },
  },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function daysBetween(fromIso: string | null): number {
  if (!fromIso) return 0;
  const then = new Date(fromIso).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

async function callAI(
  signals: PurchaseRiskSignals,
  heuristic: ReturnType<typeof assessPurchaseRisk>,
): Promise<{ score_adjustment: number; summary: string; recommendation: string } | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um analista de compliance de programas de incentivo corporativo. Avalie o risco de fraude/abuso em resgates de recompensas. Seja conservador: nunca acuse sem evidência nos sinais. Responda sempre em português (PT-BR).",
          },
          {
            role: "user",
            content: `Analise este resgate.

SINAIS:
${JSON.stringify(signals, null, 2)}

PONTUAÇÃO HEURÍSTICA: ${heuristic.score}/100 (${heuristic.level})
FATORES DETECTADOS:
${heuristic.factors.map((f) => `- ${f.label} (${f.points > 0 ? "+" : ""}${f.points}): ${f.detail}`).join("\n") || "- nenhum"}`,
          },
        ],
        tools: [AI_TOOL_SCHEMA],
        tool_choice: { type: "function", function: { name: "review_redemption" } },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    return JSON.parse(args);
  } catch {
    // A IA é um complemento: falha nela não pode travar a governança.
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await anon.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Invalid token" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Apenas gestores/administradores podem disparar a análise.
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id);
    const isStaff = (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "manager");
    if (!isStaff) return json({ error: "Permissão negada" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const purchaseId = parsed.data.purchase_id;

    const { data: purchase, error: pErr } = await admin
      .from("shop_purchases")
      .select("*, reward:shop_rewards(id, name, rarity, stock, price_coins)")
      .eq("id", purchaseId)
      .maybeSingle();
    if (pErr || !purchase) return json({ error: "Pedido não encontrado" }, 404);

    const { data: profile } = await admin
      .from("profiles")
      .select("id, coins, created_at")
      .eq("id", purchase.user_id)
      .maybeSingle();

    const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const since90 = new Date(Date.now() - 90 * 86_400_000).toISOString();

    const { data: recent } = await admin
      .from("shop_purchases")
      .select("id, reward_id, created_at, status")
      .eq("user_id", purchase.user_id)
      .gte("created_at", since90);

    const rows = recent ?? [];
    const purchasesLast7Days = rows.filter((r) => r.created_at >= since7).length;
    const sameRewardLast7Days = rows.filter(
      (r) => r.created_at >= since7 && r.reward_id === purchase.reward_id,
    ).length;
    const cancelledLast90Days = rows.filter((r) => r.status === "cancelled").length;

    const { data: earnings } = await admin
      .from("audit_logs")
      .select("new_data")
      .eq("user_id", purchase.user_id)
      .eq("action", "coins_earned")
      .gte("created_at", since30)
      .limit(500);

    const coinsEarnedLast30Days = (earnings ?? []).reduce((acc: number, log: { new_data: unknown }) => {
      const amount = (log.new_data as { amount?: number } | null)?.amount;
      return acc + (typeof amount === "number" && Number.isFinite(amount) ? amount : 0);
    }, 0);

    const reward = purchase.reward as { rarity?: string; stock?: number | null } | null;

    const signals: PurchaseRiskSignals = {
      totalCoins: purchase.total_coins ?? 0,
      quantity: purchase.quantity ?? 1,
      balanceBefore: (profile?.coins ?? 0) + (purchase.total_coins ?? 0),
      coinsEarnedLast30Days,
      accountAgeDays: daysBetween(profile?.created_at ?? null),
      purchasesLast7Days,
      cancelledLast90Days,
      rarity: (reward?.rarity as PurchaseRiskSignals["rarity"]) ?? "common",
      stockRemaining: reward?.stock ?? null,
      sameRewardLast7Days,
    };

    const heuristic = assessPurchaseRisk(signals);
    const ai = await callAI(signals, heuristic);
    const final = applyAiAdjustment(heuristic, ai?.score_adjustment ?? 0, ai?.summary ?? null);

    const summary = final.aiSummary
      ?? `Análise heurística sem parecer de IA disponível. Pontuação ${final.score}/100 (${final.level}).`;

    const { error: upErr } = await admin
      .from("shop_purchases")
      .update({
        risk_score: final.score,
        risk_level: final.level,
        risk_factors: final.factors,
        ai_summary: summary,
        risk_analyzed_at: new Date().toISOString(),
        requires_dual_approval: final.requiresDualApproval,
      })
      .eq("id", purchaseId);
    if (upErr) throw upErr;

    await admin.from("purchase_approvals").insert({
      purchase_id: purchaseId,
      actor_id: userRes.user.id,
      action: "ai_review",
      from_status: purchase.status,
      to_status: purchase.status,
      reason: summary,
      risk_snapshot: {
        score: final.score,
        level: final.level,
        factors: final.factors,
        signals,
        recommendation: ai?.recommendation ?? "review",
        ai_available: ai !== null,
      },
    });

    return json({
      score: final.score,
      level: final.level,
      factors: final.factors,
      summary,
      recommendation: ai?.recommendation ?? "review",
      requires_dual_approval: final.requiresDualApproval,
      ai_available: ai !== null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return json({ error: message }, 500);
  }
});