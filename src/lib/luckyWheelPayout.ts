/**
 * Motor puro de reconciliação de payout da Roleta da Sorte.
 *
 * Responde à pergunta de governança econômica: **o que a roleta realmente
 * pagou bate com o que a calibração projetou?**
 *
 * Nenhuma função aqui toca no banco nem decide prêmio — recebe os giros já
 * lidos (`lucky_wheel_spins`) e a projeção de `projectWheel`, e devolve
 * estatísticas + anomalias. Isso permite simular centenas de cenários em
 * teste, incluindo fraude, adulteração de valores e desvio estatístico.
 */

import { projectWheel, type OddsPrize, type WheelProjection } from "./luckyWheelOdds";

export interface PayoutSpin {
  id: string;
  user_id: string;
  prize_id: string | null;
  prize_label: string;
  prize_type: string;
  amount: number;
  spin_date: string;
  created_at: string;
}

export interface PayoutTotals {
  spins: number;
  uniqueUsers: number;
  coinsPaid: number;
  xpPaid: number;
  achievements: number;
  emptySpins: number;
  /** Moedas por giro efetivamente pagas. */
  coinsPerSpin: number;
  xpPerSpin: number;
  spinsPerUser: number;
}

export type ReconciliationStatus = "ok" | "insufficient" | "watch" | "anomaly" | "unconfigured";

export interface PrizeReconciliation {
  prizeId: string | null;
  label: string;
  observed: number;
  observedShare: number;
  expectedShare: number;
  expectedCount: number;
  /** observado − esperado (em giros). */
  delta: number;
  /** Desvio padronizado binomial; 0 quando a amostra é insuficiente. */
  zScore: number;
  status: ReconciliationStatus;
  coinsPaid: number;
  xpPaid: number;
  /** Giros cujo valor pago divergiu do valor configurado do prêmio. */
  amountMismatches: number;
}

export interface DailyPayout {
  date: string;
  spins: number;
  coins: number;
  xp: number;
}

export type PayoutAlertLevel = "error" | "warning" | "info";

export interface PayoutAlert {
  level: PayoutAlertLevel;
  code: string;
  message: string;
  prizeId?: string | null;
}

export interface PayoutReport {
  totals: PayoutTotals;
  prizes: PrizeReconciliation[];
  daily: DailyPayout[];
  alerts: PayoutAlert[];
  /** Custo projetado pela calibração para a mesma quantidade de giros. */
  projectedCoins: number;
  projectedXp: number;
  /** realizado − projetado. */
  coinsDelta: number;
  xpDelta: number;
  /** realizado / projetado (0 quando não há projeção). */
  coinsRatio: number;
  /** Soma dos qui-quadrados dos setores com amostra suficiente. */
  chiSquare: number;
  /** Giros com chave de prêmio fora da configuração atual. */
  unconfiguredSpins: number;
  /** Violações de "um giro por usuário por dia" detectadas nos dados. */
  duplicateSpins: number;
}

export interface PayoutOptions {
  /** |z| a partir do qual o setor entra em observação. */
  watchZ?: number;
  /** |z| a partir do qual o setor é tratado como anomalia. */
  anomalyZ?: number;
  /** Contagem esperada mínima para o teste binomial ser confiável. */
  minExpected?: number;
  /** Desvio relativo de custo tolerado antes de alertar (0..1). */
  costTolerance?: number;
}

const DEFAULTS: Required<PayoutOptions> = {
  watchZ: 2,
  anomalyZ: 3.5,
  minExpected: 8,
  costTolerance: 0.25,
};

function safeInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function nonNegative(value: unknown): number {
  return Math.max(0, safeInt(value));
}

function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

/** Dia local do giro: usa `spin_date` (já em America/Sao_Paulo) e cai para `created_at`. */
function spinDay(spin: PayoutSpin): string {
  const raw = typeof spin.spin_date === "string" ? spin.spin_date.slice(0, 10) : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const created = typeof spin.created_at === "string" ? spin.created_at.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(created) ? created : "desconhecido";
}

/**
 * Chave de casamento entre giro e prêmio configurado. O `prize_id` é a fonte
 * primária (a FK usa ON DELETE SET NULL, então prêmios excluídos viram null);
 * quando ausente, casamos pelo rótulo normalizado — foi o que ficou gravado.
 */
function spinKey(spin: PayoutSpin): string {
  if (spin.prize_id) return `id:${spin.prize_id}`;
  const label = typeof spin.prize_label === "string" ? spin.prize_label.trim().toLocaleLowerCase() : "";
  return `label:${label}`;
}

function prizeKeys(prize: OddsPrize): string[] {
  return [`id:${prize.id}`, `label:${prize.label.trim().toLocaleLowerCase()}`];
}

