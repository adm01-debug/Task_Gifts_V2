import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BOARD_TILE_TYPES, type BoardIssue, type TileDraft } from "@/lib/boardTrailAuthoring";

export interface BoardTileRowProps {
  index: number;
  tile: TileDraft;
  issues: BoardIssue[];
  challenges: ReadonlyArray<{ id: string; label: string }>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<TileDraft>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

const NO_CHALLENGE = "__none__";

function numberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function BoardTileRow({
  index,
  tile,
  issues,
  challenges,
  canMoveUp,
  canMoveDown,
  canRemove,
  onChange,
  onMove,
  onRemove,
}: BoardTileRowProps) {
  const hasError = issues.some((issue) => issue.severity === "error");

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/60 p-3 space-y-3",
        hasError && "border-destructive/60",
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="shrink-0 font-mono">
          #{index}
        </Badge>
        <Input
          value={tile.label}
          onChange={(event) => onChange({ label: event.target.value })}
          placeholder="Rótulo da casa"
          aria-label={`Rótulo da casa ${index}`}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mover casa para cima"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mover casa para baixo"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remover casa"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select
            value={tile.type}
            onValueChange={(value) => onChange({ type: value as TileDraft["type"] })}
          >
            <SelectTrigger aria-label={`Tipo da casa ${index}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOARD_TILE_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Moedas</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={500}
            value={tile.coins ?? ""}
            onChange={(event) => onChange({ coins: numberOrNull(event.target.value) })}
            aria-label={`Moedas da casa ${index}`}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">XP</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={800}
            value={tile.xp ?? ""}
            onChange={(event) => onChange({ xp: numberOrNull(event.target.value) })}
            aria-label={`XP da casa ${index}`}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Deslocar</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={-20}
            max={20}
            value={tile.moveBy ?? ""}
            onChange={(event) => onChange({ moveBy: numberOrNull(event.target.value) })}
            aria-label={`Deslocamento da casa ${index}`}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Desafio</Label>
          <Select
            value={tile.challengeId ?? NO_CHALLENGE}
            onValueChange={(value) =>
              onChange({ challengeId: value === NO_CHALLENGE ? null : value })
            }
          >
            <SelectTrigger aria-label={`Desafio da casa ${index}`}>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CHALLENGE}>Nenhum</SelectItem>
              {challenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {issues.length > 0 && (
        <ul className="space-y-1 text-xs">
          {issues.map((issue, issueIndex) => (
            <li
              key={`${issue.severity}-${issueIndex}`}
              className={cn(
                issue.severity === "error" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}