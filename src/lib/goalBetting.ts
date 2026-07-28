/**
 * Motor puro da "Aposta de Meta".
 *
 * Converte uma campanha de vendas e seus participantes em um rascunho de
 * mercado de previsão válido (`PredictionDraft`), sem tocar em rede ou banco.
 * Toda decisão econômica continua no servidor (`create_prediction_market`,
 * `place_prediction_stake`, `settle_prediction_market`); aqui apenas
 * garantimos que a UI nunca proponha algo que o banco recusaria.
 *
 * Invariantes cobertas por src/test/goalBetting.test.ts:
 *   B1. O rótulo de cada opção é único e nunca vazio.
 *   B2. O total de opções respeita MIN_OPTIONS..MAX_OPTIONS do motor de admin.
 *   B3. O travamento fica sempre dentro da janela aceita pelo servidor.
 *   B4. As probabilidades implícitas somam 1 (ou 0 quando não há sinal).
 */

import {
  MAX_OPTIONS,
  MAX_OPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_WINDOW_MS,
  MIN_OPTIONS,
  MIN_WINDOW_MS,
  type PredictionDraft,
} from "./predictionAdmin";

/** Participante elegível a virar opção de aposta. */
export interface GoalBetCandidate {
  userId: string;
  name: string | null;
  /** Progresso absoluto na métrica da campanha. */
  progress: number;
  /** Meta individual ajustada; 0 quando não definida. */
  target: number;
  /** Percentual já consolidado pela campanha (0-100+). */
  progressPercent: number;
  declined?: boolean;
}

export interface GoalBetCampaign {
  id: string;
  name: string;
  metricUnit?: string | null;
  /** Data final da campanha (YYYY-MM-DD ou ISO completo). */
  endDate: string;
}

export interface GoalBetDraftInput {
  campaign: GoalBetCampaign;
  candidates: GoalBetCandidate[];
  minStake: number;
  maxStakePerUser: number;
  rakeBps: number;
  locksAt: string;
  /** Acrescenta a opção "Ninguém bate a meta" — evita mercado sem saída. */
  includeNoWinner: boolean;
}

/** Opções reservadas para candidatos, deixando espaço para o "ninguém". */
export const MAX_GOAL_BET_CANDIDATES = MAX_OPTIONS - 1;
export const NO_WINNER_LABEL = "Ninguém bate a meta";
/** Trava um dia antes do encerramento: aposta em jogo já decidido é ruído. */
export const LOCK_BUFFER_MS = 24 * 60 * 60 * 1000;

function safeName(candidate: GoalBetCandidate, index: number): string {
  const name = (candidate.name ?? "").trim();
  return name.length > 0 ? name : `Participante ${index + 1}`;
}

/**
 * Ordena por percentual de meta, depois progresso absoluto e nome — determinístico
 * para que duas renderizações do mesmo dado gerem exatamente as mesmas opções.
 */
export function rankGoalBetCandidates(
  candidates: readonly GoalBetCandidate[],
): GoalBetCandidate[] {
  return [...candidates]
    .filter((c) => !c.declined)
    .sort((a, b) => {
      if (b.progressPercent !== a.progressPercent) {
        return b.progressPercent - a.progressPercent;
      }
      if (b.progress !== a.progress) return b.progress - a.progress;
      return (a.name ?? "").localeCompare(b.name ?? "", "pt-BR");
    });
}

/**
 * Rótulos únicos e dentro do limite de tamanho. Homônimos recebem sufixo
 * numérico em vez de serem descartados pela deduplicação do servidor.
 */
export function buildOptionLabels(candidates: readonly GoalBetCandidate[]): string[] {
  const used = new Set<string>();
  return candidates.map((candidate, index) => {
    const base = safeName(candidate, index).slice(0, MAX_OPTION_LENGTH);
    if (!used.has(base)) {
      used.add(base);
      return base;
    }
    let suffix = 2;
    let label = "";
    do {
      const tag = ` (${suffix})`;
      label = `${base.slice(0, MAX_OPTION_LENGTH - tag.length)}${tag}`;
      suffix += 1;
    } while (used.has(label));
    used.add(label);
    return label;
  });
}

