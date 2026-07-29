import { useCallback, useEffect, useState } from "react";
import {
  GOAL_BET_FILTER_STORAGE_KEY,
  parseGoalBetFilter,
  type GoalBetFilter,
} from "@/lib/goalBetFilter";

/**
 * Mantém o filtro da vitrine de mercados entre visitas.
 * O storage é tratado como fonte não confiável: valores inválidos caem no
 * padrão e qualquer falha de acesso (modo privativo, cota) é silenciada —
 * a preferência é cosmética e nunca pode quebrar a página.
 */
export function useGoalBetFilter(
  fallback: GoalBetFilter = "all",
): [GoalBetFilter, (filter: GoalBetFilter) => void] {
  const [filter, setFilter] = useState<GoalBetFilter>(fallback);

  // Leitura pós-montagem: evita divergência de hidratação e acesso a
  // window durante o render.
  useEffect(() => {
    try {
      const stored = parseGoalBetFilter(
        window.localStorage.getItem(GOAL_BET_FILTER_STORAGE_KEY),
      );
      if (stored) setFilter(stored);
    } catch {
      /* storage indisponível: mantém o padrão */
    }
  }, []);

  const update = useCallback((next: GoalBetFilter) => {
    setFilter(next);
    try {
      window.localStorage.setItem(GOAL_BET_FILTER_STORAGE_KEY, next);
    } catch {
      /* preferência não persistida, sem impacto funcional */
    }
  }, []);

  return [filter, update];
}