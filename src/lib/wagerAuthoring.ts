/**
 * Validação pura da autoria da "Pergunta do Dia com Aposta".
 *
 * A fonte de verdade continua sendo a RPC `save_wager_question`
 * (SECURITY DEFINER, transacional). Aqui espelhamos exatamente as mesmas
 * regras para dar feedback imediato e impedir requisições fadadas a falhar.
 */

export const WAGER_QUESTION_MIN = 5;
export const WAGER_QUESTION_MAX = 500;
export const WAGER_OPTION_MAX = 160;
export const WAGER_EXPLANATION_MAX = 500;
export const WAGER_MIN_OPTIONS = 2;
export const WAGER_MAX_OPTIONS = 6;
export const WAGER_MIN_MULTIPLIER = 1.1;
export const WAGER_MAX_MULTIPLIER = 5;
export const WAGER_MIN_STAKE = 10;
export const WAGER_MAX_STAKE = 1000;

export interface WagerOptionDraft {
  id: string;
  label: string;
}

export interface WagerQuestionDraft {
  id?: string | null;
  question: string;
  options: WagerOptionDraft[];
  correctOption: string;
  explanation?: string | null;
  difficulty: "easy" | "medium" | "hard";
  multiplier: number;
  maxStake: number;
  scheduledDate: string;
  isActive: boolean;
}

export interface WagerAuthoringIssue {
  /** `question`, `schedule` ou o índice da alternativa (`option:0`). */
  scope: string;
  message: string;
}

export interface WagerValidation {
  valid: boolean;
  issues: WagerAuthoringIssue[];
  normalizedOptions: WagerOptionDraft[];
}

