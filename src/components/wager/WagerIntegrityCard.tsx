import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert, Info, Download, History } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useWagerLeaderboard } from "@/hooks/useDailyWager";
import {
  useSaveWagerIntegrityReview,
  useWagerIntegrityReviews,
  useWagerIntegrityReviewEvents,
} from "@/hooks/useWagerIntegrityReviews";
import type { WagerIntegrityReviewEvent } from "@/services/wagerIntegrityReviewEventService";
import {
  reviewKey,
  type WagerReviewStatus,
} from "@/services/wagerIntegrityReviewService";
import {
  analyzeWagerIntegrity,
  integritySummary,
  severityLabel,
  type WagerAnomalySeverity,
} from "@/lib/wagerIntegrity";
import { windowLabel, type WagerLeaderboardWindow } from "@/lib/wagerLeaderboard";
import {
  buildWagerIntegrityCsv,
  wagerIntegrityFileName,
} from "@/lib/wagerIntegrityExport";
import { downloadCSV } from "@/lib/csvExport";
import { cn } from "@/lib/utils";

const WINDOWS: WagerLeaderboardWindow[] = [7, 30, 90];

const REVIEW_LABEL: Record<WagerReviewStatus, string> = {
  investigating: "Em apuração",
  confirmed: "Confirmada",
  false_positive: "Falso positivo",
};

/** Filtro de triagem: "pending" agrupa anomalias ainda sem desfecho humano. */
type ReviewFilter = "all" | "pending" | WagerReviewStatus;

const FILTERS: ReadonlyArray<{ value: ReviewFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "investigating", label: "Em apuração" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "false_positive", label: "Falso positivo" },
];

const SEVERITY_STYLE: Record<WagerAnomalySeverity, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "border-border bg-muted/40 text-muted-foreground",
};

function SeverityIcon({ severity }: { severity: WagerAnomalySeverity }) {
  if (severity === "critical") return <ShieldAlert className="h-4 w-4 shrink-0" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 shrink-0" />;
  return <Info className="h-4 w-4 shrink-0" />;
}

export interface WagerIntegrityCardProps {
  className?: string;
  limit?: number;
}

/**
 * Painel antifraude da Pergunta do Dia: cruza o ranking do período com o motor
 * estatístico e lista suspeitas para revisão humana.
 */
