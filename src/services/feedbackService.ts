import { supabase } from "@/integrations/supabase/client";

export interface FeedbackCycle {
  id: string;
  name: string;
  description: string | null;
  cycle_type: '360' | 'manager' | 'peer' | 'self';
  starts_at: string;
  ends_at: string;
  status: 'draft' | 'active' | 'review' | 'completed';
  questions: FeedbackQuestion[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'select';
  category?: string;
  options?: string[];
  required?: boolean;
}

export interface FeedbackRequest {
  id: string;
  cycle_id: string;
  from_user_id: string;
  to_user_id: string;
  relationship: 'self' | 'manager' | 'peer' | 'direct_report';
  status: 'pending' | 'in_progress' | 'submitted' | 'skipped';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  cycle?: FeedbackCycle;
  from_user?: { display_name: string | null; avatar_url: string | null };
  to_user?: { display_name: string | null; avatar_url: string | null };
}

export interface FeedbackResponse {
  id: string;
  request_id: string;
  answers: Record<string, string | number>;
  strengths: string | null;
  improvements: string | null;
  overall_rating: number | null;
  is_anonymous: boolean;
  submitted_at: string;
}

export interface CycleInsert {
  name: string;
  description?: string;
  cycle_type?: FeedbackCycle['cycle_type'];
  starts_at: string;
  ends_at: string;
  questions: FeedbackQuestion[];
}

export interface FeedbackSummary {
  avgRating: number;
  totalResponses: number;
  byRelationship: Record<string, { count: number; avgRating: number }>;
  commonStrengths: string[];
  commonImprovements: string[];
}

/** Linha de `feedback_requests` com as respostas visíveis para quem está lendo o resumo. */
export interface FeedbackSummaryRow {
  relationship: string;
  responses: Array<
    Pick<FeedbackResponse, "overall_rating" | "strengths" | "improvements"> & { is_anonymous?: boolean }
  >;
}

/**
 * Ranking de comentários por frequência real (dedupe por texto normalizado),
 * preservando a grafia da primeira ocorrência. Textos repetidos viram uma
 * entrada com `count` maior em vez de ocuparem as 5 vagas sozinhos.
 */
function rankComments(texts: Array<string | null>): string[] {
  const byKey = new Map<string, { text: string; count: number }>();

  texts.forEach(raw => {
    const text = raw?.trim();
    if (!text) return;
    const key = text.toLowerCase().replace(/\s+/g, " ");
    const entry = byKey.get(key);
    if (entry) entry.count += 1;
    else byKey.set(key, { text, count: 1 });
  });

  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, 5)
    .map(entry => entry.text);
}

export function aggregateFeedbackSummary(rows: FeedbackSummaryRow[]): FeedbackSummary {
  let totalRating = 0;
  let ratingCount = 0;
  const byRelationship: Record<string, { count: number; totalRating: number }> = {};
  const strengths: string[] = [];
  const improvements: string[] = [];

  rows.forEach(row => {
    (row.responses ?? []).forEach(resp => {
      // O anonimato vale para o avaliado: um admin consegue ler respostas anônimas
      // (policy "Admins can view all responses"), mas o resumo dele não pode desfazer
      // o anonimato — é exatamente o que o card promete na tela.
      if (resp.is_anonymous) return;

      if (resp.overall_rating) {
        totalRating += resp.overall_rating;
        ratingCount += 1;

        if (!byRelationship[row.relationship]) {
          byRelationship[row.relationship] = { count: 0, totalRating: 0 };
        }
        byRelationship[row.relationship].count += 1;
        byRelationship[row.relationship].totalRating += resp.overall_rating;
      }
      if (resp.strengths) strengths.push(resp.strengths);
      if (resp.improvements) improvements.push(resp.improvements);
    });
  });

  return {
    avgRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0,
    totalResponses: ratingCount,
    byRelationship: Object.fromEntries(
      Object.entries(byRelationship).map(([rel, data]) => [
        rel,
        { count: data.count, avgRating: Math.round((data.totalRating / data.count) * 10) / 10 },
      ])
    ),
    commonStrengths: rankComments(strengths),
    commonImprovements: rankComments(improvements),
  };
}

