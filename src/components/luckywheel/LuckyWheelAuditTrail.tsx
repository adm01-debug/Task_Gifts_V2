import { useMemo, useState } from "react";
import { ArrowRight, History, Loader2, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLuckyWheelAudit } from "@/hooks/useLuckyWheel";
import {
  buildAuditTimeline,
  formatFieldValue,
  summarizeAudit,
  type AuditEntry,
  type AuditOperation,
} from "@/lib/luckyWheelAudit";
import { cn } from "@/lib/utils";

const OPERATION_META: Record<
  AuditOperation,
  { label: string; icon: typeof PlusCircle; variant: "default" | "secondary" | "destructive" }
> = {
  INSERT: { label: "Criado", icon: PlusCircle, variant: "default" },
  UPDATE: { label: "Alterado", icon: RefreshCw, variant: "secondary" },
  DELETE: { label: "Removido", icon: Trash2, variant: "destructive" },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatMoment(value: string): string {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? dateFormatter.format(new Date(ms)) : "Data desconhecida";
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const meta = OPERATION_META[entry.operation];
  const Icon = meta.icon;

  return (
    <li className="relative pl-6">
      <span
        className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/15"
        aria-hidden
      />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={meta.variant} className="gap-1">
          <Icon className="h-3 w-3" aria-hidden />
          {meta.label}
        </Badge>
        <span className="text-sm font-semibold text-foreground">{entry.prizeLabel}</span>
        <span className="text-xs text-muted-foreground">
          por {entry.changedByName} · {formatMoment(entry.changedAt)}
        </span>
      </div>

      {entry.changes.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {entry.changes.map((change) => (
            <li
              key={change.field}
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">{change.label}:</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {formatFieldValue(change.field, change.before)}
              </span>
              <ArrowRight className="h-3 w-3" aria-hidden />
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">
                {formatFieldValue(change.field, change.after)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Sem alteração em campos auditados.</p>
      )}
    </li>
  );
}

export interface LuckyWheelAuditTrailProps {
  className?: string;
}

/**
 * Linha do tempo de calibração da roleta. Os dados vêm de uma trilha
 * append-only escrita por trigger no banco — o frontend apenas lê.
 */
export function LuckyWheelAuditTrail({ className }: LuckyWheelAuditTrailProps) {
  const { data, isLoading, isError, refetch, isFetching } = useLuckyWheelAudit();
  const [expanded, setExpanded] = useState(false);

  const timeline = useMemo(() => buildAuditTimeline(data ?? []), [data]);
  const summary = useMemo(() => summarizeAudit(timeline), [timeline]);
  const visible = expanded ? timeline : timeline.slice(0, 8);

  return (
    <Card className={cn("border-border/60 bg-card/70 backdrop-blur", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" aria-hidden />
            Histórico de calibrações
          </CardTitle>
          <CardDescription>
            Trilha imutável: quem alterou cada peso, quando e o valor anterior.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="min-h-[44px] shrink-0"
          aria-label="Atualizar histórico"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o histórico agora. Tente atualizar.
          </p>
        ) : timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma calibração registrada ainda. Toda alteração futura de prêmio aparecerá aqui
            automaticamente.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Alterações", value: summary.total },
                { label: "Criações", value: summary.inserts },
                { label: "Exclusões", value: summary.deletes },
                { label: "Administradores", value: summary.editors },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <ol className="space-y-4 border-l border-border/60 pl-1">
              {visible.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </ol>

            {timeline.length > 8 && (
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] w-full"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "Mostrar menos" : `Ver todas as ${timeline.length} alterações`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}