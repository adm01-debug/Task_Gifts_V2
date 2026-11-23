import { supabase } from "@/integrations/supabase/client";
import { profilesService } from "./profilesService";
import { logger } from "./loggingService";

export type MentorshipRequestType = "find_mentor" | "find_apprentice" | "specific";
export type MentorshipRequestStatus = "pending" | "accepted" | "rejected" | "expired";
export type MentorshipPairStatus = "pending" | "active" | "completed" | "cancelled";
export type MentorshipMissionType = "mentor_only" | "apprentice_only" | "collaborative";
export type MentorshipDifficulty = "easy" | "medium" | "hard";
export type MentorshipRole = "mentor" | "apprentice";

export interface MentorshipMission {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  xp_reward: number;
  coin_reward: number;
  mission_type: MentorshipMissionType;
  difficulty: MentorshipDifficulty;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface MentorshipPair {
  id: string;
  mentor_id: string;
  apprentice_id: string;
  status: MentorshipPairStatus;
  started_at: string | null;
  completed_at: string | null;
  total_xp_earned: number;
  total_missions_completed: number;
  created_at: string;
  updated_at: string;
}

export interface MentorshipPerson {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface MentorshipPairWithPeople extends MentorshipPair {
  mentor: MentorshipPerson | null;
  apprentice: MentorshipPerson | null;
}

export interface MentorshipMissionProgress {
  id: string;
  pair_id: string;
  mission_id: string;
  completed_by_mentor: boolean;
  completed_by_apprentice: boolean;
  mentor_completed_at: string | null;
  apprentice_completed_at: string | null;
  rewards_claimed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRequest {
  id: string;
  requester_id: string;
  target_id: string | null;
  request_type: MentorshipRequestType;
  status: MentorshipRequestStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface MentorshipRequestWithRequester extends MentorshipRequest {
  requester: MentorshipPerson | null;
}

export interface MentorshipSentRequest extends MentorshipRequest {
  target: MentorshipPerson | null;
}

export interface MentorshipCandidate extends MentorshipPerson {
  level: number | null;
  xp: number | null;
}

export interface MarkMissionPartResult {
  progress: MentorshipMissionProgress;
  xpAwarded: number;
  coinsAwarded: number;
  /** true quando este clique fechou a missão para a dupla (todos os lados exigidos concluídos). */
  missionSettled: boolean;
}

export interface CreateMissionInput {
  title: string;
  description?: string | null;
  icon?: string;
  xp_reward?: number;
  coin_reward?: number;
  mission_type?: MentorshipMissionType;
  difficulty?: MentorshipDifficulty;
  order_index?: number;
}

export interface CreateRequestInput {
  requesterId: string;
  /** Destinatário do pedido. As políticas de RLS só permitem que o próprio destinatário veja e responda. */
  targetId: string;
  requestType: MentorshipRequestType;
  message?: string | null;
}

const MISSION_COLUMNS =
  "id, title, description, icon, xp_reward, coin_reward, mission_type, difficulty, order_index, is_active, created_at";

const PAIR_COLUMNS =
  "id, mentor_id, apprentice_id, status, started_at, completed_at, total_xp_earned, total_missions_completed, created_at, updated_at";

const PROGRESS_COLUMNS =
  "id, pair_id, mission_id, completed_by_mentor, completed_by_apprentice, mentor_completed_at, apprentice_completed_at, rewards_claimed, created_at, updated_at";

const REQUEST_COLUMNS =
  "id, requester_id, target_id, request_type, status, message, created_at, responded_at";

const CANDIDATE_COLUMNS = "id, display_name, avatar_url, level, xp";

const DUPLICATE_KEY = "23505";

/**
 * Missões iniciais do catálogo. Mantidas idênticas ao seed canônico da migração
 * `20251213150249` para que o catálogo de produção use a mesma trilha de produto.
 */
export const DEFAULT_MENTORSHIP_MISSIONS: CreateMissionInput[] = [
  {
    title: "Primeira Reunião",
    description: "Realize a primeira reunião de alinhamento entre mentor e aprendiz",
    icon: "🤝",
    xp_reward: 50,
    coin_reward: 25,
    mission_type: "collaborative",
    difficulty: "easy",
    order_index: 1,
  },
  {
    title: "Definir Objetivos",
    description: "Defina 3 objetivos de desenvolvimento para os próximos 30 dias",
    icon: "🎯",
    xp_reward: 75,
    coin_reward: 35,
    mission_type: "collaborative",
    difficulty: "medium",
    order_index: 2,
  },
  {
    title: "Compartilhar Experiência",
    description: "Mentor compartilha uma história de aprendizado importante",
    icon: "📖",
    xp_reward: 40,
    coin_reward: 20,
    mission_type: "mentor_only",
    difficulty: "easy",
    order_index: 3,
  },
  {
    title: "Completar Primeira Trilha",
    description: "Aprendiz completa sua primeira trilha de aprendizado",
    icon: "🎓",
    xp_reward: 100,
    coin_reward: 50,
    mission_type: "apprentice_only",
    difficulty: "medium",
    order_index: 4,
  },
  {
    title: "Feedback Construtivo",
    description: "Mentor fornece feedback detalhado sobre uma entrega",
    icon: "💬",
    xp_reward: 60,
    coin_reward: 30,
    mission_type: "mentor_only",
    difficulty: "medium",
    order_index: 5,
  },
  {
    title: "Superar Desafio",
    description: "Aprendiz supera um desafio identificado pelo mentor",
    icon: "🏆",
    xp_reward: 150,
    coin_reward: 75,
    mission_type: "collaborative",
    difficulty: "hard",
    order_index: 6,
  },
  {
    title: "Apresentar Projeto",
    description: "Aprendiz apresenta um projeto para o mentor",
    icon: "📊",
    xp_reward: 120,
    coin_reward: 60,
    mission_type: "apprentice_only",
    difficulty: "hard",
    order_index: 7,
  },
  {
    title: "Certificação Alcançada",
    description: "Dupla completa todas as missões da mentoria",
    icon: "🌟",
    xp_reward: 200,
    coin_reward: 100,
    mission_type: "collaborative",
    difficulty: "hard",
    order_index: 8,
  },
];

function duplicateKey(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === DUPLICATE_KEY;
}

export const mentorshipService = {
  // ---------------------------------------------------------------- missões
  async getActiveMissions(): Promise<MentorshipMission[]> {
    const { data, error } = await supabase
      .from("mentorship_missions")
      .select(MISSION_COLUMNS)
      .eq("is_active", true)
      .order("order_index");

    if (error) throw error;
    return (data ?? []) as MentorshipMission[];
  },

  async getAllMissions(): Promise<MentorshipMission[]> {
    const { data, error } = await supabase
      .from("mentorship_missions")
      .select(MISSION_COLUMNS)
      .order("order_index");

    if (error) throw error;
    return (data ?? []) as MentorshipMission[];
  },

  async getMissionById(missionId: string): Promise<MentorshipMission | null> {
    const { data, error } = await supabase
      .from("mentorship_missions")
      .select(MISSION_COLUMNS)
      .eq("id", missionId)
      .maybeSingle();

    if (error) throw error;
    return (data as MentorshipMission | null) ?? null;
  },

  async createMission(input: CreateMissionInput): Promise<MentorshipMission> {
    const { data, error } = await supabase
      .from("mentorship_missions")
      .insert({
        title: input.title,
        description: input.description ?? null,
        icon: input.icon ?? "🎯",
        xp_reward: input.xp_reward ?? 50,
        coin_reward: input.coin_reward ?? 25,
        mission_type: input.mission_type ?? "collaborative",
        difficulty: input.difficulty ?? "medium",
        order_index: input.order_index ?? 0,
      })
      .select(MISSION_COLUMNS)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Não foi possível criar a missão.");
    return data as MentorshipMission;
  },

  async setMissionActive(missionId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from("mentorship_missions")
      .update({ is_active: isActive })
      .eq("id", missionId);

    if (error) throw error;
  },

  async seedDefaultMissions(): Promise<MentorshipMission[]> {
    const existing = await this.getAllMissions();
    if (existing.length > 0) return existing;

    const created: MentorshipMission[] = [];
    for (const mission of DEFAULT_MENTORSHIP_MISSIONS) {
      created.push(await this.createMission(mission));
    }
    return created;
  },

  // ------------------------------------------------------------------ duplas
  async getMyPairs(userId: string): Promise<MentorshipPairWithPeople[]> {
    const { data, error } = await supabase
      .from("mentorship_pairs")
      .select(PAIR_COLUMNS)
      .or(`mentor_id.eq.${userId},apprentice_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const pairs = (data ?? []) as MentorshipPair[];
    if (pairs.length === 0) return [];

    const peopleIds = pairs.flatMap((pair) => [pair.mentor_id, pair.apprentice_id]);
    const people = await profilesService.getPublicByIds(peopleIds);
    const byId = new Map(people.map((person) => [person.id, person]));

    return pairs.map((pair) => ({
      ...pair,
      mentor: byId.get(pair.mentor_id) ?? null,
      apprentice: byId.get(pair.apprentice_id) ?? null,
    }));
  },

  async createPair(mentorId: string, apprenticeId: string): Promise<MentorshipPair> {
    if (mentorId === apprenticeId) {
      throw new Error("Mentor e mentorado precisam ser pessoas diferentes.");
    }

    const { data, error } = await supabase
      .from("mentorship_pairs")
      .insert({ mentor_id: mentorId, apprentice_id: apprenticeId, status: "active" })
      .select(PAIR_COLUMNS)
      .maybeSingle();

    if (error) {
      if (duplicateKey(error)) {
        const { data: existing } = await supabase
          .from("mentorship_pairs")
          .select(PAIR_COLUMNS)
          .eq("mentor_id", mentorId)
          .eq("apprentice_id", apprenticeId)
          .maybeSingle();
        if (existing) return existing as MentorshipPair;
      }
      throw error;
    }

    if (!data) throw new Error("Não foi possível criar a dupla de mentoria.");
    return data as MentorshipPair;
  },

  async closePair(pairId: string, outcome: "completed" | "cancelled"): Promise<void> {
    const { error } = await supabase
      .from("mentorship_pairs")
      .update({ status: outcome, completed_at: new Date().toISOString() })
      .eq("id", pairId);

    if (error) throw error;
  },

  // -------------------------------------------------------------- progresso
  async getPairProgress(pairId: string): Promise<MentorshipMissionProgress[]> {
    const { data, error } = await supabase
      .from("mentorship_mission_progress")
      .select(PROGRESS_COLUMNS)
      .eq("pair_id", pairId);

    if (error) throw error;
    return (data ?? []) as MentorshipMissionProgress[];
  },

  /**
   * Marca a parte do usuário (mentor ou mentorado) como concluída e concede a
   * recompensa daquele lado. Cada pessoa recebe pela própria parte; a missão só
   * conta para a dupla quando todos os lados exigidos pelo tipo estão concluídos.
   * A missão e o valor da recompensa vêm sempre do banco — nunca do client.
   */
  async markMyPart(
    pair: MentorshipPair,
    missionId: string,
    role: MentorshipRole,
  ): Promise<MarkMissionPartResult> {
    const mission = await this.getMissionById(missionId);
    if (!mission) throw new Error("Missão não encontrada.");

    const now = new Date().toISOString();
    let progress = await this.getMissionProgress(pair.id, missionId);

    const alreadyDone = role === "mentor" ? progress?.completed_by_mentor : progress?.completed_by_apprentice;
    if (progress && alreadyDone) {
      return { progress, xpAwarded: 0, coinsAwarded: 0, missionSettled: progress.rewards_claimed };
    }

    if (!progress) {
      const { data, error } = await supabase
        .from("mentorship_mission_progress")
        .insert(
          role === "mentor"
            ? { pair_id: pair.id, mission_id: mission.id, completed_by_mentor: true, mentor_completed_at: now }
            : { pair_id: pair.id, mission_id: mission.id, completed_by_apprentice: true, apprentice_completed_at: now },
        )
        .select(PROGRESS_COLUMNS)
        .maybeSingle();

      if (error) {
        if (!duplicateKey(error)) throw error;
        const raced = await this.getMissionProgress(pair.id, mission.id);
        if (!raced) throw error;
        if (raced.completed_by_mentor || raced.completed_by_apprentice) {
          return { progress: raced, xpAwarded: 0, coinsAwarded: 0, missionSettled: raced.rewards_claimed };
        }
        return this.markMyPart(pair, missionId, role);
      }

      if (!data) throw new Error("Não foi possível registrar a conclusão da missão.");
      progress = data as MentorshipMissionProgress;
    } else {
      const { data, error } =
        role === "mentor"
          ? await supabase
              .from("mentorship_mission_progress")
              .update({ completed_by_mentor: true, mentor_completed_at: now })
              .eq("id", progress.id)
              .eq("completed_by_mentor", false)
              .select(PROGRESS_COLUMNS)
              .maybeSingle()
          : await supabase
              .from("mentorship_mission_progress")
              .update({ completed_by_apprentice: true, apprentice_completed_at: now })
              .eq("id", progress.id)
              .eq("completed_by_apprentice", false)
              .select(PROGRESS_COLUMNS)
              .maybeSingle();

      if (error) throw error;
      if (!data) {
        // Outra aba/aba do parceiro registrou a mesma conclusão antes.
        return { progress, xpAwarded: 0, coinsAwarded: 0, missionSettled: progress.rewards_claimed };
      }
      progress = data as MentorshipMissionProgress;
    }

    const actorId = role === "mentor" ? pair.mentor_id : pair.apprentice_id;
    let xpAwarded = 0;
    let coinsAwarded = 0;

    try {
      if (mission.xp_reward > 0) {
        await profilesService.addXp(actorId, mission.xp_reward, `mentorship_mission_${mission.id}`);
        xpAwarded = mission.xp_reward;
      }
      if (mission.coin_reward > 0) {
        await profilesService.addCoins(actorId, mission.coin_reward);
        coinsAwarded = mission.coin_reward;
      }
    } catch (error) {
      logger.apiError("Falha ao conceder recompensa de mentoria", error, "mentorshipService");
    }

    const bothDone = progress.completed_by_mentor && progress.completed_by_apprentice;
    const requiredDone =
      mission.mission_type === "mentor_only"
        ? progress.completed_by_mentor
        : mission.mission_type === "apprentice_only"
          ? progress.completed_by_apprentice
          : bothDone;

    let missionSettled = false;
    if (requiredDone && !progress.rewards_claimed) {
      const { data: settled } = await supabase
        .from("mentorship_mission_progress")
        .update({ rewards_claimed: true })
        .eq("id", progress.id)
        .eq("rewards_claimed", false)
        .select(PROGRESS_COLUMNS)
        .maybeSingle();

      if (settled) {
        missionSettled = true;
        progress = settled as MentorshipMissionProgress;
        await this.bumpPairTotals(pair, mission);
      }
    }

    return { progress, xpAwarded, coinsAwarded, missionSettled };
  },

  async getMissionProgress(pairId: string, missionId: string): Promise<MentorshipMissionProgress | null> {
    const { data, error } = await supabase
      .from("mentorship_mission_progress")
      .select(PROGRESS_COLUMNS)
      .eq("pair_id", pairId)
      .eq("mission_id", missionId)
      .maybeSingle();

    if (error) throw error;
    return (data as MentorshipMissionProgress | null) ?? null;
  },

  async bumpPairTotals(pair: MentorshipPair, mission: MentorshipMission): Promise<void> {
    const { data: fresh } = await supabase
      .from("mentorship_pairs")
      .select("total_xp_earned, total_missions_completed")
      .eq("id", pair.id)
      .maybeSingle();

    const currentXp = fresh?.total_xp_earned ?? pair.total_xp_earned;
    const currentMissions = fresh?.total_missions_completed ?? pair.total_missions_completed;
    const xpPerSide = mission.xp_reward * (mission.mission_type === "collaborative" ? 2 : 1);

    const { error } = await supabase
      .from("mentorship_pairs")
      .update({
        total_xp_earned: currentXp + xpPerSide,
        total_missions_completed: currentMissions + 1,
      })
      .eq("id", pair.id);

    if (error) throw error;
  },

  // ---------------------------------------------------------- solicitações
  async createRequest(input: CreateRequestInput): Promise<MentorshipRequest> {
    if (!input.targetId) {
      throw new Error("Escolha a pessoa para quem enviar a solicitação.");
    }
    if (input.targetId === input.requesterId) {
      throw new Error("Você não pode enviar uma solicitação para si mesmo.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("mentorship_requests")
      .select(REQUEST_COLUMNS)
      .eq("requester_id", input.requesterId)
      .eq("target_id", input.targetId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return existing as MentorshipRequest;

    const { data, error } = await supabase
      .from("mentorship_requests")
      .insert({
        requester_id: input.requesterId,
        target_id: input.targetId,
        request_type: input.requestType,
        message: input.message ?? null,
      })
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Não foi possível enviar a solicitação.");
    return data as MentorshipRequest;
  },

  /** Pedidos pendentes direcionados a este usuário. */
  async getIncomingRequests(userId: string): Promise<MentorshipRequestWithRequester[]> {
    const { data, error } = await supabase
      .from("mentorship_requests")
      .select(REQUEST_COLUMNS)
      .eq("status", "pending")
      .eq("target_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = ((data ?? []) as MentorshipRequest[]).filter((request) => request.requester_id !== userId);
    if (requests.length === 0) return [];

    const people = await profilesService.getPublicByIds(requests.map((request) => request.requester_id));
    const byId = new Map(people.map((person) => [person.id, person]));

    return requests.map((request) => ({
      ...request,
      requester: byId.get(request.requester_id) ?? null,
    }));
  },

  async getSentRequests(userId: string): Promise<MentorshipSentRequest[]> {
    const { data, error } = await supabase
      .from("mentorship_requests")
      .select(REQUEST_COLUMNS)
      .eq("requester_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = (data ?? []) as MentorshipRequest[];
    const targetIds = requests.map((request) => request.target_id).filter((id): id is string => Boolean(id));
    if (targetIds.length === 0) {
      return requests.map((request) => ({ ...request, target: null }));
    }

    const people = await profilesService.getPublicByIds(targetIds);
    const byId = new Map(people.map((person) => [person.id, person]));

    return requests.map((request) => ({
      ...request,
      target: request.target_id ? byId.get(request.target_id) ?? null : null,
    }));
  },

  /**
   * Aceita ou recusa um pedido. Ao aceitar, cria a dupla respeitando a direção
   * do pedido: `find_mentor` = quem pediu procura mentor; `find_apprentice` =
   * quem pediu quer mentorar.
   */
  async respondRequest(
    request: MentorshipRequest,
    responderId: string,
    accept: boolean,
  ): Promise<{ status: MentorshipRequestStatus; pair: MentorshipPair | null }> {
    if (request.target_id !== responderId) {
      throw new Error("Esta solicitação não foi direcionada a você.");
    }

    const { data, error } = await supabase
      .from("mentorship_requests")
      .update({ status: accept ? "accepted" : "rejected", responded_at: new Date().toISOString() })
      .eq("id", request.id)
      .eq("status", "pending")
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Esta solicitação não está mais pendente.");

    if (!accept) return { status: "rejected", pair: null };

    const requesterIsMentor = request.request_type === "find_apprentice";
    const mentorId = requesterIsMentor ? request.requester_id : responderId;
    const apprenticeId = requesterIsMentor ? responderId : request.requester_id;

    const pair = await this.createPair(mentorId, apprenticeId);
    return { status: "accepted", pair };
  },

  // ------------------------------------------------------------ candidatos
  async getCandidates(userId: string, search: string): Promise<MentorshipCandidate[]> {
    let query = supabase
      .from("profiles")
      .select(CANDIDATE_COLUMNS)
      .neq("id", userId)
      .order("level", { ascending: false })
      .limit(30);

    const term = search.trim();
    if (term.length > 0) {
      query = query.ilike("display_name", `%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MentorshipCandidate[];
  },

  async getPeopleByIds(ids: string[]): Promise<Map<string, MentorshipCandidate>> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return new Map();

    const { data, error } = await supabase.from("profiles").select(CANDIDATE_COLUMNS).in("id", unique);
    if (error) throw error;

    return new Map(((data ?? []) as MentorshipCandidate[]).map((person) => [person.id, person]));
  },
};