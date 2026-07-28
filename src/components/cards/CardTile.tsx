import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { RARITY_LABEL, type CardRarity } from "@/lib/tradingCards";

const RARITY_STYLE: Record<CardRarity, string> = {
  common: "border-border bg-muted/40 text-muted-foreground",
  rare: "border-primary/40 bg-primary/10 text-primary",
  epic: "border-accent/50 bg-accent/15 text-accent-foreground",
  legendary: "border-warning/60 bg-warning/15 text-warning",
};

export interface CardTileProps {
  code: string;
  name: string;
  description?: string | null;
  rarity: CardRarity;
  quantity: number;
}

/** Carta do álbum. Não possuída aparece silhuetada, preservando o efeito de coleção. */
export function CardTile({ code, name, description, rarity, quantity }: CardTileProps) {
  const owned = quantity > 0;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col gap-1 rounded-xl border p-3 transition-all",
        owned ? RARITY_STYLE[rarity] : "border-dashed border-border bg-muted/20",
        owned && "hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">{code}</span>
        {quantity > 1 && (
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-foreground">
            x{quantity}
          </span>
        )}
      </div>

      {owned ? (
        <>
          <p className="text-sm font-semibold leading-tight text-foreground">{name}</p>
          {description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-muted-foreground">
          <Lock className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs">Não obtida</span>
        </div>
      )}

      <span className="mt-auto pt-1 text-[10px] font-medium uppercase tracking-wide opacity-80">
        {RARITY_LABEL[rarity]}
      </span>
    </div>
  );
}
