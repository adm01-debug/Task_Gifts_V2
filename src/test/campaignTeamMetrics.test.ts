import { describe, expect, it } from "vitest";

import {
  buildTeamMetrics,
  campaignInPeriod,
  resolvePeriod,
  summarizeTeamMetrics,
  type MetricsCampaign,
  type MetricsTeam,
} from "@/lib/campaignTeamMetrics";

const campaign = (over: Partial<MetricsCampaign> = {}): MetricsCampaign => ({
  id: "c1",
  name: "Campanha",
  metric_unit: "un",
  start_date: "2026-01-01",
  end_date: "2026-03-31",
  status: "active",
  ...over,
});

const team = (over: Partial<MetricsTeam> = {}): MetricsTeam => ({
  id: "t1",
  campaign_id: "c1",
  name: "Equipe A",
  target_team: 100,
  progress: 50,
  members_count: 2,
  awarded_at: null,
  xp_awarded: 0,
  coins_awarded: 0,
  created_at: "2026-01-02T00:00:00Z",
  ...over,
});

describe("resolvePeriod", () => {
  const ref = new Date(2026, 6, 27);

  it("retorna janela aberta para todo o histórico", () => {
    expect(resolvePeriod("all", ref)).toEqual({ from: null, to: null });
  });

  it("calcula janelas relativas sem deslocamento de fuso", () => {
    expect(resolvePeriod("30d", ref)).toEqual({ from: "2026-06-27", to: "2026-07-27" });
    expect(resolvePeriod("year", ref)).toEqual({ from: "2026-01-01", to: "2026-07-27" });
  });
});

describe("campaignInPeriod", () => {
  it("inclui campanhas que intersectam a janela", () => {
    const range = { from: "2026-02-01", to: "2026-02-28" };
    expect(campaignInPeriod(campaign(), range)).toBe(true);
    expect(campaignInPeriod(campaign({ end_date: "2026-01-15" }), range)).toBe(false);
    expect(campaignInPeriod(campaign({ start_date: "2026-03-01" }), range)).toBe(false);
  });

  it("aceita tudo quando a janela é aberta", () => {
    expect(campaignInPeriod(campaign(), { from: null, to: null })).toBe(true);
  });
});

describe("buildTeamMetrics", () => {
  it("ordena por contribuição e prioriza a contagem real de membros", () => {
    const rows = buildTeamMetrics(
      [team({ id: "a", progress: 10 }), team({ id: "b", name: "Equipe B", progress: 80 })],
      [campaign()],
      new Map([["b", 4]]),
    );
    expect(rows.map((r) => r.team.id)).toEqual(["b", "a"]);
    expect(rows[0].membersCount).toBe(4);
    expect(rows[0].contributionPerMember).toBe(20);
    expect(rows[0].campaign?.name).toBe("Campanha");
  });

  it("neutraliza números inválidos e limita o percentual em 100", () => {
    const rows = buildTeamMetrics(
      [team({ progress: Number.NaN, target_team: 0, xp_awarded: Number.POSITIVE_INFINITY })],
      [campaign()],
    );
    expect(rows[0].contribution).toBe(0);
    expect(rows[0].xpPaid).toBe(0);
    expect(rows[0].progressPercent).toBe(0);
    expect(rows[0].reachedGoal).toBe(false);

    const over = buildTeamMetrics([team({ progress: 500 })], [campaign()]);
    expect(over[0].progressPercent).toBe(100);
    expect(over[0].reachedGoal).toBe(true);
  });
});

describe("summarizeTeamMetrics", () => {
  it("consolida contribuição, atingimento médio e pagamentos", () => {
    const rows = buildTeamMetrics(
      [
        team({ id: "a", progress: 100, xp_awarded: 200, coins_awarded: 50, awarded_at: "2026-04-01" }),
        team({ id: "b", campaign_id: "c2", name: "Equipe B", progress: 50 }),
      ],
      [campaign(), campaign({ id: "c2", name: "Outra" })],
      new Map([
        ["a", 3],
        ["b", 2],
      ]),
    );
    const summary = summarizeTeamMetrics(rows);
    expect(summary).toMatchObject({
      teams: 2,
      campaigns: 2,
      members: 5,
      contribution: 150,
      target: 200,
      goalsReached: 1,
      xpPaid: 200,
      coinsPaid: 50,
      teamsPaid: 1,
    });
    expect(summary.averageProgress).toBeCloseTo(75, 5);
  });

  it("é seguro com recorte vazio", () => {
    expect(summarizeTeamMetrics([]).averageProgress).toBe(0);
  });
});