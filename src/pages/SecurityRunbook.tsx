import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertHeatmap } from "@/components/security/AlertHeatmap";
import {
  BookOpen, Search, ShieldAlert, Activity, Ban, KeyRound, Bug, Bell,
  ExternalLink, ArrowRight, AlertTriangle, TrendingUp, TrendingDown, Minus,
} from "lucide-react";

interface RunbookStep {
  action: string;
  detail?: string;
  href?: string;
  hrefLabel?: string;
}

interface RunbookEntry {
  alertType: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  triage: string[];
  steps: RunbookStep[];
  owner: string;
  slaMinutes: number;
}

const RUNBOOK: RunbookEntry[] = [
  {
    alertType: "webhook_sla_below_threshold",
    title: "SLA de webhooks abaixo do limite",
    severity: "high",
    icon: Activity,
    description:
      "O watchdog identificou que a taxa de sucesso das entregas de webhook caiu abaixo de 95% nas últimas 24h.",
    triage: [
      "Confirme os endpoints ofensivos no dashboard executivo.",
      "Verifique se há incidente conhecido no destinatário (Bitrix24, sistemas externos).",
      "Cheque se houve rotação recente de secret HMAC sem promoção.",
    ],
    steps: [
      { action: "Abrir dashboard executivo", href: "/admin/webhooks/executive", hrefLabel: "Ver métricas" },
      { action: "Inspecionar assinaturas instáveis e reenviar entregas críticas", href: "/admin/webhooks", hrefLabel: "Assinaturas" },
      { action: "Cancelar rotação pendente se secret novo estiver quebrando destino", detail: "RPC: cancel_webhook_secret_rotation" },
      { action: "Registrar postmortem no canal #incidentes se SLA < 90%" },
    ],
    owner: "Plataforma / SRE",
    slaMinutes: 30,
  },
  {
    alertType: "brute_force",
    title: "Tentativa de força bruta detectada",
    severity: "critical",
    icon: ShieldAlert,
    description:
      "Múltiplas falhas de login a partir do mesmo IP em janela curta — o sistema aplicou auto-block temporário.",
    triage: [
      "Valide o IP no painel Blocked IPs.",
      "Verifique se o e-mail alvo é de conta administrativa ou VIP.",
      "Cheque se o mesmo IP tem tentativas contra múltiplos e-mails.",
    ],
    steps: [
      { action: "Confirmar bloqueio no painel de segurança", href: "/admin/seguranca", hrefLabel: "Central de Segurança" },
      { action: "Elevar bloqueio para permanente se padrão persistir" },
      { action: "Forçar reset de senha e MFA se a conta alvo tiver acesso admin" },
      { action: "Registrar IP em geo_blocking_rules se vier de país fora da whitelist" },
    ],
    owner: "Segurança",
    slaMinutes: 15,
  },
  {
    alertType: "rate_limit_exceeded",
    title: "Rate limit excedido",
    severity: "medium",
    icon: Activity,
    description:
      "Consumidor ultrapassou o limite configurado. Pode ser cliente legítimo mal comportado ou tentativa de abuso.",
    triage: [
      "Identifique o endpoint mais atingido.",
      "Verifique se o IP pertence a integração conhecida (whitelist).",
      "Confirme se o limite atual está alinhado ao SLA do consumidor.",
    ],
    steps: [
      { action: "Analisar logs em Rate Limit Rules", href: "/admin/seguranca", hrefLabel: "Painel" },
      { action: "Ajustar regra para endpoint específico se legítimo" },
      { action: "Aplicar bloqueio manual estendido se abuso confirmado" },
    ],
    owner: "Plataforma",
    slaMinutes: 60,
  },
  {
    alertType: "ip_blocked",
    title: "Bloqueio manual de IP",
    severity: "low",
    icon: Ban,
    description: "Registro informativo de bloqueio manual aplicado por administrador.",
    triage: ["Confirme motivo do bloqueio.", "Verifique se há usuários legítimos afetados."],
    steps: [
      { action: "Documentar razão no campo de notas do bloqueio" },
      { action: "Definir expiração se bloqueio for temporário" },
    ],
    owner: "Segurança",
    slaMinutes: 120,
  },
  {
    alertType: "suspicious_login",
    title: "Login suspeito",
    severity: "high",
    icon: AlertTriangle,
    description: "Login em novo dispositivo, país inesperado ou fora do horário habitual.",
    triage: [
      "Contate o usuário para confirmar a atividade.",
      "Cheque histórico de dispositivos e sessões ativas.",
    ],
    steps: [
      { action: "Encerrar sessões ativas se usuário negar acesso" },
      { action: "Forçar reset de senha e habilitar MFA obrigatório" },
      { action: "Registrar dispositivo como confiável apenas após validação" },
    ],
    owner: "Segurança",
    slaMinutes: 30,
  },
  {
    alertType: "webhook_secret_auto_promoted",
    title: "Secret HMAC auto-promovido",
    severity: "medium",
    icon: KeyRound,
    description:
      "Rotação agendada expirou e o segredo novo foi promovido automaticamente. Valide que os consumidores estão usando o segredo novo.",
    triage: ["Confirme se o consumidor externo já usa o novo secret.", "Cheque delivery logs 1h antes/depois da promoção."],
    steps: [
      { action: "Verificar delivery logs no detalhe da assinatura", href: "/admin/webhooks", hrefLabel: "Assinaturas" },
      { action: "Se houver quebra, rotacionar novamente com janela maior" },
    ],
    owner: "Plataforma",
    slaMinutes: 60,
  },
  {
    alertType: "webhook_secret_bulk_rotated",
    title: "Rotação em lote iniciada",
    severity: "medium",
    icon: KeyRound,
    description:
      "Rotação em lote de múltiplas assinaturas foi disparada. Confirme distribuição do novo secret e monitore SLA.",
    triage: ["Confirme lista de assinaturas afetadas.", "Notifique times consumidores antes do fim da janela de graça."],
    steps: [
      { action: "Monitorar SLA global e por endpoint", href: "/admin/webhooks/executive", hrefLabel: "Executivo" },
      { action: "Cancelar rotação individualmente se erro > 5%" },
    ],
    owner: "Plataforma",
    slaMinutes: 60,
  },
  {
    alertType: "generic",
    title: "Alerta genérico / não classificado",
    severity: "low",
    icon: Bell,
    description: "Nenhum runbook específico. Aplique o procedimento padrão de triagem.",
    triage: [
      "Leia título e metadados do alerta.",
      "Correlacione com logs recentes.",
      "Escale para equipe apropriada se severidade real for alta.",
    ],
    steps: [
      { action: "Registrar análise no campo de resolução", href: "/admin/seguranca", hrefLabel: "Alertas" },
      { action: "Criar runbook dedicado se este tipo se repetir" },
    ],
    owner: "Segurança",
    slaMinutes: 240,
  },
];

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

