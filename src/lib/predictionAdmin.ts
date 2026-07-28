/**
 * Motor puro de governança do Mercado de Previsões.
 *
 * Espelha no cliente as regras que o servidor aplica nas RPCs
 * (`create_prediction_market`, `lock_prediction_market`,
 * `void_prediction_market`, `settle_prediction_market`).
 * Nenhuma decisão econômica acontece aqui: o objetivo é impedir que a UI
 * ofereça uma ação que o banco recusaria e antecipar gaps operacionais
 * (mercados travados sem apuração, janelas curtas demais, rake abusivo).
 *
 * Invariantes validadas em src/test/predictionAdmin.simulation.test.ts:
 *   G1. Estado terminal (`settled`/`voided`) nunca aceita nova ação.
 *   G2. `settle` só é possível com o mercado travado (ou vencido no tempo).
 *   G3. Rascunho sem 2 opções distintas jamais é publicável.
 *   G4. Resumo administrativo conta cada mercado exatamente uma vez.
 */

export type PredictionAdminStatus =
  | "draft"
  | "open"
  | "locked"
  | "settled"
  | "voided";

export interface PredictionDraft {
  title: string;
  description?: string | null;
  options: string[];
  minStake: number;
  maxStakePerUser: number;
  rakeBps: number;
  locksAt: string;
  resolvesAt?: string | null;
}

export type IssueLevel = "error" | "warning";

export interface DraftIssue {
  field: keyof PredictionDraft | "window";
  level: IssueLevel;
  message: string;
}

export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 140;
export const MAX_DESCRIPTION_LENGTH = 800;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
export const MAX_OPTION_LENGTH = 60;
/** Abaixo disso o mercado trava antes de formar liquidez. */
export const MIN_WINDOW_MS = 15 * 60 * 1000;
/** Acima disso as moedas ficam imobilizadas tempo demais. */
export const MAX_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
export const MAX_RAKE_BPS = 2_000;

function parseTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function normalizeOptions(options: readonly string[]): string[] {
  return options.map((o) => o.trim()).filter((o) => o.length > 0);
}

