import { useState } from "react";
import {
  HelpCircle,
  Laptop,
  Loader2,
  ShieldCheck,
  Smartphone,
  Tablet,
  TriangleAlert,
} from "lucide-react";
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
import type { PushDeviceEntry, PushDeviceKind, PushDeviceStatus } from "@/lib/pushDevices";

const STATUS_VARIANT: Record<PushDeviceStatus, "default" | "secondary" | "outline" | "destructive"> = {
  current: "default",
  active: "secondary",
  idle: "outline",
  revoked: "destructive",
};

const KIND_ICON: Record<PushDeviceKind, typeof Laptop> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
  unknown: HelpCircle,
};

function DeviceIcon({ entry }: { entry: PushDeviceEntry }) {
  const Icon = KIND_ICON[entry.kind];
  return (
    <Icon
      className={cn(
        "mt-0.5 h-5 w-5 shrink-0",
        entry.isCurrent ? "text-primary" : "text-muted-foreground",
      )}
      aria-hidden
    />
  );
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
          Aparelhos da conta
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Carregando aparelhos…"
            : `${summary.text} · acessos e notificações unificados por aparelho`}
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
            Nenhum aparelho registrado ainda. Ao entrar na conta ou ativar as notificações, o
            aparelho aparece aqui.
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
                    {!entry.pushActive && entry.status !== "revoked" && (
                      <Badge variant="outline" className="text-[10px]">
                        Sem notificações
                      </Badge>
                    )}
                    {entry.isTrusted && entry.status !== "revoked" && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <ShieldCheck className="h-3 w-3" aria-hidden />
                        Confiável
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.descriptor ? `${entry.descriptor} · ` : entry.hasCustomLabel ? `${entry.platform} · ` : ""}
                    {entry.pushActive ? `Último uso ${entry.lastUsedRelative}` : "Somente acesso à conta"}
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
                    aria-label={`Encerrar acesso de ${entry.label}`}
                  >
                    {revokingId === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      "Encerrar acesso"
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
            <AlertDialogTitle>Encerrar acesso de {pending?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.isCurrent
                ? "Este é o aparelho que você está usando agora. Ele deixará de receber notificações e o acesso será marcado como encerrado até você entrar de novo."
                : "O aparelho perde as notificações e tem o acesso marcado como encerrado imediatamente. Os demais aparelhos da conta recebem um alerta de segurança."}
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
              Encerrar acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
