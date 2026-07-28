/**
 * PDF de auditoria do relatório de calibração da Trilha Tabuleiro.
 *
 * Premissas explícitas:
 * - reaproveita `buildChallengeReport` como fonte única da verdade — PDF, CSV e
 *   tela mostram exatamente os mesmos números;
 * - jsPDF é importado sob demanda para não pesar o bundle inicial;
 * - a seção "Prioridades" repete apenas o subconjunto já classificado pelo
 *   motor (`needsAttention`), sem nenhuma regra estatística nova aqui;
 * - a montagem do documento é isolada em `buildBoardChallengePdfModel`, que é
 *   pura e determinística — é ela que os testes exercitam em massa.
 */

import {
  buildChallengeReport,
  type BoardChallengeStatRow,
  type ChallengeDifficulty,
  type ChallengeFlag,
} from "./boardStats";
import { boardChallengeFileName } from "./boardStatsExport";

const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  "sem-dados": "Sem dados",
  "muito-facil": "Fácil demais",
  equilibrado: "Equilibrado",
  dificil: "Difícil",
  critico: "Crítico",
};

const FLAG_LABEL: Record<ChallengeFlag, string> = {
  "amostra-insuficiente": "Amostra pequena",
  "revisar-enunciado": "Revisar enunciado",
  "recompensa-baixa-demais": "Aumentar dificuldade ou prêmio",
  "jogadores-travados": "Jogadores travados",
};

export interface BoardChallengePdfModel {
  title: string;
  subtitle: string;
  head: string[][];
  body: (string | number)[][];
  /** Linhas do bloco de prioridades; vazio = nada a recalibrar. */
  attentionBody: (string | number)[][];
  fileName: string;
}

export interface BoardChallengePdfOptions {
  trailLabel?: string | null;
  /** Injetável para testes determinísticos. */
  now?: Date;
}

function fmtStamp(now: Date): string {
  return Number.isFinite(now.getTime()) ? now.toLocaleString("pt-BR") : "—";
}

/** Camada pura: monta o conteúdo do PDF sem tocar em jsPDF nem no DOM. */
export function buildBoardChallengePdfModel(
  rows: BoardChallengeStatRow[] | null | undefined,
  options: BoardChallengePdfOptions = {},
): BoardChallengePdfModel {
  const report = buildChallengeReport(rows);
  const now = options.now ?? new Date();
  const label = options.trailLabel?.trim() || "Geral";

  return {
    title: "Calibração dos Desafios — Trilha Tabuleiro",
    subtitle:
      `Trilha: ${label} · Gerado em ${fmtStamp(now)} · ` +
      `Acerto global ${report.overallAccuracy}% em ${report.totalAttempts} tentativa(s) · ` +
      `${report.blockedPlayers} jogador(es) travado(s)`,
    head: [["Casa", "Pergunta", "Tent.", "Acertos", "Acerto %", "Jogadores", "Travados", "Dificuldade", "Alertas"]],
    body: report.items.map((item) => [
      item.tile_position,
      item.question,
      item.attempts,
      item.correct_attempts,
      `${item.accuracyPct}%`,
      item.distinct_players,
      item.blocked_players,
      DIFFICULTY_LABEL[item.difficulty],
      item.flags.map((f) => FLAG_LABEL[f]).join(", ") || "—",
    ]),
    attentionBody: report.needsAttention.map((item) => [
      item.tile_position,
      item.question,
      `${item.accuracyPct}%`,
      item.blocked_players,
      item.flags.map((f) => FLAG_LABEL[f]).join(", "),
    ]),
    fileName: boardChallengeFileName(options.trailLabel, now).replace(/\.csv$/, ".pdf"),
  };
}

export async function exportBoardChallengePdf(
  rows: BoardChallengeStatRow[] | null | undefined,
  options: BoardChallengePdfOptions = {},
): Promise<void> {
  const model = buildBoardChallengePdfModel(rows, options);
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  const styles = { fontSize: 8, cellPadding: 2 };
  const headStyles = { fillColor: [30, 41, 59] as [number, number, number], textColor: 255 };

  doc.setFontSize(14);
  doc.text(model.title, 14, 14);
  doc.setFontSize(9);
  doc.text(model.subtitle, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: model.head,
    body: model.body.length ? model.body : [["—", "Sem casas de desafio configuradas", "", "", "", "", "", "", ""]],
    styles,
    headStyles,
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: { 1: { cellWidth: 90 } },
  });

  if (model.attentionBody.length) {
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 26;
    let y = lastY + 10;
    if (y > 170) {
      doc.addPage();
      y = 16;
    }
    doc.setFontSize(11);
    doc.text("Prioridades de recalibração", 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [["Casa", "Pergunta", "Acerto %", "Travados", "Alertas"]],
      body: model.attentionBody,
      styles,
      headStyles: { fillColor: [153, 27, 27] as [number, number, number], textColor: 255 },
      columnStyles: { 1: { cellWidth: 110 } },
    });
  }

  doc.save(model.fileName);
}
