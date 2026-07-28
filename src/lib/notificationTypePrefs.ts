/**
 * Motor puro de preferências de notificação por tipo × canal.
 *
 * Por que existe: a leitura/escrita de `notification_preferences.type_preferences`
 * é um JSONB livre, escrito por múltiplos componentes (campanhas, jogos, relatórios).
 * Qualquer merge ingênuo (`{...current, [key]: {canal: valor}}`) apaga silenciosamente
 * as preferências dos outros canais e dos outros módulos. Centralizamos aqui a
 * normalização e o merge para que a escrita seja sempre aditiva e idempotente.
 *
 * As RPCs `user_wants_push_notification` / `user_wants_in_app_notification` /
 * `user_wants_email_notification` leem exatamente este formato:
 *   { "<tipo>": { "in_app": bool, "push": bool, "email": bool, "priority": string } }
 * Valores ausentes são tratados como `true` no banco (COALESCE), então só gravamos
 * booleanos explícitos — nunca `null`/`undefined`.
 */

export type NotificationChannel = "in_app" | "push" | "email";

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  "in_app",
  "push",
  "email",
] as const;

export interface TypePrefEntry {
  in_app?: boolean;
  push?: boolean;
  email?: boolean;
  priority?: string;
}

export type TypePrefs = Record<string, TypePrefEntry>;

export type ChannelMap = Record<NotificationChannel, boolean>;

/** Aceita o JSONB cru do banco (que pode vir `null`, string, array ou lixo). */
export function normalizeTypePrefs(raw: unknown): TypePrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: TypePrefs = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const entry = value as Record<string, unknown>;
    const normalized: TypePrefEntry = {};
    for (const channel of NOTIFICATION_CHANNELS) {
      if (typeof entry[channel] === "boolean") normalized[channel] = entry[channel] as boolean;
    }
    if (typeof entry.priority === "string" && entry.priority.trim() !== "") {
      normalized.priority = entry.priority;
    }
    out[key] = normalized;
  }
  return out;
}

/**
 * Resolve o estado efetivo de um tipo aplicando os defaults do módulo por cima
 * do que está salvo. Nunca retorna `undefined`: a UI precisa de um booleano.
 */
export function resolveChannels(
  prefs: TypePrefs,
  type: string,
  defaults: ChannelMap,
): ChannelMap {
  const entry = prefs[type];
  const resolved = { ...defaults };
  if (!entry) return resolved;
  for (const channel of NOTIFICATION_CHANNELS) {
    if (typeof entry[channel] === "boolean") resolved[channel] = entry[channel] as boolean;
  }
  return resolved;
}

/**
 * Merge aditivo de uma única célula (tipo × canal).
 * Preserva: outros tipos, outros canais do mesmo tipo e a `priority` existente.
 */
export function mergeChannelPreference(
  current: unknown,
  type: string,
  channel: NotificationChannel,
  value: boolean,
  defaults: ChannelMap,
  priority?: string,
): TypePrefs {
  const normalized = normalizeTypePrefs(current);
  const prior = normalized[type] ?? {};
  const merged: TypePrefEntry = {
    in_app: prior.in_app ?? defaults.in_app,
    push: prior.push ?? defaults.push,
    email: prior.email ?? defaults.email,
    [channel]: value,
  };
  const resolvedPriority = prior.priority ?? priority;
  if (resolvedPriority) merged.priority = resolvedPriority;
  return { ...normalized, [type]: merged };
}

/** Aplica vários tipos de uma vez (ex.: botão "desligar tudo" de um módulo). */
export function mergeManyChannelPreferences(
  current: unknown,
  types: readonly string[],
  channel: NotificationChannel,
  value: boolean,
  defaultsFor: (type: string) => ChannelMap,
): TypePrefs {
  return types.reduce<TypePrefs>(
    (acc, type) => mergeChannelPreference(acc, type, channel, value, defaultsFor(type)),
    normalizeTypePrefs(current),
  );
}