import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoardChallenge, useResolveBoardChallenge } from "@/hooks/useBoardTrail";
import { BOARD_CHALLENGE_MAX_ATTEMPTS, buildChallengeDedupeKey } from "@/lib/boardChallenge";
import { getErrorMessage } from "@/lib/errorMessages";
import { cn } from "@/lib/utils";

export interface BoardChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trailId: string;
  userId: string;
  challengeId: string;
  /** Tentativas já registradas no servidor para este desafio. */
  attemptsUsed: number;
}

export function BoardChallengeDialog({
  open,
  onOpenChange,
  trailId,
  userId,
  challengeId,
  attemptsUsed,
}: BoardChallengeDialogProps) {
  const { data: challenge, isLoading } = useBoardChallenge(open ? challengeId : null);
  const resolve = useResolveBoardChallenge(trailId);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open, challengeId]);

  const attempt = Math.min(attemptsUsed + 1, BOARD_CHALLENGE_MAX_ATTEMPTS);

  const handleSubmit = useCallback(async () => {
    if (!selected) return;
    try {
      const result = await resolve.mutateAsync({
        optionId: selected,
        dedupeKey: buildChallengeDedupeKey(trailId, userId, challengeId, attempt),
      });

      if (result.correct) {
        const parts: string[] = ["Resposta correta!"];
        if (result.coins_delta) parts.push(`+${result.coins_delta} moedas`);
        if (result.xp_delta) parts.push(`+${result.xp_delta} XP`);
        toast.success(parts.join(" · "));
      } else if (result.unblocked) {
        toast.warning("Resposta incorreta. A casa foi liberada, mas sem recompensa.");
      } else {
        toast.warning(
          `Resposta incorreta. Você ainda tem ${result.attempts_left} tentativa(s) — valendo metade do prêmio.`,
        );
      }

      if (result.unblocked) onOpenChange(false);
      else setSelected(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  }, [selected, resolve, trailId, userId, challengeId, attempt, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(next) => !resolve.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-5 w-5 text-primary" aria-hidden />
            Desafio da casa
          </DialogTitle>
          <DialogDescription>
            Responda corretamente para liberar a casa e receber a recompensa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Badge variant={attempt === 1 ? "secondary" : "destructive"}>
            Tentativa {attempt} de {BOARD_CHALLENGE_MAX_ATTEMPTS}
          </Badge>
          {attempt > 1 && (
            <span className="text-xs text-muted-foreground">Recompensa reduzida pela metade</span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !challenge ? (
          <p className="text-sm text-muted-foreground">
            Desafio indisponível. Feche e tente novamente — a casa será liberada automaticamente.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{challenge.question}</p>
            <div className="space-y-2" role="radiogroup" aria-label="Alternativas do desafio">
              {challenge.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected === option.id}
                  onClick={() => setSelected(option.id)}
                  disabled={resolve.isPending}
                  className={cn(
                    "min-h-11 w-full rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected === option.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selected || resolve.isPending}
          className="w-full"
        >
          {resolve.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Confirmar resposta
        </Button>
      </DialogContent>
    </Dialog>
  );
}