/**
 * Bingo RPC — Simulação de idempotência (`get_or_create_bingo_card` / `sync_bingo_card`)
 *
 * Espelha, em memória, o comportamento canônico das duas funções SQL:
 *  - `get_or_create_bingo_card`: cria no máximo UMA cartela por (board, user)
 *    graças ao advisory lock + `ON CONFLICT (board_id, user_id) DO NOTHING`.
 *  - `sync_bingo_card`: recalcula linhas a partir da atividade real e credita
 *    apenas o delta (`GREATEST(0, lines - lines_awarded)`), com full house pago
 *    uma única vez e guarda otimista (`reason: "race"`).
 *
 * Também valida a camada `bingoService` (normalização de `p_board_id` e
 * repasse fiel do payload) com o client mockado.
 *
 * Se a SQL mudar, estes specs devem ser atualizados junto.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------- Modelo SQL

interface BoardModel {
  id: string;
  taskCount: number;
  active: boolean;
  coins_per_line: number;
  xp_per_line: number;
  coins_full_house: number;
  xp_full_house: number;
}

interface CardRow {
  id: string;
  board_id: string;
  user_id: string;
  cells: { position: number; free: boolean }[];
  lines_awarded: number;
  full_house_awarded: boolean;
  coins_awarded: number;
  xp_awarded: number;
}

interface ProfileRow {
  coins: number;
  xp: number;
}

const FREE_POSITION = 12;

/** Réplica determinística do banco necessário para as duas RPCs. */
class BingoDb {
  boards = new Map<string, BoardModel>();
  cards: CardRow[] = [];
  marks = new Set<string>(); // `${card_id}:${position}` — UNIQUE (card_id, position)
  profiles = new Map<string, ProfileRow>();
  private seq = 0;

  addBoard(board: BoardModel) {
    this.boards.set(board.id, board);
  }

  profile(userId: string): ProfileRow {
    let p = this.profiles.get(userId);
    if (!p) {
      p = { coins: 0, xp: 0 };
      this.profiles.set(userId, p);
    }
    return p;
  }

  /** get_or_create_bingo_card(p_board_id) */
  getOrCreateCard(userId: string, boardId?: string | null) {
    const board = boardId
      ? this.boards.get(boardId)
      : [...this.boards.values()].find((b) => b.active);
    if (!board) return { success: false as const, reason: "no_board" as const };
    if (board.taskCount < 24) {
      return { success: false as const, reason: "insufficient_tasks" as const };
    }

    // advisory lock + ON CONFLICT DO NOTHING => no máximo uma cartela
    let card = this.cards.find((c) => c.board_id === board.id && c.user_id === userId);
    if (!card) {
      const cells = Array.from({ length: 25 }, (_, position) => ({
        position,
        free: position === FREE_POSITION,
      }));
      card = {
        id: `card-${++this.seq}`,
        board_id: board.id,
        user_id: userId,
        cells,
        lines_awarded: 0,
        full_house_awarded: false,
        coins_awarded: 0,
        xp_awarded: 0,
      };
      this.cards.push(card);
    }

    return {
      success: true as const,
      card_id: card.id,
      board_id: board.id,
      lines_awarded: card.lines_awarded,
      full_house_awarded: card.full_house_awarded,
      coins_awarded: card.coins_awarded,
      xp_awarded: card.xp_awarded,
    };
  }

