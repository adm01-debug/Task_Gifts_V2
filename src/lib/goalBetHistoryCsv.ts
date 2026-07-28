import type { GoalBetHistorySummary } from "@/lib/goalBetHistory";

export const GOAL_BET_CSV_HEADER = [
  "data",
  "mercado",
  "apostado",
  "retornado",
  "lucro",
  "resultado",
] as const;

/**
 * Escapa um campo para CSV compatível com Excel PT-BR:
 * aspas duplicadas, campo entre aspas quando contém separador/quebra, e
 * prefixo de segurança contra injeção de fórmula (=, +, -, @).
 */
export function escapeCsvField(value: string | number): string {
  let text = typeof value === "number" ? String(value) : value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/["\n\r;,]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function outcome(item: GoalBetHistorySummary["items"][number]): string {
  if (item.voided) return "Anulado";
  return item.hit ? "Acerto" : "Erro";
}

/**
 * Gera o CSV (separador ";") do histórico de apostas, incluindo linha de
 * totais. Determinístico e sem acesso ao DOM — testável isoladamente.
 */
export function buildGoalBetHistoryCsv(history: GoalBetHistorySummary): string {
  const lines: string[] = [GOAL_BET_CSV_HEADER.join(";")];

  for (const item of history.items) {
    lines.push(
      [
        formatDate(item.resolvedAt),
        item.title,
        Math.round(item.staked),
        Math.round(item.returned),
        Math.round(item.profit),
        outcome(item),
      ]
        .map(escapeCsvField)
        .join(";"),
    );
  }

  lines.push(
    [
      "",
      "TOTAL",
      Math.round(history.totalStaked),
      Math.round(history.totalReturned),
      Math.round(history.netProfit),
      `${history.hits}/${history.decided}`,
    ]
      .map(escapeCsvField)
      .join(";"),
  );

  return lines.join("\r\n");
}

/** Nome de arquivo estável e seguro para download. */
export function goalBetHistoryCsvFilename(now: Date = new Date()): string {
  const stamp = Number.isNaN(now.getTime())
    ? "sem-data"
    : now.toISOString().slice(0, 10);
  return `apostas-historico-${stamp}.csv`;
}
