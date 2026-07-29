import type { PredictionMarketRow } from "@/services/predictionMarketService";

/** Urgência do fechamento de um mercado de previsão. */
export type CountdownUrgency = "none" | "calm" | "soon" | "urgent" | "closed";

export interface GoalBetCountdown {
  /** Milissegundos restantes até `locks_at` (0 quando já fechou). */
  msLeft: number;
  urgency: CountdownUrgency;
  /** Texto curto pronto para badge ("2d 3h", "45min", "Fechado"). */
  label: string;
  /** Descrição acessível para leitores de tela. */
  srLabel: string;
}

/** Abaixo de 1h é urgente; abaixo de 24h pede atenção. */
export const COUNTDOWN_URGENT_MS = 60 * 60 * 1000;
export const COUNTDOWN_SOON_MS = 24 * 60 * 60 * 1000;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const NONE: GoalBetCountdown = {
  msLeft: 0,
  urgency: "none",
  label: "",
  srLabel: "",
};

function humanize(ms: number): string {
  if (ms >= DAY) {
    const days = Math.floor(ms / DAY);
    const hours = Math.floor((ms % DAY) / HOUR);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (ms >= HOUR) {
    const hours = Math.floor(ms / HOUR);
    const minutes = Math.floor((ms % HOUR) / MINUTE);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
  const minutes = Math.floor(ms / MINUTE);
  if (minutes >= 1) return `${minutes}min`;
  return "<1min";
}

/**
 * Contagem regressiva determinística até o fechamento das apostas.
 * Mercados que não estão abertos (rascunho, travado, apurado, anulado) não
 * exibem contagem — o estado já é comunicado pelo selo de status.
 */
export function computeGoalBetCountdown(
  market: Pick<PredictionMarketRow, "status" | "locks_at"> | null | undefined,
  now: Date = new Date(),
): GoalBetCountdown {
  if (!market || market.status !== "open") return NONE;

  const locksAt = new Date(market.locks_at ?? "").getTime();
  const reference = now.getTime();
  if (!Number.isFinite(locksAt) || !Number.isFinite(reference)) return NONE;

  const msLeft = locksAt - reference;
  if (msLeft <= 0) {
    return {
      msLeft: 0,
      urgency: "closed",
      label: "Fechado",
      srLabel: "Apostas encerradas para este mercado.",
    };
  }

  const urgency: CountdownUrgency =
    msLeft <= COUNTDOWN_URGENT_MS
      ? "urgent"
      : msLeft <= COUNTDOWN_SOON_MS
        ? "soon"
        : "calm";

  const label = humanize(msLeft);
  return {
    msLeft,
    urgency,
    label,
    srLabel:
      urgency === "urgent"
        ? `Últimos ${label} para apostar neste mercado.`
        : `Fecha em ${label}.`,
  };
}