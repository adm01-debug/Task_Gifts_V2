import { describe, expect, it } from "vitest";
import {
  chiSquareCritical,
  decidePayoutAlerts,
  payoutDegreesOfFreedom,
} from "@/lib/luckyWheelPayoutAlerts";
import { buildPayoutReport, type PayoutSpin } from "@/lib/luckyWheelPayout";
import type { OddsPrize } from "@/lib/luckyWheelOdds";

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRIZES: OddsPrize[] = [
  { id: "p1", label: "10 moedas", prize_type: "coins", amount: 10, weight: 5, is_active: true, achievement_id: null, rarity: "common" },
  { id: "p2", label: "50 XP", prize_type: "xp", amount: 50, weight: 3, is_active: true, achievement_id: null, rarity: "rare" },
  { id: "p3", label: "Nada", prize_type: "nothing", amount: 0, weight: 2, is_active: true, achievement_id: null, rarity: "common" },
] as OddsPrize[];

const TOTAL_WEIGHT = PRIZES.reduce((a, p) => a + p.weight, 0);

/** Mesmo laço de sorteio da RPC: acumula pesos e escolhe o setor. */
function pickPrize(rnd: number): OddsPrize {
  let acc = 0;
  const target = rnd * TOTAL_WEIGHT;
  for (const p of PRIZES) {
    acc += p.weight;
    if (target < acc) return p;
  }
  return PRIZES[PRIZES.length - 1];
}

function honestSpins(count: number, rnd: () => number, date = "2026-07-20"): PayoutSpin[] {
  return Array.from({ length: count }, (_, i) => {
    const p = pickPrize(rnd());
    return {
      id: `s${i}`,
      user_id: `u${i}`,
      prize_id: p.id,
      prize_label: p.label,
      prize_type: p.prize_type,
      amount: p.amount,
      created_at: `${date}T${String(i % 24).padStart(2, "0")}:00:00.000Z`,
    } as PayoutSpin;
  });
}

const OPTS = { date: "2026-07-20" };

describe("chiSquareCritical", () => {
  it.each([
    [1, 0.01, 6.63],
    [2, 0.01, 9.21],
    [3, 0.01, 11.34],
    [5, 0.01, 15.09],
    [10, 0.01, 23.21],
    [1, 0.05, 3.84],
    [4, 0.05, 9.49],
    [10, 0.05, 18.31],
  ])("df=%s p=%s aproxima o valor tabelado %s", (df, p, expected) => {
    const got = chiSquareCritical(df as number, p as number);
    expect(Math.abs(got - (expected as number)) / (expected as number)).toBeLessThan(0.03);
  });

  it("é monótona crescente em df e decrescente em p", () => {
    for (let df = 1; df < 40; df += 1) {
      expect(chiSquareCritical(df + 1, 0.01)).toBeGreaterThan(chiSquareCritical(df, 0.01));
      expect(chiSquareCritical(df, 0.0001)).toBeGreaterThan(chiSquareCritical(df, 0.01));
    }
  });

  it.each([[0, 0.01], [-3, 0.01], [Number.NaN, 0.01], [5, 0], [5, 1], [5, Number.NaN]])(
    "devolve Infinity para entrada inválida df=%s p=%s",
    (df, p) => {
      expect(chiSquareCritical(df as number, p as number)).toBe(Infinity);
    },
  );
});

describe("decidePayoutAlerts — ausência de falso positivo", () => {
  it("300 dias honestos com 200 giros não geram alerta de distribuição", () => {
    let falsePositives = 0;
    for (let seed = 0; seed < 300; seed += 1) {
      const rnd = mulberry(seed + 5000);
      const report = buildPayoutReport(honestSpins(200, rnd), PRIZES);
      const alerts = decidePayoutAlerts(report, OPTS);
      if (alerts.some((a) => a.alertType === "lucky_wheel_chi_square")) falsePositives += 1;
    }
    // Nível nominal de 1% — tolerância folgada para variação amostral.
    expect(falsePositives).toBeLessThanOrEqual(12);
  });

  it("nunca alerta distribuição abaixo da amostra mínima", () => {
    for (let n = 0; n < 50; n += 1) {
      const report = buildPayoutReport(honestSpins(n, mulberry(n + 1)), PRIZES);
      expect(decidePayoutAlerts(report, OPTS).some((a) => a.alertType === "lucky_wheel_chi_square")).toBe(false);
    }
  });

  it("relatório vazio não produz nenhum alerta", () => {
    expect(decidePayoutAlerts(buildPayoutReport([], []), OPTS)).toEqual([]);
    expect(decidePayoutAlerts(buildPayoutReport([], PRIZES), OPTS)).toEqual([]);
  });
});