export default function SecurityRunbook() {
  const [query, setQuery] = useState("");
  const location = useLocation();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: mttrData } = useQuery({
    queryKey: ["alert-mttr-by-type-7d"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_alert_mttr_by_type_7d");
      if (error) throw error;
      return (data ?? []) as Array<{
        alert_type: string;
        total_count: number;
        resolved_count: number;
        unresolved_count: number;
        avg_mttr_minutes: number | null;
        median_mttr_minutes: number | null;
        max_mttr_minutes: number | null;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const mttrByType = useMemo(() => {
    const map: Record<string, (typeof mttrData extends (infer U)[] | undefined ? U : never)> = {} as never;
    (mttrData ?? []).forEach((row) => { map[row.alert_type] = row; });
    return map;
  }, [mttrData]);

  useEffect(() => {
    const hash = location.hash.replace(/^#type-/, "");
    if (!hash) return;
    const el = cardRefs.current[hash];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlighted(hash);
      const t = setTimeout(() => setHighlighted(null), 2500);
      return () => clearTimeout(t);
    }
  }, [location.hash, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RUNBOOK;
    return RUNBOOK.filter((r) =>
      [r.title, r.description, r.alertType, r.owner].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Runbook de Segurança
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Procedimentos padronizados de resposta para cada tipo de alerta gerado pelo sistema.
              Use como referência durante plantão e incidentes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/seguranca">
                <Bug className="w-4 h-4 mr-2" /> Central de Segurança
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/webhooks/executive">
                <Activity className="w-4 h-4 mr-2" /> Webhooks Executivo
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, tipo, dono..."
            className="pl-9"
          />
        </div>

        <AlertHeatmap />

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((entry) => {
            const Icon = entry.icon;
            const isHl = highlighted === entry.alertType;
            const stats = mttrByType[entry.alertType];
            const avg = stats?.avg_mttr_minutes ?? null;
            const ratio = avg !== null ? avg / entry.slaMinutes : null;
            const mttrColor =
              ratio === null ? "text-muted-foreground" :
              ratio <= 1 ? "text-green-600" :
              ratio <= 1.5 ? "text-yellow-600" : "text-red-600";
            const MttrIcon = ratio === null ? Minus : ratio <= 1 ? TrendingDown : TrendingUp;
            return (
              <Card
                key={entry.alertType}
                id={`type-${entry.alertType}`}
                ref={(el) => { cardRefs.current[entry.alertType] = el; }}
                className={`border-l-4 transition-all duration-500 ${isHl ? "ring-2 ring-primary shadow-lg" : ""}`}
                style={{ borderLeftColor: `hsl(var(--primary))` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                    </div>
                    <Badge className={SEVERITY_BADGE[entry.severity]}>{entry.severity}</Badge>
                  </div>
                  <CardDescription className="mt-2 flex flex-wrap gap-3 text-xs">
                    <span><code className="bg-muted px-1 rounded">{entry.alertType}</code></span>
                    <span>👤 {entry.owner}</span>
                    <span>⏱️ SLA {entry.slaMinutes}min</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground">{entry.description}</p>

                  <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">MTTR 7d</p>
                      <p className={`font-semibold text-sm flex items-center gap-1 ${mttrColor}`}>
                        <MttrIcon className="w-3.5 h-3.5" />
                        {avg !== null ? `${avg.toFixed(0)}min` : "—"}
                      </p>
                      {ratio !== null && (
                        <p className="text-[10px] text-muted-foreground">
                          {ratio <= 1 ? "dentro do SLA" : `${((ratio - 1) * 100).toFixed(0)}% acima`}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mediana</p>
                      <p className="font-semibold text-sm">
                        {stats?.median_mttr_minutes != null ? `${Number(stats.median_mttr_minutes).toFixed(0)}min` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Volume 7d</p>
                      <p className="font-semibold text-sm">
                        {stats?.total_count ?? 0}
                        {stats?.unresolved_count ? (
                          <span className="ml-1 text-[10px] text-yellow-600">
                            ({stats.unresolved_count} abertos)
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">Triagem</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {entry.triage.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">Ações</p>
                    <ol className="space-y-2">
                      {entry.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-0.5 text-primary"><ArrowRight className="w-4 h-4" /></span>
                          <div className="flex-1">
                            <p>{s.action}</p>
                            {s.detail && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <code className="bg-muted px-1 rounded">{s.detail}</code>
                              </p>
                            )}
                            {s.href && (
                              <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1">
                                <Link to={s.href}>
                                  {s.hrefLabel ?? "Abrir"} <ExternalLink className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum runbook corresponde à busca.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}