export function WagerIntegrityCard({ className, limit = 50 }: WagerIntegrityCardProps) {
  const [days, setDays] = useState<WagerLeaderboardWindow>(30);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const { data, isLoading } = useWagerLeaderboard(days, limit);
  const { data: reviews } = useWagerIntegrityReviews(days);
  const { data: events } = useWagerIntegrityReviewEvents(days);
  const saveReview = useSaveWagerIntegrityReview();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  /** Chaves com o histórico expandido. */
  const [openHistory, setOpenHistory] = useState<Record<string, boolean>>({});
  /** Rascunhos de observação por anomalia; ausência = usar a nota já salva. */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const report = useMemo(() => analyzeWagerIntegrity(data ?? []), [data]);
  const summary = useMemo(() => integritySummary(report), [report]);

  // Índice das apurações já registradas, para exibir desfecho e nota salva.
  const reviewIndex = useMemo(() => {
    const map = new Map<string, { status: WagerReviewStatus; notes: string }>();
    for (const review of reviews ?? []) {
      map.set(reviewKey(review.targetUserId, review.anomalyCode, review.windowDays), {
        status: review.status,
        notes: review.notes ?? "",
      });
    }
    return map;
  }, [reviews]);

  // Triagem: o filtro afeta apenas a exibição; a exportação segue completa
  // para que o snapshot auditável nunca dependa da visão do operador.
  const visibleAnomalies = useMemo(() => {
    if (filter === "all") return report.anomalies;
    return report.anomalies.filter((anomaly) => {
      const status = reviewIndex.get(reviewKey(anomaly.userId, anomaly.code, days))?.status;
      return filter === "pending" ? !status : status === filter;
    });
  }, [report.anomalies, reviewIndex, filter, days]);

  // Histórico agrupado por anomalia (usuário+código+janela), já ordenado desc.
  const eventIndex = useMemo(() => {
    const map = new Map<string, WagerIntegrityReviewEvent[]>();
    for (const event of events ?? []) {
      const key = reviewKey(event.targetUserId, event.anomalyCode, event.windowDays);
      const bucket = map.get(key);
      if (bucket) bucket.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  function formatMoment(iso: string): string {
    const date = new Date(iso);
    return Number.isFinite(date.getTime())
      ? date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      : "—";
  }

  /** Nota exibida: rascunho em edição tem precedência sobre a persistida. */
  function noteValue(key: string): string {
    return noteDrafts[key] ?? reviewIndex.get(key)?.notes ?? "";
  }

  async function handleReview(
    anomaly: (typeof report.anomalies)[number],
    status: WagerReviewStatus,
  ) {
    const key = reviewKey(anomaly.userId, anomaly.code, days);
    setPendingKey(key);
    try {
      await saveReview.mutateAsync({
        targetUserId: anomaly.userId,
        anomalyCode: anomaly.code,
        windowDays: days,
        status,
        metric: anomaly.metric,
        notes: noteValue(key),
      });
      // Descarta o rascunho: a fonte da verdade volta a ser o servidor.
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success(`Apuração registrada: ${REVIEW_LABEL[status]}.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Não foi possível registrar a apuração.";
      toast.error(message);
    } finally {
      setPendingKey(null);
    }
  }

  /** Extrai o snapshot auditável do período com o desfecho de cada apuração. */
  function handleExport() {
    if (report.anomalies.length === 0 && report.evaluated === 0) {
      toast.info("Sem dados suficientes para exportar neste período.");
      return;
    }
    const generatedAt = new Date();
    const csv = buildWagerIntegrityCsv({
      report,
      reviews: reviews ?? [],
      events: events ?? [],
      windowDays: days,
      generatedAt,
    });
    downloadCSV(wagerIntegrityFileName(days, generatedAt), csv);
    toast.success("Relatório de integridade exportado.");
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Integridade & Antifraude
          </CardTitle>
          <div className="flex gap-1">
            {WINDOWS.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={value === days ? "default" : "ghost"}
                onClick={() => setDays(value)}
              >
                {windowLabel(value)}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={isLoading}
              aria-label="Exportar relatório de integridade em CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Índice de saúde do jogo</span>
                <span className="font-semibold text-foreground">{report.healthScore}/100</span>
              </div>
              <Progress value={report.healthScore} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <p className="text-lg font-semibold text-foreground">{report.evaluated}</p>
                <p className="text-xs text-muted-foreground">Avaliados</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <p className="text-lg font-semibold text-foreground">{report.skipped}</p>
                <p className="text-xs text-muted-foreground">Amostra baixa</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <p className="text-lg font-semibold text-foreground">
                  {report.netDistributed.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Saldo líquido</p>
              </div>
            </div>

            {report.anomalies.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Nenhum sinal de anomalia neste período. O motor reavalia sempre que o
                ranking é atualizado.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por desfecho">
                  {FILTERS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={option.value === filter ? "secondary" : "ghost"}
                      className="h-7 text-xs"
                      aria-pressed={option.value === filter}
                      onClick={() => setFilter(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                {visibleAnomalies.length === 0 ? (
                  <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Nenhuma anomalia neste filtro. Ajuste a triagem para ver as demais
                    ({report.anomalies.length} no período).
                  </p>
                ) : (
              <ul className="space-y-2">
                {visibleAnomalies.map((anomaly, index) => (
                  <li
                    key={`${anomaly.code}-${anomaly.userId}-${index}`}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3",
                      SEVERITY_STYLE[anomaly.severity],
                    )}
                  >
                    <SeverityIcon severity={anomaly.severity} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {anomaly.displayName}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {severityLabel(anomaly.severity)}
                        </Badge>
                        {reviewIndex.has(reviewKey(anomaly.userId, anomaly.code, days)) && (
                          <Badge variant="secondary" className="text-[10px]">
                            {
                              REVIEW_LABEL[
                                reviewIndex.get(reviewKey(anomaly.userId, anomaly.code, days))!
                                  .status
                              ]
                            }
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{anomaly.title}</p>
                      <p className="text-xs text-muted-foreground">{anomaly.detail}</p>
                      <Textarea
                        value={noteValue(reviewKey(anomaly.userId, anomaly.code, days))}
                        onChange={(event) => {
                          const key = reviewKey(anomaly.userId, anomaly.code, days);
                          const value = event.target.value.slice(0, 2000);
                          setNoteDrafts((prev) => ({ ...prev, [key]: value }));
                        }}
                        placeholder="Observações da apuração (evidências, contexto, decisão)"
                        aria-label={`Observações da apuração de ${anomaly.displayName}`}
                        rows={2}
                        className="mt-2 min-h-[56px] resize-y bg-background/70 text-xs"
                      />
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(Object.keys(REVIEW_LABEL) as WagerReviewStatus[]).map((status) => (
                          <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={pendingKey === reviewKey(anomaly.userId, anomaly.code, days)}
                            onClick={() => void handleReview(anomaly, status)}
                          >
                            {REVIEW_LABEL[status]}
                          </Button>
                        ))}
                        {(eventIndex.get(reviewKey(anomaly.userId, anomaly.code, days))?.length ??
                          0) > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => {
                              const key = reviewKey(anomaly.userId, anomaly.code, days);
                              setOpenHistory((prev) => ({ ...prev, [key]: !prev[key] }));
                            }}
                          >
                            <History className="h-3.5 w-3.5" />
                            Histórico (
                            {eventIndex.get(reviewKey(anomaly.userId, anomaly.code, days))!.length})
                          </Button>
                        )}
                      </div>
                      {openHistory[reviewKey(anomaly.userId, anomaly.code, days)] && (
                        <ol className="mt-2 space-y-1 border-l border-border pl-3">
                          {eventIndex
                            .get(reviewKey(anomaly.userId, anomaly.code, days))!
                            .map((event) => (
                              <li key={event.id} className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {event.previousStatus
                                    ? `${REVIEW_LABEL[event.previousStatus]} → ${REVIEW_LABEL[event.newStatus]}`
                                    : REVIEW_LABEL[event.newStatus]}
                                </span>{" "}
                                · {event.changedByName ?? "Administrador"} ·{" "}
                                {formatMoment(event.createdAt)}
                                {event.notes ? (
                                  <span className="block italic">"{event.notes}"</span>
                                ) : null}
                              </li>
                            ))}
                        </ol>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}