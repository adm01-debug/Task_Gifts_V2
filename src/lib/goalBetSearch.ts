import type { PredictionMarketRow } from "@/services/predictionMarketService";

/**
 * Motor de busca textual da vitrine de mercados de previsão.
 *
 * Regras de projeto (determinísticas e puras):
 * - Normaliza acentos e caixa (NFD + remoção de diacríticos), para que
 *   "previsao" encontre "Previsão".
 * - Quebra a consulta em termos por espaços em branco; um mercado só é
 *   retornado quando TODOS os termos aparecem em algum campo pesquisável
 *   (semântica AND, que reduz ruído em listas grandes).
 * - Campos pesquisáveis: título, descrição e os rótulos das opções.
 * - Nunca muta a lista recebida e tolera `null`/`undefined`.
 */

/** Remove acentos, normaliza caixa e colapsa espaços. */
export function normalizeSearchText(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Divide a consulta em termos normalizados e não vazios. */
export function parseSearchTerms(query: string | null | undefined): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  return normalized.split(" ").filter((term) => term.length > 0);
}

/** Texto agregado e normalizado de um mercado (título + descrição + opções). */
export function buildMarketSearchIndex(market: PredictionMarketRow): string {
  const optionLabels = (market.options ?? []).map((option) => option?.label ?? "");
  return normalizeSearchText(
    [market.title, market.description, ...optionLabels].filter(Boolean).join(" "),
  );
}

/** Verifica se o mercado satisfaz todos os termos da consulta. */
export function marketMatchesTerms(
  market: PredictionMarketRow,
  terms: string[],
): boolean {
  if (terms.length === 0) return true;
  const index = buildMarketSearchIndex(market);
  return terms.every((term) => index.includes(term));
}

/**
 * Aplica a busca preservando a ordem original da lista.
 * Consulta vazia devolve uma cópia íntegra (sem filtrar).
 */
export function searchMarkets(
  markets: PredictionMarketRow[] | null | undefined,
  query: string | null | undefined,
): PredictionMarketRow[] {
  const list = Array.isArray(markets) ? markets : [];
  const terms = parseSearchTerms(query);
  if (terms.length === 0) return [...list];
  return list.filter((market) => marketMatchesTerms(market, terms));
}