  /**
   * sync_bingo_card(p_card_id).
   * `achieved` = casas com métrica atingida (o espaço livre é sempre marcado).
   * `staleBaseline` simula a guarda otimista do UPDATE ... AND lines_awarded = v_card.lines_awarded.
   */
  sync(
    userId: string,
    cardId: string,
    achieved: boolean[],
    staleBaseline?: { lines_awarded: number; full_house_awarded: boolean },
  ) {
    const card = this.cards.find((c) => c.id === cardId && c.user_id === userId);
    if (!card) return { success: false as const, reason: "not_found" as const };
    const board = this.boards.get(card.board_id) as BoardModel;

    const marked = achieved.slice(0, 25);
    marked[FREE_POSITION] = true;

    for (let pos = 0; pos < 25; pos++) {
      if (marked[pos]) this.marks.add(`${cardId}:${pos}`); // ON CONFLICT DO NOTHING
    }

    const lines = countLines(marked);
    const full = marked.every(Boolean);

    const baseline = staleBaseline ?? {
      lines_awarded: card.lines_awarded,
      full_house_awarded: card.full_house_awarded,
    };
    if (
      baseline.lines_awarded !== card.lines_awarded ||
      baseline.full_house_awarded !== card.full_house_awarded
    ) {
      return { success: false as const, reason: "race" as const };
    }

    const newLines = Math.max(0, lines - card.lines_awarded);
    let coins = newLines * board.coins_per_line;
    let xp = newLines * board.xp_per_line;
    if (full && !card.full_house_awarded) {
      coins += board.coins_full_house;
      xp += board.xp_full_house;
    }

    card.lines_awarded = Math.max(card.lines_awarded, lines);
    card.full_house_awarded = card.full_house_awarded || full;
    card.coins_awarded += coins;
    card.xp_awarded += xp;

    if (coins > 0 || xp > 0) {
      const p = this.profile(userId);
      p.coins += coins;
      p.xp += xp;
    }

    return {
      success: true as const,
      lines,
      new_lines: newLines,
      full_house: full,
      coins_awarded: coins,
      xp_awarded: xp,
    };
  }
}

/** 5 horizontais + 5 verticais + 2 diagonais (idêntico ao loop PL/pgSQL). */
function countLines(marked: boolean[]): number {
  let lines = 0;
  for (let i = 0; i < 5; i++) {
    if ([0, 1, 2, 3, 4].every((j) => marked[i * 5 + j])) lines++;
  }
  for (let j = 0; j < 5; j++) {
    if ([0, 1, 2, 3, 4].every((i) => marked[i * 5 + j])) lines++;
  }
  if ([0, 1, 2, 3, 4].every((i) => marked[i * 5 + i])) lines++;
  if ([0, 1, 2, 3, 4].every((i) => marked[i * 5 + (4 - i)])) lines++;
  return lines;
}

const BOARD: BoardModel = {
  id: "board-1",
  taskCount: 24,
  active: true,
  coins_per_line: 30,
  xp_per_line: 40,
  coins_full_house: 200,
  xp_full_house: 300,
};

function emptyGrid(): boolean[] {
  const grid = new Array<boolean>(25).fill(false);
  grid[FREE_POSITION] = true;
  return grid;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------- get_or_create_bingo_card

describe("get_or_create_bingo_card — idempotência", () => {
  it("retorna sempre a MESMA cartela em chamadas repetidas", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const first = db.getOrCreateCard("user-1");
    for (let i = 0; i < 50; i++) {
      const again = db.getOrCreateCard("user-1");
      expect(again.success).toBe(true);
      expect(again.card_id).toBe(first.card_id);
    }
    expect(db.cards).toHaveLength(1);
  });

  it("id explícito e id implícito convergem para a mesma cartela", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const implicit = db.getOrCreateCard("user-1");
    const explicit = db.getOrCreateCard("user-1", BOARD.id);
    expect(explicit.card_id).toBe(implicit.card_id);
    expect(db.cards).toHaveLength(1);
  });

  it("isola cartelas por usuário e por tabuleiro", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    db.addBoard({ ...BOARD, id: "board-2", active: false });
    const a = db.getOrCreateCard("user-1", "board-1");
    const b = db.getOrCreateCard("user-2", "board-1");
    const c = db.getOrCreateCard("user-1", "board-2");
    expect(new Set([a.card_id, b.card_id, c.card_id]).size).toBe(3);
    expect(db.cards).toHaveLength(3);
  });

  it("não cria cartela sem tabuleiro vigente nem com tarefas insuficientes", () => {
    const semBoard = new BingoDb();
    expect(semBoard.getOrCreateCard("user-1")).toEqual({
      success: false,
      reason: "no_board",
    });
    expect(semBoard.cards).toHaveLength(0);

    const poucas = new BingoDb();
    poucas.addBoard({ ...BOARD, taskCount: 23 });
    expect(poucas.getOrCreateCard("user-1")).toEqual({
      success: false,
      reason: "insufficient_tasks",
    });
    expect(poucas.cards).toHaveLength(0);
  });

  it("preserva o estado de créditos já acumulados ao reabrir a cartela", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const created = db.getOrCreateCard("user-1");
    const grid = emptyGrid();
    for (let j = 0; j < 5; j++) grid[10 + j] = true; // linha do meio
    db.sync("user-1", created.card_id as string, grid);

    const reopened = db.getOrCreateCard("user-1");
    expect(reopened.card_id).toBe(created.card_id);
    expect(reopened.lines_awarded).toBe(1);
    expect(reopened.coins_awarded).toBe(BOARD.coins_per_line);
    expect(reopened.xp_awarded).toBe(BOARD.xp_per_line);
  });
});

