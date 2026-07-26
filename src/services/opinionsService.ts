import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import {
  toOpinionFeedEntry,
  validateOpinionDraft,
  type OpinionDraft,
  type OpinionFeedEntry,
  type OpinionStatus,
  type RawOpinionRow,
} from "@/lib/opinionChannel";

/** Escopos do feed: "mine" = minhas manifestações, "queue" = fila de tratativa (RH/gestor). */
export type OpinionScope = "mine" | "queue";

export interface OpinionResponseEntry {
  id: string;
  opinionId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

// As RPCs do canal ainda não constam nos tipos gerados do banco.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function toError(err: unknown, fallback: string): Error {
  return err instanceof Error ? err : new Error(fallback);
}

export const opinionsService = {
  /** Feed já anonimizado no servidor; a lib volta a aplicar a guarda por segurança. */
  async listFeed(scope: OpinionScope, status: OpinionStatus | null = null): Promise<OpinionFeedEntry[]> {
    const { data, error } = await db.rpc("get_opinion_feed", {
      p_scope: scope,
      p_status: status,
      p_limit: 100,
    });
    if (error) {
      logger.apiError("opinion_feed", error, "opinionsService");
      throw toError(error, "Não foi possível carregar o canal de opiniões");
    }
    const rows = (data ?? []) as RawOpinionRow[];
    const now = new Date();
    return rows
      .map((row) => toOpinionFeedEntry(row, now))
      .filter((entry): entry is OpinionFeedEntry => entry !== null);
  },

  /** Cria uma manifestação. Sempre valida/normaliza antes de gravar. */
  async create(draft: OpinionDraft): Promise<string> {
    const { valid, errors, value } = validateOpinionDraft(draft);
    if (!valid) throw new Error(errors.join(" "));

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("Sessão expirada. Entre novamente para enviar.");

    const { data, error } = await db
      .from("opinions")
      .insert({
        sender_id: userId,
        recipient_type: value.recipientType,
        category: value.category,
        urgency: value.urgency,
        subject: value.subject,
        content: value.content,
        is_anonymous: value.isAnonymous,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      logger.apiError("opinion_create", error, "opinionsService");
      throw toError(error, "Não foi possível enviar sua manifestação");
    }
    return (data?.id as string) ?? "";
  },

  /** Alterna o apoio ("também penso assim") de forma idempotente no servidor. */
  async toggleSupport(opinionId: string): Promise<{ supported: boolean; supportCount: number }> {
    const { data, error } = await db.rpc("toggle_opinion_support", { p_opinion_id: opinionId });
    if (error) {
      logger.apiError("opinion_support", error, "opinionsService");
      throw toError(error, "Não foi possível registrar seu apoio");
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      supported: row?.supported === true,
      supportCount: Number(row?.support_count ?? 0),
    };
  },

  /** Resposta oficial do RH/gestor. Move a manifestação de situação na mesma transação. */
  async respond(params: {
    opinionId: string;
    content: string;
    isInternal?: boolean;
    status?: OpinionStatus;
  }): Promise<string> {
    const { data, error } = await db.rpc("respond_to_opinion", {
      p_opinion_id: params.opinionId,
      p_content: params.content,
      p_is_internal: params.isInternal ?? false,
      p_status: params.status ?? null,
    });
    if (error) {
      logger.apiError("opinion_respond", error, "opinionsService");
      throw toError(error, "Não foi possível registrar a resposta");
    }
    return (data as string) ?? "";
  },

  async setStatus(opinionId: string, status: OpinionStatus): Promise<void> {
    const { error } = await db.rpc("set_opinion_status", {
      p_opinion_id: opinionId,
      p_status: status,
    });
    if (error) {
      logger.apiError("opinion_status", error, "opinionsService");
      throw toError(error, "Não foi possível atualizar a situação");
    }
  },

  /** Gera (ou recupera) o plano 5W2H derivado da manifestação. */
  async generateActionPlan(opinionId: string): Promise<string> {
    const { data, error } = await db.rpc("generate_action_plan_from_opinion", {
      p_opinion_id: opinionId,
    });
    if (error) {
      logger.apiError("opinion_action_plan", error, "opinionsService");
      throw toError(error, "Não foi possível gerar o plano de ação");
    }
    if (typeof data !== "string" || data.length === 0) {
      throw new Error("O plano de ação não pôde ser criado.");
    }
    return data;
  },

  /** Respostas visíveis ao solicitante (RLS filtra notas internas de terceiros). */
  async listResponses(opinionId: string): Promise<OpinionResponseEntry[]> {
    const { data, error } = await db
      .from("opinion_responses")
      .select("id, opinion_id, content, is_internal, created_at")
      .eq("opinion_id", opinionId)
      .order("created_at", { ascending: true });
    if (error) {
      logger.apiError("opinion_responses", error, "opinionsService");
      throw toError(error, "Não foi possível carregar as respostas");
    }
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      opinionId: String(row.opinion_id),
      content: String(row.content ?? ""),
      isInternal: row.is_internal === true,
      createdAt: String(row.created_at),
    }));
  },
};