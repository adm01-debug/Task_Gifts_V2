/**
 * Ranking de acertadores ("Oráculo") dos mercados de previsão.
 *
 * PROBLEMA CENTRAL: taxa de acerto bruta é trivialmente gamificável. Quem
 * aposta sempre na opção favorita (probabilidade implícita 0,95) acerta 95%
 * das vezes e não demonstrou conhecimento algum — apenas copiou o consenso.
 * Um ranking assim premia conformismo e mata a função de descoberta de
 * informação do mercado.
 *
 * SOLUÇÃO: pontuamos o *edge* sobre o consenso. No instante do aporte o
 * mercado publica uma probabilidade implícita `p` para a opção escolhida.
 * O acerto vale `1 - p` (quanto mais improvável, mais mérito) e o erro custa
 * `0 - p = -p` (errar no favorito dói pouco; errar no azarão dói pouco também,
 * pois pouco se afirmou). Essa é a regra de pontuação linear, própria: a
 * estratégia que maximiza o valor esperado é reportar a crença sincera.
 *
 * Acertar o consenso rende quase zero. Acertar contra o consenso rende muito.
 * Exatamente o incentivo que queremos.
 */

/** Aporte já resolvido, com a foto do mercado no instante em que foi feito. */
export interface OracleStake {
  userId: string;
  marketId: string;
  optionId: string;
  /** Moedas apostadas. Serve de peso: convicção custa caro. */
  amount: number;
  /**
   * Probabilidade implícita da opção escolhida ANTES deste aporte entrar no
   * pote. Usar o estado pós-aporte deixaria o próprio apostador mover o
   * placar contra si mesmo.
   */
  impliedProbability: number;
  /** Opção efetivamente vencedora do mercado já apurado. */
  winningOptionId: string;
  /** Retorno recebido, para o extrato econômico. */
  payout: number;
}

export interface OracleEntry {
  userId: string;
  /** Mercados distintos em que participou. */
  markets: number;
  stakes: number;
  totalStaked: number;
  totalPayout: number;
  /** Saldo econômico: positivo significa que o usuário lucrou. */
  netCoins: number;
  hits: number;
  /** Taxa de acerto bruta — exibida por transparência, nunca usada no ranking. */
  hitRate: number;
  /** Edge acumulado ponderado por moedas. Positivo = bateu o consenso. */
  edge: number;
  /**
   * Pontuação final em (-1, 1), encolhida em direção a zero conforme o volume
   * apostado. Poucas moedas apostadas nunca produzem pontuação extrema.
   */
  score: number;
  /** Brier score médio ponderado: 0 é previsão perfeita, 1 é o pior caso. */
  brier: number;
  tier: OracleTier;
  rank: number;
}

export type OracleTier = "oracle" | "analyst" | "apprentice" | "contrarian";

export interface OracleOptions {
  /**
   * Peso do prior de encolhimento, em moedas. Um usuário precisa movimentar
   * volume nessa ordem de grandeza para a pontuação se aproximar do edge real.
   * Empiricamente calibrado: alto demais congela o ranking, baixo demais deixa
   * um único acerto sortudo liderar.
   */
  shrinkageCoins?: number;
  /** Mercados distintos mínimos para figurar no ranking. */
  minMarkets?: number;
}

export const DEFAULT_SHRINKAGE_COINS = 500;
export const DEFAULT_MIN_MARKETS = 3;

/**
 * Casas decimais preservadas nas métricas derivadas.
 *
 * Soma de ponto flutuante não é associativa: `(a+b)+c` pode diferir de
 * `a+(b+c)` no último bit. Sem arredondar, dois recálculos do MESMO ledger
 * lido em ordens diferentes gerariam pontuações distintas — e um ranking que
 * não pode ser reproduzido não pode ser auditado nem contestado.
 */
const PRECISION = 1e9;

function stabilize(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * PRECISION) / PRECISION;
}

/** Mantém a probabilidade em um intervalo utilizável, tolerando lixo do banco. */
function sanitizeProbability(p: number): number {
  if (!Number.isFinite(p)) return 0.5;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return p;
}

/**
 * Ordem canônica de acumulação.
 *
 * Complementa o arredondamento: garante que o somatório percorra sempre a
 * mesma sequência, independentemente da ordem em que o banco devolveu as
 * linhas (que não é estável sem ORDER BY explícito).
 */
function canonicalOrder(a: OracleStake, b: OracleStake): number {
  if (a.userId !== b.userId) return a.userId < b.userId ? -1 : 1;
  if (a.marketId !== b.marketId) return a.marketId < b.marketId ? -1 : 1;
  if (a.optionId !== b.optionId) return a.optionId < b.optionId ? -1 : 1;
  if (a.amount !== b.amount) return a.amount - b.amount;
  return (a.impliedProbability || 0) - (b.impliedProbability || 0);
}

