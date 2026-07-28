import { Progress } from "@/components/ui/progress";
import { CARD_RARITIES, RARITY_LABEL, type CollectionProgress } from "@/lib/tradingCards";

export interface CollectionProgressBarProps {
  progress: CollectionProgress;
}

/** Resumo do álbum: completude geral e por raridade — o principal gancho de retorno. */
export function CollectionProgressBar({ progress }: CollectionProgressBarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Álbum completo</p>
        <p className="text-sm text-muted-foreground">
          {progress.ownedCards}/{progress.totalCards} · {progress.completionPct}%
        </p>
      </div>
      <Progress value={progress.completionPct} aria-label="Progresso do álbum" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CARD_RARITIES.map((rarity) => (
          <div key={rarity} className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {RARITY_LABEL[rarity]}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {progress.byRarity[rarity].owned}/{progress.byRarity[rarity].total}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {progress.duplicates} repetida{progress.duplicates === 1 ? "" : "s"} disponíveis para troca.
      </p>
    </div>
  );
}
