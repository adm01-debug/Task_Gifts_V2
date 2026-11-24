import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Gauge, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { MobilePageLayout } from "@/components/mobile";
import { useSEO } from "@/hooks/useSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { ClimateSurveyAnswerForm } from "@/components/climate/ClimateSurveyAnswerForm";
import {
  useClimateSurveys,
  useMyAnsweredSurveyIds,
  useSubmitSurveyResponse,
  useSurveyQuestions,
} from "@/hooks/useClimateSurveys";
import type { ClimateSurvey } from "@/services/climateSurveyService";

const isWithinPeriod = (survey: ClimateSurvey) => {
  const now = Date.now();
  return new Date(survey.starts_at).getTime() <= now && new Date(survey.ends_at).getTime() >= now;
};

function ClimateSurveyCard({
  survey,
  alreadyAnswered,
}: {
  survey: ClimateSurvey;
  alreadyAnswered: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: questions,
    isLoading: isLoadingQuestions,
    isError: isQuestionsError,
  } = useSurveyQuestions(isOpen ? survey.id : "");
  const submitResponse = useSubmitSurveyResponse();
  const withinPeriod = isWithinPeriod(survey);
  const isAnswered = alreadyAnswered && !submitResponse.isPending;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{survey.title}</CardTitle>
          <div className="flex flex-wrap gap-1">
            {isAnswered ? (
              <Badge variant="secondary">Respondida</Badge>
            ) : withinPeriod ? (
              <Badge>Disponível</Badge>
            ) : (
              <Badge variant="outline">Fora do período</Badge>
            )}
            {survey.is_anonymous && <Badge variant="outline">Anônima</Badge>}
          </div>
        </div>
        {survey.description && <CardDescription>{survey.description}</CardDescription>}
        <p className="text-xs text-muted-foreground">
          {new Date(survey.starts_at).toLocaleDateString("pt-BR")} até{" "}
          {new Date(survey.ends_at).toLocaleDateString("pt-BR")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnswered && (
          <p className="text-xs text-muted-foreground">
            Sua resposta foi registrada. Obrigado por participar!
          </p>
        )}

        {isOpen ? (
          isLoadingQuestions ? (
            <Skeleton className="h-40 w-full" />
          ) : isQuestionsError ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Não foi possível carregar as perguntas desta pesquisa. Feche e abra o
              formulário novamente; se o problema continuar, avise o time técnico.
            </p>
          ) : (questions ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Esta pesquisa ainda não tem perguntas cadastradas.
            </p>
          ) : (
            <ClimateSurveyAnswerForm
              survey={survey}
              questions={questions ?? []}
              isSubmitting={submitResponse.isPending}
              onSubmit={(answers) =>
                submitResponse.mutate(
                  { surveyId: survey.id, answers },
                  { onSuccess: () => setIsOpen(false) },
                )
              }
              onCancel={() => setIsOpen(false)}
            />
          )
        ) : (
          <Button onClick={() => setIsOpen(true)} disabled={isAnswered || !withinPeriod}>
            <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden />
            {isAnswered ? "Já respondida" : withinPeriod ? "Responder" : "Encerrada"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClimateSurveys() {
  const seoData = useSEO();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isAdmin, isManager } = useRBAC();
  const { data: surveys, isLoading, isError } = useClimateSurveys("active");
  const { data: answeredSurveyIds } = useMyAnsweredSurveyIds(user?.id);
  const answered = useMemo(() => new Set(answeredSurveyIds ?? []), [answeredSurveyIds]);
  const canManage = isAdmin || isManager;

  const content = (
    <main className="mx-auto max-w-4xl space-y-6 p-4 pb-24 md:p-6">
      {!isMobile && (
        <header className="mb-4 flex h-16 shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-xl font-bold">Pesquisa de Clima</h1>
          </div>
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/clima/admin">
                <Settings2 className="mr-2 h-4 w-4" aria-hidden />
                Gerenciar pesquisas
              </Link>
            </Button>
          )}
        </header>
      )}

      {canManage && isMobile && (
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to="/clima/admin">
            <Settings2 className="mr-2 h-4 w-4" aria-hidden />
            Gerenciar pesquisas
          </Link>
        </Button>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Não foi possível carregar as pesquisas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Recarregue a página. Se o problema continuar, avise o time técnico.
            </p>
          </CardContent>
        </Card>
      ) : (surveys ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Nenhuma pesquisa ativa no momento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quando o RH publicar uma nova pesquisa de clima, ela aparece aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(surveys ?? []).map((survey) => (
            <ClimateSurveyCard key={survey.id} survey={survey} alreadyAnswered={answered.has(survey.id)} />
          ))}
        </div>
      )}
    </main>
  );

  return (
    <PageShell title="Pesquisa de Clima">
      <PageWrapper pageName="Pesquisa de Clima" className="min-h-screen bg-background">
        <SEOHead {...seoData} />
        {isMobile ? (
          <MobilePageLayout title="Pesquisa de Clima" icon={Gauge} backPath="/">
            {content}
          </MobilePageLayout>
        ) : (
          content
        )}
      </PageWrapper>
    </PageShell>
  );
}