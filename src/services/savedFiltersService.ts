import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";

export type SavedFilter = Tables<"saved_filters">;
export type SavedFilterInsert = TablesInsert<"saved_filters">;

/** Payload que o componente devolve ao aplicar um filtro salvo. */
export type SavedFilterPayload = Record<string, Json | undefined>;

/**
 * Filtros salvos por usuario e por entidade (`saved_filters`). A tabela ja'
 * existe em producao; as 4 policies garantem que ninguem le/escreve linha de
 * outro usuario, entao o `user_id` sempre vem da sessao.
 *
 * A regra de negocio do `is_default` e' aplicada no banco pelo gatilho
 * `trigger_single_default_filter` (um unico padrao por usuario + entidade),
 * mas ela e' reafirmada aqui para que a tela nao exiba dois padroes enquanto o
 * cache do React Query nao recarrega.
 */
export const savedFiltersService = {
  async list(entityType: string): Promise<SavedFilter[]> {
    const { data, error } = await supabase
      .from("saved_filters")
      .select("*")
      .eq("entity_type", entityType)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async save(input: {
    entityType: string;
    name: string;
    filters: SavedFilterPayload;
    isDefault?: boolean;
  }): Promise<SavedFilter> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("Sem usuario autenticado");

    const { data, error } = await supabase
      .from("saved_filters")
      .upsert(
        {
          user_id: userId,
          entity_type: input.entityType,
          name: input.name,
          filters: input.filters as Json,
          is_default: input.isDefault ?? false,
        },
        { onConflict: "user_id,entity_type,name" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Marca o filtro como padrao. O gatilho `trigger_single_default_filter` ja'
   * desmarca o padrao anterior da mesma entidade na mesma transacao, entao uma
   * unica escrita basta — desmarcar antes deixaria a entidade sem padrao se a
   * segunda escrita falhasse.
   */
  async setDefault(id: string): Promise<void> {
    const { error } = await supabase
      .from("saved_filters")
      .update({ is_default: true })
      .eq("id", id);
    if (error) throw error;
  },

  async clearDefault(id: string): Promise<void> {
    const { error } = await supabase
      .from("saved_filters")
      .update({ is_default: false })
      .eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("saved_filters").delete().eq("id", id);
    if (error) throw error;
  },
};