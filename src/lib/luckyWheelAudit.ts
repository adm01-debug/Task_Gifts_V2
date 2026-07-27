/**
 * Motor puro de auditoria de calibração da Roleta da Sorte.
 *
 * Responsabilidades:
 *  - normalizar registros da trilha imutável (`lucky_wheel_prize_audit`);
 *  - derivar o diff campo a campo entre o estado anterior e o novo;
 *  - medir o impacto econômico de cada alteração (moedas/XP esperados por giro).
 *
 * Este módulo é 100% determinístico e não toca o banco: o registro da trilha é
 * feito por trigger no servidor, de onde o cliente apenas LÊ. Assim o histórico
 * não depende de o frontend "lembrar" de gravar — nem pode ser forjado por ele.
 */
import { projectWheel, type OddsPrize } from "./luckyWheelOdds";

export type AuditOperation = "INSERT" | "UPDATE" | "DELETE";

/** Campos versionados da calibração. Alterações fora desta lista são ignoradas. */
export const AUDITED_FIELDS = [
  "label",
  "prize_type",
  "amount",
  "weight",
  "color",
  "icon",
  "rarity",
  "is_active",
] as const;

export type AuditedField = (typeof AUDITED_FIELDS)[number];

export const FIELD_LABELS: Record<AuditedField, string> = {
  label: "Rótulo",
  prize_type: "Tipo",
  amount: "Valor",
  weight: "Peso",
  color: "Cor",
  icon: "Ícone",
  rarity: "Raridade",
  is_active: "Ativo",
};

export type PrizeSnapshot = Partial<Record<AuditedField, unknown>> & {
  id?: string | null;
  achievement_id?: string | null;
};

export interface AuditRecord {
  id: string;
  prize_id: string | null;
  operation: AuditOperation;
  changed_by: string | null;
  changed_by_name?: string | null;
  changed_at: string;
  before_data: PrizeSnapshot | null;
  after_data: PrizeSnapshot | null;
}

export interface FieldChange {
  field: AuditedField;
  label: string;
  before: unknown;
  after: unknown;
}

export interface AuditEntry {
  id: string;
  prizeId: string | null;
  operation: AuditOperation;
  changedBy: string | null;
  changedByName: string;
  changedAt: string;
  /** Timestamp em ms; `NaN` vira 0 para manter a ordenação estável. */
  changedAtMs: number;
  prizeLabel: string;
  changes: FieldChange[];
  /** true quando a operação não alterou nenhum campo auditado (ex.: só `updated_at`). */
  noop: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Igualdade tolerante: `1` vs `"1"` e `true` vs `"true"` não contam como mudança. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  if (typeof a === "boolean" || typeof b === "boolean") {
    return String(a) === String(b);
  }
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na === nb;
  }
  return String(a) === String(b);
}

export function diffSnapshots(
  before: PrizeSnapshot | null | undefined,
  after: PrizeSnapshot | null | undefined,
): FieldChange[] {
  const from = isPlainObject(before) ? before : null;
  const to = isPlainObject(after) ? after : null;
  if (!from && !to) return [];

  const changes: FieldChange[] = [];
  for (const field of AUDITED_FIELDS) {
    const prev = from ? (from as Record<string, unknown>)[field] : undefined;
    const next = to ? (to as Record<string, unknown>)[field] : undefined;
    // Campo ausente dos dois lados nunca é reportado como alteração.
    if (prev === undefined && next === undefined) continue;
    if (sameValue(prev, next)) continue;
    changes.push({
      field,
      label: FIELD_LABELS[field],
      before: prev ?? null,
      after: next ?? null,
    });
  }
  return changes;
}

