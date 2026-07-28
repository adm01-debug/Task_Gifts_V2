import { Coins, Gift, Loader2, Lock, Sparkles, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { setLabel, type SetMilestone } from "@/lib/cardSetRewards";
import type { SetMilestoneRow, SetRewardRow } from "@/services/tradingCardsService";

export interface SetRewardsPanelProps {
  sets: readonly SetRewardRow[];
  onClaim: (setCode: string, milestone: SetMilestone) => void;
  claimingKey?: string | null;
  isLoading?: boolean;
  className?: string;
}

function milestoneState(entry: SetMilestoneRow): "claimable" | "claimed" | "locked" {
  if (entry.claimable) return "claimable";
  if (entry.claimed) return "claimed";
  return "locked";
}

/**
 * Marcos de recompensa por coleção — o motivo econômico para completar o álbum.
 * O valor exibido vem do servidor; a tela nunca calcula prêmio.
 */
export function SetRewardsPanel({
  sets,
  onClaim,
  claimingKey,
  isLoading,
  className,
}: SetRewardsPanelProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-border bg-card/60 p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Carregando recompensas da coleção...
        </div>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border p-6 text-center", className)}>
        <Gift className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Nenhuma coleção ativa no momento.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {sets.map((set) => {
        const pct =
          set.total_cards > 0 ? Math.round((set.owned_cards / set.total_cards) * 1000) / 10 : 0;
        const pending = set.milestones.filter((m) => m.claimable);
        const pendingCoins = pending.reduce((sum, m) => sum + m.coins, 0);

        return (
          <section
            key={set.set_code}
            className="space-y-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur"
            aria-label={setLabel(set.set_code)}
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">{setLabel(set.set_code)}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {set.owned_cards}/{set.total_cards} cartas · {pct}%
              </p>
            </header>

            <Progress value={pct} aria-label={`Progresso de ${setLabel(set.set_code)}`} />

            {pendingCoins > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {pendingCoins} moeda{pendingCoins === 1 ? "" : "s"} disponível para resgate
              </p>
            )}

            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {set.milestones.map((entry) => {
                const state = milestoneState(entry);
                const key = `${set.set_code}:${entry.milestone}`;
                const isClaiming = claimingKey === key;

                return (
                  <li
                    key={entry.milestone}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors",
                      state === "claimable" && "border-primary/60 bg-primary/5",
                      state === "claimed" && "border-border bg-muted/40",
                      state === "locked" && "border-dashed border-border bg-transparent",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{entry.milestone}%</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" aria-hidden />
                        {entry.coins} moedas · {entry.xp} XP
                      </p>
                      {state === "locked" && (
                        <p className="text-[11px] text-muted-foreground">
                          Faltam {Math.max(entry.cards_required - set.owned_cards, 0)} carta
                          {entry.cards_required - set.owned_cards === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>

                    {state === "claimable" && (
                      <Button
                        size="sm"
                        className="min-h-11 shrink-0"
                        disabled={isClaiming}
                        onClick={() => onClaim(set.set_code, entry.milestone)}
                      >
                        {isClaiming ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          "Resgatar"
                        )}
                      </Button>
                    )}
                    {state === "claimed" && (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        Resgatado
                      </span>
                    )}
                    {state === "locked" && (
                      <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}