/**
 * Sugere o travamento: um dia antes do fim da campanha, sempre dentro da
 * janela que o servidor aceita (>= 15 min e <= 60 dias a partir de agora).
 */
export function suggestGoalBetLocksAt(campaign: GoalBetCampaign, now: number): string {
  const parsed = new Date(
    campaign.endDate.length === 10 ? `${campaign.endDate}T23:59:00` : campaign.endDate,
  ).getTime();
  const fallback = now + 7 * 24 * 60 * 60 * 1000;
  const target = Number.isFinite(parsed) ? parsed - LOCK_BUFFER_MS : fallback;
  const min = now + MIN_WINDOW_MS + 60_000;
  const max = now + MAX_WINDOW_MS - 60_000;
  return new Date(Math.min(Math.max(target, min), max)).toISOString();
}

/** Probabilidade implícita pelo progresso relativo — só informativa na UI. */
export function impliedProbabilities(
  candidates: readonly GoalBetCandidate[],
): Record<string, number> {
  const weights = candidates.map((c) => Math.max(c.progressPercent, 0));
  const total = weights.reduce((acc, value) => acc + value, 0);
  const result: Record<string, number> = {};
  candidates.forEach((candidate, index) => {
    result[candidate.userId] = total > 0 ? weights[index] / total : 0;
  });
  return result;
}

export function goalBetTitle(campaign: GoalBetCampaign): string {
  return `Quem bate a meta da campanha "${campaign.name}"?`.slice(0, MAX_TITLE_LENGTH);
}

function goalBetDescription(campaign: GoalBetCampaign, count: number): string {
  const unit = (campaign.metricUnit ?? "").trim();
  const metric = unit.length > 0 ? ` Métrica: ${unit}.` : "";
  return (
    `Aposta de Meta vinculada à campanha "${campaign.name}".${metric} ` +
    `${count} participante(s) concorrendo. O pote é dividido entre quem acertar, ` +
    `proporcional ao aporte; sem vencedores, todos são reembolsados.`
  );
}

export type GoalBetBuildError =
  | "no_candidates"
  | "too_few_options"
  | "too_many_candidates";

export interface GoalBetBuildResult {
  ok: boolean;
  error?: GoalBetBuildError;
  draft?: PredictionDraft;
}

/** Monta o rascunho final. Falha explícita em vez de rascunho inválido. */
export function buildGoalBetDraft(input: GoalBetDraftInput): GoalBetBuildResult {
  const ranked = rankGoalBetCandidates(input.candidates);
  if (ranked.length === 0) return { ok: false, error: "no_candidates" };
  if (ranked.length > MAX_GOAL_BET_CANDIDATES && !input.includeNoWinner) {
    if (ranked.length > MAX_OPTIONS) return { ok: false, error: "too_many_candidates" };
  } else if (ranked.length > MAX_GOAL_BET_CANDIDATES) {
    return { ok: false, error: "too_many_candidates" };
  }

  const options = buildOptionLabels(ranked);
  if (input.includeNoWinner) options.push(NO_WINNER_LABEL);
  if (options.length < MIN_OPTIONS) return { ok: false, error: "too_few_options" };

  return {
    ok: true,
    draft: {
      title: goalBetTitle(input.campaign),
      description: goalBetDescription(input.campaign, ranked.length),
      options,
      minStake: input.minStake,
      maxStakePerUser: input.maxStakePerUser,
      rakeBps: input.rakeBps,
      locksAt: input.locksAt,
    },
  };
}

export const GOAL_BET_ERROR_MESSAGES: Record<GoalBetBuildError, string> = {
  no_candidates: "Selecione ao menos um participante da campanha.",
  too_few_options: "A aposta precisa de ao menos 2 opções.",
  too_many_candidates: `Selecione no máximo ${MAX_GOAL_BET_CANDIDATES} participantes.`,
};