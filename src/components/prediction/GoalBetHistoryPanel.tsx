import { Download, History, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { computeGoalBetHistory } from "@/lib/goalBetHistory";
import {
  buildGoalBetHistoryCsv,
  goalBetHistoryCsvFilename,
} from "@/lib/goalBetHistoryCsv";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

export interface GoalBetHistoryPanelProps {
  markets: readonly PredictionMarketRow[];
  stakes: readonly PredictionStakeRow[];
  /** Quantidade máxima de linhas exibidas (padrão 5). */
  limit?: number;
  className?: string;
}

const num = (value: number) => Math.round(value).toLocaleString("pt-BR");
const pct = (value: number) => `${Math.round(value * 100)}%`;

const dateLabel = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

/** Histórico e ROI do apostador nos mercados já finalizados. */
export function GoalBetHistoryPanel({
  markets,
  stakes,
  limit = 5,
  className,
}: GoalBetHistoryPanelProps) {
  const history = computeGoalBetHistory(markets, stakes);
  if (history.items.length === 0) return null;

  const positive = history.netProfit >= 0;

  const handleExport = () => {
    // BOM garante acentuação correta ao abrir no Excel PT-BR.
    const blob = new Blob(["\uFEFF", buildGoalBetHistoryCsv(history)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = goalBetHistoryCsvFilename();
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm",
        className,
      )}
      aria-label="Meu histórico de apostas"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <History className="h-4 w-4 text-primary" aria-hidden />
          Meu histórico
        </h2>
        <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {history.hits}/{history.decided} acertos · {pct(history.hitRate)} ·{" "}
          <strong className={positive ? "text-primary" : "text-destructive"}>
            ROI {positive ? "+" : ""}
            {pct(history.roi)}
          </strong>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          onClick={handleExport}
          aria-label="Exportar histórico de apostas em CSV"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          CSV
        </Button>
        </div>
      </div>

      <ul className="mt-3 divide-y divide-border/50">
        {history.items.slice(0, limit).map((item) => (
          <li
            key={item.marketId}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              {item.voided ? (
                <Minus className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : item.hit ? (
                <TrendingUp className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
              )}
              <span className="truncate font-medium">{item.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {dateLabel(item.resolvedAt)}
              </span>
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                item.voided
                  ? "text-muted-foreground"
                  : item.profit >= 0
                    ? "text-primary"
                    : "text-destructive",
              )}
            >
              {item.voided ? "Devolvido" : `${item.profit >= 0 ? "+" : ""}${num(item.profit)}`}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Apostado {num(history.totalStaked)} · Recebido {num(history.totalReturned)} moedas
      </p>
    </section>
  );
}
