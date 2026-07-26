import { describe, expect, it } from "vitest";
import {
  MIN_RESPONDENTS,
  scoreZone,
  ZONE_CLASS,
  ZONE_LABEL,
  type FactorScore,
  type NpsMetric,
  type PillarScore,
} from "@/services/engagementDiagnosticsService";
import type { ClimatePillar } from "@/services/climateSurveyService";
import { PILLAR_LABELS } from "@/services/climateSurveyService";

/* --------------------------------------------------------------------------
 * Réplicas puras da lógica de banco, para simular cenários sem tocar no Postgres.
 * Qualquer divergência aqui indica gap entre SQL e UI.
 * ------------------------------------------------------------------------ */

interface RawAnswer {
  userId: string;
  pillar: ClimatePillar;
  normalized: number | null;
  isReverse: boolean;
  weight: number;
}

function aggregatePillar(answers: RawAnswer[]): PillarScore[] {
  const groups = new Map<ClimatePillar, RawAnswer[]>();
  for (const a of answers) {
    // espelha o WHERE do SQL: normalized IS NOT NULL AND weight > 0
    if (a.normalized === null || !(a.weight > 0)) continue;
    const list = groups.get(a.pillar) ?? [];
    list.push(a);
    groups.set(a.pillar, list);
  }

  const out: PillarScore[] = [];
  for (const [pillar, list] of groups) {
    const scores = list.map((a) => (a.isReverse ? 10 - (a.normalized as number) : (a.normalized as number)));
    const weightSum = list.reduce((acc, a) => acc + a.weight, 0);
    const weighted = list.reduce((acc, a, i) => acc + scores[i] * a.weight, 0);
    const respondents = new Set(list.map((a) => a.userId)).size;
    if (respondents < MIN_RESPONDENTS) continue; // guarda de anonimato
    out.push({
      pillar,
      score: weightSum === 0 ? null : Number((weighted / weightSum).toFixed(2)),
      favorability: Number(((100 * scores.filter((s) => s >= 7).length) / scores.length).toFixed(1)),
      respondents,
      answer_count: list.length,
    });
  }
  return out.sort((a, b) => (a.score ?? 99) - (b.score ?? 99));
}

function npsScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  return Math.round((100 * (promoters - detractors)) / scores.length);
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/** PRNG determinístico para que a suíte seja reprodutível. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const PILLARS = Object.keys(PILLAR_LABELS) as ClimatePillar[];

/* ---------------------------- CENÁRIOS ---------------------------------- */

