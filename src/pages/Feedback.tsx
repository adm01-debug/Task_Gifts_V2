import { MessageCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useFeedback360 } from "@/hooks/useFeedback360";
import { Badge } from "@/components/ui/badge";
 import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { LoadingState, EmptyState } from "@/components/ui/states";
import type { FeedbackCycle, FeedbackRequest } from "@/services/feedbackService";
import { DesktopBackButton, GlobalBreadcrumbs } from "@/components/navigation";

export default function Feedback() {
  const navigate = useNavigate();
  const { cycles, pendingRequests, isLoading } = useFeedback360();
  const seoData = useSEO();

  if (isLoading) {
    return (
      <PageWrapper pageName="Feedback" className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Carregando feedbacks..." />
      </PageWrapper>
    );
  }

  return (
    <PageShell title="Feedback 360°">
      <div className="min-h-screen bg-background">
        <SEOHead {...seoData} />
        <div className="flex h-16 shrink-0 items-center gap-2 px-4 md:px-6">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Feedback 360°</h1>
        </div>

      <main className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Ciclos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {cycles.length === 0 ? (
              <EmptyState 
                icon={Inbox}
                title="Nenhum ciclo ativo"
                description="Não há ciclos de feedback ativos no momento"
              />
            ) : (
              <div className="space-y-3">
                {cycles.map((cycle: FeedbackCycle) => (
                  <div key={cycle.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{cycle.name}</h3>
                      <Badge>{cycle.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{cycle.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedbacks Pendentes ({pendingRequests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <EmptyState 
                icon={MessageCircle}
                title="Nenhum feedback pendente"
                description="Você não possui feedbacks para responder"
              />
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((req: FeedbackRequest) => (
                  <div key={req.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <span>Feedback para {req.to_user_id}</span>
                    <Button size="sm">Responder</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  </PageShell>
  );
}
