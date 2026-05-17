import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, ShieldAlert, ShieldOff, Activity, AlertTriangle,
  Ban, Clock, RefreshCw, Search, Trash2, CheckCircle,
  XCircle, TrendingUp, Users, Globe, Loader2, Lock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequireAdmin } from "@/components/rbac/AccessControl";
import { PageShell } from "@/components/navigation";
import { BlockedIPsPanel } from "@/components/security/BlockedIPsPanel";
import { SecurityAlertsPanel } from "@/components/security/SecurityAlertsPanel";
import { RateLimitRulesPanel } from "@/components/security/RateLimitRulesPanel";
import { LoginAttemptsPanel } from "@/components/security/LoginAttemptsPanel";
import { SessionsPanel } from "@/components/security/SessionsPanel";

interface BlockedIPInfo {
  ip_address: string;
  violation_count: number;
  reason: string;
  is_permanent: boolean;
}

interface RecentAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  created_at: string;
}

interface CleanupResult {
  rate_limit_logs_deleted: number;
  login_attempts_deleted: number;
}

interface SecurityStats {
  rate_limit_violations: number;
  blocked_ips: number;
  failed_logins: number;
  active_sessions: number;
  unresolved_alerts: number;
  top_blocked_ips: BlockedIPInfo[];
  recent_alerts: RecentAlert[];
}

export default function RateLimitDashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["security-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_security_stats", { p_hours: 24 });
      if (error) throw error;
      return data as unknown as SecurityStats;
    },
    refetchInterval: 30000,
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("cleanup_old_security_logs", { p_days_to_keep: 30 });
      if (error) throw error;
      return data as unknown as CleanupResult;
    },
    onSuccess: (data: CleanupResult) => {
      toast.success(`Limpeza concluída! Removidos: ${data.rate_limit_logs_deleted} logs de rate limit, ${data.login_attempts_deleted} tentativas de login.`);
      queryClient.invalidateQueries({ queryKey: ["security"] });
      refetchStats();
    },
    onError: () => {
      toast.error("Erro ao executar limpeza");
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <RequireAdmin showAccessDenied>
    <PageShell title="Central de Segurança" backFallback="/admin">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8 pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Central de Segurança</h1>
              <p className="text-muted-foreground">Monitoramento de rate limiting e IPs bloqueados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetchStats()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
            >
              {cleanupMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Limpar Logs
            </Button>
          </div>
        </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Violações Rate Limit</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.rate_limit_violations || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-full">
                    <Activity className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Últimas 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">IPs Bloqueados</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.blocked_ips || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <Ban className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Ativos agora</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Logins Falhados</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.failed_logins || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-full">
                    <ShieldAlert className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Últimas 24h</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.active_sessions || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <Users className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Usuários online</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alertas Pendentes</p>
                    <p className="text-2xl font-bold">
                      {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.unresolved_alerts || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Não resolvidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Blocked IPs Preview */}
          {stats?.top_blocked_ips && stats.top_blocked_ips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-500" />
                  Top IPs Bloqueados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.top_blocked_ips.map((ip: BlockedIPInfo, index: number) => (
                    <Badge 
                      key={index} 
                      variant={ip.is_permanent ? "destructive" : "secondary"}
                      className="text-sm py-1 px-3"
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      {ip.ip_address} ({ip.violation_count}x)
                      {ip.is_permanent && <span className="ml-1">🔒</span>}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Tabs */}
          <Tabs defaultValue="alerts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alertas
                {stats?.unresolved_alerts ? (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {stats.unresolved_alerts}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="blocked" className="flex items-center gap-2">
                <Ban className="w-4 h-4" />
                IPs Bloqueados
              </TabsTrigger>
              <TabsTrigger value="attempts" className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Tentativas Login
              </TabsTrigger>
              <TabsTrigger value="sessions" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Sessões
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Regras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alerts">
              <SecurityAlertsPanel />
            </TabsContent>

            <TabsContent value="blocked">
              <BlockedIPsPanel />
            </TabsContent>

            <TabsContent value="attempts">
              <LoginAttemptsPanel />
            </TabsContent>

            <TabsContent value="sessions">
              <SessionsPanel />
            </TabsContent>

            <TabsContent value="rules">
              <RateLimitRulesPanel />
            </TabsContent>
          </Tabs>
        </div>
      </PageShell>
    </RequireAdmin>
  );
}