export function normalizeText(value: string): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/** Chave de comparação insensível a caixa e acento. */
export function comparisonKey(value: string): string {
  return normalizeText(value)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Rótulo estável para as alternativas: A, B, C… (nunca muda o gabarito). */
export function optionKeyAt(index: number): string {
  return String.fromCharCode(65 + Math.max(0, index));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidISODate(value: string): boolean {
  if (!DATE_RE.test(value ?? "")) return false;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  // Rejeita datas "normalizadas" pelo JS (ex.: 2026-02-31 vira março).
  return date.toISOString().slice(0, 10) === value;
}

export function clampMultiplier(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.min(WAGER_MAX_MULTIPLIER, Math.max(WAGER_MIN_MULTIPLIER, Math.round(n * 100) / 100));
}

export function clampMaxStake(value: number): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 100;
  return Math.min(WAGER_MAX_STAKE, Math.max(WAGER_MIN_STAKE, n));
}

/**
 * Valida o rascunho completo. Alternativas totalmente vazias são descartadas
 * em silêncio (a última linha quase sempre fica em branco).
 */
export function validateWagerDraft(draft: WagerQuestionDraft): WagerValidation {
  const issues: WagerAuthoringIssue[] = [];
  const question = normalizeText(draft.question ?? "");
  const explanation = normalizeText(draft.explanation ?? "");

  if (question.length < WAGER_QUESTION_MIN) {
    issues.push({ scope: "question", message: "Escreva o enunciado da pergunta." });
  } else if (question.length > WAGER_QUESTION_MAX) {
    issues.push({
      scope: "question",
      message: `O enunciado deve ter no máximo ${WAGER_QUESTION_MAX} caracteres.`,
    });
  }

  if (explanation.length > WAGER_EXPLANATION_MAX) {
    issues.push({
      scope: "question",
      message: `A explicação deve ter no máximo ${WAGER_EXPLANATION_MAX} caracteres.`,
    });
  }

  const normalizedOptions: WagerOptionDraft[] = [];
  const seen = new Map<string, number>();

  (draft.options ?? []).forEach((option, index) => {
    const label = normalizeText(option?.label ?? "");
    const scope = `option:${index}`;
    if (label.length === 0) return;
    if (label.length > WAGER_OPTION_MAX) {
      issues.push({
        scope,
        message: `A alternativa deve ter no máximo ${WAGER_OPTION_MAX} caracteres.`,
      });
      return;
    }
    const key = comparisonKey(label);
    if (seen.has(key)) {
      issues.push({
        scope,
        message: `Alternativa repetida (igual à ${optionKeyAt(seen.get(key) ?? 0)}).`,
      });
      return;
    }
    seen.set(key, normalizedOptions.length);
    normalizedOptions.push({
      id: normalizeText(option?.id ?? "") || optionKeyAt(normalizedOptions.length),
      label,
    });
  });

  if (normalizedOptions.length < WAGER_MIN_OPTIONS) {
    issues.push({
      scope: "question",
      message: `Informe ao menos ${WAGER_MIN_OPTIONS} alternativas válidas.`,
    });
  }
  if (normalizedOptions.length > WAGER_MAX_OPTIONS) {
    issues.push({
      scope: "question",
      message: `Use no máximo ${WAGER_MAX_OPTIONS} alternativas.`,
    });
  }

  // Ids duplicados tornariam o gabarito ambíguo — inaceitável.
  const ids = new Set(normalizedOptions.map((o) => o.id));
  if (ids.size !== normalizedOptions.length) {
    issues.push({ scope: "question", message: "Identificadores de alternativa duplicados." });
  }

  const correct = normalizeText(draft.correctOption ?? "");
  if (!correct || !ids.has(correct)) {
    issues.push({ scope: "question", message: "Marque qual alternativa é a correta." });
  }

  if (!isValidISODate(draft.scheduledDate ?? "")) {
    issues.push({ scope: "schedule", message: "Escolha uma data válida para a pergunta." });
  }

  const multiplier = Number(draft.multiplier);
  if (!Number.isFinite(multiplier) || multiplier < WAGER_MIN_MULTIPLIER || multiplier > WAGER_MAX_MULTIPLIER) {
    issues.push({
      scope: "schedule",
      message: `O multiplicador deve ficar entre ${WAGER_MIN_MULTIPLIER}x e ${WAGER_MAX_MULTIPLIER}x.`,
    });
  }

  const maxStake = Number(draft.maxStake);
  if (!Number.isInteger(maxStake) || maxStake < WAGER_MIN_STAKE || maxStake > WAGER_MAX_STAKE) {
    issues.push({
      scope: "schedule",
      message: `O teto de aposta deve ficar entre ${WAGER_MIN_STAKE} e ${WAGER_MAX_STAKE} moedas.`,
    });
  }

  return { valid: issues.length === 0, issues, normalizedOptions };
}

/** Prévia do risco assumido pela empresa no pior cenário (todos acertam). */
export function estimateExposure(draft: WagerQuestionDraft, expectedPlayers: number): number {
  const players = Math.max(0, Math.trunc(Number(expectedPlayers) || 0));
  const stake = clampMaxStake(draft.maxStake);
  const gainPerPlayer = Math.floor(stake * (clampMultiplier(draft.multiplier) - 1));
  return players * gainPerPlayer;
}

export const WAGER_SAVE_REASONS: Record<string, string> = {
  unauthenticated: "Faça login para gerenciar as perguntas.",
  forbidden: "Você não tem permissão para editar as perguntas do dia.",
  invalid_question: "Enunciado inválido.",
  invalid_options: "Alternativas inválidas (mínimo 2, máximo 6).",
  duplicate_options: "Existem alternativas com o mesmo identificador.",
  invalid_correct_option: "A alternativa correta não está entre as opções.",
  invalid_multiplier: "Multiplicador fora do intervalo permitido.",
  invalid_max_stake: "Teto de aposta fora do intervalo permitido.",
  invalid_date: "Data inválida.",
  not_found: "Pergunta não encontrada.",
};

export function wagerSaveMessage(reason?: string | null): string {
  if (!reason) return "Não foi possível salvar a pergunta.";
  return WAGER_SAVE_REASONS[reason] ?? "Não foi possível salvar a pergunta.";
}