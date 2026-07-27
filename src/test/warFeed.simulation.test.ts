import { describe, expect, it } from "vitest";
import {
  normalizeFeed,
  normalizeFeedItem,
  relativeTime,
  summarizeFeed,
  type WarFeedItem,
} from "@/lib/warFeed";

/** PRNG deterministico — a simulacao precisa ser reproduzivel. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const HOSTILE_VALUES: unknown[] = [
  NaN,
  Infinity,
  -Infinity,
  null,
  undefined,
  "",
  "   ",
  "abc",
  -42,
  {},
  [],
  true,
  false,
  "1e400",
];

function randomRawItem(rand: () => number, index: number): Record<string, unknown> {
  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length) % list.length];
  return {
    id: `item-${index}`,
    created_at: new Date(1_700_000_000_000 + Math.floor(rand() * 1_000_000)).toISOString(),
    metric_key: pick(["task_completed", "checkin_on_time", "kudos_sent", ""]),
    metric_label: pick(["Tarefa concluída", "", null as unknown as string]),
    amount: pick([1, 2.5, 0, -3, "4", NaN]),
    points: pick([10, 0, -5, "7.5", Infinity]),
    department_id: pick(["dep-a", "dep-b", "", 12 as unknown as string]),
    department_name: pick(["Vendas", "Logística", ""]),
    actor: pick(["Ana S.", "", "   "]),
    is_me: pick([true, false, "true" as unknown as boolean]),
  };
}

describe("warFeed — normalizacao defensiva", () => {
  it("descarta qualquer entrada sem id utilizavel", () => {
    for (const value of HOSTILE_VALUES) {
      expect(normalizeFeedItem(value)).toBeNull();
    }
    expect(normalizeFeedItem({ id: "   " })).toBeNull();
    expect(normalizeFeedItem({ id: 123 })).toBeNull();
  });

  it("nunca produz numeros invalidos ou negativos em 900 cenarios aleatorios", () => {
    const rand = makeRandom(20260727);
    for (let i = 0; i < 900; i += 1) {
      const item = normalizeFeedItem(randomRawItem(rand, i));
      expect(item).not.toBeNull();
      const safe = item as WarFeedItem;
      expect(Number.isFinite(safe.amount)).toBe(true);
      expect(Number.isFinite(safe.points)).toBe(true);
      expect(safe.amount).toBeGreaterThanOrEqual(0);
      expect(safe.points).toBeGreaterThanOrEqual(0);
      expect(safe.actor.trim().length).toBeGreaterThan(0);
      expect(safe.department_name.trim().length).toBeGreaterThan(0);
      expect(safe.metric_label.trim().length).toBeGreaterThan(0);
      expect(typeof safe.is_me).toBe("boolean");
    }
  });

  it("blinda campos hostis um a um sem quebrar", () => {
    const fields = [
      "created_at",
      "metric_key",
      "metric_label",
      "amount",
      "points",
      "department_id",
      "department_name",
      "actor",
      "is_me",
    ];
    for (const field of fields) {
      for (const value of HOSTILE_VALUES) {
        const item = normalizeFeedItem({ id: "x", [field]: value });
        expect(item).not.toBeNull();
        expect(Number.isFinite((item as WarFeedItem).points)).toBe(true);
      }
    }
  });

  it("is_me so e verdadeiro para o booleano true", () => {
    expect(normalizeFeedItem({ id: "a", is_me: "true" })?.is_me).toBe(false);
    expect(normalizeFeedItem({ id: "a", is_me: 1 })?.is_me).toBe(false);
    expect(normalizeFeedItem({ id: "a", is_me: true })?.is_me).toBe(true);
  });
});

describe("warFeed — lista", () => {
  it("retorna lista vazia para payloads nao-array", () => {
    for (const value of HOSTILE_VALUES) {
      if (Array.isArray(value)) continue;
      expect(normalizeFeed(value)).toEqual([]);
    }
  });

  it("deduplica por id e limita a 100 itens", () => {
    const duplicated = Array.from({ length: 400 }, (_, i) => ({
      id: `id-${i % 7}`,
      created_at: new Date(1_700_000_000_000 + i * 1000).toISOString(),
    }));
    expect(normalizeFeed(duplicated)).toHaveLength(7);

    const many = Array.from({ length: 500 }, (_, i) => ({
      id: `u-${i}`,
      created_at: new Date(1_700_000_000_000 + i * 1000).toISOString(),
    }));
    expect(normalizeFeed(many)).toHaveLength(100);
  });

  it("ordena do mais recente para o mais antigo em 300 embaralhamentos", () => {
    const rand = makeRandom(7);
    for (let round = 0; round < 300; round += 1) {
      const raw = Array.from({ length: 12 }, (_, i) => ({
        id: `r${round}-${i}`,
        created_at: new Date(1_700_000_000_000 + Math.floor(rand() * 500_000)).toISOString(),
      })).sort(() => rand() - 0.5);

      const items = normalizeFeed(raw);
      for (let i = 1; i < items.length; i += 1) {
        expect(Date.parse(items[i - 1].created_at)).toBeGreaterThanOrEqual(
          Date.parse(items[i].created_at),
        );
      }
    }
  });

  it("é deterministico: mesma entrada, mesma saida", () => {
    const rand = makeRandom(99);
    const raw = Array.from({ length: 40 }, (_, i) => randomRawItem(rand, i));
    expect(normalizeFeed(raw)).toEqual(normalizeFeed(raw));
  });

  it("mantem ordem estavel quando as datas empatam ou sao invalidas", () => {
    const raw = [
      { id: "c", created_at: "quebrado" },
      { id: "a", created_at: "quebrado" },
      { id: "b", created_at: "quebrado" },
    ];
    expect(normalizeFeed(raw).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});

describe("warFeed — resumo", () => {
  it("soma pontos e conta departamentos distintos em 400 cenarios", () => {
    const rand = makeRandom(4242);
    for (let round = 0; round < 400; round += 1) {
      const size = 1 + Math.floor(rand() * 20);
      const raw = Array.from({ length: size }, (_, i) => ({
        id: `s${round}-${i}`,
        created_at: new Date(1_700_000_000_000 + i * 1000).toISOString(),
        points: Math.floor(rand() * 50),
        department_id: `dep-${Math.floor(rand() * 4)}`,
        department_name: `Dep ${Math.floor(rand() * 4)}`,
      }));

      const items = normalizeFeed(raw);
      const pulse = summarizeFeed(items);
      const manual = items.reduce((acc, item) => acc + item.points, 0);

      expect(pulse.events).toBe(items.length);
      expect(pulse.points).toBeCloseTo(Math.round(manual * 100) / 100, 6);
      expect(pulse.departments).toBeGreaterThan(0);
      expect(pulse.departments).toBeLessThanOrEqual(items.length);
      expect(pulse.leader).not.toBeNull();
    }
  });

  it("resumo vazio nao inventa lider", () => {
    expect(summarizeFeed([])).toEqual({ events: 0, points: 0, departments: 0, leader: null });
  });

  it("elege como lider o departamento com mais pontos", () => {
    const items = normalizeFeed([
      { id: "1", points: 5, department_id: "a", department_name: "Alpha" },
      { id: "2", points: 9, department_id: "b", department_name: "Beta" },
      { id: "3", points: 6, department_id: "a", department_name: "Alpha" },
    ]);
    expect(summarizeFeed(items).leader).toBe("Alpha");
  });
});

describe("warFeed — tempo relativo", () => {
  const now = Date.parse("2026-07-27T12:00:00.000Z");

  it("cobre todas as faixas", () => {
    expect(relativeTime("2026-07-27T11:59:50.000Z", now)).toBe("agora");
    expect(relativeTime("2026-07-27T11:58:50.000Z", now)).toBe("1 min");
    expect(relativeTime("2026-07-27T11:30:00.000Z", now)).toBe("30 min");
    expect(relativeTime("2026-07-27T06:00:00.000Z", now)).toBe("6 h");
    expect(relativeTime("2026-07-24T12:00:00.000Z", now)).toBe("3 d");
  });

  it("nunca lanca com entradas hostis ou futuras", () => {
    for (const value of HOSTILE_VALUES) {
      expect(() => relativeTime(value as string, now)).not.toThrow();
    }
    expect(relativeTime("2030-01-01T00:00:00.000Z", now)).toBe("agora");
  });
});