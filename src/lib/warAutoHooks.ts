/**
 * Motor puro dos GANCHOS AUTOMATICOS da Guerra de Departamentos.
 *
 * Por que existe: ate agora uma contribuicao so entrava se alguem chamasse a
 * RPC manualmente. Isso torna a guerra um placar declarado, nao medido — e
 * qualquer placar declarado e, na pratica, um convite a fraude e ao
 * esquecimento. Os ganchos transformam eventos reais do sistema (tarefa
 * concluida, check-in pontual, trilha finalizada, quiz, kudos) em
 * contribuicoes idempotentes.
 *
 * Este modulo NAO escreve nada. Ele decide, de forma deterministica e pura,
 * QUAIS intents um evento de origem gera. A mesma decisao e replicada nos
 * triggers SQL — manter os dois lados espelhados e o contrato deste arquivo,
 * e por isso ele e testado com milhares de cenarios hostis.
 */

export type WarSourceEvent =
  | {
      type: "task_score";
      id: string;
      user_id: string;
      status: string;
      is_late: boolean | null;
      completed_at: string | null;
      previous_completed_at?: string | null;
    }
  | {
      type: "attendance";
      id: string;
      user_id: string;
      is_punctual: boolean | null;
      check_in: string | null;
    }
  | {
      type: "trail_enrollment";
      id: string;
      user_id: string;
      completed_at: string | null;
      previous_completed_at?: string | null;
    }
  | {
      type: "module_progress";
      id: string;
      user_id: string;
      completed_at: string | null;
      previous_completed_at?: string | null;
    }
  | {
      type: "quiz_score";
      id: string;
      user_id: string;
      correct_answers: number | null;
      total_questions: number | null;
    }
  | {
      type: "kudos";
      id: string;
      user_id: string;
    };

export interface WarContributionIntent {
  user_id: string;
  metric_key: string;
  amount: number;
  dedupe_key: string;
}

/** Catalogo canonico de metricas alimentadas automaticamente. */
export const AUTO_METRIC_KEYS = [
  "tarefa_concluida",
  "tarefa_no_prazo",
  "checkin_pontual",
  "trilha_concluida",
  "modulo_concluido",
  "quiz_acertado",
  "feedback_enviado",
] as const;

export type AutoMetricKey = (typeof AUTO_METRIC_KEYS)[number];

/** Espelha o teto do banco em `register_war_contribution`. */
export const MAX_CONTRIBUTION_AMOUNT = 1_000_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUsableId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/**
 * Normaliza uma quantidade para o dominio aceito pelo banco.
 * Retorna 0 quando o valor nao pode virar uma contribuicao valida — o chamador
 * descarta o intent nesse caso, jamais registra "quase zero".
 */
export function normalizeAmount(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(numeric)) return 0;
  const floored = Math.floor(numeric);
  if (floored <= 0) return 0;
  return Math.min(floored, MAX_CONTRIBUTION_AMOUNT);
}

/** Transicao "virou concluido agora" — evita recontagem em updates repetidos. */
function justCompleted(
  current: string | null | undefined,
  previous: string | null | undefined,
): boolean {
  return Boolean(current) && !previous;
}

function intent(
  userId: string,
  metricKey: AutoMetricKey,
  amount: number,
  dedupeKey: string,
): WarContributionIntent | null {
  const normalized = normalizeAmount(amount);
  if (normalized <= 0) return null;
  if (!isUsableId(userId)) return null;
  const key = dedupeKey.trim();
  if (!key) return null;
  return {
    user_id: userId.trim(),
    metric_key: metricKey,
    amount: normalized,
    dedupe_key: key.slice(0, 180),
  };
}

/**
 * Decide as contribuicoes geradas por um evento de origem.
 * Nunca lanca excecao: um evento malformado simplesmente nao gera nada, porque
 * do lado do banco esta logica roda dentro do trigger da tabela de origem e
 * NAO pode derrubar a transacao que registrou a tarefa/ponto do usuario.
 */
export function deriveWarIntents(
  event: WarSourceEvent | null | undefined,
): WarContributionIntent[] {
  try {
    if (!event || typeof event !== "object") return [];
    if (!isUsableId((event as { user_id?: unknown }).user_id)) return [];
    if (!isUsableId((event as { id?: unknown }).id)) return [];

    const out: WarContributionIntent[] = [];

    switch (event.type) {
      case "task_score": {
        if (String(event.status ?? "").toLowerCase() !== "completed") break;
        if (!justCompleted(event.completed_at, event.previous_completed_at)) break;
        const done = intent(
          event.user_id,
          "tarefa_concluida",
          1,
          `task:${event.id}`,
        );
        if (done) out.push(done);
        if (event.is_late === false) {
          const onTime = intent(
            event.user_id,
            "tarefa_no_prazo",
            1,
            `task_ontime:${event.id}`,
          );
          if (onTime) out.push(onTime);
        }
        break;
      }
      case "attendance": {
        if (event.is_punctual !== true) break;
        if (!event.check_in) break;
        const punctual = intent(
          event.user_id,
          "checkin_pontual",
          1,
          `attendance:${event.id}`,
        );
        if (punctual) out.push(punctual);
        break;
      }
      case "trail_enrollment": {
        if (!justCompleted(event.completed_at, event.previous_completed_at)) break;
        const trail = intent(
          event.user_id,
          "trilha_concluida",
          1,
          `trail:${event.id}`,
        );
        if (trail) out.push(trail);
        break;
      }
      case "module_progress": {
        if (!justCompleted(event.completed_at, event.previous_completed_at)) break;
        const mod = intent(
          event.user_id,
          "modulo_concluido",
          1,
          `module:${event.id}`,
        );
        if (mod) out.push(mod);
        break;
      }
      case "quiz_score": {
        const correct = normalizeAmount(event.correct_answers);
        if (correct <= 0) break;
        const total = normalizeAmount(event.total_questions);
        // Um quiz nao pode render mais acertos do que perguntas: protege contra
        // payloads inflados vindos de integracoes externas.
        const bounded = total > 0 ? Math.min(correct, total) : correct;
        const quiz = intent(
          event.user_id,
          "quiz_acertado",
          bounded,
          `quiz:${event.id}`,
        );
        if (quiz) out.push(quiz);
        break;
      }
      case "kudos": {
        const kudo = intent(
          event.user_id,
          "feedback_enviado",
          1,
          `kudos:${event.id}`,
        );
        if (kudo) out.push(kudo);
        break;
      }
      default:
        break;
    }

    return out;
  } catch {
    // Invariante de ouro: gancho nunca quebra o fluxo de origem.
    return [];
  }
}

/**
 * Aplica uma lista de intents sobre um conjunto ja registrado de dedupe keys,
 * devolvendo apenas os inéditos. Espelha o `ON CONFLICT DO NOTHING` do banco.
 */
export function filterNewIntents(
  intents: WarContributionIntent[],
  seen: ReadonlySet<string>,
): WarContributionIntent[] {
  const result: WarContributionIntent[] = [];
  const local = new Set<string>();
  for (const item of intents) {
    const fingerprint = `${item.user_id}:${item.dedupe_key}`;
    if (seen.has(fingerprint) || local.has(fingerprint)) continue;
    local.add(fingerprint);
    result.push(item);
  }
  return result;
}