// --------------------------------------------------------- sync_bingo_card

describe("sync_bingo_card — créditos sem duplicação", () => {
  it("credita a primeira linha e nada nas sincronizações seguintes", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const cardId = db.getOrCreateCard("user-1").card_id as string;
    const grid = emptyGrid();
    for (let j = 0; j < 5; j++) grid[10 + j] = true;

    const first = db.sync("user-1", cardId, grid);
    expect(first).toMatchObject({ success: true, lines: 1, new_lines: 1 });
    expect(first.coins_awarded).toBe(30);
    expect(first.xp_awarded).toBe(40);

    for (let i = 0; i < 20; i++) {
      const again = db.sync("user-1", cardId, grid);
      expect(again).toMatchObject({ new_lines: 0, coins_awarded: 0, xp_awarded: 0 });
    }
    expect(db.profile("user-1")).toEqual({ coins: 30, xp: 40 });
  });

  it("paga full house uma única vez, mesmo com N sincronizações", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const cardId = db.getOrCreateCard("user-1").card_id as string;
    const full = new Array<boolean>(25).fill(true);

    const first = db.sync("user-1", cardId, full);
    expect(first).toMatchObject({ lines: 12, new_lines: 12, full_house: true });
    expect(first.coins_awarded).toBe(12 * 30 + 200);
    expect(first.xp_awarded).toBe(12 * 40 + 300);

    for (let i = 0; i < 10; i++) {
      expect(db.sync("user-1", cardId, full)).toMatchObject({
        full_house: true,
        new_lines: 0,
        coins_awarded: 0,
        xp_awarded: 0,
      });
    }
    expect(db.profile("user-1").coins).toBe(12 * 30 + 200);
    expect(db.profile("user-1").xp).toBe(12 * 40 + 300);
  });

  it("nunca estorna quando a atividade regride (linhas não diminuem)", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const cardId = db.getOrCreateCard("user-1").card_id as string;
    const grid = emptyGrid();
    for (let j = 0; j < 5; j++) grid[10 + j] = true;
    db.sync("user-1", cardId, grid);

    const regressed = emptyGrid();
    const after = db.sync("user-1", cardId, regressed);
    expect(after).toMatchObject({ new_lines: 0, coins_awarded: 0, xp_awarded: 0 });
    expect(db.cards[0].lines_awarded).toBe(1);
    expect(db.profile("user-1").coins).toBe(30);
  });

  it("marcações são únicas por (card_id, position) mesmo com syncs repetidos", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const cardId = db.getOrCreateCard("user-1").card_id as string;
    const grid = emptyGrid();
    for (let j = 0; j < 5; j++) grid[10 + j] = true;
    for (let i = 0; i < 15; i++) db.sync("user-1", cardId, grid);
    expect(db.marks.size).toBe(5); // 4 casas + espaço livre já contido na linha
  });

  it("rejeita cartela inexistente ou de outro usuário", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const cardId = db.getOrCreateCard("user-1").card_id as string;
    expect(db.sync("user-1", "card-inexistente", emptyGrid())).toEqual({
      success: false,
      reason: "not_found",
    });
    expect(db.sync("user-2", cardId, emptyGrid())).toEqual({
      success: false,
      reason: "not_found",
    });
  });

  it("detecta corrida (baseline defasado) sem creditar nada", () => {
    const db = new BingoDb();
    db.addBoard(BOARD);
    const cardId = db.getOrCreateCard("user-1").card_id as string;
    const grid = emptyGrid();
    for (let j = 0; j < 5; j++) grid[10 + j] = true;
    db.sync("user-1", cardId, grid);

    const raced = db.sync("user-1", cardId, grid, {
      lines_awarded: 0,
      full_house_awarded: false,
    });
    expect(raced).toEqual({ success: false, reason: "race" });
    expect(db.profile("user-1").coins).toBe(30);
  });
});

