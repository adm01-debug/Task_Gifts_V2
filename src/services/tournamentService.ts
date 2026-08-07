import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export type TournamentStatus =
  | "draft"
  | "registration"
  | "running"
  | "finished"
  | "cancelled";

export interface TournamentSummary {
  id: string;
  title: string;
  description: string | null;
  status: TournamentStatus;
  max_participants: number;
  bracket_size: number | null;
  rounds: number | null;
  registration_closes_at: string | null;
  coins_per_win: number;
  xp_per_win: number;
  coins_champion: number;
  xp_champion: number;
  coins_runner_up: number;
  xp_runner_up: number;
  participants: number;
  joined: boolean;
}

export interface TournamentParticipant {
  id: string;
  user_id: string;
  seed: number | null;
  wins: number;
  placement: "champion" | "runner_up" | "eliminated" | null;
  eliminated_round: number | null;
  coins_awarded: number;
  xp_awarded: number;
  full_name: string | null;
  avatar_url: string | null;
}

export interface TournamentMatch {
  id: string;
  round: number;
  slot: number;
  home_participant_id: string | null;
  away_participant_id: string | null;
  home_score: number;
  away_score: number;
  winner_participant_id: string | null;
  status: "pending" | "ready" | "decided" | "bye";
}

export interface TournamentBracket {
  success: boolean;
  reason?: string;
  tournament?: TournamentSummary & {
    champion_user_id: string | null;
    runner_up_user_id: string | null;
  };
  joined?: boolean;
  participants?: TournamentParticipant[];
  matches?: TournamentMatch[];
}

export interface TournamentActionResult {
  success: boolean;
  reason?: string;
  already_joined?: boolean;
  already_decided?: boolean;
  finished?: boolean;
  bracket_size?: number;
  rounds?: number;
  participants?: number;
}

/**
 * Camada de acesso do Torneio Mata-Mata.
 *
 * Todo o chaveamento, placar e crédito de recompensas acontecem em RPCs
 * SECURITY DEFINER — o cliente apenas lê e dispara ações autorizadas.
 */
export const tournamentService = {
  async list(): Promise<TournamentSummary[]> {
    const { data, error } = await supabase.rpc("list_tournaments");
    if (error) {
      logger.error("Falha ao listar torneios", "tournamentService.list", error);
      throw error;
    }
    return (data as unknown as TournamentSummary[]) || [];
  },

  async bracket(tournamentId: string): Promise<TournamentBracket> {
    const { data, error } = await supabase.rpc("get_tournament_bracket", {
      p_tournament_id: tournamentId,
    });
    if (error) {
      logger.error("Falha ao carregar chaveamento", "tournamentService.bracket", error);
      throw error;
    }
    return (data as unknown as TournamentBracket) ?? { success: false };
  },

  async join(tournamentId: string): Promise<TournamentActionResult> {
    const { data, error } = await supabase.rpc("join_tournament", {
      p_tournament_id: tournamentId,
    });
    if (error) {
      logger.error("Falha ao entrar no torneio", "tournamentService.join", error);
      throw error;
    }
    return (data as unknown as TournamentActionResult) ?? { success: false };
  },

  async start(tournamentId: string): Promise<TournamentActionResult> {
    const { data, error } = await supabase.rpc("start_tournament", {
      p_tournament_id: tournamentId,
    });
    if (error) {
      logger.error("Falha ao iniciar torneio", "tournamentService.start", error);
      throw error;
    }
    return (data as unknown as TournamentActionResult) ?? { success: false };
  },

  async reportMatch(
    matchId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<TournamentActionResult> {
    const { data, error } = await supabase.rpc("report_tournament_match", {
      p_match_id: matchId,
      p_home_score: homeScore,
      p_away_score: awayScore,
    });
    if (error) {
      logger.error("Falha ao registrar placar", "tournamentService.reportMatch", error);
      throw error;
    }
    return (data as unknown as TournamentActionResult) ?? { success: false };
  },
};