export function buildPayoutReport(
  spins: readonly PayoutSpin[],
  prizes: readonly OddsPrize[],
  options: PayoutOptions = {},
): PayoutReport {
  const opts = { ...DEFAULTS, ...options };
  const projection: WheelProjection = projectWheel(prizes);
  const list = Array.isArray(spins) ? spins.filter((s): s is PayoutSpin => !!s && typeof s === "object") : [];

  // ---- Agregações base -----------------------------------------------------
  const users = new Set<string>();
  const perDay = new Map<string, DailyPayout>();
  const perKey = new Map<string, { observed: number; coins: number; xp: number; label: string; mismatches: number }>();
  const seenUserDay = new Set<string>();

  let coinsPaid = 0;
  let xpPaid = 0;
  let achievements = 0;
  let emptySpins = 0;
  let duplicateSpins = 0;

  const configuredAmount = new Map<string, number>();
  for (const prize of prizes) {
    for (const key of prizeKeys(prize)) {
      if (!configuredAmount.has(key)) configuredAmount.set(key, nonNegative(prize.amount));
    }
  }

  for (const spin of list) {
    const amount = nonNegative(spin.amount);
    const type = typeof spin.prize_type === "string" ? spin.prize_type : "nothing";
    const day = spinDay(spin);
    const key = spinKey(spin);

    if (typeof spin.user_id === "string" && spin.user_id) {
      users.add(spin.user_id);
      const userDay = `${spin.user_id}|${day}`;
      if (seenUserDay.has(userDay)) duplicateSpins += 1;
      else seenUserDay.add(userDay);
    }

    let dayCoins = 0;
    let dayXp = 0;
    if (type === "coins" && amount > 0) {
      coinsPaid += amount;
      dayCoins = amount;
    } else if (type === "xp" && amount > 0) {
      xpPaid += amount;
      dayXp = amount;
    } else if (type === "achievement") {
      achievements += 1;
    } else {
      emptySpins += 1;
    }

    const dayEntry = perDay.get(day) ?? { date: day, spins: 0, coins: 0, xp: 0 };
    dayEntry.spins += 1;
    dayEntry.coins += dayCoins;
    dayEntry.xp += dayXp;
    perDay.set(day, dayEntry);

    const label = (typeof spin.prize_label === "string" && spin.prize_label.trim()) || "Sem rótulo";
    const entry = perKey.get(key) ?? { observed: 0, coins: 0, xp: 0, label, mismatches: 0 };
    entry.observed += 1;
    entry.coins += dayCoins;
    entry.xp += dayXp;
    const expectedAmount = configuredAmount.get(key);
    if (expectedAmount !== undefined && expectedAmount !== amount) entry.mismatches += 1;
    perKey.set(key, entry);
  }

  const totalSpins = list.length;

  // ---- Reconciliação por setor --------------------------------------------
  const results: PrizeReconciliation[] = [];
  const consumed = new Set<string>();

  for (const odd of projection.odds) {
    const idKey = `id:${odd.id}`;
    const labelKey = `label:${odd.label.trim().toLocaleLowerCase()}`;
    const byId = perKey.get(idKey);
    const byLabel = consumed.has(labelKey) ? undefined : perKey.get(labelKey);
    consumed.add(idKey);
    if (byLabel) consumed.add(labelKey);

    const observed = (byId?.observed ?? 0) + (byLabel?.observed ?? 0);
    const coins = (byId?.coins ?? 0) + (byLabel?.coins ?? 0);
    const xp = (byId?.xp ?? 0) + (byLabel?.xp ?? 0);
    const mismatches = (byId?.mismatches ?? 0) + (byLabel?.mismatches ?? 0);

    const p = Math.min(1, Math.max(0, odd.probability));
    const expectedCount = totalSpins * p;
    const variance = totalSpins * p * (1 - p);
    const zScore = variance > 0 ? (observed - expectedCount) / Math.sqrt(variance) : 0;

    let status: ReconciliationStatus;
    if (expectedCount < opts.minExpected) status = "insufficient";
    else if (Math.abs(zScore) >= opts.anomalyZ) status = "anomaly";
    else if (Math.abs(zScore) >= opts.watchZ) status = "watch";
    else status = "ok";

    results.push({
      prizeId: odd.id,
      label: odd.label,
      observed,
      observedShare: safeDivide(observed, totalSpins),
      expectedShare: p,
      expectedCount,
      delta: observed - expectedCount,
      zScore: Number.isFinite(zScore) ? zScore : 0,
      status,
      coinsPaid: coins,
      xpPaid: xp,
      amountMismatches: mismatches,
    });
  }

  // ---- Giros fora da configuração atual (prêmio removido/desativado) -------
  let unconfiguredSpins = 0;
  for (const [key, entry] of perKey) {
    if (consumed.has(key)) continue;
    unconfiguredSpins += entry.observed;
    results.push({
      prizeId: key.startsWith("id:") ? key.slice(3) : null,
      label: entry.label,
      observed: entry.observed,
      observedShare: safeDivide(entry.observed, totalSpins),
      expectedShare: 0,
      expectedCount: 0,
      delta: entry.observed,
      zScore: 0,
      status: "unconfigured",
      coinsPaid: entry.coins,
      xpPaid: entry.xp,
      amountMismatches: entry.mismatches,
    });
  }

  results.sort((a, b) => b.observed - a.observed || a.label.localeCompare(b.label, "pt-BR"));

  const chiSquare = results.reduce((sum, r) => {
    if (r.status === "insufficient" || r.status === "unconfigured" || r.expectedCount <= 0) return sum;
    return sum + (r.delta * r.delta) / r.expectedCount;
  }, 0);

  const projectedCoins = totalSpins * projection.expectedCoinsPerSpin;
  const projectedXp = totalSpins * projection.expectedXpPerSpin;

  const totals: PayoutTotals = {
    spins: totalSpins,
    uniqueUsers: users.size,
    coinsPaid,
    xpPaid,
    achievements,
    emptySpins,
    coinsPerSpin: safeDivide(coinsPaid, totalSpins),
    xpPerSpin: safeDivide(xpPaid, totalSpins),
    spinsPerUser: safeDivide(totalSpins, users.size),
  };

  const daily = [...perDay.values()].sort((a, b) => a.date.localeCompare(b.date));

  // ---- Alertas de governança ----------------------------------------------
  const alerts: PayoutAlert[] = [];

  if (totalSpins === 0) {
    alerts.push({
      level: "info",
      code: "no_spins",
      message: "Nenhum giro no período selecionado: não há payout para reconciliar.",
    });
  }

  if (duplicateSpins > 0) {
    alerts.push({
      level: "error",
      code: "duplicate_spins",
      message: `${duplicateSpins} giro(s) além do limite de um por usuário por dia. Investigue a integridade do índice único.`,
    });
  }

  const totalMismatches = results.reduce((sum, r) => sum + r.amountMismatches, 0);
  if (totalMismatches > 0) {
    alerts.push({
      level: "error",
      code: "amount_mismatch",
      message: `${totalMismatches} giro(s) pagaram valor diferente do configurado no prêmio. Pode indicar recalibração no meio do período ou adulteração.`,
    });
  }

  if (unconfiguredSpins > 0) {
    alerts.push({
      level: "warning",
      code: "unconfigured_prizes",
      message: `${unconfiguredSpins} giro(s) referenciam prêmios que não existem mais na calibração atual.`,
    });
  }

  for (const r of results) {
    if (r.status === "anomaly") {
      alerts.push({
        level: "warning",
        code: "distribution_drift",
        prizeId: r.prizeId,
        message: `"${r.label}" saiu ${r.observed} vez(es) contra ${r.expectedCount.toFixed(1)} esperada(s) (z = ${r.zScore.toFixed(2)}).`,
      });
    }
  }

  if (projectedCoins > 0) {
    const drift = Math.abs(coinsPaid - projectedCoins) / projectedCoins;
    if (drift > opts.costTolerance) {
      alerts.push({
        level: coinsPaid > projectedCoins ? "warning" : "info",
        code: "cost_drift",
        message: `Moedas pagas (${coinsPaid}) desviam ${(drift * 100).toFixed(1)}% da projeção (${Math.round(projectedCoins)}).`,
      });
    }
  } else if (coinsPaid > 0) {
    alerts.push({
      level: "warning",
      code: "unprojected_cost",
      message: `A calibração atual projeta zero moedas, mas ${coinsPaid} moeda(s) foram pagas no período.`,
    });
  }

  return {
    totals,
    prizes: results,
    daily,
    alerts,
    projectedCoins,
    projectedXp,
    coinsDelta: coinsPaid - projectedCoins,
    xpDelta: xpPaid - projectedXp,
    coinsRatio: safeDivide(coinsPaid, projectedCoins),
    chiSquare,
    unconfiguredSpins,
    duplicateSpins,
  };
}

