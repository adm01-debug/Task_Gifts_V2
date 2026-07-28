import { supabase } from "@/integrations/supabase/client";

/** Metadados de uma chave de API externa. O segredo NUNCA trafega aqui. */
export interface ExternalApiKeySummary {
  id: string;
  name: string;
  description: string | null;
  /** Identificador público mascarado (ex.: "tg_ab1…9f3c"). */
  api_key: string;
  system_type: string;
  permissions: string[];
  is_active: boolean;
  rate_limit_per_minute: number;
  last_used_at: string | null;
  secret_last_rotated_at: string | null;
  days_since_rotation: number;
  created_at: string;
}

/** Credencial em texto puro — exibida uma única vez após criação/rotação. */
export interface IssuedApiCredential {
  id: string;
  api_key: string;
  api_secret: string;
}

export interface CreateApiKeyInput {
  name: string;
  description?: string | null;
  systemType?: string;
  permissions?: string[];
  rateLimitPerMinute?: number;
}

/** Dias sem rotação a partir dos quais a chave é considerada vencida. */
export const ROTATION_MAX_AGE_DAYS = 90;

interface RawApiKeyRow extends Omit<ExternalApiKeySummary, "permissions"> {
  permissions: unknown;
}

function normalizePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === "string");
  return [];
}

export async function listApiKeys(): Promise<ExternalApiKeySummary[]> {
  const { data, error } = await supabase.rpc("list_external_api_keys");
  if (error) throw error;
  return ((data as RawApiKeyRow[] | null) || []).map((row) => ({
    ...row,
    permissions: normalizePermissions(row.permissions),
    days_since_rotation: Number(row.days_since_rotation ?? 0),
    rate_limit_per_minute: Number(row.rate_limit_per_minute ?? 0),
  }));
}

export async function createApiKey(input: CreateApiKeyInput): Promise<IssuedApiCredential> {
  const { data, error } = await supabase.rpc("create_external_api_key", {
    p_name: input.name,
    p_description: input.description ?? undefined,
    p_system_type: input.systemType ?? "generic",
    p_permissions: (input.permissions?.length ? input.permissions : ["read"]) as unknown as never,
    p_rate_limit_per_minute: input.rateLimitPerMinute ?? 60,
  });
  if (error) throw error;
  const row = (data as IssuedApiCredential[] | null)?.[0];
  if (!row) throw new Error("Não foi possível emitir a chave de API.");
  return row;
}

export async function rotateApiSecret(id: string): Promise<IssuedApiCredential> {
  const { data, error } = await supabase.rpc("rotate_external_api_secret", { p_id: id });
  if (error) throw error;
  const row = (data as IssuedApiCredential[] | null)?.[0];
  if (!row) throw new Error("Não foi possível rotacionar o segredo.");
  return row;
}

export async function setApiKeyActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.rpc("set_external_api_key_active", { p_id: id, p_active: active });
  if (error) throw error;
}

export async function deleteApiKey(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_external_api_key", { p_id: id });
  if (error) throw error;
}

/** Chaves que passaram do prazo de rotação recomendado. */
export function keysNeedingRotation(keys: ExternalApiKeySummary[]): ExternalApiKeySummary[] {
  return keys.filter((k) => k.is_active && k.days_since_rotation >= ROTATION_MAX_AGE_DAYS);
}
