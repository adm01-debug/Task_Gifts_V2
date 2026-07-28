/**
 * Motor puro do Álbum de Cartas Colecionáveis (Onda 3 — Economia).
 *
 * Espelha as regras de sorteio de pacote e de troca executadas pelas RPCs
 * `open_card_pack` / `respond_card_trade` (`SECURITY DEFINER`), permitindo
 * simular milhares de cenários em teste sem tocar no banco.
 *
 * IMPORTANTE: este módulo NUNCA decide prêmio nem move cartas em produção.
 * O sorteio e a transferência acontecem exclusivamente no servidor.
 */

export type CardRarity = "common" | "rare" | "epic" | "legendary";

export const CARD_RARITIES: readonly CardRarity[] = ["common", "rare", "epic", "legendary"] as const;

/** Pesos relativos de sorteio por raridade (espelham a RPC). */
export const RARITY_WEIGHTS: Readonly<Record<CardRarity, number>> = {
  common: 1000,
  rare: 250,
  epic: 60,
  legendary: 8,
};

/** Valor de referência de uma carta em "pontos de troca" — usado para aferir equilíbrio. */
export const RARITY_VALUE: Readonly<Record<CardRarity, number>> = {
  common: 1,
  rare: 4,
  epic: 12,
  legendary: 40,
};

/** Ordem canônica (mais rara primeiro) para exibição e desempate determinístico. */
const RARITY_ORDER: Readonly<Record<CardRarity, number>> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

export const PACK_SIZE = 5;

/** Toda carta a partir desta raridade satisfaz a garantia do pacote. */
export const PACK_GUARANTEED_RARITY: CardRarity = "rare";

export interface CardDefinition {
  id: string;
  code: string;
  name: string;
  rarity: CardRarity;
  set_code: string;
  is_active: boolean;
}

export interface OwnedCard {
  card_id: string;
  quantity: number;
}

export interface DrawnCard {
  card_id: string;
  rarity: CardRarity;
  /** true quando o colaborador ainda não possuía a carta antes deste pacote. */
  isNew: boolean;
}

export function isCardRarity(value: unknown): value is CardRarity {
  return typeof value === "string" && (CARD_RARITIES as readonly string[]).includes(value);
}

/** Peso saneado: descarta NaN/negativos que corrompem a roleta cumulativa. */
function weightOf(rarity: CardRarity): number {
  const w = RARITY_WEIGHTS[rarity];
  return Number.isFinite(w) && w > 0 ? w : 0;
}

function compareCards(a: CardDefinition, b: CardDefinition): number {
  const byRarity = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
  if (byRarity !== 0) return byRarity;
  return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
}

/**
 * Pool sorteável: apenas cartas ativas, em ordem canônica.
 * A ordenação é obrigatória — sem ela o mesmo `rng` produziria cartas
 * diferentes conforme a ordem de chegada do SELECT, quebrando a auditoria.
 */
export function drawablePool(pool: readonly CardDefinition[]): CardDefinition[] {
  return pool.filter((c) => c.is_active && isCardRarity(c.rarity) && weightOf(c.rarity) > 0).sort(compareCards);
}

function pickWeighted(pool: readonly CardDefinition[], roll: number): CardDefinition | null {
  const total = pool.reduce((sum, c) => sum + weightOf(c.rarity), 0);
  if (total <= 0) return null;
  // Clampa o roll: um rng fora de [0,1) jamais pode estourar o array.
  const safeRoll = Number.isFinite(roll) ? Math.min(Math.max(roll, 0), 0.999999999) : 0;
  let cursor = safeRoll * total;
  for (const card of pool) {
    cursor -= weightOf(card.rarity);
    if (cursor < 0) return card;
  }
  return pool[pool.length - 1] ?? null;
}

export interface PackResult {
  cards: DrawnCard[];
  /** Cartas inéditas para a coleção do colaborador. */
  newCount: number;
  /** Duplicatas — matéria-prima das trocas entre colegas. */
  duplicateCount: number;
  /** true quando a garantia de raridade mínima precisou substituir a última carta. */
  guaranteeApplied: boolean;
}

