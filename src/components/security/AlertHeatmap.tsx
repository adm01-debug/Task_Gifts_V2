import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";

interface HeatmapRow {
  dow: number;
  hour: number;
  total: number;
  critical_count: number;
  high_count: number;
}

const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function AlertHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ["alert-heatmap-30d"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_alert_heatmap_30d");
      if (error) throw error;
      return (data ?? []) as HeatmapRow[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { grid, max, peak } = useMemo<{
    grid: Record<string, HeatmapRow>;
    max: number;
    peak: HeatmapRow | null;
  }>(() => {
    const g: Record<string, HeatmapRow> = {};
    let m = 0;
    let p: HeatmapRow | null = null;
    (data ?? []).forEach((r) => {
      g[`${r.dow}-${r.hour}`] = r;
      if (r.total > m) { m = r.total; p = r; }
    });
    return { grid: g, max: m, peak: p };
  }, [data]);

  const cellColor = (total: number) => {
    if (total === 0 || max === 0) return "bg-muted/40";
    const intensity = total / max;
    if (intensity > 0.75) return "bg-red-500 text-white";
    if (intensity > 0.5) return "bg-orange-500 text-white";
    if (intensity > 0.25) return "bg-yellow-500 text-black";
    return "bg-blue-500/60 text-white";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="w-4 h-4 text-orange-500" />
          Heatmap de Alertas — últimos 30 dias
          {peak && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Pico: {DOW_LABELS[peak.dow]} {String(peak.hour).padStart(2, "0")}h ({peak.total})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : max === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Sem alertas no período. 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: "auto repeat(24, minmax(20px, 1fr))" }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[9px] text-center text-muted-foreground">
                  {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                </div>
              ))}
              {DOW_LABELS.map((label, dow) => (
                <>
                  <div key={`l-${dow}`} className="text-[10px] pr-1 text-right text-muted-foreground self-center">
                    {label}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const cell = grid[`${dow}-${hour}`];
                    const total = cell?.total ?? 0;
                    return (
                      <div
                        key={`${dow}-${hour}`}
                        title={`${label} ${String(hour).padStart(2, "0")}h — ${total} alerta(s)${cell?.critical_count ? ` · ${cell.critical_count} crítico(s)` : ""}`}
                        className={`h-5 rounded-sm text-[9px] flex items-center justify-center ${cellColor(total)}`}
                      >
                        {total > 0 ? total : ""}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
              <span>Menos</span>
              <span className="w-4 h-3 rounded-sm bg-muted/40" />
              <span className="w-4 h-3 rounded-sm bg-blue-500/60" />
              <span className="w-4 h-3 rounded-sm bg-yellow-500" />
              <span className="w-4 h-3 rounded-sm bg-orange-500" />
              <span className="w-4 h-3 rounded-sm bg-red-500" />
              <span>Mais</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}