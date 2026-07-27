import { describe, expect, it } from "vitest";
import {
  buildLeadSnapshot,
  detectLeadEvents,
  pointsToNextPosition,
  prioritizeLeadEvents,
  type WarLeadEvent,
} from "@/lib/warLeadership";

function rows(entries: Array<[string, number]>) {
  return entries.map(([id, score], index) => ({
    department_id: id,
    name: id.toUpperCase(),
    score,
    position: index + 1,
  }));
}

describe("buildLeadSnapshot — saneamento", () => {
  it("descarta lixo e valores hostis", () => {
    const snap = buildLeadSnapshot([
      null,
      "x",
      [],
      { department_id: "" },
      { department_id: "a", name: "  ", score: Number.NaN, position: -3 },
      { department_id: "a", name: "dup", score: 99 },
      { department_id: "b", name: "B", score: "12.5", position: Infinity },
    ]);
    expect(snap.rows).toHaveLength(2);
    expect(snap.rows[0].department_id).toBe("b");
    expect(snap.rows[0].score).toBe(12.5);
    expect(snap.rows[1].score).toBe(0);
    expect(snap.rows[1].name).toBe("Departamento");
    expect(snap.rows.map((r) => r.position)).toEqual([1, 2]);
  });

  it("reindexa posicoes por score, com desempate estavel", () => {
    const snap = buildLeadSnapshot(rows([["z", 10], ["a", 10], ["m", 50]]));
    expect(snap.rows.map((r) => r.department_id)).toEqual(["m", "a", "z"]);
  });

  it("nao quebra com entrada nao-array", () => {
    expect(buildLeadSnapshot(undefined).rows).toEqual([]);
    expect(buildLeadSnapshot({}).rows).toEqual([]);
  });
});

describe("detectLeadEvents — regras de negocio", () => {
  it("nao alerta no primeiro ciclo (sem baseline)", () => {
    const current = buildLeadSnapshot(rows([["a", 10], ["b", 5]]));
    expect(detectLeadEvents(null, current, "b")).toEqual([]);
  });

  it("detecta perda de lideranca como critico", () => {
    const prev = buildLeadSnapshot(rows([["mine", 100], ["rival", 90]]));
    const next = buildLeadSnapshot(rows([["rival", 120], ["mine", 100]]));
    const events = detectLeadEvents(prev, next, "mine");
    expect(events[0].kind).toBe("lead_lost");
    expect(events[0].severity).toBe("critical");
    expect(events[0].gap).toBe(20);
  });

  it("detecta tomada de lideranca como positivo", () => {
    const prev = buildLeadSnapshot(rows([["rival", 100], ["mine", 90]]));
    const next = buildLeadSnapshot(rows([["mine", 130], ["rival", 100]]));
    const events = detectLeadEvents(prev, next, "mine");
    expect(events.some((e) => e.kind === "lead_taken" && e.gap === 30)).toBe(true);
  });

  it("narra troca de lider entre terceiros", () => {
    const prev = buildLeadSnapshot(rows([["a", 100], ["b", 90], ["mine", 10]]));
    const next = buildLeadSnapshot(rows([["b", 120], ["a", 100], ["mine", 10]]));
    const events = detectLeadEvents(prev, next, "mine");
    expect(events.some((e) => e.kind === "leader_changed")).toBe(true);
  });

  it("detecta ultrapassagem fora do 1o lugar", () => {
    const prev = buildLeadSnapshot(rows([["top", 500], ["mine", 100], ["rival", 90]]));
    const next = buildLeadSnapshot(rows([["top", 500], ["rival", 140], ["mine", 100]]));
    const events = detectLeadEvents(prev, next, "mine");
    expect(events.some((e) => e.kind === "overtaken")).toBe(true);
  });

  it("anuncia ameaca quando rival cola no placar", () => {
    const prev = buildLeadSnapshot(rows([["mine", 100], ["rival", 50]]));
    const next = buildLeadSnapshot(rows([["mine", 100], ["rival", 98]]));
    const events = detectLeadEvents(prev, next, "mine");
    expect(events.some((e) => e.kind === "threat" && e.gap === 2)).toBe(true);
  });

  it("nao duplica ameaca quando ja perdeu a lideranca", () => {
    const prev = buildLeadSnapshot(rows([["mine", 100], ["rival", 99]]));
    const next = buildLeadSnapshot(rows([["rival", 101], ["mine", 100]]));
    const events = detectLeadEvents(prev, next, "mine");
    expect(events.some((e) => e.kind === "threat")).toBe(false);
  });

  it("sem departamento do usuario, so eventos globais", () => {
    const prev = buildLeadSnapshot(rows([["a", 10], ["b", 5]]));
    const next = buildLeadSnapshot(rows([["b", 20], ["a", 10]]));
    const events = detectLeadEvents(prev, next, null);
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe("leader_changed");
  });

  it("placar estavel nao gera evento", () => {
    const prev = buildLeadSnapshot(rows([["a", 100], ["b", 10]]));
    const next = buildLeadSnapshot(rows([["a", 100], ["b", 10]]));
    expect(detectLeadEvents(prev, next, "b")).toEqual([]);
  });

  it("ignora snapshot corrente vazio", () => {
    const prev = buildLeadSnapshot(rows([["a", 1]]));
    expect(detectLeadEvents(prev, buildLeadSnapshot([]), "a")).toEqual([]);
  });
});

describe("simulacao massiva — invariantes", () => {
  const DEPTS = ["a", "b", "c", "d", "e", "f"];

  function pseudoRandom(seed: number) {
    let state = seed % 2147483647;
    if (state <= 0) state += 2147483646;
    return () => (state = (state * 16807) % 2147483647) / 2147483647;
  }

  it("mantem invariantes em 600 transicoes aleatorias", () => {
    const rand = pseudoRandom(42);
    let previous = buildLeadSnapshot(rows(DEPTS.map((d) => [d, Math.floor(rand() * 500)])));

    for (let i = 0; i < 600; i += 1) {
      const next = buildLeadSnapshot(
        rows(DEPTS.map((d) => [d, Math.floor(rand() * 500)])),
      );
      const mine = DEPTS[Math.floor(rand() * DEPTS.length)];
      const events: WarLeadEvent[] = detectLeadEvents(previous, next, mine);

      // Ids unicos e ordenados por severidade.
      const ids = events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(events).toEqual(prioritizeLeadEvents(events));

      for (const event of events) {
        expect(Number.isFinite(event.gap)).toBe(true);
        expect(event.gap).toBeGreaterThanOrEqual(0);
        expect(event.title.length).toBeGreaterThan(0);
        expect(event.description.length).toBeGreaterThan(0);
      }

      // Nunca anuncia perda e tomada de lideranca no mesmo ciclo.
      expect(
        events.filter((e) => e.kind === "lead_lost" || e.kind === "lead_taken").length,
      ).toBeLessThanOrEqual(1);

      const target = pointsToNextPosition(next, mine);
      if (target) expect(target.gap).toBeGreaterThanOrEqual(0);

      previous = next;
    }
  });

  it("lider real nunca tem alvo acima", () => {
    const rand = pseudoRandom(7);
    for (let i = 0; i < 200; i += 1) {
      const snap = buildLeadSnapshot(rows(DEPTS.map((d) => [d, Math.floor(rand() * 1000)])));
      expect(pointsToNextPosition(snap, snap.rows[0].department_id)).toBeNull();
      expect(pointsToNextPosition(snap, "inexistente")).toBeNull();
      expect(pointsToNextPosition(snap, null)).toBeNull();
    }
  });
});
