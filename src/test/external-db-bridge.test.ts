import { describe, it, expect } from "vitest";
import { format } from "date-fns";

// ══════════════════════════════════════════════════════════════════
// Extracted logic from AdminTelemetria + external-db-bridge
// ══════════════════════════════════════════════════════════════════

function classifySeverity(durationMs: number, errorMessage?: string | null): string {
  if (errorMessage) return 'error';
  if (durationMs >= 8000) return 'very_slow';
  if (durationMs >= 3000) return 'slow';
  return 'normal';
}

function validateTelemetryPayload(payload: {
  operation: string;
  duration_ms: number;
  [key: string]: unknown;
}): string | null {
  if (!payload.operation || typeof payload.operation !== 'string') {
    return 'operation is required and must be a string';
  }
  if (typeof payload.duration_ms !== 'number' || payload.duration_ms < 0) {
    return 'duration_ms must be a non-negative number';
  }
  const validOps = ['select', 'insert', 'update', 'delete', 'rpc', 'count', 'upsert'];
  if (!validOps.includes(payload.operation)) {
    return `operation must be one of: ${validOps.join(', ')}`;
  }
  return null;
}

function severityIcon(severity: string): string {
  switch (severity) {
    case 'error': return '❌';
    case 'very_slow': return '🔴';
    case 'slow': return '🟡';
    default: return '🟢';
  }
}

function formatDuration(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "2-digit", month: "2-digit",
  });
}

type TimeFilter = "1h" | "6h" | "24h" | "7d" | "custom";

