/**
 * Camada pura da gestão de dispositivos de notificação.
 *
 * Responsabilidades:
 *  - normalizar as linhas cruas de `push_subscriptions` em entradas de UI;
 *  - decidir status (ativo / inativo / revogado) sem depender de relógio global;
 *  - casar um alerta de novo dispositivo com o apelido já salvo pelo usuário.
 *
 * Tudo aqui é determinístico e livre de I/O para poder ser simulado em massa.
 */

import {
  normalizeDeviceLabel,
  relativeTime,
  suggestDeviceLabel,
} from "./deviceLabel";

/** Dias sem uso a partir dos quais a inscrição é considerada ociosa. */
export const STALE_DEVICE_DAYS = 30;

export interface PushDeviceRow {
  id: string;
  endpoint: string;
  device_label: string | null;
  user_agent: string | null;
  last_used_at: string | null;
  created_at: string | null;
  disabled_at: string | null;
  disabled_reason: string | null;
  failure_count: number | null;
}

export type PushDeviceStatus = "current" | "active" | "idle" | "revoked";

export interface PushDeviceEntry {
  id: string;
  endpoint: string;
  /** Apelido salvo, senão a sugestão derivada do user agent. */
  label: string;
  /** `true` quando o apelido veio do usuário (e não da heurística de UA). */
  hasCustomLabel: boolean;
  platform: string;
  status: PushDeviceStatus;
  statusLabel: string;
  isCurrent: boolean;
  /** Revogável = ainda ativo. Um dispositivo já revogado não é revogável. */
  canRevoke: boolean;
  lastUsedAt: string | null;
  lastUsedRelative: string;
  createdAt: string | null;
  failureCount: number;
  disabledReason: string | null;
}

const STATUS_LABEL: Record<PushDeviceStatus, string> = {
  current: "Este dispositivo",
  active: "Ativo",
  idle: `Sem uso há mais de ${STALE_DEVICE_DAYS} dias`,
  revoked: "Revogado",
};

function parseTime(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function toIso(value: unknown): string | null {
  return parseTime(value) === null ? null : (value as string);
}

/**
 * Endpoints são URLs longas e sensíveis: nunca exibimos por inteiro.
 * A comparação de "dispositivo atual" é feita por igualdade exata do endpoint.
 */
export function sameEndpoint(a: unknown, b: unknown): boolean {
  return typeof a === "string" && typeof b === "string" && a.length > 0 && a === b;
}

/**
 * Converte linhas cruas em entradas prontas para render.
 *
 * Ordenação: dispositivo atual primeiro, depois ativos por último uso
 * decrescente, e por fim os revogados. Empates caem no id para estabilidade.
 */
export function buildDeviceList(
  rows: readonly PushDeviceRow[] | null | undefined,
  options: { currentEndpoint?: string | null; now?: Date } = {},
): PushDeviceEntry[] {
  const now = options.now ?? new Date();
  const nowTs = now.getTime();
  const staleBefore = nowTs - STALE_DEVICE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  const out: PushDeviceEntry[] = [];

  for (const row of rows ?? []) {
    if (!row || typeof row.id !== "string" || !row.id.trim()) continue;
    if (typeof row.endpoint !== "string" || !row.endpoint.trim()) continue;
    // Defesa contra duplicatas vindas de uma leitura concorrente.
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    const isCurrent = sameEndpoint(row.endpoint, options.currentEndpoint);
    const revoked = parseTime(row.disabled_at) !== null;
    const lastUsedTs = parseTime(row.last_used_at) ?? parseTime(row.created_at);

    let status: PushDeviceStatus;
    if (revoked) status = "revoked";
    else if (isCurrent) status = "current";
    else if (lastUsedTs !== null && lastUsedTs < staleBefore) status = "idle";
    else status = "active";

    const custom = normalizeDeviceLabel(row.device_label);
    const platform = suggestDeviceLabel(row.user_agent);
    // `suggestDeviceLabel` devolve "Este dispositivo" quando não reconhece o
    // user agent — texto correto no card do próprio navegador, mas enganoso
    // numa lista que também mostra aparelhos remotos.
    const fallbackLabel = platform === "Este dispositivo" && !isCurrent ? "Dispositivo desconhecido" : platform;
    const failures = Number.isFinite(row.failure_count) ? Math.max(0, Math.trunc(row.failure_count as number)) : 0;

    out.push({
      id: row.id,
      endpoint: row.endpoint,
      label: custom ?? fallbackLabel,
      hasCustomLabel: custom !== null,
      platform,
      status,
      statusLabel: STATUS_LABEL[status],
      isCurrent,
      canRevoke: !revoked,
      lastUsedAt: toIso(row.last_used_at),
      lastUsedRelative: relativeTime(row.last_used_at ?? row.created_at, now),
      createdAt: toIso(row.created_at),
      failureCount: failures,
      disabledReason: normalizeDeviceLabel(row.disabled_reason),
    });
  }

  const rank: Record<PushDeviceStatus, number> = { current: 0, active: 1, idle: 2, revoked: 3 };
  out.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    const at = parseTime(a.lastUsedAt) ?? parseTime(a.createdAt) ?? 0;
    const bt = parseTime(b.lastUsedAt) ?? parseTime(b.createdAt) ?? 0;
    if (at !== bt) return bt - at;
    return a.id.localeCompare(b.id);
  });

  return out;
}