function readLabel(...snapshots: Array<PrizeSnapshot | null | undefined>): string {
  for (const snap of snapshots) {
    if (!isPlainObject(snap)) continue;
    const raw = (snap as Record<string, unknown>).label;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  return "Prêmio removido";
}

function toMs(value: string): number {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Normaliza a trilha crua em entradas prontas para exibição, ordenadas do mais
 * recente para o mais antigo (desempate determinístico pelo id).
 */
export function buildAuditTimeline(records: readonly AuditRecord[]): AuditEntry[] {
  const entries = records.map<AuditEntry>((record) => {
    const changes =
      record.operation === "INSERT"
        ? diffSnapshots(null, record.after_data)
        : record.operation === "DELETE"
          ? diffSnapshots(record.before_data, null)
          : diffSnapshots(record.before_data, record.after_data);

    const name = record.changed_by_name?.trim();
    return {
      id: record.id,
      prizeId: record.prize_id ?? null,
      operation: record.operation,
      changedBy: record.changed_by ?? null,
      changedByName: name || (record.changed_by ? "Administrador" : "Sistema"),
      changedAt: record.changed_at,
      changedAtMs: toMs(record.changed_at),
      prizeLabel: readLabel(record.after_data, record.before_data),
      changes,
      noop: changes.length === 0 && record.operation === "UPDATE",
    };
  });

  return entries.sort((a, b) => (b.changedAtMs - a.changedAtMs) || a.id.localeCompare(b.id));
}

export interface EconomicImpact {
  coinsBefore: number;
  coinsAfter: number;
  coinsDelta: number;
  xpBefore: number;
  xpAfter: number;
  xpDelta: number;
  /** Variação relativa do custo em moedas (0 quando o custo anterior era zero). */
  coinsDeltaRatio: number;
  emptyBefore: number;
  emptyAfter: number;
}

/**
 * Impacto econômico de uma calibração: compara o valor esperado por giro
 * antes e depois. Serve de guarda contra inflação silenciosa da economia.
 */
export function measureEconomicImpact(
  before: readonly OddsPrize[],
  after: readonly OddsPrize[],
): EconomicImpact {
  const a = projectWheel(before);
  const b = projectWheel(after);
  const coinsDelta = b.expectedCoinsPerSpin - a.expectedCoinsPerSpin;
  return {
    coinsBefore: a.expectedCoinsPerSpin,
    coinsAfter: b.expectedCoinsPerSpin,
    coinsDelta,
    xpBefore: a.expectedXpPerSpin,
    xpAfter: b.expectedXpPerSpin,
    xpDelta: b.expectedXpPerSpin - a.expectedXpPerSpin,
    coinsDeltaRatio: a.expectedCoinsPerSpin > 0 ? coinsDelta / a.expectedCoinsPerSpin : 0,
    emptyBefore: a.emptyProbability,
    emptyAfter: b.emptyProbability,
  };
}

export interface AuditSummary {
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
  noops: number;
  /** Administradores distintos que alteraram a calibração. */
  editors: number;
  fieldCounts: Record<AuditedField, number>;
  lastChangeAt: string | null;
}

export function summarizeAudit(entries: readonly AuditEntry[]): AuditSummary {
  const fieldCounts = Object.fromEntries(
    AUDITED_FIELDS.map((f) => [f, 0]),
  ) as Record<AuditedField, number>;

  const editors = new Set<string>();
  let inserts = 0;
  let updates = 0;
  let deletes = 0;
  let noops = 0;
  let lastMs = -Infinity;
  let lastChangeAt: string | null = null;

  for (const entry of entries) {
    if (entry.operation === "INSERT") inserts += 1;
    else if (entry.operation === "UPDATE") updates += 1;
    else deletes += 1;
    if (entry.noop) noops += 1;
    if (entry.changedBy) editors.add(entry.changedBy);
    for (const change of entry.changes) fieldCounts[change.field] += 1;
    if (entry.changedAtMs > lastMs) {
      lastMs = entry.changedAtMs;
      lastChangeAt = entry.changedAt;
    }
  }

  return {
    total: entries.length,
    inserts,
    updates,
    deletes,
    noops,
    editors: editors.size,
    fieldCounts,
    lastChangeAt,
  };
}

/** Formata um valor de campo para leitura humana na linha do tempo. */
export function formatFieldValue(field: AuditedField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "is_active") return String(value) === "true" ? "Sim" : "Não";
  return String(value);
}