/** Nível agregado do relatório, para o selo de saúde econômica no painel. */
export function payoutSeverity(report: PayoutReport): PayoutAlertLevel | "ok" {
  if (report.alerts.some((a) => a.level === "error")) return "error";
  if (report.alerts.some((a) => a.level === "warning")) return "warning";
  if (report.alerts.some((a) => a.level === "info")) return "info";
  return "ok";
}

// ---------------------------------------------------------------------------
// Exportação auditável (CSV)
// ---------------------------------------------------------------------------

const STATUS_PT: Record<ReconciliationStatus, string> = {
  ok: "Dentro do esperado",
  watch: "Em observação",
  anomaly: "Anomalia",
  insufficient: "Amostra insuficiente",
  unconfigured: "Fora da calibração",
};

const LEVEL_PT: Record<PayoutAlertLevel, string> = {
  error: "Erro",
  warning: "Atenção",
  info: "Informação",
};

/**
 * Neutraliza injeção de fórmula em planilhas (CSV injection). Rótulos de
 * prêmio são texto livre digitado por administradores: um rótulo começando
 * com `=`, `+`, `-`, `@`, TAB ou CR viraria fórmula executável no Excel/Sheets.
 */
function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "number" && !Number.isFinite(value) ? "" : String(value);
  return /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
}

