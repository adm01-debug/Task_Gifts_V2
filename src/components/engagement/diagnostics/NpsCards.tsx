import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { NpsMetric } from "@/services/engagementDiagnosticsService";

const META: Record<string, { title: string; description: string }> = {
  eNPS: {
    title: "eNPS",
    description: "Recomendação da empresa como lugar para trabalhar",
  },
  LNPS: {
    title: "LNPS",
    description: "Recomendação da liderança direta",
  },
};

function npsTone(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score < 0) return "text-destructive";
  if (score < 30) return "text-warning";
  if (score < 70) return "text-primary";
  return "text-success";
}

/** Cartões de eNPS e LNPS com quebra de promotores/neutros/detratores. */
export function NpsCards({ metrics }: { metrics: NpsMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {metrics.map((metric) => {
        const meta = META[metric.metric] ?? { title: metric.metric, description: "" };
        return (
          <Card key={metric.metric}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{meta.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
            </CardHeader>
            <CardContent>
              <p className={cn("text-4xl font-bold tabular-nums", npsTone(metric.score))}>
                {metric.score ?? "—"}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-semibold text-success">{metric.promoters}</p>
                  <p className="text-muted-foreground">Promotores</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">{metric.passives}</p>
                  <p className="text-muted-foreground">Neutros</p>
                </div>
                <div>
                  <p className="font-semibold text-destructive">{metric.detractors}</p>
                  <p className="text-muted-foreground">Detratores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
