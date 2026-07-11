import { describe, it, expect } from "vitest";
import {
  predictEngagement,
  computeEngagementScore,
  classifyTrend,
  type EngagementSignals,
} from "@/services/predictiveFeedbackService";

const base: EngagementSignals = {
  streak: 7,
  daysInactive: 0,
  recentXpGain: 250,
  punctualityRate: 0.9,
  questsCompleted7d: 5,
};

describe("predictiveFeedbackService — pure logic", () => {
  it("returns a bounded score between 0 and 100", () => {
    const s = computeEngagementScore(base);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it("classifies critical when inactive for a week or more", () => {
    expect(classifyTrend(80, 7)).toBe("critical");
    expect(classifyTrend(80, 10)).toBe("critical");
  });

  it("classifies critical for very low score regardless of inactivity", () => {
    expect(classifyTrend(10, 0)).toBe("critical");
  });

  it("classifies rising for high engagement scores", () => {
    expect(classifyTrend(85, 0)).toBe("rising");
  });

  it("classifies declining, stable and rising by score bands", () => {
    expect(classifyTrend(30, 0)).toBe("declining");
    expect(classifyTrend(55, 0)).toBe("stable");
    expect(classifyTrend(75, 0)).toBe("rising");
  });

  it("caps normalized inputs — extreme values do not exceed 100", () => {
    const extreme = {
      streak: 999,
      daysInactive: 0,
      recentXpGain: 999999,
      punctualityRate: 5,
      questsCompleted7d: 999,
    };
    expect(computeEngagementScore(extreme)).toBeLessThanOrEqual(100);
  });

  it("penalizes inactivity — 0 days beats 5 days for same signals", () => {
    const active = computeEngagementScore({ ...base, daysInactive: 0 });
    const stale = computeEngagementScore({ ...base, daysInactive: 5 });
    expect(active).toBeGreaterThan(stale);
  });

  it("returns a headline and at most 3 suggestions", () => {
    const feedback = predictEngagement({ ...base, daysInactive: 4, punctualityRate: 0.3, questsCompleted7d: 0, recentXpGain: 10 });
    expect(feedback.headline.length).toBeGreaterThan(0);
    expect(feedback.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("confidence grows with evidence and is bounded 0.4..1", () => {
    const empty = predictEngagement({ streak: 0, daysInactive: 10, recentXpGain: 0, punctualityRate: 0, questsCompleted7d: 0 });
    const full = predictEngagement(base);
    expect(empty.confidence).toBeGreaterThanOrEqual(0.4);
    expect(full.confidence).toBeLessThanOrEqual(1);
    expect(full.confidence).toBeGreaterThan(empty.confidence);
  });

  it("is deterministic for the same input", () => {
    const a = predictEngagement(base);
    const b = predictEngagement(base);
    expect(a).toEqual(b);
  });
});