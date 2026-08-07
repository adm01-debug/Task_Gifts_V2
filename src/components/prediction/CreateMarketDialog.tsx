import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePredictionMarket } from "@/hooks/usePredictionMarkets";
import { ADMIN_REJECTION_MESSAGES } from "@/services/predictionMarketService";
import {
  MAX_OPTIONS,
  hasBlockingIssues,
  normalizeDraft,
  validatePredictionDraft,
  type PredictionDraft,
} from "@/lib/predictionAdmin";

export interface CreateMarketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function defaultLocksAt(): string {
  const date = new Date(Date.now() + 24 * 3_600_000);
  date.setSeconds(0, 0);
  return date.toISOString().slice(0, 16);
}

/** Criação de mercado com validação espelhada do servidor (falha antes do RPC). */
export function CreateMarketDialog({ open, onOpenChange }: CreateMarketDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<string[]>(["Sim", "Não"]);
  const [minStake, setMinStake] = useState("10");
  const [maxStake, setMaxStake] = useState("500");
  const [rakePct, setRakePct] = useState("5");
  const [locksAt, setLocksAt] = useState(defaultLocksAt);

  const createMarket = useCreatePredictionMarket();

  const draft: PredictionDraft = useMemo(
    () => ({
      title,
      description,
      options,
      minStake: Number.parseInt(minStake, 10),
      maxStakePerUser: Number.parseInt(maxStake, 10),
      rakeBps: Math.round(Number.parseFloat(rakePct.replace(",", ".")) * 100),
      locksAt: locksAt ? new Date(locksAt).toISOString() : "",
    }),
    [title, description, options, minStake, maxStake, rakePct, locksAt],
  );

  const issues = useMemo(() => validatePredictionDraft(draft, Date.now()), [draft]);
  const blocked = hasBlockingIssues(issues);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const handleSubmit = async () => {
    if (blocked) return;
    try {
      const clean = normalizeDraft(draft);
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
          ADMIN_REJECTION_MESSAGES[result.reason ?? ""] ?? "Não foi possível criar o mercado.",
        );
        return;
      }
      toast.success("Mercado criado como rascunho. Publique quando estiver pronto.");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setOptions(["Sim", "Não"]);
    } catch {
      toast.error("Erro inesperado ao criar o mercado. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo mercado de previsão</DialogTitle>
          <DialogDescription>
            O mercado nasce como rascunho — nenhum aporte é aceito até a publicação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prediction-title">Pergunta</Label>
            <Input
              id="prediction-title"
              value={title}
              maxLength={140}
              placeholder="Vamos bater a meta do trimestre?"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prediction-description">Regras (opcional)</Label>
            <Textarea
              id="prediction-description"
              value={description}
              maxLength={800}
              rows={3}
              placeholder="Critério oficial de apuração, fonte do dado, exceções..."
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Opções</Label>
            {options.map((option, index) => (
              <div key={`option-${index}`} className="flex gap-2">
                <Input
                  value={option}
                  maxLength={60}
                  aria-label={`Opção ${index + 1}`}
                  onChange={(event) => updateOption(index, event.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover opção ${index + 1}`}
                  disabled={options.length <= 2}
                  onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => [...prev, ""])}
              >
                <Plus className="mr-1 h-4 w-4" /> Adicionar opção
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prediction-min">Aporte mínimo</Label>
              <Input
                id="prediction-min"
                type="number"
                min={1}
                value={minStake}
                onChange={(event) => setMinStake(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prediction-max">Teto por pessoa (0 = livre)</Label>
              <Input
                id="prediction-max"
                type="number"
                min={0}
                value={maxStake}
                onChange={(event) => setMaxStake(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prediction-rake">Taxa da casa (%)</Label>
              <Input
                id="prediction-rake"
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={rakePct}
                onChange={(event) => setRakePct(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prediction-locks">Trava os aportes em</Label>
              <Input
                id="prediction-locks"
                type="datetime-local"
                value={locksAt}
                onChange={(event) => setLocksAt(event.target.value)}
              />
            </div>
          </div>

          {issues.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
              {issues.map((issue) => (
                <li
                  key={`${issue.field}-${issue.message}`}
                  className={
                    issue.level === "error" ? "text-destructive" : "text-muted-foreground"
                  }
                >
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={blocked || createMarket.isPending} onClick={() => void handleSubmit()}>
            {createMarket.isPending ? "Criando..." : "Criar rascunho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}