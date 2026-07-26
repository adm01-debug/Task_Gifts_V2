/**
 * Retomada de progresso do player de módulos (LMS).
 *
 * Camada pura e defensiva: nenhum acesso a React, apenas leitura/escrita
 * tolerante a falhas em `localStorage`. O estado é local ao dispositivo —
 * a fonte de verdade da conclusão continua sendo `module_progress` no banco.
 */

/** Tipos de conteúdo que suportam retomada posicional. */
export type ResumableContentType = "video" | "text" | "quiz" | "flashcard" | "checklist";

export interface ResumeState {
  /** Identificador do módulo (UUID). */
  moduleId: string;
  contentType: ResumableContentType;
  /** Índice atual (questão, card...) — sempre >= 0. */
  position: number;
  /** Respostas parciais do quiz (índice da alternativa; -1 = não respondida). */
  answers?: number[];
  /** Itens marcados de um checklist. */
  checked?: number[];
  /** Percentual de rolagem/reprodução consumido (0..1). */
  progressRatio?: number;
  /** Epoch ms da última atualização. */
  updatedAt: number;
}

/** Janela de validade da retomada — evita ressuscitar sessões antigas. */
export const RESUME_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const STORAGE_PREFIX = "lms:resume:v1";

/** Chave determinística e isolada por usuário (evita vazamento entre contas). */
export function resumeKey(userId: string | null | undefined, moduleId: string): string {
  const owner = (userId ?? "anon").trim() || "anon";
  return `${STORAGE_PREFIX}:${owner}:${moduleId}`;
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(Math.max(n, min), max);
}

const CONTENT_TYPES: ResumableContentType[] = ["video", "text", "quiz", "flashcard", "checklist"];

/**
 * Normaliza um estado arbitrário para um `ResumeState` válido.
 * Retorna `null` quando o payload é irrecuperável ou expirado.
 */
export function normalizeResume(raw: unknown, now: number = Date.now()): ResumeState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  const moduleId = typeof obj.moduleId === "string" ? obj.moduleId.trim() : "";
  if (!moduleId) return null;

  const contentType = CONTENT_TYPES.includes(obj.contentType as ResumableContentType)
    ? (obj.contentType as ResumableContentType)
    : null;
  if (!contentType) return null;

  const updatedAt =
    typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt) ? obj.updatedAt : 0;
  if (updatedAt <= 0) return null;
  // Descarta relógios adiantados (clock skew) e sessões expiradas.
  if (updatedAt > now + 60_000) return null;
  if (now - updatedAt > RESUME_TTL_MS) return null;

  const state: ResumeState = {
    moduleId,
    contentType,
    position: clampInt(obj.position, 0, 10_000),
    updatedAt,
  };

  if (Array.isArray(obj.answers)) {
    state.answers = obj.answers.slice(0, 500).map((a) => clampInt(a, -1, 50));
  }
  if (Array.isArray(obj.checked)) {
    state.checked = Array.from(
      new Set(obj.checked.slice(0, 500).map((c) => clampInt(c, 0, 10_000))),
    ).sort((a, b) => a - b);
  }
  if (typeof obj.progressRatio === "number" && Number.isFinite(obj.progressRatio)) {
    state.progressRatio = Math.min(Math.max(obj.progressRatio, 0), 1);
  }

  return state;
}

/** Lê o estado salvo; nunca lança (storage indisponível, JSON corrompido, quota). */
export function loadResume(
  userId: string | null | undefined,
  moduleId: string,
  now: number = Date.now(),
): ResumeState | null {
  try {
    const raw = window.localStorage.getItem(resumeKey(userId, moduleId));
    if (!raw) return null;
    const parsed = normalizeResume(JSON.parse(raw) as unknown, now);
    // Auto-limpeza de registros inválidos/expirados.
    if (!parsed) clearResume(userId, moduleId);
    return parsed;
  } catch {
    return null;
  }
}

/** Persiste o estado. Retorna `false` quando o storage não está disponível. */
export function saveResume(
  userId: string | null | undefined,
  state: ResumeState,
): boolean {
  const now = Date.now();
  // O carimbo de tempo é sempre do servidor local no momento da escrita,
  // impedindo que um estado com relógio adiantado seja rejeitado na leitura.
  const normalized = normalizeResume({ ...state, updatedAt: now }, now);
  if (!normalized) return false;
  try {
    window.localStorage.setItem(
      resumeKey(userId, normalized.moduleId),
      JSON.stringify(normalized),
    );
    return true;
  } catch {
    return false;
  }
}

/** Remove o estado salvo (conclusão do módulo ou descarte explícito). */
export function clearResume(userId: string | null | undefined, moduleId: string): void {
  try {
    window.localStorage.removeItem(resumeKey(userId, moduleId));
  } catch {
    /* storage indisponível — nada a fazer */
  }
}

/**
 * Posição segura para retomar dado o tamanho real do conteúdo atual.
 * Protege contra módulos editados após o salvamento (menos questões/cards).
 */
export function safeResumePosition(state: ResumeState | null, total: number): number {
  if (!state || total <= 0) return 0;
  return Math.min(state.position, total - 1);
}

/** Rótulo humano para o aviso de retomada. */
export function describeResume(state: ResumeState, total?: number): string {
  const step = state.position + 1;
  if (typeof total === "number" && total > 0) {
    return `Retomar do item ${Math.min(step, total)} de ${total}`;
  }
  return `Retomar de onde parou (item ${step})`;
}
