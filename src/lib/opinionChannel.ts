/**
 * Canal de Opiniões — lógica pura.
 *
 * Este módulo NÃO acessa banco nem React. Ele concentra três responsabilidades
 * críticas que precisam ser testáveis de forma exaustiva:
 *
 *  1. Guarda de anonimato (defesa em profundidade): mesmo que uma linha chegue
 *     do servidor com `sender_id` preenchido, nada aqui deixa a identidade
 *     escapar quando `is_anonymous` é verdadeiro.
 *  2. Sanitização de texto livre (controle de caracteres, colapso de espaços,
 *     limite de tamanho) antes de qualquer renderização.
 *  3. Cálculo determinístico de SLA por urgência, para que a fila de tratativa
 *     do RH tenha prazo auditável.
 */

export type OpinionCategory = "suggestion" | "complaint" | "compliment" | "question" | "other";
export type OpinionUrgency = "low" | "normal" | "high" | "critical";
export type OpinionStatus = "new" | "read" | "in_progress" | "resolved" | "archived";

export const OPINION_CATEGORIES: readonly OpinionCategory[] = [
  "suggestion",
  "complaint",
  "compliment",
  "question",
  "other",
] as const;

export const OPINION_URGENCIES: readonly OpinionUrgency[] = ["low", "normal", "high", "critical"] as const;

export const OPINION_STATUSES: readonly OpinionStatus[] = [
  "new",
  "read",
  "in_progress",
  "resolved",
  "archived",
] as const;

export const CATEGORY_LABELS: Record<OpinionCategory, string> = {
  suggestion: "Sugestão",
  complaint: "Reclamação",
  compliment: "Elogio",
  question: "Dúvida",
  other: "Outro",
};

export const URGENCY_LABELS: Record<OpinionUrgency, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  critical: "Crítica",
};

export const STATUS_LABELS: Record<OpinionStatus, string> = {
  new: "Nova",
  read: "Lida",
  in_progress: "Em análise",
  resolved: "Respondida",
  archived: "Arquivada",
};

/** Status em que o relógio de SLA para de correr. */
export const CLOSED_STATUSES: readonly OpinionStatus[] = ["resolved", "archived"] as const;

/** Prazo de tratativa (em horas) por urgência declarada pelo colaborador. */
export const SLA_HOURS_BY_URGENCY: Record<OpinionUrgency, number> = {
  critical: 24,
  high: 72,
  normal: 168,
  low: 336,
};

export const OPINION_CONTENT_MAX = 4000;
export const OPINION_SUBJECT_MAX = 160;
export const OPINION_CONTENT_MIN = 10;

const ANONYMOUS_LABEL = "Colaborador anônimo";
const UNKNOWN_AUTHOR_LABEL = "Colaborador";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function safeDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

/**
 * Normaliza texto livre vindo do usuário.
 *
 * Remove caracteres de controle (inclusive marcas bidirecionais usadas em
 * ataques de spoofing visual), colapsa espaços em branco e trunca com reticências.
 * Nunca lança: entrada inválida vira string vazia.
 */
