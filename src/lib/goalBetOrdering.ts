import type { PredictionMarketRow } from "@/services/predictionMarketService";

/**
 * Peso por status: quem ainda aceita aposta aparece primeiro; encerrados vão
 * para o fim. Menor peso = mais acima na lista.
 */
const STATUS_WEIGHT: Record<PredictionMarketRow["status"], number> = {
  open: 0,
  locked: 1,
  settled: 2,
  voided: 3,
  draft: 4,
};

function statusWeight(market: PredictionMarketRow): number {
  return STATUS_WEIGHT[market.status] ?? 9;
}

function locksAtMs(market: PredictionMarketRow): number {
  const value = new Date(market.locks_at ?? "").getTime();
  // Data inválida nunca deve "furar a fila" da urgência.
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

/**
 * Ordena mercados por urgência de fechamento, de forma determinística e
 * estável:
 * 1. Abertos que já passaram do prazo continuam entre os abertos (o servidor
 *    ainda vai travá-los), mas por data eles caem naturalmente no topo.
 * 2. Dentro do mesmo status, fecha antes = aparece antes.
 * 3. Para mercados encerrados, o mais recente primeiro (created_at desc).
 * 4. Empates são resolvidos pelo id, garantindo ordem reproduzível.
 */
export function sortMarketsByUrgency(
  markets: readonly PredictionMarketRow[] | null | undefined,
): PredictionMarketRow[] {
  return [...(markets ?? [])].sort((a, b) => {
    const weight = statusWeight(a) - statusWeight(b);
    if (weight !== 0) return weight;

    const closing = statusWeight(a) <= 1;
    if (closing) {
      const diff = locksAtMs(a) - locksAtMs(b);
      if (diff !== 0) return diff;
    } else {
      const createdA = new Date(a.created_at ?? "").getTime();
      const createdB = new Date(b.created_at ?? "").getTime();
      const safeA = Number.isFinite(createdA) ? createdA : 0;
      const safeB = Number.isFinite(createdB) ? createdB : 0;
      if (safeA !== safeB) return safeB - safeA;
    }

    return a.id.localeCompare(b.id);
  });
}