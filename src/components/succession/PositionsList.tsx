import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronRight } from "lucide-react";
import { CriticalPosition } from "@/services/successionService";

interface PositionsListProps {
  positions: CriticalPosition[];
  onViewPlan: (position: CriticalPosition) => void;
  getRiskColor: (risk: string) => string;
  getRiskIcon: (risk: string) => React.ReactNode;
}

export function PositionsList({ positions, onViewPlan, getRiskColor, getRiskIcon }: PositionsListProps) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhuma posição encontrada</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {positions.map((position) => (
          <Card
            key={position.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onViewPlan(position)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getRiskColor(position.riskLevel)}`}>
                    {getRiskIcon(position.riskLevel)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{position.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {position.department || "Sem departamento"} • {position.currentHolder?.name || "Vago"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {position.successorCount} sucessor{position.successorCount !== 1 ? "es" : ""}
                    </p>
                    <Badge variant="outline" className={getRiskColor(position.riskLevel)}>
                      {position.riskLevel === "critical" ? "Crítico" :
                       position.riskLevel === "at_risk" ? "Em Risco" :
                       position.riskLevel === "covered" ? "Coberto" : "Médio"}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
