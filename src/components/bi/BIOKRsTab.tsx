import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { CHART_COLORS } from "./BIChartComponents";

interface OKRItem {
  name: string;
  atual: number;
  meta: number;
  fill: string;
}

interface BIOKRsTabProps {
  okrData: OKRItem[];
}

export function BIOKRsTab({ okrData }: BIOKRsTabProps) {
  return (
    <div className="space-y-6">
      <SectionErrorBoundary sectionName="Progresso OKRs">
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Progresso dos OKRs
            </CardTitle>
            <CardDescription>Objetivos e resultados-chave do trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {okrData.map((okr, index) => (
                <motion.div 
                  key={okr.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: okr.fill }} />
                      <span className="font-medium">{okr.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Meta: {okr.meta}%</span>
                      <Badge variant={okr.atual >= okr.meta ? "default" : okr.atual >= okr.meta * 0.7 ? "secondary" : "destructive"}>
                        {okr.atual}%
                      </Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={(okr.atual / okr.meta) * 100} className="h-3" />
                    <div className="absolute top-0 h-3 w-0.5 bg-foreground/50" style={{ left: '100%' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="card-subtle text-center p-4">
          <div className="text-3xl font-bold text-green-500">{okrData.filter(o => o.atual >= o.meta).length}</div>
          <p className="text-xs text-muted-foreground">OKRs Atingidos</p>
        </Card>
        <Card className="card-subtle text-center p-4">
          <div className="text-3xl font-bold text-yellow-500">{okrData.filter(o => o.atual >= o.meta * 0.7 && o.atual < o.meta).length}</div>
          <p className="text-xs text-muted-foreground">Em Progresso</p>
        </Card>
        <Card className="card-subtle text-center p-4">
          <div className="text-3xl font-bold text-red-500">{okrData.filter(o => o.atual < o.meta * 0.7).length}</div>
          <p className="text-xs text-muted-foreground">Em Risco</p>
        </Card>
        <Card className="card-subtle text-center p-4">
          <div className="text-3xl font-bold text-primary">{Math.round(okrData.reduce((s, o) => s + (o.atual / o.meta) * 100, 0) / okrData.length)}%</div>
          <p className="text-xs text-muted-foreground">Progresso Geral</p>
        </Card>
      </div>
    </div>
  );
}
