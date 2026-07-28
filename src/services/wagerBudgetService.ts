import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

/** Configuração única de orçamento da Pergunta do Dia. */
export interface WagerBudgetSettings {
  monthlyCoinBudget: number;
  expectedPlayers: number;
  updatedAt: string | null;
}

export const WAGER_BUDGET_DEFAULTS: WagerBudgetSettings = {
  monthlyCoinBudget: 20000,
  expectedPlayers: 30,
  updatedAt: null,
};

const MAX_BUDGET = 10_000_000;
const MAX_PLAYERS = 100_000;

/** Clamp defensivo espelhando os CHECK constraints do banco. */
export function clampBudget(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return WAGER_BUDGET_DEFAULTS.monthlyCoinBudget;
  return Math.min(MAX_BUDGET, Math.max(0, n));
}

export function clampPlayers(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return WAGER_BUDGET_DEFAULTS.expectedPlayers;
  return Math.min(MAX_PLAYERS, Math.max(0, n));
}

export const wagerBudgetService = {
  /** Lê a configuração; devolve os padrões quando ainda não há linha visível. */
  async get(): Promise<WagerBudgetSettings> {
    const { data, error } = await supabase
      .from("wager_budget_settings")
      .select("monthly_coin_budget, expected_players, updated_at")
      .maybeSingle();

    if (error) {
      logger.error("wagerBudgetService.get", error);
      throw error;
    }
    if (!data) return { ...WAGER_BUDGET_DEFAULTS };

    return {
      monthlyCoinBudget: clampBudget(data.monthly_coin_budget),
      expectedPlayers: clampPlayers(data.expected_players),
      updatedAt: data.updated_at ?? null,
    };
  },

  /** Persiste (upsert no registro único). Requer papel de administrador. */
  async save(input: {
    monthlyCoinBudget: number;
    expectedPlayers: number;
  }): Promise<WagerBudgetSettings> {
    const { data: auth } = await supabase.auth.getUser();
    const payload = {
      id: true,
      monthly_coin_budget: clampBudget(input.monthlyCoinBudget),
      expected_players: clampPlayers(input.expectedPlayers),
      updated_by: auth?.user?.id ?? null,
    };

    const { data, error } = await supabase
      .from("wager_budget_settings")
      .upsert(payload, { onConflict: "id" })
      .select("monthly_coin_budget, expected_players, updated_at")
      .maybeSingle();

    if (error) {
      logger.error("wagerBudgetService.save", error);
      throw error;
    }

    return {
      monthlyCoinBudget: clampBudget(data?.monthly_coin_budget ?? payload.monthly_coin_budget),
      expectedPlayers: clampPlayers(data?.expected_players ?? payload.expected_players),
      updatedAt: data?.updated_at ?? null,
    };
  },
};
