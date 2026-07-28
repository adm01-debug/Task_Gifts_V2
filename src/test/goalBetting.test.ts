import { describe, expect, it } from "vitest";
import {
  MAX_GOAL_BET_CANDIDATES,
  NO_WINNER_LABEL,
  buildGoalBetDraft,
  buildOptionLabels,
  impliedProbabilities,
  rankGoalBetCandidates,
  suggestGoalBetLocksAt,
  type GoalBetCandidate,
} from "@/lib/goalBetting";
import { MAX_OPTIONS, hasBlockingIssues, validatePredictionDraft } from "@/lib/predictionAdmin";

const NOW = new Date("2026-01-10T12:00:00Z").getTime();
const CAMPAIGN = {
  id: "c1",
  name: "Campanha Verão",
  metricUnit: "unidades",
  endDate: "2026-02-01",
};

function candidate(over: Partial<GoalBetCandidate> = {}): GoalBetCandidate {
  return {
    userId: over.userId ?? "u1",
    name: over.name ?? "Ana",
    progress: over.progress ?? 10,
    target: over.target ?? 100,
    progressPercent: over.progressPercent ?? 10,
    declined: over.declined,
  };
}

describe("goalBetting", () => {
  it("ordena por percentual e ignora quem recusou a meta", () => {
    const ranked = rankGoalBetCandidates([
      candidate({ userId: "a", name: "Ana", progressPercent: 20 }),
      candidate({ userId: "b", name: "Bia", progressPercent: 80 }),
      candidate({ userId: "c", name: "Caio", progressPercent: 99, declined: true }),
    ]);
    expect(ranked.map((c) => c.userId)).toEqual(["b", "a"]);
  });

  it("gera rótulos únicos para homônimos (B1)", () => {
    const labels = buildOptionLabels([
      candidate({ userId: "a", name: "Ana" }),
      candidate({ userId: "b", name: "Ana" }),
      candidate({ userId: "c", name: "  " }),
    ]);
    expect(new Set(labels).size).toBe(3);
    expect(labels.every((l) => l.trim().length > 0)).toBe(true);
  });

  it("respeita o teto de opções do servidor (B2)", () => {
    const many = Array.from({ length: MAX_OPTIONS }, (_, i) =>
      candidate({ userId: `u${i}`, name: `P${i}` }),
    );
    expect(
      buildGoalBetDraft({
        campaign: CAMPAIGN,
        candidates: many,
        minStake: 10,
        maxStakePerUser: 500,
        rakeBps: 500,
        locksAt: new Date(NOW + 86_400_000).toISOString(),
        includeNoWinner: true,
      }).error,
    ).toBe("too_many_candidates");

    const fit = many.slice(0, MAX_GOAL_BET_CANDIDATES);
    const result = buildGoalBetDraft({
      campaign: CAMPAIGN,
      candidates: fit,
      minStake: 10,
      maxStakePerUser: 500,
      rakeBps: 500,
      locksAt: new Date(NOW + 86_400_000).toISOString(),
      includeNoWinner: true,
    });
    expect(result.ok).toBe(true);
    expect(result.draft?.options).toContain(NO_WINNER_LABEL);
    expect(result.draft?.options.length).toBe(MAX_OPTIONS);
    expect(hasBlockingIssues(validatePredictionDraft(result.draft!, NOW))).toBe(false);
  });

  it("rejeita seleção vazia", () => {
    expect(
      buildGoalBetDraft({
        campaign: CAMPAIGN,
        candidates: [],
        minStake: 10,
        maxStakePerUser: 500,
        rakeBps: 500,
        locksAt: new Date(NOW + 86_400_000).toISOString(),
        includeNoWinner: true,
      }).error,
    ).toBe("no_candidates");
  });

  it("mantém o travamento dentro da janela aceita (B3)", () => {
    const near = suggestGoalBetLocksAt({ ...CAMPAIGN, endDate: "2026-01-10" }, NOW);
    expect(new Date(near).getTime()).toBeGreaterThan(NOW + 15 * 60_000);

    const far = suggestGoalBetLocksAt({ ...CAMPAIGN, endDate: "2030-01-01" }, NOW);
    expect(new Date(far).getTime()).toBeLessThan(NOW + 60 * 24 * 3_600_000);

    const invalid = suggestGoalBetLocksAt({ ...CAMPAIGN, endDate: "não-é-data" }, NOW);
    expect(Number.isFinite(new Date(invalid).getTime())).toBe(true);
  });

  it("probabilidades implícitas somam 1 ou 0 (B4)", () => {
    const withSignal = impliedProbabilities([
      candidate({ userId: "a", progressPercent: 30 }),
      candidate({ userId: "b", progressPercent: 70 }),
    ]);
    expect(Object.values(withSignal).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);

    const noSignal = impliedProbabilities([
      candidate({ userId: "a", progressPercent: 0 }),
      candidate({ userId: "b", progressPercent: -5 }),
    ]);
    expect(Object.values(noSignal).reduce((a, b) => a + b, 0)).toBe(0);
  });
});