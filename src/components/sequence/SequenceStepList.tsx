import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SequenceStep } from "@/lib/sequenceGame";

export interface SequenceStepListProps {
  steps: SequenceStep[];
  /** Índices marcados como incorretos após a correção. */
  wrongIndexes?: number[];
  /** Quando verdadeiro, a lista fica somente leitura (após enviar). */
  locked?: boolean;
  revealed?: boolean;
  onMove: (from: number, to: number) => void;
}

export function SequenceStepList({
  steps,
  wrongIndexes,
  locked = false,
  revealed = false,
  onMove,
}: SequenceStepListProps) {
  const wrong = new Set(wrongIndexes ?? []);

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => {
        const isWrong = revealed && wrong.has(index);
        const isRight = revealed && !wrong.has(index);

        return (
          <motion.li
            key={step.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-card/70 p-3 backdrop-blur",
              isWrong && "border-destructive/60 bg-destructive/5",
              isRight && "border-emerald-500/60 bg-emerald-500/5",
              !revealed && "border-border/60",
            )}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary"
              aria-hidden
            >
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{step.label}</p>
              {step.hint ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
              ) : null}
            </div>

            {revealed ? (
              isWrong ? (
                <X className="h-4 w-4 shrink-0 text-destructive" aria-label="Posição incorreta" />
              ) : (
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-500"
                  aria-label="Posição correta"
                />
              )
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                <GripVertical
                  className="hidden h-4 w-4 text-muted-foreground sm:block"
                  aria-hidden
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11"
                  disabled={locked || index === 0}
                  aria-label={`Mover "${step.label}" para cima`}
                  onClick={() => onMove(index, index - 1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11"
                  disabled={locked || index === steps.length - 1}
                  aria-label={`Mover "${step.label}" para baixo`}
                  onClick={() => onMove(index, index + 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}