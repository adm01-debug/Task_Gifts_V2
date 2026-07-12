import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, RefreshCw, Save, Webhook, Copy, Check } from "lucide-react";

const COMMON_EVENTS = [
  "task.completed",
  "task.overdue",
  "user.level_up",
  "user.achievement_unlocked",
  "attendance.check_in",
  "quest.completed",
  "kudos.given",
  "test.ping",
];

function generateSecret(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function WebhookSubscriptionNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState(() => generateSecret());
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [customEvent, setCustomEvent] = useState("");
  const [timeout, setTimeoutSec] = useState(30);
  const [retryCount, setRetryCount] = useState(3);
  const [headersText, setHeadersText] = useState("{}");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Nova assinatura de Webhook";
  }, []);

  const headersValid = useMemo(() => {
    try {
      const parsed = JSON.parse(headersText || "{}");
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }, [headersText]);

  const urlValid = useMemo(() => {
    try {
      const u = new URL(url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, [url]);

  const toggleEvent = (evt: string) => {
    setEvents((prev) => (prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]));
  };

  const addCustomEvent = () => {
    const v = customEvent.trim();
    if (!v) return;
    if (!events.includes(v)) setEvents((prev) => [...prev, v]);
    setCustomEvent("");
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success("Secret copiado — guarde em local seguro (não será exibido novamente)");
    setTimeout(() => setCopied(false), 2000);
  };

  const canSave = name.trim().length >= 3 && urlValid && headersValid && events.length > 0 && secret.length >= 32 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const headers = JSON.parse(headersText || "{}");
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .insert({
          name: name.trim(),
          url: url.trim(),
          secret,
          events,
          timeout_seconds: Math.max(5, Math.min(120, timeout)),
          retry_count: Math.max(0, Math.min(10, retryCount)),
          headers,
          is_active: isActive,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      toast.success("Assinatura criada com sucesso");
      navigate(`/admin/webhooks/${data?.id ?? ""}`);
    } catch (e) {
      toast.error(`Falha ao criar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/webhooks")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>

      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Webhook className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Nova assinatura de Webhook</h1>
          <p className="text-sm text-muted-foreground">Configure endpoint, eventos e credenciais HMAC.</p>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Bitrix24 · Produção" />
          </div>
          <div>
            <Label htmlFor="url">URL de destino</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemplo.com/webhooks/taskgifts" />
            {url && !urlValid && <p className="text-xs text-destructive mt-1">URL inválida (use http/https).</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="active" className="cursor-pointer">Assinatura ativa</Label>
              <p className="text-xs text-muted-foreground">Desative para pausar entregas sem excluir.</p>
            </div>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><KeyRound className="w-4 h-4" />Secret HMAC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Este valor é usado para assinar o header <code className="text-foreground">X-Signature</code> (HMAC-SHA256). Copie e guarde em local seguro — depois de salvo, você não conseguirá vê-lo novamente.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={secret} className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={copySecret} className="shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSecret(generateSecret())} className="shrink-0" title="Gerar novo secret">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Eventos ({events.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {COMMON_EVENTS.map((evt) => {
              const active = events.includes(evt);
              return (
                <button
                  key={evt}
                  type="button"
                  onClick={() => toggleEvent(evt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent hover:bg-muted border-border text-muted-foreground"
                  }`}
                >
                  {evt}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              value={customEvent}
              onChange={(e) => setCustomEvent(e.target.value)}
              placeholder="evento.customizado"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomEvent(); } }}
            />
            <Button variant="outline" onClick={addCustomEvent} disabled={!customEvent.trim()}>Adicionar</Button>
          </div>
          {events.filter((e) => !COMMON_EVENTS.includes(e)).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {events.filter((e) => !COMMON_EVENTS.includes(e)).map((e) => (
                <Badge key={e} variant="secondary" className="cursor-pointer" onClick={() => toggleEvent(e)}>
                  {e} ✕
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Entrega</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeout">Timeout (s)</Label>
              <Input id="timeout" type="number" min={5} max={120} value={timeout} onChange={(e) => setTimeoutSec(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="retry">Tentativas</Label>
              <Input id="retry" type="number" min={0} max={10} value={retryCount} onChange={(e) => setRetryCount(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label htmlFor="headers">Headers adicionais (JSON)</Label>
            <Textarea
              id="headers"
              value={headersText}
              onChange={(e) => setHeadersText(e.target.value)}
              rows={4}
              className={`font-mono text-xs ${!headersValid ? "border-destructive" : ""}`}
              placeholder='{"X-Custom-Header": "valor"}'
            />
            {!headersValid && <p className="text-xs text-destructive mt-1">JSON inválido (deve ser objeto).</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 sticky bottom-4 bg-background/80 backdrop-blur border rounded-xl p-3">
        <Button variant="ghost" onClick={() => navigate("/admin/webhooks")}>Cancelar</Button>
        <Button onClick={save} disabled={!canSave}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando…" : "Criar assinatura"}
        </Button>
      </div>
    </main>
  );
}