function escapeCell(value: unknown): string {
  const s = sanitizeCell(value);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvLine(cells: readonly unknown[]): string {
  return cells.map(escapeCell).join(",");
}

function num(value: number, decimals = 0): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : "0";
}

export interface PayoutCsvMeta {
  /** Rótulo do período analisado (ex.: "Últimos 30 dias"). */
  periodLabel?: string;
  /** Momento da geração (ISO). Injetável para tornar o teste determinístico. */
  generatedAt?: string;
}

/**
 * Relatório de payout em CSV, em quatro seções (resumo, setores, série diária,
 * alertas). O separador é vírgula e o arquivo é escrito com BOM por
 * `downloadCSV`, então o Excel pt-BR abre acentuação corretamente.
 */
export function buildPayoutCsv(report: PayoutReport, meta: PayoutCsvMeta = {}): string {
  const generatedAt = meta.generatedAt ?? new Date().toISOString();
  const lines: string[] = [];

  lines.push(csvLine(["Relatório de reconciliação — Roleta da Sorte"]));
  lines.push(csvLine(["Período", meta.periodLabel ?? "não informado"]));
  lines.push(csvLine(["Gerado em", generatedAt]));
  lines.push("");

  lines.push(csvLine(["Indicador", "Valor"]));
  lines.push(csvLine(["Giros", report.totals.spins]));
  lines.push(csvLine(["Participantes únicos", report.totals.uniqueUsers]));
  lines.push(csvLine(["Giros por participante", num(report.totals.spinsPerUser, 4)]));
  lines.push(csvLine(["Moedas pagas", report.totals.coinsPaid]));
  lines.push(csvLine(["Moedas projetadas", num(report.projectedCoins, 2)]));
  lines.push(csvLine(["Desvio de moedas", num(report.coinsDelta, 2)]));
  lines.push(csvLine(["XP pago", report.totals.xpPaid]));
  lines.push(csvLine(["XP projetado", num(report.projectedXp, 2)]));
  lines.push(csvLine(["Giros sem prêmio", report.totals.emptySpins]));
  lines.push(csvLine(["Conquistas concedidas", report.totals.achievements]));
  lines.push(csvLine(["Qui-quadrado", num(report.chiSquare, 4)]));
  lines.push(csvLine(["Giros fora da calibração", report.unconfiguredSpins]));
  lines.push(csvLine(["Giros duplicados", report.duplicateSpins]));
  lines.push("");

  lines.push(
    csvLine([
      "Setor",
      "ID do prêmio",
      "Observado",
      "Esperado",
      "Share observado",
      "Share esperado",
      "Delta",
      "Z-score",
      "Situação",
      "Moedas pagas",
      "XP pago",
      "Divergências de valor",
    ]),
  );
  for (const row of report.prizes) {
    lines.push(
      csvLine([
        row.label,
        row.prizeId ?? "",
        row.observed,
        num(row.expectedCount, 4),
        num(row.observedShare, 6),
        num(row.expectedShare, 6),
        num(row.delta, 4),
        num(row.zScore, 4),
        STATUS_PT[row.status],
        row.coinsPaid,
        row.xpPaid,
        row.amountMismatches,
      ]),
    );
  }
  lines.push("");

  lines.push(csvLine(["Dia", "Giros", "Moedas", "XP"]));
  for (const day of report.daily) {
    lines.push(csvLine([day.date, day.spins, day.coins, day.xp]));
  }
  lines.push("");

  lines.push(csvLine(["Nível", "Código", "Mensagem"]));
  for (const alert of report.alerts) {
    lines.push(csvLine([LEVEL_PT[alert.level] ?? alert.level, alert.code, alert.message]));
  }

  return lines.join("\n");
}

/** Nome de arquivo determinístico e seguro para o sistema de arquivos. */
export function payoutCsvFilename(days: number, generatedAt = new Date()): string {
  const safeDays = Number.isFinite(days) ? Math.max(1, Math.floor(days)) : 30;
  const stamp = Number.isNaN(generatedAt.getTime())
    ? "sem-data"
    : generatedAt.toISOString().slice(0, 10);
  return `roleta-payout-${safeDays}d-${stamp}.csv`;
}