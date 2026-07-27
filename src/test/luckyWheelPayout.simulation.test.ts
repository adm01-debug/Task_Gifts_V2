import { describe, expect, it } from "vitest";

import { projectWheel, resolvePrizeIndex, type OddsPrize } from "@/lib/luckyWheelOdds";
import {
  buildPayoutReport,
  payoutSeverity,
  type PayoutSpin,
} from "@/lib/luckyWheelPayout";

/** PRNG determinístico (mulberry32) para simulações reprodutíveis. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function prize(over: Partial<OddsPrize> & { id: string }): OddsPrize {
  return {
    label: `Prêmio ${over.id}`,
    prize_type: "coins",
    amount: 10,
    weight: 10,
    rarity: "common",
    is_active: true,
    achievement_id: null,
    ...over,
  };
}

const BASE: OddsPrize[] = [
  prize({ id: "p1", label: "10 moedas", prize_type: "coins", amount: 10, weight: 400 }),
  prize({ id: "p2", label: "50 moedas", prize_type: "coins", amount: 50, weight: 150 }),
  prize({ id: "p3", label: "25 XP", prize_type: "xp", amount: 25, weight: 250 }),
  prize({ id: "p4", label: "Nada", prize_type: "nothing", amount: 0, weight: 180 }),
  prize({ id: "p5", label: "Conquista", prize_type: "achievement", amount: 0, weight: 20 }),
];

function spinFor(p: OddsPrize, index: number, day = "2026-07-01", user = `u${index}`): PayoutSpin {
  return {
    id: `s${index}`,
    user_id: user,
    prize_id: p.id,
    prize_label: p.label,
    prize_type: p.prize_type,
    amount: p.amount,
    spin_date: day,
    created_at: `${day}T12:00:00.000Z`,
  };
}

/** Gera giros usando exatamente o mesmo laço da RPC (via resolvePrizeIndex). */
function simulateSpins(prizes: OddsPrize[], count: number, seed: number): PayoutSpin[] {
  const random = rng(seed);
  const active = prizes.filter((p) => p.is_active);
  const total = active.reduce((s, p) => s + p.weight, 0);
  const out: PayoutSpin[] = [];
  for (let i = 0; i < count; i += 1) {
    const roll = Math.floor(random() * total);
    const idx = resolvePrizeIndex(prizes, roll);
    const day = `2026-07-${String((i % 28) + 1).padStart(2, "0")}`;
    out.push(spinFor(active[idx], i, day, `u${i % 500}`));
  }
  return out;
}

describe("payout — convergência estatística", () => {
  it("100.000 giros simulados ficam dentro da faixa de normalidade (|z| < 3.5)", () => {
    const spins = simulateSpins(BASE, 100_000, 20260727);
    const report = buildPayoutReport(spins, BASE);

    expect(report.totals.spins).toBe(100_000);
    for (const r of report.prizes) {
      expect(r.status).not.toBe("unconfigured");
      if (r.status !== "insufficient") expect(Math.abs(r.zScore)).toBeLessThan(3.5);
    }
    expect(report.alerts.some((a) => a.code === "distribution_drift")).toBe(false);
  });

  it("custo realizado converge para o projetado em amostra grande (< 3%)", () => {
    const spins = simulateSpins(BASE, 60_000, 7);
    const report = buildPayoutReport(spins, BASE);
    const drift = Math.abs(report.coinsDelta) / report.projectedCoins;
    expect(drift).toBeLessThan(0.03);
    expect(report.coinsRatio).toBeGreaterThan(0.97);
    expect(report.coinsRatio).toBeLessThan(1.03);
  });

  it("200 amostras independentes: no máximo 5% dos setores marcados como anomalia", () => {
    let sectors = 0;
    let anomalies = 0;
    for (let seed = 1; seed <= 200; seed += 1) {
      const report = buildPayoutReport(simulateSpins(BASE, 1_200, seed), BASE);
      for (const r of report.prizes) {
        if (r.status === "insufficient") continue;
        sectors += 1;
        if (r.status === "anomaly") anomalies += 1;
      }
    }
    expect(sectors).toBeGreaterThan(500);
    expect(anomalies / sectors).toBeLessThan(0.05);
  });
});

