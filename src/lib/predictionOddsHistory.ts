/**
 * Reconstrução do histórico de cotações de um mercado de previsão.
 *
 * Decisão de projeto: NÃO existe tabela de snapshot. O ledger
 * `prediction_stakes` é append-only e carrega `created_at`, então a série
 * histórica é derivável por replay determinístico. Isso elimina uma tabela,
 * um cron e — mais importante — a classe inteira de bugs em que o snapshot
 * diverge do ledger. O custo é CPU no cliente, desprezível para a ordem de
 * grandeza de aportes de um mercado.
 */

export interface OddsStake {
  optionId: string;
  amount: number;
  createdAt: string;
}

export interface OddsOption {
  id: string;
  label: string;
}

export interface OddsPoint {
  /** Epoch em milissegundos do fim do balde. */
  t: number;
  /** Pote total acumulado até este instante. */
  totalPool: number;
  /** Pote acumulado por opção. */
  pools: Record<string, number>;
  /** Probabilidade implícita por opção (soma 1 quando há pote). */
  probabilities: Record<string, number>;
  /** Multiplicador de pagamento por moeda apostada, já líquido de taxa. */
  multipliers: Record<string, number>;
}

export interface OddsHistory {
  points: OddsPoint[];
  options: OddsOption[];
  /** Opção com maior probabilidade implícita no último ponto, se houver pote. */
  leaderId: string | null;
  /** Número de viradas de liderança ao longo da série — proxy de disputa. */
  leadChanges: number;
  finalTotalPool: number;
}

export const MAX_BUCKETS = 60;

function emptyHistory(options: OddsOption[]): OddsHistory {
  return { points: [], options, leaderId: null, leadChanges: 0, finalTotalPool: 0 };
}

/**
 * Calcula o multiplicador líquido de uma opção.
 *
 * Regra parimutuel: quem acerta divide o pote total menos a taxa da casa,
 * proporcionalmente ao que aportou. Uma opção sem aportes não tem
 * multiplicador definido (ninguém a dividiria) — devolvemos 0 em vez de
 * Infinity para não contaminar gráficos e agregações.
 */
function multiplierFor(optionPool: number, totalPool: number, rakeBps: number): number {
  if (optionPool <= 0) return 0;
  const distributable = totalPool * (1 - rakeBps / 10_000);
  return distributable / optionPool;
}

/**
 * Replay dos aportes em até `MAX_BUCKETS` baldes uniformes no tempo.
 *
 * Baldes de tamanho fixo (e não um ponto por aporte) mantêm o gráfico legível
 * e o custo previsível mesmo em mercados com milhares de aportes, preservando
 * a leitura de ritmo: baldes vazios repetem o estado anterior, então um
 * platô no gráfico significa de fato ausência de movimento.
 */
export function buildOddsHistory(
  stakes: OddsStake[],
  options: OddsOption[],
  rakeBps: number,
  maxBuckets: number = MAX_BUCKETS,
): OddsHistory {
  const validIds = new Set(options.map((o) => o.id));

  const ordered = stakes
    .filter((s) => validIds.has(s.optionId) && s.amount > 0)
    .map((s) => ({ ...s, ts: Date.parse(s.createdAt) }))
    .filter((s) => Number.isFinite(s.ts))
    .sort((a, b) => a.ts - b.ts);

  if (ordered.length === 0) return emptyHistory(options);

  const first = ordered[0].ts;
  const last = ordered[ordered.length - 1].ts;
  const span = last - first;
  const buckets = Math.max(1, Math.min(maxBuckets, ordered.length));
  const width = span > 0 ? span / buckets : 1;

  const pools: Record<string, number> = {};
  for (const option of options) pools[option.id] = 0;

  const points: OddsPoint[] = [];
  let cursor = 0;
  let total = 0;

  for (let i = 0; i < buckets; i += 1) {
    // O último balde é fechado à direita para não perder o aporte final.
    const edge = i === buckets - 1 ? last : first + width * (i + 1);

    while (cursor < ordered.length && (ordered[cursor].ts < edge || i === buckets - 1)) {
      pools[ordered[cursor].optionId] += ordered[cursor].amount;
      total += ordered[cursor].amount;
      cursor += 1;
    }

    // Baldes sem nenhum aporte até aqui não formam ponto: a série começa no
    // primeiro instante em que existe pote.
    if (total <= 0) continue;

    const probabilities: Record<string, number> = {};
    const multipliers: Record<string, number> = {};
    for (const option of options) {
      probabilities[option.id] = pools[option.id] / total;
      multipliers[option.id] = multiplierFor(pools[option.id], total, rakeBps);
    }

    points.push({
      t: Math.round(span > 0 ? edge : first),
      totalPool: total,
      pools: { ...pools },
      probabilities,
      multipliers,
    });
  }

  let leadChanges = 0;
  let previousLeader: string | null = null;
  for (const point of points) {
    const leader = leaderOf(point, options);
    if (previousLeader !== null && leader !== null && leader !== previousLeader) {
      leadChanges += 1;
    }
    if (leader !== null) previousLeader = leader;
  }

  return {
    points,
    options,
    leaderId: previousLeader,
    leadChanges,
    finalTotalPool: total,
  };
}

/**
 * Líder de um ponto. Empates são resolvidos pela ordem estável das opções,
 * garantindo que uma série idêntica produza sempre a mesma contagem de
 * viradas (caso contrário `leadChanges` viraria ruído).
 */
export function leaderOf(point: OddsPoint, options: OddsOption[]): string | null {
  let best: string | null = null;
  let bestPool = -1;
  for (const option of options) {
    const pool = point.pools[option.id] ?? 0;
    if (pool > bestPool) {
      bestPool = pool;
      best = option.id;
    }
  }
  return bestPool > 0 ? best : null;
}

/** Formata a probabilidade implícita para exibição. */
export function formatProbability(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Formata o multiplicador; opção sem aportes não tem cotação. */
export function formatMultiplier(value: number): string {
  return value <= 0 ? "—" : `${value.toFixed(2)}x`;
}