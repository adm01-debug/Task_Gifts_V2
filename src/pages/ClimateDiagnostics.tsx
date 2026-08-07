import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, Percent, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/navigation";
import { MobilePageLayout } from "@/components/mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDepartments } from "@/hooks/useDepartments";
import { useRBAC } from "@/hooks/useRBAC";
import { useGenerateActionPlanFromFactor } from "@/hooks/useActionPlanGenerator";
import type { FactorScore } from "@/services/engagementDiagnosticsService";
import {
  useEngagementCorrelations,
  useEngagementBenchmark,
  useEngagementFactorScores,
  useEngagementNps,
  useEngagementNpsHistory,
  useEngagementOverview,
  useEngagementPillarScores,
} from "@/hooks/useEngagementDiagnostics";
import { AnonymityGuardNotice } from "@/components/engagement/diagnostics/AnonymityGuardNotice";
import { AutoInsights } from "@/components/engagement/diagnostics/AutoInsights";
import { BenchmarkComparison } from "@/components/engagement/diagnostics/BenchmarkComparison";
import {
  buildBenchmarkComparisons,
  DEFAULT_BENCHMARK_COMPANY_SIZE,
  DEFAULT_BENCHMARK_INDUSTRY,
} from "@/lib/climateBenchmark";
import { buildNpsSeries } from "@/lib/npsHistory";
import { CorrelationInsights } from "@/components/engagement/diagnostics/CorrelationInsights";
import { FactorRanking } from "@/components/engagement/diagnostics/FactorRanking";
import { NpsCards } from "@/components/engagement/diagnostics/NpsCards";
import { NpsHistoryChart } from "@/components/engagement/diagnostics/NpsHistoryChart";
import { PillarHeatmap } from "@/components/engagement/diagnostics/PillarHeatmap";

const PERIODS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "365", label: "Últimos 12 meses" },
];

const ALL_DEPARTMENTS = "all";