describe("payout — detecção de manipulação", () => {
  it("detecta setor viciado (peso ignorado pelo servidor)", () => {
    const spins: PayoutSpin[] = [];
    // 5.000 giros onde o prêmio raro de 50 moedas sai 50% das vezes.
    for (let i = 0; i < 5_000; i += 1) {
      const p = i % 2 === 0 ? BASE[1] : BASE[0];
      spins.push(spinFor(p, i, `2026-07-${String((i % 28) + 1).padStart(2, "0")}`, `u${i % 400}`));
    }
    const report = buildPayoutReport(spins, BASE);
    const rare = report.prizes.find((r) => r.prizeId === "p2");
    expect(rare?.status).toBe("anomaly");
    expect(report.alerts.some((a) => a.code === "distribution_drift")).toBe(true);
    expect(report.alerts.some((a) => a.code === "cost_drift")).toBe(true);
    expect(["warning", "error"]).toContain(payoutSeverity(report));
  });

  it("detecta valor pago diferente do configurado (adulteração de amount)", () => {
    const spins = simulateSpins(BASE, 300, 42).map((s, i) =>
      i % 10 === 0 ? { ...s, amount: s.amount + 999 } : s,
    );
    const report = buildPayoutReport(spins, BASE);
    const mismatches = report.prizes.reduce((sum, r) => sum + r.amountMismatches, 0);
    expect(mismatches).toBeGreaterThan(0);
    expect(report.alerts.some((a) => a.code === "amount_mismatch")).toBe(true);
    expect(payoutSeverity(report)).toBe("error");
  });

  it("detecta violação de um giro por usuário por dia", () => {
    const spins = [
      spinFor(BASE[0], 1, "2026-07-01", "u1"),
      { ...spinFor(BASE[0], 2, "2026-07-01", "u1"), id: "s2" },
      spinFor(BASE[0], 3, "2026-07-02", "u1"),
    ];
    const report = buildPayoutReport(spins, BASE);
    expect(report.duplicateSpins).toBe(1);
    expect(report.alerts.some((a) => a.code === "duplicate_spins")).toBe(true);
  });

  it("300 cenários com fraude injetada: sempre há pelo menos um alerta", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const random = rng(seed);
      const spins = simulateSpins(BASE, 400, seed);
      const mode = seed % 3;
      if (mode === 0) {
        spins.push({ ...spinFor(BASE[1], 999, "2026-07-05", "hacker"), amount: 100_000 });
      } else if (mode === 1) {
        const day = "2026-07-09";
        spins.push(spinFor(BASE[0], 1001, day, "dup"), { ...spinFor(BASE[0], 1002, day, "dup"), id: "x2" });
      } else {
        spins.push({
          ...spinFor(BASE[0], 1003, "2026-07-11", "ghost"),
          prize_id: `fantasma-${Math.floor(random() * 1000)}`,
          prize_label: "Prêmio removido",
          amount: 5_000,
        });
      }
      const report = buildPayoutReport(spins, BASE);
      expect(report.alerts.length).toBeGreaterThan(0);
      expect(["error", "warning"]).toContain(payoutSeverity(report));
    }
  });
});

