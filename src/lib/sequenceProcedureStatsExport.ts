/**
 * Exportação do relatório de procedimento (SOPs).
 *
 * Premissas: a mesma estrutura saneada por `parseSequenceProcedureStats` é a
 * fonte única da verdade — tela, CSV e PDF nunca divergem. O CSV é
 * multi-seção (RFC 4180, com BOM adicionado no download) e neutraliza
 * fórmulas para evitar CSV injection no Excel/Sheets.
 */

import { formatDuration, type SequenceProcedureStats } from "./sequenceProcedureStats";

export interface SequenceExportMeta {
  procedureTitle: string;
  days: number;
  generatedAt?: Date;
}

const RISKY_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: string): string {
  const safe = RISKY_PREFIX.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return escapeCell("");
  if (typeof value === "number") {
    return escapeCell(Number.isFinite(value) ? String(value) : "");
  }
  if (typeof value === "boolean") return escapeCell(value ? "sim" : "nao");
  return escapeCell(String(value));
}

function line(values: readonly unknown[]): string {
  return values.map(cell).join(",");
}

export const SEQUENCE_REPORT_SECTIONS = [
  "PARAMETROS",
  "RESUMO",
  "ETAPAS",
  "RANKING",
  "SERIE_DIARIA",
  "TENTATIVAS",
] as const;

function fmtDateTime(iso: string): string {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? new Date(ms).toLocaleString("pt-BR") : "—";
}

/** CSV multi-seção do relatório do procedimento. */
export function buildSequenceStatsCsv(
  stats: SequenceProcedureStats,
  meta: SequenceExportMeta,
): string {
  const generatedAt = meta.generatedAt ?? new Date();
  const out: string[] = [];

  out.push(line(["secao", "PARAMETROS"]));
  out.push(line(["campo", "valor"]));
  out.push(line(["procedimento", meta.procedureTitle]));
  out.push(line(["janela_dias", meta.days]));
  out.push(
    line([
      "gerado_em",
      Number.isFinite(generatedAt.getTime()) ? generatedAt.toISOString() : "",
    ]),
  );
  out.push("");

  out.push(line(["secao", "RESUMO"]));
  out.push(line(["metrica", "valor"]));
  out.push(line(["tentativas", stats.summary.attempts]));
  out.push(line(["participantes", stats.summary.players]));
  out.push(line(["tentativas_perfeitas", stats.summary.perfectAttempts]));
  out.push(line(["taxa_perfeitas_pct", stats.summary.perfectRate]));
  out.push(line(["precisao_media_pct", stats.summary.avgAccuracy]));
  out.push(line(["tempo_medio_ms", stats.summary.avgDurationMs]));
  out.push(line(["melhor_tempo_ms", stats.summary.bestDurationMs]));
  out.push(line(["moedas_pagas", stats.summary.coinsAwarded]));
  out.push(line(["xp_pago", stats.summary.xpAwarded]));
  out.push("");

  out.push(line(["secao", "ETAPAS"]));
  out.push(line(["posicao", "etapa", "avaliacoes", "acertos", "acerto_pct", "sem_amostra"]));
  for (const step of stats.steps) {
    out.push(
      line([step.position, step.label, step.evaluated, step.correct, step.accuracy, step.noSample]),
    );
  }
  out.push("");

  out.push(line(["secao", "RANKING"]));
  out.push(
    line([
      "posicao",
      "participante",
      "tentativas",
      "perfeitas",
      "melhor_precisao_pct",
      "melhor_tempo_ms",
      "moedas",
    ]),
  );
  stats.leaderboard.forEach((leader, index) => {
    out.push(
      line([
        index + 1,
        leader.displayName,
        leader.attempts,
        leader.perfectAttempts,
        leader.bestAccuracy,
        leader.bestDurationMs,
        leader.coinsAwarded,
      ]),
    );
  });
  out.push("");

  out.push(line(["secao", "SERIE_DIARIA"]));
  out.push(line(["dia", "tentativas", "perfeitas"]));
  for (const point of stats.daily) {
    out.push(line([point.day, point.attempts, point.perfectAttempts]));
  }
  out.push("");

  out.push(line(["secao", "TENTATIVAS"]));
  out.push(
    line([
      "data",
      "participante",
      "acertos",
      "etapas",
      "perfeita",
      "duracao_ms",
      "moedas",
      "xp",
    ]),
  );
  for (const attempt of stats.recent) {
    out.push(
      line([
        attempt.createdAt,
        attempt.displayName,
        attempt.correctPositions,
        attempt.stepsTotal,
        attempt.isPerfect,
        attempt.durationMs,
        attempt.coinsAwarded,
        attempt.xpAwarded,
      ]),
    );
  }

  return out.join("\r\n");
}

