import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { BoardTile, BoardTileType } from "@/lib/boardTrail";
import type { BoardChallengeStatRow, BoardLeaderboardRow } from "@/lib/boardStats";

export interface BoardTrail {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  status: "draft" | "active" | "archived";
  max_moves_per_day: number;
}

export interface BoardTrailWithTiles extends BoardTrail {
  tiles: BoardTile[];
}

export interface BoardPlayerRow {
  position: number;
  coins: number;
  xp: number;
  checkpoints: number[];
  moves_count: number;
  blocked_challenge_id: string | null;
  /** Tentativas já feitas no desafio pendente (0 quando não há bloqueio). */
  challenge_attempts: number;
  finished_at: string | null;
}

export interface BoardChallengeOption {
  id: string;
  text: string;
}

export interface BoardChallengeQuestion {
  id: string;
  question: string;
  /** Alternativas SEM o gabarito — a correção acontece só no servidor. */
  options: BoardChallengeOption[];
}

export interface BoardChallengeResult {
  replayed: boolean;
  correct: boolean;
  coins_delta: number;
  xp_delta: number;
  unblocked: boolean;
  attempts_left: number;
}

export interface BoardAdvanceResult {
  replayed: boolean;
  roll: number;
  from_position: number;
  landed_position: number;
  final_position: number;
  coins_delta: number;
  xp_delta: number;
  position: number;
  finished: boolean;
  blocked_challenge_id?: string | null;
}

interface RawTile {
  id: string;
  position: number;
  tile_type: BoardTileType;
  label: string;
  coins: number | null;
  xp: number | null;
  move_by: number | null;
  challenge_id: string | null;
}

function mapTile(row: RawTile): BoardTile {
  return {
    id: row.id,
    position: row.position,
    type: row.tile_type,
    label: row.label,
    coins: row.coins,
    xp: row.xp,
    moveBy: row.move_by,
    challengeId: row.challenge_id,
  };
}

