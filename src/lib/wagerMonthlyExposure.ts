/**
 * Prévia de exposição financeira agregada por mês da agenda de Perguntas do Dia.
 *
 * Objetivo: permitir que a chefia enxergue, antes do mês começar, quanto de
 * moeda pode sair do caixa gamificado (pior caso) e quanto já saiu de fato.
 *
 * Definições (deliberadamente conservadoras):
 * - `worstCase`  = soma de (teto x (multiplicador - 1)) x participantes esperados,
 *                  ou seja, o prêmio líquido pago se TODOS apostarem o teto e acertarem.
 * - `settled`    = saldo real já liquidado (`coinsDelta`), positivo = jogadores ganharam.
 * - `staked`     = moedas efetivamente arriscadas.
 * - `accuracy`   = acertos / apostas (null quando não houve apostas).
 *
 * Só perguntas ativas entram no pior caso: uma pergunta inativa não é jogável.
 */

import type { AdminWagerQuestion } from "@/services/wagerAdminService";

export interface WagerMonthExposure {
  /** Chave `YYYY-MM`, ordenável lexicograficamente. */
  month: string;
  /** Rótulo pt-BR, ex. "mar. 2026". */
  label: string;
  questions: number;
  activeQuestions: number;
  /** Pior caso de prêmio líquido (moedas) para os participantes esperados. */
  worstCase: number;
  /** Moedas efetivamente apostadas até agora. */
  staked: number;
  /** Saldo liquidado (positivo = saída de caixa). */
  settled: number;
  entries: number;
  correctEntries: number;
  /** Acurácia observada (0–1) ou null quando não há apostas. */
  accuracy: number | null;
}

export interface WagerExposureSummary {
  months: WagerMonthExposure[];
  totals: Omit<WagerMonthExposure, "month" | "label">;
  /** Mês com o maior pior caso, útil para alertas de orçamento. */
  peakMonth: WagerMonthExposure | null;
}

function safeInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Extrai `YYYY-MM` de uma data ISO; retorna null se inválida. */
export function monthKeyOf(scheduledDate: unknown): string | null {
  const raw = String(scheduledDate ?? "").trim();
  const match = /^(\d{4})-(\d{2})/.exec(raw);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${match[2]}`;
}

export function monthLabel(monthKey: string): string {
  const date = new Date(`${monthKey}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

/**
 * Prêmio líquido máximo de uma pergunta para N participantes.
 * Usa `multiplier - 1` porque a aposta em si volta para o jogador no acerto.
 */
export function questionWorstCase(
  question: Pick<AdminWagerQuestion, "maxStake" | "multiplier" | "isActive">,
  expectedPlayers: number,
): number {
  if (!question?.isActive) return 0;
  const players = Math.max(0, Math.trunc(safeNumber(expectedPlayers)));
  const stake = Math.max(0, safeInt(question.maxStake));
  const net = Math.max(0, safeNumber(question.multiplier) - 1);
  return Math.round(stake * net * players);
}

export function aggregateMonthlyExposure(
  questions: readonly AdminWagerQuestion[] | null | undefined,
  expectedPlayers: number,
): WagerExposureSummary {
  const buckets = new Map<string, WagerMonthExposure>();

  for (const question of questions ?? []) {
    if (!question) continue;
    const month = monthKeyOf(question.scheduledDate);
    if (!month) continue;

    const bucket = buckets.get(month) ?? {
      month,
      label: monthLabel(month),
      questions: 0,
      activeQuestions: 0,
      worstCase: 0,
      staked: 0,
      settled: 0,
      entries: 0,
      correctEntries: 0,
      accuracy: null,
    };

    bucket.questions += 1;
    if (question.isActive) bucket.activeQuestions += 1;
    bucket.worstCase += questionWorstCase(question, expectedPlayers);
    bucket.staked += Math.max(0, safeInt(question.totalStaked));
    bucket.settled += safeInt(question.coinsDelta);
    bucket.entries += Math.max(0, safeInt(question.totalEntries));
    bucket.correctEntries += Math.max(0, safeInt(question.correctEntries));

    buckets.set(month, bucket);
  }

  const months = [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      // Acurácia só faz sentido com apostas; evita divisão por zero.
      accuracy: bucket.entries > 0 ? bucket.correctEntries / bucket.entries : null,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totals = months.reduce(
    (acc, month) => ({
      questions: acc.questions + month.questions,
      activeQuestions: acc.activeQuestions + month.activeQuestions,
      worstCase: acc.worstCase + month.worstCase,
      staked: acc.staked + month.staked,
      settled: acc.settled + month.settled,
      entries: acc.entries + month.entries,
      correctEntries: acc.correctEntries + month.correctEntries,
      accuracy: null as number | null,
    }),
    {
      questions: 0,
      activeQuestions: 0,
      worstCase: 0,
      staked: 0,
      settled: 0,
      entries: 0,
      correctEntries: 0,
      accuracy: null as number | null,
    },
  );
  totals.accuracy = totals.entries > 0 ? totals.correctEntries / totals.entries : null;

  const peakMonth =
    months.length === 0
      ? null
      : months.reduce((best, month) => (month.worstCase > best.worstCase ? month : best), months[0]);

  return { months, totals, peakMonth };
}

/** Percentual do orçamento mensal consumido pelo pior caso (0–1, sem teto). */
export function budgetUsage(worstCase: number, monthlyBudget: number): number | null {
  const budget = safeNumber(monthlyBudget);
  if (budget <= 0) return null;
  return Math.max(0, safeNumber(worstCase)) / budget;
}
