import { format } from "date-fns";
import {
  RISK_LEVEL_DEADLINE_DAYS,
  RISK_LEVEL_LABEL,
  requiresActionPlan,
  type Nr1RiskRow,
} from "@/services/nr1RiskService";
import { downloadCSV, toCSV } from "@/lib/csvExport";

export interface Nr1ExportContext {
  /** Nome do recorte (departamento ou "Toda a empresa"). */
  scope: string;
  /** Janela de análise em dias. */
  days: number;
  /** Momento da geração — injetável para testes determinísticos. */
  generatedAt?: Date;
}

export interface Nr1ExportRow extends Record<string, string> {
  categoria: string;
  base_legal: string;
  clima: string;
  probabilidade: string;
  severidade: string;
  grau_risco: string;
  nivel: string;
  plano_obrigatorio: string;
  prazo_dias: string;
  fatores: string;
  respondentes: string;
}

const num = (v: number | null | undefined, decimals = 1): string =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toFixed(decimals);

/** Normaliza a matriz de riscos para linhas planas auditáveis (CSV/PDF). */
export function buildNr1ExportRows(rows: Nr1RiskRow[]): Nr1ExportRow[] {
  return rows.map((row) => {
    const deadline = RISK_LEVEL_DEADLINE_DAYS[row.risk_level];
    return {
      categoria: row.category_name,
      base_legal: row.legal_reference ?? "—",
      clima: num(row.score),
      probabilidade: num(row.probability),
      severidade: `${num(row.severity_weight)}x`,
      grau_risco: num(row.risk_grade, 2),
      nivel: RISK_LEVEL_LABEL[row.risk_level],
      plano_obrigatorio: requiresActionPlan(row.risk_level) ? "Sim" : "Não",
      prazo_dias: deadline === null ? "—" : String(deadline),
      fatores: String(row.factors_evaluated ?? 0),
      respondentes: String(row.respondents ?? 0),
    };
  });
}

/** Nome de arquivo determinístico e seguro para sistemas de arquivos. */
export function nr1ExportFilename(ctx: Nr1ExportContext, ext: "csv" | "pdf"): string {
  const slug = ctx.scope
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "geral";
  const stamp = format(ctx.generatedAt ?? new Date(), "yyyy-MM-dd_HHmm");
  return `inventario-nr1_${slug}_${ctx.days}d_${stamp}.${ext}`;
}

export function exportNr1Csv(rows: Nr1RiskRow[], ctx: Nr1ExportContext): void {
  const csv = toCSV(buildNr1ExportRows(rows));
  downloadCSV(nr1ExportFilename(ctx, "csv"), csv);
}

/** PDF de auditoria com cabeçalho legal e tabela do inventário. */
export async function exportNr1Pdf(rows: Nr1RiskRow[], ctx: Nr1ExportContext): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const generatedAt = ctx.generatedAt ?? new Date();
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Inventário de Riscos Psicossociais — NR-1 / ISO 45003", 14, 14);
  doc.setFontSize(9);
  doc.text(
    `Recorte: ${ctx.scope} · Janela: ${ctx.days} dias · Gerado em ${format(generatedAt, "dd/MM/yyyy HH:mm")} · ${rows.length} categoria(s)`,
    14,
    21,
  );

  const body = buildNr1ExportRows(rows).map((r) => [
    r.categoria,
    r.base_legal,
    r.clima,
    r.probabilidade,
    r.severidade,
    r.grau_risco,
    r.nivel,
    r.plano_obrigatorio,
    r.prazo_dias,
    r.respondentes,
  ]);

  autoTable(doc, {
    startY: 27,
    head: [[
      "Categoria", "Base legal", "Clima", "Probab.", "Severid.",
      "Grau", "Nível", "Plano", "Prazo (dias)", "Respond.",
    ]],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === "body") {
        const value = String(data.cell.raw);
        if (value === "Crítico") data.cell.styles.textColor = [220, 38, 38];
        else if (value === "Alto") data.cell.styles.textColor = [202, 138, 4];
      }
    },
  });

  doc.save(nr1ExportFilename({ ...ctx, generatedAt }, "pdf"));
}
