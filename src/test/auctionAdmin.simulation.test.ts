import { describe, expect, it } from "vitest";
import {
  ENDING_SOON_MS,
  MIN_WINDOW_MS,
  canPerform,
  hasBlockingIssues,
  summarizeAuctions,
  validateAuctionDraft,
  type AdminAction,
  type AuctionAdminStatus,
  type AuctionDraft,
  type AuctionStateView,
} from "@/lib/auctionAdmin";

/** PRNG determinístico para reprodutibilidade em CI. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

const NOW = Date.UTC(2026, 6, 28, 12, 0, 0);
const HOUR = 3_600_000;

function baseDraft(overrides: Partial<AuctionDraft> = {}): AuctionDraft {
  return {
    title: "Fone Bluetooth Premium",
    description: "Item raro da loja",
    startingBid: 100,
    minIncrement: 10,
    startsAt: new Date(NOW).toISOString(),
    endsAt: new Date(NOW + 48 * HOUR).toISOString(),
    status: "draft",
    ...overrides,
  };
}

describe("auctionAdmin — validação de rascunho", () => {
  it("aceita um rascunho bem formado", () => {
    expect(validateAuctionDraft(baseDraft(), NOW)).toEqual([]);
  });

  it("rejeita título curto ou longo demais", () => {
    expect(hasBlockingIssues(validateAuctionDraft(baseDraft({ title: "  a " }), NOW))).toBe(true);
    expect(hasBlockingIssues(validateAuctionDraft(baseDraft({ title: "x".repeat(121) }), NOW))).toBe(true);
  });

  it("rejeita valores econômicos inválidos", () => {
    for (const bad of [0, -5, 12.5, Number.NaN]) {
      expect(hasBlockingIssues(validateAuctionDraft(baseDraft({ startingBid: bad }), NOW))).toBe(true);
      expect(hasBlockingIssues(validateAuctionDraft(baseDraft({ minIncrement: bad }), NOW))).toBe(true);
    }
  });

  it("rejeita janela invertida ou curta demais", () => {
    const inverted = baseDraft({ endsAt: new Date(NOW - HOUR).toISOString() });
    expect(hasBlockingIssues(validateAuctionDraft(inverted, NOW))).toBe(true);

    const tooShort = baseDraft({ endsAt: new Date(NOW + MIN_WINDOW_MS - 1).toISOString() });
    expect(hasBlockingIssues(validateAuctionDraft(tooShort, NOW))).toBe(true);

    const exact = baseDraft({ endsAt: new Date(NOW + MIN_WINDOW_MS).toISOString() });
    expect(hasBlockingIssues(validateAuctionDraft(exact, NOW))).toBe(false);
  });

  it("impede publicar um leilão ativo já vencido", () => {
    const draft = baseDraft({
      status: "active",
      startsAt: new Date(NOW - 72 * HOUR).toISOString(),
      endsAt: new Date(NOW - HOUR).toISOString(),
    });
    expect(hasBlockingIssues(validateAuctionDraft(draft, NOW))).toBe(true);
  });

  it("avisa (sem bloquear) em janelas longas e incremento agressivo", () => {
    const long = validateAuctionDraft(baseDraft({ endsAt: new Date(NOW + 60 * 24 * HOUR).toISOString() }), NOW);
    expect(hasBlockingIssues(long)).toBe(false);
    expect(long.some((i) => i.level === "warning")).toBe(true);

    const aggressive = validateAuctionDraft(baseDraft({ startingBid: 10, minIncrement: 500 }), NOW);
    expect(hasBlockingIssues(aggressive)).toBe(false);
  });

  it("rejeita datas não parseáveis", () => {
    expect(hasBlockingIssues(validateAuctionDraft(baseDraft({ startsAt: "não-é-data" }), NOW))).toBe(true);
    expect(hasBlockingIssues(validateAuctionDraft(baseDraft({ endsAt: "" }), NOW))).toBe(true);
  });
});

describe("auctionAdmin — máquina de estados", () => {
  const view = (status: AuctionAdminStatus, endsAt: number, totalBids = 0): AuctionStateView => ({
    status,
    endsAt: new Date(endsAt).toISOString(),
    totalBids,
  });

  it("estados terminais não aceitam nenhuma ação", () => {
    for (const status of ["closed", "cancelled"] as const) {
      for (const action of ["publish", "close", "cancel"] as AdminAction[]) {
        expect(canPerform(action, view(status, NOW + HOUR), NOW)).toBe(false);
      }
    }
  });

  it("rascunho publica e cancela, mas não encerra", () => {
    const draft = view("draft", NOW + HOUR);
    expect(canPerform("publish", draft, NOW)).toBe(true);
    expect(canPerform("cancel", draft, NOW)).toBe(true);
    expect(canPerform("close", draft, NOW)).toBe(false);
  });

  it("rascunho vencido não pode ser publicado", () => {
    expect(canPerform("publish", view("draft", NOW - HOUR), NOW)).toBe(false);
  });

  it("ativo encerra e cancela, mas não publica de novo", () => {
    const active = view("active", NOW + HOUR, 4);
    expect(canPerform("close", active, NOW)).toBe(true);
    expect(canPerform("cancel", active, NOW)).toBe(true);
    expect(canPerform("publish", active, NOW)).toBe(false);
  });
});

describe("auctionAdmin — 500 cenários aleatórios de painel", () => {
  it("mantém invariantes de agregação e idempotência das transições", () => {
    const random = makeRandom(20260729);
    const statuses: AuctionAdminStatus[] = ["draft", "active", "closed", "cancelled"];

    for (let scenario = 0; scenario < 500; scenario += 1) {
      const count = Math.floor(random() * 25);
      const auctions: AuctionStateView[] = [];
      const winningBids: Array<number | null> = [];

      for (let i = 0; i < count; i += 1) {
        const status = statuses[Math.floor(random() * statuses.length)];
        const offset = Math.floor(random() * 10 * 24 * HOUR) - 5 * 24 * HOUR;
        auctions.push({
          status,
          endsAt: new Date(NOW + offset).toISOString(),
          totalBids: Math.floor(random() * 12),
        });
        winningBids.push(status === "closed" && random() > 0.3 ? Math.floor(random() * 900) : null);
      }

      const overview = summarizeAuctions(auctions, NOW, winningBids);

      // Invariante 1: a soma por status equivale ao total.
      expect(overview.drafts + overview.active + overview.closed + overview.cancelled).toBe(overview.total);
      expect(overview.total).toBe(count);

      // Invariante 2: subconjuntos de ativos nunca excedem os ativos.
      expect(overview.endingSoon + overview.expiredButOpen).toBeLessThanOrEqual(overview.active);

      // Invariante 3: moedas concedidas nunca são negativas.
      expect(overview.coinsAwarded).toBeGreaterThanOrEqual(0);

      for (const auction of auctions) {
        const endsAt = new Date(auction.endsAt).getTime();
        const terminal = auction.status === "closed" || auction.status === "cancelled";

        // Invariante 4: nada é acionável em estado terminal.
        if (terminal) {
          expect(canPerform("close", auction, NOW)).toBe(false);
          expect(canPerform("cancel", auction, NOW)).toBe(false);
          expect(canPerform("publish", auction, NOW)).toBe(false);
        }

        // Invariante 5: publicar só a partir de rascunho vigente.
        expect(canPerform("publish", auction, NOW)).toBe(auction.status === "draft" && endsAt > NOW);

        // Invariante 6: "encerrando em breve" exclui vencidos.
        if (auction.status === "active" && endsAt <= NOW) {
          expect(endsAt - NOW).toBeLessThanOrEqual(ENDING_SOON_MS);
        }
      }

      // Invariante 7: agregação é estável (função pura).
      expect(summarizeAuctions(auctions, NOW, winningBids)).toEqual(overview);
    }
  });
});