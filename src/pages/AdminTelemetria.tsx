import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, RefreshCw, Trash2, Download, FileText, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TelemetryCharts } from "@/components/admin/telemetry/TelemetryCharts";
import { TelemetryStatsCards } from "@/components/admin/telemetry/TelemetryStatsCards";
import { TopOffendersCard } from "@/components/admin/telemetry/TopOffendersCard";
import { toast } from "sonner";
import { PageShell } from "@/components/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageWrapper } from "@/components/PageWrapper";
import { DesktopBackButton } from "@/components/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  record_count: number | null;
  query_limit: number | null;
  query_offset: number | null;
  count_mode: string | null;
  severity: string;
  error_message: string | null;
  user_id: string | null;
  created_at: string;
}

export type SeverityFilter = "all" | "slow" | "very_slow" | "error";
export type TimeFilter = "1h" | "6h" | "24h" | "7d" | "custom";

export function getTimeThreshold(timeFilter: TimeFilter, customStart?: Date): string {
  const now = new Date();
  switch (timeFilter) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case "6h": return new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "custom": return customStart ? customStart.toISOString() : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

export function formatDuration(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function exportTelemetryCSV(rows: TelemetryRow[]) {
  const BOM = "\uFEFF";
  const headers = ["Quando", "Operação", "Tabela/RPC", "Duração (ms)", "Records", "Limit", "Offset", "Count Mode", "Severidade", "Erro"];
  const csvRows = rows.map(r => [
    formatTime(r.created_at),
    r.operation,
    r.rpc_name || r.table_name || "-",
    String(r.duration_ms),
    r.record_count != null ? String(r.record_count) : "-",
    r.query_limit != null ? String(r.query_limit) : "-",
    r.query_offset != null ? String(r.query_offset) : "-",
    r.count_mode || "-",
    r.severity,
    r.error_message || "-",
  ]);

  const csv = BOM + [headers.join(";"), ...csvRows.map(r => r.join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `telemetria_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTelemetryPDF(rows: TelemetryRow[]) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });
  doc.setFontSize(16);
  doc.text("Telemetria de Queries — Relatório", 14, 15);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")} · ${rows.length} registros`, 14, 22);

  const tableData = rows.map(r => [
    formatTime(r.created_at),
    r.operation,
    r.rpc_name || r.table_name || "-",
    formatDuration(r.duration_ms),
    r.record_count != null ? String(r.record_count) : "-",
    r.query_limit != null ? String(r.query_limit) : "-",
    r.severity,
    r.error_message ? r.error_message.substring(0, 40) : "-",
  ]);

  autoTable(doc, {
    startY: 28,
    head: [["Quando", "Operação", "Tabela/RPC", "Duração", "Records", "Limit", "Severidade", "Erro"]],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === "body") {
        const val = String(data.cell.raw);
        if (val === "very_slow") data.cell.styles.textColor = [220, 38, 38];
        else if (val === "slow") data.cell.styles.textColor = [202, 138, 4];
        else if (val === "error") data.cell.styles.textColor = [220, 38, 38];
      }
    },
  });

  doc.save(`telemetria_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
}

function AdminTelemetriaContent() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const threshold = getTimeThreshold(timeFilter, customStartDate);

  const { data: rows = [], isLoading, refetch, isRefetching } = useQuery<TelemetryRow[]>({
    queryKey: ["query-telemetry", severityFilter, timeFilter, customStartDate?.toISOString(), customEndDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("query_telemetry" as any)
        .select("*")
        .gte("created_at", threshold)
        .order("created_at", { ascending: false })
        .limit(500);

      if (timeFilter === "custom" && customEndDate) {
        query = query.lte("created_at", customEndDate.toISOString());
      }

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TelemetryRow[]) || [];
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const handleCleanup = async () => {
    const cleanupThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("query_telemetry" as any)
      .delete()
      .lt("created_at", cleanupThreshold);
    if (error) {
      toast.error("Erro ao limpar dados antigos");
    } else {
      toast.success("Dados com mais de 7 dias removidos");
      refetch();
    }
  };

  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length) : 0;

  const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  for (const r of rows) {
    const key = r.rpc_name || r.table_name || "unknown";
    const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    tableStats.set(key, {
      count: prev.count + 1,
      totalMs: prev.totalMs + r.duration_ms,
      maxMs: Math.max(prev.maxMs, r.duration_ms),
    });
  }
  const topOffenders = [...tableStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "very_slow":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">🔴 Muito Lenta</Badge>;
      case "slow":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-[10px]">🟡 Lenta</Badge>;
      case "error":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">❌ Erro</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{severity}</Badge>;
    }
  };

   return (
     <PageShell title="Telemetria de Queries" backFallback="/admin">
       <PageWrapper pageName="Telemetria de Queries">
         <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8 pb-24">
           <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-primary/10">
                 <Activity className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold">Telemetria de Queries</h1>
                 <p className="text-muted-foreground">Monitoramento de performance do banco externo</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => exportTelemetryCSV(rows)} disabled={rows.length === 0}>
                 <Download className="h-3.5 w-3.5 mr-1.5" />
                 CSV
               </Button>
               <Button variant="outline" size="sm" onClick={() => exportTelemetryPDF(rows)} disabled={rows.length === 0}>
                 <FileText className="h-3.5 w-3.5 mr-1.5" />
                 PDF
               </Button>
               <Button variant="outline" size="sm" onClick={handleCleanup}>
                 <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                 Limpar +7d
               </Button>
               <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                 <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
                 Atualizar
               </Button>
             </div>
           </header>

           <TelemetryStatsCards verySlow={verySlow} slow={slow} errors={errors} avgDuration={avgDuration} />

          <TopOffendersCard topOffenders={topOffenders} />

          {/* Charts */}
          <TelemetryCharts rows={rows} timeFilter={timeFilter} />

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="slow">🟡 Lentas</SelectItem>
                <SelectItem value="very_slow">🔴 Muito Lentas</SelectItem>
                <SelectItem value="error">❌ Erros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="6h">Últimas 6h</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="custom">📅 Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {timeFilter === "custom" && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[130px] text-left font-normal", !customStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-xs text-muted-foreground">até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[130px] text-left font-normal", !customEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <span className="text-xs text-muted-foreground ml-auto">
              {rows.length} registros · auto-refresh 30s
            </span>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma query lenta registrada</p>
                  <p className="text-sm mt-1">Isso é bom! O sistema está performando bem.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium text-muted-foreground">Quando</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Operação</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Tabela/RPC</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Duração</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Records</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Limit</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Offset</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Count</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Severidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                            {formatTime(row.created_at)}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {row.operation}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-xs font-medium">
                            {row.rpc_name || row.table_name || "-"}
                          </td>
                          <td className="p-3 text-right font-mono font-bold tabular-nums">
                            <span className={row.duration_ms >= 8000 ? "text-destructive" : row.duration_ms >= 3000 ? "text-yellow-600" : ""}>
                              {formatDuration(row.duration_ms)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-xs tabular-nums">
                            {row.record_count ?? "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {row.query_limit ?? "-"}
                          </td>
                          <td className="p-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                            {row.query_offset ?? "-"}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {row.count_mode || "-"}
                          </td>
                          <td className="p-3">
                            {getSeverityBadge(row.severity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
           </div>
         </PageWrapper>
       </PageShell>
     );
   }

export default function AdminTelemetriaPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminTelemetriaContent />
    </ProtectedRoute>
  );
}