const RELATIONSHIPS_BY_CYCLE: Record<FeedbackCycle["cycle_type"], FeedbackRequest["relationship"][]> = {
  "360": ["manager", "direct_report", "peer", "self"],
  manager: ["manager", "direct_report"],
  peer: ["peer"],
  self: ["self"],
};

/**
 * Quais tipos de avaliação o ciclo aceita. O banco valida `cycle_type` e `relationship`
 * separadamente, nunca a combinação (`CHECK` em `feedback_cycles.cycle_type` e em
 * `feedback_requests.relationship`), então a regra vive aqui e é aplicada pelo formulário
 * de pedido — antes era possível gravar uma avaliação de gestor num ciclo "Apenas Pares".
 */
export function allowedRelationshipsForCycle(
  cycleType: FeedbackCycle["cycle_type"]
): FeedbackRequest["relationship"][] {
  return RELATIONSHIPS_BY_CYCLE[cycleType] ?? RELATIONSHIPS_BY_CYCLE["360"];
}

type ProfileLite = { display_name: string | null; avatar_url: string | null };

/**
 * `feedback_requests` não tem FK para `profiles` (`from_user_id`/`to_user_id` são UUID
 * soltos, sem `REFERENCES`), então não existe a relação que os embeds
 * `profiles!feedback_requests_to_user_id_fkey` / `..._from_user_id_fkey` presumiam: o
 * PostgREST recusa a consulta e as listas de pedidos pendentes/recebidos não carregavam.
 * Os perfis vêm numa segunda query, por id.
 */
async function loadProfileMap(ids: string[]): Promise<Map<string, ProfileLite>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", unique);

  if (error) throw error;

  return new Map(
    (data ?? []).map(profile => [
      profile.id,
      { display_name: profile.display_name, avatar_url: profile.avatar_url },
    ])
  );
}

