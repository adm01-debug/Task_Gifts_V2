import { AlertTriangle, Users, Clock, ShoppingBag, Award, TrendingUp, Flame, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAlerts, type AdminAlert } from "@/hooks/useAdminAlerts";
import { motion, AnimatePresence } from "framer-motion";

const alertIcons: Record<string, typeof AlertTriangle> = {
  inactive_users: Users,
  zero_engagement: TrendingUp,
  broken_streaks: Flame,
  low_attendance: Clock,
  pending_purchases: ShoppingBag,
  expiring_certifications: Award,
  activity_spike: TrendingUp,
};

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

const severityBorders: Record<string, string> = {
  critical: "border-l-destructive",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
};

export function AdminAlertsPanel() {
  const { data: alerts, isLoading, error, refetch, isRefetching } = useAdminAlerts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div role="alert" className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Erro ao carregar alertas</span>
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const alertsList = alerts || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Alertas Automáticos</h3>
          <Badge variant="secondary">{alertsList.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {alertsList.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <p className="font-medium text-foreground">Tudo em ordem!</p>
              <p className="text-sm">Nenhum alerta ativo no momento</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {alertsList.map((alert, index) => (
              <AlertCard key={`${alert.type}-${index}`} alert={alert} index={index} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

function AlertCard({ alert, index }: { alert: AdminAlert; index: number }) {
  const Icon = alertIcons[alert.type] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`border-l-4 ${severityBorders[alert.severity]}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${severityColors[alert.severity]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{alert.title}</h4>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    alert.severity === "critical" || alert.severity === "high"
                      ? "border-destructive text-destructive"
                      : ""
                  }`}
                >
                  {alert.severity === "critical"
                    ? "Crítico"
                    : alert.severity === "high"
                    ? "Alto"
                    : alert.severity === "medium"
                    ? "Médio"
                    : "Baixo"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              {alert.affectedUsers && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{alert.affectedUsers} usuário(s) afetado(s)</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
