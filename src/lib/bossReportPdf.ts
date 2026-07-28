/**
 * PDF de auditoria do relatório consolidado do Chefão.
 *
 * Premissas: reaproveita `buildBossReport` como fonte única da verdade (mesmos
 * números do CSV e da tela), importa jsPDF sob demanda para não pesar o bundle
 * e mantém uma seção por bloco, na mesma ordem do CSV.
 */

import { formatDuration } from "./bossHistory";
import {
  GOAL_STATUS_LABEL,
  SEVERITY_LABEL,
  bossReportFileName,
  pct,
  resolveDepartmentName,
  type BossReport,
  type DepartmentNames,
} from "./bossReport";

function fmtDate(iso: string | null): string {
  if (!iso) return "início";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleString("pt-BR");
}

export async function exportBossReportPdf(
  report: BossReport,
  names?: DepartmentNames,
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const { meta, history } = report;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text("Relatório Consolidado — Chefão Departamental", 14, 14);
  doc.setFontSize(9);
  doc.text(
    `Recorte: ${meta.departmentLabel} · Janela: ${meta.days > 0 ? `${meta.days} dias` : "todo o histórico"} · ` +
      `Meta: ${pct(meta.target)}% (tolerância ${meta.tolerancePp} pp)`,
    14,
    21,
  );
  doc.text(
    `Período: ${fmtDate(meta.from)} → ${fmtDate(meta.to)} · ${meta.consideredBattles} batalha(s) concluída(s)` +
      (meta.excludedUndated > 0 ? ` · ${meta.excludedUndated} sem data confiável` : ""),
    14,
    26,
  );

  const headStyles = { fillColor: [30, 41, 59] as [number, number, number], textColor: 255 };
  const styles = { fontSize: 8, cellPadding: 2 };
  let y = 32;

  const section = (title: string, head: string[][], body: (string | number)[][]) => {
    doc.setFontSize(11);
    doc.text(title, 14, y);
    autoTable(doc, { startY: y + 3, head, body, styles, headStyles,
      alternateRowStyles: { fillColor: [245, 247, 250] } });
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
    y = finalY + 10;
    if (y > 175) {
      doc.addPage();
      y = 16;
    }
  };

  section("1. Resumo (Hall da Fama)", [["Métrica", "Valor"]], [
    ["Batalhas concluídas", history.concluded],
    ["Vitórias / Derrotas", `${history.victories} / ${history.defeats}`],
    ["Taxa de vitória", `${pct(history.winRate)}%`],
    ["HP destruído médio", `${pct(history.avgHpDestroyedPct)}%`],
    ["HP destruído total", history.totalHpDestroyed.toLocaleString("pt-BR")],
    ["Abate mais rápido", formatDuration(history.fastestKillMs)],
    ["Abate médio", formatDuration(history.avgKillMs)],
    ["Moedas / XP pagos", `${history.coinsAwarded} / ${history.xpAwarded}`],
    ["Aguardando apuração", history.awaitingSettlement],
    ["Maior sequência de vitórias", history.longestVictoryStreak],
  ]);

  section(
    "2. Tendência mensal",
    [["Mês", "Batalhas", "Vitórias", "Derrotas", "Taxa (%)", "HP destruído"]],
    report.trend.points.map((p) => [
      p.label, p.battles, p.victories, p.defeats, pct(p.winRate), p.hpDestroyed,
    ]),
  );

  section(
    "3. Comparativo entre departamentos",
    [["#", "Departamento", "Batalhas", "V", "D", "Taxa (%)", "Ajustada (%)", "HP", "Moedas", "XP"]],
    report.comparison.rows.map((r) => [
      r.rank, resolveDepartmentName(r.departmentId, names), r.battles, r.victories,
      r.defeats, pct(r.winRate), pct(r.adjustedWinRate), r.hpDestroyed, r.coinsAwarded, r.xpAwarded,
    ]),
  );

  section(
    "4. Metas de aproveitamento",
    [["Departamento", "Batalhas", "Taxa (%)", "Anterior (%)", "Delta (pp)", "Gap meta (pp)", "Status", "Severidade"]],
    report.goals.rows.map((r) => [
      resolveDepartmentName(r.departmentId, names),
      r.battles,
      pct(r.winRate),
      r.previousAdjustedWinRate === null ? "—" : pct(r.previousAdjustedWinRate),
      r.deltaPp === null ? "—" : r.deltaPp,
      r.gapToTargetPp,
      GOAL_STATUS_LABEL[r.status],
      SEVERITY_LABEL[r.severity],
    ]),
  );

  doc.save(bossReportFileName(meta, "pdf", new Date(Date.parse(meta.generatedAt) || Date.now())));
}