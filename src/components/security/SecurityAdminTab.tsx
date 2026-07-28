import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, ShieldAlert, Shield, Trash2, Globe, Loader2, BellRing } from "lucide-react";
import { BlockedIPsPanel } from "@/components/security/BlockedIPsPanel";
import { LoginAttemptsPanel } from "@/components/security/LoginAttemptsPanel";
import { RateLimitRulesPanel } from "@/components/security/RateLimitRulesPanel";
import { PushOutboxHealthPanel } from "@/components/security/PushOutboxHealthPanel";

interface SecurityAdminTabProps {
  stats: {
    top_blocked_ips?: Array<{ ip_address: string; violation_count: number; reason: string; is_permanent: boolean }>;
  } | undefined;
  cleanupMutation: {
    mutate: () => void;
    isPending: boolean;
  };
}

export function SecurityAdminTab({ stats, cleanupMutation }: SecurityAdminTabProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Configurações Avançadas</h2>
          <p className="text-sm text-muted-foreground">Gerenciamento de rate limiting, IPs bloqueados e regras de segurança</p>
        </div>
        <Button variant="destructive" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>
          {cleanupMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
          Limpar Logs Antigos
        </Button>
      </div>

      {stats?.top_blocked_ips && stats.top_blocked_ips.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" />Top IPs Bloqueados</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.top_blocked_ips.map((ip, index: number) => (
                <Badge key={index} variant={ip.is_permanent ? "destructive" : "secondary"} className="text-sm py-1 px-3">
                  <Globe className="w-3 h-3 mr-1" />{ip.ip_address} ({ip.violation_count}x){ip.is_permanent && <span className="ml-1">🔒</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="blocked" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="blocked" className="flex items-center gap-2"><Ban className="w-4 h-4" />IPs Bloqueados</TabsTrigger>
          <TabsTrigger value="attempts" className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" />Tentativas Login</TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2"><Shield className="w-4 h-4" />Regras Rate Limit</TabsTrigger>
          <TabsTrigger value="push" className="flex items-center gap-2"><BellRing className="w-4 h-4" />Fila de Push</TabsTrigger>
        </TabsList>
        <TabsContent value="blocked"><BlockedIPsPanel /></TabsContent>
        <TabsContent value="attempts"><LoginAttemptsPanel /></TabsContent>
        <TabsContent value="rules"><RateLimitRulesPanel /></TabsContent>
        <TabsContent value="push"><PushOutboxHealthPanel /></TabsContent>
      </Tabs>
    </>
  );
}
