import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Play, Plus, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { MobilePageLayout } from "@/components/mobile";
import { useSEO } from "@/hooks/useSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { ClimateSurveyForm, type NewClimateSurvey } from "@/components/climate/ClimateSurveyForm";
import { ClimateSurveyQuestions } from "@/components/climate/ClimateSurveyQuestions";
import { ClimateSurveyResults } from "@/components/climate/ClimateSurveyResults";
import {
  useClimateSurveys,
  useCreateClimateSurvey,
  useCreateSurveyQuestion,
  useDeleteSurveyQuestion,
  useSurveyQuestions,
  useUpdateClimateSurvey,
} from "@/hooks/useClimateSurveys";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  active: "Ativa",
  completed: "Encerrada",
  cancelled: "Cancelada",
};

export default function ClimateSurveyAdmin() {
  const seoData = useSEO();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isAdmin } = useRBAC();

  const { data: surveys, isLoading, isError } = useClimateSurveys();
  const createSurvey = useCreateClimateSurvey();
  const updateSurvey = useUpdateClimateSurvey();
  const addQuestion = useCreateSurveyQuestion();
  const removeQuestion = useDeleteSurveyQuestion();

  const [isCreating, setIsCreating] = useState(false);
  const [requestedId, setRequestedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    const list = surveys ?? [];
    if (requestedId) {
      const match = list.find((survey) => survey.id === requestedId);
      if (match) return match;
    }
    return list[0] ?? null;
  }, [surveys, requestedId]);

  const setSelectedId = setRequestedId;

  const { data: questions, isLoading: isLoadingQuestions } = useSurveyQuestions(selected?.id ?? "");
  const canManage = Boolean(selected) && (isAdmin || selected?.created_by === user?.id);
  const questionCount = questions?.length ?? 0;

  const handleCreate = (survey: NewClimateSurvey) => {
    createSurvey.mutate(survey, {
      onSuccess: (created) => {
        setIsCreating(false);
        setSelectedId(created.id);
      },
    });
  };

  const handleStatusChange = (status: string) => {
    if (!selected) return;
    updateSurvey.mutate({ id: selected.id, updates: { status } });
  };

  const content = (
    <main className="mx-auto max-w-5xl space-y-6 p-4 pb-24 md:p-6">
      {!isMobile && (
        <header className="mb-4 flex h-16 shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-xl font-bold">Pesquisa de Clima — Gestão</h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/clima">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Área do colaborador
            </Link>
          </Button>
        </header>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Crie a pesquisa, cadastre as perguntas por pilar e publique para o time responder.
        </p>
        <Button size="sm" onClick={() => setIsCreating((previous) => !previous)} disabled={!user?.id}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          {isCreating ? "Fechar" : "Nova pesquisa"}
        </Button>
      </div>

      {isCreating && user?.id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova pesquisa de clima</CardTitle>
          </CardHeader>
          <CardContent>
            <ClimateSurveyForm
              creatorId={user.id}
              isSubmitting={createSurvey.isPending}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-56 w-full" />
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
            <p className="text-sm font-medium">Nenhuma pesquisa de clima criada ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use o botão “Nova pesquisa” para montar a primeira.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <aside className="space-y-2" aria-label="Pesquisas de clima">
            {(surveys ?? []).map((survey) => (
              <button
                key={survey.id}
                type="button"
                onClick={() => setSelectedId(survey.id)}
                aria-current={survey.id === selected?.id}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  survey.id === selected?.id ? "border-primary bg-accent" : ""
                }`}
              >
                <span className="block truncate text-sm font-medium">{survey.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-1">
                  <Badge variant={survey.status === "active" ? "default" : "secondary"}>
                    {STATUS_LABELS[survey.status] ?? survey.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(survey.starts_at).toLocaleDateString("pt-BR")} —{" "}
                    {new Date(survey.ends_at).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </span>
              </button>
            ))}
          </aside>

          {selected && (
            <section className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base">{selected.title}</CardTitle>
                    <Badge variant={selected.status === "active" ? "default" : "secondary"}>
                      {STATUS_LABELS[selected.status] ?? selected.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selected.description && (
                    <p className="text-sm text-muted-foreground">{selected.description}</p>
                  )}

                  {!canManage && (
                    <p className="text-xs text-muted-foreground">
                      Somente quem criou a pesquisa (ou um administrador) pode editar perguntas e publicar.
                    </p>
                  )}

                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      {selected.status !== "active" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange("active")}
                          disabled={updateSurvey.isPending || questionCount === 0}
                        >
                          <Play className="mr-2 h-4 w-4" aria-hidden />
                          Publicar para o time
                        </Button>
                      )}
                      {selected.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange("completed")}
                          disabled={updateSurvey.isPending}
                        >
                          <Square className="mr-2 h-4 w-4" aria-hidden />
                          Encerrar pesquisa
                        </Button>
                      )}
                      {selected.status !== "active" && questionCount === 0 && (
                        <p className="self-center text-xs text-muted-foreground">
                          Cadastre ao menos uma pergunta para publicar.
                        </p>
                      )}
                    </div>
                  )}

                  {isLoadingQuestions ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <ClimateSurveyQuestions
                      survey={selected}
                      questions={questions ?? []}
                      canManage={canManage}
                      isAdding={addQuestion.isPending}
                      isRemoving={removeQuestion.isPending}
                      onAdd={(question) => addQuestion.mutate(question)}
                      onRemove={(questionId) =>
                        removeQuestion.mutate({ questionId, surveyId: selected.id })
                      }
                    />
                  )}
                </CardContent>
              </Card>

              <ClimateSurveyResults surveyId={selected.id} />
            </section>
          )}
        </div>
      )}
    </main>
  );

  return (
    <PageShell title="Pesquisa de Clima — Gestão">
      <PageWrapper pageName="Gestão de Clima" className="min-h-screen bg-background">
        <SEOHead {...seoData} />
        {isMobile ? (
          <MobilePageLayout title="Gestão de Clima" icon={ClipboardList} backPath="/clima">
            {content}
          </MobilePageLayout>
        ) : (
          content
        )}
      </PageWrapper>
    </PageShell>
  );
}