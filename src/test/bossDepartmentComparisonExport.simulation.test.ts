import { describe, it, expect } from "vitest";
import {
  buildBossComparisonCsv,
  bossComparisonFileName,
  BOSS_COMPARISON_CSV_HEADERS,
} from "@/lib/bossDepartmentComparisonExport";
import { compareDepartments } from "@/lib/bossDepartmentComparison";
import type { BossHistoryInput } from "@/lib/bossHistory";

const STATUSES = ["draft", "running", "defeated", "expired", "settled"] as const;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function makeBattles(seed: number, count: number): BossHistoryInput[] {
  const rand = rng(seed);
  const deps = ["dep-a", "dep-b", "dep-c", null];
  return Array.from({ length: count }, (_, i) => {
    const total = Math.trunc(rand() * 3000) + 1;
    const end = Date.UTC(2025, Math.trunc(rand() * 12), 1 + Math.trunc(rand() * 27));
    const dated = rand() > 0.12;
    return {
      id: `b-${seed}-${i}`,
      status: STATUSES[Math.trunc(rand() * STATUSES.length)],
      total_hp: total,
      current_hp: Math.trunc(rand() * total),
      starts_at: new Date(end - 3600_000).toISOString(),
      ends_at: dated ? new Date(end).toISOString() : null,
      defeated_at: rand() < 0.5 && dated ? new Date(end).toISOString() : null,
      coins_pool: Math.trunc(rand() * 400),
      xp_pool: Math.trunc(rand() * 400),
      department_id: deps[Math.trunc(rand() * deps.length)],
    };
  });
}

/** Parser mínimo RFC 4180 para validar o que geramos. */
function parseCsv(text: string): string[][] {
  const body = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\r" && body[i + 1] === "\n") {
      row.push(field); rows.push(row); row = []; field = ""; i++;
      continue;
    }
    field += ch;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

describe("buildBossComparisonCsv — simulação massiva", () => {
  it("mantém integridade em 600 cenários", () => {
    for (let seed = 1; seed <= 600; seed++) {
      const battles = makeBattles(seed, 14);
      const window = seed % 3 === 0
        ? { from: "2025-03-01T00:00:00Z", to: "2025-10-31T23:59:59Z" }
        : {};
      const names = new Map([["dep-a", 'Vendas, "Sul"'], ["dep-b", "=CMD()"]]);
      const csv = buildBossComparisonCsv(battles, { ...window, departmentNames: names });
      const expected = compareDepartments(battles, window);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      const rows = parseCsv(csv);
      expect(rows[0]).toEqual([...BOSS_COMPARISON_CSV_HEADERS]);
      expect(rows.length - 1).toBe(expected.rows.length);

      rows.slice(1).forEach((cols, idx) => {
        const src = expected.rows[idx];
        expect(cols.length).toBe(BOSS_COMPARISON_CSV_HEADERS.length);
        expect(Number(cols[0])).toBe(src.rank);
        expect(cols[1]).toBe(src.departmentId);
        expect(Number(cols[3])).toBe(src.battles);
        expect(Number(cols[4])).toBe(src.victories);
        expect(Number(cols[5])).toBe(src.defeats);
        expect(Number(cols[8])).toBe(src.hpDestroyed);
        // nunca exportar fórmula executável
        expect(/^[=+\-@]/.test(cols[2])).toBe(false);
      });
    }
  });

  it("escapa aspas, vírgulas e fórmulas nos rótulos", () => {
    const battles: BossHistoryInput[] = [
      { id: "1", status: "settled", total_hp: 100, current_hp: 0, starts_at: "2025-01-01T00:00:00Z", ends_at: "2025-01-02T00:00:00Z", defeated_at: "2025-01-02T00:00:00Z", coins_pool: 10, xp_pool: 10, department_id: "d1" },
      { id: "2", status: "expired", total_hp: 100, current_hp: 50, starts_at: "2025-01-01T00:00:00Z", ends_at: "2025-01-03T00:00:00Z", defeated_at: null, coins_pool: 0, xp_pool: 0, department_id: "d2" },
    ];
    const csv = buildBossComparisonCsv(battles, {
      departmentNames: { d1: '=SUM(A1)', d2: 'Ops, "Norte"' },
    });
    expect(csv).toContain(`"'=SUM(A1)"`);
    expect(csv).toContain(`"Ops, ""Norte"""`);
  });

  it("gera nomes de arquivo seguros e estáveis", () => {
    const now = new Date("2025-07-28T10:00:00Z");
    expect(bossComparisonFileName("Últimos 90 dias", now)).toBe(
      "chefao-comparativo-ultimos-90-dias-2025-07-28.csv",
    );
    expect(bossComparisonFileName("", now)).toBe("chefao-comparativo-geral-2025-07-28.csv");
    expect(bossComparisonFileName("../../etc/passwd", now)).toBe(
      "chefao-comparativo-etc-passwd-2025-07-28.csv",
    );
  });

  it("retorna apenas cabeçalho quando não há batalhas concluídas", () => {
    const csv = buildBossComparisonCsv([]);
    expect(parseCsv(csv).length).toBe(1);
  });
});