/**
 * Sorteia um pacote com garantia de ao menos uma carta `rare+`.
 *
 * A garantia existe para eliminar o pior caso motivacional (pacote 100% comum),
 * principal motivo de abandono em álbuns digitais. Quando nenhuma carta `rare+`
 * existe no pool, o pacote sai sem garantia em vez de falhar.
 */
export function drawPack(
  pool: readonly CardDefinition[],
  owned: readonly OwnedCard[],
  rng: () => number,
  size: number = PACK_SIZE,
): PackResult {
  const drawable = drawablePool(pool);
  const slots = Math.max(0, Math.min(Math.floor(Number.isFinite(size) ? size : 0), 20));
  if (drawable.length === 0 || slots === 0) {
    return { cards: [], newCount: 0, duplicateCount: 0, guaranteeApplied: false };
  }

  const ownedSet = new Set(
    owned.filter((o) => Number.isFinite(o.quantity) && o.quantity > 0).map((o) => o.card_id),
  );

  const picks: CardDefinition[] = [];
  for (let i = 0; i < slots; i++) {
    const card = pickWeighted(drawable, rng());
    if (card) picks.push(card);
  }

  const meetsGuarantee = (c: CardDefinition) =>
    RARITY_ORDER[c.rarity] <= RARITY_ORDER[PACK_GUARANTEED_RARITY];

  let guaranteeApplied = false;
  if (picks.length > 0 && !picks.some(meetsGuarantee)) {
    const premium = drawable.filter(meetsGuarantee);
    const replacement = pickWeighted(premium, rng());
    if (replacement) {
      picks[picks.length - 1] = replacement;
      guaranteeApplied = true;
    }
  }

  // A "novidade" acumula dentro do próprio pacote: duas cópias da mesma carta
  // inédita geram 1 nova + 1 duplicata, nunca 2 novas.
  const seen = new Set(ownedSet);
  const cards: DrawnCard[] = picks.map((pick) => {
    const isNew = !seen.has(pick.id);
    seen.add(pick.id);
    return { card_id: pick.id, rarity: pick.rarity, isNew };
  });

  const newCount = cards.filter((c) => c.isNew).length;
  return { cards, newCount, duplicateCount: cards.length - newCount, guaranteeApplied };
}

export interface CollectionProgress {
  totalCards: number;
  ownedCards: number;
  completionPct: number;
  duplicates: number;
  byRarity: Record<CardRarity, { total: number; owned: number }>;
  /** Cartas com quantidade >= 2: disponíveis para troca sem perder a coleção. */
  tradableCardIds: string[];
}

export function summarizeCollection(
  pool: readonly CardDefinition[],
  owned: readonly OwnedCard[],
): CollectionProgress {
  const active = pool.filter((c) => c.is_active && isCardRarity(c.rarity)).sort(compareCards);
  const quantities = new Map<string, number>();
  for (const item of owned) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) continue;
    quantities.set(item.card_id, (quantities.get(item.card_id) ?? 0) + Math.floor(item.quantity));
  }

  const byRarity = CARD_RARITIES.reduce(
    (acc, rarity) => {
      acc[rarity] = { total: 0, owned: 0 };
      return acc;
    },
    {} as Record<CardRarity, { total: number; owned: number }>,
  );

  let ownedCards = 0;
  let duplicates = 0;
  const tradableCardIds: string[] = [];

  for (const card of active) {
    byRarity[card.rarity].total += 1;
    const qty = quantities.get(card.id) ?? 0;
    if (qty > 0) {
      ownedCards += 1;
      byRarity[card.rarity].owned += 1;
    }
    if (qty > 1) {
      duplicates += qty - 1;
      tradableCardIds.push(card.id);
    }
  }

  const totalCards = active.length;
  return {
    totalCards,
    ownedCards,
    completionPct: totalCards === 0 ? 0 : Math.round((ownedCards / totalCards) * 1000) / 10,
    duplicates,
    byRarity,
    tradableCardIds,
  };
}

