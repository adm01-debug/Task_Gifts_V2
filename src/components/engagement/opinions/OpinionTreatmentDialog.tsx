import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OPINION_STATUSES,
  STATUS_LABELS,
  type OpinionFeedEntry,
  type OpinionStatus,
} from "@/lib/opinionChannel";
import {
  useGenerateOpinionActionPlan,
  useOpinionResponses,
  useRespondToOpinion,
} from "@/hooks/useOpinions";

export interface OpinionTreatmentDialogProps {
  entry: OpinionFeedEntry | null;
  onClose: () => void;
}

/** Tratativa do RH/gestor: resposta oficial, nota interna, situação e plano 5W2H. */
export function OpinionTreatmentDialog({ entry, onClose }: OpinionTreatmentDialogProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState<OpinionStatus>("in_progress");
  const respond = useRespondToOpinion();
  const generatePlan = useGenerateOpinionActionPlan();
  const responses = useOpinionResponses(entry?.id ?? null);

  const handleClose = () => {
    setContent("");
    setIsInternal(false);
    setStatus("in_progress");
    onClose();
  };

  const handleRespond = () => {
    if (!entry || content.trim().length < 5) return;
    respond.mutate(
      { opinionId: entry.id, content, isInternal, status },
      { onSuccess: handleClose },
    );
  };

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry?.subject ?? "Manifestação"}</DialogTitle>
          <DialogDescription>
            {entry?.authorName} · {entry?.categoryLabel} · {entry?.sla.label}
          </DialogDescription>
        </DialogHeader>

        {entry && (
          <div className="space-y-4">
            <p className="whitespace-pre-line rounded-lg border border-border/60 bg-card/40 p-3 text-sm">
              {entry.content}
            </p>

            {(responses.data ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Histórico de tratativa</p>
                {(responses.data ?? []).map((r) => (
                  <div key={r.id} className="rounded-lg border border-border/60 p-3 text-sm">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={r.isInternal ? "outline" : "secondary"} className="text-[10px]">
                        {r.isInternal ? "Nota interna" : "Resposta oficial"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-muted-foreground">{r.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="opinion-response">Resposta</Label>
              <Textarea
                id="opinion-response"
                rows={4}
                value={content}
                maxLength={4000}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o retorno para quem registrou a manifestação."
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-3">
              <Label htmlFor="opinion-internal" className="text-sm">
                Nota interna (não visível ao autor)
              </Label>
              <Switch id="opinion-internal" checked={isInternal} onCheckedChange={setIsInternal} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="opinion-status">Situação após a resposta</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OpinionStatus)}>
                <SelectTrigger id="opinion-status" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPINION_STATUSES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {STATUS_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:mr-auto"
            disabled={!entry || generatePlan.isPending}
            onClick={() =>
              entry &&
              generatePlan.mutate(entry.id, {
                onSuccess: () => {
                  handleClose();
                  navigate("/planos-acao");
                },
              })
            }
          >
            {generatePlan.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ClipboardList className="mr-2 h-4 w-4" aria-hidden />
            )}
            Gerar plano 5W2H
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={content.trim().length < 5 || respond.isPending}
            onClick={handleRespond}
          >
            {respond.isPending ? "Registrando…" : "Registrar resposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}