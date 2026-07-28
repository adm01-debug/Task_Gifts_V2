/**
 * Exportação auditável do relatório de Integridade & Antifraude (Wager).
 *
 * Por que existe: o painel é efêmero (recalculado a cada render). Auditoria
 * interna, RH e compliance precisam de um artefato imutável com o estado das
 * suspeitas e o desfecho humano de cada apuração no momento da extração.
 *
 * Premissas explícitas:
 * - Função pura e determinística: `generatedAt` é injetável.
 * - Anomalias sem apuração registrada saem como "Pendente" (nunca vazio),
 *   para que a ausência de decisão fique explícita no documento.
 * - Segurança: células iniciadas por `=`, `+`, `-`, `@`, TAB ou CR recebem
 *   apóstrofo defensivo (CSV injection no Excel/Sheets).
 */

import type { WagerIntegrityReport } from "./wagerIntegrity";
import { severityLabel } from "./wagerIntegrity";
import type {
  WagerIntegrityReview,
  WagerReviewStatus,
} from "@/services/wagerIntegrityReviewService";
import { reviewKey } from "@/services/wagerIntegrityReviewService";

const RISKY_PREFIX = /^[=+\-@\t\r]/;
const DELIMITER = ";";

const ANOMALY_LABEL: Record<string, string> = {
  accuracy_outlier: "Acurácia improvável",
  perfect_streak: "Sequência perfeita",
  net_drain: "Drenagem de saldo",
  volume_spike: "Pico de volume",
  stale_activity: "Top player inativo",
};

const REVIEW_LABEL: Record<WagerReviewStatus, string> = {
  investigating: "Em apuração",
  confirmed: "Confirmada",
  false_positive: "Falso positivo",
};

/** Rótulo do código de anomalia; desconhecidos retornam o próprio código. */
export function anomalyCodeLabel(code: string): string {
  return ANOMALY_LABEL[code] ?? String(code ?? "");
}

/** Rótulo do desfecho da apuração; ausência vira "Pendente". */
export function reviewStatusLabel(status: WagerReviewStatus | undefined): string {
  return status ? REVIEW_LABEL[status] ?? "Pendente" : "Pendente";
}

function escapeCell(value: string): string {
  const safe = RISKY_PREFIX.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return escapeCell("");
  if (typeof value === "number") {
    // Números são seguros por definição: não recebem o apóstrofo defensivo,
    // caso contrário valores negativos viriam como texto na planilha.
    return Number.isFinite(value) ? `"${value}"` : '""';
  }
  return escapeCell(String(value));
}

function line(values: readonly unknown[]): string {
  return values.map(cell).join(DELIMITER);
}

function formatDateTime(date: Date): string {
  const valid = date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date(0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(valid.getDate())}/${pad(valid.getMonth() + 1)}/${valid.getFullYear()} ${pad(
    valid.getHours(),
  )}:${pad(valid.getMinutes())}`;
}

export interface WagerIntegrityExportInput {
  report: WagerIntegrityReport;
  reviews?: readonly WagerIntegrityReview[];
  windowDays: number;
  generatedAt?: Date;
}

/** Índice apuração-por-chave, tolerante a entradas malformadas. */
export function buildReviewIndex(
  reviews: readonly WagerIntegrityReview[] | undefined,
): Map<string, WagerIntegrityReview> {
  const map = new Map<string, WagerIntegrityReview>();
  for (const review of reviews ?? []) {
    if (!review || typeof review.targetUserId !== "string" || !review.targetUserId) continue;
    map.set(reviewKey(review.targetUserId, review.anomalyCode, review.windowDays), review);
  }
  return map;
}

/**
 * Gera o CSV do relatório. Cabeçalho de metadados vem antes da tabela para
 * que o arquivo seja autoexplicativo fora do sistema.
 */
export function buildWagerIntegrityCsv(input: WagerIntegrityExportInput): string {
  const { report, reviews, windowDays } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const index = buildReviewIndex(reviews);

  const rows: string[] = [
    line(["Relatório de Integridade & Antifraude — Pergunta do Dia"]),
    line(["Gerado em", formatDateTime(generatedAt)]),
    line(["Janela (dias)", windowDays]),
    line(["Índice de saúde", report.healthScore]),
    line(["Jogadores avaliados", report.evaluated]),
    line(["Amostra insuficiente", report.skipped]),
    line(["Moedas líquidas distribuídas", report.netDistributed]),
    line(["Anomalias detectadas", report.anomalies.length]),
    "",
    line([
      "jogador",
      "user_id",
      "severidade",
      "tipo",
      "titulo",
      "detalhe",
      "metrica",
      "apuracao",
      "observacoes",
      "atualizado_em",
    ]),
  ];

  for (const anomaly of report.anomalies) {
    const review = index.get(reviewKey(anomaly.userId, anomaly.code, windowDays));
    rows.push(
      line([
        anomaly.displayName,
        anomaly.userId,
        severityLabel(anomaly.severity),
        anomalyCodeLabel(anomaly.code),
        anomaly.title,
        anomaly.detail,
        anomaly.metric,
        reviewStatusLabel(review?.status),
        review?.notes ?? "",
        review?.updatedAt ? formatDateTime(new Date(review.updatedAt)) : "",
      ]),
    );
  }

  return rows.join("\r\n");
}

/** Nome de arquivo estável e ordenável (ISO curto). */
export function wagerIntegrityFileName(windowDays: number, generatedAt = new Date()): string {
  const valid = Number.isFinite(generatedAt.getTime()) ? generatedAt : new Date(0);
  const iso = valid.toISOString().slice(0, 10);
  return `integridade-wager-${windowDays}d-${iso}.csv`;
}
