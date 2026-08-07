import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeGoalBetPosition } from "@/lib/goalBetPosition";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

export interface MyGoalBetPositionProps {
  market: PredictionMarketRow | null;
  stakes: readonly PredictionStakeRow[];
  className?: string;
}

const coins = (value: number) => `${Math.round(value).toLocaleString("pt-BR")} moedas`;

/** Resumo da posição do usuário no mercado: aportes, odds e retorno projetado. */
export function MyGoalBetPosition({ market, stakes, className }: MyGoalBetPositionProps) {
  const position = computeGoalBetPosition(market, stakes);
  if (position.entries.length === 0) return null;

  const positive = position.projectedProfit >= 0;
  const returnLabel = position.settled ? "Resultado" : "Se acertar";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm",
        className,
      )}
      aria-label="Minha posição na aposta de meta"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4 text-primary" aria-hidden />
          Minha posição
        </span>
        <span className="text-xs text-muted-foreground">
          Apostado: <strong className="text-foreground">{coins(position.totalStaked)}</strong>
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {position.entries.map((entry) => (
          <li
            key={entry.optionId}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{entry.label}</span>
              {position.settled && entry.isWinner && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Vencedor
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {coins(entry.staked)} · {entry.multiplier.toFixed(2)}x ·{" "}
              <strong className="text-foreground">{coins(entry.projectedReturn)}</strong>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
        <span className="text-muted-foreground">{returnLabel}</span>
        <span
          className={cn(
            "flex items-center gap-1 font-bold",
            positive ? "text-primary" : "text-destructive",
          )}
        >
          {positive ? (
            <TrendingUp className="h-4 w-4" aria-hidden />
          ) : (
            <TrendingDown className="h-4 w-4" aria-hidden />
          )}
          {coins(position.projectedReturn)}
          <span className="text-xs font-medium text-muted-foreground">
            ({positive ? "+" : ""}
            {Math.round(position.projectedProfit).toLocaleString("pt-BR")})
          </span>
        </span>
      </div>

      {!position.settled && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Projeção baseada nos aportes atuais; as odds mudam até o travamento do mercado.
        </p>
      )}
    </div>
  );
}