export const boardTrailService = {
  /** Trilhas ativas disponíveis para jogar. */
  async listTrails(): Promise<BoardTrail[]> {
    const { data, error } = await supabase
      .from("board_trails")
      .select("id, title, description, department_id, status, max_moves_per_day")
      .eq("status", "active")
      .order("title", { ascending: true });

    if (error) {
      logger.error("Falha ao listar trilhas", "boardTrailService.listTrails", error);
      throw error;
    }
    return (data as BoardTrail[]) || [];
  },

  /** Carrega uma trilha com o tabuleiro completo. */
  async getTrail(trailId: string): Promise<BoardTrailWithTiles | null> {
    const { data, error } = await supabase
      .from("board_trails")
      .select(
        "id, title, description, department_id, status, max_moves_per_day, board_tiles(id, position, tile_type, label, coins, xp, move_by, challenge_id)",
      )
      .eq("id", trailId)
      .maybeSingle();

    if (error) {
      logger.error("Falha ao carregar trilha", "boardTrailService.getTrail", error);
      throw error;
    }
    if (!data) return null;

    const row = data as BoardTrail & { board_tiles?: RawTile[] | null };
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      department_id: row.department_id,
      status: row.status,
      max_moves_per_day: row.max_moves_per_day,
      tiles: (row.board_tiles || []).map(mapTile).sort((a, b) => a.position - b.position),
    };
  },

  /** Progresso do próprio jogador (a RLS já restringe). */
  async getPlayerState(trailId: string): Promise<BoardPlayerRow | null> {
    const { data, error } = await supabase
      .from("board_player_states")
      .select(
        "position, coins, xp, checkpoints, moves_count, blocked_challenge_id, challenge_attempts, finished_at",
      )
      .eq("trail_id", trailId)
      .maybeSingle();

    if (error) {
      logger.error("Falha ao carregar progresso", "boardTrailService.getPlayerState", error);
      throw error;
    }
    if (!data) return null;
    const row = data as BoardPlayerRow;
    return {
      ...row,
      checkpoints: row.checkpoints || [],
      challenge_attempts: row.challenge_attempts ?? 0,
    };
  },

  /**
   * Avança uma casa. O sorteio e o crédito acontecem exclusivamente na RPC
   * `advance_board_trail` (SECURITY DEFINER) com chave idempotente.
   */
  async advance(trailId: string, dedupeKey: string): Promise<BoardAdvanceResult> {
    const { data, error } = await supabase.rpc("advance_board_trail", {
      p_trail_id: trailId,
      p_dedupe_key: dedupeKey,
    });

    if (error) {
      logger.error("Falha ao avançar na trilha", "boardTrailService.advance", error);
      throw error;
    }
    return data as unknown as BoardAdvanceResult;
  },

  /**
   * Carrega a pergunta da casa de desafio. As alternativas são buscadas sem o
   * campo `is_correct` para que o gabarito nunca trafegue até o cliente.
   */
  async getChallenge(challengeId: string): Promise<BoardChallengeQuestion | null> {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, question, quiz_options(id, text, order_index)")
      .eq("id", challengeId)
      .maybeSingle();

    if (error) {
      logger.error("Falha ao carregar desafio", "boardTrailService.getChallenge", error);
      throw error;
    }
    if (!data) return null;

    const row = data as {
      id: string;
      question: string;
      quiz_options?: Array<{ id: string; text: string; order_index: number | null }> | null;
    };

    return {
      id: row.id,
      question: row.question,
      options: (row.quiz_options || [])
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((o) => ({ id: o.id, text: o.text })),
    };
  },

  /**
   * Responde o desafio. A correção, o crédito e o desbloqueio acontecem
   * exclusivamente na RPC `resolve_board_challenge`, com chave idempotente.
   */
  async resolveChallenge(
    trailId: string,
    optionId: string,
    dedupeKey: string,
  ): Promise<BoardChallengeResult> {
    const { data, error } = await supabase.rpc("resolve_board_challenge", {
      p_trail_id: trailId,
      p_option_id: optionId,
      p_dedupe_key: dedupeKey,
    });

    if (error) {
      logger.error("Falha ao resolver desafio", "boardTrailService.resolveChallenge", error);
      throw error;
    }
    return data as unknown as BoardChallengeResult;
  },

  /** Ranking da trilha — visível a qualquer usuário autenticado. */
  async getLeaderboard(trailId: string, limit = 50): Promise<BoardLeaderboardRow[]> {
    const { data, error } = await supabase.rpc("get_board_trail_leaderboard", {
      p_trail_id: trailId,
      p_limit: limit,
    });

    if (error) {
      logger.error("Falha ao carregar ranking", "boardTrailService.getLeaderboard", error);
      throw error;
    }
    return (data as unknown as BoardLeaderboardRow[]) || [];
  },

  /** Relatório de acertos por desafio — a RPC recusa quem não é gestor/admin. */
  async getChallengeStats(trailId: string): Promise<BoardChallengeStatRow[]> {
    const { data, error } = await supabase.rpc("get_board_challenge_stats", {
      p_trail_id: trailId,
    });

    if (error) {
      logger.error("Falha ao carregar relatório de desafios", "boardTrailService.getChallengeStats", error);
      throw error;
    }
    return (data as unknown as BoardChallengeStatRow[]) || [];
  },

  /** Todas as trilhas (inclui rascunhos/arquivadas) — apenas admin/gestor pela RLS. */
  async listAllTrails(): Promise<BoardTrail[]> {
    const { data, error } = await supabase
      .from("board_trails")
      .select("id, title, description, department_id, status, max_moves_per_day")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Falha ao listar trilhas (admin)", "boardTrailService.listAllTrails", error);
      throw error;
    }
    return (data as BoardTrail[]) || [];
  },

  /**
   * Cria/atualiza a trilha e substitui o tabuleiro inteiro numa única
   * transação (RPC `save_board_trail`, que revalida tudo no servidor).
   */
  async saveTrail(input: {
    trailId: string | null;
    title: string;
    description: string | null;
    departmentId: string | null;
    status: "draft" | "active" | "archived";
    maxMovesPerDay: number;
    tiles: ReadonlyArray<{
      tile_type: BoardTileType;
      label: string;
      coins: number | null;
      xp: number | null;
      move_by: number | null;
      challenge_id: string | null;
    }>;
  }): Promise<string> {
    const { data, error } = await supabase.rpc("save_board_trail", {
      // Os tipos gerados não expressam parâmetros anuláveis; o SQL trata NULL.
      p_trail_id: input.trailId as unknown as string,
      p_title: input.title,
      p_description: input.description as unknown as string,
      p_department_id: input.departmentId as unknown as string,
      p_status: input.status,
      p_max_moves_per_day: input.maxMovesPerDay,
      p_tiles: input.tiles as unknown as never,
    });

    if (error) {
      logger.error("Falha ao salvar trilha", "boardTrailService.saveTrail", error);
      throw error;
    }
    return data as unknown as string;
  },

  /** Exclui a trilha e, em cascata, casas/progresso/jogadas. */
  async deleteTrail(trailId: string): Promise<void> {
    const { error } = await supabase.rpc("delete_board_trail", { p_trail_id: trailId });
    if (error) {
      logger.error("Falha ao excluir trilha", "boardTrailService.deleteTrail", error);
      throw error;
    }
  },
};