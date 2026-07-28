/**
 * Validação pura da autoria de procedimentos do jogo "Ordene a Sequência".
 *
 * A fonte de verdade continua sendo a RPC `save_sequence_procedure`
 * (SECURITY DEFINER, transacional). Aqui espelhamos exatamente as mesmas
 * regras para dar feedback imediato e evitar idas ao servidor fadadas a falhar.
 *
 * Regra crítica de negócio: rótulos duplicados tornariam a correção ambígua
 * (duas etapas indistinguíveis para o jogador), então são bloqueados.
 */

export const SOP_MIN_STEPS = 3;
export const SOP_MAX_STEPS = 20;
export const SOP_TITLE_MAX = 120;
export const SOP_DESCRIPTION_MAX = 400;
export const SOP_LABEL_MAX = 160;
export const SOP_HINT_MAX = 240;

export interface ProcedureDraft {
  title: string;
  description?: string | null;
  departmentId?: string | null;
  isActive: boolean;
}

export interface StepDraft {
  /** Ausente em etapas ainda não persistidas. */
  id?: string;
  label: string;
  hint?: string | null;
}

export interface AuthoringIssue {
  /** `procedure` para o cabeçalho, ou o índice da etapa (`step:0`). */
  scope: string;
  message: string;
}

export interface ProcedureValidation {
  valid: boolean;
  issues: AuthoringIssue[];
  /** Etapas normalizadas, na ordem final (posição = índice + 1). */
  normalizedSteps: StepDraft[];
  usableSteps: number;
}

/** Remove espaços redundantes nas pontas e no meio. */
export function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Chave de comparação insensível a caixa e acento. */
export function comparisonKey(value: string): string {
  return normalizeText(value)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Valida o rascunho completo. Etapas totalmente vazias (rótulo e dica em
 * branco) são descartadas em silêncio — o autor quase sempre deixa a última
 * linha vazia. Uma dica sem rótulo, porém, é erro explícito.
 */
export function validateProcedureDraft(
  procedure: ProcedureDraft,
  steps: ReadonlyArray<StepDraft>,
): ProcedureValidation {
  const issues: AuthoringIssue[] = [];
  const title = normalizeText(procedure.title ?? "");
  const description = normalizeText(procedure.description ?? "");

  if (title.length === 0) {
    issues.push({ scope: "procedure", message: "Informe um título para o procedimento." });
  } else if (title.length > SOP_TITLE_MAX) {
    issues.push({
      scope: "procedure",
      message: `O título deve ter no máximo ${SOP_TITLE_MAX} caracteres.`,
    });
  }

  if (description.length > SOP_DESCRIPTION_MAX) {
    issues.push({
      scope: "procedure",
      message: `A descrição deve ter no máximo ${SOP_DESCRIPTION_MAX} caracteres.`,
    });
  }

  const normalizedSteps: StepDraft[] = [];
  const seenLabels = new Map<string, number>();

  steps.forEach((step, index) => {
    const label = normalizeText(step.label ?? "");
    const hint = normalizeText(step.hint ?? "");
    const scope = `step:${index}`;

    if (label.length === 0 && hint.length === 0) return;

    if (label.length === 0) {
      issues.push({ scope, message: "Descreva a etapa (o rótulo é obrigatório)." });
      return;
    }
    if (label.length > SOP_LABEL_MAX) {
      issues.push({ scope, message: `A etapa deve ter no máximo ${SOP_LABEL_MAX} caracteres.` });
      return;
    }
    if (hint.length > SOP_HINT_MAX) {
      issues.push({ scope, message: `A dica deve ter no máximo ${SOP_HINT_MAX} caracteres.` });
      return;
    }

    const key = comparisonKey(label);
    if (seenLabels.has(key)) {
      issues.push({
        scope,
        message: `Etapa repetida (igual à etapa ${(seenLabels.get(key) ?? 0) + 1}).`,
      });
      return;
    }
    seenLabels.set(key, normalizedSteps.length);

    normalizedSteps.push({
      ...(step.id ? { id: step.id } : {}),
      label,
      hint: hint.length > 0 ? hint : null,
    });
  });

  if (normalizedSteps.length < SOP_MIN_STEPS) {
    issues.push({
      scope: "procedure",
      message: `Cadastre pelo menos ${SOP_MIN_STEPS} etapas válidas (atualmente ${normalizedSteps.length}).`,
    });
  }
  if (normalizedSteps.length > SOP_MAX_STEPS) {
    issues.push({
      scope: "procedure",
      message: `Um procedimento aceita no máximo ${SOP_MAX_STEPS} etapas.`,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    normalizedSteps,
    usableSteps: normalizedSteps.length,
  };
}

export interface ProcedureChangeSummary {
  inserted: number;
  updated: number;
  removed: number;
  reordered: boolean;
  unchanged: number;
}

export interface PersistedStep {
  id: string;
  label: string;
  hint?: string | null;
  position: number;
}

/**
 * Prévia das mudanças que a RPC aplicará — usada apenas para informar o autor
 * (o servidor recalcula tudo por conta própria).
 */
export function summarizeChanges(
  existing: ReadonlyArray<PersistedStep>,
  draft: ReadonlyArray<StepDraft>,
): ProcedureChangeSummary {
  const byId = new Map(existing.map((s) => [s.id, s]));
  const kept = new Set<string>();
  const summary: ProcedureChangeSummary = {
    inserted: 0,
    updated: 0,
    removed: 0,
    reordered: false,
    unchanged: 0,
  };

  draft.forEach((step, index) => {
    const current = step.id ? byId.get(step.id) : undefined;
    if (!current) {
      summary.inserted += 1;
      return;
    }
    kept.add(current.id);

    const sameLabel = normalizeText(current.label) === normalizeText(step.label ?? "");
    const sameHint = normalizeText(current.hint ?? "") === normalizeText(step.hint ?? "");
    const samePosition = current.position === index + 1;

    if (!samePosition) summary.reordered = true;
    if (sameLabel && sameHint && samePosition) summary.unchanged += 1;
    else summary.updated += 1;
  });

  summary.removed = existing.filter((s) => !kept.has(s.id)).length;
  return summary;
}