/** Resumo textual para cabeçalho da lista. */
export function summarizeDevices(entries: readonly PushDeviceEntry[]): {
  total: number;
  active: number;
  revoked: number;
  text: string;
} {
  const total = entries.length;
  const revoked = entries.filter((e) => e.status === "revoked").length;
  const active = total - revoked;
  const text =
    total === 0
      ? "Nenhum dispositivo inscrito."
      : `${active} ${active === 1 ? "dispositivo ativo" : "dispositivos ativos"}` +
        (revoked > 0 ? ` · ${revoked} ${revoked === 1 ? "revogado" : "revogados"}` : "");
  return { total, active, revoked, text };
}

/**
 * Guarda de revogação. Impede pedidos sem sentido antes de tocar a rede e
 * exige confirmação explícita para revogar o próprio dispositivo em uso.
 */
export function canRevokeDevice(
  entry: PushDeviceEntry | null | undefined,
  options: { confirmedCurrent?: boolean } = {},
): { allowed: boolean; reason?: "not_found" | "already_revoked" | "needs_confirmation" } {
  if (!entry) return { allowed: false, reason: "not_found" };
  if (entry.status === "revoked") return { allowed: false, reason: "already_revoked" };
  if (entry.isCurrent && !options.confirmedCurrent) return { allowed: false, reason: "needs_confirmation" };
  return { allowed: true };
}

/* -------------------------------------------------------------------------- */
/* Alertas de novo dispositivo                                                */
/* -------------------------------------------------------------------------- */

export interface NewDeviceAlertInput {
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  ip_address?: string | null;
}

/**
 * Nome amigável do dispositivo de um alerta de segurança.
 *
 * Prioridade:
 *  1. apelido salvo pelo usuário para uma inscrição com o mesmo user agent;
 *  2. `browser` + `os` reportados pelo detector de dispositivo;
 *  3. heurística sobre o user agent bruto.
 *
 * Assim o alerta diz "iPhone do João" em vez de "Chrome em Windows" sempre
 * que o usuário já tiver batizado aquele aparelho.
 */
export function describeAlertDevice(
  alert: NewDeviceAlertInput | null | undefined,
  devices: readonly PushDeviceEntry[] | null | undefined,
): string {
  const ua = typeof alert?.user_agent === "string" ? alert.user_agent.trim() : "";

  if (ua) {
    // Só aceita apelidos definidos pelo usuário; rótulos heurísticos não
    // acrescentam informação e poderiam mascarar o navegador real.
    const match = (devices ?? []).find(
      (d) => d.hasCustomLabel && typeof d.endpoint === "string" && d.platform && uaMatches(d, ua),
    );
    if (match) return match.label;
  }

  const browser = normalizeDeviceLabel(alert?.browser);
  const os = normalizeDeviceLabel(alert?.os);
  const unknown = (v: string | null) => !v || /desconhecid/i.test(v);
  if (!unknown(browser) && !unknown(os)) return `${browser} em ${os}`;
  if (!unknown(browser)) return browser as string;
  if (!unknown(os)) return os as string;

  return ua ? suggestDeviceLabel(ua) : "Dispositivo desconhecido";
}

/** Um dispositivo casa com o alerta quando a plataforma derivada é a mesma. */
function uaMatches(device: PushDeviceEntry, userAgent: string): boolean {
  const alertPlatform = suggestDeviceLabel(userAgent);
  if (alertPlatform === "Este dispositivo") return false;
  return device.platform === alertPlatform;
}

/** Corpo da notificação de novo dispositivo, já com apelido quando existir. */
export function buildNewDeviceMessage(
  alert: NewDeviceAlertInput | null | undefined,
  devices: readonly PushDeviceEntry[] | null | undefined,
): string {
  const name = describeAlertDevice(alert, devices);
  const ip = typeof alert?.ip_address === "string" ? alert.ip_address.trim() : "";
  return ip ? `Novo acesso: ${name} (IP: ${ip})` : `Novo acesso: ${name}`;
}