export function sanitizeOpinionText(raw: unknown, maxLength: number = OPINION_CONTENT_MAX): string {
  if (typeof raw !== "string") return "";
  const limit = Number.isFinite(maxLength) && maxLength > 0 ? Math.floor(maxLength) : OPINION_CONTENT_MAX;
  const stripped = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  if (stripped.length <= limit) return stripped;
  return `${stripped.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

export interface OpinionDraft {
  subject?: string | null;
  content?: string | null;
  category?: string | null;
  urgency?: string | null;
  isAnonymous?: boolean;
  recipientType?: string | null;
}

export interface NormalizedOpinionDraft {
  subject: string | null;
  content: string;
  category: OpinionCategory;
  urgency: OpinionUrgency;
  isAnonymous: boolean;
  recipientType: "hr" | "manager";
}

export interface OpinionDraftValidation {
  valid: boolean;
  errors: string[];
  value: NormalizedOpinionDraft;
}

/**
 * Valida e normaliza o rascunho antes do envio. Sempre devolve um `value`
 * utilizável (com defaults seguros) para que a UI possa mostrar o preview mesmo
 * com erros pendentes.
 */
export function validateOpinionDraft(draft: OpinionDraft | null | undefined): OpinionDraftValidation {
  const errors: string[] = [];
  const source = draft ?? {};

  const content = sanitizeOpinionText(source.content, OPINION_CONTENT_MAX);
  if (content.length < OPINION_CONTENT_MIN) {
    errors.push(`Escreva ao menos ${OPINION_CONTENT_MIN} caracteres.`);
  }

  const subjectRaw = sanitizeOpinionText(source.subject, OPINION_SUBJECT_MAX);
  const subject = subjectRaw.length > 0 ? subjectRaw : null;

  const category = OPINION_CATEGORIES.includes(source.category as OpinionCategory)
    ? (source.category as OpinionCategory)
    : "suggestion";
  if (isNonEmptyString(source.category) && category !== source.category) {
    errors.push("Categoria inválida.");
  }

  const urgency = OPINION_URGENCIES.includes(source.urgency as OpinionUrgency)
    ? (source.urgency as OpinionUrgency)
    : "normal";
  if (isNonEmptyString(source.urgency) && urgency !== source.urgency) {
    errors.push("Urgência inválida.");
  }

  const recipientType = source.recipientType === "manager" ? "manager" : "hr";

  return {
    valid: errors.length === 0,
    errors,
    value: {
      subject,
      content,
      category,
      urgency,
      isAnonymous: source.isAnonymous !== false,
      recipientType,
    },
  };
}

export type SlaState = "on_track" | "due_soon" | "overdue" | "closed";

export interface SlaInfo {
  state: SlaState;
  dueAt: string;
  hoursRemaining: number;
  label: string;
}

/**
 * Calcula o prazo de tratativa a partir da urgência e da data de criação.
 * Opiniões resolvidas/arquivadas nunca aparecem como atrasadas.
 */
export function computeOpinionSla(
  input: { createdAt: unknown; urgency: unknown; status: unknown },
  now: Date = new Date(),
): SlaInfo {
  const reference = safeDate(now, new Date(0));
  const createdAt = safeDate(input?.createdAt, reference);
  const urgency = OPINION_URGENCIES.includes(input?.urgency as OpinionUrgency)
    ? (input?.urgency as OpinionUrgency)
    : "normal";
  const status = OPINION_STATUSES.includes(input?.status as OpinionStatus)
    ? (input?.status as OpinionStatus)
    : "new";

  const dueAt = new Date(createdAt.getTime() + SLA_HOURS_BY_URGENCY[urgency] * 3_600_000);
  const hoursRemaining = Math.round(((dueAt.getTime() - reference.getTime()) / 3_600_000) * 10) / 10;

  if (CLOSED_STATUSES.includes(status)) {
    return { state: "closed", dueAt: dueAt.toISOString(), hoursRemaining, label: "Tratativa encerrada" };
  }
  if (hoursRemaining < 0) {
    const late = Math.abs(hoursRemaining);
    return {
      state: "overdue",
      dueAt: dueAt.toISOString(),
      hoursRemaining,
      label: late >= 48 ? `Atrasada há ${Math.floor(late / 24)} dias` : `Atrasada há ${Math.floor(late)}h`,
    };
  }
  if (hoursRemaining <= 24) {
    return {
      state: "due_soon",
      dueAt: dueAt.toISOString(),
      hoursRemaining,
      label: `Vence em ${Math.max(1, Math.ceil(hoursRemaining))}h`,
    };
  }
  return {
    state: "on_track",
    dueAt: dueAt.toISOString(),
    hoursRemaining,
    label: `Vence em ${Math.ceil(hoursRemaining / 24)} dias`,
  };
}

export interface RawOpinionRow {
  id?: unknown;
  sender_id?: unknown;
  sender_name?: unknown;
  is_anonymous?: unknown;
  subject?: unknown;
  content?: unknown;
  category?: unknown;
  urgency?: unknown;
  status?: unknown;
  recipient_type?: unknown;
  department_name?: unknown;
  support_count?: unknown;
  response_count?: unknown;
  viewer_supported?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface OpinionFeedEntry {
  id: string;
  /** `null` sempre que a opinião for anônima — não existe caminho que preencha. */
  authorId: string | null;
  authorName: string;
  isAnonymous: boolean;
  subject: string | null;
  content: string;
  category: OpinionCategory;
  categoryLabel: string;
  urgency: OpinionUrgency;
  urgencyLabel: string;
  status: OpinionStatus;
  statusLabel: string;
  departmentName: string | null;
  supportCount: number;
  responseCount: number;
  viewerSupported: boolean;
  createdAt: string;
  sla: SlaInfo;
}

function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Converte a linha crua da RPC em entrada de feed já segura para renderizar.
 * Retorna `null` quando a linha não tem identificador utilizável.
 */
export function toOpinionFeedEntry(
  row: RawOpinionRow | null | undefined,
  now: Date = new Date(),
): OpinionFeedEntry | null {
  if (!row || typeof row !== "object") return null;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  if (!id) return null;

  const isAnonymous = row.is_anonymous !== false;
  const category = OPINION_CATEGORIES.includes(row.category as OpinionCategory)
    ? (row.category as OpinionCategory)
    : "other";
  const urgency = OPINION_URGENCIES.includes(row.urgency as OpinionUrgency)
    ? (row.urgency as OpinionUrgency)
    : "normal";
  const status = OPINION_STATUSES.includes(row.status as OpinionStatus)
    ? (row.status as OpinionStatus)
    : "new";

  const namedAuthor = isNonEmptyString(row.sender_name) ? sanitizeOpinionText(row.sender_name, 80) : "";
  const subject = sanitizeOpinionText(row.subject, OPINION_SUBJECT_MAX);

  return {
    id,
    // Guarda de anonimato: identidade só trafega em opinião identificada.
    authorId: isAnonymous ? null : isNonEmptyString(row.sender_id) ? row.sender_id.trim() : null,
    authorName: isAnonymous ? ANONYMOUS_LABEL : namedAuthor || UNKNOWN_AUTHOR_LABEL,
    isAnonymous,
    subject: subject.length > 0 ? subject : null,
    content: sanitizeOpinionText(row.content, OPINION_CONTENT_MAX),
    category,
    categoryLabel: CATEGORY_LABELS[category],
    urgency,
    urgencyLabel: URGENCY_LABELS[urgency],
    status,
    statusLabel: STATUS_LABELS[status],
    departmentName: isNonEmptyString(row.department_name) ? sanitizeOpinionText(row.department_name, 80) : null,
    supportCount: toCount(row.support_count),
    responseCount: toCount(row.response_count),
    viewerSupported: row.viewer_supported === true,
    createdAt: safeDate(row.created_at, safeDate(now, new Date(0))).toISOString(),
    sla: computeOpinionSla({ createdAt: row.created_at, urgency, status }, now),
  };
}

export interface OpinionFeedSummary {
  total: number;
  open: number;
  overdue: number;
  byCategory: Record<OpinionCategory, number>;
  byStatus: Record<OpinionStatus, number>;
  /** Falso quando o volume é pequeno demais para exibir recortes sem risco de reidentificação. */
  aggregatesVisible: boolean;
  anonymityNotice: string | null;
}

export const OPINION_MIN_AGGREGATE = 5;

/**
 * Consolida o feed para os cartões de topo. Recortes por categoria só são
 * liberados acima do mínimo de registros (guarda de k-anonimato), no mesmo
 * espírito do diagnóstico de clima.
 */
export function summarizeOpinionFeed(
  entries: ReadonlyArray<OpinionFeedEntry | null | undefined>,
  minAggregate: number = OPINION_MIN_AGGREGATE,
): OpinionFeedSummary {
  const valid = (entries ?? []).filter((e): e is OpinionFeedEntry => !!e && typeof e.id === "string");
  const threshold = Number.isFinite(minAggregate) && minAggregate > 0 ? Math.floor(minAggregate) : OPINION_MIN_AGGREGATE;

  const byCategory = OPINION_CATEGORIES.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<OpinionCategory, number>,
  );
  const byStatus = OPINION_STATUSES.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<OpinionStatus, number>,
  );

  let open = 0;
  let overdue = 0;
  for (const entry of valid) {
    byCategory[entry.category] += 1;
    byStatus[entry.status] += 1;
    if (!CLOSED_STATUSES.includes(entry.status)) open += 1;
    if (entry.sla.state === "overdue") overdue += 1;
  }

  const aggregatesVisible = valid.length >= threshold;
  return {
    total: valid.length,
    open,
    overdue,
    byCategory,
    byStatus,
    aggregatesVisible,
    anonymityNotice: aggregatesVisible
      ? null
      : `Recortes por categoria aparecem a partir de ${threshold} manifestações, para proteger o anonimato.`,
  };
}

/** Ordena a fila de tratativa: atrasadas primeiro, depois urgência e apoio. */
export function sortOpinionQueue(entries: ReadonlyArray<OpinionFeedEntry>): OpinionFeedEntry[] {
  const slaRank: Record<SlaState, number> = { overdue: 0, due_soon: 1, on_track: 2, closed: 3 };
  const urgencyRank: Record<OpinionUrgency, number> = { critical: 0, high: 1, normal: 2, low: 3 };
  return [...(entries ?? [])].sort((a, b) => {
    const sla = slaRank[a.sla.state] - slaRank[b.sla.state];
    if (sla !== 0) return sla;
    const urgency = urgencyRank[a.urgency] - urgencyRank[b.urgency];
    if (urgency !== 0) return urgency;
    const support = b.supportCount - a.supportCount;
    if (support !== 0) return support;
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });
}

/** Texto do plano 5W2H gerado a partir de uma manifestação. */
export function buildOpinionActionPlanSeed(entry: OpinionFeedEntry | null | undefined): {
  title: string;
  what: string;
  why: string;
} | null {
  if (!entry) return null;
  const topic = entry.subject ?? sanitizeOpinionText(entry.content, 60);
  if (!topic) return null;
  return {
    title: `Tratativa: ${topic}`,
    what: `Endereçar a manifestação "${topic}" registrada no Canal de Opiniões (${entry.categoryLabel.toLowerCase()}).`,
    why: `${entry.supportCount} pessoa(s) apoiaram esta manifestação, com urgência ${entry.urgencyLabel.toLowerCase()}.`,
  };
}