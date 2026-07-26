import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check, Loader2, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { usePushDevice } from "@/hooks/usePushDevice";
import {
  DEVICE_LABEL_MAX_LENGTH,
  normalizeDeviceLabel,
  suggestDeviceLabel,
} from "@/lib/deviceLabel";

/**
 * Campo de apelido do dispositivo. O valor é gravado no perfil do usuário
 * (tabela de inscrições push), portanto acompanha a conta e não a estação.
 */
function DeviceNicknameField() {
  const { device, isLoading, isSaving, save } = usePushDevice();
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(normalizeDeviceLabel(device?.device_label) ?? "");
  }, [device?.device_label]);

  if (isLoading) return null;

  const placeholder = suggestDeviceLabel(
    device?.user_agent ?? (typeof navigator !== "undefined" ? navigator.userAgent : null),
  );
  const savedLabel = normalizeDeviceLabel(device?.device_label);
  const isDirty = (normalizeDeviceLabel(value) ?? null) !== (savedLabel ?? null);

  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        save(value);
      }}
    >
      <Label htmlFor="device-nickname" className="text-xs text-muted-foreground">
        Apelido deste dispositivo
      </Label>
      <div className="flex gap-2">
        <Input
          id="device-nickname"
          value={value}
          maxLength={DEVICE_LABEL_MAX_LENGTH}
          placeholder={placeholder}
          disabled={!device || isSaving}
          onChange={(event) => setValue(event.target.value)}
          aria-describedby="device-nickname-help"
        />
        <Button type="submit" variant="outline" size="icon" disabled={!device || isSaving || !isDirty} aria-label="Salvar apelido">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
      </div>
      <p id="device-nickname-help" className="text-[11px] text-muted-foreground">
        {device
          ? "Salvo na sua conta — o apelido aparece no histórico e nos alertas de segurança."
          : "Ative as notificações acima para dar um apelido a este dispositivo."}
      </p>
    </form>
  );
}

interface PushNotificationToggleProps {
  compact?: boolean;
}

/**
 * Card device-scoped: gerencia a inscrição Web Push deste dispositivo/navegador.
 * Persiste a subscription em `push_subscriptions` via `pushSubscriptionService`.
 */
export function PushNotificationToggle({ compact = false }: PushNotificationToggleProps) {
  const { supported, subscribed, loading, toggle } = usePushSubscription();

  if (!supported) {
    if (compact) return null;
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notificações neste dispositivo
          </CardTitle>
          <CardDescription>
            Este navegador ou ambiente não suporta notificações push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : subscribed ? (
          <BellRing className="w-4 h-4 text-success" />
        ) : (
          <Bell className="w-4 h-4 text-muted-foreground" />
        )}
        <Switch
          checked={subscribed}
          disabled={loading}
          onCheckedChange={(v) => void toggle(v)}
          aria-label="Ativar notificações push neste dispositivo"
        />
      </div>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Notificações neste dispositivo
            </CardTitle>
            <CardDescription>
              Receba alertas de campanhas, kudos e conquistas mesmo com o app fechado.
            </CardDescription>
          </div>
          {subscribed ? (
            <Badge variant="outline" className="border-success/40 text-success bg-success/10 gap-1">
              <BellRing className="w-3 h-3" /> Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              <BellOff className="w-3 h-3" /> Inativo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/40">
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : subscribed ? (
              <BellRing className="w-5 h-5 text-success" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm">
                {subscribed ? "Push ativado" : "Push desativado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {subscribed
                  ? "Este navegador está inscrito para receber alertas."
                  : "Ative para receber notificações em tempo real."}
              </p>
            </div>
          </div>
          <Switch
            checked={subscribed}
            disabled={loading}
            onCheckedChange={(v) => void toggle(v)}
            aria-label="Ativar notificações push neste dispositivo"
          />
        </div>
        <DeviceNicknameField />

        <p className="text-[11px] text-muted-foreground mt-3">
          Ative por dispositivo. Preferências por tipo (campanhas, marcos, etc.) ficam no bloco
          abaixo.
        </p>
      </CardContent>
    </Card>
  );
}
