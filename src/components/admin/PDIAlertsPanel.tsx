import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Target,
  Award,
  TrendingDown,
  ChevronRight,
  Bell,
  Filter,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePDIAlerts, PDIAlert } from "@/hooks/usePDIAlerts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const alertTypeConfig: Record<
  PDIAlert["type"],
  { icon: typeof AlertTriangle; color: string; label: string }
> = {
  pdi_overdue: { icon: Clock, color: "text-red-500", label: "PDI Vencido" },
  pdi_expiring: { icon: Clock, color: "text-amber-500", label: "PDI Vencendo" },
  low_performance: { icon: TrendingDown, color: "text-red-500", label: "Baixo Desempenho" },
  competency_gap: { icon: Target, color: "text-orange-500", label: "Gap de Competência" },
  certification_expiring: { icon: Award, color: "text-blue-500", label: "Certificação" },
};

const severityConfig: Record<PDIAlert["severity"], { bg: string; border: string; text: string }> = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" },
  info: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
};

function AlertCard({ alert, index }: { alert: PDIAlert; index: number }) {
  const typeConfig = alertTypeConfig[alert.type];
  const severity = severityConfig[alert.severity];
  const Icon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`${severity.bg} ${severity.border} border hover:shadow-md transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${severity.bg}`}>
              <Icon className={`w-5 h-5 ${typeConfig.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-foreground truncate">{alert.title}</h4>
                <Badge
                  variant="outline"
                  className={`${severity.text} ${severity.border} shrink-0`}
                >
                  {alert.severity === "critical" ? "Crítico" : alert.severity === "warning" ? "Atenção" : "Info"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>

              <div className="flex items-center gap-4 mt-3">
                {alert.userName && (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={alert.userAvatar || ""} />
                      <AvatarFallback className="text-xs">
                        {alert.userName?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{alert.userName}</span>
                  </div>
                )}

                {alert.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(alert.dueDate), { addSuffix: true, locale: ptBR })}
                  </div>
                )}
              </div>
            </div>

            <Button variant="ghost" size="icon" className="shrink-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PDIAlertsPanel() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: alerts, isLoading } = usePDIAlerts();

  const filteredAlerts = alerts?.filter((alert) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (typeFilter !== "all" && alert.type !== typeFilter) return false;
    return true;
  });

  const counts = {
    critical: alerts?.filter((a) => a.severity === "critical").length || 0,
    warning: alerts?.filter((a) => a.severity === "warning").length || 0,
    info: alerts?.filter((a) => a.severity === "info").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Central de Alertas
          </h2>
          <p className="text-muted-foreground">
            Monitore PDIs, competências e certificações da equipe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="warning">Atenção</SelectItem>
              <SelectItem value="info">Informativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="pdi_overdue">PDI Vencido</SelectItem>
              <SelectItem value="pdi_expiring">PDI Vencendo</SelectItem>
              <SelectItem value="low_performance">Baixo Desempenho</SelectItem>
              <SelectItem value="certification_expiring">Certificação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{counts.critical}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">{counts.warning}</div>
              <div className="text-sm text-muted-foreground">Atenção</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{counts.info}</div>
              <div className="text-sm text-muted-foreground">Informativos</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas Ativos</CardTitle>
          <CardDescription>
            {filteredAlerts?.length || 0} alertas encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredAlerts?.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground">Tudo em ordem!</h3>
              <p className="text-sm text-muted-foreground">
                Não há alertas no momento
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredAlerts?.map((alert, index) => (
                    <AlertCard key={alert.id} alert={alert} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
