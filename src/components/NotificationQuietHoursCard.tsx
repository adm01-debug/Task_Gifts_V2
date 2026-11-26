import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, MoonStar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

/**
 * Janela de silencio das notificacoes push. Persiste em
 * `notification_preferences.do_not_disturb_*` - o mesmo par lido por
 * `push_quiet_hours_until(_user_id)` dentro do `push-outbox-dispatcher`.
 *
 * Com a janela ligada, o aviso que chega entre o inicio e o fim nao e' perdido:
 * a linha da fila fica em `deferred` (sem gastar tentativa) e volta a ser
 * enviada quando a janela fecha. O alerta de seguranca do dispositivo nao passa
 * pela fila, entao continua imediato.
 *
 * `quiet_hours_start/end` sao o nome legado do mesmo par; aqui so' entram como
 * valor de leitura quando `do_not_disturb_*` esta nulo.
 */
const PADRAO_INICIO = "22:00";
const PADRAO_FIM = "08:00";

/** "HH:MM:SS" do banco -> "HH:MM" aceito pelo input. */
const paraInput = (valor: string | null | undefined, padrao: string) => {
  if (!valor) return padrao;
  const m = /^(\d{1,2}):(\d{2})/.exec(valor);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : padrao;
};

const paraBanco = (valor: string) => `${valor}:00`;

export function NotificationQuietHoursCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [inicio, setInicio] = useState(PADRAO_INICIO);
  const [fim, setFim] = useState(PADRAO_FIM);
  const [weekends, setWeekends] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select(
            "do_not_disturb_enabled, do_not_disturb_start, do_not_disturb_end, do_not_disturb_weekends, quiet_hours_start, quiet_hours_end",
          )
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!alive) return;
        setEnabled(data?.do_not_disturb_enabled === true);
        setInicio(paraInput(data?.do_not_disturb_start ?? data?.quiet_hours_start, PADRAO_INICIO));
        setFim(paraInput(data?.do_not_disturb_end ?? data?.quiet_hours_end, PADRAO_FIM));
        setWeekends(data?.do_not_disturb_weekends !== false);
        setLoadError(false);
      } catch (err: unknown) {
        if (!alive) return;
        logger.error("Falha ao carregar janela de silencio", String(err));
        setLoadError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, reloadKey]);

  const gravar = async (valores: {
    do_not_disturb_enabled: boolean;
    do_not_disturb_start: string;
    do_not_disturb_end: string;
    do_not_disturb_weekends: boolean;
  }) => {
    const userId = user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from("notification_preferences")
      .update(valores)
      .eq("user_id", userId)
      .select("user_id");
    if (error) throw error;
    if ((data?.length ?? 0) > 0) return;
    // Sem linha ainda: cria so' com estes campos, para nao impor o DEFAULT de
    // `type_preferences` nem apagar o que outro card ja gravou.
    const { error: insertError } = await supabase
      .from("notification_preferences")
      .insert({ user_id: userId, ...valores, type_preferences: {} });
    if (insertError) throw insertError;
  };

  const persist = async (parcial: Partial<{ enabled: boolean; inicio: string; fim: string; weekends: boolean }>) => {
    const anterior = { enabled, inicio, fim, weekends };
    const proximo = { ...anterior, ...parcial };
    setEnabled(proximo.enabled);
    setInicio(proximo.inicio);
    setFim(proximo.fim);
    setWeekends(proximo.weekends);
    setSaving(true);
    try {
      await gravar({
        do_not_disturb_enabled: proximo.enabled,
        do_not_disturb_start: paraBanco(proximo.inicio),
        do_not_disturb_end: paraBanco(proximo.fim),
        do_not_disturb_weekends: proximo.weekends,
      });
      toast.success(
        proximo.enabled
          ? `Avisos entre ${proximo.inicio} e ${proximo.fim} saem depois da janela`
          : "Janela de silencio desligada",
      );
    } catch (err: unknown) {
      logger.error("Falha ao salvar janela de silencio", String(err));
      toast.error("Nao foi possivel salvar a janela de silencio");
      setEnabled(anterior.enabled);
      setInicio(anterior.inicio);
      setFim(anterior.fim);
      setWeekends(anterior.weekends);
    } finally {
      setSaving(false);
    }
  };

  const janelaDesligada = inicio === fim;
  const resumo = !enabled
    ? "Desligada. Todo aviso sai assim que entra na fila."
    : janelaDesligada
      ? "Inicio igual ao fim: nao ha janela, o aviso sai na hora."
      : inicio < fim
        ? `Avisos que chegarem entre ${inicio} e ${fim} saem apos ${fim} (horario de Brasilia).`
        : `Avisos que chegarem entre ${inicio} e ${fim} do dia seguinte saem apos ${fim} (horario de Brasilia).`;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MoonStar className="h-4 w-4 text-primary" aria-hidden />
          Horario de silencio
        </CardTitle>
        <CardDescription>
          Escolha quando nao quer receber aviso. Nada e' descartado: o aviso fica guardado e chega
          quando a janela termina. Alerta de seguranca do dispositivo continua imediato.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : loadError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
              <p className="text-xs text-muted-foreground">
                Nao foi possivel carregar sua janela de silencio. O estado abaixo nao reflete o que
                esta salvo, entao nada foi alterado.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
              Tentar de novo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-card/40 p-3">
              <div>
                <Label htmlFor="quiet-hours-enabled" className="text-sm font-medium">
                  Silenciar avisos push neste horario
                </Label>
                <p className="text-[11px] text-muted-foreground">{resumo}</p>
              </div>
              <Switch
                id="quiet-hours-enabled"
                checked={enabled}
                disabled={saving}
                onCheckedChange={(v) => persist({ enabled: v })}
                aria-label="Silenciar avisos push neste horario"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quiet-hours-start" className="text-xs text-muted-foreground">
                  Inicio do silencio
                </Label>
                <Input
                  id="quiet-hours-start"
                  type="time"
                  value={inicio}
                  disabled={saving || !enabled}
                  onChange={(e) => setInicio(e.target.value)}
                  onBlur={() => { if (enabled && inicio !== "" && !saving) persist({ inicio }); }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quiet-hours-end" className="text-xs text-muted-foreground">
                  Fim do silencio
                </Label>
                <Input
                  id="quiet-hours-end"
                  type="time"
                  value={fim}
                  disabled={saving || !enabled}
                  onChange={(e) => setFim(e.target.value)}
                  onBlur={() => { if (enabled && fim !== "" && !saving) persist({ fim }); }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-card/40 p-3">
              <div>
                <Label htmlFor="quiet-hours-weekends" className="text-sm font-medium">
                  Aplicar tambem em sabado e domingo
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Desligado, a janela nao inicia no fim de semana - uma janela que comecou na sexta
                  ainda termina no sabado.
                </p>
              </div>
              <Switch
                id="quiet-hours-weekends"
                checked={weekends}
                disabled={saving || !enabled}
                onCheckedChange={(v) => persist({ weekends: v })}
                aria-label="Aplicar a janela de silencio em sabado e domingo"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationQuietHoursCard;