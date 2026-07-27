/**
 * Configuração do teto de moedas por giro da Roleta da Sorte.
 *
 * Motor PURO + persistência local tolerante a falhas. Nunca lança: entradas
 * hostis (NaN, negativos, texto, storage indisponível) caem no padrão seguro.
 */
export const DEFAULT_COINS_PER_SPIN_BUDGET = 30;
export const MIN_COINS_PER_SPIN_BUDGET = 1;
export const MAX_COINS_PER_SPIN_BUDGET = 10_000;

const STORAGE_KEY = "lucky_wheel_coins_per_spin_budget";

/** Normaliza qualquer entrada para um teto válido (ou `null` quando desligado). */
export function parseBudget(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return Math.min(
    MAX_COINS_PER_SPIN_BUDGET,
    Math.max(MIN_COINS_PER_SPIN_BUDGET, Math.round(value * 100) / 100),
  );
}

export function loadBudget(): number {
  try {
    const parsed = parseBudget(localStorage.getItem(STORAGE_KEY));
    return parsed ?? DEFAULT_COINS_PER_SPIN_BUDGET;
  } catch {
    return DEFAULT_COINS_PER_SPIN_BUDGET;
  }
}

/** Persiste e devolve o valor efetivamente aplicado. */
export function saveBudget(raw: unknown): number {
  const parsed = parseBudget(raw) ?? DEFAULT_COINS_PER_SPIN_BUDGET;
  try {
    localStorage.setItem(STORAGE_KEY, String(parsed));
  } catch {
    /* storage indisponível: mantém apenas em memória */
  }
  return parsed;
}