export type TradeRejection =
  | "same_user"
  | "same_card"
  | "offer_not_owned"
  | "offer_not_duplicate"
  | "request_not_owned"
  | "request_not_duplicate"
  | "unfair";

export interface TradeCheck {
  ok: boolean;
  reason?: TradeRejection;
  offeredValue: number;
  requestedValue: number;
}

/** Diferença máxima de valor tolerada numa troca (evita "lavagem" de lendárias). */
export const TRADE_VALUE_RATIO = 3;

/**
 * Valida uma troca entre dois colaboradores.
 *
 * Regra central: só se troca **duplicata**. Sem isso um colaborador poderia
 * esvaziar a própria coleção para inflar a de outro — vetor clássico de
 * conluio para farmar recompensas de conclusão de álbum.
 */
export function checkTrade(params: {
  proposerId: string;
  responderId: string;
  offeredCard: CardDefinition;
  requestedCard: CardDefinition;
  proposerOwned: readonly OwnedCard[];
  responderOwned: readonly OwnedCard[];
}): TradeCheck {
  const { proposerId, responderId, offeredCard, requestedCard } = params;
  const qty = (list: readonly OwnedCard[], cardId: string) =>
    list
      .filter((o) => o.card_id === cardId && Number.isFinite(o.quantity))
      .reduce((sum, o) => sum + Math.max(0, Math.floor(o.quantity)), 0);

  const offeredValue = RARITY_VALUE[offeredCard.rarity] ?? 0;
  const requestedValue = RARITY_VALUE[requestedCard.rarity] ?? 0;
  const fail = (reason: TradeRejection): TradeCheck => ({
    ok: false,
    reason,
    offeredValue,
    requestedValue,
  });

  if (proposerId === responderId) return fail("same_user");
  if (offeredCard.id === requestedCard.id) return fail("same_card");

  const offerQty = qty(params.proposerOwned, offeredCard.id);
  if (offerQty <= 0) return fail("offer_not_owned");
  if (offerQty < 2) return fail("offer_not_duplicate");

  const requestQty = qty(params.responderOwned, requestedCard.id);
  if (requestQty <= 0) return fail("request_not_owned");
  if (requestQty < 2) return fail("request_not_duplicate");

  const high = Math.max(offeredValue, requestedValue);
  const low = Math.min(offeredValue, requestedValue);
  if (low <= 0 || high > low * TRADE_VALUE_RATIO) return fail("unfair");

  return { ok: true, offeredValue, requestedValue };
}

export const TRADE_REJECTION_LABEL: Readonly<Record<TradeRejection, string>> = {
  same_user: "Não é possível trocar cartas com você mesmo.",
  same_card: "Escolha cartas diferentes para a troca.",
  offer_not_owned: "Você não possui a carta oferecida.",
  offer_not_duplicate: "Você só pode oferecer cartas repetidas.",
  request_not_owned: "O colega não possui a carta pedida.",
  request_not_duplicate: "O colega só pode trocar cartas repetidas.",
  unfair: "A diferença de raridade entre as cartas é grande demais.",
};

export const RARITY_LABEL: Readonly<Record<CardRarity, string>> = {
  common: "Comum",
  rare: "Rara",
  epic: "Épica",
  legendary: "Lendária",
};

/** Probabilidade teórica de cada raridade num slot, dado o pool ativo. */
export function rarityOdds(pool: readonly CardDefinition[]): Record<CardRarity, number> {
  const drawable = drawablePool(pool);
  const total = drawable.reduce((sum, c) => sum + weightOf(c.rarity), 0);
  const odds = CARD_RARITIES.reduce(
    (acc, r) => {
      acc[r] = 0;
      return acc;
    },
    {} as Record<CardRarity, number>,
  );
  if (total <= 0) return odds;
  for (const card of drawable) {
    odds[card.rarity] += weightOf(card.rarity) / total;
  }
  return odds;
}
