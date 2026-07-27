import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import {
  buildDirectoryIndex,
  resolveRows,
  type DirectoryEntry,
  type ParseResult,
  type ResolvedResultRow,
} from "@/lib/campaignImport";

/** Lote de importacao persistido. */
export interface CampaignImport {
  id: string;
  campaign_id: string;
  file_name: string;
  source: string;
  status: "pending" | "applied" | "reverted" | "failed";
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  applied_rows: number;
  skipped_rows: number;
  total_amount: number;
  error_message: string | null;
  summary: Record<string, unknown> | null;
  applied_at: string | null;
  reverted_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CampaignImportRow {
  id: string;
  import_id: string;
  row_number: number;
  seller_identifier: string;
  user_id: string | null;
  amount: number;
  reference_date: string | null;
  external_reference: string | null;
  dedupe_key: string;
  status: string;
  error_reason: string | null;
}

/** Desempenho consolidado de um colaborador a partir dos lotes já aplicados. */
export interface CampaignUserResult {
  user_id: string;
  /** Soma dos valores efetivamente contabilizados. */
  amount: number;
  /** Quantidade de lançamentos aplicados. */
  entries: number;
  /** Data de referência mais recente (ISO) ou null quando ausente. */
  last_reference_date: string | null;
}

// Cast controlado: as tabelas existem no schema gerado, mas o client tipado
// exige narrowing exaustivo que nao agrega valor aqui.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Insere linhas em blocos para nao estourar o limite de payload do PostgREST. */
async function insertInChunks(rows: Record<string, unknown>[], chunkSize = 500): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await db.from("campaign_result_rows").insert(rows.slice(i, i + chunkSize));
    if (error) throw error;
  }
}

export const campaignImportService = {
  /** Carrega o diretorio de colaboradores para resolucao de identificadores. */
  async loadDirectory(): Promise<DirectoryEntry[]> {
    const { data, error } = await db
      .from("profiles")
      .select("id, email, personal_email, cpf, employee_id, display_name");
    if (error) throw error;
    return (data ?? []) as DirectoryEntry[];
  },

  /** Resolve as linhas do arquivo contra o diretorio (sem gravar nada). */
  async resolveParsed(parsed: ParseResult): Promise<ResolvedResultRow[]> {
    const directory = await this.loadDirectory();
    return resolveRows(parsed.rows, buildDirectoryIndex(directory));
  },

  /** Cria o lote em estado `pending` com todas as linhas ja resolvidas. */
  async createImport(params: {
    campaignId: string;
    fileName: string;
    rows: ResolvedResultRow[];
    source?: string;
  }): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Nao autenticado");

    const valid = params.rows.filter((r) => r.status === "valid");
    const totalAmount = valid.reduce((acc, r) => acc + r.amount, 0);

    const { data: imp, error } = await db
      .from("campaign_result_imports")
      .insert({
        campaign_id: params.campaignId,
        file_name: params.fileName.slice(0, 200),
        source: params.source ?? "spreadsheet",
        status: "pending",
        total_rows: params.rows.length,
        valid_rows: valid.length,
        error_rows: params.rows.length - valid.length,
        total_amount: totalAmount,
        created_by: user.id,
        summary: { sellers: new Set(valid.map((r) => r.userId)).size },
      })
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!imp?.id) throw new Error("Falha ao criar o lote de importacao");

    try {
      await insertInChunks(
        params.rows.map((r) => ({
          import_id: imp.id,
          campaign_id: params.campaignId,
          row_number: r.rowNumber,
          seller_identifier: r.sellerIdentifier.slice(0, 180),
          user_id: r.userId,
          amount: r.amount,
          reference_date: r.referenceDate,
          external_reference: r.externalReference,
          dedupe_key: r.dedupeKey,
          status: r.status === "valid" ? "valid" : "invalid",
          error_reason: r.errorReason,
        })),
      );
    } catch (err) {
      // Lote sem linhas e inutil: marca como falho para nao poluir a fila.
      await db
        .from("campaign_result_imports")
        .update({ status: "failed", error_message: err instanceof Error ? err.message : "erro desconhecido" })
        .eq("id", imp.id);
      throw err;
    }

    return imp.id as string;
  },

  /** Aplica o lote de forma transacional no servidor. */
  async applyImport(importId: string): Promise<{ applied: number; skipped: number; total_amount: number }> {
    const { data, error } = await db.rpc("apply_campaign_import", { _import_id: importId });
    if (error) throw error;
    return data as { applied: number; skipped: number; total_amount: number };
  },

  /** Reverte um lote ja aplicado, devolvendo o progresso ao estado anterior. */
  async revertImport(importId: string): Promise<{ reverted: number }> {
    const { data, error } = await db.rpc("revert_campaign_import", { _import_id: importId });
    if (error) throw error;
    return data as { reverted: number };
  },

  async listImports(campaignId: string): Promise<CampaignImport[]> {
    try {
      const { data, error } = await db
        .from("campaign_result_imports")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CampaignImport[];
    } catch (err) {
      logger.apiError("list campaign_result_imports", err, "campaignImportService");
      return [];
    }
  },

  async listRows(importId: string, onlyErrors = false): Promise<CampaignImportRow[]> {
    let q = db
      .from("campaign_result_rows")
      .select("*")
      .eq("import_id", importId)
      .order("row_number", { ascending: true })
      .limit(500);
    if (onlyErrors) q = q.neq("status", "applied");
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CampaignImportRow[];
  },
};