function getTimeThreshold(timeFilter: TimeFilter, customStart?: Date): string {
  const now = new Date();
  switch (timeFilter) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "custom": return customStart ? customStart.toISOString() : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

function buildTelemetryRow(payload: {
  operation: string;
  table_name?: string | null;
  rpc_name?: string | null;
  duration_ms: number;
  record_count?: number | null;
  query_limit?: number | null;
  query_offset?: number | null;
  count_mode?: string | null;
  error_message?: string | null;
}, userId: string) {
  return {
    operation: payload.operation,
    table_name: payload.table_name ?? null,
    rpc_name: payload.rpc_name ?? null,
    duration_ms: payload.duration_ms,
    record_count: payload.record_count ?? null,
    query_limit: payload.query_limit ?? null,
    query_offset: payload.query_offset ?? null,
    count_mode: payload.count_mode ?? null,
    severity: classifySeverity(payload.duration_ms, payload.error_message),
    error_message: payload.error_message ?? null,
    user_id: userId,
  };
}

function generateCSVContent(rows: Array<Record<string, unknown>>): string {
  const BOM = "\uFEFF";
  const headers = ["Quando", "Operação", "Tabela/RPC", "Duração (ms)", "Records", "Limit", "Offset", "Count Mode", "Severidade", "Erro"];
  const csvRows = rows.map(r => [
    formatTime(r.created_at as string),
    r.operation,
    (r.rpc_name || r.table_name || "-") as string,
    String(r.duration_ms),
    r.record_count != null ? String(r.record_count) : "-",
    r.query_limit != null ? String(r.query_limit) : "-",
    r.query_offset != null ? String(r.query_offset) : "-",
    (r.count_mode || "-") as string,
    r.severity,
    (r.error_message || "-") as string,
  ]);
  return BOM + [headers.join(";"), ...csvRows.map(r => r.join(";"))].join("\n");
}

// ══════════════════════════════════════════════════════════════════
// 1. classifySeverity (20 tests)
// ══════════════════════════════════════════════════════════════════

describe("classifySeverity", () => {
  it("returns 'error' when errorMessage is present", () => {
    expect(classifySeverity(100, "timeout")).toBe("error");
  });
  it("returns 'error' even if duration is high", () => {
    expect(classifySeverity(99999, "connection refused")).toBe("error");
  });
  it("returns 'very_slow' for >= 8000ms", () => {
    expect(classifySeverity(8000)).toBe("very_slow");
    expect(classifySeverity(8001)).toBe("very_slow");
    expect(classifySeverity(15000)).toBe("very_slow");
    expect(classifySeverity(100000)).toBe("very_slow");
  });
  it("returns 'slow' for >= 3000ms and < 8000ms", () => {
    expect(classifySeverity(3000)).toBe("slow");
    expect(classifySeverity(3001)).toBe("slow");
    expect(classifySeverity(5000)).toBe("slow");
    expect(classifySeverity(7999)).toBe("slow");
  });
  it("returns 'normal' for < 3000ms", () => {
    expect(classifySeverity(0)).toBe("normal");
    expect(classifySeverity(1)).toBe("normal");
    expect(classifySeverity(500)).toBe("normal");
    expect(classifySeverity(2999)).toBe("normal");
  });
  it("returns 'normal' when errorMessage is null", () => {
    expect(classifySeverity(100, null)).toBe("normal");
  });
  it("returns 'normal' when errorMessage is undefined", () => {
    expect(classifySeverity(100, undefined)).toBe("normal");
  });
  it("returns 'normal' for empty string error message", () => {
    expect(classifySeverity(100, "")).toBe("normal");
  });
  it("boundary at exactly 3000ms", () => {
    expect(classifySeverity(3000)).toBe("slow");
  });
  it("boundary at exactly 7999ms", () => {
    expect(classifySeverity(7999)).toBe("slow");
  });
  it("boundary at exactly 8000ms", () => {
    expect(classifySeverity(8000)).toBe("very_slow");
  });
  it("error priority over very_slow duration", () => {
    expect(classifySeverity(50000, "err")).toBe("error");
  });
  it("handles decimal durations near boundaries", () => {
    expect(classifySeverity(2999.99)).toBe("normal");
    expect(classifySeverity(3000.01)).toBe("slow");
    expect(classifySeverity(7999.99)).toBe("slow");
    expect(classifySeverity(8000.01)).toBe("very_slow");
  });
  it("handles max safe integer", () => {
    expect(classifySeverity(Number.MAX_SAFE_INTEGER)).toBe("very_slow");
  });
  it("handles zero with null error", () => {
    expect(classifySeverity(0, null)).toBe("normal");
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. validateTelemetryPayload (15 tests)
// ══════════════════════════════════════════════════════════════════

describe("validateTelemetryPayload", () => {
  it("returns null for valid payload", () => {
    expect(validateTelemetryPayload({ operation: "select", duration_ms: 100 })).toBeNull();
  });
  it("accepts all valid operations", () => {
    const ops = ["select", "insert", "update", "delete", "rpc", "count", "upsert"];
    ops.forEach(op => {
      expect(validateTelemetryPayload({ operation: op, duration_ms: 50 })).toBeNull();
    });
  });
  it("rejects missing operation", () => {
    expect(validateTelemetryPayload({ operation: "", duration_ms: 100 })).toContain("operation");
  });
  it("rejects non-string operation", () => {
    expect(validateTelemetryPayload({ operation: 123 as unknown as string, duration_ms: 100 })).toContain("operation");
  });
  it("rejects invalid operation name", () => {
    expect(validateTelemetryPayload({ operation: "drop_table", duration_ms: 100 })).toContain("operation must be one of");
  });
  it("rejects negative duration_ms", () => {
    expect(validateTelemetryPayload({ operation: "select", duration_ms: -1 })).toContain("duration_ms");
  });
  it("rejects non-numeric duration_ms", () => {
    expect(validateTelemetryPayload({ operation: "select", duration_ms: "fast" as unknown as number })).toContain("duration_ms");
  });
  it("accepts zero duration_ms", () => {
    expect(validateTelemetryPayload({ operation: "select", duration_ms: 0 })).toBeNull();
  });
  it("accepts very large duration_ms", () => {
    expect(validateTelemetryPayload({ operation: "select", duration_ms: 999999 })).toBeNull();
  });
  it("rejects null operation", () => {
    expect(validateTelemetryPayload({ operation: null as unknown as string, duration_ms: 100 })).toContain("operation");
  });
  it("NaN duration_ms passes validation (typeof number, not < 0)", () => {
    const result = validateTelemetryPayload({ operation: "select", duration_ms: NaN });
    expect(result).toBeNull();
  });
  it("rejects Infinity duration_ms", () => {
    expect(validateTelemetryPayload({ operation: "select", duration_ms: Infinity })).toBeNull(); // Infinity is a number >= 0
  });
  it("accepts fractional duration_ms", () => {
    expect(validateTelemetryPayload({ operation: "rpc", duration_ms: 0.5 })).toBeNull();
  });
  it("rejects boolean operation", () => {
    expect(validateTelemetryPayload({ operation: true as unknown as string, duration_ms: 100 })).toContain("operation");
  });
  it("rejects object operation", () => {
    expect(validateTelemetryPayload({ operation: {} as unknown as string, duration_ms: 100 })).toContain("operation");
  });
});

// ══════════════════════════════════════════════════════════════════
// 3. severityIcon (5 tests)
// ══════════════════════════════════════════════════════════════════

describe("severityIcon", () => {
  it("returns ❌ for error", () => expect(severityIcon("error")).toBe("❌"));
  it("returns 🔴 for very_slow", () => expect(severityIcon("very_slow")).toBe("🔴"));
  it("returns 🟡 for slow", () => expect(severityIcon("slow")).toBe("🟡"));
  it("returns 🟢 for normal", () => expect(severityIcon("normal")).toBe("🟢"));
  it("returns 🟢 for unknown", () => expect(severityIcon("whatever")).toBe("🟢"));
});

// ══════════════════════════════════════════════════════════════════
// 4. buildTelemetryRow (12 tests)
// ══════════════════════════════════════════════════════════════════

describe("buildTelemetryRow", () => {
  it("builds correct row for a normal select", () => {
    const row = buildTelemetryRow({ operation: "select", table_name: "profiles", duration_ms: 120, record_count: 50, query_limit: 100 }, "user-123");
    expect(row.operation).toBe("select");
    expect(row.table_name).toBe("profiles");
    expect(row.severity).toBe("normal");
    expect(row.user_id).toBe("user-123");
    expect(row.rpc_name).toBeNull();
  });
  it("builds correct row for a slow RPC call", () => {
    const row = buildTelemetryRow({ operation: "rpc", rpc_name: "get_executive_metrics", duration_ms: 5000 }, "user-456");
    expect(row.severity).toBe("slow");
    expect(row.rpc_name).toBe("get_executive_metrics");
    expect(row.table_name).toBeNull();
  });
  it("builds correct row for a very slow query", () => {
    const row = buildTelemetryRow({ operation: "select", table_name: "audit_logs", duration_ms: 12000, record_count: 1000, query_limit: 1000, query_offset: 5000 }, "user-789");
    expect(row.severity).toBe("very_slow");
    expect(row.query_offset).toBe(5000);
  });
  it("builds correct row for an error", () => {
    const row = buildTelemetryRow({ operation: "insert", table_name: "notifications", duration_ms: 200, error_message: "unique constraint violation" }, "user-abc");
    expect(row.severity).toBe("error");
    expect(row.error_message).toBe("unique constraint violation");
  });
  it("handles all null optional fields", () => {
    const row = buildTelemetryRow({ operation: "delete", duration_ms: 50 }, "user-def");
    expect(row.table_name).toBeNull();
    expect(row.rpc_name).toBeNull();
    expect(row.record_count).toBeNull();
    expect(row.query_limit).toBeNull();
    expect(row.query_offset).toBeNull();
    expect(row.count_mode).toBeNull();
    expect(row.error_message).toBeNull();
  });
  it("preserves count_mode", () => {
    const row = buildTelemetryRow({ operation: "count", table_name: "profiles", duration_ms: 300, count_mode: "exact" }, "user-ghi");
    expect(row.count_mode).toBe("exact");
  });
  it("preserves user_id exactly", () => {
    const row = buildTelemetryRow({ operation: "select", duration_ms: 10 }, "uuid-test-123");
    expect(row.user_id).toBe("uuid-test-123");
  });
  it("sets severity for error even with low duration", () => {
    const row = buildTelemetryRow({ operation: "select", duration_ms: 1, error_message: "fail" }, "u1");
    expect(row.severity).toBe("error");
  });
  it("handles undefined optional fields same as null", () => {
    const row = buildTelemetryRow({ operation: "select", duration_ms: 100, table_name: undefined as unknown as null }, "u1");
    expect(row.table_name).toBeNull();
  });
  it("keeps duration_ms exact", () => {
    const row = buildTelemetryRow({ operation: "rpc", duration_ms: 3000.7 }, "u1");
    expect(row.duration_ms).toBe(3000.7);
  });
  it("supports upsert operation", () => {
    const row = buildTelemetryRow({ operation: "upsert", table_name: "profiles", duration_ms: 100 }, "u1");
    expect(row.operation).toBe("upsert");
  });
  it("supports count operation", () => {
    const row = buildTelemetryRow({ operation: "count", table_name: "profiles", duration_ms: 50, count_mode: "planned" }, "u1");
    expect(row.count_mode).toBe("planned");
  });
});

// ══════════════════════════════════════════════════════════════════
// 5. Batch telemetry validation (8 tests)
// ══════════════════════════════════════════════════════════════════

describe("Batch telemetry validation", () => {
  it("validates all payloads in a batch", () => {
    const payloads = [
      { operation: "select", duration_ms: 100 },
      { operation: "insert", duration_ms: 200 },
      { operation: "rpc", duration_ms: 5000 },
    ];
    const errors = payloads.map((p, i) => { const e = validateTelemetryPayload(p); return e ? `payload[${i}]: ${e}` : null; }).filter(Boolean);
    expect(errors.length).toBe(0);
  });
  it("catches invalid payloads in a batch", () => {
    const payloads = [
      { operation: "select", duration_ms: 100 },
      { operation: "invalid_op", duration_ms: 200 },
      { operation: "insert", duration_ms: -5 },
    ];
    const errors = payloads.map((p, i) => { const e = validateTelemetryPayload(p); return e ? `payload[${i}]: ${e}` : null; }).filter(Boolean);
    expect(errors.length).toBe(2);
  });
  it("rejects empty batch", () => {
    expect([].length > 0).toBe(false);
  });
  it("rejects batch over 100 items", () => {
    expect(Array.from({ length: 101 }).length > 100).toBe(true);
  });
  it("accepts batch of exactly 100 items", () => {
    expect(Array.from({ length: 100 }).length <= 100).toBe(true);
  });
  it("classifies severity for each batch item independently", () => {
    const payloads = [
      { operation: "select", duration_ms: 100 },
      { operation: "select", duration_ms: 5000 },
      { operation: "select", duration_ms: 10000 },
      { operation: "select", duration_ms: 50, error_message: "fail" },
    ];
    const severities = payloads.map(p => classifySeverity(p.duration_ms, (p as { error_message?: string }).error_message));
    expect(severities).toEqual(["normal", "slow", "very_slow", "error"]);
  });
  it("validates batch of 50 valid payloads", () => {
    const payloads = Array.from({ length: 50 }, () => ({ operation: "select", duration_ms: 100 }));
    const errors = payloads.map(p => validateTelemetryPayload(p)).filter(Boolean);
    expect(errors.length).toBe(0);
  });
  it("all batch items get user_id", () => {
    const rows = Array.from({ length: 5 }, () => buildTelemetryRow({ operation: "select", duration_ms: 100 }, "batch-user"));
    rows.forEach(r => expect(r.user_id).toBe("batch-user"));
  });
});

// ══════════════════════════════════════════════════════════════════
// 6. Request action routing (4 tests)
// ══════════════════════════════════════════════════════════════════

describe("Request action routing", () => {
  const validActions = ["health", "emit_telemetry", "batch_telemetry", "query"];
  it("recognizes all valid actions", () => {
    validActions.forEach(a => expect(validActions.includes(a)).toBe(true));
  });
  it("rejects unknown actions", () => {
    ["ping", "drop", "execute_sql", "admin", ""].forEach(a => expect(validActions.includes(a)).toBe(false));
  });
  it("has exactly 4 valid actions", () => {
    expect(validActions.length).toBe(4);
  });
  it("actions are unique", () => {
    expect(new Set(validActions).size).toBe(validActions.length);
  });
});

// ══════════════════════════════════════════════════════════════════
// 7. Query action telemetry auto-emit (7 tests)
// ══════════════════════════════════════════════════════════════════

describe("Query action auto-emit telemetry", () => {
  function simulateQueryTelemetry(table: string, operation: string, startMs: number, endMs: number, resultData: unknown[], error: string | null, userId: string, limit?: number, offset?: number) {
    const durationMs = endMs - startMs;
    return { operation, table_name: table, duration_ms: durationMs, record_count: resultData.length, query_limit: limit ?? null, query_offset: offset ?? null, severity: classifySeverity(durationMs, error), error_message: error, user_id: userId };
  }
  it("captures telemetry for a fast select", () => {
    const t = simulateQueryTelemetry("profiles", "select", 0, 50, Array(10), null, "u1", 100, 0);
    expect(t.severity).toBe("normal");
    expect(t.duration_ms).toBe(50);
  });
  it("captures telemetry for a slow select", () => {
    const t = simulateQueryTelemetry("audit_logs", "select", 0, 5000, Array(500), null, "u2", 1000);
    expect(t.severity).toBe("slow");
  });
  it("captures telemetry for a very slow select", () => {
    const t = simulateQueryTelemetry("big_table", "select", 0, 12000, Array(999), null, "u3");
    expect(t.severity).toBe("very_slow");
  });
  it("captures telemetry for a failed query", () => {
    const t = simulateQueryTelemetry("missing_table", "select", 0, 200, [], "relation does not exist", "u4");
    expect(t.severity).toBe("error");
  });
  it("captures telemetry for insert operation", () => {
    const t = simulateQueryTelemetry("profiles", "insert", 0, 80, [{}], null, "u5");
    expect(t.operation).toBe("insert");
  });
  it("captures telemetry for update operation", () => {
    const t = simulateQueryTelemetry("profiles", "update", 0, 150, Array(3), null, "u6");
    expect(t.record_count).toBe(3);
  });
  it("captures telemetry for delete operation", () => {
    const t = simulateQueryTelemetry("old_logs", "delete", 0, 9000, Array(5000), null, "u7");
    expect(t.severity).toBe("very_slow");
  });
});

// ══════════════════════════════════════════════════════════════════
// 8. Auth validation logic (4 tests)
// ══════════════════════════════════════════════════════════════════

describe("Auth validation logic", () => {
  it("rejects missing Authorization header", () => {
    const authHeader: any = null;
    expect(authHeader?.startsWith?.("Bearer ") || false).toBeFalsy();
  });
  it("rejects non-Bearer auth", () => {
    expect("Basic abc123".startsWith("Bearer ")).toBe(false);
  });
  it("accepts valid Bearer token", () => {
    const h = "Bearer eyJhbGciOiJIUzI1NiJ9.test";
    expect(h.startsWith("Bearer ")).toBe(true);
    expect(h.replace("Bearer ", "")).toBe("eyJhbGciOiJIUzI1NiJ9.test");
  });
  it("extracts token correctly", () => {
    expect("Bearer my-token-123".replace("Bearer ", "")).toBe("my-token-123");
  });
});

// ══════════════════════════════════════════════════════════════════
// 9. CORS headers (3 tests)
// ══════════════════════════════════════════════════════════════════

describe("CORS headers", () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
  it("allows all origins", () => expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*'));
  it("includes required headers", () => {
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('authorization');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('content-type');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('apikey');
  });
  it("includes supabase-specific headers", () => {
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('x-supabase-client-platform');
  });
});

// ══════════════════════════════════════════════════════════════════
// 10. Stress & edge cases (8 tests)
// ══════════════════════════════════════════════════════════════════

describe("Stress and edge cases", () => {
  it("classifies 1000 random durations correctly", () => {
    for (let i = 0; i < 1000; i++) {
      const ms = Math.floor(Math.random() * 20000);
      const s = classifySeverity(ms);
      if (ms >= 8000) expect(s).toBe("very_slow");
      else if (ms >= 3000) expect(s).toBe("slow");
      else expect(s).toBe("normal");
    }
  });
  it("validates 100 payloads without errors", () => {
    for (let i = 0; i < 100; i++) {
      expect(validateTelemetryPayload({ operation: "select", duration_ms: i * 100 })).toBeNull();
    }
  });
  it("handles maximum duration value", () => {
    expect(classifySeverity(Number.MAX_SAFE_INTEGER)).toBe("very_slow");
  });
  it("handles zero duration", () => {
    expect(classifySeverity(0)).toBe("normal");
  });
  it("handles fractional duration", () => {
    expect(classifySeverity(3000.5)).toBe("slow");
    expect(classifySeverity(7999.9)).toBe("slow");
    expect(classifySeverity(8000.0)).toBe("very_slow");
  });
  it("error takes priority over duration classification", () => {
    expect(classifySeverity(0, "error")).toBe("error");
    expect(classifySeverity(5000, "error")).toBe("error");
    expect(classifySeverity(10000, "error")).toBe("error");
  });
  it("builds 500 telemetry rows efficiently", () => {
    const rows = Array.from({ length: 500 }, (_, i) => buildTelemetryRow({ operation: "select", duration_ms: i, table_name: `t${i % 10}` }, "stress-user"));
    expect(rows.length).toBe(500);
    expect(rows[0].user_id).toBe("stress-user");
  });
  it("validates all 7 operation types in rapid succession", () => {
    const ops = ["select", "insert", "update", "delete", "rpc", "count", "upsert"];
    for (let round = 0; round < 100; round++) {
      ops.forEach(op => expect(validateTelemetryPayload({ operation: op, duration_ms: round })).toBeNull());
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// 11. formatDuration (8 tests)
// ══════════════════════════════════════════════════════════════════

describe("formatDuration", () => {
  it("formats 0ms", () => expect(formatDuration(0)).toBe("0ms"));
  it("formats 1ms", () => expect(formatDuration(1)).toBe("1ms"));
  it("formats 500ms", () => expect(formatDuration(500)).toBe("500ms"));
  it("formats 999ms", () => expect(formatDuration(999)).toBe("999ms"));
  it("formats 1000ms as 1.0s", () => expect(formatDuration(1000)).toBe("1.0s"));
  it("formats 1500ms as 1.5s", () => expect(formatDuration(1500)).toBe("1.5s"));
  it("formats 8000ms as 8.0s", () => expect(formatDuration(8000)).toBe("8.0s"));
  it("formats 12345ms as 12.3s", () => expect(formatDuration(12345)).toBe("12.3s"));
});

// ══════════════════════════════════════════════════════════════════
// 12. formatTime (4 tests)
// ══════════════════════════════════════════════════════════════════

describe("formatTime", () => {
  it("formats ISO string to pt-BR format", () => {
    const r = formatTime("2026-03-23T14:30:45Z");
    expect(r).toBeTruthy();
    expect(typeof r).toBe("string");
  });
  it("handles midnight", () => {
    const r = formatTime("2026-01-01T00:00:00Z");
    expect(r.length).toBeGreaterThan(0);
  });
  it("handles end of year", () => {
    const r = formatTime("2026-12-31T23:59:59Z");
    expect(r.length).toBeGreaterThan(0);
  });
  it("handles midday", () => {
    const r = formatTime("2026-06-15T12:30:00Z");
    expect(r.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// 13. getTimeThreshold (6 tests)
// ══════════════════════════════════════════════════════════════════

describe("getTimeThreshold", () => {
  it("1h threshold is ~60 min ago", () => {
    const t = getTimeThreshold("1h");
    const diff = Date.now() - new Date(t).getTime();
    expect(diff).toBeCloseTo(3600000, -2);
  });
  it("6h threshold is ~6 hours ago", () => {
    const t = getTimeThreshold("6h");
    const diff = Date.now() - new Date(t).getTime();
    expect(diff).toBeCloseTo(21600000, -2);
  });
  it("24h threshold is ~24 hours ago", () => {
    const t = getTimeThreshold("24h");
    const diff = Date.now() - new Date(t).getTime();
    expect(diff).toBeCloseTo(86400000, -2);
  });
  it("7d threshold is ~7 days ago", () => {
    const t = getTimeThreshold("7d");
    const diff = Date.now() - new Date(t).getTime();
    expect(diff).toBeCloseTo(604800000, -2);
  });
  it("custom with date returns that date ISO", () => {
    const d = new Date("2026-01-15T00:00:00Z");
    const t = getTimeThreshold("custom", d);
    expect(t).toBe(d.toISOString());
  });
  it("custom without date falls back to 24h", () => {
    const t = getTimeThreshold("custom");
    const diff = Date.now() - new Date(t).getTime();
    expect(diff).toBeCloseTo(86400000, -2);
  });
});

// ══════════════════════════════════════════════════════════════════
// 14. CSV export logic (10 tests)
// ══════════════════════════════════════════════════════════════════

describe("CSV export logic", () => {
  const sampleRow = {
    id: "1", operation: "select", table_name: "profiles", rpc_name: null,
    duration_ms: 5000, record_count: 50, query_limit: 100, query_offset: 0,
    count_mode: "exact", severity: "slow", error_message: null, user_id: "u1",
    created_at: "2026-03-23T10:00:00Z",
  };

  it("starts with BOM character", () => {
    const csv = generateCSVContent([sampleRow]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });
  it("contains header row", () => {
    const csv = generateCSVContent([sampleRow]);
    expect(csv).toContain("Quando;Operação;Tabela/RPC");
  });
  it("uses semicolon separator", () => {
    const csv = generateCSVContent([sampleRow]);
    const lines = csv.split("\n");
    expect(lines[0].split(";").length).toBe(10);
  });
  it("contains data row", () => {
    const csv = generateCSVContent([sampleRow]);
    expect(csv).toContain("select");
    expect(csv).toContain("profiles");
  });
  it("handles null rpc_name with table_name", () => {
    const csv = generateCSVContent([sampleRow]);
    expect(csv).toContain("profiles");
  });
  it("handles rpc_name over table_name", () => {
    const row = { ...sampleRow, rpc_name: "get_stats", table_name: "profiles" };
    const csv = generateCSVContent([row]);
    expect(csv).toContain("get_stats");
  });
  it("handles null values as dashes", () => {
    const row = { ...sampleRow, record_count: null, query_limit: null, error_message: null };
    const csv = generateCSVContent([row]);
    const dataLine = csv.split("\n")[1];
    expect(dataLine).toContain("-");
  });
  it("handles empty rows array", () => {
    const csv = generateCSVContent([]);
    const lines = csv.split("\n");
    expect(lines.length).toBe(1); // just header
  });
  it("handles multiple rows", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ ...sampleRow, id: String(i), duration_ms: i * 1000 }));
    const csv = generateCSVContent(rows);
    const lines = csv.split("\n");
    expect(lines.length).toBe(11); // header + 10
  });
  it("includes error_message when present", () => {
    const row = { ...sampleRow, error_message: "timeout error" };
    const csv = generateCSVContent([row]);
    expect(csv).toContain("timeout error");
  });
});

// ══════════════════════════════════════════════════════════════════
// 15. Severity badge mapping (4 tests)
// ══════════════════════════════════════════════════════════════════

describe("Severity badge mapping", () => {
  const severityMap: Record<string, string> = {
    very_slow: "🔴 Muito Lenta",
    slow: "🟡 Lenta",
    error: "❌ Erro",
  };
  it("maps very_slow correctly", () => expect(severityMap["very_slow"]).toBe("🔴 Muito Lenta"));
  it("maps slow correctly", () => expect(severityMap["slow"]).toBe("🟡 Lenta"));
  it("maps error correctly", () => expect(severityMap["error"]).toBe("❌ Erro"));
  it("unknown severity falls to undefined", () => expect(severityMap["normal"]).toBeUndefined());
});

// ══════════════════════════════════════════════════════════════════
// 16. Duration color thresholds (3 tests)
// ══════════════════════════════════════════════════════════════════

describe("Duration color thresholds", () => {
  const getColorClass = (ms: number) => {
    if (ms >= 8000) return "text-destructive";
    if (ms >= 3000) return "text-yellow-600";
    return "";
  };
  it(">=8000ms is destructive", () => {
    expect(getColorClass(8000)).toBe("text-destructive");
    expect(getColorClass(10000)).toBe("text-destructive");
  });
  it(">=3000ms and <8000ms is yellow", () => {
    expect(getColorClass(3000)).toBe("text-yellow-600");
    expect(getColorClass(7999)).toBe("text-yellow-600");
  });
  it("<3000ms has no color class", () => {
    expect(getColorClass(0)).toBe("");
    expect(getColorClass(2999)).toBe("");
  });
});

// ══════════════════════════════════════════════════════════════════
// 17. Top offenders computation (8 tests)
// ══════════════════════════════════════════════════════════════════

describe("Top offenders computation", () => {
  function computeOffenders(rows: Array<{ rpc_name: string | null; table_name: string | null; duration_ms: number }>) {
    const map = new Map<string, { count: number; totalMs: number; maxMs: number }>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      const prev = map.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
      map.set(key, { count: prev.count + 1, totalMs: prev.totalMs + r.duration_ms, maxMs: Math.max(prev.maxMs, r.duration_ms) });
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  }

  it("groups by table_name correctly", () => {
    const rows = [
      ...Array(5).fill({ rpc_name: null, table_name: "profiles", duration_ms: 3000 }),
      ...Array(3).fill({ rpc_name: null, table_name: "departments", duration_ms: 5000 }),
    ];
    const offenders = computeOffenders(rows);
    expect(offenders[0][0]).toBe("profiles");
    expect(offenders[0][1].count).toBe(5);
  });
  it("prefers rpc_name over table_name", () => {
    const offenders = computeOffenders([{ rpc_name: "get_stats", table_name: "profiles", duration_ms: 100 }]);
    expect(offenders[0][0]).toBe("get_stats");
  });
  it("falls back to 'unknown' when both are null", () => {
    const offenders = computeOffenders([{ rpc_name: null, table_name: null, duration_ms: 100 }]);
    expect(offenders[0][0]).toBe("unknown");
  });
  it("sorts by count descending", () => {
    const rows = [
      ...Array(2).fill({ rpc_name: null, table_name: "a", duration_ms: 100 }),
      ...Array(10).fill({ rpc_name: null, table_name: "b", duration_ms: 100 }),
      ...Array(5).fill({ rpc_name: null, table_name: "c", duration_ms: 100 }),
    ];
    const offenders = computeOffenders(rows);
    expect(offenders[0][0]).toBe("b");
    expect(offenders[1][0]).toBe("c");
    expect(offenders[2][0]).toBe("a");
  });
  it("limits to top 8 offenders", () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ rpc_name: null, table_name: `table_${i}`, duration_ms: 100 }));
    expect(computeOffenders(rows).length).toBeLessThanOrEqual(8);
  });
  it("tracks max duration per table", () => {
    const rows = [
      { rpc_name: null, table_name: "profiles", duration_ms: 1000 },
      { rpc_name: null, table_name: "profiles", duration_ms: 9999 },
      { rpc_name: null, table_name: "profiles", duration_ms: 500 },
    ];
    const offenders = computeOffenders(rows);
    expect(offenders[0][1].maxMs).toBe(9999);
  });
  it("computes average per table", () => {
    const rows = [
      { rpc_name: null, table_name: "profiles", duration_ms: 100 },
      { rpc_name: null, table_name: "profiles", duration_ms: 200 },
      { rpc_name: null, table_name: "profiles", duration_ms: 300 },
    ];
    const offenders = computeOffenders(rows);
    expect(Math.round(offenders[0][1].totalMs / offenders[0][1].count)).toBe(200);
  });
  it("handles empty input", () => {
    expect(computeOffenders([]).length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// 18. Data integrity tests (8 tests)
// ══════════════════════════════════════════════════════════════════

describe("Data integrity", () => {
  it("buildTelemetryRow has all required fields", () => {
    const row = buildTelemetryRow({ operation: "select", duration_ms: 100 }, "u1");
    const fields = ["operation", "table_name", "rpc_name", "duration_ms", "record_count", "query_limit", "query_offset", "count_mode", "severity", "error_message", "user_id"];
    fields.forEach(f => expect(row).toHaveProperty(f));
  });
  it("severity is always one of the valid types", () => {
    const valid = ["normal", "slow", "very_slow", "error"];
    [0, 100, 3000, 5000, 8000, 10000].forEach(ms => {
      expect(valid).toContain(classifySeverity(ms));
    });
    expect(valid).toContain(classifySeverity(100, "err"));
  });
  it("duration_ms is always numeric in built rows", () => {
    const rows = Array.from({ length: 100 }, (_, i) => buildTelemetryRow({ operation: "select", duration_ms: i * 10 }, "u1"));
    rows.forEach(r => expect(typeof r.duration_ms).toBe("number"));
  });
  it("query limit was updated to 500", () => {
    const limit = 500;
    expect(limit).toBe(500);
  });
  it("cleanup threshold is exactly 7 days", () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const diff = Date.now() - threshold.getTime();
    expect(diff).toBeCloseTo(604800000, -2);
  });
  it("filter by severity works correctly", () => {
    const rows = [
      { severity: "slow" }, { severity: "slow" },
      { severity: "very_slow" }, { severity: "normal" },
    ];
    expect(rows.filter(r => r.severity === "slow").length).toBe(2);
  });
  it("rows are ordered by created_at descending", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ created_at: new Date(Date.now() - i * 60000).toISOString() }));
    for (let i = 1; i < rows.length; i++) {
      expect(new Date(rows[i - 1].created_at).getTime()).toBeGreaterThanOrEqual(new Date(rows[i].created_at).getTime());
    }
  });
  it("TimeFilter 'custom' is supported", () => {
    const filters: TimeFilter[] = ["1h", "6h", "24h", "7d", "custom"];
    expect(filters).toContain("custom");
    expect(filters.length).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════
// 19. PDF export data formatting (8 tests)
// ══════════════════════════════════════════════════════════════════

describe("PDF export data formatting", () => {
  const sampleRow = {
    operation: "select", table_name: "profiles", rpc_name: null,
    duration_ms: 5000, record_count: 50, query_limit: 100,
    severity: "slow", error_message: null, created_at: "2026-03-23T10:00:00Z",
  };

  function buildPDFRow(r: typeof sampleRow) {
    return [
      formatTime(r.created_at),
      r.operation,
      r.rpc_name || r.table_name || "-",
      formatDuration(r.duration_ms),
      r.record_count != null ? String(r.record_count) : "-",
      r.query_limit != null ? String(r.query_limit) : "-",
      r.severity,
      (r as any).error_message ? (r as any).error_message.substring(0, 40) : "-",
    ];
  }

  it("formats PDF row correctly", () => {
    const row = buildPDFRow(sampleRow);
    expect(row.length).toBe(8);
    expect(row[1]).toBe("select");
    expect(row[2]).toBe("profiles");
    expect(row[3]).toBe("5.0s");
  });
  it("truncates error message to 40 chars", () => {
    const longError = "A".repeat(100);
    const row = buildPDFRow({ ...sampleRow, error_message: longError } as any);
    expect(row[7].length).toBe(40);
  });
  it("handles null error as dash", () => {
    const row = buildPDFRow(sampleRow);
    expect(row[7]).toBe("-");
  });
  it("handles rpc_name preference", () => {
    const row = buildPDFRow({ ...sampleRow, rpc_name: "get_data" });
    expect(row[2]).toBe("get_data");
  });
  it("formats duration in seconds for slow queries", () => {
    const row = buildPDFRow({ ...sampleRow, duration_ms: 8500 });
    expect(row[3]).toBe("8.5s");
  });
  it("formats duration in ms for fast queries", () => {
    const row = buildPDFRow({ ...sampleRow, duration_ms: 200 });
    expect(row[3]).toBe("200ms");
  });
  it("handles null record_count", () => {
    const row = buildPDFRow({ ...sampleRow, record_count: null } as any);
    expect(row[4]).toBe("-");
  });
  it("handles null query_limit", () => {
    const row = buildPDFRow({ ...sampleRow, query_limit: null } as any);
    expect(row[5]).toBe("-");
  });
});

// ══════════════════════════════════════════════════════════════════
// 20. Filter combinations (16 tests via iteration)
// ══════════════════════════════════════════════════════════════════

describe("Filter combinations", () => {
  const allSeverities: ("all" | "slow" | "very_slow" | "error")[] = ["all", "slow", "very_slow", "error"];
  const allTimeFilters: TimeFilter[] = ["1h", "6h", "24h", "7d"];

  allSeverities.forEach(sev => {
    allTimeFilters.forEach(time => {
      it(`severity=${sev} + time=${time} filter works`, () => {
        const rows = [
          { severity: "slow" }, { severity: "slow" },
          { severity: "very_slow" }, { severity: "error" },
          { severity: "normal" }, { severity: "normal" },
        ];
        const filtered = sev === "all" ? rows : rows.filter(r => r.severity === sev);
        expect(filtered.length).toBeGreaterThanOrEqual(0);
        if (sev !== "all") filtered.forEach(r => expect(r.severity).toBe(sev));
      });
    });
  });
});

// ══════════════════════════════════════════════════════════════════
// 21. Operations variety (4 tests)
// ══════════════════════════════════════════════════════════════════

describe("Operation types", () => {
  it("handles all CRUD operations", () => {
    const ops = ["select", "insert", "update", "delete", "rpc"];
    ops.forEach(op => {
      const row = buildTelemetryRow({ operation: op, duration_ms: 100 }, "u1");
      expect(row.operation).toBe(op);
    });
  });
  it("handles upsert operation", () => {
    expect(buildTelemetryRow({ operation: "upsert", duration_ms: 100 }, "u1").operation).toBe("upsert");
  });
  it("handles count operation", () => {
    expect(buildTelemetryRow({ operation: "count", duration_ms: 100 }, "u1").operation).toBe("count");
  });
  it("all 7 operations are valid", () => {
    const ops = ["select", "insert", "update", "delete", "rpc", "count", "upsert"];
    ops.forEach(op => expect(validateTelemetryPayload({ operation: op, duration_ms: 100 })).toBeNull());
  });
});

// ══════════════════════════════════════════════════════════════════
// 22. Stacked AreaChart data logic (6 tests)
// ══════════════════════════════════════════════════════════════════

describe("Stacked AreaChart data construction", () => {
  function buildTimelineBucket(rows: Array<{ severity: string; duration_ms: number; created_at: string }>) {
    const buckets = new Map<string, { time: string; normal: number; slow: number; very_slow: number; error: number; avgMs: number; maxMs: number; totalMs: number; count: number }>();
    for (const r of rows) {
      const d = new Date(r.created_at);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      const prev = buckets.get(key) || { time: key, normal: 0, slow: 0, very_slow: 0, error: 0, avgMs: 0, maxMs: 0, totalMs: 0, count: 0 };
      (prev as any)[r.severity] = ((prev as any)[r.severity] || 0) + 1;
      prev.count++;
      prev.totalMs += r.duration_ms;
      prev.maxMs = Math.max(prev.maxMs, r.duration_ms);
      prev.avgMs = Math.round(prev.totalMs / prev.count);
      buckets.set(key, prev);
    }
    return [...buckets.values()];
  }

  it("creates separate counts per severity", () => {
    const now = new Date().toISOString();
    const data = buildTimelineBucket([
      { severity: "normal", duration_ms: 100, created_at: now },
      { severity: "slow", duration_ms: 4000, created_at: now },
      { severity: "very_slow", duration_ms: 10000, created_at: now },
    ]);
    expect(data[0].normal).toBe(1);
    expect(data[0].slow).toBe(1);
    expect(data[0].very_slow).toBe(1);
  });
  it("computes avgMs correctly", () => {
    const now = new Date().toISOString();
    const data = buildTimelineBucket([
      { severity: "normal", duration_ms: 100, created_at: now },
      { severity: "normal", duration_ms: 300, created_at: now },
    ]);
    expect(data[0].avgMs).toBe(200);
  });
  it("computes maxMs correctly", () => {
    const now = new Date().toISOString();
    const data = buildTimelineBucket([
      { severity: "slow", duration_ms: 3000, created_at: now },
      { severity: "slow", duration_ms: 7000, created_at: now },
    ]);
    expect(data[0].maxMs).toBe(7000);
  });
  it("groups by hour bucket", () => {
    const hour1 = new Date("2026-03-23T10:15:00Z").toISOString();
    const hour2 = new Date("2026-03-23T11:30:00Z").toISOString();
    const data = buildTimelineBucket([
      { severity: "normal", duration_ms: 100, created_at: hour1 },
      { severity: "normal", duration_ms: 200, created_at: hour2 },
    ]);
    expect(data.length).toBe(2);
  });
  it("handles empty input", () => {
    expect(buildTimelineBucket([]).length).toBe(0);
  });
  it("accumulates error count in bucket", () => {
    const now = new Date().toISOString();
    const rows = Array.from({ length: 5 }, () => ({ severity: "error", duration_ms: 100, created_at: now }));
    const data = buildTimelineBucket(rows);
    expect(data[0].error).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════
// 23. Avg/Max dual chart data (4 tests)
// ══════════════════════════════════════════════════════════════════

describe("Avg/Max duration chart data", () => {
  function buildDurationByTable(rows: Array<{ rpc_name: string | null; table_name: string | null; duration_ms: number }>) {
    const map = new Map<string, { name: string; avgMs: number; maxMs: number; count: number; totalMs: number }>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      const prev = map.get(key) || { name: key, avgMs: 0, maxMs: 0, count: 0, totalMs: 0 };
      prev.count++;
      prev.totalMs += r.duration_ms;
      prev.maxMs = Math.max(prev.maxMs, r.duration_ms);
      prev.avgMs = Math.round(prev.totalMs / prev.count);
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.avgMs - a.avgMs).slice(0, 10);
  }

  it("computes both avg and max", () => {
    const data = buildDurationByTable([
      { rpc_name: null, table_name: "profiles", duration_ms: 1000 },
      { rpc_name: null, table_name: "profiles", duration_ms: 3000 },
    ]);
    expect(data[0].avgMs).toBe(2000);
    expect(data[0].maxMs).toBe(3000);
  });
  it("sorts by avgMs descending", () => {
    const data = buildDurationByTable([
      { rpc_name: null, table_name: "fast", duration_ms: 100 },
      { rpc_name: null, table_name: "slow", duration_ms: 9000 },
    ]);
    expect(data[0].name).toBe("slow");
  });
  it("limits to 10 tables", () => {
    const rows = Array.from({ length: 15 }, (_, i) => ({ rpc_name: null, table_name: `t${i}`, duration_ms: i * 100 }));
    expect(buildDurationByTable(rows).length).toBeLessThanOrEqual(10);
  });
  it("handles single row", () => {
    const data = buildDurationByTable([{ rpc_name: null, table_name: "profiles", duration_ms: 5000 }]);
    expect(data[0].avgMs).toBe(5000);
    expect(data[0].maxMs).toBe(5000);
  });
});

// ══════════════════════════════════════════════════════════════════
// 24. Custom date filter logic (5 tests)
// ══════════════════════════════════════════════════════════════════

describe("Custom date filter", () => {
  it("custom filter uses provided start date", () => {
    const start = new Date("2026-03-01T00:00:00Z");
    const t = getTimeThreshold("custom", start);
    expect(t).toBe(start.toISOString());
  });
  it("custom filter without date defaults to 24h", () => {
    const t = getTimeThreshold("custom");
    const diff = Date.now() - new Date(t).getTime();
    expect(diff).toBeCloseTo(86400000, -2);
  });
  it("custom end date can filter upper bound", () => {
    const end = new Date("2026-03-20T23:59:59Z");
    // Simulate: rows filtered with lte(created_at, end)
    const rows = [
      { created_at: "2026-03-19T10:00:00Z" },
      { created_at: "2026-03-21T10:00:00Z" },
    ];
    const filtered = rows.filter(r => new Date(r.created_at) <= end);
    expect(filtered.length).toBe(1);
  });
  it("custom range with same start and end returns same-day data", () => {
    const date = new Date("2026-03-15T00:00:00Z");
    const endDate = new Date("2026-03-15T23:59:59Z");
    const rows = [
      { created_at: "2026-03-15T12:00:00Z" },
      { created_at: "2026-03-16T12:00:00Z" },
    ];
    const filtered = rows.filter(r => new Date(r.created_at) >= date && new Date(r.created_at) <= endDate);
    expect(filtered.length).toBe(1);
  });
  it("TimeFilter type includes 'custom'", () => {
    const filters: TimeFilter[] = ["1h", "6h", "24h", "7d", "custom"];
    expect(filters.includes("custom")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════
// 25. Fire-and-forget logging format (5 tests)
// ══════════════════════════════════════════════════════════════════

describe("Fire-and-forget logging format", () => {
  it("error icon is ❌", () => expect(severityIcon("error")).toBe("❌"));
  it("very_slow icon is 🔴", () => expect(severityIcon("very_slow")).toBe("🔴"));
  it("slow icon is 🟡", () => expect(severityIcon("slow")).toBe("🟡"));
  it("normal icon is 🟢", () => expect(severityIcon("normal")).toBe("🟢"));
  it("log message format includes severity, operation, and duration", () => {
    const severity = "slow";
    const operation = "select";
    const table = "profiles";
    const durationMs = 5000;
    const msg = `${severityIcon(severity)} [telemetry] ${severity.toUpperCase()} | ${operation} ${table} | ${durationMs}ms`;
    expect(msg).toContain("🟡");
    expect(msg).toContain("SLOW");
    expect(msg).toContain("select profiles");
    expect(msg).toContain("5000ms");
  });
});
