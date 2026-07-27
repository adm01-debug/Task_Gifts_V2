import { describe, expect, it } from "vitest";

import {
  revertCampaignTeamSplit,
  type RevertEntry,
  type RevertState,
} from "@/lib/campaignTeamSplitRevert";

const state = (over: Partial<RevertState> = {}): RevertState => ({
  batch: {
    id: "b1",
    status: "completed",
    reverted_at: null,
    entries: [],
  },
  profiles: {},
  participants: {},
  teams: {},
  notifications: [],
  ...over,
});

const entry = (over: Partial<RevertEntry> = {}): RevertEntry => ({
  user_id: "u1",
  team_id: "t1",
  xp_allocated: 100,
  coins_allocated: 50,
  outcome: "paid",
  ...over,
});

describe("revertCampaignTeamSplit — casos de borda", () => {
  it("recusa lote inexistente", () => {
    expect(revertCampaignTeamSplit(state({ batch: null })).reason).toBe("batch_not_found");
  });

  it("é idempotente: segunda reversão não estorna de novo", () => {
    const s = state({
      batch: { id: "b1", status: "completed", reverted_at: null, entries: [entry()] },
      profiles: { u1: { xp: 500, coins: 200 } },
      participants: { u1: { xp: 100, coins: 50 } },
      teams: { t1: { awarded_at: "2026-01-01", xp_awarded: 100, coins_awarded: 50 } },
    });

    const first = revertCampaignTeamSplit(s);
    expect(first.reverted).toBe(true);
    expect(s.profiles.u1).toEqual({ xp: 400, coins: 150 });
    expect(s.teams.t1.awarded_at).toBeNull();

    const second = revertCampaignTeamSplit(s);
    expect(second.reason).toBe("already_reverted");
    expect(s.profiles.u1).toEqual({ xp: 400, coins: 150 });
    expect(s.notifications).toHaveLength(1);
  });

  it("não reverte lote sem linhas pagas", () => {
    const s = state({
      batch: {
        id: "b1",
        status: "skipped",
        reverted_at: null,
        entries: [entry({ outcome: "skipped", xp_allocated: 0, coins_allocated: 0 })],
      },
    });
    expect(revertCampaignTeamSplit(s).reason).toBe("nothing_to_revert");
  });

  it("nunca deixa saldo negativo quando o colaborador já gastou", () => {
    const s = state({
      batch: {
        id: "b1",
        status: "completed",
        reverted_at: null,
        entries: [entry({ xp_allocated: 300, coins_allocated: 300 })],
      },
      profiles: { u1: { xp: 50, coins: 10 } },
      participants: { u1: { xp: 300, coins: 300 } },
      teams: { t1: { awarded_at: "2026-01-01", xp_awarded: 300, coins_awarded: 300 } },
    });
    revertCampaignTeamSplit(s);
    expect(s.profiles.u1).toEqual({ xp: 0, coins: 0 });
    expect(s.participants.u1).toEqual({ xp: 0, coins: 0 });
  });

  it("ignora colaborador removido sem quebrar o lote", () => {
    const s = state({
      batch: {
        id: "b1",
        status: "completed",
        reverted_at: null,
        entries: [entry({ user_id: "ghost" }), entry({ user_id: "u2" })],
      },
      profiles: { u2: { xp: 100, coins: 50 } },
      participants: { u2: { xp: 100, coins: 50 } },
      teams: { t1: { awarded_at: "2026-01-01", xp_awarded: 100, coins_awarded: 50 } },
    });
    const out = revertCampaignTeamSplit(s);
    expect(out.members_reverted).toBe(2);
    expect(s.profiles.u2).toEqual({ xp: 0, coins: 0 });
    expect(out.teams_reset).toBe(1);
  });

  it("neutraliza valores inválidos gravados na trilha", () => {
    const s = state({
      batch: {
        id: "b1",
        status: "completed",
        reverted_at: null,
        entries: [
          entry({ xp_allocated: Number.NaN, coins_allocated: -50 }),
          entry({ user_id: "u2", xp_allocated: 10.9, coins_allocated: 0 }),
        ],
      },
      profiles: { u1: { xp: 100, coins: 100 }, u2: { xp: 100, coins: 100 } },
      participants: {},
      teams: { t1: { awarded_at: "2026-01-01", xp_awarded: 10, coins_awarded: 0 } },
    });
    const out = revertCampaignTeamSplit(s);
    expect(out.members_reverted).toBe(1);
    expect(out.xp_reverted).toBe(10);
    expect(s.profiles.u1).toEqual({ xp: 100, coins: 100 });
    expect(s.profiles.u2).toEqual({ xp: 90, coins: 100 });
  });

  it("reseta apenas equipes efetivamente premiadas", () => {
    const s = state({
      batch: {
        id: "b1",
        status: "completed",
        reverted_at: null,
        entries: [entry(), entry({ user_id: "u2", team_id: "t2" })],
      },
      profiles: { u1: { xp: 100, coins: 50 }, u2: { xp: 100, coins: 50 } },
      participants: {},
      teams: {
        t1: { awarded_at: "2026-01-01", xp_awarded: 100, coins_awarded: 50 },
        t2: { awarded_at: null, xp_awarded: 0, coins_awarded: 0 },
      },
    });
    expect(revertCampaignTeamSplit(s).teams_reset).toBe(1);
  });
});

