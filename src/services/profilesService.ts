import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { notificationsService } from "./notificationsService";
import { auditService } from "./auditService";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

/** Recorte mínimo exibível em rankings — apenas identidade visual. */
export interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Colunas de `profiles` legíveis por qualquer usuário autenticado.
 *
 * CPF, e-mail pessoal, telefone, matrícula e tipo de contrato foram removidos
 * do GRANT de coluna no banco (LGPD): qualquer `select("*")` sobre `profiles`
 * agora falha com `permission denied`. Use `getMyPrivate()` para os próprios
 * dados sensíveis e a RPC `admin_profile_directory` para fluxos de gestão.
 */
export const PROFILE_SAFE_COLUMNS =
  "id, display_name, avatar_url, level, xp, coins, streak, best_streak, quests_completed, status, created_at, updated_at, birth_date, hire_date, last_access_at" as const;

/**
 * E-mail e dados pessoais saíram do SELECT de `profiles` para qualquer usuário
 * autenticado. Fluxos de gestão usam a RPC `admin_profile_directory`; o próprio
 * usuário usa `getMyPrivate()` (ou `supabase.auth.getUser()`).
 */

const PUBLIC_PROFILE_COLUMNS = PROFILE_SAFE_COLUMNS;

/** Dados pessoais sensíveis do próprio usuário logado. */
export interface PrivateProfile {
  id: string;
  email: string | null;
  personal_email: string | null;
  cpf: string | null;
  phone: string | null;
  employee_id: string | null;
  contract_type: string | null;
}

export const profilesService = {
  /**
   * Nomes e avatares de um conjunto de usuários.
   *
   * Lê da view pública: nunca devolve e-mail ou qualquer outro dado pessoal
   * que não seja exibível em ranking.
   */
  async getPublicByIds(ids: string[]): Promise<PublicProfile[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return [];

    const { data, error } = await supabase
      .from("profiles_public")
      .select("id, display_name, avatar_url")
      .in("id", unique);
    if (error) throw error;

    return ((data ?? []) as PublicProfile[]).filter((row) => !!row.id);
  },

   getById: async (id: string): Promise<Profile | null> => {
     try {
       const { data, error } = await supabase.from("profiles").select(PROFILE_SAFE_COLUMNS).eq("id", id).maybeSingle();
       if (error) throw error;
       return (data ?? null) as unknown as Profile | null;
     } catch (error) {
       logger.apiError("getProfileById", error, "ProfilesService");
       return null;
     }
   },

   getAll: async (): Promise<Profile[]> => {
     const { data, error } = await supabase.from("profiles").select(PUBLIC_PROFILE_COLUMNS).order("xp", { ascending: false });
     if (error) throw error;
     return (data ?? []) as unknown as Profile[];
   },

   /**
    * Dados pessoais sensíveis do próprio usuário (CPF, telefone, e-mail
    * pessoal, matrícula). Lido via função `SECURITY DEFINER` que filtra por
    * `auth.uid()` — não existe caminho para ler os dados de terceiros.
    */
   getMyPrivate: async (): Promise<PrivateProfile | null> => {
     try {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const { data, error } = await (supabase as any).rpc("get_my_profile_private");
       if (error) throw error;
       const rows = (data ?? []) as PrivateProfile[];
       return rows[0] ?? null;
     } catch (error) {
       logger.apiError("getMyPrivateProfile", error, "ProfilesService");
       return null;
     }
   },

   getLeaderboard: async (limit = 10): Promise<Profile[]> => {
     const { data, error } = await supabase.from("profiles").select(PUBLIC_PROFILE_COLUMNS).order("xp", { ascending: false }).limit(limit);
     if (error) throw error;
     return (data ?? []) as unknown as Profile[];
   },

   getTopByLevel: async (limit = 20): Promise<Array<Pick<Profile, "id" | "display_name" | "level" | "xp">>> => {
     try {
       const { data, error } = await supabase
         .from("profiles")
         .select("id, display_name, level, xp")
         .order("level", { ascending: false })
         .limit(limit);
       if (error) throw error;
       return (data ?? []) as Array<Pick<Profile, "id" | "display_name" | "level" | "xp">>;
     } catch (error) {
       logger.apiError("getTopByLevel", error, "ProfilesService");
       return [];
     }
   },

  async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select(PROFILE_SAFE_COLUMNS).single();
      if (error) throw error;
      return data as unknown as Profile;
    } catch (error) {
      logger.apiError("updateProfile", error, "ProfilesService");
      throw error;
    }
  },

  /**
   * Soma XP via RPC `add_xp` (SECURITY DEFINER). Preserva o contrato do
   * hook `useAddXp`: {@link { profile, leveledUp, newLevel }}.
   */
  async addXp(id: string, xpAmount: number, source?: string): Promise<{ profile: Profile; leveledUp: boolean; newLevel?: number }> {
      // Lê o perfil ANTES da RPC para comparar o nível pré-incremento
      const oldProfile = await this.getById(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("add_xp", { p_user_id: id, p_amount: xpAmount, p_source: source ?? null });
    if (error) throw error;
    const row = (data ?? [])[0] as { id: string; xp: number; level: number } | undefined;
    if (!row) throw new Error("Profile not found");

    const oldLevel = oldProfile?.level ?? row.level;
    const newLevel = row.level;
    const leveledUp = newLevel > oldLevel;

    auditService.logXpGain(id, xpAmount, source || "atividade").catch(() => {});
    notificationsService.notifyXpGain(id, xpAmount, source || "atividade").catch(() => {});

    if (leveledUp) {
      auditService.logLevelUp(id, oldLevel, newLevel).catch(() => {});
      notificationsService.notifyLevelUp(id, newLevel).catch(() => {});
      // Integration with sound effects or celebrations can be triggered in UI
    }

    return { profile: { id: row.id, xp: row.xp, level: row.level } as unknown as Profile, leveledUp, newLevel: leveledUp ? newLevel : undefined };
  },
  async addCoins(id: string, coinsAmount: number): Promise<Profile> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("add_coins", { p_user_id: id, p_amount: coinsAmount });
    if (error) throw error;
    const row = (data ?? [])[0] as { id: string; coins: number } | undefined;
    if (!row) throw new Error("Profile not found");
    return { id: row.id, coins: row.coins } as unknown as Profile;
  },

  async incrementStreak(id: string): Promise<Profile> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("increment_streak", { p_user_id: id });
    if (error) throw error;
    const row = (data ?? [])[0] as { id: string; streak: number; best_streak: number } | undefined;
    if (!row) throw new Error("Profile not found");

    auditService.logStreakUpdate(id, Math.max(row.streak - 1, 0), row.streak).catch(() => {});
    return { id: row.id, streak: row.streak, best_streak: row.best_streak } as unknown as Profile;
  },

  async incrementQuestsCompleted(id: string): Promise<Profile> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("increment_quests_completed", { p_user_id: id });
    if (error) throw error;
    const row = (data ?? [])[0] as { id: string; quests_completed: number } | undefined;
    if (!row) throw new Error("Profile not found");
    return { id: row.id, quests_completed: row.quests_completed } as unknown as Profile;
  },
};