/** Nome de arquivo estável e saneado (sem path traversal). */
export function sequenceStatsFileName(
  meta: Pick<SequenceExportMeta, "procedureTitle" | "days">,
  ext: "csv" | "pdf",
  now: Date = new Date(),
): string {
  const stamp = Number.isFinite(now.getTime()) ? now.toISOString().slice(0, 10) : "sem-data";
  const slug = (meta.procedureTitle ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const window = meta.days > 0 ? `${Math.floor(meta.days)}d` : "total";
  return `sop-relatorio-${slug || "procedimento"}-${window}-${stamp}.${ext}`;
}

/** PDF de auditoria — jsPDF carregado sob demanda para não pesar o bundle. */
export async function exportSequenceStatsPdf(
  stats: SequenceProcedureStats,
  meta: SequenceExportMeta,
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const generatedAt = meta.generatedAt ?? new Date();
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Relatório do Procedimento — Ordene a Sequência", 14, 14);
  doc.setFontSize(9);
  doc.text(
    `${meta.procedureTitle} · Janela: ${meta.days} dia(s) · Gerado em ${generatedAt.toLocaleString("pt-BR")}`,
    14,
    21,
  );

  const headStyles = { fillColor: [30, 41, 59] as [number, number, number], textColor: 255 };
  const styles = { fontSize: 8, cellPadding: 2 };
  let y = 28;

  const section = (title: string, head: string[][], body: (string | number)[][]) => {
    doc.setFontSize(11);
    doc.text(title, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head,
      body: body.length > 0 ? body : [["—"]],
      styles,
      headStyles,
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    const finalY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
    y = finalY + 10;
    if (y > 175) {
      doc.addPage();
      y = 16;
    }
  };

  section("1. Resumo", [["Métrica", "Valor"]], [
    ["Tentativas", stats.summary.attempts],
    ["Participantes", stats.summary.players],
    ["Tentativas perfeitas", `${stats.summary.perfectAttempts} (${stats.summary.perfectRate}%)`],
    ["Precisão média", `${stats.summary.avgAccuracy}%`],
    ["Tempo médio", formatDuration(stats.summary.avgDurationMs)],
    ["Melhor tempo", formatDuration(stats.summary.bestDurationMs)],
    ["Moedas / XP pagos", `${stats.summary.coinsAwarded} / ${stats.summary.xpAwarded}`],
  ]);

  section(
    "2. Acerto por etapa",
    [["#", "Etapa", "Avaliações", "Acertos", "Acerto (%)"]],
    stats.steps.map((step) => [
      step.position,
      step.label,
      step.evaluated,
      step.correct,
      step.noSample ? "sem amostra" : `${step.accuracy}`,
    ]),
  );

  section(
    "3. Ranking do período",
    [["#", "Participante", "Tentativas", "Perfeitas", "Melhor precisão (%)", "Melhor tempo"]],
    stats.leaderboard.map((leader, index) => [
      index + 1,
      leader.displayName,
      leader.attempts,
      leader.perfectAttempts,
      leader.bestAccuracy,
      formatDuration(leader.bestDurationMs),
    ]),
  );

  section(
    "4. Últimas tentativas",
    [["Data", "Participante", "Acertos", "Duração", "Perfeita"]],
    stats.recent.map((attempt) => [
      fmtDateTime(attempt.createdAt),
      attempt.displayName,
      `${attempt.correctPositions}/${attempt.stepsTotal}`,
      formatDuration(attempt.durationMs),
      attempt.isPerfect ? "sim" : "não",
    ]),
  );

  doc.save(sequenceStatsFileName(meta, "pdf", generatedAt));
}