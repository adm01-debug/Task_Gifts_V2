/**
 * Exportação auditável do relatório de calibração da Trilha Tabuleiro.
 *
 * Premissas explícitas:
 * - `buildChallengeReport` é a ÚNICA fonte da verdade: o CSV nunca recalcula
 *   acurácia nem dificuldade por conta própria, então tela e planilha jamais
 *   divergem;
 * - RFC 4180: toda célula sai entre aspas, aspas internas são duplicadas e as
 *   linhas terminam em CRLF (Excel pt-BR);
 * - bloqueia CSV injection prefixando `'` em células iniciadas por
 *   `= + - @ TAB CR` (enunciados são texto livre digitado por gestores);
 * - determinística e livre de I/O — simulável em massa nos testes.
 */

import {
  buildChallengeReport,
  type BoardChallengeStatRow,
  type ChallengeDifficulty,
  type ChallengeFlag,
} from "./boardStats";

export const BOARD_CHALLENGE_CSV_HEADERS = [
  "casa",
  "pergunta",
  "tentativas",
  "acertos",
  "acerto_pct",
  "jogadores",
  "travados",
  "dificuldade",
  "alertas",
] as const;

const DIFFICULTY_CSV_LABEL: Record<ChallengeDifficulty, string> = {
  "sem-dados": "Sem dados",
  "muito-facil": "Facil demais",
  equilibrado: "Equilibrado",
  dificil: "Dificil",
  critico: "Critico",
};

const FLAG_CSV_LABEL: Record<ChallengeFlag, string> = {
  "amostra-insuficiente": "Amostra pequena",
  "revisar-enunciado": "Revisar enunciado",
  "recompensa-baixa-demais": "Aumentar dificuldade ou premio",
  "jogadores-travados": "Jogadores travados",
};

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
  return escapeCell(String(value));
}

export interface BoardChallengeCsvOptions {
  /** Rótulo da trilha, impresso como linha de contexto antes do cabeçalho. */
  trailLabel?: string | null;
  /** Injetável para testes determinísticos. */
  now?: Date;
}

/** Gera o conteúdo CSV (com BOM) do relatório de calibração. */
export function buildBoardChallengeCsv(
  rows: BoardChallengeStatRow[] | null | undefined,
  options: BoardChallengeCsvOptions = {},
): string {
  const report = buildChallengeReport(rows);
  const now = options.now ?? new Date();
  const stamp = Number.isFinite(now.getTime()) ? now.toISOString() : "";

  const lines: string[] = [
    [
      cell("Trilha"),
      cell(options.trailLabel ?? "Geral"),
      cell("Gerado em"),
      cell(stamp),
      cell("Acerto global (%)"),
      cell(report.overallAccuracy),
      cell("Tentativas"),
      cell(report.totalAttempts),
      cell("Travados"),
      cell(report.blockedPlayers),
    ].join(","),
    "",
    BOARD_CHALLENGE_CSV_HEADERS.map(escapeCell).join(","),
  ];

  for (const item of report.items) {
    lines.push(
      [
        cell(item.tile_position),
        cell(item.question),
        cell(item.attempts),
        cell(item.correct_attempts),
        cell(item.accuracyPct),
        cell(item.distinct_players),
        cell(item.blocked_players),
        cell(DIFFICULTY_CSV_LABEL[item.difficulty]),
        cell(item.flags.map((f) => FLAG_CSV_LABEL[f]).join(" | ")),
      ].join(","),
    );
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Nome de arquivo estável e seguro para o sistema de arquivos. */
export function boardChallengeFileName(
  trailLabel?: string | null,
  now: Date = new Date(),
): string {
  const stamp = Number.isFinite(now.getTime()) ? now.toISOString().slice(0, 10) : "sem-data";
  const slug = (trailLabel ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `tabuleiro-calibracao-${slug || "geral"}-${stamp}.csv`;
}
