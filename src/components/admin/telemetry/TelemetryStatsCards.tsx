import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Zap, Database } from "lucide-react";
import { formatDuration } from "@/pages/AdminTelemetria";

interface TelemetryStatsCardsProps {
  verySlow: number;
  slow: number;
  errors: number;
  avgDuration: number;
}

export function TelemetryStatsCards({ verySlow, slow, errors, avgDuration }: TelemetryStatsCardsProps) {
  const items = [
    { icon: AlertTriangle, color: "bg-destructive/10", iconColor: "text-destructive", value: verySlow, label: "Muito Lentas (>8s)" },
    { icon: Clock, color: "bg-yellow-500/10", iconColor: "text-yellow-600", value: slow, label: "Lentas (>3s)" },
    { icon: Zap, color: "bg-destructive/10", iconColor: "text-destructive", value: errors, label: "Erros" },
    { icon: Database, color: "bg-primary/10", iconColor: "text-primary", value: formatDuration(avgDuration), label: "Média de duração" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
