import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { MemoryPair } from "@/lib/memoryGame";
import type { DeckDraft, PairDiff } from "@/lib/memoryDeckAuthoring";

export interface MemoryDeck {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  is_active: boolean;
}

export interface MemorySession {
  id: string;
  deck_id: string;
  status: "active" | "finished";
  pairs_total: number;
  matched_pairs: number;
  moves: number;
  duration_ms: number;
  coins_awarded: number;
  xp_awarded: number;
  created_at: string;
}

export interface MemoryStartResult {
  success: boolean;
  reason?: "deck_not_found" | "deck_empty";
  replayed?: boolean;
  session_id?: string;
  pairs_total?: number;
}

export interface MemoryFinishResult {
  success: boolean;
  reason?: "not_found" | "race";
  replayed?: boolean;
  matched_pairs?: number;
  moves?: number;
  duration_ms?: number;
  perfect_bonus?: boolean;
  speed_bonus?: boolean;
  daily_limit_reached?: boolean;
  coins_awarded?: number;
  xp_awarded?: number;
}

export interface MemoryLeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  deck_id: string;
  matched_pairs: number;
  pairs_total: number;
  moves: number;
  duration_ms: number;
  coins_awarded: number;
  played_at: string;
  rank: number;
}

/**
 * Camada de acesso do Jogo da Memória.
 * A criação da partida e o crédito de moedas/XP acontecem exclusivamente em
 * RPCs SECURITY DEFINER — o cliente apenas relata o desempenho.
 */
export const memoryGameService = {
  async listDecks(): Promise<MemoryDeck[]> {
    const { data, error } = await supabase
      .from("memory_decks")
      .select("id, title, description, department_id, is_active")
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (error) {
      logger.error("Falha ao listar baralhos da memória", "memoryGameService.listDecks", error);
      throw error;
    }
    return (data as MemoryDeck[]) || [];
  },

  async listPairs(deckId: string): Promise<MemoryPair[]> {
    const { data, error } = await supabase
      .from("memory_pairs")
      .select("id, term, match")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Falha ao carregar pares da memória", "memoryGameService.listPairs", error);
      throw error;
    }
    return (data as MemoryPair[]) || [];
  },

  async start(deckId: string): Promise<MemoryStartResult> {
    const { data, error } = await supabase.rpc("start_memory_session", { p_deck_id: deckId });
    if (error) {
      logger.error("Falha ao iniciar partida da memória", "memoryGameService.start", error);
      throw error;
    }
    return (data as unknown as MemoryStartResult) ?? { success: false };
  },

  async finish(sessionId: string, moves: number, matchedPairs: number): Promise<MemoryFinishResult> {
    const { data, error } = await supabase.rpc("finish_memory_session", {
      p_session_id: sessionId,
      p_moves: Math.max(0, Math.floor(moves)),
      p_matched_pairs: Math.max(0, Math.floor(matchedPairs)),
    });
    if (error) {
      logger.error("Falha ao finalizar partida da memória", "memoryGameService.finish", error);
      throw error;
    }
    return (data as unknown as MemoryFinishResult) ?? { success: false };
  },

  async history(limit = 10): Promise<MemorySession[]> {
    const { data, error } = await supabase
      .from("memory_sessions")
      .select(
        "id, deck_id, status, pairs_total, matched_pairs, moves, duration_ms, coins_awarded, xp_awarded, created_at",
      )
      .eq("status", "finished")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("Falha ao carregar histórico da memória", "memoryGameService.history", error);
      throw error;
    }
    return (data as MemorySession[]) || [];
  },

  /**
   * Ranking da janela atual. A RPC é SECURITY DEFINER e só devolve nome público
   * e avatar (via `profiles_public`) — nunca e-mail ou outro PII.
   */
  async leaderboard(deckId: string | null, days = 7, limit = 20): Promise<MemoryLeaderboardEntry[]> {
    const { data, error } = await supabase.rpc("get_memory_leaderboard", {
      ...(deckId ? { p_deck_id: deckId } : {}),
      p_days: Math.min(90, Math.max(1, Math.floor(days))),
      p_limit: Math.min(100, Math.max(1, Math.floor(limit))),
    });

    if (error) {
      logger.error("Falha ao carregar ranking da memória", "memoryGameService.leaderboard", error);
      throw error;
    }
    return (data as MemoryLeaderboardEntry[]) || [];
  },
};

