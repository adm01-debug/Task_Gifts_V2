import { describe, expect, it } from "vitest";
import {
  AUDITED_FIELDS,
  buildAuditTimeline,
  diffSnapshots,
  formatFieldValue,
  measureEconomicImpact,
  summarizeAudit,
  type AuditRecord,
  type PrizeSnapshot,
} from "@/lib/luckyWheelAudit";
import type { OddsPrize } from "@/lib/luckyWheelOdds";

/** PRNG determinístico (mulberry32) — simulações reprodutíveis em CI. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TYPES = ["coins", "xp", "achievement", "nothing"] as const;
const RARITIES = ["common", "rare", "epic", "legendary"] as const;

function randomSnapshot(rand: () => number, id: string): PrizeSnapshot {
  return {
    id,
    label: `Prêmio ${Math.floor(rand() * 1000)}`,
    prize_type: TYPES[Math.floor(rand() * TYPES.length)],
    amount: Math.floor(rand() * 500),
    weight: 1 + Math.floor(rand() * 100),
    color: `hsl(${Math.floor(rand() * 360)} 80% 50%)`,
    icon: "gift",
    rarity: RARITIES[Math.floor(rand() * RARITIES.length)],
    is_active: rand() > 0.25,
  };
}

function record(partial: Partial<AuditRecord> & Pick<AuditRecord, "id">): AuditRecord {
  return {
    prize_id: "p1",
    operation: "UPDATE",
    changed_by: "admin-1",
    changed_by_name: "Admin Um",
    changed_at: "2026-01-01T10:00:00.000Z",
    before_data: null,
    after_data: null,
    ...partial,
  };
}

describe("diffSnapshots — detecção de alterações", () => {
  it("não reporta mudança quando os snapshots são idênticos", () => {
    const rand = rng(11);
    for (let i = 0; i < 300; i += 1) {
      const snap = randomSnapshot(rand, `p${i}`);
      expect(diffSnapshots(snap, { ...snap })).toEqual([]);
    }
  });

  it("detecta exatamente o conjunto de campos alterados em 400 cenários", () => {
    const rand = rng(29);
    for (let i = 0; i < 400; i += 1) {
      const before = randomSnapshot(rand, `p${i}`);
      const after: PrizeSnapshot = { ...before };
      const expected = new Set<string>();

      for (const field of AUDITED_FIELDS) {
        if (rand() > 0.6) continue;
        if (field === "is_active") after.is_active = !before.is_active;
        else if (field === "amount") after.amount = Number(before.amount) + 1 + Math.floor(rand() * 9);
        else if (field === "weight") after.weight = Number(before.weight) + 1 + Math.floor(rand() * 9);
        else after[field] = `${String(before[field])}-alterado`;
        expected.add(field);
      }

      const changes = diffSnapshots(before, after);
      expect(new Set(changes.map((c) => c.field))).toEqual(expected);
      for (const change of changes) {
        expect(change.before).not.toEqual(change.after);
        expect(change.label).toBeTruthy();
      }
    }
  });

  it("ignora ruído de serialização JSON (número como string, boolean como string)", () => {
    const before: PrizeSnapshot = { weight: 10, amount: 0, is_active: true, label: "A" };
    const after: PrizeSnapshot = { weight: "10", amount: "0", is_active: "true", label: "A" };
    expect(diffSnapshots(before, after)).toEqual([]);
  });

  it("ignora campos não auditados (updated_at, created_at, id)", () => {
    const before = { label: "A", updated_at: "x", created_at: "y", id: "1" } as PrizeSnapshot;
    const after = { label: "A", updated_at: "z", created_at: "w", id: "1" } as PrizeSnapshot;
    expect(diffSnapshots(before, after)).toEqual([]);
  });

  it("trata INSERT (sem before) e DELETE (sem after) sem perder campos", () => {
    const snap = randomSnapshot(rng(3), "p1");
    const inserted = diffSnapshots(null, snap);
    const deleted = diffSnapshots(snap, null);
    expect(inserted).toHaveLength(AUDITED_FIELDS.length);
    expect(deleted).toHaveLength(AUDITED_FIELDS.length);
    for (const change of inserted) expect(change.before).toBeNull();
    for (const change of deleted) expect(change.after).toBeNull();
  });

  it("sobrevive a payloads hostis sem lançar exceção", () => {
    const hostile: unknown[] = [null, undefined, 0, "", [], "texto", true, { label: null }, { weight: NaN }];
    for (const a of hostile) {
      for (const b of hostile) {
        expect(() =>
          diffSnapshots(a as PrizeSnapshot, b as PrizeSnapshot),
        ).not.toThrow();
      }
    }
  });

  it("campo ausente dos dois lados nunca vira alteração", () => {
    expect(diffSnapshots({ label: "A" }, { label: "A" })).toEqual([]);
  });

  it("campo presente só de um lado é reportado uma única vez", () => {
    const changes = diffSnapshots({ label: "A" }, { label: "A", weight: 5 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ field: "weight", before: null, after: 5 });
  });
});

describe("buildAuditTimeline — ordenação e normalização", () => {
  it("ordena do mais recente para o mais antigo em 200 permutações", () => {
    const rand = rng(97);
    for (let round = 0; round < 200; round += 1) {
      const records = Array.from({ length: 12 }, (_, i) =>
        record({
          id: `r${i}`,
          changed_at: new Date(Date.UTC(2026, 0, 1, 0, Math.floor(rand() * 600))).toISOString(),
        }),
      );
      const timeline = buildAuditTimeline(records);
      for (let i = 1; i < timeline.length; i += 1) {
        expect(timeline[i - 1].changedAtMs).toBeGreaterThanOrEqual(timeline[i].changedAtMs);
      }
    }
  });

  it("desempata timestamps idênticos de forma determinística", () => {
    const same = "2026-02-02T12:00:00.000Z";
    const a = buildAuditTimeline([record({ id: "b", changed_at: same }), record({ id: "a", changed_at: same })]);
    const b = buildAuditTimeline([record({ id: "a", changed_at: same }), record({ id: "b", changed_at: same })]);
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
    expect(a.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("timestamp inválido não quebra a ordenação", () => {
    const timeline = buildAuditTimeline([
      record({ id: "x", changed_at: "não-é-data" }),
      record({ id: "y", changed_at: "2026-01-01T00:00:00.000Z" }),
    ]);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].id).toBe("y");
  });

  it("marca UPDATE sem alteração real como noop", () => {
    const snap = { label: "A", weight: 3 };
    const [entry] = buildAuditTimeline([record({ id: "1", before_data: snap, after_data: { ...snap } })]);
    expect(entry.noop).toBe(true);
    expect(entry.changes).toEqual([]);
  });

  it("usa o rótulo do estado anterior quando o prêmio foi excluído", () => {
    const [entry] = buildAuditTimeline([
      record({ id: "1", operation: "DELETE", before_data: { label: "Jackpot" }, after_data: null }),
    ]);
    expect(entry.prizeLabel).toBe("Jackpot");
    expect(entry.noop).toBe(false);
  });

  it("atribui autoria a Sistema quando não há usuário", () => {
    const [entry] = buildAuditTimeline([record({ id: "1", changed_by: null, changed_by_name: null })]);
    expect(entry.changedByName).toBe("Sistema");
  });

  it("cai para Administrador quando há id mas o nome não resolveu", () => {
    const [entry] = buildAuditTimeline([record({ id: "1", changed_by: "u1", changed_by_name: "   " })]);
    expect(entry.changedByName).toBe("Administrador");
  });

  it("trilha vazia devolve lista vazia", () => {
    expect(buildAuditTimeline([])).toEqual([]);
  });
});

describe("measureEconomicImpact — guarda contra inflação", () => {
  const base: OddsPrize[] = [
    { id: "1", label: "Moedas", prize_type: "coins", amount: 100, weight: 10, rarity: "common", is_active: true },
    { id: "2", label: "XP", prize_type: "xp", amount: 50, weight: 10, rarity: "common", is_active: true },
    { id: "3", label: "Nada", prize_type: "nothing", amount: 0, weight: 80, rarity: "common", is_active: true },
  ];

  it("dobrar o peso do prêmio em moedas aumenta o custo esperado", () => {
    const after = base.map((p) => (p.id === "1" ? { ...p, weight: 20 } : p));
    const impact = measureEconomicImpact(base, after);
    expect(impact.coinsAfter).toBeGreaterThan(impact.coinsBefore);
    expect(impact.coinsDelta).toBeGreaterThan(0);
    expect(impact.coinsDeltaRatio).toBeGreaterThan(0);
  });

  it("desativar o prêmio em moedas zera o custo em moedas", () => {
    const after = base.map((p) => (p.id === "1" ? { ...p, is_active: false } : p));
    const impact = measureEconomicImpact(base, after);
    expect(impact.coinsAfter).toBe(0);
    expect(impact.coinsDeltaRatio).toBeCloseTo(-1, 10);
    expect(impact.emptyAfter).toBeGreaterThan(impact.emptyBefore);
  });

  it("configuração idêntica produz delta exatamente zero", () => {
    const impact = measureEconomicImpact(base, base.map((p) => ({ ...p })));
    expect(impact.coinsDelta).toBe(0);
    expect(impact.xpDelta).toBe(0);
  });

  it("custo anterior zero não gera divisão por zero", () => {
    const before: OddsPrize[] = [
      { id: "3", label: "Nada", prize_type: "nothing", amount: 0, weight: 1, rarity: "common", is_active: true },
    ];
    const impact = measureEconomicImpact(before, base);
    expect(Number.isFinite(impact.coinsDeltaRatio)).toBe(true);
    expect(impact.coinsDeltaRatio).toBe(0);
  });

  it("mantém coerência em 300 calibrações aleatórias", () => {
    const rand = rng(1234);
    for (let i = 0; i < 300; i += 1) {
      const before: OddsPrize[] = Array.from({ length: 3 + Math.floor(rand() * 6) }, (_, idx) => ({
        id: `p${idx}`,
        label: `P${idx}`,
        prize_type: TYPES[Math.floor(rand() * TYPES.length)],
        amount: Math.floor(rand() * 300),
        weight: 1 + Math.floor(rand() * 50),
        rarity: "common",
        is_active: rand() > 0.2,
      }));
      const after = before.map((p) => ({ ...p, weight: 1 + Math.floor(rand() * 50) }));
      const impact = measureEconomicImpact(before, after);
      expect(Number.isFinite(impact.coinsDelta)).toBe(true);
      expect(Number.isFinite(impact.xpDelta)).toBe(true);
      expect(Number.isFinite(impact.coinsDeltaRatio)).toBe(true);
      expect(impact.emptyAfter).toBeGreaterThanOrEqual(0);
      expect(impact.emptyAfter).toBeLessThanOrEqual(1);
      expect(impact.coinsDelta).toBeCloseTo(impact.coinsAfter - impact.coinsBefore, 10);
    }
  });

  it("roleta vazia dos dois lados não lança", () => {
    expect(() => measureEconomicImpact([], [])).not.toThrow();
    expect(measureEconomicImpact([], []).coinsDelta).toBe(0);
  });
});

describe("summarizeAudit — consolidação", () => {
  it("conta operações, editores e campos em 150 trilhas aleatórias", () => {
    const rand = rng(777);
    for (let round = 0; round < 150; round += 1) {
      const size = Math.floor(rand() * 20);
      const records: AuditRecord[] = Array.from({ length: size }, (_, i) => {
        const op = (["INSERT", "UPDATE", "DELETE"] as const)[Math.floor(rand() * 3)];
        const before = randomSnapshot(rand, `p${i}`);
        return record({
          id: `r${round}-${i}`,
          operation: op,
          changed_by: `admin-${Math.floor(rand() * 3)}`,
          before_data: op === "INSERT" ? null : before,
          after_data: op === "DELETE" ? null : { ...before, weight: Number(before.weight) + 1 },
          changed_at: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
        });
      });

      const timeline = buildAuditTimeline(records);
      const summary = summarizeAudit(timeline);
      expect(summary.total).toBe(size);
      expect(summary.inserts + summary.updates + summary.deletes).toBe(size);
      expect(summary.editors).toBeLessThanOrEqual(3);
      const totalFieldChanges = Object.values(summary.fieldCounts).reduce((a, b) => a + b, 0);
      expect(totalFieldChanges).toBe(timeline.reduce((acc, e) => acc + e.changes.length, 0));
      if (size > 0) expect(summary.lastChangeAt).toBeTruthy();
      else expect(summary.lastChangeAt).toBeNull();
    }
  });

  it("trilha vazia devolve resumo zerado e seguro", () => {
    const summary = summarizeAudit([]);
    expect(summary).toMatchObject({ total: 0, inserts: 0, updates: 0, deletes: 0, editors: 0, lastChangeAt: null });
    for (const field of AUDITED_FIELDS) expect(summary.fieldCounts[field]).toBe(0);
  });
});

describe("formatFieldValue — apresentação", () => {
  it("traduz booleanos e trata vazios", () => {
    expect(formatFieldValue("is_active", true)).toBe("Sim");
    expect(formatFieldValue("is_active", "false")).toBe("Não");
    expect(formatFieldValue("label", null)).toBe("—");
    expect(formatFieldValue("label", "")).toBe("—");
    expect(formatFieldValue("weight", 0)).toBe("0");
  });
});