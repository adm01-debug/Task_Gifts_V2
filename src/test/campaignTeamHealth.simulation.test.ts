import { describe, it, expect } from "vitest";
import {
  analyzeTeamHealth,
  summarizeTeamHealth,
  type HealthMember,
  type HealthTeam,
} from "@/lib/campaignTeamHealth";

const team = (over: Partial<HealthTeam> & { id: string }): HealthTeam => ({
  name: `Equipe ${over.id}`,
  target_team: 100,
  progress: 50,
  members_count: 0,
  awarded_at: null,
  ...over,
});

describe("campaignTeamHealth — casos base", () => {
  it("retorna relatório vazio sem equipes", () => {
    const r = analyzeTeamHealth([], [], []);
    expect(r.issues).toHaveLength(0);
    expect(r.readyForSplit).toBe(false);
    expect(summarizeTeamHealth(r)).toMatch(/prontas/);
  });

  it("bloqueia equipe sem membros", () => {
    const r = analyzeTeamHealth([team({ id: "a" })], []);
    expect(r.issues.some((i) => i.code === "team_without_members")).toBe(true);
    expect(r.readyForSplit).toBe(false);
  });

  it("bloqueia meta inválida (zero, negativa e NaN)", () => {
    for (const target of [0, -10, Number.NaN]) {
      const r = analyzeTeamHealth(
        [team({ id: "a", target_team: target as number })],
        [{ team_id: "a", user_id: "u1" }],
      );
      expect(r.issues.some((i) => i.code === "team_without_target")).toBe(true);
      expect(r.readyForSplit).toBe(false);
    }
  });

  it("detecta membro em múltiplas equipes", () => {
    const r = analyzeTeamHealth(
      [team({ id: "a" }), team({ id: "b" })],
      [
        { team_id: "a", user_id: "u1" },
        { team_id: "b", user_id: "u1" },
      ],
    );
    const issue = r.issues.find((i) => i.code === "member_in_multiple_teams");
    expect(issue?.userIds).toEqual(["u1"]);
    expect(r.readyForSplit).toBe(false);
  });

  it("ignora duplicata exata do mesmo par equipe/usuário", () => {
    const r = analyzeTeamHealth(
      [team({ id: "a" })],
      [
        { team_id: "a", user_id: "u1" },
        { team_id: "a", user_id: "u1" },
      ],
    );
    expect(r.issues.some((i) => i.code === "member_in_multiple_teams")).toBe(false);
    expect(r.readyForSplit).toBe(true);
  });

  it("descarta membros de equipes inexistentes", () => {
    const r = analyzeTeamHealth([team({ id: "a" })], [{ team_id: "zzz", user_id: "u1" }]);
    expect(r.issues.some((i) => i.code === "team_without_members")).toBe(true);
  });

  it("aponta participantes órfãos sem duplicar ids", () => {
    const r = analyzeTeamHealth(
      [team({ id: "a" })],
      [{ team_id: "a", user_id: "u1" }],
      [{ user_id: "u1" }, { user_id: "u2" }, { user_id: "u2" }],
    );
    const issue = r.issues.find((i) => i.code === "unassigned_participants");
    expect(issue?.userIds).toEqual(["u2"]);
    expect(r.readyForSplit).toBe(true);
  });

  it("detecta nomes duplicados ignorando acentos e caixa", () => {
    const r = analyzeTeamHealth(
      [team({ id: "a", name: "Águia" }), team({ id: "b", name: "  aguia " })],
      [
        { team_id: "a", user_id: "u1" },
        { team_id: "b", user_id: "u2" },
      ],
    );
    expect(r.issues.filter((i) => i.code === "duplicate_team_name")).toHaveLength(1);
  });

  it("marca equipe já paga como informativa e fora dos elegíveis", () => {
    const r = analyzeTeamHealth(
      [team({ id: "a", awarded_at: "2026-01-01T00:00:00Z" })],
      [{ team_id: "a", user_id: "u1" }],
    );
    expect(r.eligibleTeamIds).toHaveLength(0);
    expect(r.readyForSplit).toBe(false);
    expect(r.infoCount).toBe(1);
  });

  it("alerta progresso zero apenas em equipe ativa e válida", () => {
    const r = analyzeTeamHealth(
      [team({ id: "a", progress: 0 })],
      [{ team_id: "a", user_id: "u1" }],
    );
    expect(r.issues.some((i) => i.code === "team_zero_progress")).toBe(true);
    expect(r.readyForSplit).toBe(true);
  });

  it("tolera entradas nulas sem lançar", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => analyzeTeamHealth(null as any, null as any, null as any)).not.toThrow();
  });
});

describe("campaignTeamHealth — simulação combinatória", () => {
  const memberCounts = [0, 1, 2, 3];
  const targets = [-5, 0, 1, 250];
  const progresses = [0, 10, 999];
  const awardeds = [null, "2026-02-02T10:00:00Z"];
  const overlaps = [false, true];

  it("cobre centenas de combinações mantendo invariantes", () => {
    let scenarios = 0;
    for (const mc of memberCounts) {
      for (const target of targets) {
        for (const progress of progresses) {
          for (const awarded of awardeds) {
            for (const overlap of overlaps) {
              scenarios++;
              const teams: HealthTeam[] = [
                team({ id: "a", target_team: target, progress, awarded_at: awarded }),
                team({ id: "b", name: "Equipe B" }),
              ];
              const members: HealthMember[] = [];
              for (let i = 0; i < mc; i++) members.push({ team_id: "a", user_id: `u${i}` });
              members.push({ team_id: "b", user_id: "ub" });
              if (overlap && mc > 0) members.push({ team_id: "b", user_id: "u0" });

              const r = analyzeTeamHealth(teams, members, [{ user_id: "orfao" }]);

              // Invariante 1: contagens coerentes com a lista de issues.
              expect(r.criticalCount + r.warningCount + r.infoCount).toBe(r.issues.length);
              // Invariante 2: críticos sempre no topo.
              const firstWarn = r.issues.findIndex((i) => i.severity !== "critical");
              if (firstWarn >= 0) {
                expect(r.issues.slice(firstWarn).every((i) => i.severity !== "critical")).toBe(true);
              }
              // Invariante 3: elegibilidade exige membros, meta > 0 e não pago.
              const aEligible = r.eligibleTeamIds.includes("a");
              expect(aEligible).toBe(mc > 0 && target > 0 && !awarded);
              // Invariante 4: readyForSplit nunca é true com bloqueio.
              if (r.criticalCount > 0) expect(r.readyForSplit).toBe(false);
              // Invariante 5: overlap sempre vira bloqueio.
              if (overlap && mc > 0) {
                expect(r.issues.some((i) => i.code === "member_in_multiple_teams")).toBe(true);
              }
              // Invariante 6: órfão sempre reportado.
              expect(r.issues.some((i) => i.code === "unassigned_participants")).toBe(true);
              // Invariante 7: determinismo.
              expect(analyzeTeamHealth(teams, members, [{ user_id: "orfao" }])).toEqual(r);
            }
          }
        }
      }
    }
    expect(scenarios).toBeGreaterThanOrEqual(192);
  });

  it("escala para 300 equipes sem membros sinalizando todos os bloqueios", () => {
    const teams = Array.from({ length: 300 }, (_, i) => team({ id: `t${i}`, name: `Equipe ${i}` }));
    const r = analyzeTeamHealth(teams, []);
    expect(r.criticalCount).toBe(300);
    expect(r.eligibleTeamIds).toHaveLength(0);
    expect(summarizeTeamHealth(r)).toContain("300 bloqueio(s)");
  });
});
