import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemoryCard } from "@/lib/memoryGame";

export interface MemoryBoardProps {
  cards: ReadonlyArray<MemoryCard>;
  /** Ids das cartas viradas no momento (máx. 2). */
  flippedIds: ReadonlyArray<string>;
  /** Ids dos pares já resolvidos. */
  matchedPairIds: ReadonlyArray<string>;
  disabled?: boolean;
  onFlip: (card: MemoryCard) => void;
}

export function MemoryBoard({
  cards,
  flippedIds,
  matchedPairIds,
  disabled = false,
  onFlip,
}: MemoryBoardProps) {
  return (
    <div
      className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      role="grid"
      aria-label="Tabuleiro do jogo da memória"
    >
      {cards.map((card, index) => {
        const isMatched = matchedPairIds.includes(card.pairId);
        const isFlipped = isMatched || flippedIds.includes(card.id);

        return (
          <motion.button
            key={card.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.3) }}
            onClick={() => onFlip(card)}
            disabled={disabled || isFlipped}
            aria-pressed={isFlipped}
            aria-label={isFlipped ? card.label : `Carta ${index + 1} virada para baixo`}
            className={cn(
              "flex min-h-[92px] items-center justify-center rounded-xl border p-3 text-center text-sm font-semibold",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isMatched
                ? "border-primary/50 bg-primary/10 text-primary"
                : isFlipped
                  ? "border-border bg-card text-foreground"
                  : "border-border/60 bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {isMatched ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                <span className="line-clamp-3">{card.label}</span>
              </span>
            ) : isFlipped ? (
              <span className="line-clamp-4">{card.label}</span>
            ) : (
              <span className="text-2xl" aria-hidden>
                ?
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}