export const feedbackService = {
  async getActiveCycles(): Promise<FeedbackCycle[]> {
    const { data, error } = await supabase
      .from("feedback_cycles")
      .select("*")
      .in("status", ["active", "review"])
      .order("ends_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(c => ({
      ...c,
      questions: c.questions as unknown as FeedbackQuestion[],
    })) as FeedbackCycle[];
  },

  async getAllCycles(): Promise<FeedbackCycle[]> {
    const { data, error } = await supabase
      .from("feedback_cycles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(c => ({
      ...c,
      questions: c.questions as unknown as FeedbackQuestion[],
    })) as FeedbackCycle[];
  },

  async getMyPendingRequests(): Promise<FeedbackRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("feedback_requests")
      .select(`
        *,
        cycle:feedback_cycles(*)
      `)
      .eq("from_user_id", user.id)
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true });

    if (error) throw error;

    const requests = data ?? [];
    const profiles = await loadProfileMap(requests.map(request => request.to_user_id));

    return requests.map(r => ({
      ...r,
      cycle: r.cycle ? {
        ...r.cycle,
        questions: r.cycle.questions as unknown as FeedbackQuestion[],
      } : undefined,
      to_user: profiles.get(r.to_user_id),
    })) as unknown as FeedbackRequest[];
  },

  async getReceivedFeedback(): Promise<FeedbackRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("feedback_requests")
      .select(`
        *,
        cycle:feedback_cycles(*)
      `)
      .eq("to_user_id", user.id)
      .eq("status", "submitted")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const requests = data ?? [];
    const profiles = await loadProfileMap(requests.map(request => request.from_user_id));

    return requests.map(r => ({
      ...r,
      cycle: r.cycle ? {
        ...r.cycle,
        questions: r.cycle.questions as unknown as FeedbackQuestion[],
      } : undefined,
      from_user: profiles.get(r.from_user_id),
    })) as unknown as FeedbackRequest[];
  },

  async createCycle(cycle: CycleInsert): Promise<FeedbackCycle> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("feedback_cycles")
      .insert({
        name: cycle.name,
        description: cycle.description,
        cycle_type: cycle.cycle_type || '360',
        starts_at: cycle.starts_at,
        ends_at: cycle.ends_at,
        questions: cycle.questions as unknown as never,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      questions: data.questions as unknown as FeedbackQuestion[],
    } as FeedbackCycle;
  },

  async startCycle(cycleId: string): Promise<void> {
    const { error } = await supabase
      .from("feedback_cycles")
      .update({ status: 'active' })
      .eq("id", cycleId);

    if (error) throw error;
  },

  async updateCycle(cycleId: string, cycle: Partial<CycleInsert>): Promise<FeedbackCycle> {
    const payload: {
      name?: string;
      description?: string;
      cycle_type?: FeedbackCycle['cycle_type'];
      starts_at?: string;
      ends_at?: string;
      questions?: never;
    } = {};
    if (cycle.name !== undefined) payload.name = cycle.name;
    if (cycle.description !== undefined) payload.description = cycle.description;
    if (cycle.cycle_type !== undefined) payload.cycle_type = cycle.cycle_type;
    if (cycle.starts_at !== undefined) payload.starts_at = cycle.starts_at;
    if (cycle.ends_at !== undefined) payload.ends_at = cycle.ends_at;
    if (cycle.questions !== undefined) payload.questions = cycle.questions as unknown as never;

    const { data, error } = await supabase
      .from("feedback_cycles")
      .update(payload)
      .eq("id", cycleId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      questions: data.questions as unknown as FeedbackQuestion[],
    } as FeedbackCycle;
  },

  async deleteCycle(cycleId: string): Promise<void> {
    const { error } = await supabase
      .from("feedback_cycles")
      .delete()
      .eq("id", cycleId);

    if (error) throw error;
  },

  async createFeedbackRequest(
    cycleId: string,
    fromUserId: string,
    toUserId: string,
    relationship: FeedbackRequest['relationship'],
    dueDate?: string
  ): Promise<FeedbackRequest | null> {
    // `maybeSingle`, não `single`: a policy de SELECT de `feedback_requests` só libera
    // as linhas em que a pessoa é avaliador, avaliada ou admin. Um gestor (sem admin)
    // criando um pedido entre dois terceiros insere com sucesso, mas não consegue ler a
    // linha de volta — com `single()` o PostgREST devolvia erro e a criação inteira era
    // descartada, mesmo tendo gravado no banco.
    const { data, error } = await supabase
      .from("feedback_requests")
      .insert({
        cycle_id: cycleId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        relationship,
        due_date: dueDate,
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return (data as FeedbackRequest | null) ?? null;
  },

  async submitFeedback(
    requestId: string,
    answers: Record<string, string | number>,
    strengths?: string,
    improvements?: string,
    overallRating?: number,
    isAnonymous = false
  ): Promise<FeedbackResponse> {
    // Idempotente de propósito: `feedback_responses` não tem UNIQUE por `request_id` e a
    // tela volta a oferecer o envio quando algo falha. Se um retry reinserisse, o resumo
    // do avaliado contaria o mesmo voto duas vezes.
    const existing = await feedbackService.getFeedbackResponse(requestId);

    let response = existing;

    if (!response) {
      // Insere a resposta ANTES de marcar o pedido como enviado: se a inserção falhar
      // depois do update, o pedido ficaria `submitted` sem resposta (resposta perdida e
      // avaliação impossível de refazer).
      const { data, error } = await supabase
        .from("feedback_responses")
        .insert({
          request_id: requestId,
          answers,
          strengths,
          improvements,
          overall_rating: overallRating,
          is_anonymous: isAnonymous,
        })
        .select()
        .single();

      if (error) throw error;
      response = data as FeedbackResponse;
    }

    const { error: statusError } = await supabase
      .from("feedback_requests")
      .update({ status: 'submitted' })
      .eq("id", requestId);

    if (statusError) throw statusError;

    return response;
  },

  async getFeedbackResponse(requestId: string): Promise<FeedbackResponse | null> {
    const { data, error } = await supabase
      .from("feedback_responses")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (error) throw error;
    return data as FeedbackResponse | null;
  },

  async getFeedbackSummary(userId: string, cycleId?: string): Promise<FeedbackSummary> {
    let query = supabase
      .from("feedback_requests")
      .select(`
        relationship,
        feedback_responses(overall_rating, strengths, improvements, is_anonymous)
      `)
      .eq("to_user_id", userId)
      .eq("status", "submitted");

    if (cycleId) {
      query = query.eq("cycle_id", cycleId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return aggregateFeedbackSummary(
      (data ?? []).map(req => ({
        relationship: req.relationship as string,
        responses: (req.feedback_responses ?? []) as unknown as FeedbackSummaryRow["responses"],
      }))
    );
  },
};
