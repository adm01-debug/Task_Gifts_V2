import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileClock, RotateCcw, ShieldCheck } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  campaignTeamsService,
  type TeamSplitBatch,
} from "@/services/campaignTeamsService";
import { cn } from "@/lib/utils";

/** Motivos determinísticos gravados pela RPC, traduzidos para o operador. */
const REASON_LABELS: Record<string, string> = {
  empty_pool: "Prêmio coletivo não configurado",
  no_eligible_teams: "Nenhuma equipe bateu a meta",
  no_members_paid: "Equipes elegíveis, mas nenhum membro recebeu",
  team_without_members: "Equipe sem colaboradores alocados",
  zero_contribution: "Contribuição zero no modo proporcional",
  rounded_to_zero: "Valor arredondado para zero",
  members_count_zero: "Equipe sem contagem de membros",
  profile_not_found: "Perfil do colaborador inexistente",
  batch_not_found: "Lote inexistente",
  already_reverted: "Lote já revertido",
  nothing_to_revert: "Nenhum pagamento a estornar",
};

const label = (reason: string | null): string =>
  reason ? (REASON_LABELS[reason] ?? reason) : "—";

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "completed") return "default";
  if (status === "skipped") return "secondary";
  return "destructive";
}

const STATUS_LABELS: Record<string, string> = {
  completed: "Concluído",
  skipped: "Sem efeito",
  running: "Em execução",
  reverted: "Revertido",
};

interface Props {
  campaignId: string;
}

/**
 * Trilha de auditoria do rateio coletivo: um lote por execução e uma linha
 * por colaborador avaliado, com valores alocados e motivo de cada falha.
 * Serve como evidência de compliance e base para reversão manual.
 */
