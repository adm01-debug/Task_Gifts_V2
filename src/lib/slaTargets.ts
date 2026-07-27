/**
 * Motor puro de metas de SLA (MTTA/MTTR) por tipo de alerta.
 *
 * Responsabilidades:
 *  - Normalizar/validar entradas vindas de formulário (strings hostis, NaN, negativos).
 *  - Garantir invariantes de negócio (MTTA <= MTTR, limites máximos sãos).
 *  - Converter entre minutos (UI) e segundos (banco), sem perda de precisão inesperada.
 *
 * Não faz I/O: toda persistência fica nos helpers `fetchSlaTargets`/`saveSlaTarget`.
 */
import { supabase } from "@/integrations/supabase/client";

/** Limite superior defensivo: 30 dias em minutos. */
export const MAX_SLA_MINUTES = 43_200;
/** Limite inferior: 1 minuto (o CHECK do banco exige > 0 segundos). */
export const MIN_SLA_MINUTES = 1;

export interface SlaTargetRow {
  alert_type: string;
  mtta_target_seconds: number;
  mttr_target_seconds: number;
  notes: string | null;
}

export interface SlaTargetDraft {
  alertType: string;
  mttaMinutes: number;
  mttrMinutes: number;
  notes?: string | null;
}

export interface SlaValidationResult {
  valid: boolean;
  /** Draft normalizado (sempre presente, mesmo quando inválido, para feedback na UI). */
  normalized: SlaTargetDraft;
  errors: string[];
  warnings: string[];
}

/** Converte entrada arbitrária em minutos inteiros dentro dos limites, ou `null` se impossível. */
export function parseMinutes(input: unknown): number | null {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    const rounded = Math.round(input);
    return rounded;
  }
  if (typeof input === "string") {
    const cleaned = input.trim().replace(",", ".");
    if (cleaned === "") return null;
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return Math.round(parsed);
  }
  return null;
}

function clampMinutes(value: number): number {
  if (value < MIN_SLA_MINUTES) return MIN_SLA_MINUTES;
  if (value > MAX_SLA_MINUTES) return MAX_SLA_MINUTES;
  return value;
}

/**
 * Valida e normaliza um rascunho de meta de SLA.
 * Regras: ambos os campos obrigatórios, dentro de [1, 43200] min, e MTTA <= MTTR.
 */
export function validateSlaDraft(draft: {
  alertType: unknown;
  mttaMinutes: unknown;
  mttrMinutes: unknown;
  notes?: unknown;
}): SlaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const alertType = typeof draft.alertType === "string" ? draft.alertType.trim() : "";
  if (!alertType) errors.push("Tipo de alerta é obrigatório.");

  const rawMtta = parseMinutes(draft.mttaMinutes);
  const rawMttr = parseMinutes(draft.mttrMinutes);

  if (rawMtta === null) errors.push("MTTA inválido: informe um número em minutos.");
  if (rawMttr === null) errors.push("MTTR inválido: informe um número em minutos.");

  let mtta = clampMinutes(rawMtta ?? MIN_SLA_MINUTES);
  let mttr = clampMinutes(rawMttr ?? MIN_SLA_MINUTES);

  if (rawMtta !== null && rawMtta !== mtta) {
    warnings.push(`MTTA ajustado para ${mtta} min (limites: ${MIN_SLA_MINUTES}–${MAX_SLA_MINUTES}).`);
  }
  if (rawMttr !== null && rawMttr !== mttr) {
    warnings.push(`MTTR ajustado para ${mttr} min (limites: ${MIN_SLA_MINUTES}–${MAX_SLA_MINUTES}).`);
  }

  if (rawMtta !== null && rawMttr !== null && mtta > mttr) {
    errors.push("MTTA não pode ser maior que o MTTR (reconhecer vem antes de resolver).");
  }

  const notes = typeof draft.notes === "string" ? draft.notes.trim().slice(0, 500) : null;

  return {
    valid: errors.length === 0,
    normalized: { alertType, mttaMinutes: mtta, mttrMinutes: mttr, notes: notes || null },
    errors,
    warnings,
  };
}

/** Converte o draft normalizado para o payload do banco (segundos). */
export function draftToRow(draft: SlaTargetDraft): SlaTargetRow {
  return {
    alert_type: draft.alertType,
    mtta_target_seconds: draft.mttaMinutes * 60,
    mttr_target_seconds: draft.mttrMinutes * 60,
    notes: draft.notes ?? null,
  };
}

/** Converte a linha do banco para minutos usados na UI. */
export function rowToDraft(row: Partial<SlaTargetRow> & { alert_type: string }): SlaTargetDraft {
  return {
    alertType: row.alert_type,
    mttaMinutes: Math.max(MIN_SLA_MINUTES, Math.round((row.mtta_target_seconds ?? 60) / 60)),
    mttrMinutes: Math.max(MIN_SLA_MINUTES, Math.round((row.mttr_target_seconds ?? 60) / 60)),
    notes: row.notes ?? null,
  };
}

/** Formata minutos em rótulo humano curto (ex.: 90 → "1h30"). */
export function formatMinutes(minutes: number): string {
  const safe = Number.isFinite(minutes) ? Math.max(0, Math.round(minutes)) : 0;
  if (safe < 60) return `${safe}min`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours < 24) return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours === 0 ? `${days}d` : `${days}d${restHours}h`;
}

/* ------------------------------- persistência ------------------------------ */

export async function fetchSlaTargets(): Promise<SlaTargetRow[]> {
  const { data, error } = await supabase
    .from("sla_targets")
    .select("alert_type, mtta_target_seconds, mttr_target_seconds, notes");
  if (error) throw error;
  return (data ?? []) as SlaTargetRow[];
}

/** Upsert idempotente por `alert_type` (constraint UNIQUE no banco). */
export async function saveSlaTarget(draft: SlaTargetDraft): Promise<void> {
  const validation = validateSlaDraft(draft);
  if (!validation.valid) throw new Error(validation.errors.join(" "));
  const { error } = await supabase
    .from("sla_targets")
    .upsert(draftToRow(validation.normalized), { onConflict: "alert_type" });
  if (error) throw error;
}