const DECK_COLUMNS = "id, title, description, department_id, is_active";

/**
 * Operações de autoria. A RLS de `memory_decks`/`memory_pairs` já restringe
 * escrita a `has_role(auth.uid(), 'admin')` — o cliente não consegue alterar
 * baralhos sem esse papel, mesmo chamando o endpoint diretamente.
 */
export const memoryDeckAdminService = {
  /** Inclui baralhos inativos (visíveis apenas para admins pela policy de SELECT). */
  async listAll(): Promise<MemoryDeck[]> {
    const { data, error } = await supabase
      .from("memory_decks")
      .select(DECK_COLUMNS)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Falha ao listar baralhos", "memoryDeckAdminService.listAll", error);
      throw error;
    }
    return (data as MemoryDeck[]) || [];
  },

  async createDeck(draft: DeckDraft): Promise<MemoryDeck> {
    const { data, error } = await supabase
      .from("memory_decks")
      .insert({
        title: draft.title,
        description: draft.description || null,
        department_id: draft.departmentId || null,
        is_active: draft.isActive,
      })
      .select(DECK_COLUMNS)
      .single();

    if (error) {
      logger.error("Falha ao criar baralho", "memoryDeckAdminService.createDeck", error);
      throw error;
    }
    return data as MemoryDeck;
  },

  async updateDeck(id: string, draft: DeckDraft): Promise<void> {
    const { error } = await supabase
      .from("memory_decks")
      .update({
        title: draft.title,
        description: draft.description || null,
        department_id: draft.departmentId || null,
        is_active: draft.isActive,
      })
      .eq("id", id);

    if (error) {
      logger.error("Falha ao atualizar baralho", "memoryDeckAdminService.updateDeck", error);
      throw error;
    }
  },

  async deleteDeck(id: string): Promise<void> {
    const { error } = await supabase.from("memory_decks").delete().eq("id", id);
    if (error) {
      logger.error("Falha ao excluir baralho", "memoryDeckAdminService.deleteDeck", error);
      throw error;
    }
  },

  /**
   * Aplica o diff calculado por `diffPairs`. As operações são sequenciais para
   * que uma falha de RLS/constraint identifique exatamente o par que a causou.
   */
  async applyPairDiff(deckId: string, diff: PairDiff): Promise<void> {
    if (diff.toDeleteIds.length > 0) {
      const { error } = await supabase
        .from("memory_pairs")
        .delete()
        .eq("deck_id", deckId)
        .in("id", diff.toDeleteIds);
      if (error) {
        logger.error("Falha ao remover pares", "memoryDeckAdminService.applyPairDiff", error);
        throw error;
      }
    }

    for (const pair of diff.toUpdate) {
      const { error } = await supabase
        .from("memory_pairs")
        .update({ term: pair.term, match: pair.match })
        .eq("id", pair.id)
        .eq("deck_id", deckId);
      if (error) {
        logger.error("Falha ao atualizar par", "memoryDeckAdminService.applyPairDiff", error);
        throw error;
      }
    }

    if (diff.toInsert.length > 0) {
      const { error } = await supabase
        .from("memory_pairs")
        .insert(diff.toInsert.map((p) => ({ deck_id: deckId, term: p.term, match: p.match })));
      if (error) {
        logger.error("Falha ao inserir pares", "memoryDeckAdminService.applyPairDiff", error);
        throw error;
      }
    }
  },
};