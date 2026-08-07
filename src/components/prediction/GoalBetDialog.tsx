import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSalesCampaigns } from "@/hooks/useSalesCampaigns";
import { useCreatePredictionMarket } from "@/hooks/usePredictionMarkets";
import { salesCampaignsService } from "@/services/salesCampaignsService";
import { ADMIN_REJECTION_MESSAGES } from "@/services/predictionMarketService";
import { hasBlockingIssues, normalizeDraft, validatePredictionDraft } from "@/lib/predictionAdmin";
import {
  GOAL_BET_ERROR_MESSAGES,
  MAX_GOAL_BET_CANDIDATES,
  buildGoalBetDraft,
  impliedProbabilities,
  rankGoalBetCandidates,
  suggestGoalBetLocksAt,
  type GoalBetCandidate,
} from "@/lib/goalBetting";

export interface GoalBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Aposta de Meta: transforma uma campanha ativa em um mercado de previsão
 * cujas opções são os próprios participantes que disputam a meta.
 */
export function GoalBetDialog({ open, onOpenChange }: GoalBetDialogProps) {
  const { campaigns, isLoading: loadingCampaigns } = useSalesCampaigns("active");
  const createMarket = useCreatePredictionMarket();

  const [campaignId, setCampaignId] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [includeNoWinner, setIncludeNoWinner] = useState(true);
  const [minStake, setMinStake] = useState("10");
  const [maxStake, setMaxStake] = useState("500");
  const [rakePct, setRakePct] = useState("5");
  const [locksAt, setLocksAt] = useState("");

  const campaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId) ?? null,
    [campaigns, campaignId],
  );

  const { data: participants, isLoading: loadingParticipants } = useQuery({
    queryKey: ["sales-campaign", campaignId, "participants"],
    queryFn: () => salesCampaignsService.listParticipants(campaignId),
    enabled: open && !!campaignId,
    staleTime: 60_000,
  });

  const candidates: GoalBetCandidate[] = useMemo(
    () =>
      rankGoalBetCandidates(
        (participants ?? []).map((p) => ({
          userId: p.user_id,
          name: p.profile?.display_name ?? null,
          progress: Number(p.progress ?? 0),
          target: Number(p.target_adjusted ?? 0),
          progressPercent: Number(p.progress_percent ?? 0),
          declined: !!p.declined_at,
        })),
      ),
    [participants],
  );

  const probabilities = useMemo(() => impliedProbabilities(candidates), [candidates]);

  // Ao trocar de campanha, pré-seleciona os líderes e recalcula o travamento.
  useEffect(() => {
    if (!campaign) return;
    setLocksAt(toLocalInput(suggestGoalBetLocksAt(
      { id: campaign.id, name: campaign.name, metricUnit: campaign.metric_unit, endDate: campaign.end_date },
      Date.now(),
    )));
  }, [campaign]);

  useEffect(() => {
    setSelected(candidates.slice(0, MAX_GOAL_BET_CANDIDATES).map((c) => c.userId));
  }, [candidates]);

  const chosen = useMemo(
    () => candidates.filter((c) => selected.includes(c.userId)),
    [candidates, selected],
  );

  const build = useMemo(() => {
    if (!campaign) return null;
    return buildGoalBetDraft({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        metricUnit: campaign.metric_unit,
        endDate: campaign.end_date,
      },
      candidates: chosen,
      minStake: Number.parseInt(minStake, 10),
      maxStakePerUser: Number.parseInt(maxStake, 10),
      rakeBps: Math.round(Number.parseFloat(rakePct.replace(",", ".")) * 100),
      locksAt: locksAt ? new Date(locksAt).toISOString() : "",
      includeNoWinner,
    });
  }, [campaign, chosen, minStake, maxStake, rakePct, locksAt, includeNoWinner]);

  const issues = useMemo(
    () => (build?.draft ? validatePredictionDraft(build.draft, Date.now()) : []),
    [build],
  );
  const blocked = !build?.ok || hasBlockingIssues(issues) || createMarket.isPending;

  const toggle = (userId: string) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async () => {
    if (blocked || !build?.draft) return;
    try {
      const clean = normalizeDraft(build.draft);
      const result = await createMarket.mutateAsync({
        title: clean.title,
        description: clean.description,
        options: clean.options,
        minStake: clean.minStake,
        maxStakePerUser: clean.maxStakePerUser,
        rakeBps: clean.rakeBps,
        locksAt: clean.locksAt,
      });
      if (!result.ok) {
        toast.error(
          ADMIN_REJECTION_MESSAGES[result.reason ?? ""] ??
            "Não foi possível criar a aposta de meta.",
        );
        return;
      }
      toast.success("Aposta de meta criada como rascunho. Publique quando quiser abrir.");
      onOpenChange(false);
    } catch {
      toast.error("Erro inesperado ao criar a aposta de meta. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden />
            Nova aposta de meta
          </DialogTitle>
          <DialogDescription>
            Escolha uma campanha ativa e quem disputa a meta. Quem acertar divide o
            pote proporcionalmente ao aporte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-bet-campaign">Campanha</Label>
            {loadingCampaigns ? (
              <Skeleton className="h-10 w-full rounded-md" />
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma campanha ativa disponível para apostas.
              </p>
            ) : (
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger id="goal-bet-campaign">
                  <SelectValue placeholder="Selecione a campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {campaignId ? (
            <div className="space-y-2">
              <Label>Participantes ({selected.length} selecionados)</Label>
              {loadingParticipants ? (
                <Skeleton className="h-28 w-full rounded-md" />
              ) : candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Esta campanha ainda não tem participantes ativos.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2">
                  {candidates.map((candidate, index) => (
                    <li
                      key={candidate.userId}
                      className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`goal-bet-${candidate.userId}`}
                        checked={selected.includes(candidate.userId)}
                        onCheckedChange={() => toggle(candidate.userId)}
                      />
                      <Label
                        htmlFor={`goal-bet-${candidate.userId}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        {candidate.name?.trim() || `Participante ${index + 1}`}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {candidate.progressPercent.toFixed(0)}% ·{" "}
                        {(probabilities[candidate.userId] * 100).toFixed(0)}% favorito
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div>
              <Label htmlFor="goal-bet-no-winner" className="text-sm">
                Incluir “Ninguém bate a meta”
              </Label>
              <p className="text-xs text-muted-foreground">
                Evita anulação quando a meta não é atingida por ninguém.
              </p>
            </div>
            <Switch
              id="goal-bet-no-winner"
              checked={includeNoWinner}
              onCheckedChange={setIncludeNoWinner}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="goal-bet-min">Aporte mínimo</Label>
              <Input
                id="goal-bet-min"
                inputMode="numeric"
                value={minStake}
                onChange={(e) => setMinStake(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-bet-max">Teto por usuário</Label>
              <Input
                id="goal-bet-max"
                inputMode="numeric"
                value={maxStake}
                onChange={(e) => setMaxStake(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-bet-rake">Taxa (%)</Label>
              <Input
                id="goal-bet-rake"
                inputMode="decimal"
                value={rakePct}
                onChange={(e) => setRakePct(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-bet-locks">Fecha as apostas em</Label>
            <Input
              id="goal-bet-locks"
              type="datetime-local"
              value={locksAt}
              onChange={(e) => setLocksAt(e.target.value)}
            />
          </div>

          {build && !build.ok ? (
            <p className="text-sm text-destructive">
              {GOAL_BET_ERROR_MESSAGES[build.error ?? "no_candidates"]}
            </p>
          ) : null}
          {issues.map((issue) => (
            <p
              key={`${issue.field}-${issue.message}`}
              className={
                issue.level === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {issue.message}
            </p>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={blocked}>
            {createMarket.isPending ? "Criando..." : "Criar aposta de meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}