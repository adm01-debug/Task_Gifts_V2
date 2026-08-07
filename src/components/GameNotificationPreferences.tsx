import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BulkChannelActions } from "@/components/notifications/BulkChannelActions";
import { Gamepad2 } from "lucide-react";
import { useTypePreferences } from "@/hooks/useTypePreferences";
import type { ChannelMap, NotificationChannel } from "@/lib/notificationTypePrefs";

const CHANNELS: Array<{ key: NotificationChannel; label: string }> = [
  { key: "in_app", label: "In-app" },
  { key: "push", label: "Push" },
  { key: "email", label: "E-mail" },
];

interface GameRow {
  key: string;
  label: string;
  description: string;
  defaults: ChannelMap;
}

/**
 * E-mail fica desligado por padrao em todos os eventos de jogo: sao de alta
 * frequencia e o custo de irritacao supera o ganho de engajamento.
 */
const ROWS: readonly GameRow[] = [
  {
    key: "card_pack",
    label: "Pacotes de cartas",
    description: "Ao receber um pacote por tarefa no prazo, trilha concluída ou sequência.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "card_set_reward",
    label: "Coleção completa",
    description: "Quando você fecha um conjunto do álbum e libera a recompensa.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "auction",
    label: "Leilões",
    description: "Lance superado, encerramento e resultado da apuração.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "prediction_market",
    label: "Mercado de previsões",
    description: "Abertura, travamento e liquidação dos mercados em que você apostou.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "lucky_wheel",
    label: "Roleta da sorte",
    description: "Lembrete do giro diário disponível.",
    defaults: { in_app: true, push: false, email: false },
  },
  {
    key: "tournament",
    label: "Torneios e duelos",
    description: "Confrontos agendados, resultados e avanço de chave.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "boss_battle",
    label: "Chefão departamental",
    description: "Quando o chefão muda de fase (ferido, enfurecido, crítico) ou é derrotado.",
    defaults: { in_app: true, push: true, email: false },
  },
];

const ALL_KEYS = ROWS.map((r) => r.key);
const FALLBACK: ChannelMap = { in_app: true, push: true, email: false };

/**
 * Matriz de preferencias dos eventos de jogo (tipo x canal).
 * Toda escrita passa pelo motor puro `notificationTypePrefs`, que faz merge
 * aditivo - nao sobrescreve as preferencias de campanhas nem de relatorios.
 */
export function GameNotificationPreferences() {
  const defaultsFor = useCallback(
    (type: string): ChannelMap => ROWS.find((r) => r.key === type)?.defaults ?? FALLBACK,
    [],
  );
  const { loading, saving, values, setCell, setChannelForAll } = useTypePreferences({
    types: ALL_KEYS,
    defaultsFor,
    moduleName: "jogos",
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gamepad2 className="h-4 w-4 text-primary" aria-hidden />
          Notificações dos jogos
        </CardTitle>
        <CardDescription>
          Controle por canal os avisos de pacotes de cartas, leilões, previsões, roleta e torneios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : (
          <>
            <BulkChannelActions saving={saving} onApply={setChannelForAll} />
            {ROWS.map((row) => (
              <div key={row.key} className="rounded-lg border border-border/40 bg-card/40 p-3">
                <div className="mb-2">
                  <Label className="text-sm font-medium">{row.label}</Label>
                  <p className="text-xs text-muted-foreground">{row.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {CHANNELS.map((c) => {
                    const cellId = `${row.key}:${c.key}`;
                    return (
                      <div
                        key={c.key}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/30 bg-background/40 px-2 py-1.5"
                      >
                        <Label htmlFor={`game-pref-${cellId}`} className="text-xs text-muted-foreground">
                          {c.label}
                        </Label>
                        <Switch
                          id={`game-pref-${cellId}`}
                          checked={values[row.key]?.[c.key] ?? row.defaults[c.key]}
                          disabled={saving !== null}
                          onCheckedChange={(v) => setCell(row.key, c.key, v)}
                          aria-label={`${row.label} - ${c.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              O gatilho <code>card_pack_notify</code> e a fila <code>push_outbox</code> consultam estas
              preferências antes de enfileirar qualquer envio.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default GameNotificationPreferences;
