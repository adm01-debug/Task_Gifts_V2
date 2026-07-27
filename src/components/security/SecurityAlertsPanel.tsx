import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, CheckCircle, XCircle, Clock, Shield, 
  Bell, Loader2, ChevronDown, ChevronUp, Filter, ExternalLink, Activity, BookOpen, Dices
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AlertMetadata {
  request_count?: number;
  blocked_duration?: number;
  user_agent?: string;
  country?: string;
  endpoint?: string;
  method?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  ip_address: string | null;
  user_id: string | null;
  metadata: AlertMetadata;
  is_resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export function SecurityAlertsPanel() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("unresolved");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["security-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as SecurityAlert[];
    },
  });

  // Real-time subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel("security-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_alerts" },
        (payload) => {
          toast.warning(`Novo alerta: ${(payload.new as SecurityAlert).title}`, {
            duration: 10000,
            action: {
              label: "Ver",
              onClick: () => {
                setExpandedId((payload.new as SecurityAlert).id);
              },
            },
          });
          queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
          queryClient.invalidateQueries({ queryKey: ["security-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("security_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta resolvido");
      queryClient.invalidateQueries({ queryKey: ["security-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["security-stats"] });
    },
    onError: () => {
      toast.error("Erro ao resolver alerta");
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "rate_limit_exceeded": return <Clock className="w-4 h-4" />;
      case "brute_force": return <Shield className="w-4 h-4" />;
      case "ip_blocked": return <XCircle className="w-4 h-4" />;
      case "suspicious_login": return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const unresolvedAlerts = alerts?.filter((a) => !a.is_resolved) || [];
  const resolvedAlerts = alerts?.filter((a) => a.is_resolved) || [];

  const uniqueTypes = Array.from(new Set((alerts || []).map((a) => a.alert_type)));

  const filteredAlerts = (alerts || []).filter((a) => {
    if (typeFilter !== "all" && a.alert_type !== typeFilter) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (statusFilter === "unresolved" && a.is_resolved) return false;
    if (statusFilter === "resolved" && !a.is_resolved) return false;
    return true;
  });

  const isWebhookSlaAlert = (type: string) => type === "webhook_sla_below_threshold";
  /** Alertas emitidos pelo motor econômico da Roleta da Sorte. */
  const isLuckyWheelAlert = (type: string) => typeof type === "string" && type.startsWith("lucky_wheel_");
  const luckyWheelPending = unresolvedAlerts.filter((a) => isLuckyWheelAlert(a.alert_type)).length;

  const RUNBOOK_TYPES = new Set([
    "webhook_sla_below_threshold",
    "brute_force",
    "rate_limit_exceeded",
    "ip_blocked",
    "suspicious_login",
    "webhook_secret_auto_promoted",
    "webhook_secret_bulk_rotated",
  ]);
  const runbookHref = (type: string) =>
    `/admin/security-runbook#type-${RUNBOOK_TYPES.has(type) ? type : "generic"}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Alertas de Segurança
          {unresolvedAlerts.length > 0 && (
            <Badge variant="destructive">{unresolvedAlerts.length} pendentes</Badge>
          )}
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/admin/security-runbook">
              <BookOpen className="w-4 h-4 mr-1" /> Runbook
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg border bg-muted/30">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="unresolved">Pendentes</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas severidades</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[220px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={typeFilter === "webhook_sla_below_threshold" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              setTypeFilter(
                typeFilter === "webhook_sla_below_threshold" ? "all" : "webhook_sla_below_threshold"
              )
            }
            className="ml-auto"
          >
            <Activity className="w-4 h-4 mr-2" />
            SLA de Webhooks
          </Button>
          <Button
            variant={typeFilter === "lucky_wheel" ? "default" : "outline"}
            size="sm"
            onClick={() => setTypeFilter(typeFilter === "lucky_wheel" ? "all" : "lucky_wheel")}
          >
            <Dices className="w-4 h-4 mr-2" />
            Roleta
            {luckyWheelPending > 0 && (
              <Badge variant="destructive" className="ml-2">{luckyWheelPending}</Badge>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {filteredAlerts.length} de {alerts?.length || 0}
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500 opacity-50" />
            <p>Nenhum alerta corresponde aos filtros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAlerts.map((alert) => (
              <Collapsible
                key={alert.id}
                open={expandedId === alert.id}
                onOpenChange={(open) => setExpandedId(open ? alert.id : null)}
              >
                <div
                  className={`border rounded-lg p-4 ${
                    alert.is_resolved ? "opacity-60 bg-muted/30" : ""
                  }`}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                          {getAlertTypeIcon(alert.alert_type)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(alert.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        {alert.is_resolved ? (
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolvido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                        {expandedId === alert.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-4 space-y-4">
                    {alert.description && (
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {alert.ip_address && (
                        <div>
                          <span className="font-medium">IP:</span>{" "}
                          <code className="bg-muted px-1 rounded">{alert.ip_address}</code>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Tipo:</span>{" "}
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </div>
                    </div>

                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium">Metadados:</span>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    {isWebhookSlaAlert(alert.alert_type) && (
                      <Button asChild variant="secondary" size="sm">
                        <Link to="/admin/webhooks/executive">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Abrir dashboard executivo de webhooks
                        </Link>
                      </Button>
                    )}

                    <Button asChild variant="outline" size="sm">
                      <Link to={runbookHref(alert.alert_type)}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Ver runbook deste alerta
                      </Link>
                    </Button>

                    {alert.is_resolved ? (
                      <div className="p-3 bg-green-500/10 rounded-lg text-sm">
                        <p className="font-medium text-green-600">
                          Resolvido em{" "}
                          {format(new Date(alert.resolved_at!), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </p>
                        {alert.resolution_notes && (
                          <p className="mt-1 text-muted-foreground">{alert.resolution_notes}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Notas de resolução (opcional)"
                          value={resolutionNotes[alert.id] || ""}
                          onChange={(e) =>
                            setResolutionNotes((prev) => ({
                              ...prev,
                              [alert.id]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          onClick={() =>
                            resolveMutation.mutate({
                              id: alert.id,
                              notes: resolutionNotes[alert.id] || "",
                            })
                          }
                          disabled={resolveMutation.isPending}
                        >
                          {resolveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Marcar como Resolvido
                        </Button>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