export function CampaignTeamSplitTrail({ campaignId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const queryClient = useQueryClient();

  const batches = useQuery({
    queryKey: ["campaign-team-split", campaignId, "batches"],
    queryFn: () => campaignTeamsService.listSplitBatches(campaignId),
    enabled: open,
    staleTime: 1000 * 15,
  });

  const entries = useQuery({
    queryKey: ["campaign-team-split", "entries", selected],
    queryFn: () => campaignTeamsService.listSplitEntries(selected!),
    enabled: !!selected,
    staleTime: 1000 * 15,
  });

  const activeBatch = useMemo<TeamSplitBatch | null>(
    () => (batches.data ?? []).find((b) => b.id === selected) ?? null,
    [batches.data, selected],
  );

  /**
   * Reversão do lote: estorna XP/moedas, libera as equipes e fecha o lote.
   * A RPC é idempotente, então cliques repetidos são inofensivos.
   */
  const revert = useMutation({
    mutationFn: (batchId: string) =>
      campaignTeamsService.revertSplitBatch(batchId, revertReason),
    onSuccess: (result) => {
      if (!result.reverted) {
        toast.warning(label(result.reason ?? null));
        return;
      }
      toast.success(
        `Rateio revertido: ${result.members_reverted ?? 0} colaborador(es) estornado(s), ` +
          `${result.teams_reset ?? 0} equipe(s) liberada(s).`,
      );
      setRevertReason("");
      queryClient.invalidateQueries({ queryKey: ["campaign-team-split"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-teams"] });
    },
    onError: () => {
      toast.error("Não foi possível reverter o rateio. Verifique suas permissões.");
    },
  });

  /** Exportação CSV para arquivamento e conferência externa. */
  const exportCsv = () => {
    const rows = entries.data ?? [];
    if (rows.length === 0) return;
    const header = [
      "lote",
      "data",
      "equipe",
      "colaborador",
      "user_id",
      "contribuicao",
      "progresso_equipe",
      "meta_equipe",
      "percentual_rateio",
      "xp_alocado",
      "moedas_alocadas",
      "resultado",
      "motivo",
    ];
    const body = rows.map((r) =>
      [
        r.batch_id,
        r.created_at,
        r.team_name ?? "",
        r.user_identifier ?? "",
        r.user_id ?? "",
        r.member_progress,
        r.team_progress,
        r.team_target,
        r.share_percent,
        r.xp_allocated,
        r.coins_allocated,
        r.outcome,
        r.failure_reason ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob([[header.join(";"), ...body].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rateio-${selected}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-2">
          <FileClock className="h-4 w-4" /> Auditoria do rateio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Trilha de auditoria do rateio coletivo
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {batches.isLoading ? (
            <Skeleton className="h-40" />
          ) : (batches.data ?? []).length === 0 ? (
            <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhuma execução de rateio registrada nesta campanha.
            </Card>
          ) : (
            <div className="space-y-2">
              {(batches.data ?? []).map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  onClick={() => setSelected(selected === batch.id ? null : batch.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    selected === batch.id && "border-primary bg-muted/40",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(batch.status)}>
                      {STATUS_LABELS[batch.status] ?? batch.status}
                    </Badge>
                    <span className="text-sm font-medium">{formatDateTime(batch.created_at)}</span>
                    <span className="text-xs text-muted-foreground">
                      modo {batch.share_mode}
                    </span>
                    {batch.reason && (
                      <Badge variant="outline" className="text-xs">
                        {label(batch.reason)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {batch.teams_awarded} equipe(s) · {batch.members_awarded} pago(s) ·{" "}
                    {batch.members_skipped} pulado(s) ·{" "}
                    {numberFormatter.format(batch.total_xp_paid)} XP e{" "}
                    {numberFormatter.format(batch.total_coins_paid)} moedas distribuídos
                    {" · "}pool {numberFormatter.format(batch.pool_xp)} XP /{" "}
                    {numberFormatter.format(batch.pool_coins)} moedas
                  </div>
                  {batch.reverted_at && (
                    <div className="mt-1 text-xs font-medium text-destructive">
                      Revertido em {formatDateTime(batch.reverted_at)}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b p-3">
                <div className="text-sm font-medium">
                  Linhas do lote {activeBatch ? formatDateTime(activeBatch.created_at) : ""}
                </div>
                <div className="flex items-center gap-2">
                  {activeBatch &&
                    activeBatch.status === "completed" &&
                    !activeBatch.reverted_at && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="gap-2">
                            <RotateCcw className="h-4 w-4" /> Reverter
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reverter este rateio?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O XP e as moedas pagos serão estornados de cada colaborador
                              (sem gerar saldo negativo) e as equipes voltarão a ficar
                              disponíveis para um novo rateio. A ação fica registrada na
                              trilha de auditoria.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <Textarea
                            value={revertReason}
                            onChange={(e) => setRevertReason(e.target.value)}
                            placeholder="Motivo da reversão (opcional, mas recomendado para compliance)"
                            rows={3}
                          />
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={revert.isPending}
                              onClick={() => revert.mutate(activeBatch.id)}
                            >
                              {revert.isPending ? "Revertendo..." : "Confirmar reversão"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={exportCsv}
                    disabled={(entries.data ?? []).length === 0}
                  >
                    <Download className="h-4 w-4" /> CSV
                  </Button>
                </div>
              </div>
              {entries.isLoading ? (
                <Skeleton className="m-3 h-32" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipe</TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead className="text-right">Contribuição</TableHead>
                        <TableHead className="text-right">% rateio</TableHead>
                        <TableHead className="text-right">Alocado</TableHead>
                        <TableHead>Resultado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(entries.data ?? []).map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">{entry.team_name ?? "—"}</TableCell>
                          <TableCell className="text-sm">
                            {entry.user_identifier ?? "—"}
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {entry.user_id?.slice(0, 8) ?? ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {numberFormatter.format(entry.member_progress)}
                            <span className="ml-1 text-xs text-muted-foreground">
                              / {numberFormatter.format(entry.team_progress)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {numberFormatter.format(entry.share_percent)}%
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            {entry.xp_allocated} XP
                            <div className="text-xs text-muted-foreground">
                              {entry.coins_allocated} moedas
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.outcome === "paid" ? (
                              <Badge>Pago</Badge>
                            ) : (
                              <Badge variant="secondary" title={entry.failure_reason ?? ""}>
                                {label(entry.failure_reason)}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}