import { useState } from "react";
import { Laptop, Loader2, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePushDevices } from "@/hooks/usePushDevice";
import type { PushDeviceEntry, PushDeviceStatus } from "@/lib/pushDevices";

const STATUS_VARIANT: Record<PushDeviceStatus, "default" | "secondary" | "outline" | "destructive"> = {
  current: "default",
  active: "secondary",
  idle: "outline",
  revoked: "destructive",
};

function DeviceIcon({ entry }: { entry: PushDeviceEntry }) {
  const mobile = /iPhone|iPad|Android/i.test(entry.platform);
  const Icon = mobile ? Smartphone : Laptop;
  return <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />;
}

export interface PushDeviceListProps {
  className?: string;
}

/** Dispositivos inscritos para notificações, com revogação remota de acesso. */
export function PushDeviceList({ className }: PushDeviceListProps) {
  const { devices, summary, isLoading, revoke, revokingId } = usePushDevices();
  const [pending, setPending] = useState<PushDeviceEntry | null>(null);

  return (
    <Card className={cn("glass border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          Dispositivos inscritos
        </CardTitle>
        <CardDescription>
          {isLoading ? "Carregando dispositivos…" : summary.text}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dispositivo inscrito ainda. Ative as notificações para ver seus aparelhos aqui.
          </p>
        ) : (
          <ul className="space-y-2">
            {devices.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3",
                  entry.status === "revoked" && "opacity-60",
                )}
              >
                <DeviceIcon entry={entry} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-tight">{entry.label}</p>
                    <Badge variant={STATUS_VARIANT[entry.status]} className="text-[10px]">
                      {entry.statusLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.hasCustomLabel ? `${entry.platform} · ` : ""}
                    Último uso {entry.lastUsedRelative}
                  </p>
                  {entry.failureCount > 0 && entry.status !== "revoked" && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <TriangleAlert className="h-3 w-3" aria-hidden />
                      {entry.failureCount} {entry.failureCount === 1 ? "envio falhou" : "envios falharam"}
                    </p>
                  )}
                </div>
                {entry.canRevoke && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive min-h-11"
                    disabled={revokingId === entry.id}
                    onClick={() => setPending(entry)}
                    aria-label={`Remover acesso de ${entry.label}`}
                  >
                    {revokingId === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      "Remover"
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso de {pending?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.isCurrent
                ? "Este é o dispositivo que você está usando agora. Ele deixará de receber notificações até que você as ative novamente aqui."
                : "Esse aparelho deixará de receber notificações desta conta imediatamente. Você pode reativá-lo entrando na conta pelo próprio aparelho."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pending) revoke(pending);
                setPending(null);
              }}
            >
              Remover acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
