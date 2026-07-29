import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { GoalBetFilter } from "@/lib/goalBetFilter";
import {
  readGoalBetUrlState,
  sanitizeGoalBetQuery,
  writeGoalBetUrlState,
} from "@/lib/goalBetUrlState";
import { useGoalBetFilter } from "@/hooks/useGoalBetFilter";

export interface GoalBetViewState {
  filter: GoalBetFilter;
  setFilter: (filter: GoalBetFilter) => void;
  query: string;
  setQuery: (query: string) => void;
}

/**
 * Estado compartilhável da vitrine de previsões (filtro + busca).
 *
 * Precedência: URL > preferência salva > padrão. A URL é reescrita com
 * `replace` para não poluir o histórico de navegação a cada tecla, e os
 * parâmetros no padrão são removidos para manter o link limpo.
 */
export function useGoalBetUrlSync(): GoalBetViewState {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setStoredFilter] = useGoalBetFilter();
  const [query, setQueryState] = useState(
    () => readGoalBetUrlState(searchParams).query,
  );
  const hydratedRef = useRef(false);

  // Hidratação única a partir da URL: um deep link vence a preferência local.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const fromUrl = readGoalBetUrlState(searchParams);
    if (fromUrl.filter) setStoredFilter(fromUrl.filter);
    if (fromUrl.query) setQueryState(fromUrl.query);
  }, [searchParams, setStoredFilter]);

  // Espelha o estado atual na URL, preservando parâmetros de terceiros.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const next = writeGoalBetUrlState(searchParams, { filter, query });
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [filter, query, searchParams, setSearchParams]);

  const setQuery = useCallback((value: string) => {
    setQueryState(sanitizeGoalBetQuery(value) === "" ? value.slice(0, 120) : value.slice(0, 120));
  }, []);

  return { filter, setFilter: setStoredFilter, query, setQuery };
}
