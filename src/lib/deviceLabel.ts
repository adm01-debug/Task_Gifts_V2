/**
 * Utilitários puros para o apelido do dispositivo de notificações e para a
 * leitura do histórico curto de sincronizações.
 *
 * O apelido é digitado pelo usuário e persistido no servidor
 * (`push_subscriptions.device_label`), então precisa ser saneado antes de
 * gravar: entrada de texto livre chega com espaços duplicados, quebras de
 * linha, caracteres de controle e comprimentos arbitrários.
 */

/** Limite gravado no banco — mantém o rótulo legível em badges e listas. */
export const DEVICE_LABEL_MAX_LENGTH = 40;

/**
 * Sanea um apelido digitado: remove controles, colapsa espaços e trunca.
 * Devolve `null` quando não sobra conteúdo útil (equivale a "sem apelido").
 */
export function normalizeDeviceLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.length > DEVICE_LABEL_MAX_LENGTH
    ? cleaned.slice(0, DEVICE_LABEL_MAX_LENGTH).trimEnd()
    : cleaned;
}

/** Um apelido só é válido se sobrevive à normalização. */
export function isValidDeviceLabel(value: unknown): boolean {
  return normalizeDeviceLabel(value) !== null;
}

interface UaMatch {
  test: RegExp;
  label: string;
}

// Ordem importa: Edge/Opera anunciam Chrome; iPad moderno anuncia Macintosh.
const OS_MATCHERS: UaMatch[] = [
  { test: /iPhone/i, label: "iPhone" },
  { test: /iPad/i, label: "iPad" },
  { test: /Android/i, label: "Android" },
  { test: /Windows/i, label: "Windows" },
  { test: /Macintosh|Mac OS X/i, label: "Mac" },
  { test: /CrOS/i, label: "ChromeOS" },
  { test: /Linux/i, label: "Linux" },
];

const BROWSER_MATCHERS: UaMatch[] = [
  { test: /Edg\//i, label: "Edge" },
  { test: /OPR\/|Opera/i, label: "Opera" },
  { test: /SamsungBrowser/i, label: "Samsung Internet" },
  { test: /Firefox\//i, label: "Firefox" },
  { test: /Chrome\//i, label: "Chrome" },
  { test: /Safari\//i, label: "Safari" },
];

function firstMatch(matchers: UaMatch[], ua: string): string | null {
  for (const m of matchers) if (m.test.test(ua)) return m.label;
  return null;
}

/**
 * Sugestão de apelido a partir do user agent — usada apenas como valor inicial
 * do campo, nunca gravada automaticamente sem confirmação do usuário.
 */
export function suggestDeviceLabel(userAgent: unknown): string {
  const ua = typeof userAgent === "string" ? userAgent : "";
  const os = firstMatch(OS_MATCHERS, ua);
  const browser = firstMatch(BROWSER_MATCHERS, ua);
  if (os && browser) return `${os} · ${browser}`;
  return os ?? browser ?? "Este dispositivo";
}

/** Rótulo de exibição: apelido salvo, senão a sugestão do user agent. */
export function displayDeviceLabel(label: unknown, userAgent: unknown): string {
  return normalizeDeviceLabel(label) ?? suggestDeviceLabel(userAgent);
}

export type PushSyncEventType =
  | "subscribed"
  | "refreshed"
  | "renamed"
  | "disabled"
  | "revoked"
  | "failed";

export interface PushSyncEvent {
  id: string;
  event: PushSyncEventType | string;
  device_label: string | null;
  detail: string | null;
  created_at: string;
}

export interface PushSyncEntry {
  id: string;
  event: PushSyncEventType;
  label: string;
  description: string;
  detail: string | null;
  createdAt: string;
  /** "há 5 min", "ontem"… calculado em relação a `now`. */
  relative: string;
  tone: "success" | "muted" | "destructive";
}

const EVENT_LABEL: Record<PushSyncEventType, string> = {
  subscribed: "Notificações ativadas",
  refreshed: "Inscrição renovada",
  renamed: "Apelido atualizado",
  disabled: "Notificações desativadas",
  revoked: "Acesso revogado",
  failed: "Falha na sincronização",
};

const EVENT_TONE: Record<PushSyncEventType, PushSyncEntry["tone"]> = {
  subscribed: "success",
  refreshed: "success",
  renamed: "muted",
  disabled: "muted",
  revoked: "destructive",
  failed: "destructive",
};

function isKnownEvent(value: unknown): value is PushSyncEventType {
  return (
    value === "subscribed" ||
    value === "refreshed" ||
    value === "renamed" ||
    value === "disabled" ||
    value === "revoked" ||
    value === "failed"
  );
}

/** Distância humana até `now`. Datas futuras são tratadas como "agora". */
export function relativeTime(iso: unknown, now: Date = new Date()): string {
  if (typeof iso !== "string" || !iso.trim()) return "—";
  const then = new Date(iso);
  const ts = then.getTime();
  if (!Number.isFinite(ts)) return "—";
  const diffSeconds = Math.floor((now.getTime() - ts) / 1000);
  if (diffSeconds < 60) return "agora";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}

/**
 * Converte as linhas cruas em entradas prontas para render.
 * Linhas inválidas (sem id ou com evento desconhecido) são descartadas em
 * silêncio — o painel nunca deve renderizar um item sem significado.
 */
export function buildSyncHistory(
  rows: readonly PushSyncEvent[] | null | undefined,
  options: { limit?: number; now?: Date } = {},
): PushSyncEntry[] {
  const limit = Number.isFinite(options.limit) ? Math.max(0, Math.floor(options.limit as number)) : 5;
  const now = options.now ?? new Date();
  const out: PushSyncEntry[] = [];

  for (const row of rows ?? []) {
    if (!row || typeof row.id !== "string" || !row.id.trim()) continue;
    if (!isKnownEvent(row.event)) continue;
    const createdAt = typeof row.created_at === "string" ? row.created_at : "";
    if (!createdAt || !Number.isFinite(new Date(createdAt).getTime())) continue;

    const label = normalizeDeviceLabel(row.device_label);
    out.push({
      id: row.id,
      event: row.event,
      label: EVENT_LABEL[row.event],
      description: label ? `${EVENT_LABEL[row.event]} · ${label}` : EVENT_LABEL[row.event],
      detail: normalizeDeviceLabel(row.detail),
      createdAt,
      relative: relativeTime(createdAt, now),
      tone: EVENT_TONE[row.event],
    });
  }

  out.sort((a, b) => {
    const byDate = b.createdAt.localeCompare(a.createdAt);
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  });

  return limit > 0 ? out.slice(0, limit) : out;
}
