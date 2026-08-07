import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Smartphone, Monitor, Key, Users, CheckCircle, TrendingUp, Fingerprint,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SecurityOverviewTabProps {
  securityScore: number;
  is2FAEnabled: boolean;
  is2FALoading: boolean;
  hasPasskeys: boolean;
  devices: Array<{ id: string; is_trusted: boolean }> | undefined;
  devicesLoading: boolean;
  stats: { active_sessions?: number; unresolved_alerts?: number; failed_logins?: number; rate_limit_violations?: number; blocked_ips?: number } | undefined;
  statsLoading: boolean;
  deviceAlerts: Array<{ id: string; user_agent: string | null; ip_address: unknown; created_at: string; is_acknowledged: boolean }> | undefined;
  setActiveTab: (tab: string) => void;
}

export function SecurityOverviewTab({
  securityScore, is2FAEnabled, is2FALoading, hasPasskeys, devices, devicesLoading, stats, statsLoading, deviceAlerts, setActiveTab,
}: SecurityOverviewTabProps) {
  const getScoreColor = (score: number) => score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500";
  const getScoreLabel = (score: number) => score >= 80 ? "Excelente" : score >= 60 ? "Bom" : score >= 40 ? "Regular" : "Crítico";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" />Pontuação de Segurança</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-muted" />
                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" strokeDasharray={`${securityScore * 3.52} 352`} className={getScoreColor(securityScore)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>{securityScore}</span>
                <span className="text-xs text-muted-foreground">de 100</span>
              </div>
            </div>
            <Badge variant="outline" className={`${getScoreColor(securityScore)} border-current`}>{getScoreLabel(securityScore)}</Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Status de Segurança</CardTitle><CardDescription>Resumo das configurações de proteção</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2"><div className={`p-2 rounded-full ${is2FAEnabled ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}><Key className={`w-4 h-4 ${is2FAEnabled ? 'text-green-500' : 'text-yellow-500'}`} /></div></div>
                <p className="text-sm font-medium">MFA</p>
                <p className="text-xs text-muted-foreground">{is2FALoading ? <Skeleton className="h-4 w-16" /> : is2FAEnabled ? <span className="text-green-500">Ativado</span> : <span className="text-yellow-500">Desativado</span>}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2"><div className="p-2 rounded-full bg-blue-500/10"><Monitor className="w-4 h-4 text-blue-500" /></div></div>
                <p className="text-sm font-medium">Dispositivos</p>
                <p className="text-xs text-muted-foreground">{devicesLoading ? <Skeleton className="h-4 w-16" /> : `${devices?.length || 0} registrados`}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2"><div className="p-2 rounded-full bg-purple-500/10"><Users className="w-4 h-4 text-purple-500" /></div></div>
                <p className="text-sm font-medium">Sessões Ativas</p>
                <p className="text-xs text-muted-foreground">{statsLoading ? <Skeleton className="h-4 w-16" /> : `${stats?.active_sessions || 0} online`}</p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2"><div className={`p-2 rounded-full ${stats?.unresolved_alerts ? 'bg-red-500/10' : 'bg-green-500/10'}`}><AlertTriangle className={`w-4 h-4 ${stats?.unresolved_alerts ? 'text-red-500' : 'text-green-500'}`} /></div></div>
                <p className="text-sm font-medium">Alertas</p>
                <p className="text-xs text-muted-foreground">{statsLoading ? <Skeleton className="h-4 w-16" /> : stats?.unresolved_alerts ? <span className="text-red-500">{stats.unresolved_alerts} pendentes</span> : <span className="text-green-500">Nenhum pendente</span>}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Recomendações de Segurança</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!hasPasskeys && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Fingerprint className="w-5 h-5 text-primary" />
                <div className="flex-1"><p className="text-sm font-medium">Configure login biométrico</p><p className="text-xs text-muted-foreground">Use sua impressão digital ou Face ID para fazer login</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("passkeys")}>Configurar</Button>
              </div>
            )}
            {!is2FAEnabled && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <ShieldAlert className="w-5 h-5 text-yellow-500" />
                <div className="flex-1"><p className="text-sm font-medium">Ative a autenticação de dois fatores</p><p className="text-xs text-muted-foreground">Adicione uma camada extra de proteção à sua conta</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("mfa")}>Configurar</Button>
              </div>
            )}
            {devices && devices.filter(d => !d.is_trusted).length > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <div className="flex-1"><p className="text-sm font-medium">Revise seus dispositivos conectados</p><p className="text-xs text-muted-foreground">Você tem {devices.filter(d => !d.is_trusted).length} dispositivo(s) não confiável(is)</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("devices")}>Revisar</Button>
              </div>
            )}
            {stats?.unresolved_alerts && stats.unresolved_alerts > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="flex-1"><p className="text-sm font-medium">Alertas de segurança pendentes</p><p className="text-xs text-muted-foreground">Você tem {stats.unresolved_alerts} alerta(s) que precisam de atenção</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("alerts")}>Ver Alertas</Button>
              </div>
            )}
            {is2FAEnabled && hasPasskeys && (!devices || devices.filter(d => !d.is_trusted).length === 0) && !stats?.unresolved_alerts && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1"><p className="text-sm font-medium">Sua conta está bem protegida!</p><p className="text-xs text-muted-foreground">Todas as configurações de segurança recomendadas estão ativas</p></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {deviceAlerts && deviceAlerts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Fingerprint className="w-5 h-5 text-primary" />Acessos Recentes de Novos Dispositivos</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="p-2 rounded-full bg-muted"><Monitor className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.user_agent || "Dispositivo desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">IP: {String(alert.ip_address)} • {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                  <Badge variant={alert.is_acknowledged ? "secondary" : "outline"}>{alert.is_acknowledged ? "Reconhecido" : "Novo"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Violações Rate Limit", value: stats?.rate_limit_violations, icon: <div className="p-3 bg-orange-500/10 rounded-full"><AlertTriangle className="w-6 h-6 text-orange-500" /></div>, sub: "Últimas 24h" },
          { label: "IPs Bloqueados", value: stats?.blocked_ips, icon: <div className="p-3 bg-red-500/10 rounded-full"><AlertTriangle className="w-6 h-6 text-red-500" /></div>, sub: "Ativos agora" },
          { label: "Logins Falhados", value: stats?.failed_logins, icon: <div className="p-3 bg-yellow-500/10 rounded-full"><ShieldAlert className="w-6 h-6 text-yellow-500" /></div>, sub: "Últimas 24h" },
          { label: "Sessões Ativas", value: stats?.active_sessions, icon: <div className="p-3 bg-green-500/10 rounded-full"><Users className="w-6 h-6 text-green-500" /></div>, sub: "Usuários online" },
          { label: "Alertas Pendentes", value: stats?.unresolved_alerts, icon: <div className="p-3 bg-purple-500/10 rounded-full"><AlertTriangle className="w-6 h-6 text-purple-500" /></div>, sub: "Não resolvidos" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{statsLoading ? <Skeleton className="h-8 w-16" /> : item.value || 0}</p>
                </div>
                {item.icon}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
