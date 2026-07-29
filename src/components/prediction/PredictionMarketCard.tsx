import { useState } from "react";
import { ChartLine, Clock, Coins, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { OddsHistoryChart } from "./OddsHistoryChart";
import { GoalBetCountdownBadge } from "./GoalBetCountdownBadge";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

export interface PredictionMarketCardProps {
  market: PredictionMarketRow;
  myStakes: PredictionStakeRow[];
  onStake: (market: PredictionMarketRow, optionId: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  locked: "Fechado",
  settled: "Apurado",
  voided: "Anulado",
};

/** Multiplicador bruto exibido ao usuário (já descontada a taxa da casa). */
function odds(market: PredictionMarketRow, pool: number): number {
  if (pool <= 0) return 0;
  const distributable =
    market.total_pool - Math.floor((market.total_pool * market.rake_bps) / 10_000);
  return distributable / pool;
}

export function PredictionMarketCard({
  market,
  myStakes,
  onStake,
}: PredictionMarketCardProps) {
  const mine = myStakes.filter((s) => s.market_id === market.id);
  const myOptionId = mine[0]?.option_id;
  const myTotal = mine.reduce((acc, s) => acc + s.amount, 0);
  const locked = market.status !== "open" || new Date(market.locks_at) <= new Date();
  const [showHistory, setShowHistory] = useState(false);
  // Rascunho não tem série pública e mercado sem pote não tem o que mostrar.
  const canShowHistory = market.status !== "draft" && market.total_pool > 0;

  return (
    <Card className="flex flex-col border-border/60 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{market.title}</CardTitle>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={market.status === "open" ? "default" : "secondary"}>
              {STATUS_LABEL[market.status] ?? market.status}
            </Badge>
            <GoalBetCountdownBadge market={market} />
          </div>
        </div>
        {market.description ? (
          <p className="text-sm text-muted-foreground">{market.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" aria-hidden />
            {market.total_pool} no pote
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Fecha {new Date(market.locks_at).toLocaleString("pt-BR")}
          </span>
          {market.rake_bps > 0 ? (
            <span>Taxa {(market.rake_bps / 100).toFixed(1)}%</span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {market.options.map((option) => {
          const share =
            market.total_pool > 0 ? (option.pool / market.total_pool) * 100 : 0;
          const isMine = option.id === myOptionId;
          const isWinner = option.id === market.winning_option_id;
          return (
            <div
              key={option.id}
              className={cn(
                "rounded-lg border border-border/60 p-3 transition-colors",
                isMine && "border-primary/60 bg-primary/5",
                isWinner && "border-emerald-500/60 bg-emerald-500/10",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  {odds(market, option.pool) > 0
                    ? `${odds(market, option.pool).toFixed(2)}x`
                    : "—"}
                </span>
              </div>
              <Progress value={share} className="mt-2 h-1.5" />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {option.pool} moedas · {share.toFixed(0)}%
                </span>
                <Button
                  size="sm"
                  variant={isMine ? "secondary" : "outline"}
                  className="h-8"
                  disabled={locked || (!!myOptionId && !isMine)}
                  onClick={() => onStake(market, option.id)}
                >
                  {isMine ? "Aumentar" : "Apostar"}
                </Button>
              </div>
            </div>
          );
        })}

        {myTotal > 0 ? (
          <p className="mt-auto text-xs text-muted-foreground">
            Seu aporte: <strong>{myTotal}</strong> moedas
            {market.status === "settled" || market.status === "voided"
              ? ` · retorno: ${mine.reduce((acc, s) => acc + (s.payout ?? 0), 0)} moedas`
              : ""}
          </p>
        ) : null}

        {canShowHistory ? (
          <div className="mt-auto space-y-3 border-t border-border/60 pt-3">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-full justify-center"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((open) => !open)}
            >
              <ChartLine className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {showHistory ? "Ocultar evolução" : "Ver evolução das cotações"}
            </Button>
            {/* Montagem tardia: a consulta só dispara quando o usuário abre. */}
            {showHistory ? <OddsHistoryChart market={market} /> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