describe("sync_bingo_card — simulação combinatória (600+ cenários)", () => {
  it("total creditado é sempre igual à fórmula fechada, independente da ordem", () => {
    const rand = mulberry32(20260727);
    for (let scenario = 0; scenario < 600; scenario++) {
      const db = new BingoDb();
      db.addBoard(BOARD);
      const cardId = db.getOrCreateCard(`user-${scenario}`).card_id as string;

      const grid = emptyGrid();
      let maxLines = 0;
      let sawFull = false;

      const steps = 3 + Math.floor(rand() * 6);
      for (let s = 0; s < steps; s++) {
        // progressão monotônica: casas só são conquistadas, nunca perdidas
        for (let pos = 0; pos < 25; pos++) {
          if (!grid[pos] && rand() < 0.18) grid[pos] = true;
        }
        const res = db.sync(`user-${scenario}`, cardId, [...grid]);
        expect(res.success).toBe(true);
        maxLines = Math.max(maxLines, res.lines as number);
        sawFull = sawFull || Boolean(res.full_house);
        expect(res.new_lines).toBeGreaterThanOrEqual(0);
        // Invariante: crédito do passo = novas linhas * tarifa (+ full house 1x)
        const expectedCoins =
          (res.new_lines as number) * BOARD.coins_per_line +
          (res.coins_awarded === (res.new_lines as number) * BOARD.coins_per_line
            ? 0
            : BOARD.coins_full_house);
        expect(res.coins_awarded).toBe(expectedCoins);
      }

      const expectedTotalCoins =
        maxLines * BOARD.coins_per_line + (sawFull ? BOARD.coins_full_house : 0);
      const expectedTotalXp =
        maxLines * BOARD.xp_per_line + (sawFull ? BOARD.xp_full_house : 0);

      expect(db.profile(`user-${scenario}`).coins).toBe(expectedTotalCoins);
      expect(db.profile(`user-${scenario}`).xp).toBe(expectedTotalXp);
      expect(db.cards[0].coins_awarded).toBe(expectedTotalCoins);
      expect(db.cards[0].xp_awarded).toBe(expectedTotalXp);

      // Sync extra final nunca adiciona crédito
      const extra = db.sync(`user-${scenario}`, cardId, [...grid]);
      expect(extra.coins_awarded).toBe(0);
      expect(extra.xp_awarded).toBe(0);
      expect(db.profile(`user-${scenario}`).coins).toBe(expectedTotalCoins);
    }
  });
});

// ------------------------------------------------------- Camada de serviço

const rpcMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: vi.fn(),
  },
}));
vi.mock("@/services/loggingService", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe("bingoService — contrato com as RPCs", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("normaliza board id ausente/vazio para undefined (mesma cartela vigente)", async () => {
    const { bingoService } = await import("@/services/bingoService");
    rpcMock.mockResolvedValue({ data: { success: true, card_id: "card-1" }, error: null });

    for (const input of [undefined, null, "", "   "] as (string | null | undefined)[]) {
      await bingoService.getOrCreateCard(input);
    }
    for (const call of rpcMock.mock.calls) {
      expect(call[0]).toBe("get_or_create_bingo_card");
      expect(call[1]).toEqual({ p_board_id: undefined });
    }
  });

  it("repassa board id explícito sem espaços", async () => {
    const { bingoService } = await import("@/services/bingoService");
    rpcMock.mockResolvedValue({ data: { success: true, card_id: "card-1" }, error: null });
    await bingoService.getOrCreateCard("  board-9  ");
    expect(rpcMock).toHaveBeenCalledWith("get_or_create_bingo_card", {
      p_board_id: "board-9",
    });
  });

  it("propaga erro da RPC de sync e não inventa créditos", async () => {
    const { bingoService } = await import("@/services/bingoService");
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(bingoService.sync("card-1")).rejects.toBeTruthy();

    rpcMock.mockResolvedValue({ data: null, error: null });
    await expect(bingoService.sync("card-1")).resolves.toEqual({ success: false });
  });

  it("repassa fielmente o payload de sync (sem recomputar créditos no cliente)", async () => {
    const { bingoService } = await import("@/services/bingoService");
    const payload = {
      success: true,
      lines: 3,
      new_lines: 0,
      full_house: false,
      coins_awarded: 0,
      xp_awarded: 0,
    };
    rpcMock.mockResolvedValue({ data: payload, error: null });
    await expect(bingoService.sync("card-1")).resolves.toEqual(payload);
    expect(rpcMock).toHaveBeenCalledWith("sync_bingo_card", { p_card_id: "card-1" });
  });
});
