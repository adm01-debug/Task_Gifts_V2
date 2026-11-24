import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnonymityGuardNotice } from "@/components/engagement/diagnostics/AnonymityGuardNotice";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import { useENPS, usePillarScores, useRecalculatePillarScores } from "@/hooks/useClimateSurveys";

const enpsTone = (enps: number) =>
  enps >= 50 ? "text-emerald-600" : enps >= 0 ? "text-amber-600" : "text-destructive";

const pillarTone = (score: number) =>
  score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-destructive";

export function ClimateSurveyResults({ surveyId }: { surveyId: string }) {
  const { data: enps, isLoading: isLoadingEnps, isError: enpsError } = useENPS(surveyId);
  const { data: pillarScores, isLoading: isLoadingPillars, isError: pillarsError } = usePillarScores(surveyId);
  const recalculate = useRecalculatePillarScores();

  if (enpsError || pillarsError) {
    return (
      <Card className="border-dashed">
        <CardContent className="space-y-1 py-8 text-center">
          <p className="text-sm font-medium">Motor de resultados indisponível</p>
          <p className="mx-auto max-w-md text-xs text-muted-foreground">
            As respostas continuam sendo gravadas, mas o cálculo de eNPS e de pilares ainda não está ativo
            neste ambiente. Avise o time técnico para aplicar a atualização do banco.
          </p>
        </CardContent>
      </Card>
    );
  }

  const pillars = [...(pillarScores ?? [])].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Resultados</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => recalculate.mutate({ surveyId })}
          disabled={recalculate.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${recalculate.isPending ? "animate-spin" : ""}`} aria-hidden />
          {recalculate.isPending ? "Calculando..." : "Recalcular resultados"}
        </Button>
      </div>

      {isLoadingEnps ? (
        <Skeleton className="h-36 w-full" />
      ) : enps?.suppressed ? (
        enps.total < enps.min_responses && enps.response_count >= enps.min_responses ? (
          <Card className="border-dashed">
            <CardContent className="space-y-1 py-8 text-center">
              <p className="text-sm font-medium">eNPS precisa de uma pergunta de 0 a 10</p>
              <p className="mx-auto max-w-md text-xs text-muted-foreground">
                {enps.response_count} resposta(s) registrada(s), mas nenhuma pergunta de eNPS
                (escala 0 a 10) foi respondida. Inclua uma pergunta do tipo NPS — ou de escala
                de 0 a 10 — para calcular o eNPS.
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnonymityGuardNotice context={`${enps.response_count} resposta(s) registrada(s) até agora.`} />
        )
      ) : enps ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">eNPS</CardTitle>
            <CardDescription>
              {enps.response_count} resposta(s) — mínimo de {enps.min_responses} para divulgar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={`text-4xl font-bold ${enpsTone(enps.enps)}`}>{enps.enps}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border p-2">
                <p className="text-lg font-semibold">{enps.promoters}</p>
                <p className="text-[11px] text-muted-foreground">Promotores (9-10)</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-lg font-semibold">{enps.passives}</p>
                <p className="text-[11px] text-muted-foreground">Neutros (7-8)</p>
              </div>
              <div className="rounded-md border p-2">
                <p className="text-lg font-semibold">{enps.detractors}</p>
                <p className="text-[11px] text-muted-foreground">Detratores (0-6)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {isLoadingPillars ? (
          <Skeleton className="h-24 w-full" />
        ) : pillars.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-xs text-muted-foreground">
              Nenhum pilar calculado ainda. São necessárias pelo menos 5 respostas por pilar.
            </CardContent>
          </Card>
        ) : (
          pillars.map((pillar) => (
            <div key={pillar.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{PILLAR_LABELS[pillar.pillar]?.pt ?? pillar.pillar}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{pillar.response_count} respostas</Badge>
                  <span className={`text-sm font-semibold ${pillarTone(pillar.score)}`}>{pillar.score.toFixed(1)}</span>
                </span>
              </div>
              <Progress value={pillar.score} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}