/** Valida um rascunho. Sem `error` na lista, a criação é segura. */
export function validatePredictionDraft(draft: PredictionDraft, now: number): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const title = draft.title.trim();

  if (title.length < MIN_TITLE_LENGTH) {
    issues.push({ field: "title", level: "error", message: `Informe uma pergunta com ao menos ${MIN_TITLE_LENGTH} caracteres.` });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    issues.push({ field: "title", level: "error", message: `A pergunta deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
  }
  if ((draft.description ?? "").length > MAX_DESCRIPTION_LENGTH) {
    issues.push({ field: "description", level: "error", message: `A descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres.` });
  }

  const options = normalizeOptions(draft.options);
  const unique = new Set(options.map((o) => o.toLowerCase()));
  if (options.length < MIN_OPTIONS) {
    issues.push({ field: "options", level: "error", message: "O mercado precisa de ao menos 2 opções." });
  }
  if (options.length > MAX_OPTIONS) {
    issues.push({ field: "options", level: "error", message: `O mercado aceita no máximo ${MAX_OPTIONS} opções.` });
  }
  if (unique.size !== options.length) {
    issues.push({ field: "options", level: "error", message: "Existem opções duplicadas." });
  }
  if (options.some((o) => o.length > MAX_OPTION_LENGTH)) {
    issues.push({ field: "options", level: "error", message: `Cada opção deve ter no máximo ${MAX_OPTION_LENGTH} caracteres.` });
  }

  if (!Number.isInteger(draft.minStake) || draft.minStake < 1) {
    issues.push({ field: "minStake", level: "error", message: "O aporte mínimo deve ser um inteiro positivo." });
  }
  if (!isNonNegativeInteger(draft.maxStakePerUser)) {
    issues.push({ field: "maxStakePerUser", level: "error", message: "O teto por usuário deve ser 0 (sem teto) ou inteiro positivo." });
  }
  if (
    Number.isInteger(draft.minStake) &&
    draft.maxStakePerUser > 0 &&
    draft.maxStakePerUser < draft.minStake
  ) {
    issues.push({ field: "maxStakePerUser", level: "error", message: "O teto por usuário não pode ser menor que o aporte mínimo." });
  }
  if (!isNonNegativeInteger(draft.rakeBps) || draft.rakeBps > MAX_RAKE_BPS) {
    issues.push({ field: "rakeBps", level: "error", message: "A taxa da casa deve ficar entre 0 e 2000 basis points (0%–20%)." });
  } else if (draft.rakeBps > 1_000) {
    issues.push({ field: "rakeBps", level: "warning", message: "Taxas acima de 10% desestimulam a participação." });
  }

  const locksAt = parseTime(draft.locksAt);
  if (Number.isNaN(locksAt)) {
    issues.push({ field: "locksAt", level: "error", message: "Data de travamento inválida." });
  } else {
    const window = locksAt - now;
    if (window <= 0) {
      issues.push({ field: "locksAt", level: "error", message: "O travamento precisa estar no futuro." });
    } else if (window < MIN_WINDOW_MS) {
      issues.push({ field: "window", level: "error", message: "A janela mínima de aportes é de 15 minutos." });
    } else if (window > MAX_WINDOW_MS) {
      issues.push({ field: "window", level: "warning", message: "Janelas acima de 60 dias imobilizam moedas por tempo demais." });
    }
  }

  const resolvesAt = parseTime(draft.resolvesAt);
  if (draft.resolvesAt && Number.isNaN(resolvesAt)) {
    issues.push({ field: "resolvesAt", level: "error", message: "Data de apuração inválida." });
  }
  if (!Number.isNaN(resolvesAt) && !Number.isNaN(locksAt) && resolvesAt < locksAt) {
    issues.push({ field: "resolvesAt", level: "error", message: "A apuração não pode ocorrer antes do travamento." });
  }

  return issues;
}

export function hasBlockingIssues(issues: readonly DraftIssue[]): boolean {
  return issues.some((issue) => issue.level === "error");
}

export type PredictionAdminAction = "publish" | "lock" | "settle" | "void";

export interface PredictionStateView {
  status: PredictionAdminStatus;
  locksAt: string;
  optionCount: number;
  totalPool: number;
}

/** Máquina de estados administrativa (espelha as RPCs). */
export function canPerform(
  action: PredictionAdminAction,
  market: PredictionStateView,
  now: number,
): boolean {
  if (market.status === "settled" || market.status === "voided") return false;
  const locksAt = parseTime(market.locksAt);
  const expired = !Number.isNaN(locksAt) && locksAt <= now;

  switch (action) {
    case "publish":
      return market.status === "draft" && market.optionCount >= MIN_OPTIONS && !expired;
    case "lock":
      return market.status === "open";
    case "settle":
      return market.status === "locked" || (market.status === "open" && expired);
    case "void":
      return true;
    default:
      return false;
  }
}

export function describeAction(action: PredictionAdminAction, market: PredictionStateView): string {
  switch (action) {
    case "publish":
      return "Publicar abre o mercado para aportes até o travamento.";
    case "lock":
      return "Travar encerra os aportes imediatamente, sem alterar saldos.";
    case "settle":
      return market.totalPool > 0
        ? "Apurar distribui o pote aos acertadores e retém a taxa da casa."
        : "Apurar sem aportes finaliza o mercado sem movimentar moedas.";
    case "void":
      return market.totalPool > 0
        ? `Anular devolve integralmente ${market.totalPool} moeda(s) aos participantes.`
        : "Anular encerra o mercado sem movimentar moedas.";
    default:
      return "";
  }
}

export interface PredictionAdminOverview {
  total: number;
  drafts: number;
  open: number;
  locked: number;
  settled: number;
  voided: number;
  lockingSoon: number;
  /** Aberto mas com `locks_at` no passado: denuncia falha do cron de travamento. */
  expiredButOpen: number;
  /** Travado há muito tempo sem apuração: risco de moedas presas. */
  awaitingSettlement: number;
  coinsAtRisk: number;
}

export const LOCKING_SOON_MS = 24 * 60 * 60 * 1000;

export function summarizeMarkets(
  markets: readonly PredictionStateView[],
  now: number,
): PredictionAdminOverview {
  const overview: PredictionAdminOverview = {
    total: markets.length,
    drafts: 0,
    open: 0,
    locked: 0,
    settled: 0,
    voided: 0,
    lockingSoon: 0,
    expiredButOpen: 0,
    awaitingSettlement: 0,
    coinsAtRisk: 0,
  };

  for (const market of markets) {
    const locksAt = parseTime(market.locksAt);
    switch (market.status) {
      case "draft":
        overview.drafts += 1;
        break;
      case "settled":
        overview.settled += 1;
        break;
      case "voided":
        overview.voided += 1;
        break;
      case "locked":
        overview.locked += 1;
        overview.awaitingSettlement += 1;
        overview.coinsAtRisk += market.totalPool;
        break;
      case "open":
        overview.open += 1;
        overview.coinsAtRisk += market.totalPool;
        if (Number.isNaN(locksAt)) break;
        if (locksAt <= now) overview.expiredButOpen += 1;
        else if (locksAt - now <= LOCKING_SOON_MS) overview.lockingSoon += 1;
        break;
    }
  }

  return overview;
}

/** Sanitiza o rascunho antes do envio (a RPC revalida tudo do lado servidor). */
export function normalizeDraft(draft: PredictionDraft): PredictionDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description?.trim() || null,
    options: normalizeOptions(draft.options),
  };
}
