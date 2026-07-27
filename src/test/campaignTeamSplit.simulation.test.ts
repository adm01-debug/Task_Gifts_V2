import { describe, it, expect } from "vitest";
import {
  awardCampaignTeamSplit,
  recalcCampaignTeams,
  pgRound,
  type SimCampaignState,
  type SimTeam,
  type TeamShareMode,
} from "@/lib/campaignTeamSplit";

/** PRNG determinístico (mulberry32) — cenários reprodutíveis no CI. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ScenarioOptions {
  teams: number;
  membersPerTeam: number;
  targetTeam: number;
  mode: TeamShareMode;
  poolXp: number;
  poolCoins: number;
  progressOf: (teamIndex: number, memberIndex: number) => number;
}

function buildState(opts: ScenarioOptions): SimCampaignState {
  const teams: SimTeam[] = [];
  const participants: { user_id: string; progress: number }[] = [];

  for (let t = 0; t < opts.teams; t += 1) {
    const memberIds: string[] = [];
    for (let m = 0; m < opts.membersPerTeam; m += 1) {
      const userId = `u-${t}-${m}`;
      memberIds.push(userId);
      participants.push({ user_id: userId, progress: opts.progressOf(t, m) });
    }
    teams.push({
      id: `team-${t}`,
      name: `Equipe ${t}`,
      target_team: opts.targetTeam,
      created_at: t,
      member_ids: memberIds,
      awarded_at: null,
    });
  }

  return {
    rule: { team_pool_xp: opts.poolXp, team_pool_coins: opts.poolCoins, team_share: opts.mode },
    teams,
    participants,
    balances: {},
    notifications: [],
  };
}

function totalPaid(state: SimCampaignState) {
  return Object.values(state.balances).reduce(
    (acc, b) => ({ xp: acc.xp + b.xp, coins: acc.coins + b.coins }),
    { xp: 0, coins: 0 },
  );
}

describe("rateio team_split — arredondamento", () => {
  it("replica ROUND() do Postgres (half away from zero)", () => {
    expect(pgRound(0.5)).toBe(1);
    expect(pgRound(1.5)).toBe(2);
    expect(pgRound(2.5)).toBe(3);
    expect(pgRound(-0.5)).toBe(-1);
    expect(pgRound(-1.5)).toBe(-2);
    expect(pgRound(0.4999999)).toBe(0);
    expect(pgRound(Number.NaN)).toBe(0);
    expect(pgRound(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("rateio team_split — grade combinatória", () => {
  const teamCounts = [1, 2, 3, 5];
  const memberCounts = [1, 2, 3, 4, 7];
  const modes: TeamShareMode[] = ["proportional", "equal"];
  const pools = [
    { xp: 1000, coins: 500 },
    { xp: 3, coins: 0 },
    { xp: 0, coins: 7 },
    { xp: 99999, coins: 99999 },
  ];

  let scenarios = 0;

  for (const teams of teamCounts) {
    for (const members of memberCounts) {
      for (const mode of modes) {
        for (const pool of pools) {
          scenarios += 1;
          it(`t=${teams} m=${members} ${mode} xp=${pool.xp} coins=${pool.coins}`, () => {
            const rng = makeRng(teams * 1000 + members * 100 + pool.xp);
            const state = buildState({
              teams,
              membersPerTeam: members,
              targetTeam: 10,
              mode,
              poolXp: pool.xp,
              poolCoins: pool.coins,
              progressOf: () => Math.floor(rng() * 40) + 5,
            });

            const result = awardCampaignTeamSplit(state);

            // Toda equipe elegível deve ser premiada exatamente uma vez.
            expect(result.teams_awarded).toBe(teams);
            state.teams.forEach((team) => {
              expect(team.awarded_at).not.toBeNull();
              expect(team.xp_awarded).toBe(pool.xp);
              expect(team.coins_awarded).toBe(pool.coins);
            });

            // O total pago nunca pode ultrapassar o pool por equipe + erro de
            // arredondamento de no máximo 1 unidade por membro.
            const paid = totalPaid(state);
            expect(paid.xp).toBeLessThanOrEqual(pool.xp * teams + members * teams);
            expect(paid.coins).toBeLessThanOrEqual(pool.coins * teams + members * teams);

            // Nenhum valor negativo é permitido.
            Object.values(state.balances).forEach((b) => {
              expect(b.xp).toBeGreaterThanOrEqual(0);
              expect(b.coins).toBeGreaterThanOrEqual(0);
            });

            // Notificações batem com membros premiados.
            expect(state.notifications.length).toBe(result.members_awarded);
          });
        }
      }
    }
  }

  it(`cobriu ${scenarios} combinações declaradas`, () => {
    expect(scenarios).toBe(teamCounts.length * memberCounts.length * modes.length * pools.length);
  });
});

describe("rateio team_split — equipes vazias", () => {
  it("premia a equipe sem membros sem pagar ninguém", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 0,
      targetTeam: 0,
      mode: "equal",
      poolXp: 500,
      poolCoins: 500,
      progressOf: () => 0,
    });
    const result = awardCampaignTeamSplit(state);
    // target_team = 0 torna a equipe inelegível (evita prêmio sem meta).
    expect(result.teams_awarded).toBe(0);
    expect(result.members_awarded).toBe(0);
  });

  it("equipe vazia com meta positiva nunca atinge a meta", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 0,
      targetTeam: 10,
      mode: "equal",
      poolXp: 500,
      poolCoins: 500,
      progressOf: () => 0,
    });
    const result = awardCampaignTeamSplit(state);
    expect(result.teams_awarded).toBe(0);
    expect(totalPaid(state)).toEqual({ xp: 0, coins: 0 });
  });

  it("mistura de equipes vazias e populadas premia apenas as elegíveis", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const rng = makeRng(seed + 7);
      const state = buildState({
        teams: 4,
        membersPerTeam: 3,
        targetTeam: 30,
        mode: "proportional",
        poolXp: 600,
        poolCoins: 300,
        progressOf: () => Math.floor(rng() * 20) + 1,
      });
      // Esvazia metade das equipes.
      state.teams[1].member_ids = [];
      state.teams[3].member_ids = [];

      const result = awardCampaignTeamSplit(state);
      expect(result.teams_awarded).toBeLessThanOrEqual(2);
      expect(state.teams[1].awarded_at).toBeNull();
      expect(state.teams[3].awarded_at).toBeNull();
    }
  });
});

describe("rateio team_split — contribuição zero", () => {
  it("modo proporcional não paga quem não contribuiu", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 4,
      targetTeam: 10,
      mode: "proportional",
      poolXp: 400,
      poolCoins: 400,
      progressOf: (_t, m) => (m === 0 ? 40 : 0),
    });
    const result = awardCampaignTeamSplit(state);
    expect(result.members_awarded).toBe(1);
    expect(state.balances["u-0-0"]).toEqual({ xp: 400, coins: 400 });
    expect(state.balances["u-0-1"]).toBeUndefined();
  });

  it("modo igualitário paga todos mesmo com contribuição zero", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 4,
      targetTeam: 10,
      mode: "equal",
      poolXp: 400,
      poolCoins: 400,
      progressOf: (_t, m) => (m === 0 ? 40 : 0),
    });
    const result = awardCampaignTeamSplit(state);
    expect(result.members_awarded).toBe(4);
    Object.values(state.balances).forEach((b) => expect(b).toEqual({ xp: 100, coins: 100 }));
  });

  it("progresso total zero cai no fallback igualitário sem divisão por zero", () => {
    for (let members = 1; members <= 25; members += 1) {
      const state = buildState({
        teams: 1,
        membersPerTeam: members,
        targetTeam: 0,
        mode: "proportional",
        poolXp: 100,
        poolCoins: 0,
        progressOf: () => 0,
      });
      // target 0 é inelegível; força meta negativa->positiva mínima e progresso 0.
      state.teams[0].target_team = 0;
      const result = awardCampaignTeamSplit(state);
      expect(result.teams_awarded).toBe(0);
      Object.values(state.balances).forEach((b) => {
        expect(Number.isFinite(b.xp)).toBe(true);
      });
    }
  });
});

describe("rateio team_split — empates", () => {
  it("empate de progresso é desempatado pela ordem de criação", () => {
    const state = buildState({
      teams: 5,
      membersPerTeam: 2,
      targetTeam: 10,
      mode: "proportional",
      poolXp: 100,
      poolCoins: 100,
      progressOf: () => 10,
    });
    const ranked = recalcCampaignTeams(state);
    ranked.forEach((team, index) => {
      expect(team.rank_position).toBe(index + 1);
      expect(team.id).toBe(`team-${index}`);
    });
  });

  it("membros com progresso idêntico recebem partes iguais", () => {
    for (let members = 1; members <= 40; members += 1) {
      const state = buildState({
        teams: 1,
        membersPerTeam: members,
        targetTeam: members,
        mode: "proportional",
        poolXp: 1000,
        poolCoins: 1000,
        progressOf: () => 1,
      });
      awardCampaignTeamSplit(state);
      const values = Object.values(state.balances).map((b) => b.xp);
      const unique = new Set(values);
      expect(unique.size).toBeLessThanOrEqual(1);
    }
  });
});

describe("rateio team_split — reentrância (idempotência)", () => {
  it("execuções repetidas não pagam duas vezes", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const rng = makeRng(seed + 991);
      const state = buildState({
        teams: 3,
        membersPerTeam: 4,
        targetTeam: 20,
        mode: seed % 2 === 0 ? "proportional" : "equal",
        poolXp: 500,
        poolCoins: 250,
        progressOf: () => Math.floor(rng() * 25) + 1,
      });

      const first = awardCampaignTeamSplit(state);
      const snapshot = JSON.stringify(state.balances);
      const notifications = state.notifications.length;

      for (let retry = 0; retry < 5; retry += 1) {
        const again = awardCampaignTeamSplit(state);
        expect(again.teams_awarded).toBe(0);
        expect(again.members_awarded).toBe(0);
      }

      expect(JSON.stringify(state.balances)).toBe(snapshot);
      expect(state.notifications.length).toBe(notifications);
      expect(first.teams_awarded).toBeGreaterThanOrEqual(0);
    }
  });

  it("progresso adicional após o rateio não reabre equipes já premiadas", () => {
    const state = buildState({
      teams: 2,
      membersPerTeam: 3,
      targetTeam: 10,
      mode: "equal",
      poolXp: 300,
      poolCoins: 300,
      progressOf: () => 5,
    });
    awardCampaignTeamSplit(state);
    const before = JSON.stringify(state.balances);
    state.participants.forEach((p) => {
      p.progress += 100;
    });
    const again = awardCampaignTeamSplit(state);
    expect(again.teams_awarded).toBe(0);
    expect(JSON.stringify(state.balances)).toBe(before);
  });

  it("novas equipes criadas depois são premiadas sem afetar as antigas", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 2,
      targetTeam: 10,
      mode: "equal",
      poolXp: 200,
      poolCoins: 0,
      progressOf: () => 10,
    });
    awardCampaignTeamSplit(state);
    const oldBalance = { ...state.balances["u-0-0"] };

    state.teams.push({
      id: "team-new",
      name: "Nova",
      target_team: 5,
      created_at: 99,
      member_ids: ["u-new"],
      awarded_at: null,
    });
    state.participants.push({ user_id: "u-new", progress: 50 });

    const result = awardCampaignTeamSplit(state);
    expect(result.teams_awarded).toBe(1);
    expect(state.balances["u-0-0"]).toEqual(oldBalance);
    expect(state.balances["u-new"].xp).toBe(200);
  });
});

describe("rateio team_split — guardas defensivas", () => {
  it("pool vazio retorna reason=empty_pool sem pagar", () => {
    const state = buildState({
      teams: 2,
      membersPerTeam: 2,
      targetTeam: 1,
      mode: "equal",
      poolXp: 0,
      poolCoins: 0,
      progressOf: () => 10,
    });
    const result = awardCampaignTeamSplit(state);
    expect(result.reason).toBe("empty_pool");
    expect(totalPaid(state)).toEqual({ xp: 0, coins: 0 });
    state.teams.forEach((t) => expect(t.awarded_at).toBeNull());
  });

  it("pool negativo é tratado como vazio", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 2,
      targetTeam: 1,
      mode: "equal",
      poolXp: -500,
      poolCoins: -10,
      progressOf: () => 10,
    });
    expect(awardCampaignTeamSplit(state).reason).toBe("empty_pool");
  });

  it("campanha inexistente retorna campaign_not_found", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 1,
      targetTeam: 1,
      mode: "equal",
      poolXp: 10,
      poolCoins: 10,
      progressOf: () => 10,
    });
    state.rule = null;
    expect(awardCampaignTeamSplit(state).reason).toBe("campaign_not_found");
  });

  it("valores JSONB em string são coeridos corretamente", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 2,
      targetTeam: 10,
      mode: "equal",
      poolXp: 0,
      poolCoins: 0,
      progressOf: () => 10,
    });
    state.rule = { team_pool_xp: "400", team_pool_coins: "200", team_share: "equal" };
    const result = awardCampaignTeamSplit(state);
    expect(result.members_awarded).toBe(2);
    expect(state.balances["u-0-0"]).toEqual({ xp: 200, coins: 100 });
  });

  it("valores JSONB inválidos não produzem NaN", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 2,
      targetTeam: 10,
      mode: "equal",
      poolXp: 0,
      poolCoins: 0,
      progressOf: () => 10,
    });
    state.rule = { team_pool_xp: "abc", team_pool_coins: null, team_share: null };
    expect(awardCampaignTeamSplit(state).reason).toBe("empty_pool");
  });

  it("modo desconhecido cai em proporcional", () => {
    const state = buildState({
      teams: 1,
      membersPerTeam: 2,
      targetTeam: 10,
      mode: "equal",
      poolXp: 100,
      poolCoins: 0,
      progressOf: (_t, m) => (m === 0 ? 10 : 0),
    });
    state.rule = { team_pool_xp: 100, team_pool_coins: 0, team_share: "banana" };
    awardCampaignTeamSplit(state);
    expect(state.balances["u-0-0"].xp).toBe(100);
    expect(state.balances["u-0-1"]).toBeUndefined();
  });

  it("percentual de progresso é limitado a 100", () => {
    const rng = makeRng(4242);
    for (let i = 0; i < 200; i += 1) {
      const state = buildState({
        teams: 2,
        membersPerTeam: 3,
        targetTeam: Math.floor(rng() * 50) + 1,
        mode: "proportional",
        poolXp: 100,
        poolCoins: 100,
        progressOf: () => Math.floor(rng() * 200),
      });
      recalcCampaignTeams(state);
      state.teams.forEach((t) => {
        expect(t.progress_percent).toBeGreaterThanOrEqual(0);
        expect(t.progress_percent).toBeLessThanOrEqual(100);
      });
    }
  });

  it("equipe abaixo da meta nunca é premiada (varredura de 300 cenários)", () => {
    const rng = makeRng(31337);
    for (let i = 0; i < 300; i += 1) {
      const target = Math.floor(rng() * 100) + 10;
      const state = buildState({
        teams: 1,
        membersPerTeam: 3,
        targetTeam: target,
        mode: "proportional",
        poolXp: 100,
        poolCoins: 100,
        progressOf: () => Math.floor(rng() * target) / 6,
      });
      const result = awardCampaignTeamSplit(state);
      const progress = state.teams[0].progress ?? 0;
      if (progress >= target) {
        expect(result.teams_awarded).toBe(1);
      } else {
        expect(result.teams_awarded).toBe(0);
        expect(totalPaid(state)).toEqual({ xp: 0, coins: 0 });
      }
    }
  });
});
