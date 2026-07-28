import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { MemoryPair } from "@/lib/memoryGame";

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
};