/**
 * Faixa de reconhecimento.
 *
 * "Contrarian" não é punição: marca quem aposta sistematicamente contra o
 * consenso e erra. É informação útil — e frequentemente vira Oráculo depois.
 */
export function tierOf(score: number): OracleTier {
  if (score >= 0.15) return "oracle";
  if (score >= 0.05) return "analyst";
  if (score >= -0.05) return "apprentice";
  return "contrarian";
}

export const TIER_LABEL: Record<OracleTier, string> = {
  oracle: "Oráculo",
  analyst: "Analista",
  apprentice: "Aprendiz",
  contrarian: "Contrarian",
};

interface Accumulator {
  userId: string;
  markets: Set<string>;
  stakes: number;
  totalStaked: number;
  totalPayout: number;
  hits: number;
  weightedEdge: number;
  weightedBrier: number;
}

/**
 * Constrói o ranking a partir do ledger de aportes de mercados já apurados.
 *
 * A função é pura e determinística: a mesma entrada, em qualquer ordem,
 * produz exatamente a mesma saída. Isso é o que torna o ranking auditável —
 * qualquer pessoa pode recalcular e conferir.
 */
export function buildOracleRanking(
  stakes: OracleStake[],
  options: OracleOptions = {},
): OracleEntry[] {
  const shrinkage = Math.max(0, options.shrinkageCoins ?? DEFAULT_SHRINKAGE_COINS);
  const minMarkets = Math.max(1, options.minMarkets ?? DEFAULT_MIN_MARKETS);

  const byUser = new Map<string, Accumulator>();

  for (const stake of [...stakes].sort(canonicalOrder)) {
    // Aporte sem valor não carrega informação e distorceria as médias.
    if (!stake.userId || !stake.marketId || !(stake.amount > 0)) continue;
    if (!Number.isFinite(stake.amount)) continue;

    let acc = byUser.get(stake.userId);
    if (!acc) {
      acc = {
        userId: stake.userId,
        markets: new Set(),
        stakes: 0,
        totalStaked: 0,
        totalPayout: 0,
        hits: 0,
        weightedEdge: 0,
        weightedBrier: 0,
      };
      byUser.set(stake.userId, acc);
    }

    const p = sanitizeProbability(stake.impliedProbability);
    const won = stake.optionId === stake.winningOptionId;
    const outcome = won ? 1 : 0;

    acc.markets.add(stake.marketId);
    acc.stakes += 1;
    acc.totalStaked += stake.amount;
    acc.totalPayout += Number.isFinite(stake.payout) ? Math.max(0, stake.payout) : 0;
    if (won) acc.hits += 1;

    // Regra de pontuação própria, ponderada pelas moedas arriscadas.
    acc.weightedEdge += (outcome - p) * stake.amount;
    acc.weightedBrier += (outcome - p) ** 2 * stake.amount;
  }

  const entries: OracleEntry[] = [];

  for (const acc of byUser.values()) {
    if (acc.markets.size < minMarkets) continue;
    if (acc.totalStaked <= 0) continue;

    // Encolhimento empírico-bayesiano: o denominador cresce com o prior, então
    // volume baixo puxa a pontuação para zero em vez de para os extremos.
    const score = stabilize(acc.weightedEdge / (acc.totalStaked + shrinkage));

    entries.push({
      userId: acc.userId,
      markets: acc.markets.size,
      stakes: acc.stakes,
      totalStaked: acc.totalStaked,
      totalPayout: acc.totalPayout,
      netCoins: acc.totalPayout - acc.totalStaked,
      hits: acc.hits,
      hitRate: acc.hits / acc.stakes,
      edge: stabilize(acc.weightedEdge / acc.totalStaked),
      score,
      brier: stabilize(acc.weightedBrier / acc.totalStaked),
      tier: tierOf(score),
      rank: 0,
    });
  }

  // Ordenação total e determinística: sem o desempate por userId, dois
  // usuários empatados trocariam de posição a cada recálculo.
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.netCoins !== a.netCoins) return b.netCoins - a.netCoins;
    if (b.totalStaked !== a.totalStaked) return b.totalStaked - a.totalStaked;
    return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  });

  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}

/** Formata a pontuação como pontos inteiros, mais legível que decimais. */
export function formatOracleScore(score: number): string {
  return `${score >= 0 ? "+" : ""}${Math.round(score * 1000)}`;
}