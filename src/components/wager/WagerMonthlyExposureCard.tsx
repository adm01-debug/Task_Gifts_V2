import { useMemo } from "react";
import { AlertTriangle, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  aggregateMonthlyExposure,
  budgetUsage,
  type WagerMonthExposure,
} from "@/lib/wagerMonthlyExposure";
import type { AdminWagerQuestion } from "@/services/wagerAdminService";

export interface WagerMonthlyExposureCardProps {
  questions: readonly AdminWagerQuestion[] | undefined;
  expectedPlayers: number;
  monthlyBudget: number;
  onMonthlyBudgetChange: (value: number) => void;
  className?: string;
}

const NUMBER = new Intl.NumberFormat("pt-BR");

function usageTone(usage: number | null): string {
  if (usage === null) return "text-muted-foreground";
  if (usage >= 1) return "text-destructive";
  if (usage >= 0.75) return "text-warning";
  return "text-muted-foreground";
}

function MonthRow({ month, budget }: { month: WagerMonthExposure; budget: number }) {
  const usage = budgetUsage(month.worstCase, budget);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold capitalize">{month.label}</span>
        <Badge variant="outline">
          {month.activeQuestions}/{month.questions} ativa(s)
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Pior caso{" "}
        <span className={cn("font-semibold", usageTone(usage))}>
          {NUMBER.format(month.worstCase)}
        </span>{" "}
        moedas · apostado {NUMBER.format(month.staked)} · liquidado{" "}
        {NUMBER.format(month.settled)}
      </p>
      {month.accuracy !== null && (
        <p className="text-xs text-muted-foreground">
          Acurácia observada: {(month.accuracy * 100).toFixed(0)}% em{" "}
          {NUMBER.format(month.entries)} aposta(s)
        </p>
      )}
      {usage !== null && (
        <div className="mt-2 space-y-1">
          <Progress value={Math.min(100, usage * 100)} className="h-1.5" />
          <p className={cn("text-[11px]", usageTone(usage))}>
            {(usage * 100).toFixed(0)}% do orçamento mensal
            {usage >= 1 && " — acima do limite definido"}
          </p>
        </div>
      )}
    </div>
  );
}

export function WagerMonthlyExposureCard({
  questions,
  expectedPlayers,
  monthlyBudget,
  onMonthlyBudgetChange,
  className,
}: WagerMonthlyExposureCardProps) {
  const summary = useMemo(
    () => aggregateMonthlyExposure(questions, expectedPlayers),
    [questions, expectedPlayers],
  );

  const peakUsage = budgetUsage(summary.peakMonth?.worstCase ?? 0, monthlyBudget);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" /> Exposição por mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="wager-monthly-budget">Orçamento mensal de moedas</Label>
          <Input
            id="wager-monthly-budget"
            type="number"
            min={0}
            step={100}
            value={monthlyBudget}
            onChange={(e) =>
              onMonthlyBudgetChange(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
            }
          />
          <p className="text-xs text-muted-foreground">
            Pior caso considera {NUMBER.format(Math.max(0, expectedPlayers))} participante(s)
            apostando o teto e acertando.
          </p>
        </div>

        {summary.months.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma pergunta agendada para projetar exposição.
          </p>
        )}

        {summary.months.length > 0 && (
          <>
            {peakUsage !== null && peakUsage >= 1 && summary.peakMonth && (
              <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="capitalize">{summary.peakMonth.label}</span> pode estourar o
                orçamento: {NUMBER.format(summary.peakMonth.worstCase)} moedas no pior caso.
              </p>
            )}

            <div className="space-y-2">
              {summary.months.map((month) => (
                <MonthRow key={month.month} month={month} budget={monthlyBudget} />
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 shrink-0" />
              Total: {NUMBER.format(summary.totals.worstCase)} moedas de pior caso em{" "}
              {NUMBER.format(summary.totals.questions)} pergunta(s) · liquidado{" "}
              {NUMBER.format(summary.totals.settled)}.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
