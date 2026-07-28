/**
 * Motor puro de governança do Leilão de Recompensas.
 *
 * Espelha, no cliente, as regras que o servidor aplica nas RPCs
 * `close_auction` / `cancel_auction` / `settle_auction`. Nenhuma decisão
 * econômica acontece aqui — este módulo só valida rascunhos e projeta
 * indicadores, de modo que a UI nunca ofereça uma ação que o banco recusaria.
 */

export type AuctionAdminStatus = "draft" | "active" | "closed" | "cancelled";

export interface AuctionDraft {
  title: string;
  description?: string | null;
  startingBid: number;
  minIncrement: number;
  startsAt: string;
  endsAt: string;
  status: AuctionAdminStatus;
}

export type IssueLevel = "error" | "warning";

export interface DraftIssue {
  field: keyof AuctionDraft | "window";
  level: IssueLevel;
  message: string;
}

/** Janela mínima operacional: abaixo disso o cron de 5 min pode encerrar antes do 1º lance. */
export const MIN_WINDOW_MS = 10 * 60 * 1000;
/** Janela longa demais congela moedas em caução por tempo excessivo. */
export const MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 800;

function parseTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/** Valida um rascunho de leilão. Sem `error` na lista, o insert é seguro. */
export function validateAuctionDraft(draft: AuctionDraft, now: number): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const title = draft.title.trim();

  if (title.length < 3) {
    issues.push({ field: "title", level: "error", message: "Informe um título com ao menos 3 caracteres." });
  }
  if (title.length > MAX_TITLE_LENGTH) {
    issues.push({ field: "title", level: "error", message: `Título deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
  }
  if ((draft.description ?? "").length > MAX_DESCRIPTION_LENGTH) {
    issues.push({
      field: "description",
      level: "error",
      message: `Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`,
    });
  }
  if (!isPositiveInteger(draft.startingBid)) {
    issues.push({ field: "startingBid", level: "error", message: "Lance inicial deve ser um inteiro positivo." });
  }
  if (!isPositiveInteger(draft.minIncrement)) {
    issues.push({ field: "minIncrement", level: "error", message: "Incremento mínimo deve ser um inteiro positivo." });
  }
  if (isPositiveInteger(draft.startingBid) && isPositiveInteger(draft.minIncrement)) {
    if (draft.minIncrement > draft.startingBid) {
      issues.push({
        field: "minIncrement",
        level: "warning",
        message: "Incremento maior que o lance inicial encarece muito a segunda oferta.",
      });
    }
  }

  const startsAt = parseTime(draft.startsAt);
  const endsAt = parseTime(draft.endsAt);

  if (Number.isNaN(startsAt)) {
    issues.push({ field: "startsAt", level: "error", message: "Data de início inválida." });
  }
  if (Number.isNaN(endsAt)) {
    issues.push({ field: "endsAt", level: "error", message: "Data de término inválida." });
  }
  if (!Number.isNaN(startsAt) && !Number.isNaN(endsAt)) {
    const window = endsAt - startsAt;
    if (window <= 0) {
      issues.push({ field: "window", level: "error", message: "O término precisa ser posterior ao início." });
    } else if (window < MIN_WINDOW_MS) {
      issues.push({ field: "window", level: "error", message: "A janela mínima do leilão é de 10 minutos." });
    } else if (window > MAX_WINDOW_MS) {
      issues.push({ field: "window", level: "warning", message: "Janelas acima de 30 dias retêm moedas por tempo demais." });
    }

    if (endsAt <= now && draft.status === "active") {
      issues.push({ field: "endsAt", level: "error", message: "Um leilão ativo não pode terminar no passado." });
    }
    if (startsAt < now - MIN_WINDOW_MS && draft.status === "draft") {
      issues.push({ field: "startsAt", level: "warning", message: "Início no passado: o leilão abrirá imediatamente ao publicar." });
    }
  }

  return issues;
}

export function hasBlockingIssues(issues: readonly DraftIssue[]): boolean {
  return issues.some((issue) => issue.level === "error");
}

export type AdminAction = "publish" | "close" | "cancel";

export interface AuctionStateView {
  status: AuctionAdminStatus;
  endsAt: string;
  totalBids: number;
}

/**
 * Máquina de estados das ações administrativas.
 * Regra crítica: encerrar (`close`) apura vencedor e consome a caução; cancelar
 * (`cancel`) devolve 100%. Nenhuma das duas é possível após estado terminal.
 */
export function canPerform(action: AdminAction, auction: AuctionStateView, now: number): boolean {
  const terminal = auction.status === "closed" || auction.status === "cancelled";
  if (terminal) return false;

  switch (action) {
    case "publish":
      return auction.status === "draft" && parseTime(auction.endsAt) > now;
    case "close":
      return auction.status === "active";
    case "cancel":
      return auction.status === "draft" || auction.status === "active";
    default:
      return false;
  }
}

/** Mensagem de confirmação — cancelar com lances ativos exige aviso explícito. */
export function describeAction(action: AdminAction, auction: AuctionStateView): string {
  if (action === "cancel") {
    return auction.totalBids > 0
      ? `Cancelar devolve integralmente a caução de ${auction.totalBids} participante(s).`
      : "Cancelar encerra o leilão sem vencedor.";
  }
  if (action === "close") {
    return auction.totalBids > 0
      ? "Encerrar apura o maior lance e estorna todos os demais participantes."
      : "Encerrar sem lances finaliza o leilão sem vencedor e sem débito.";
  }
  return "Publicar torna o leilão visível e aberto a lances.";
}

export interface AdminOverview {
  total: number;
  drafts: number;
  active: number;
  closed: number;
  cancelled: number;
  endingSoon: number;
  expiredButOpen: number;
  coinsAwarded: number;
}

export const ENDING_SOON_MS = 24 * 60 * 60 * 1000;

/** Agregados do painel. `expiredButOpen` denuncia falha do cron de apuração. */
export function summarizeAuctions(
  auctions: readonly AuctionStateView[],
  now: number,
  winningBids: readonly (number | null)[] = [],
): AdminOverview {
  const overview: AdminOverview = {
    total: auctions.length,
    drafts: 0,
    active: 0,
    closed: 0,
    cancelled: 0,
    endingSoon: 0,
    expiredButOpen: 0,
    coinsAwarded: winningBids.reduce<number>((sum, bid) => sum + (bid ?? 0), 0),
  };

  for (const auction of auctions) {
    if (auction.status === "draft") overview.drafts += 1;
    if (auction.status === "closed") overview.closed += 1;
    if (auction.status === "cancelled") overview.cancelled += 1;
    if (auction.status !== "active") continue;

    overview.active += 1;
    const endsAt = parseTime(auction.endsAt);
    if (Number.isNaN(endsAt)) continue;
    if (endsAt <= now) overview.expiredButOpen += 1;
    else if (endsAt - now <= ENDING_SOON_MS) overview.endingSoon += 1;
  }

  return overview;
}
// ---------------------------------------------------------------------------
// Entrega do item vinculado à loja
// ---------------------------------------------------------------------------

export interface DeliveryInput {
  /** Item da loja vinculado (null = leilão simbólico, sem entrega física). */
  rewardId: string | null;
  /** Estoque atual: null significa estoque ilimitado. */
  stock: number | null;
  /** Vencedor apurado (null quando ninguém deu lance). */
  winnerId: string | null;
  /** Caução retida do vencedor. */
  escrowCoins: number;
}

export type DeliveryOutcome =
  | { kind: "no_winner"; refundedCoins: 0; stockAfter: number | null }
  | { kind: "symbolic"; refundedCoins: 0; stockAfter: number | null }
  | { kind: "reserved"; refundedCoins: 0; stockAfter: number | null }
  | { kind: "refunded_no_stock"; refundedCoins: number; stockAfter: number | null };

/**
 * Espelha, em TypeScript puro, a decisão de entrega executada dentro de
 * `settle_auction`. Serve para simulação determinística: qualquer divergência
 * entre este motor e a RPC é um bug econômico.
 *
 * Invariante: moedas nunca são criadas. Ou o vencedor recebe o item (caução
 * consumida) ou a caução volta integralmente para o saldo dele.
 */
export function resolveAuctionDelivery(input: DeliveryInput): DeliveryOutcome {
  if (!input.winnerId) {
    return { kind: "no_winner", refundedCoins: 0, stockAfter: input.stock };
  }
  if (!input.rewardId) {
    return { kind: "symbolic", refundedCoins: 0, stockAfter: input.stock };
  }
  if (input.stock === null) {
    return { kind: "reserved", refundedCoins: 0, stockAfter: null };
  }
  if (input.stock > 0) {
    return { kind: "reserved", refundedCoins: 0, stockAfter: input.stock - 1 };
  }
  return {
    kind: "refunded_no_stock",
    refundedCoins: Math.max(0, input.escrowCoins),
    stockAfter: input.stock,
  };
}

/** Participante considerado na apuração de notificações. */
export interface AuctionNotifyParticipant {
  userId: string;
  escrowCoins: number;
  /** Preferência de notificação in-app do usuário (RPC `user_wants_in_app_notification`). */
  wantsInApp: boolean;
}

export type AuctionNotificationOutcome = "won" | "refunded" | "stock_unavailable";

export interface AuctionNotification {
  userId: string;
  outcome: AuctionNotificationOutcome;
  /** Moedas devolvidas (0 no caso de vitória efetiva). */
  refundedCoins: number;
}

export interface AuctionNotifyInput {
  delivery: DeliveryOutcome;
  winner: AuctionNotifyParticipant | null;
  losers: AuctionNotifyParticipant[];
}

/**
 * Espelha as notificações emitidas por `settle_auction`. Regras:
 * - cada participante recebe no máximo UMA notificação;
 * - preferências desligadas suprimem a notificação, nunca o estorno;
 * - vencedor sem estoque recebe `stock_unavailable` (e não `won`).
 */
export function resolveAuctionNotifications(input: AuctionNotifyInput): AuctionNotification[] {
  const out: AuctionNotification[] = [];

  for (const loser of input.losers) {
    if (!loser.wantsInApp) continue;
    out.push({
      userId: loser.userId,
      outcome: "refunded",
      refundedCoins: Math.max(0, loser.escrowCoins),
    });
  }

  const winner = input.winner;
  if (winner && winner.wantsInApp) {
    if (input.delivery.kind === "refunded_no_stock") {
      out.push({
        userId: winner.userId,
        outcome: "stock_unavailable",
        refundedCoins: Math.max(0, winner.escrowCoins),
      });
    } else if (input.delivery.kind === "reserved" || input.delivery.kind === "symbolic") {
      out.push({ userId: winner.userId, outcome: "won", refundedCoins: 0 });
    }
  }

  return out;
}
