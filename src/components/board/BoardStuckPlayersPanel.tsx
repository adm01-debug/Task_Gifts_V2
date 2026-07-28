import { useMemo, useState } from "react";
import { AlertTriangle, LockOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStuckBoardPlayers, useUnblockBoardPlayers } from "@/hooks/useBoardTrail";
import { getErrorMessage } from "@/lib/errorMessages";

const MIN_HOURS = 1;
const MAX_HOURS = 720;
const DEFAULT_HOURS = 48;

export interface BoardStuckPlayersPanelProps {
  /** Quando nulo, considera todas as trilhas. */
  trailId: string | null;
  trailTitle?: string | null;
}

/**
 * Painel de desbloqueio sob demanda: mostra quem está parado num desafio há
 * mais de X horas e permite liberar o mesmo conjunto que o cron diário
 * liberaria — sem pagar recompensa e com registro em `board_moves`.
 */
export function BoardStuckPlayersPanel({ trailId, trailTitle }: BoardStuckPlayersPanelProps) {
  const [hoursInput, setHoursInput] = useState(String(DEFAULT_HOURS));

  // O corte é normalizado aqui e novamente no banco — a UI nunca é a única guarda.
  const maxHours = useMemo(() => {
    const parsed = Number.parseInt(hoursInput, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_HOURS;
    return Math.min(Math.max(parsed, MIN_HOURS), MAX_HOURS);
  }, [hoursInput]);

  const { data, isLoading, isError, error, refetch, isFetching } = useStuckBoardPlayers(
    maxHours,
    trailId,
  );
  const unblockMutation = useUnblockBoardPlayers();

  const rows = data ?? [];

  const handleUnblock = async () => {
    try {
      const released = await unblockMutation.mutateAsync({ maxHours, trailId });
      toast.success(
        released.length === 0
          ? "Nenhum jogador elegível no momento."
          : `${released.length} jogador(es) liberado(s).`,
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <LockOpen className="h-4 w-4" />
          Jogadores travados
        </CardTitle>
        <Badge variant="secondary">{rows.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Libera quem parou num desafio há mais tempo que o limite. Nenhuma recompensa é
          paga e cada liberação fica registrada no histórico.
          {trailTitle ? ` Trilha: ${trailTitle}.` : " Todas as trilhas."}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="stuck-hours">Travado há mais de (horas)</Label>
            <Input
              id="stuck-hours"
              type="number"
              inputMode="numeric"
              min={MIN_HOURS}
              max={MAX_HOURS}
              value={hoursInput}
              onChange={(event) => setHoursInput(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => void handleUnblock()}
            disabled={unblockMutation.isPending || rows.length === 0}
          >
            <LockOpen className="mr-2 h-4 w-4" />
            Desbloquear
          </Button>
        </div>

        {isError && (
          <p className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {getErrorMessage(error)}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum jogador travado acima do limite informado.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((row) => (
              <li
                key={`${row.trail_id}:${row.user_id}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.trail_title ?? "Trilha"} · casa {row.position}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {row.blocked_hours}h
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}