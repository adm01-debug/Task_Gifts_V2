import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileText, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useGenerateNr1ActionPlan, useNr1RiskMatrix, useNr1Summary } from "@/hooks/useNr1Risk";
import { Nr1RiskMatrix } from "@/components/engagement/nr1/Nr1RiskMatrix";
import { AnonymityGuardNotice } from "@/components/engagement/diagnostics/AnonymityGuardNotice";
import { exportNr1Csv, exportNr1Pdf } from "@/lib/nr1Export";
import { logger } from "@/services/loggingService";
import { toast } from "sonner";

const PERIODS = [
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "365", label: "Últimos 12 meses" },
];

const ALL_DEPARTMENTS = "all";

export default function Nr1Risks() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [days, setDays] = useState("180");
  const [departmentId, setDepartmentId] = useState(ALL_DEPARTMENTS);

  const filters = useMemo(
    () => ({
      days: Number(days),
      departmentId: departmentId === ALL_DEPARTMENTS ? null : departmentId,
    }),
    [days, departmentId],
  );

  const { data: departments } = useDepartments();
  const matrix = useNr1RiskMatrix(filters);
  const summary = useNr1Summary(filters);
  const rows = matrix.data ?? [];
  const isLoading = matrix.isLoading || summary.isLoading;
  const generatePlan = useGenerateNr1ActionPlan();

  const handleTreatRisk = (row: { category_key: string }) => {
    generatePlan.mutate(
      { categoryKey: row.category_key, departmentId: filters.departmentId, days: filters.days },
      { onSuccess: () => navigate("/planos-acao") },
    );
  };

  const scopeLabel =
    departmentId === ALL_DEPARTMENTS
      ? "Toda a empresa"
      : ((departments ?? []).find((d) => d.id === departmentId)?.name ?? "Departamento");

  const handleExportCsv = () => {
    try {
      exportNr1Csv(rows, { scope: scopeLabel, days: filters.days });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      logger.error("Falha ao exportar inventário NR-1 em CSV", message);
      toast.error("Não foi possível exportar o CSV", { description: message });
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportNr1Pdf(rows, { scope: scopeLabel, days: filters.days });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      logger.error("Falha ao exportar inventário NR-1 em PDF", message);
      toast.error("Não foi possível exportar o PDF", { description: message });
    }
  };


  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-full sm:w-[190px]" aria-label="Período de avaliação">
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

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <AnonymityGuardNotice context="Ainda não há respostas suficientes para inventariar os riscos psicossociais deste recorte." />
      )}

      {!isLoading && rows.length > 0 && summary.data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard label="Categorias avaliadas" value={summary.data.categories_evaluated} />
            <SummaryCard label="Riscos críticos" value={summary.data.critical_count} emphasis />
            <SummaryCard label="Riscos altos" value={summary.data.high_count} emphasis />
            <SummaryCard
              label="Grau médio"
              value={summary.data.avg_risk_grade ?? 0}
              decimals={1}
            />
          </div>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Inventário de riscos psicossociais</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11 sm:min-h-9"
                  onClick={handleExportCsv}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11 sm:min-h-9"
                  onClick={() => void handleExportPdf()}
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden />
                  PDF de auditoria
                </Button>
              </div>
            </div>
            <Nr1RiskMatrix
              rows={rows}
              onTreatRisk={handleTreatRisk}
              isTreating={generatePlan.isPending}
            />
          </section>
        </>
      )}
    </div>
  );

  return (
    <PageShell title="Riscos Psicossociais (NR-1)">
      {isMobile ? (
        <MobilePageLayout
          title="Riscos Psicossociais"
          icon={ShieldAlert}
          backPath="/engajamento/diagnostico"
          subtitle="Inventário NR-1 / ISO 45003"
        >
          {content}
        </MobilePageLayout>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold">Riscos Psicossociais (NR-1)</h1>
            <p className="text-sm text-muted-foreground">
              Inventário de riscos derivado da pesquisa contínua, com grau calculado por
              probabilidade x severidade conforme NR-1 e ISO 45003.
            </p>
          </header>
          {content}
        </div>
      )}
    </PageShell>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  decimals?: number;
  emphasis?: boolean;
}

function SummaryCard({ label, value, decimals = 0, emphasis = false }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            emphasis && value > 0
              ? "text-3xl font-bold tabular-nums text-destructive"
              : "text-3xl font-bold tabular-nums"
          }
        >
          {value.toFixed(decimals)}
        </p>
      </CardContent>
    </Card>
  );
}
