import { Button } from "@/components/ui/button";
import type { NotificationChannel } from "@/lib/notificationTypePrefs";

export interface BulkChannelActionsProps {
  /** Canais que ganham atalho em lote (ordem preservada). */
  channels?: readonly NotificationChannel[];
  /** Celula/lote em gravacao — desativa os botoes enquanto houver escrita. */
  saving: string | null;
  onApply: (channel: NotificationChannel, value: boolean) => void | Promise<void>;
}

const LABELS: Record<NotificationChannel, string> = {
  in_app: "in-app",
  push: "push",
  email: "e-mail",
};

/**
 * Atalhos "silenciar/ativar tudo" por canal, compartilhados pelos paineis de
 * preferencias (jogos, campanhas). Extraido para evitar divergencia de UX e de
 * estado `disabled` entre as telas.
 */
export function BulkChannelActions({
  channels = ["push", "email"],
  saving,
  onApply,
}: BulkChannelActionsProps) {
  const busy = saving !== null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {channels.map((channel) => (
        <div key={channel} className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-[36px]"
            disabled={busy}
            onClick={() => void onApply(channel, false)}
          >
            Silenciar {LABELS[channel]}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-[36px]"
            disabled={busy}
            onClick={() => void onApply(channel, true)}
          >
            Ativar {LABELS[channel]}
          </Button>
        </div>
      ))}
    </div>
  );
}