import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Webhook, Zap, RefreshCw, AlertTriangle, BookOpen } from "lucide-react";
import { toCSV, downloadCSV } from "@/lib/csvExport";

interface BurnResp {
  window_minutes: number;
  slo: number;
  webhooks: { total: number; failures: number; error_rate: number; burn_rate: number };
  api_external: { total: number; failures: number; error_rate: number; burn_rate: number };
  computed_at: string;
}

const WINDOWS: { key: string; minutes: number; label: string; pair: "fast" | "slow"; role: "long" | "short"; threshold: number }[] = [
  { key: "fast-long", minutes: 60, label: "1h", pair: "fast", role: "long", threshold: 14.4 },
  { key: "fast-short", minutes: 5, label: "5min", pair: "fast", role: "short", threshold: 14.4 },
  { key: "slow-long", minutes: 360, label: "6h", pair: "slow", role: "long", threshold: 6 },
  { key: "slow-short", minutes: 30, label: "30min", pair: "slow", role: "short", threshold: 6 },
];

async function fetchBurn(minutes: number): Promise<BurnResp> {
  const { data, error } = await supabase.rpc("get_burn_rate", { _minutes: minutes });
  if (error) throw error;
  return data as unknown as BurnResp;
}

function burnBadge(burn: number, threshold: number) {
  if (burn >= threshold) return "bg-destructive/15 text-destructive border-destructive/30";
  if (burn >= threshold * 0.5) return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
}

export default function BurnRate() {
  const results = useQuery({
    queryKey: ["burn-rate-all"],
    queryFn: async () => {
      const all = await Promise.all(WINDOWS.map((w) => fetchBurn(w.minutes).then((d) => ({ w, d }))));
      return all;
    },
    refetchInterval: 60_000,
  });

  const alerts = useQuery({
    queryKey: ["burn-rate-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_alerts")
        .select("id, alert_type, severity, title, description, created_at, metadata")
        .like("alert_type", "burn_rate_%")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  const rows = results.data ?? [];
  const activeCrit = rows.filter(({ w, d }) => {
    const wh = Number(d?.webhooks?.burn_rate ?? 0);
    const ap = Number(d?.api_external?.burn_rate ?? 0);
    return wh >= w.threshold || ap >= w.threshold;
  });

  function exportSnapshot() {
    const flat = rows.flatMap(({ w, d }) => ([
      { janela: w.label, par: w.pair, papel: w.role, superficie: "webhooks",
        total: d.webhooks.total, falhas: d.webhooks.failures,
        taxa_erro_pct: (d.webhooks.error_rate * 100).toFixed(3),
        burn_rate: d.webhooks.burn_rate.toFixed(2), threshold: w.threshold },
      { janela: w.label, par: w.pair, papel: w.role, superficie: "api_externa",
        total: d.api_external.total, falhas: d.api_external.failures,
        taxa_erro_pct: (d.api_external.error_rate * 100).toFixed(3),
        burn_rate: d.api_external.burn_rate.toFixed(2), threshold: w.threshold },
    ]));
    downloadCSV(`burn-rate-${new Date().toISOString().slice(0,10)}.csv`, toCSV(flat));
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/reliability" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Reliability SLO
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-500" /> Burn Rate — Multi-Window (SRE)
          </h1>
          <p className="text-muted-foreground text-sm">
            Padrão Google SRE: alertas disparam quando <b>janela longa</b> e <b>janela curta</b> excedem o threshold simultaneamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { results.refetch(); alerts.refetch(); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportSnapshot} disabled={!rows.length}>
            Exportar CSV
          </Button>
        </div>
      </div>

      {activeCrit.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-destructive">Burn rate acima do limite em {activeCrit.length} janela(s).</div>
              <div className="text-muted-foreground">Confira o par correspondente abaixo — quando <b>ambas as janelas</b> do mesmo par (rápido ou lento) estiverem acima, um alerta será emitido automaticamente.</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["fast", "slow"] as const).map((pair) => {
          const items = rows.filter((r) => r.w.pair === pair);
          const threshold = items[0]?.w.threshold ?? 0;
          return (
            <Card key={pair}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">Par {pair === "fast" ? "Rápido (1h ∧ 5min)" : "Lento (6h ∧ 30min)"}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">≥ {threshold}x → {pair === "fast" ? "critical" : "high"}</Badge>
                    <Link to={`/admin/runbook/burn-rate-${pair}`}>
                      <Button variant="outline" size="sm" className="h-7">
                        <BookOpen className="w-3.5 h-3.5 mr-1" /> Runbook
                      </Button>
                    </Link>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map(({ w, d }) => (
                  <div key={w.key} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Janela {w.label} <span className="text-muted-foreground">({w.role === "long" ? "longa" : "curta"})</span></span>
                      <span className="text-xs text-muted-foreground">SLO {d.slo}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Webhook className="w-4 h-4 text-primary" />
                        <div className="text-xs">
                          <div className="text-muted-foreground">Webhooks</div>
                          <Badge variant="outline" className={burnBadge(d.webhooks.burn_rate, w.threshold)}>
                            {d.webhooks.burn_rate.toFixed(2)}x
                          </Badge>
                          <div className="text-muted-foreground mt-0.5">{d.webhooks.failures}/{d.webhooks.total} falhas</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <div className="text-xs">
                          <div className="text-muted-foreground">API externa</div>
                          <Badge variant="outline" className={burnBadge(d.api_external.burn_rate, w.threshold)}>
                            {d.api_external.burn_rate.toFixed(2)}x
                          </Badge>
                          <div className="text-muted-foreground mt-0.5">{d.api_external.failures}/{d.api_external.total} falhas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos disparos (multi-window)</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.isLoading && <div className="text-sm text-muted-foreground">Carregando…</div>}
          {alerts.data && alerts.data.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum alerta de burn-rate registrado.</div>
          )}
          <div className="space-y-2">
            {alerts.data?.map((a) => (
              <div key={a.id} className="border rounded-lg p-3 flex items-start gap-3">
                <Badge variant="outline" className={a.severity === "critical" ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-orange-500/15 text-orange-600 border-orange-500/30"}>
                  {a.severity}
                </Badge>
                <div className="text-sm flex-1">
                  <div className="font-medium">{a.title ?? a.alert_type}</div>
                  <div className="text-muted-foreground">{a.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}