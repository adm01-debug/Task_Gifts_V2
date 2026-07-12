import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Flame, Webhook, Zap, Download, AlertTriangle, BookOpen } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { toCSV, downloadCSV } from "@/lib/csvExport";

type BudgetStatus = "healthy" | "warning" | "high" | "critical";

interface BudgetBlock {
  total: number;
  success: number;
  failed: number;
  success_rate_pct: number;
  budget_total: number;
  budget_consumed: number;
  burn_pct: number;
  status: BudgetStatus;
}

interface TimelineRow {
  day: string;
  webhook_total: number;
  webhook_fail: number;
  api_total: number;
  api_fail: number;
}

interface ErrorBudgetData {
  window_days: number;
  generated_at: string;
  webhook_slo_pct: number;
  api_slo_pct: number;
  webhooks: BudgetBlock;
  external_api: BudgetBlock;
  timeline: TimelineRow[];
}

const STATUS_COPY: Record<BudgetStatus, { label: string; className: string }> = {
  healthy: { label: "Saudável", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  warning: { label: "Atenção (50%+)", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  high: { label: "Alto (75%+)", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  critical: { label: "Crítico (90%+)", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function burnBarColor(status: BudgetStatus): string {
  if (status === "critical") return "bg-destructive";
  if (status === "high") return "bg-orange-500";
  if (status === "warning") return "bg-amber-500";
  return "bg-emerald-500";
}

function BudgetCard({
  title,
  icon,
  slo,
  block,
}: {
  title: string;
  icon: React.ReactNode;
  slo: number;
  block: BudgetBlock;
}) {
  const badge = STATUS_COPY[block.status];
  const remaining = Math.max(0, block.budget_total - block.budget_consumed);
  const clamped = Math.min(100, block.burn_pct);
  const runbookSlug =
    block.status === "critical" ? "error-budget-critical" :
    block.status === "high" ? "error-budget-high" : null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon} {title}
          <Badge variant="outline" className="ml-auto text-[10px]">SLO {slo}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <div className={`text-3xl font-bold ${block.status === "critical" ? "text-destructive" : block.status === "high" ? "text-orange-500" : block.status === "warning" ? "text-amber-500" : "text-emerald-500"}`}>
            {block.burn_pct}%
          </div>
          <span className="text-xs text-muted-foreground">consumido em 30d</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full ${burnBarColor(block.status)} transition-all`} style={{ width: `${clamped}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
          <div>
            <div className="text-muted-foreground">Orçamento</div>
            <div className="font-semibold">{block.budget_total.toLocaleString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Consumido</div>
            <div className="font-semibold">{block.budget_consumed.toLocaleString("pt-BR")}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Restante</div>
            <div className="font-semibold">{remaining.toLocaleString("pt-BR")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <Badge className={badge.className}>{badge.label}</Badge>
          <span className="text-xs text-muted-foreground">
            Sucesso {block.success_rate_pct}% • {block.total.toLocaleString("pt-BR")} eventos
          </span>
          {runbookSlug && (
            <Link to={`/admin/runbook/${runbookSlug}`} className="ml-auto">
              <Button variant="outline" size="sm" className="h-7">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Runbook
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ErrorBudget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["error-budget-30d"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_error_budget_30d", {
        p_webhook_slo: 99.0,
        p_api_slo: 99.0,
      });
      if (error) throw error;
      return data as ErrorBudgetData;
    },
    staleTime: 60_000,
    refetchInterval: 300_000,
  });

  const chart = (data?.timeline ?? []).map((r) => ({
    day: new Date(r.day).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    webhook_fail: r.webhook_fail,
    api_fail: r.api_fail,
    webhook_total: r.webhook_total,
    api_total: r.api_total,
  }));

  const handleExport = () => {
    if (!data?.timeline?.length) return;
    downloadCSV(
      `error-budget-30d-${new Date().toISOString().split("T")[0]}.csv`,
      toCSV(
        data.timeline.map((r) => ({
          day: r.day,
          webhook_total: r.webhook_total,
          webhook_fail: r.webhook_fail,
          api_total: r.api_total,
          api_fail: r.api_fail,
        }))
      )
    );
  };

  const anyCritical =
    data && (data.webhooks.status === "critical" || data.external_api.status === "critical");
  const anyHigh =
    data && (data.webhooks.status === "high" || data.external_api.status === "high");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/reliability">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Reliability
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Flame className="w-7 h-7 text-primary" />
                Error Budget — 30 dias
              </h1>
              <p className="text-sm text-muted-foreground">
                Queima do orçamento de erros vs SLO. Alertas em 50% / 75% / 90%.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!data?.timeline?.length}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>

        {isLoading && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Calculando orçamento de erros...</CardContent></Card>
        )}

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-sm text-destructive">
              Falha ao carregar orçamento: {(error as Error).message}
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {(anyCritical || anyHigh) && (
              <Card className={anyCritical ? "border-destructive/60 bg-destructive/5" : "border-orange-500/60 bg-orange-500/5"}>
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${anyCritical ? "text-destructive" : "text-orange-500"}`} />
                  <div className="text-sm">
                    <div className="font-semibold">
                      {anyCritical ? "Orçamento crítico — congelar releases não-essenciais" : "Orçamento em alerta — reduza mudanças arriscadas"}
                    </div>
                    <div className="text-muted-foreground">
                      Um ou mais serviços ultrapassaram {anyCritical ? "90%" : "75%"} da queima. Priorize estabilização antes de novas features.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BudgetCard
                title="Webhooks"
                icon={<Webhook className="w-4 h-4 text-primary" />}
                slo={data.webhook_slo_pct}
                block={data.webhooks}
              />
              <BudgetCard
                title="API Externa"
                icon={<Zap className="w-4 h-4 text-primary" />}
                slo={data.api_slo_pct}
                block={data.external_api}
              />
            </div>

            {chart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Falhas diárias — últimos 30 dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" />
                        <Area type="monotone" dataKey="webhook_fail" name="Webhooks (falhas)" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.25)" strokeWidth={2} />
                        <Area type="monotone" dataKey="api_fail" name="API Externa (falhas)" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.20)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground text-right">
              Última atualização: {new Date(data.generated_at).toLocaleString("pt-BR")} • janela 30d • auto-refresh 5min
            </p>
          </>
        )}
      </div>
    </div>
  );
}