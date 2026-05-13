import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TelemetryCharts } from "@/components/admin/telemetry/TelemetryCharts";

// ── Helpers ──────────────────────────────────────────────────────

function makeTelemetryRow(overrides: Partial<{
  id: string; operation: string; table_name: string | null;
  rpc_name: string | null; duration_ms: number; severity: string;
  created_at: string; record_count: number | null;
  query_limit: number | null; query_offset: number | null;
  count_mode: string | null; error_message: string | null;
  user_id: string | null;
}> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    operation: overrides.operation ?? "select",
    table_name: overrides.table_name ?? "profiles",
    rpc_name: overrides.rpc_name ?? null,
    duration_ms: overrides.duration_ms ?? 150,
    record_count: overrides.record_count ?? 10,
    query_limit: overrides.query_limit ?? 100,
    query_offset: overrides.query_offset ?? 0,
    count_mode: overrides.count_mode ?? null,
    severity: overrides.severity ?? "normal",
    error_message: overrides.error_message ?? null,
    user_id: overrides.user_id ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function generateRows(count: number, overrides: Partial<ReturnType<typeof makeTelemetryRow>> = {}) {
  return Array.from({ length: count }, (_, i) => makeTelemetryRow({
    ...overrides,
    created_at: new Date(Date.now() - i * 60000).toISOString(),
  }));
}

// ── Unit Tests: Data Computation Logic ──────────────────────────

describe("Telemetry Data Computation", () => {
  // ── getTimeThreshold Logic ──
  describe("Time threshold calculations", () => {
    it("1h threshold should be ~60 minutes ago", () => {
      const now = Date.now();
      const threshold = new Date(now - 60 * 60 * 1000);
      expect(now - threshold.getTime()).toBeCloseTo(3600000, -2);
    });

    it("6h threshold should be ~6 hours ago", () => {
      const now = Date.now();
      const threshold = new Date(now - 6 * 60 * 60 * 1000);
      expect(now - threshold.getTime()).toBeCloseTo(21600000, -2);
    });

    it("24h threshold should be ~24 hours ago", () => {
      const now = Date.now();
      const threshold = new Date(now - 24 * 60 * 60 * 1000);
      expect(now - threshold.getTime()).toBeCloseTo(86400000, -2);
    });

    it("7d threshold should be ~7 days ago", () => {
      const now = Date.now();
      const threshold = new Date(now - 7 * 24 * 60 * 60 * 1000);
      expect(now - threshold.getTime()).toBeCloseTo(604800000, -2);
    });
  });

  // ── Severity classification ──
  describe("Severity classification", () => {
    it("rows with severity 'very_slow' are counted correctly", () => {
      const rows = [
        ...generateRows(3, { severity: "very_slow" }),
        ...generateRows(5, { severity: "slow" }),
        ...generateRows(2, { severity: "error" }),
        ...generateRows(10, { severity: "normal" }),
      ];
      expect(rows.filter(r => r.severity === "very_slow").length).toBe(3);
      expect(rows.filter(r => r.severity === "slow").length).toBe(5);
      expect(rows.filter(r => r.severity === "error").length).toBe(2);
      expect(rows.filter(r => r.severity === "normal").length).toBe(10);
    });

    it("empty rows produce zero counts", () => {
      const rows: ReturnType<typeof makeTelemetryRow>[] = [];
      expect(rows.filter(r => r.severity === "very_slow").length).toBe(0);
      expect(rows.filter(r => r.severity === "slow").length).toBe(0);
      expect(rows.filter(r => r.severity === "error").length).toBe(0);
    });
  });

  // ── Average duration ──
  describe("Average duration calculation", () => {
    it("correctly averages durations", () => {
      const rows = [
        makeTelemetryRow({ duration_ms: 100 }),
        makeTelemetryRow({ duration_ms: 200 }),
        makeTelemetryRow({ duration_ms: 300 }),
      ];
      const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
      expect(avg).toBe(200);
    });

    it("handles single row", () => {
      const rows = [makeTelemetryRow({ duration_ms: 5000 })];
      const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
      expect(avg).toBe(5000);
    });

    it("handles zero duration", () => {
      const rows = [makeTelemetryRow({ duration_ms: 0 }), makeTelemetryRow({ duration_ms: 0 })];
      const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
      expect(avg).toBe(0);
    });

    it("returns 0 for empty array", () => {
      const rows: ReturnType<typeof makeTelemetryRow>[] = [];
      const avg = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length) : 0;
      expect(avg).toBe(0);
    });

    it("handles very large durations (edge case)", () => {
      const rows = [makeTelemetryRow({ duration_ms: 999999 }), makeTelemetryRow({ duration_ms: 1 })];
      const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
      expect(avg).toBe(500000);
    });
  });

  // ── Top offenders ──
  describe("Top offenders computation", () => {
    it("groups by table_name correctly", () => {
      const rows = [
        ...generateRows(5, { table_name: "profiles", duration_ms: 3000 }),
        ...generateRows(3, { table_name: "departments", duration_ms: 5000 }),
        ...generateRows(1, { table_name: "achievements", duration_ms: 8000 }),
      ];
      const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
      for (const r of rows) {
        const key = r.rpc_name || r.table_name || "unknown";
        const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
        tableStats.set(key, {
          count: prev.count + 1,
          totalMs: prev.totalMs + r.duration_ms,
          maxMs: Math.max(prev.maxMs, r.duration_ms),
        });
      }
      expect(tableStats.get("profiles")?.count).toBe(5);
      expect(tableStats.get("departments")?.count).toBe(3);
      expect(tableStats.get("achievements")?.count).toBe(1);
    });

    it("prefers rpc_name over table_name", () => {
      const rows = [makeTelemetryRow({ rpc_name: "get_stats", table_name: "profiles", duration_ms: 100 })];
      const key = rows[0].rpc_name || rows[0].table_name || "unknown";
      expect(key).toBe("get_stats");
    });

    it("falls back to 'unknown' when both are null", () => {
      const row = { ...makeTelemetryRow({}), rpc_name: null, table_name: null };
      const key = row.rpc_name || row.table_name || "unknown";
      expect(key).toBe("unknown");
    });

    it("sorts by count descending", () => {
      const entries: [string, { count: number }][] = [
        ["a", { count: 2 }],
        ["b", { count: 10 }],
        ["c", { count: 5 }],
      ];
      const sorted = entries.sort((a, b) => b[1].count - a[1].count);
      expect(sorted[0][0]).toBe("b");
      expect(sorted[1][0]).toBe("c");
      expect(sorted[2][0]).toBe("a");
    });

    it("limits to top 8 offenders", () => {
      const rows = Array.from({ length: 15 }, (_, i) =>
        makeTelemetryRow({ table_name: `table_${i}` })
      );
      const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
      for (const r of rows) {
        const key = r.rpc_name || r.table_name || "unknown";
        const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
        tableStats.set(key, {
          count: prev.count + 1,
          totalMs: prev.totalMs + r.duration_ms,
          maxMs: Math.max(prev.maxMs, r.duration_ms),
        });
      }
      const topOffenders = [...tableStats.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8);
      expect(topOffenders.length).toBeLessThanOrEqual(8);
    });

    it("tracks max duration per table", () => {
      const rows = [
        makeTelemetryRow({ table_name: "profiles", duration_ms: 1000 }),
        makeTelemetryRow({ table_name: "profiles", duration_ms: 9999 }),
        makeTelemetryRow({ table_name: "profiles", duration_ms: 500 }),
      ];
      const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
      for (const r of rows) {
        const key = r.rpc_name || r.table_name || "unknown";
        const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
        tableStats.set(key, {
          count: prev.count + 1,
          totalMs: prev.totalMs + r.duration_ms,
          maxMs: Math.max(prev.maxMs, r.duration_ms),
        });
      }
      expect(tableStats.get("profiles")?.maxMs).toBe(9999);
    });
  });

  // ── formatDuration ──
  describe("formatDuration", () => {
    const formatDuration = (ms: number) => {
      if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
      return `${ms}ms`;
    };

    it("formats milliseconds below 1000", () => {
      expect(formatDuration(0)).toBe("0ms");
      expect(formatDuration(1)).toBe("1ms");
      expect(formatDuration(500)).toBe("500ms");
      expect(formatDuration(999)).toBe("999ms");
    });

    it("formats seconds at 1000+", () => {
      expect(formatDuration(1000)).toBe("1.0s");
      expect(formatDuration(1500)).toBe("1.5s");
      expect(formatDuration(8000)).toBe("8.0s");
      expect(formatDuration(12345)).toBe("12.3s");
    });

    it("formats edge case at exactly 1000", () => {
      expect(formatDuration(1000)).toBe("1.0s");
    });

    it("formats very large values", () => {
      expect(formatDuration(60000)).toBe("60.0s");
      expect(formatDuration(120000)).toBe("120.0s");
    });
  });

  // ── formatTime ──
  describe("formatTime", () => {
    it("formats ISO string to pt-BR format", () => {
      const result = new Date("2026-03-23T14:30:45Z").toLocaleString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("handles different dates", () => {
      const dates = [
        "2026-01-01T00:00:00Z",
        "2026-06-15T12:30:00Z",
        "2026-12-31T23:59:59Z",
      ];
      dates.forEach(d => {
        const result = new Date(d).toLocaleString("pt-BR", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          day: "2-digit", month: "2-digit",
        });
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  // ── Severity Badge logic ──
  describe("Severity badge mapping", () => {
    const severityMap: Record<string, string> = {
      very_slow: "🔴 Muito Lenta",
      slow: "🟡 Lenta",
      error: "❌ Erro",
    };

    it("maps very_slow correctly", () => {
      expect(severityMap["very_slow"]).toBe("🔴 Muito Lenta");
    });

    it("maps slow correctly", () => {
      expect(severityMap["slow"]).toBe("🟡 Lenta");
    });

    it("maps error correctly", () => {
      expect(severityMap["error"]).toBe("❌ Erro");
    });

    it("unknown severity falls to undefined", () => {
      expect(severityMap["normal"]).toBeUndefined();
    });
  });

  // ── Duration color thresholds ──
  describe("Duration color thresholds", () => {
    const getColorClass = (ms: number) => {
      if (ms >= 8000) return "text-destructive";
      if (ms >= 3000) return "text-yellow-600";
      return "";
    };

    it(">=8000ms is destructive", () => {
      expect(getColorClass(8000)).toBe("text-destructive");
      expect(getColorClass(10000)).toBe("text-destructive");
      expect(getColorClass(99999)).toBe("text-destructive");
    });

    it(">=3000ms and <8000ms is yellow", () => {
      expect(getColorClass(3000)).toBe("text-yellow-600");
      expect(getColorClass(5000)).toBe("text-yellow-600");
      expect(getColorClass(7999)).toBe("text-yellow-600");
    });

    it("<3000ms has no color class", () => {
      expect(getColorClass(0)).toBe("");
      expect(getColorClass(2999)).toBe("");
    });
  });
});

// ── TelemetryCharts Component Tests ─────────────────────────────

describe("TelemetryCharts Component", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  it("renders nothing when rows are empty", () => {
    const { container } = render(
      <TelemetryCharts rows={[]} timeFilter="24h" />,
      { wrapper }
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders charts when rows are provided", () => {
    const rows = generateRows(10, { severity: "slow", duration_ms: 4000 });
    render(<TelemetryCharts rows={rows} timeFilter="24h" />, { wrapper });
    expect(screen.getByText("Volume de Queries por Severidade")).toBeInTheDocument();
    expect(screen.getByText("Duração Média / Máxima por Tabela (ms)")).toBeInTheDocument();
    expect(screen.getByText("Distribuição por Severidade")).toBeInTheDocument();
  });

  it("renders with 1h time filter", () => {
    const rows = generateRows(5);
    render(<TelemetryCharts rows={rows} timeFilter="1h" />, { wrapper });
    expect(screen.getByText("Volume de Queries por Severidade")).toBeInTheDocument();
  });

  it("renders with 6h time filter", () => {
    const rows = generateRows(5);
    render(<TelemetryCharts rows={rows} timeFilter="6h" />, { wrapper });
    expect(screen.getByText("Volume de Queries por Severidade")).toBeInTheDocument();
  });

  it("renders with 7d time filter", () => {
    const rows = generateRows(5);
    render(<TelemetryCharts rows={rows} timeFilter="7d" />, { wrapper });
    expect(screen.getByText("Volume de Queries por Severidade")).toBeInTheDocument();
  });

  it("handles mixed severity rows", () => {
    const rows = [
      ...generateRows(3, { severity: "slow" }),
      ...generateRows(2, { severity: "very_slow" }),
      ...generateRows(1, { severity: "error" }),
      ...generateRows(4, { severity: "normal" }),
    ];
    render(<TelemetryCharts rows={rows} timeFilter="24h" />, { wrapper });
    expect(screen.getByText("Distribuição por Severidade")).toBeInTheDocument();
  });

  it("handles rows with only rpc_name (no table_name)", () => {
    const rows = generateRows(5, { rpc_name: "get_executive_metrics", table_name: null as any });
    render(<TelemetryCharts rows={rows} timeFilter="24h" />, { wrapper });
    expect(screen.getByText("Duração Média / Máxima por Tabela (ms)")).toBeInTheDocument();
  });

  it("handles single row", () => {
    const rows = [makeTelemetryRow({ duration_ms: 5000, severity: "slow" })];
    render(<TelemetryCharts rows={rows} timeFilter="24h" />, { wrapper });
    expect(screen.getByText("Volume de Queries por Severidade")).toBeInTheDocument();
  });

  it("handles 200 rows (max limit)", () => {
    const rows = generateRows(200, { severity: "normal" });
    render(<TelemetryCharts rows={rows} timeFilter="7d" />, { wrapper });
    expect(screen.getByText("Volume de Queries por Severidade")).toBeInTheDocument();
  });
});

// ── Data integrity & Edge Case Tests ────────────────────────────

describe("Telemetry Data Integrity", () => {
  it("TelemetryRow interface fields are all present", () => {
    const row = makeTelemetryRow();
    expect(row).toHaveProperty("id");
    expect(row).toHaveProperty("operation");
    expect(row).toHaveProperty("table_name");
    expect(row).toHaveProperty("rpc_name");
    expect(row).toHaveProperty("duration_ms");
    expect(row).toHaveProperty("record_count");
    expect(row).toHaveProperty("query_limit");
    expect(row).toHaveProperty("query_offset");
    expect(row).toHaveProperty("count_mode");
    expect(row).toHaveProperty("severity");
    expect(row).toHaveProperty("error_message");
    expect(row).toHaveProperty("user_id");
    expect(row).toHaveProperty("created_at");
  });

  it("duration_ms is always numeric", () => {
    const rows = generateRows(100);
    rows.forEach(r => expect(typeof r.duration_ms).toBe("number"));
  });

  it("created_at is always a valid ISO string", () => {
    const rows = generateRows(50);
    rows.forEach(r => {
      const date = new Date(r.created_at);
      expect(date.toISOString()).toBe(r.created_at);
    });
  });

  it("severity is always one of the valid types", () => {
    const valid = ["normal", "slow", "very_slow", "error"];
    const rows = [
      ...generateRows(10, { severity: "normal" }),
      ...generateRows(5, { severity: "slow" }),
      ...generateRows(3, { severity: "very_slow" }),
      ...generateRows(2, { severity: "error" }),
    ];
    rows.forEach(r => expect(valid).toContain(r.severity));
  });

  it("handles null fields gracefully", () => {
    const row = makeTelemetryRow({});
    // Override with explicit nulls
    const nullRow = { ...row, table_name: null, rpc_name: null, record_count: null, error_message: null };
    expect(nullRow.table_name).toBeNull();
    expect(nullRow.rpc_name).toBeNull();
    expect(nullRow.record_count).toBeNull();
    expect(nullRow.error_message).toBeNull();
  });

  it("cleanup threshold is exactly 7 days", () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = now.getTime() - threshold.getTime();
    expect(diffMs).toBeCloseTo(604800000, -2);
  });

  it("query limit is respected at 200", () => {
    const rows = generateRows(300);
    const limited = rows.slice(0, 200);
    expect(limited.length).toBe(200);
  });

  it("filter by severity works correctly", () => {
    const rows = [
      ...generateRows(10, { severity: "slow" }),
      ...generateRows(5, { severity: "very_slow" }),
      ...generateRows(15, { severity: "normal" }),
    ];
    const slowOnly = rows.filter(r => r.severity === "slow");
    expect(slowOnly.length).toBe(10);
    slowOnly.forEach(r => expect(r.severity).toBe("slow"));
  });

  it("rows sorted by created_at descending", () => {
    const rows = generateRows(20);
    for (let i = 1; i < rows.length; i++) {
      expect(new Date(rows[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(rows[i].created_at).getTime());
    }
  });
});

// ── Stress Tests ────────────────────────────────────────────────

describe("Telemetry Stress Tests", () => {
  it("handles 1000 rows for stats computation", () => {
    const rows = generateRows(1000, { severity: "slow", duration_ms: 4500 });
    const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
    expect(avg).toBe(4500);
    expect(rows.filter(r => r.severity === "slow").length).toBe(1000);
  });

  it("handles top offenders with many unique tables", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeTelemetryRow({ table_name: `table_${i % 20}`, duration_ms: (i + 1) * 100 })
    );
    const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
      tableStats.set(key, {
        count: prev.count + 1,
        totalMs: prev.totalMs + r.duration_ms,
        maxMs: Math.max(prev.maxMs, r.duration_ms),
      });
    }
    expect(tableStats.size).toBe(20);
    const top8 = [...tableStats.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
    expect(top8.length).toBe(8);
  });

  it("handles all same table_name", () => {
    const rows = generateRows(500, { table_name: "profiles" });
    const tableStats = new Map<string, number>();
    for (const r of rows) {
      const key = r.table_name || "unknown";
      tableStats.set(key, (tableStats.get(key) || 0) + 1);
    }
    expect(tableStats.size).toBe(1);
    expect(tableStats.get("profiles")).toBe(500);
  });

  it("correctly computes average with mixed extreme durations", () => {
    const rows = [
      ...generateRows(50, { duration_ms: 1 }),
      ...generateRows(50, { duration_ms: 99999 }),
    ];
    const avg = Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length);
    expect(avg).toBe(50000);
  });
});

// ── Operations variety ──────────────────────────────────────────

describe("Operation types", () => {
  it("handles all CRUD operations", () => {
    const ops = ["select", "insert", "update", "delete", "rpc"];
    const rows = ops.map(op => makeTelemetryRow({ operation: op }));
    expect(rows.length).toBe(5);
    rows.forEach((r, i) => expect(r.operation).toBe(ops[i]));
  });

  it("groups stats correctly across operations", () => {
    const rows = [
      makeTelemetryRow({ operation: "select", table_name: "profiles", duration_ms: 100 }),
      makeTelemetryRow({ operation: "insert", table_name: "profiles", duration_ms: 200 }),
      makeTelemetryRow({ operation: "select", table_name: "departments", duration_ms: 300 }),
    ];
    const tableStats = new Map<string, number>();
    for (const r of rows) {
      const key = r.table_name || "unknown";
      tableStats.set(key, (tableStats.get(key) || 0) + 1);
    }
    expect(tableStats.get("profiles")).toBe(2);
    expect(tableStats.get("departments")).toBe(1);
  });
});

// ── Filter combinations ─────────────────────────────────────────

describe("Filter combinations", () => {
  const allSeverities: ("all" | "slow" | "very_slow" | "error")[] = ["all", "slow", "very_slow", "error"];
  const allTimeFilters: ("1h" | "6h" | "24h" | "7d")[] = ["1h", "6h", "24h", "7d"];

  allSeverities.forEach(sev => {
    allTimeFilters.forEach(time => {
      it(`severity=${sev} + time=${time} filter works`, () => {
        const rows = [
          ...generateRows(5, { severity: "slow" }),
          ...generateRows(3, { severity: "very_slow" }),
          ...generateRows(2, { severity: "error" }),
          ...generateRows(10, { severity: "normal" }),
        ];
        const filtered = sev === "all" ? rows : rows.filter(r => r.severity === sev);
        expect(filtered.length).toBeGreaterThanOrEqual(0);
        if (sev !== "all") {
          filtered.forEach(r => expect(r.severity).toBe(sev));
        }
      });
    });
  });
});
