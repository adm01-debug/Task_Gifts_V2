import { describe, it, expect } from "vitest";
import {
  assessPurchaseRisk,
  applyAiAdjustment,
  normalizeSignals,
  riskLevelFromScore,
  clampScore,
  DUAL_APPROVAL_THRESHOLD,
  type PurchaseRiskSignals,
} from "@/lib/purchaseRisk";

/** PRNG determinístico (mulberry32) para simulações reprodutíveis. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RARITIES: PurchaseRiskSignals["rarity"][] = ["common", "rare", "epic", "legendary"];

function randomSignals(rnd: () => number): PurchaseRiskSignals {
  return {
    totalCoins: Math.floor(rnd() * 8000),
    quantity: 1 + Math.floor(rnd() * 8),
    balanceBefore: Math.floor(rnd() * 12000),
    coinsEarnedLast30Days: Math.floor(rnd() * 6000),
    accountAgeDays: Math.floor(rnd() * 900),
    purchasesLast7Days: Math.floor(rnd() * 15),
    cancelledLast90Days: Math.floor(rnd() * 8),
    rarity: RARITIES[Math.floor(rnd() * RARITIES.length)],
    stockRemaining: rnd() < 0.3 ? null : Math.floor(rnd() * 20),
    sameRewardLast7Days: Math.floor(rnd() * 6),
  };
}

describe("purchaseRisk — invariantes fundamentais", () => {
  it("mantém a pontuação sempre entre 0 e 100 em 500 cenários aleatórios", () => {
    const rnd = prng(20260727);
    for (let i = 0; i < 500; i++) {
      const result = assessPurchaseRisk(randomSignals(rnd));
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.score)).toBe(true);
      expect(result.level).toBe(riskLevelFromScore(result.score));
      expect(result.requiresDualApproval).toBe(result.score >= DUAL_APPROVAL_THRESHOLD);
    }
  });

  it("é determinístico: mesma entrada produz sempre a mesma saída", () => {
    const rnd = prng(7);
    for (let i = 0; i < 200; i++) {
      const signals = randomSignals(rnd);
      expect(assessPurchaseRisk(signals)).toEqual(assessPurchaseRisk(signals));
    }
  });

  it("é monotônico no valor do resgate (mantendo os demais sinais)", () => {
    const base: PurchaseRiskSignals = {
      totalCoins: 0,
      quantity: 1,
      balanceBefore: 10000,
      coinsEarnedLast30Days: 10000,
      accountAgeDays: 60,
      purchasesLast7Days: 1,
      cancelledLast90Days: 0,
      rarity: "common",
      stockRemaining: null,
      sameRewardLast7Days: 1,
    };
    const values = [0, 100, 799, 800, 1999, 2000, 4999, 5000, 20000];
    let previous = -1;
    for (const totalCoins of values) {
      const score = assessPurchaseRisk({ ...base, totalCoins }).score;
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
  });
});

describe("purchaseRisk — normalização defensiva", () => {
  const dirty: Array<Partial<PurchaseRiskSignals>> = [
    {},
    { totalCoins: Number.NaN, quantity: 0 },
    { totalCoins: -500, quantity: -3, balanceBefore: -1 },
    { accountAgeDays: Number.POSITIVE_INFINITY },
    { rarity: "mythic" as unknown as PurchaseRiskSignals["rarity"] },
    { stockRemaining: -10 },
    { purchasesLast7Days: 3.7, sameRewardLast7Days: 2.9 },
    { coinsEarnedLast30Days: Number.NEGATIVE_INFINITY },
  ];

  it.each(dirty)("nunca lança nem gera NaN com entrada suja %#", (input) => {
    const normalized = normalizeSignals(input);
    expect(Number.isFinite(normalized.totalCoins)).toBe(true);
    expect(normalized.quantity).toBeGreaterThanOrEqual(1);
    expect(normalized.totalCoins).toBeGreaterThanOrEqual(0);
    expect(normalized.balanceBefore).toBeGreaterThanOrEqual(0);
    expect(RARITIES).toContain(normalized.rarity);
    expect(Number.isInteger(normalized.purchasesLast7Days)).toBe(true);

    const result = assessPurchaseRisk(input);
    expect(Number.isNaN(result.score)).toBe(false);
  });

  it("clampScore trata valores extremos e não numéricos", () => {
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(-999)).toBe(0);
    expect(clampScore(999)).toBe(100);
    expect(clampScore(54.6)).toBe(55);
  });
});

describe("purchaseRisk — cenários de negócio", () => {
  const trusted: PurchaseRiskSignals = {
    totalCoins: 300,
    quantity: 1,
    balanceBefore: 2000,
    coinsEarnedLast30Days: 1200,
    accountAgeDays: 400,
    purchasesLast7Days: 1,
    cancelledLast90Days: 0,
    rarity: "common",
    stockRemaining: null,
    sameRewardLast7Days: 1,
  };

  it("colaborador veterano com resgate pequeno é risco baixo e não exige dupla aprovação", () => {
    const result = assessPurchaseRisk(trusted);
    expect(result.level).toBe("low");
    expect(result.requiresDualApproval).toBe(false);
  });

  it("conta nova + valor alto + rajada dispara dupla aprovação", () => {
    const result = assessPurchaseRisk({
      ...trusted,
      totalCoins: 6000,
      accountAgeDays: 2,
      purchasesLast7Days: 9,
      coinsEarnedLast30Days: 0,
      balanceBefore: 9000,
      rarity: "legendary",
    });
    expect(result.score).toBeGreaterThanOrEqual(DUAL_APPROVAL_THRESHOLD);
    expect(["high", "critical"]).toContain(result.level);
    expect(result.requiresDualApproval).toBe(true);
  });

  it("detecta saldo sem contrapartida de ganhos", () => {
    const result = assessPurchaseRisk({ ...trusted, totalCoins: 900, coinsEarnedLast30Days: 0 });
    expect(result.factors.map((f) => f.code)).toContain("no_recent_earnings");
  });

  it("detecta acumulação do mesmo item", () => {
    const result = assessPurchaseRisk({ ...trusted, sameRewardLast7Days: 4 });
    expect(result.factors.map((f) => f.code)).toContain("same_reward_repeat");
  });

  it("aplica mitigador ao perfil consistente", () => {
    const withMitigator = assessPurchaseRisk({ ...trusted, totalCoins: 900, coinsEarnedLast30Days: 1500 });
    expect(withMitigator.factors.map((f) => f.code)).toContain("trusted_profile");
  });

  it("cada faixa de score mapeia para o nível esperado", () => {
    expect(riskLevelFromScore(0)).toBe("low");
    expect(riskLevelFromScore(29)).toBe("low");
    expect(riskLevelFromScore(30)).toBe("medium");
    expect(riskLevelFromScore(54)).toBe("medium");
    expect(riskLevelFromScore(55)).toBe("high");
    expect(riskLevelFromScore(79)).toBe("high");
    expect(riskLevelFromScore(80)).toBe("critical");
    expect(riskLevelFromScore(100)).toBe("critical");
  });
});

describe("purchaseRisk — blindagem contra respostas anômalas da IA", () => {
  const rnd = prng(99);

  it("limita o ajuste da IA a ±15 pontos em 300 cenários", () => {
    for (let i = 0; i < 300; i++) {
      const base = assessPurchaseRisk(randomSignals(rnd));
      const delta = Math.floor(rnd() * 400) - 200; // -200..199, inclui valores absurdos
      const adjusted = applyAiAdjustment(base, delta, "parecer");
      const expected = clampScore(base.score + Math.max(-15, Math.min(15, delta)));
      expect(adjusted.score).toBe(expected);
      expect(Math.abs(adjusted.score - base.score)).toBeLessThanOrEqual(15);
      expect(adjusted.level).toBe(riskLevelFromScore(adjusted.score));
    }
  });

  it("ignora ajustes nulos, NaN e indefinidos sem alterar a pontuação", () => {
    const base = assessPurchaseRisk({ totalCoins: 3000, accountAgeDays: 10 });
    for (const delta of [null, undefined, Number.NaN, 0]) {
      const adjusted = applyAiAdjustment(base, delta as number | null | undefined, null);
      expect(adjusted.score).toBe(base.score);
      expect(adjusted.factors).toHaveLength(base.factors.length);
      expect(adjusted.aiSummary).toBeNull();
    }
  });

  it("registra o ajuste da IA como fator auditável quando não é zero", () => {
    const base = assessPurchaseRisk({ totalCoins: 3000, accountAgeDays: 10 });
    const adjusted = applyAiAdjustment(base, 10, "  Padrão atípico de resgates.  ");
    expect(adjusted.factors.at(-1)?.code).toBe("ai_adjustment");
    expect(adjusted.aiSummary).toBe("Padrão atípico de resgates.");
  });

  it("nunca deixa a IA zerar um risco crítico", () => {
    const critical = assessPurchaseRisk({
      totalCoins: 9000,
      accountAgeDays: 1,
      purchasesLast7Days: 12,
      quantity: 6,
      cancelledLast90Days: 5,
      rarity: "legendary",
      sameRewardLast7Days: 5,
      stockRemaining: 1,
    });
    const adjusted = applyAiAdjustment(critical, -100, "IA tentando liberar");
    expect(adjusted.score).toBeGreaterThanOrEqual(critical.score - 15);
    expect(adjusted.requiresDualApproval).toBe(true);
  });
});