describe("decidePayoutAlerts — sensibilidade", () => {
  it("detecta setor viciado em 100% dos casos", () => {
    for (let seed = 0; seed < 60; seed += 1) {
      const rnd = mulberry(seed + 9000);
      const spins = honestSpins(300, rnd).map((s, i) =>
        i % 2 === 0
          ? { ...s, prize_id: "p2", prize_label: "50 XP", prize_type: "xp", amount: 50 }
          : s,
      );
      const alerts = decidePayoutAlerts(buildPayoutReport(spins as PayoutSpin[], PRIZES), OPTS);
      expect(alerts.some((a) => a.alertType === "lucky_wheel_chi_square")).toBe(true);
    }
  });

  it("escala para crítico quando o desvio é extremo", () => {
    const spins = honestSpins(300, mulberry(3)).map((s) => ({
      ...s,
      prize_id: "p1",
      prize_label: "10 moedas",
      prize_type: "coins" as const,
      amount: 10,
    }));
    const alert = decidePayoutAlerts(buildPayoutReport(spins as PayoutSpin[], PRIZES), OPTS)
      .find((a) => a.alertType === "lucky_wheel_chi_square");
    expect(alert?.severity).toBe("critical");
  });

  it("detecta adulteração de valor pago como desvio de custo", () => {
    const spins = honestSpins(200, mulberry(11)).map((s) =>
      s.prize_type === "coins" ? { ...s, amount: s.amount * 10 } : s,
    );
    const alerts = decidePayoutAlerts(buildPayoutReport(spins as PayoutSpin[], PRIZES), OPTS);
    expect(alerts.some((a) => a.alertType === "lucky_wheel_cost_deviation")).toBe(true);
  });

  it("abre alerta crítico para giro duplicado", () => {
    const base = honestSpins(60, mulberry(5));
    const dup = { ...base[0], id: base[0].id };
    const alerts = decidePayoutAlerts(buildPayoutReport([...base, dup], PRIZES), OPTS);
    const found = alerts.find((a) => a.alertType === "lucky_wheel_duplicate_spins");
    expect(found?.severity).toBe("critical");
  });

  it("abre alerta para prêmio fora da calibração", () => {
    const spins = [
      ...honestSpins(60, mulberry(6)),
      { id: "ghost", user_id: "ux", prize_id: null, prize_label: "Fantasma", prize_type: "coins", amount: 5, created_at: "2026-07-20T01:00:00.000Z" } as PayoutSpin,
    ];
    const alerts = decidePayoutAlerts(buildPayoutReport(spins, PRIZES), OPTS);
    expect(alerts.some((a) => a.alertType === "lucky_wheel_unconfigured_prizes")).toBe(true);
  });
});

describe("decidePayoutAlerts — contrato de saída", () => {
  it("500 cenários aleatórios respeitam todas as invariantes", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 500; seed += 1) {
      const rnd = mulberry(seed + 77);
      const n = Math.floor(rnd() * 400);
      let spins = honestSpins(n, rnd);
      if (rnd() > 0.7) spins = spins.map((s) => ({ ...s, amount: s.amount * (1 + Math.floor(rnd() * 20)) }));
      if (rnd() > 0.8 && spins.length > 1) spins.push({ ...spins[0] });
      const report = buildPayoutReport(spins, PRIZES);
      const alerts = decidePayoutAlerts(report, { date: "2026-07-20" });

      const keys = alerts.map((a) => a.dedupeKey);
      expect(new Set(keys).size).toBe(keys.length);
      for (const a of alerts) {
        expect(a.alertType.startsWith("lucky_wheel_")).toBe(true);
        expect(["low", "medium", "high", "critical"]).toContain(a.severity);
        expect(a.title.length).toBeGreaterThan(0);
        expect(a.description).not.toMatch(/NaN|Infinity|undefined/);
        expect(a.dedupeKey).toBe(`${a.alertType}:2026-07-20`);
        for (const value of Object.values(a.metadata)) {
          if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
        }
        seen.add(a.alertType);
      }
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("é determinístico e idempotente para o mesmo relatório", () => {
    const report = buildPayoutReport(honestSpins(250, mulberry(42)), PRIZES);
    const a = decidePayoutAlerts(report, OPTS);
    const b = decidePayoutAlerts(report, OPTS);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("tolera data ausente sem gerar chave malformada", () => {
    const base = honestSpins(60, mulberry(8));
    const alerts = decidePayoutAlerts(buildPayoutReport([...base, { ...base[0] }], PRIZES), { date: "" });
    expect(alerts[0]?.dedupeKey.endsWith(":sem-data")).toBe(true);
  });

  it("respeita limiares customizados", () => {
    const report = buildPayoutReport(honestSpins(200, mulberry(21)), PRIZES);
    const strict = decidePayoutAlerts(report, { ...OPTS, warnP: 0.999999, criticalP: 0.99 });
    expect(strict.some((a) => a.alertType === "lucky_wheel_chi_square")).toBe(true);
    const loose = decidePayoutAlerts(report, { ...OPTS, minSpins: 100000 });
    expect(loose.some((a) => a.alertType === "lucky_wheel_chi_square")).toBe(false);
  });
});

describe("payoutDegreesOfFreedom", () => {
  it("nunca é negativo", () => {
    expect(payoutDegreesOfFreedom(buildPayoutReport([], []))).toBe(0);
    expect(payoutDegreesOfFreedom(buildPayoutReport(honestSpins(100, mulberry(2)), PRIZES))).toBe(2);
  });
});
