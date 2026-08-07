import { motion } from "framer-motion";
import { Flag, Gift, HelpCircle, MapPin, Skull, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoardTile, BoardTileType } from "@/lib/boardTrail";

const TILE_STYLES: Record<BoardTileType, string> = {
  start: "bg-muted text-muted-foreground border-border",
  neutral: "bg-card text-card-foreground border-border",
  bonus: "bg-primary/15 text-primary border-primary/40",
  penalty: "bg-destructive/15 text-destructive border-destructive/40",
  challenge: "bg-accent/20 text-accent-foreground border-accent/50",
  checkpoint: "bg-secondary/30 text-secondary-foreground border-secondary",
  finish: "bg-primary/25 text-primary border-primary",
};

const TILE_ICONS: Record<BoardTileType, typeof Star> = {
  start: MapPin,
  neutral: Star,
  bonus: Gift,
  penalty: Skull,
  challenge: HelpCircle,
  checkpoint: MapPin,
  finish: Flag,
};

export interface BoardPathProps {
  tiles: BoardTile[];
  currentPosition: number;
  checkpoints?: number[];
  className?: string;
}

/** Renderiza o tabuleiro em grade responsiva com o peão do jogador. */
export function BoardPath({
  tiles,
  currentPosition,
  checkpoints = [],
  className,
}: BoardPathProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7",
        className,
      )}
      role="list"
      aria-label="Tabuleiro da trilha"
    >
      {tiles.map((tile) => {
        const Icon = TILE_ICONS[tile.type] ?? Star;
        const isCurrent = tile.position === currentPosition;
        const reached = checkpoints.includes(tile.position);
        return (
          <motion.div
            key={tile.id}
            role="listitem"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(tile.position, 12) * 0.02 }}
            className={cn(
              "relative flex min-h-[88px] flex-col justify-between rounded-xl border p-2 text-xs backdrop-blur-sm",
              TILE_STYLES[tile.type] ?? TILE_STYLES.neutral,
              isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <div className="flex items-center justify-between gap-1">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="font-mono text-[10px] opacity-70">{tile.position}</span>
            </div>
            <span className="line-clamp-2 font-medium leading-tight">{tile.label}</span>
            <div className="flex items-center gap-2 text-[10px] opacity-80">
              {tile.coins ? <span>{tile.coins} moedas</span> : null}
              {tile.xp ? <span>{tile.xp} XP</span> : null}
              {tile.moveBy ? <span>{tile.moveBy > 0 ? "+" : ""}{tile.moveBy} casas</span> : null}
            </div>
            {reached && !isCurrent ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
            ) : null}
            {isCurrent ? (
              <motion.span
                layoutId="board-pawn"
                className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow"
              >
                Você
              </motion.span>
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}