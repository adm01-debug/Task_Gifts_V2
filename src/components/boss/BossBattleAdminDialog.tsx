import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDepartments } from "@/hooks/useDepartments";
import { useCreateBossBattle } from "@/hooks/useBossBattles";
import { DEFAULT_DAMAGE_RULES } from "@/lib/bossBattle";
import {
  suggestTotalHp,
  validateBossPlan,
  type BossPlanInput,
  type BossPlanProjection,
} from "@/lib/bossBattlePlanner";
import { cn } from "@/lib/utils";

const VERDICT_LABEL: Record<BossPlanProjection["verdict"], string> = {
  impossivel: "Inalcançável",
  dificil: "Apertada",
  equilibrado: "Equilibrada",
  facil: "Fácil",
  trivial: "Trivial",
};

const VERDICT_STYLE: Record<BossPlanProjection["verdict"], string> = {
  impossivel: "border-destructive/40 bg-destructive/10 text-destructive",
  dificil: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  equilibrado: "border-primary/40 bg-primary/10 text-primary",
  facil: "border-muted-foreground/30 bg-muted text-muted-foreground",
  trivial: "border-amber-500/40 bg-amber-500/10 text-amber-500",
};

/** Converte Date -> valor aceito por <input type="datetime-local"> no fuso local. */
function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : "";
}

const DAY = 86_400_000;

/**
 * Painel de convocação do Chefão. O gestor nunca publica no escuro: a projeção
 * de capacidade do time é recalculada a cada tecla e erros bloqueiam o envio.
 */
export function BossBattleAdminDialog() {
  const [open, setOpen] = useState(false);
  const { data: departments } = useDepartments();
  const createMutation = useCreateBossBattle();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date()));
  const [endsAt, setEndsAt] = useState(() => toLocalInput(new Date(Date.now() + 14 * DAY)));
  const [participants, setParticipants] = useState("12");
  const [totalHp, setTotalHp] = useState("5000");
  const [perUserCap, setPerUserCap] = useState("0");
  const [coinsPool, setCoinsPool] = useState("1000");
  const [xpPool, setXpPool] = useState("2000");
  const [perUserCoinsCap, setPerUserCoinsCap] = useState("0");

  const draft: BossPlanInput = useMemo(
    () => ({
      title,
      description,
      departmentId: departmentId === "all" ? null : departmentId,
      totalHp: Number.parseInt(totalHp, 10) || 0,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      rules: DEFAULT_DAMAGE_RULES,
      perUserCap: Number.parseInt(perUserCap, 10) || 0,
      coinsPool: Number.parseInt(coinsPool, 10) || 0,
      xpPool: Number.parseInt(xpPool, 10) || 0,
      minShare: 0,
      perUserCoinsCap: Number.parseInt(perUserCoinsCap, 10) || 0,
      expectedParticipants: Number.parseInt(participants, 10) || 0,
    }),
    [
      title,
      description,
      departmentId,
      totalHp,
      startsAt,
      endsAt,
      perUserCap,
      coinsPool,
      xpPool,
      perUserCoinsCap,
      participants,
    ],
  );

  const review = useMemo(() => validateBossPlan(draft), [draft]);
  const errors = review.issues.filter((issue) => issue.level === "error");
  const warnings = review.issues.filter((issue) => issue.level === "warning");

  const handleSuggest = () => {
    const suggested = suggestTotalHp(draft);
    if (suggested > 0) setTotalHp(String(suggested));
  };

  const handleSubmit = (status: "draft" | "running") => {
    if (!review.valid) return;
    createMutation.mutate(
      {
        title: draft.title,
        description: draft.description,
        departmentId: draft.departmentId,
        totalHp: draft.totalHp,
        startsAt: draft.startsAt,
        endsAt: draft.endsAt,
        rules: draft.rules,
        perUserCap: draft.perUserCap,
        coinsPool: draft.coinsPool,
        xpPool: draft.xpPool,
        minShare: draft.minShare,
        perUserCoinsCap: draft.perUserCoinsCap,
        status,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Convocar chefão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convocar um novo chefão</DialogTitle>
          <DialogDescription>
            A projeção abaixo estima se o time consegue derrubar o chefão dentro da janela.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="boss-title">Nome da batalha</Label>
            <Input
              id="boss-title"
              value={title}
              maxLength={120}
              placeholder="Ex.: Chefão do Fechamento de Julho"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="boss-description">Descrição (opcional)</Label>
            <Textarea
              id="boss-description"
              value={description}
              rows={2}
              placeholder="Explique o desafio e o que o time ganha ao vencer."
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Departamento</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda a empresa</SelectItem>
                {(departments || []).map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-people">Pessoas participando</Label>
            <Input
              id="boss-people"
              type="number"
              min={1}
              value={participants}
              onChange={(event) => setParticipants(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-start">Início</Label>
            <Input
              id="boss-start"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-end">Término</Label>
            <Input
              id="boss-end"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-hp">Vida total (HP)</Label>
            <div className="flex gap-2">
              <Input
                id="boss-hp"
                type="number"
                min={1}
                value={totalHp}
                onChange={(event) => setTotalHp(event.target.value)}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleSuggest} title="Sugerir HP equilibrado">
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-cap">Teto de dano por pessoa (0 = sem limite)</Label>
            <Input
              id="boss-cap"
              type="number"
              min={0}
              value={perUserCap}
              onChange={(event) => setPerUserCap(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-coins">Prêmio em moedas</Label>
            <Input
              id="boss-coins"
              type="number"
              min={0}
              value={coinsPool}
              onChange={(event) => setCoinsPool(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boss-xp">Prêmio em XP</Label>
            <Input
              id="boss-xp"
              type="number"
              min={0}
              value={xpPool}
              onChange={(event) => setXpPool(event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="boss-coins-cap">Teto de moedas por pessoa (0 = sem limite)</Label>
            <Input
              id="boss-coins-cap"
              type="number"
              min={0}
              value={perUserCoinsCap}
              onChange={(event) => setPerUserCoinsCap(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("border", VERDICT_STYLE[review.projection.verdict])}>
              {VERDICT_LABEL[review.projection.verdict]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Janela de {review.projection.windowDays} dia(s) · capacidade projetada de{" "}
              {review.projection.capacity.toLocaleString("pt-BR")} de dano
              {review.projection.estimatedDefeatDay
                ? ` · queda estimada no dia ${review.projection.estimatedDefeatDay}`
                : " · não cai dentro da janela"}
            </span>
          </div>

          {errors.map((issue) => (
            <p key={`${issue.field}-${issue.message}`} className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {issue.message}
            </p>
          ))}
          {warnings.map((issue) => (
            <p key={`${issue.field}-${issue.message}`} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {issue.message}
            </p>
          ))}
          {errors.length === 0 && warnings.length === 0 && (
            <p className="flex items-start gap-2 text-sm text-primary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Plano equilibrado e pronto para publicar.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            disabled={!review.valid || createMutation.isPending}
            onClick={() => handleSubmit("draft")}
          >
            Salvar rascunho
          </Button>
          <Button disabled={!review.valid || createMutation.isPending} onClick={() => handleSubmit("running")}>
            Publicar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}