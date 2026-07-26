import { describe, it, expect } from "vitest";
import {
  buildNpsSeries,
  computeNpsScore,
  formatPeriodLabel,
  npsTrend,
  npsZone,
  type NpsHistoryPoint,
} from "@/lib/npsHistory";

describe("computeNpsScore — simulação combinatória", () => {
  it("cobre centenas de combinações de promotores × neutros × detratores", () => {
    let combos = 0;
    for (let p = 0; p <= 10; p++) {
      for (let n = 0; n <= 10; n++) {
        for (let d = 0; d <= 10; d++) {
          combos++;
          const score = computeNpsScore(p, n, d);
          const total = p + n + d;
          if (total === 0) {
            expect(score).toBeNull();
            continue;
          }
          expect(score).not.toBeNull();
          expect(score!).toBeGreaterThanOrEqual(-100);
          expect(score!).toBeLessThanOrEqual(100);
          expect(score).toBe(Math.round((100 * (p - d)) / total));
        }
      }
    }
    expect(combos).toBe(1331);
  });

  it("é monotônico ao trocar detratores por promotores", () => {
    let previous = -Infinity;
    for (let p = 0; p <= 20; p++) {
      const score = computeNpsScore(p, 0, 20 - p)!;
      expect(score).toBeGreaterThanOrEqual(previous);
      previous = score;
    }
    expect(previous).toBe(100);
  });

  it("sanitiza entradas corrompidas", () => {
    expect(computeNpsScore(NaN, NaN, NaN)).toBeNull();
    expect(computeNpsScore(-5, 0, 5)).toBe(-100);
    expect(computeNpsScore("3" as unknown, "0" as unknown, "1" as unknown)).toBe(50);
    expect(computeNpsScore(2.9, 0, 0)).toBe(100);
    expect(computeNpsScore(null, undefined, 4)).toBe(-100);
  });
});

describe("npsZone — fronteiras", () => {
  it("classifica todos os inteiros de -100 a 100 sem buracos", () => {
    for (let s = -100; s <= 100; s++) {
      const zone = npsZone(s);
      expect(["critical", "attention", "good", "excellent"]).toContain(zone);
      if (s < 0) expect(zone).toBe("critical");
      else if (s < 30) expect(zone).toBe("attention");
      else if (s < 70) expect(zone).toBe("good");
      else expect(zone).toBe("excellent");
    }
  });

  it("retorna unknown para dados ausentes", () => {
    expect(npsZone(null)).toBe("unknown");
    expect(npsZone(undefined)).toBe("unknown");
    expect(npsZone(NaN)).toBe("unknown");
  });
});

describe("npsTrend — faixa morta de 1 ponto", () => {
  it("valida 41 × 41 pares de variação", () => {
    for (let a = -20; a <= 20; a++) {
      for (let b = -20; b <= 20; b++) {
        const trend = npsTrend(a, b);
        const delta = a - b;
        if (Math.abs(delta) < 1) expect(trend).toBe("flat");
        else if (delta > 0) expect(trend).toBe("up");
        else expect(trend).toBe("down");
      }
    }
  });

  it("é unknown quando falta algum lado", () => {
    expect(npsTrend(null, 10)).toBe("unknown");
    expect(npsTrend(10, null)).toBe("unknown");
    expect(npsTrend(NaN, 1)).toBe("unknown");
  });
});

describe("formatPeriodLabel", () => {
  it("gera rótulos mensais e semanais válidos para 24 períodos", () => {
    for (let m = 0; m < 24; m++) {
      const date = new Date(Date.UTC(2025, m, 1)).toISOString().slice(0, 10);
      expect(formatPeriodLabel(date)).toMatch(/^[a-zç]{3}\/\d{2}$/i);
      expect(formatPeriodLabel(date, "week")).toMatch(/^\d{2}\/\d{2}$/);
    }
  });

  it("não quebra com datas inválidas", () => {
    expect(formatPeriodLabel("não-é-data")).toBe("não-é-data");
    expect(formatPeriodLabel("")).toBe("");
  });
});

describe("buildNpsSeries — cenários de integração", () => {
  const row = (over: Partial<NpsHistoryPoint>): NpsHistoryPoint => ({
    metric: "eNPS",
    period_start: "2026-01-01",
    score: null,
    promoters: 0,
    passives: 0,
    detractors: 0,
    respondents: 5,
    ...over,
  });

  it("ordena cronologicamente mesmo com linhas embaralhadas", () => {
    const rows = ["2026-03-01", "2026-01-01", "2026-02-01"].map((d, i) =>
      row({ period_start: d, promoters: i + 1, detractors: 1 }),
    );
    const [serie] = buildNpsSeries(rows);
    expect(serie.points.map((p) => p.periodStart)).toEqual([
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
    ]);
    expect(serie.latest).toBe(serie.points[2].score);
    expect(serie.previous).toBe(serie.points[1].score);
    expect(serie.delta).toBe(serie.latest! - serie.previous!);
  });

  it("separa métricas e ordena alfabeticamente", () => {
    const series = buildNpsSeries([
      row({ metric: "LNPS", promoters: 4 }),
      row({ metric: "eNPS", promoters: 2 }),
    ]);
    expect(series.map((s) => s.metric)).toEqual(["LNPS", "eNPS"]);
  });

  it("descarta linhas inválidas sem lançar", () => {
    const series = buildNpsSeries([
      row({}),
      { ...row({}), metric: "" },
      { ...row({}), period_start: "" },
      null as unknown as NpsHistoryPoint,
    ]);
    expect(series).toHaveLength(1);
    expect(series[0].points).toHaveLength(1);
  });

  it("aceita lista vazia ou nula", () => {
    expect(buildNpsSeries([])).toEqual([]);
    expect(buildNpsSeries(null)).toEqual([]);
    expect(buildNpsSeries(undefined)).toEqual([]);
  });

  it("recalcula o score quando o banco devolve null", () => {
    const [serie] = buildNpsSeries([row({ score: null, promoters: 8, detractors: 2 })]);
    expect(serie.points[0].score).toBe(60);
  });

  it("mantém best/worst coerentes em 12 períodos simulados", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      row({
        period_start: new Date(Date.UTC(2025, i, 1)).toISOString().slice(0, 10),
        promoters: i,
        detractors: 12 - i,
      }),
    );
    const [serie] = buildNpsSeries(rows);
    const scores = serie.points.map((p) => p.score!);
    expect(serie.best).toBe(Math.max(...scores));
    expect(serie.worst).toBe(Math.min(...scores));
    expect(serie.trend).toBe("up");
  });

  it("é determinístico sob permutações aleatórias", () => {
    const base = Array.from({ length: 8 }, (_, i) =>
      row({
        period_start: new Date(Date.UTC(2026, i, 1)).toISOString().slice(0, 10),
        promoters: (i * 3) % 7,
        passives: i % 4,
        detractors: (i * 5) % 6,
      }),
    );
    const reference = JSON.stringify(buildNpsSeries(base));
    for (let attempt = 0; attempt < 50; attempt++) {
      const shuffled = [...base].sort(() => Math.random() - 0.5);
      expect(JSON.stringify(buildNpsSeries(shuffled))).toBe(reference);
    }
  });
});
