import { ShieldAlert, Star, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { useAuth } from "@/hooks/useAuth";
import { useFeedbackSummary } from "@/hooks/useFeedback360";

const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Autoavaliação",
  manager: "Gestor",
  peer: "Pares",
  direct_report: "Liderados",
};

/**
 * Resumo consolidado dos feedbacks que o usuário logado recebeu.
 * Só entram respostas não anônimas: a policy "Receivers can view non-anonymous
 * feedback" esconde as anônimas de quem recebe (elas ficam visíveis para admin).
 */
export function FeedbackSummaryCard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useFeedbackSummary(user?.id);

  const hasContent =
    !!data &&
    (data.totalResponses > 0 ||
      data.commonStrengths.length > 0 ||
      data.commonImprovements.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Meu resumo de feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Carregando seu resumo..." />
        ) : isError ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">
              Não foi possível carregar seu resumo de feedback.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !hasContent ? (
          <EmptyState
            icon={Star}
            title="Nenhum feedback recebido ainda"
            description="Assim que alguém responder um pedido sobre você, o consolidado aparece aqui."
          />
        ) : (
          <div className="space-y-5">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{data.avgRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground pb-1">
                média em {data.totalResponses}{" "}
                {data.totalResponses === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>

            {Object.keys(data.byRelationship).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Por tipo de avaliador</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.byRelationship).map(([relationship, info]) => (
                    <Badge key={relationship} variant="secondary">
                      {RELATIONSHIP_LABELS[relationship] ?? relationship}:{" "}
                      {info.avgRating.toFixed(1)} ({info.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Pontos fortes mais citados
                </p>
                {data.commonStrengths.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada citado ainda.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {data.commonStrengths.map(text => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Pontos a desenvolver mais citados
                </p>
                {data.commonImprovements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada citado ainda.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {data.commonImprovements.map(text => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Feedbacks enviados como anônimos não aparecem neste resumo — nem na média. Eles ficam
              visíveis apenas para administradores.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}