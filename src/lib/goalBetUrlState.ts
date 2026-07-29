import { parseGoalBetFilter, type GoalBetFilter } from "@/lib/goalBetFilter";

/**
 * Serialização do estado da vitrine de previsões na URL (deep link).
 *
 * Regras de projeto:
 * - `f` guarda o filtro, `q` a busca textual.
 * - Valores inválidos são descartados (a URL é entrada não confiável).
 * - Parâmetros no padrão são omitidos, mantendo a URL curta e canônica.
 * - Demais parâmetros presentes na URL são preservados.
 */

export const GOAL_BET_FILTER_PARAM = "f";
export const GOAL_BET_QUERY_PARAM = "q";

/** Tamanho máximo aceito para a busca vinda da URL. */
export const GOAL_BET_QUERY_MAX_LENGTH = 120;

export interface GoalBetUrlState {
  /** Filtro válido presente na URL, ou `null` quando ausente/ inválido. */
  filter: GoalBetFilter | null;
  /** Busca normalizada (aparada e truncada). String vazia quando ausente. */
  query: string;
}

/** Sanitiza uma busca vinda da URL. */
export function sanitizeGoalBetQuery(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, GOAL_BET_QUERY_MAX_LENGTH);
}

/** Lê o estado da vitrine a partir dos parâmetros de busca da URL. */
export function readGoalBetUrlState(
  params: URLSearchParams | string | null | undefined,
): GoalBetUrlState {
  const search =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(params ?? "");
  return {
    filter: parseGoalBetFilter(search.get(GOAL_BET_FILTER_PARAM)),
    query: sanitizeGoalBetQuery(search.get(GOAL_BET_QUERY_PARAM)),
  };
}

/**
 * Aplica o estado sobre os parâmetros atuais, preservando chaves alheias.
 * Retorna sempre uma nova instância (nunca muta a original).
 */
export function writeGoalBetUrlState(
  current: URLSearchParams | string | null | undefined,
  state: { filter: GoalBetFilter; query: string },
): URLSearchParams {
  const next = new URLSearchParams(
    current instanceof URLSearchParams ? current.toString() : (current ?? ""),
  );

  if (state.filter && state.filter !== "all") {
    next.set(GOAL_BET_FILTER_PARAM, state.filter);
  } else {
    next.delete(GOAL_BET_FILTER_PARAM);
  }

  const query = sanitizeGoalBetQuery(state.query);
  if (query) {
    next.set(GOAL_BET_QUERY_PARAM, query);
  } else {
    next.delete(GOAL_BET_QUERY_PARAM);
  }

  return next;
}
