import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, AlertTriangle, 
  Ban, RefreshCw, Trash2, Users, Globe, Loader2, 
  Smartphone, Monitor, Key, Eye, CheckCircle,
  TrendingUp, Fingerprint, Settings
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlockedIPsPanel } from "@/components/security/BlockedIPsPanel";
import { SecurityAlertsPanel } from "@/components/security/SecurityAlertsPanel";
import { RateLimitRulesPanel } from "@/components/security/RateLimitRulesPanel";
import { LoginAttemptsPanel } from "@/components/security/LoginAttemptsPanel";
import { SessionsPanel } from "@/components/security/SessionsPanel";
import { DevicesPanel } from "@/components/security/DevicesPanel";
import { SecurityNotificationsToggle } from "@/components/security/SecurityNotificationsToggle";
import { PasskeysPanel } from "@/components/security/PasskeysPanel";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { useAuth } from "@/hooks/useAuth";
import { useSecurityPushNotifications } from "@/hooks/useSecurityPushNotifications";
import { SecurityOverviewTab } from "@/components/security/SecurityOverviewTab";
import { SecurityAdminTab } from "@/components/security/SecurityAdminTab";

interface SecurityStats {
  rate_limit_violations: number;
  blocked_ips: number;
  failed_logins: number;
  active_sessions: number;
  unresolved_alerts: number;
  top_blocked_ips: Array<{ ip_address: string; violation_count: number; reason: string; is_permanent: boolean }>;
  recent_alerts: Array<{ id: string; alert_type: string; severity: string; title: string; created_at: string }>;
}

export default function SecurityDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isEnabled: is2FAEnabled, isLoading: is2FALoading } = useTwoFactor();
  const { hasPasskeys } = useWebAuthn();
  const [activeTab, setActiveTab] = useState("overview");
  
  useSecurityPushNotifications();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["security-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_security_stats", { p_hours: 24 });
      if (error) throw error;
      return data as unknown as SecurityStats;
    },
    refetchInterval: 30000,
  });

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ["user-devices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_devices").select("*").eq("user_id", user?.id).order("last_seen_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: deviceAlerts } = useQuery({
    queryKey: ["device-alerts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("new_device_alerts").select("*").eq("user_id", user?.id).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("cleanup_old_security_logs", { p_days_to_keep: 30 });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { rate_limit_logs_deleted: number; login_attempts_deleted: number }) => {
      toast.success(`Limpeza concluída! Removidos: ${data.rate_limit_logs_deleted} logs de rate limit, ${data.login_attempts_deleted} tentativas de login.`);
      queryClient.invalidateQueries({ queryKey: ["security"] });
      refetchStats();
    },
    onError: () => toast.error("Erro ao executar limpeza"),
  });

  let securityScore = 40;
  if (is2FAEnabled) securityScore += 20;
  if (hasPasskeys) securityScore += 15;
  const trustedDevices = devices?.filter(d => d.is_trusted)?.length || 0;
  securityScore += Math.min(trustedDevices * 5, 15);
  if (!stats?.unresolved_alerts) securityScore += 10;
  if (stats?.failed_logins === 0) securityScore += 10;
  else if ((stats?.failed_logins || 0) < 5) securityScore += 5;
  securityScore = Math.min(securityScore, 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="w-8 h-8 text-primary" />Central de Segurança</h1>
            <p className="text-muted-foreground mt-1">Gerencie todas as configurações de segurança da sua conta</p>
          </div>
          <Button variant="outline" onClick={() => refetchStats()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2"><Eye className="w-4 h-4" />Visão Geral</TabsTrigger>
            <TabsTrigger value="passkeys" className="flex items-center gap-2"><Fingerprint className="w-4 h-4" />Passkeys{hasPasskeys && <CheckCircle className="w-3 h-3 text-green-500" />}</TabsTrigger>
            <TabsTrigger value="mfa" className="flex items-center gap-2"><Key className="w-4 h-4" />MFA{is2FAEnabled && <CheckCircle className="w-3 h-3 text-green-500" />}</TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2"><Smartphone className="w-4 h-4" />Dispositivos{devices?.length && <Badge variant="secondary" className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center">{devices.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2"><Users className="w-4 h-4" />Sessões</TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Alertas{stats?.unresolved_alerts ? <Badge variant="destructive" className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center">{stats.unresolved_alerts}</Badge> : null}</TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2"><Settings className="w-4 h-4" />Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SecurityOverviewTab
              securityScore={securityScore}
              is2FAEnabled={is2FAEnabled}
              is2FALoading={is2FALoading}
              hasPasskeys={hasPasskeys}
               devices={devices?.map(d => ({ ...d, is_trusted: !!d.is_trusted }))}
               devicesLoading={devicesLoading}
               stats={stats}
               statsLoading={statsLoading}
               deviceAlerts={deviceAlerts?.map(a => ({ ...a, is_acknowledged: !!a.is_acknowledged }))}
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="passkeys" className="space-y-6"><PasskeysPanel /></TabsContent>
          <TabsContent value="mfa" className="space-y-6"><TwoFactorSetup /><SecurityNotificationsToggle /></TabsContent>
          <TabsContent value="devices"><DevicesPanel /></TabsContent>
          <TabsContent value="sessions"><SessionsPanel /></TabsContent>
          <TabsContent value="alerts"><SecurityAlertsPanel /></TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <SecurityAdminTab stats={stats} cleanupMutation={cleanupMutation} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
