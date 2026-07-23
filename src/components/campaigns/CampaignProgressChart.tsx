import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

interface CampaignProgressChartProps {
  campaignId: string;
  currentUserId?: string | null;
  metricUnit?: string;
}

interface ProgressEvent {
  created_at: string;
  user_id: string;
  delta: number;
  new_value: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function CampaignProgressChart({
  campaignId,
  currentUserId,
  metricUnit = "",
}: CampaignProgressChartProps) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["campaign-progress-events", campaignId],
    queryFn: async (): Promise<ProgressEvent[]> => {
      const { data, error } = await db
        .from("campaign_progress_events")
        .select("created_at,user_id,delta,new_value")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ProgressEvent[];
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60,
  });

  const chartData = useMemo(() => {
    if (events.length === 0) return [];
    // Bucket por dia
    const buckets = new Map<string, { day: string; global: number; me: number }>();
    let globalCum = 0;
    let meCum = 0;
    for (const ev of events) {
      const day = ev.created_at.slice(0, 10);
      globalCum += Number(ev.delta) || 0;
      if (currentUserId && ev.user_id === currentUserId) {
        meCum += Number(ev.delta) || 0;
      }
      buckets.set(day, { day, global: globalCum, me: meCum });
    }
    return Array.from(buckets.values()).map((b) => ({
      ...b,
      label: format(parseISO(b.day), "dd MMM", { locale: ptBR }),
    }));
  }, [events, currentUserId]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-64" />
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold">Evolução do progresso</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Ainda não há progresso registrado. Assim que houver movimentação, o gráfico aparecerá aqui.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-bold">Evolução do progresso</h2>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                `${Number(value).toLocaleString("pt-BR")} ${metricUnit}`,
                name === "global" ? "Global" : "Você",
              ]}
            />
            <Legend
              formatter={(v) => (v === "global" ? "Global" : "Você")}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="global"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={false}
            />
            {currentUserId && (
              <Line
                type="monotone"
                dataKey="me"
                stroke="hsl(var(--accent-foreground))"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}