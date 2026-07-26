import { Activity, Layers, ShieldCheck, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/navigation";
import { MobilePageLayout } from "@/components/mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { ContinuousSurveyWidget } from "@/components/engagement/ContinuousSurveyWidget";
import { useActiveEngagementCycle } from "@/hooks/useContinuousEngagement";

const HIGHLIGHTS = [
  {
    icon: Timer,
    title: "Menos de 2 minutos",
    description: "Poucas perguntas por ciclo, sem cansar o time.",
  },
  {
    icon: Layers,
    title: "10 pilares e 28 fatores",
    description: "Rotação inteligente cobre todo o diagnóstico de clima.",
  },
  {
    icon: ShieldCheck,
    title: "Anônimo por padrão",
    description: "Resultados só aparecem de forma agregada.",
  },
];

export default function ContinuousEngagement() {
  const isMobile = useIsMobile();
  const { data: cycle } = useActiveEngagementCycle();

  const subtitle = cycle
    ? `Ciclo aberto até ${new Date(cycle.ends_at).toLocaleDateString("pt-BR")}`
    : "Pesquisa contínua de clima e engajamento";

  const content = (
    <div className="space-y-6">
      <ContinuousSurveyWidget />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <Card key={item.title} className="glass-card">
            <CardContent className="flex items-start gap-3 p-5">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <PageShell title="Engajamento">
      {isMobile ? (
        <MobilePageLayout title="Engajamento" icon={Activity} backPath="/" subtitle={subtitle}>
          {content}
        </MobilePageLayout>
      ) : (
        <div className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Pesquisa Contínua</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </header>
          {content}
        </div>
      )}
    </PageShell>
  );
}