describe("revertCampaignTeamSplit — varredura combinatória", () => {
  const memberCounts = [0, 1, 2, 3, 5, 8];
  const xpValues = [0, 1, 37, 250, 4321];
  const coinValues = [0, 3, 99];
  const balanceFactors = [0, 0.5, 1, 3];

  it("conserva invariantes em todas as combinações", () => {
    let scenarios = 0;

    for (const members of memberCounts) {
      for (const xp of xpValues) {
        for (const coins of coinValues) {
          for (const factor of balanceFactors) {
            scenarios += 1;

            const entries: RevertEntry[] = Array.from({ length: members }, (_, i) => ({
              user_id: `u${i}`,
              team_id: i % 2 === 0 ? "t1" : "t2",
              xp_allocated: xp,
              coins_allocated: coins,
              outcome: i === members - 1 && members > 3 ? "skipped" : "paid",
            }));

            const profiles: RevertState["profiles"] = {};
            const participants: RevertState["participants"] = {};
            entries.forEach((e) => {
              profiles[e.user_id as string] = {
                xp: Math.round(xp * factor),
                coins: Math.round(coins * factor),
              };
              participants[e.user_id as string] = {
                xp: Math.round(xp * factor),
                coins: Math.round(coins * factor),
              };
            });

            const s = state({
              batch: { id: "b1", status: "completed", reverted_at: null, entries },
              profiles,
              participants,
              teams: {
                t1: { awarded_at: "2026-01-01", xp_awarded: xp, coins_awarded: coins },
                t2: { awarded_at: "2026-01-01", xp_awarded: xp, coins_awarded: coins },
              },
            });

            const out = revertCampaignTeamSplit(s);
            const paidRows = entries.filter((e) => e.outcome === "paid").length;
            const payable = xp > 0 || coins > 0 ? paidRows : 0;

            if (paidRows === 0) {
              expect(out.reverted).toBe(false);
              expect(out.reason).toBe("nothing_to_revert");
            } else {
              // Mesmo com valores zerados a reversão ocorre: ela libera as
              // equipes para um novo rateio e fecha o lote na trilha.
              expect(out.reverted).toBe(true);
              expect(out.members_reverted).toBe(payable);
              expect(out.xp_reverted).toBe(payable * xp);
              expect(out.coins_reverted).toBe(payable * coins);
              expect(s.batch?.status).toBe("reverted");
            }

            // Invariantes globais: nunca saldo negativo; nunca estorno acima do pago.
            Object.values(s.profiles).forEach((b) => {
              expect(b.xp).toBeGreaterThanOrEqual(0);
              expect(b.coins).toBeGreaterThanOrEqual(0);
            });
            Object.values(s.participants).forEach((b) => {
              expect(b.xp).toBeGreaterThanOrEqual(0);
              expect(b.coins).toBeGreaterThanOrEqual(0);
            });

            // Reentrância: reversão repetida nunca altera o estado novamente.
            const snapshot = JSON.stringify(s.profiles);
            revertCampaignTeamSplit(s);
            revertCampaignTeamSplit(s);
            expect(JSON.stringify(s.profiles)).toBe(snapshot);
          }
        }
      }
    }

    expect(scenarios).toBe(
      memberCounts.length * xpValues.length * coinValues.length * balanceFactors.length,
    );
  });
});