describe("payout — invariantes contábeis", () => {
  it("400 amostras aleatórias: soma dos setores fecha com os totais", () => {
    for (let seed = 1; seed <= 400; seed += 1) {
      const size = 1 + Math.floor(rng(seed)() * 500);
      const spins = simulateSpins(BASE, size, seed);
      const report = buildPayoutReport(spins, BASE);

      const observed = report.prizes.reduce((s, r) => s + r.observed, 0);
      const coins = report.prizes.reduce((s, r) => s + r.coinsPaid, 0);
      const xp = report.prizes.reduce((s, r) => s + r.xpPaid, 0);
      const dailySpins = report.daily.reduce((s, d) => s + d.spins, 0);
      const dailyCoins = report.daily.reduce((s, d) => s + d.coins, 0);

      expect(observed).toBe(report.totals.spins);
      expect(coins).toBe(report.totals.coinsPaid);
      expect(xp).toBe(report.totals.xpPaid);
      expect(dailySpins).toBe(report.totals.spins);
      expect(dailyCoins).toBe(report.totals.coinsPaid);
      expect(report.coinsDelta).toBeCloseTo(report.totals.coinsPaid - report.projectedCoins, 6);
    }
  });

  it("shares somam 1 quando há giros e 0 quando não há", () => {
    const report = buildPayoutReport(simulateSpins(BASE, 777, 99), BASE);
    const sum = report.prizes.reduce((s, r) => s + r.observedShare, 0);
    expect(sum).toBeCloseTo(1, 9);

    const empty = buildPayoutReport([], BASE);
    expect(empty.totals.spins).toBe(0);
    expect(empty.prizes.every((r) => r.observedShare === 0)).toBe(true);
    expect(empty.alerts.some((a) => a.code === "no_spins")).toBe(true);
    expect(Number.isFinite(empty.coinsRatio)).toBe(true);
  });

  it("dias são ordenados cronologicamente e sem duplicatas", () => {
    const report = buildPayoutReport(simulateSpins(BASE, 2_000, 5), BASE);
    const dates = report.daily.map((d) => d.date);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("expectedShare por setor bate com a projeção de odds", () => {
    const projection = projectWheel(BASE);
    const report = buildPayoutReport(simulateSpins(BASE, 500, 3), BASE);
    for (const odd of projection.odds) {
      const row = report.prizes.find((r) => r.prizeId === odd.id);
      expect(row?.expectedShare).toBeCloseTo(odd.probability, 12);
    }
  });
});

describe("payout — dados hostis e degradação segura", () => {
  const hostileValues: unknown[] = [null, undefined, NaN, Infinity, -Infinity, -50, "abc", "12", 3.9, {}, []];

  it("121 combinações de amount/prize_type hostis não quebram o relatório", () => {
    const types: unknown[] = ["coins", "xp", "nothing", "achievement", null, undefined, 7, "", "COINS", {}, []];
    for (const amount of hostileValues) {
      for (const type of types) {
        const spins = [
          {
            id: "h1",
            user_id: "u1",
            prize_id: "p1",
            prize_label: "10 moedas",
            prize_type: type,
            amount,
            spin_date: "2026-07-01",
            created_at: "2026-07-01T10:00:00Z",
          } as unknown as PayoutSpin,
        ];
        const report = buildPayoutReport(spins, BASE);
        expect(report.totals.spins).toBe(1);
        expect(report.totals.coinsPaid).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(report.totals.coinsPerSpin)).toBe(true);
        expect(Number.isFinite(report.chiSquare)).toBe(true);
      }
    }
  });

  it("entradas nulas na lista de giros são ignoradas sem exceção", () => {
    const spins = [null, undefined, spinFor(BASE[0], 1), 42, "texto"] as unknown as PayoutSpin[];
    const report = buildPayoutReport(spins, BASE);
    expect(report.totals.spins).toBe(1);
  });

  it("datas inválidas caem para o bucket 'desconhecido' sem duplicar dias", () => {
    const spins: PayoutSpin[] = [
      { ...spinFor(BASE[0], 1), spin_date: "data-ruim", created_at: "também-ruim" },
      { ...spinFor(BASE[0], 2), spin_date: "", created_at: "2026-07-03T00:00:00Z", user_id: "u2" },
      { ...spinFor(BASE[0], 3), spin_date: "2026-07-03", user_id: "u3" },
    ];
    const report = buildPayoutReport(spins, BASE);
    const dates = report.daily.map((d) => d.date);
    expect(dates).toContain("desconhecido");
    expect(dates.filter((d) => d === "2026-07-03")).toHaveLength(1);
  });

  it("roleta sem prêmios ativos não gera divisão por zero", () => {
    const inactive = BASE.map((p) => ({ ...p, is_active: false }));
    const report = buildPayoutReport(simulateSpins(BASE, 50, 11), inactive);
    expect(report.projectedCoins).toBe(0);
    expect(report.coinsRatio).toBe(0);
    expect(report.unconfiguredSpins).toBe(report.totals.spins);
    expect(report.alerts.some((a) => a.code === "unprojected_cost")).toBe(true);
  });

  it("giro sem prize_id casa pelo rótulo, sem contar duas vezes", () => {
    const spins: PayoutSpin[] = [
      { ...spinFor(BASE[0], 1), prize_id: null },
      { ...spinFor(BASE[0], 2), user_id: "u2" },
    ];
    const report = buildPayoutReport(spins, BASE);
    const row = report.prizes.find((r) => r.prizeId === "p1");
    expect(row?.observed).toBe(2);
    expect(report.unconfiguredSpins).toBe(0);
    expect(report.prizes.reduce((s, r) => s + r.observed, 0)).toBe(2);
  });

  it("200 configurações aleatórias de prêmios não produzem NaN em nenhum campo", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const random = rng(seed * 31);
      const prizes: OddsPrize[] = Array.from({ length: 1 + Math.floor(random() * 8) }, (_, i) =>
        prize({
          id: `r${i}`,
          label: random() > 0.85 ? "" : `Setor ${i}`,
          prize_type: (["coins", "xp", "nothing", "achievement"] as const)[Math.floor(random() * 4)],
          amount: Math.floor(random() * 200) - 20,
          weight: Math.floor(random() * 300) - 30,
          is_active: random() > 0.2,
        }),
      );
      const spins = simulateSpins(prizes.some((p) => p.is_active && p.weight > 0) ? prizes : BASE, 120, seed);
      const report = buildPayoutReport(spins, prizes);

      expect(Number.isFinite(report.chiSquare)).toBe(true);
      expect(Number.isFinite(report.coinsRatio)).toBe(true);
      expect(Number.isFinite(report.coinsDelta)).toBe(true);
      for (const r of report.prizes) {
        expect(Number.isFinite(r.zScore)).toBe(true);
        expect(Number.isFinite(r.expectedCount)).toBe(true);
        expect(r.observedShare).toBeGreaterThanOrEqual(0);
        expect(r.observedShare).toBeLessThanOrEqual(1);
      }
    }
  });

  it("opções customizadas de sensibilidade são respeitadas", () => {
    const spins = simulateSpins(BASE, 3_000, 77);
    const strict = buildPayoutReport(spins, BASE, { watchZ: 0, anomalyZ: 0, minExpected: 0 });
    expect(strict.prizes.every((r) => r.status === "anomaly" || r.status === "unconfigured")).toBe(true);

    const lax = buildPayoutReport(spins, BASE, { anomalyZ: 1e9, watchZ: 1e9 });
    expect(lax.prizes.some((r) => r.status === "anomaly")).toBe(false);
  });
});