import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DemographicAttribute = Tables<"demographic_attributes">;
export type DemographicAttributeInsert = TablesInsert<"demographic_attributes">;
export type DemographicAttributeUpdate = TablesUpdate<"demographic_attributes">;
export type DemographicValue = Tables<"user_demographic_values">;

export type DemographicAttributeType =
  | "text"
  | "single_select"
  | "multi_select"
  | "number"
  | "date"
  | "calculated";

/** Mesmos valores aceitos pelo CHECK `demographic_attributes_attribute_type_check`. */
export const ATTRIBUTE_TYPES: Array<{ value: DemographicAttributeType; label: string; hint: string }> = [
  { value: "text", label: "Texto livre", hint: "O colaborador digita o que quiser." },
  { value: "single_select", label: "Escolha única", hint: "Uma opção de uma lista." },
  { value: "multi_select", label: "Múltipla escolha", hint: "Várias opções da lista." },
  { value: "number", label: "Número", hint: "Somente valor numérico." },
  { value: "date", label: "Data", hint: "Uma data no calendário." },
  { value: "calculated", label: "Calculado", hint: "Preenchido pelo sistema; o colaborador não edita." },
];

export const ehTipoComOpcoes = (tipo: string) =>
  tipo === "single_select" || tipo === "multi_select";

export const rotuloTipo = (tipo: string) =>
  ATTRIBUTE_TYPES.find((t) => t.value === tipo)?.label ?? tipo;

/**
 * Marca de "prefiro não responder" (`allow_prefer_not_answer`). Vive em
 * `values_array` em vez de `value` para nao colidir com um texto real que o
 * colaborador possa ter digitado, e vale para qualquer tipo de atributo.
 */
export const PREFER_NOT_ANSWER = "__prefer_not_answer__";

export const ehPreferNotAnswer = (valuesArray: Json | null): boolean =>
  Array.isArray(valuesArray) && valuesArray.includes(PREFER_NOT_ANSWER);

/**
 * `options` guarda a lista de opcoes como array de strings (padrao `[]` do
 * banco). O leitor tambem aceita `{ value, label }`, formato que o Supabase
 * Studio costuma produzir quando alguem edita a linha pela interface.
 */
export const lerOpcoes = (options: Json | null): string[] => {
  if (!Array.isArray(options)) return [];
  return options
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "value" in item) {
        const valor = (item as { value?: unknown }).value;
        return typeof valor === "string" ? valor : null;
      }
      return null;
    })
    .filter((item): item is string => !!item);
};

/** Valor exibivel de uma linha de `user_demographic_values`, conforme o tipo. */
export const valorExibivel = (valor: DemographicValue): string => {
  if (ehPreferNotAnswer(valor.values_array)) return "Prefiro não responder";
  if (Array.isArray(valor.values_array) && valor.values_array.length > 0) {
    return valor.values_array.filter((v) => typeof v === "string").join(", ");
  }
  if (valor.number_value !== null && valor.number_value !== undefined) {
    return String(valor.number_value);
  }
  if (valor.date_value) {
    const [ano, mes, dia] = valor.date_value.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  if (valor.value) return valor.value;
  return "Não informado";
};

export const demographicsService = {
  async listAttributes(options?: { onlyActive?: boolean }): Promise<DemographicAttribute[]> {
    let query = supabase
      .from("demographic_attributes")
      .select("*")
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (options?.onlyActive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async createAttribute(input: DemographicAttributeInsert): Promise<DemographicAttribute> {
    const { data, error } = await supabase
      .from("demographic_attributes")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateAttribute(
    id: string,
    updates: DemographicAttributeUpdate,
  ): Promise<DemographicAttribute> {
    const { data, error } = await supabase
      .from("demographic_attributes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Exclui o atributo. Os valores dos colaboradores saem junto pelo
   * `ON DELETE CASCADE` da FK `user_demographic_values_attribute_id_fkey`.
   */
  async deleteAttribute(id: string): Promise<void> {
    const { error } = await supabase.from("demographic_attributes").delete().eq("id", id);
    if (error) throw error;
  },

  async setOrder(id: string, orderIndex: number): Promise<void> {
    const { error } = await supabase
      .from("demographic_attributes")
      .update({ order_index: orderIndex })
      .eq("id", id);
    if (error) throw error;
  },

  async listMyValues(): Promise<DemographicValue[]> {
    const { data, error } = await supabase.from("user_demographic_values").select("*");
    if (error) throw error;
    return data ?? [];
  },

  /** Leitura de administrador/gestor, com o nome do atributo embutido. */
  async listAllValues(): Promise<Array<DemographicValue & { demographic_attributes: Pick<DemographicAttribute, "name" | "attribute_type" | "is_visible_in_reports" | "is_restricted"> | null }>> {
    const { data, error } = await supabase
      .from("user_demographic_values")
      .select(
        "*, demographic_attributes(name, attribute_type, is_visible_in_reports, is_restricted)",
      );
    if (error) throw error;
    return data ?? [];
  },

  async saveValue(input: {
    attributeId: string;
    value?: string | null;
    valuesArray?: Json;
    numberValue?: number | null;
    dateValue?: string | null;
  }): Promise<DemographicValue> {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) throw new Error("Sem usuário autenticado");

    const { data, error } = await supabase
      .from("user_demographic_values")
      .upsert(
        {
          user_id: userId,
          attribute_id: input.attributeId,
          value: input.value ?? null,
          values_array: input.valuesArray ?? [],
          number_value: input.numberValue ?? null,
          date_value: input.dateValue ?? null,
        },
        { onConflict: "user_id,attribute_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** "Prefiro não responder": grava a marca, sem apagar a linha. */
  async setPreferNotAnswer(attributeId: string): Promise<DemographicValue> {
    return demographicsService.saveValue({
      attributeId,
      value: null,
      valuesArray: [PREFER_NOT_ANSWER],
      numberValue: null,
      dateValue: null,
    });
  },

  async clearValue(attributeId: string): Promise<void> {
    const { error } = await supabase
      .from("user_demographic_values")
      .delete()
      .eq("attribute_id", attributeId);
    if (error) throw error;
  },
};