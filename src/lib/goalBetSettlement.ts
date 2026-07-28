/**
 * Motor puro de apuração da "Aposta de Meta".
 *
 * Dado o placar final de uma campanha e as opções de um mercado, decide qual
 * opção deveria vencer — ou por que a decisão precisa de intervenção humana.
 * Nada aqui credita moedas: a apuração real continua na RPC
 * `settle_prediction_market`. Este módulo apenas evita que um administrador
 * apure no escuro (empate, participante fora das opções, homônimos).
 *
 * Invariantes cobertas por src/test/goalBetSettlement.test.ts:
 *   S1. Ninguém bateu a meta => opção "ninguém" quando existe, senão reembolso.
 *   S2. Empate no topo nunca sugere vencedor automático.
 *   S3. Vencedor sem opção correspondente nunca é convertido em outra opção.
 *   S4. A sugestão é determinística para a mesma entrada.
 */

import { NO_WINNER_LABEL, type GoalBetCandidate } from "./goalBetting";

/** Percentual a partir do qual a meta é considerada batida. */
export const GOAL_ACHIEVED_PERCENT = 100;

export interface GoalBetOption {
  id: string;
  label: string;
}

export type GoalBetOutcomeKind =
  | "winner"
  | "no_winner_option"
  | "refund"
  | "tie"
  | "unmatched_winner"
  | "ambiguous_label";

export interface GoalBetOutcome {
  kind: GoalBetOutcomeKind;
  /** Opção sugerida; `null` significa reembolsar todos. */
  optionId: string | null;
  /** `true` quando a sugestão pode ser aplicada sem revisão manual. */
  autoApplicable: boolean;
  message: string;
  /** Quem atingiu a meta, ordenado do melhor para o pior. */
  achievers: GoalBetCandidate[];
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function displayName(candidate: GoalBetCandidate): string {
  return (candidate.name ?? "").trim();
}

/**
 * Extrai o nome da campanha do título gerado por `goalBetTitle`.
 * Retorna `null` para mercados que não nasceram de uma Aposta de Meta.
 */
export function extractGoalBetCampaignName(title: string): string | null {
  const match = /^Quem bate a meta da campanha "(.+)"\?$/.exec(title.trim());
  const name = match?.[1]?.trim();
  return name && name.length > 0 ? name : null;
}

/** Ordena os que bateram a meta: percentual, progresso absoluto e nome. */
function rankAchievers(candidates: readonly GoalBetCandidate[]): GoalBetCandidate[] {
  return candidates
    .filter((c) => !c.declined && c.progressPercent >= GOAL_ACHIEVED_PERCENT)
    .sort((a, b) => {
      if (b.progressPercent !== a.progressPercent) {
        return b.progressPercent - a.progressPercent;
      }
      if (b.progress !== a.progress) return b.progress - a.progress;
      return displayName(a).localeCompare(displayName(b), "pt-BR");
    });
}

export interface ResolveGoalBetInput {
  options: readonly GoalBetOption[];
  candidates: readonly GoalBetCandidate[];
}

/**
 * Resolve o desfecho sugerido. Toda dúvida vira `autoApplicable: false` —
 * preferimos travar a automação a pagar o vencedor errado.
 */
export function resolveGoalBetOutcome({
  options,
  candidates,
}: ResolveGoalBetInput): GoalBetOutcome {
  const achievers = rankAchievers(candidates);
  const noWinnerOption = options.find(
    (o) => normalizeLabel(o.label) === normalizeLabel(NO_WINNER_LABEL),
  );

  if (achievers.length === 0) {
    if (noWinnerOption) {
      return {
        kind: "no_winner_option",
        optionId: noWinnerOption.id,
        autoApplicable: true,
        message: `Ninguém atingiu ${GOAL_ACHIEVED_PERCENT}% da meta — vence “${NO_WINNER_LABEL}”.`,
        achievers,
      };
    }
    return {
      kind: "refund",
      optionId: null,
      autoApplicable: true,
      message: "Ninguém bateu a meta e o mercado não tem a opção “ninguém”: devolver todos os aportes.",
      achievers,
    };
  }

  const top = achievers[0];
  const tied = achievers.filter(
    (c) => c.progressPercent === top.progressPercent && c.progress === top.progress,
  );
  if (tied.length > 1) {
    return {
      kind: "tie",
      optionId: null,
      autoApplicable: false,
      message: `Empate técnico entre ${tied
        .map((c) => displayName(c) || "participante sem nome")
        .join(", ")}. Escolha manualmente ou devolva os aportes.`,
      achievers,
    };
  }

  const topLabel = normalizeLabel(displayName(top));
  if (topLabel.length === 0) {
    return {
      kind: "unmatched_winner",
      optionId: null,
      autoApplicable: false,
      message: "O líder não tem nome cadastrado; confirme manualmente a opção vencedora.",
      achievers,
    };
  }

  // `buildOptionLabels` trunca nomes longos e sufixa homônimos: casamos por
  // prefixo normalizado, mas recusamos qualquer ambiguidade.
  const matches = options.filter((o) => {
    const label = normalizeLabel(o.label);
    return label === topLabel || topLabel.startsWith(label) || label.startsWith(topLabel);
  });

  if (matches.length === 0) {
    return {
      kind: "unmatched_winner",
      optionId: null,
      autoApplicable: false,
      message: `${displayName(top)} bateu a meta, mas não era uma opção do mercado. Considere devolver os aportes.`,
      achievers,
    };
  }
  if (matches.length > 1) {
    return {
      kind: "ambiguous_label",
      optionId: null,
      autoApplicable: false,
      message: `Mais de uma opção corresponde a “${displayName(top)}”. Selecione manualmente o vencedor.`,
      achievers,
    };
  }

  return {
    kind: "winner",
    optionId: matches[0].id,
    autoApplicable: true,
    message: `${displayName(top)} atingiu ${Math.round(top.progressPercent)}% da meta — vence “${matches[0].label}”.`,
    achievers,
  };
}