export default function ClimateDiagnostics() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [days, setDays] = useState("90");
  const [departmentId, setDepartmentId] = useState(ALL_DEPARTMENTS);
  const [favorabilityMode, setFavorabilityMode] = useState(false);
  const [generatingFactorKey, setGeneratingFactorKey] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      days: Number(days),
      departmentId: departmentId === ALL_DEPARTMENTS ? null : departmentId,
    }),
    [days, departmentId],
  );

  const { data: departments } = useDepartments();
  const { isAdmin, isManager } = useRBAC();
  const generatePlan = useGenerateActionPlanFromFactor();
  const canGeneratePlan = isAdmin || isManager;

  const handleGeneratePlan = useCallback(
    (factor: FactorScore) => {
      setGeneratingFactorKey(factor.factor_key);
      generatePlan.mutate(
        {
          factorKey: factor.factor_key,
          departmentId: filters.departmentId,
          days: filters.days,
        },
        {
          onSuccess: (planId) => navigate(`/planos-acao?plan=${planId}`),
          onSettled: () => setGeneratingFactorKey(null),
        },
      );
    },
    [filters.departmentId, filters.days, generatePlan, navigate],
  );

  const handleGeneratePlanByKey = useCallback(
    (factorKey: string) => {
      setGeneratingFactorKey(factorKey);
      generatePlan.mutate(
        { factorKey, departmentId: filters.departmentId, days: filters.days },
        {
          onSuccess: (planId) => navigate(`/planos-acao?plan=${planId}`),
          onSettled: () => setGeneratingFactorKey(null),
        },
      );
    },
    [filters.departmentId, filters.days, generatePlan, navigate],
  );

  const overview = useEngagementOverview(filters);
  const pillars = useEngagementPillarScores(filters);
  const factors = useEngagementFactorScores(filters);
  const nps = useEngagementNps(filters);
  const npsHistory = useEngagementNpsHistory({
    departmentId: filters.departmentId,
    months: 12,
    bucket: "month",
  });
  const correlations = useEngagementCorrelations(Math.max(Number(days), 180));
  const [benchmarkIndustry, setBenchmarkIndustry] = useState<string>(DEFAULT_BENCHMARK_INDUSTRY);
  const [benchmarkSize, setBenchmarkSize] = useState<string>(DEFAULT_BENCHMARK_COMPANY_SIZE);
  const benchmark = useEngagementBenchmark(filters, {
    industry: benchmarkIndustry,
    companySize: benchmarkSize,
  });

  /** Comparações de mercado normalizadas — o motor de insights só lê gaps confiáveis. */
  const benchmarkComparisons = useMemo(
    () => buildBenchmarkComparisons(benchmark.data ?? []),
    [benchmark.data],
  );

  /** eNPS/LNPS atuais enriquecidos com o período anterior da série histórica. */
  const npsWithHistory = useMemo(() => {
    const series = buildNpsSeries(npsHistory.data ?? []);
    return (nps.data ?? []).map((metric) => ({
      metric: metric.metric,
      score: metric.score,
      respondents: metric.respondents,
      previousScore: series.find((s) => s.metric === metric.metric)?.previous ?? null,
    }));
  }, [nps.data, npsHistory.data]);

  const isLoading = overview.isLoading || pillars.isLoading;
  const hasData = !!overview.data && (pillars.data ?? []).length > 0;

  const summary = overview.data;
  const headline = favorabilityMode
    ? summary?.overall_favorability !== null && summary?.overall_favorability !== undefined
      ? `${summary.overall_favorability.toFixed(0)}%`
      : "—"
    : summary?.overall_score !== null && summary?.overall_score !== undefined
      ? summary.overall_score.toFixed(1)
      : "—";

  const content = (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-full sm:w-[190px]" aria-label="Período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="w-full sm:w-[220px]" aria-label="Departamento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DEPARTMENTS}>Toda a empresa</SelectItem>
              {(departments ?? []).map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="favorability-mode"
            checked={favorabilityMode}
            onCheckedChange={setFavorabilityMode}
          />
          <Label htmlFor="favorability-mode" className="text-sm">
            Modo favorabilidade
          </Label>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!isLoading && !hasData && (
        <AnonymityGuardNotice context="Ainda não há respostas suficientes neste recorte." />
      )}

      {!isLoading && hasData && summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {favorabilityMode ? "Favorabilidade geral" : "Índice de engajamento"}
                </CardTitle>
                {favorabilityMode ? (
                  <Percent className="h-4 w-4 text-muted-foreground" aria-hidden />
                ) : (
                  <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{headline}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.answer_count} respostas no período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Participação
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">
                  {summary.participation_rate !== null
                    ? `${summary.participation_rate.toFixed(0)}%`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary.respondents} de {summary.eligible_users} colaboradores
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pilares avaliados
                </CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{(pillars.data ?? []).length}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(factors.data ?? []).length} fatores com dados suficientes
                </p>
              </CardContent>
            </Card>
          </div>

          <AutoInsights
            overview={summary}
            pillars={pillars.data ?? []}
            factors={factors.data ?? []}
            benchmark={benchmarkComparisons}
            nps={npsWithHistory}
            isLoading={benchmark.isLoading || factors.isLoading}
            canGeneratePlan={canGeneratePlan}
            generatingFactorKey={generatingFactorKey}
            onGeneratePlan={handleGeneratePlanByKey}
          />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Mapa de clima por pilar</h2>
            <PillarHeatmap pillars={pillars.data ?? []} favorabilityMode={favorabilityMode} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Benchmark de mercado</h2>
            <BenchmarkComparison
              rows={benchmark.data}
              isLoading={benchmark.isLoading}
              industry={benchmarkIndustry}
              onIndustryChange={setBenchmarkIndustry}
              companySize={benchmarkSize}
              onCompanySizeChange={setBenchmarkSize}
            />
          </section>

          {(nps.data ?? []).length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Lealdade</h2>
              <NpsCards metrics={nps.data ?? []} />
              <NpsHistoryChart
                rows={npsHistory.data}
                bucket="month"
                isLoading={npsHistory.isLoading}
              />
            </section>
          )}

          {(factors.data ?? []).length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Fatores</h2>
              <FactorRanking
                factors={factors.data ?? []}
                onGeneratePlan={canGeneratePlan ? handleGeneratePlan : undefined}
                generatingFactorKey={generatingFactorKey}
              />
            </section>
          )}

          <CorrelationInsights correlations={correlations.data ?? []} />
        </>
      )}
    </div>
  );

  return (
    <PageShell title="Diagnóstico de Clima">
      {isMobile ? (
        <MobilePageLayout
          title="Diagnóstico de Clima"
          icon={Gauge}
          backPath="/engajamento"
          subtitle="Resultados agregados e anônimos"
        >
          {content}
        </MobilePageLayout>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold">Diagnóstico de Clima</h1>
            <p className="text-sm text-muted-foreground">
              Resultados agregados e anônimos da pesquisa contínua de engajamento.
            </p>
          </header>
          {content}
        </div>
      )}
    </PageShell>
  );
}