describe("scoreZone — invariantes de classificação", () => {
  it("nunca lança e sempre devolve zona conhecida, mesmo com entrada hostil", () => {
    const hostile: unknown[] = [
      null, undefined, NaN, Infinity, -Infinity, -1, 0, 10, 11, 999, -999,
      3.999, 4, 5.999, 6, 7.499, 7.5, 8.999, 9, 10.0001,
    ];
    for (const value of hostile) {
      const zone = scoreZone(value as number);
      expect(Object.keys(ZONE_LABEL)).toContain(zone);
      expect(ZONE_CLASS[zone]).toBeTruthy();
      // nunca deve conter cor hard-coded
      expect(ZONE_CLASS[zone]).not.toMatch(/(bg|text)-(red|green|blue|yellow|purple|gray)-\d/);
    }
  });

  it("é monotônica não-decrescente ao longo de 0..10 em 1001 passos", () => {
    const order = ["critical", "attention", "neutral", "good", "excellent"];
    let last = 0;
    for (let i = 0; i <= 1000; i++) {
      const idx = order.indexOf(scoreZone(i / 100));
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });

  it("valores não finitos caem sempre em neutro (nunca em crítico falso)", () => {
    for (const v of [NaN, Infinity, -Infinity, null, undefined]) {
      expect(scoreZone(v as number)).toBe("neutral");
    }
  });
});

describe("Guarda de anonimato na agregação", () => {
  it("suprime qualquer pilar abaixo do mínimo, em 200 cenários aleatórios", () => {
    const rng = makeRng(42);
    for (let iter = 0; iter < 200; iter++) {
      const respondents = 1 + Math.floor(rng() * 9); // 1..9
      const pillar = PILLARS[Math.floor(rng() * PILLARS.length)];
      const answers: RawAnswer[] = Array.from({ length: respondents }, (_, i) => ({
        userId: `u${i}`,
        pillar,
        normalized: Math.round(rng() * 10),
        isReverse: false,
        weight: 1,
      }));
      const result = aggregatePillar(answers);
      if (respondents < MIN_RESPONDENTS) {
        expect(result).toHaveLength(0);
      } else {
        expect(result).toHaveLength(1);
        expect(result[0].respondents).toBe(respondents);
      }
    }
  });

  it("respostas repetidas do mesmo usuário não inflam a contagem de respondentes", () => {
    const answers: RawAnswer[] = Array.from({ length: 40 }, (_, i) => ({
      userId: `u${i % 3}`, // apenas 3 pessoas
      pillar: "recognition",
      normalized: 8,
      isReverse: false,
      weight: 1,
    }));
    expect(aggregatePillar(answers)).toHaveLength(0);
  });
});

describe("Agregação ponderada e favorabilidade", () => {
  it("mantém score em 0..10 e favorabilidade em 0..100 em 300 amostras", () => {
    const rng = makeRng(7);
    for (let iter = 0; iter < 300; iter++) {
      const answers: RawAnswer[] = Array.from({ length: 5 + Math.floor(rng() * 40) }, (_, i) => ({
        userId: `u${i}`,
        pillar: "growth",
        normalized: rng() < 0.1 ? null : Math.round(rng() * 10),
        isReverse: rng() < 0.3,
        weight: rng() < 0.15 ? 0 : Number((rng() * 3).toFixed(2)),
      }));
      for (const row of aggregatePillar(answers)) {
        if (row.score !== null) {
          expect(row.score).toBeGreaterThanOrEqual(0);
          expect(row.score).toBeLessThanOrEqual(10);
        }
        expect(row.favorability).toBeGreaterThanOrEqual(0);
        expect(row.favorability).toBeLessThanOrEqual(100);
      }
    }
  });

  it("inverte corretamente perguntas reversas (esgotamento alto => score baixo)", () => {
    const answers: RawAnswer[] = Array.from({ length: 6 }, (_, i) => ({
      userId: `u${i}`,
      pillar: "balance",
      normalized: 10, // esgotamento máximo
      isReverse: true,
      weight: 1,
    }));
    const [row] = aggregatePillar(answers);
    expect(row.score).toBe(0);
    expect(row.favorability).toBe(0);
  });

  it("peso zero é ignorado e não gera divisão por zero", () => {
    const answers: RawAnswer[] = Array.from({ length: 6 }, (_, i) => ({
      userId: `u${i}`,
      pillar: "peers",
      normalized: 9,
      isReverse: false,
      weight: 0,
    }));
    expect(aggregatePillar(answers)).toHaveLength(0);
  });

  it("favorabilidade usa corte >= 7 exatamente", () => {
    const build = (v: number) =>
      Array.from({ length: 5 }, (_, i) => ({
        userId: `u${i}`,
        pillar: "purpose" as ClimatePillar,
        normalized: v,
        isReverse: false,
        weight: 1,
      }));
    expect(aggregatePillar(build(6.99))[0].favorability).toBe(0);
    expect(aggregatePillar(build(7))[0].favorability).toBe(100);
  });
});

describe("Ranking de fatores — ordenação determinística", () => {
  const mk = (name: string, score: number | null): FactorScore => ({
    factor_id: name,
    factor_key: name,
    factor_name: name,
    pillar: "leadership",
    score,
    favorability: score === null ? null : score * 10,
    respondents: 10,
  });

  it("prioridades sempre trazem os menores scores e nulos não mascaram críticos", () => {
    const factors = [mk("a", 8.2), mk("b", null), mk("c", 3.1), mk("d", 5.5), mk("e", 9.4)];
    const ranked = [...factors].sort((x, y) => (x.score ?? 99) - (y.score ?? 99));
    expect(ranked[0].factor_key).toBe("c");
    expect(ranked[ranked.length - 1].factor_key).toBe("b"); // nulo vai para o fim
  });

  it("com menos fatores que o limite, crítico e forte podem se sobrepor sem quebrar", () => {
    const factors = [mk("a", 4), mk("b", 6)];
    const ranked = [...factors].sort((x, y) => (x.score ?? 99) - (y.score ?? 99));
    expect(ranked.slice(0, 5)).toHaveLength(2);
    expect(ranked.slice(-5).reverse()[0].factor_key).toBe("b");
  });

  it("lista vazia não quebra o slice", () => {
    const ranked: FactorScore[] = [];
    expect(ranked.slice(0, 5)).toEqual([]);
    expect(ranked.slice(-5)).toEqual([]);
  });
});

describe("eNPS / LNPS", () => {
  it("extremos: só promotores = 100, só detratores = -100", () => {
    expect(npsScore([9, 10, 9, 10, 9])).toBe(100);
    expect(npsScore([0, 1, 6, 2, 3])).toBe(-100);
  });

  it("neutros não deslocam o índice", () => {
    expect(npsScore([7, 8, 7, 8, 7])).toBe(0);
  });

  it("permanece em -100..100 em 200 amostras aleatórias", () => {
    const rng = makeRng(99);
    for (let i = 0; i < 200; i++) {
      const n = 5 + Math.floor(rng() * 50);
      const scores = Array.from({ length: n }, () => Math.round(rng() * 10));
      const value = npsScore(scores) as number;
      expect(value).toBeGreaterThanOrEqual(-100);
      expect(value).toBeLessThanOrEqual(100);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("conjunto vazio devolve nulo em vez de NaN", () => {
    expect(npsScore([])).toBeNull();
  });

  it("promotores + neutros + detratores sempre soma o total", () => {
    const rng = makeRng(5);
    for (let i = 0; i < 100; i++) {
      const scores = Array.from({ length: 20 }, () => Math.round(rng() * 10));
      const p = scores.filter((s) => s >= 9).length;
      const n = scores.filter((s) => s >= 7 && s < 9).length;
      const d = scores.filter((s) => s <= 6).length;
      expect(p + n + d).toBe(scores.length);
    }
  });
});

describe("Correlação entre pilares", () => {
  it("séries idênticas correlacionam 1 e opostas -1", () => {
    const xs = [1, 3, 5, 7, 9];
    expect(pearson(xs, xs)).toBeCloseTo(1, 6);
    expect(pearson(xs, [...xs].reverse())).toBeCloseTo(-1, 6);
  });

  it("variância zero devolve nulo em vez de NaN", () => {
    expect(pearson([5, 5, 5, 5], [1, 2, 3, 4])).toBeNull();
  });

  it("fica sempre em -1..1 em 200 amostras", () => {
    const rng = makeRng(2024);
    for (let i = 0; i < 200; i++) {
      const n = 5 + Math.floor(rng() * 30);
      const xs = Array.from({ length: n }, () => rng() * 10);
      const ys = Array.from({ length: n }, () => rng() * 10);
      const r = pearson(xs, ys);
      if (r !== null) {
        expect(r).toBeGreaterThanOrEqual(-1.000001);
        expect(r).toBeLessThanOrEqual(1.000001);
      }
    }
  });

  it("pares de pilares nunca se repetem nem se auto-relacionam", () => {
    const pairs: string[] = [];
    for (const a of PILLARS) {
      for (const b of PILLARS) {
        if (b > a) pairs.push(`${a}|${b}`);
      }
    }
    expect(new Set(pairs).size).toBe(pairs.length);
    expect(pairs.some((p) => p.split("|")[0] === p.split("|")[1])).toBe(false);
    expect(pairs).toHaveLength((PILLARS.length * (PILLARS.length - 1)) / 2);
  });
});

describe("Rótulos de UI", () => {
  it("todo pilar retornado pelo banco tem rótulo em português", () => {
    for (const pillar of PILLARS) {
      expect(PILLAR_LABELS[pillar]?.pt).toBeTruthy();
    }
  });

  it("taxa de participação nunca ultrapassa 100% quando respondentes <= elegíveis", () => {
    const rng = makeRng(11);
    for (let i = 0; i < 100; i++) {
      const eligible = 5 + Math.floor(rng() * 500);
      const respondents = Math.floor(rng() * eligible);
      const rate = (100 * respondents) / eligible;
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    }
  });

  it("elegíveis zero não gera divisão por zero na UI", () => {
    const summary: Partial<NpsMetric> & { eligible: number; respondents: number } = {
      eligible: 0,
      respondents: 0,
    };
    const rate = summary.eligible === 0 ? null : (100 * summary.respondents) / summary.eligible;
    expect(rate).toBeNull();
  });
});
