import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useFeedback360 } from "@/hooks/useFeedback360";
import type { FeedbackCycle, FeedbackRequest } from "@/services/feedbackService";

const RELATIONSHIPS: Array<{ value: FeedbackRequest["relationship"]; label: string }> = [
  { value: "manager", label: "Gestor avalia o liderado" },
  { value: "direct_report", label: "Liderado avalia o gestor" },
  { value: "peer", label: "Par avalia par" },
  { value: "self", label: "Autoavaliação" },
];

interface FeedbackRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycles: FeedbackCycle[];
}

/**
 * Cria pedidos de feedback 360 (schema A: feedback_requests).
 * A policy "Managers can create requests" restringe o INSERT a admin/manager —
 * a página só monta este formulário para esses papéis.
 */
export function FeedbackRequestForm({ open, onOpenChange, cycles }: FeedbackRequestFormProps) {
  const { user } = useAuth();
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const { createRequest } = useFeedback360();

  const [cycleId, setCycleId] = useState("");
  const [fromUserId, setFromUserId] = useState(user?.id ?? "");
  const [toUserId, setToUserId] = useState("");
  const [relationship, setRelationship] = useState<FeedbackRequest["relationship"]>("manager");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const people = useMemo(
    () =>
      profiles
        .map(profile => ({
          id: profile.id,
          name: profile.display_name || profile.email || "Colaborador sem nome",
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [profiles]
  );

  const reset = () => {
    setCycleId("");
    setFromUserId(user?.id ?? "");
    setToUserId("");
    setRelationship("manager");
    setDueDate("");
    setError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = () => {
    if (!cycleId) {
      setError("Escolha o ciclo de feedback.");
      return;
    }
    if (!fromUserId) {
      setError("Escolha quem vai avaliar.");
      return;
    }
    if (!toUserId) {
      setError("Escolha quem vai receber o feedback.");
      return;
    }
    if (fromUserId === toUserId && relationship !== "self") {
      setError("Avaliador e avaliado iguais só valem na autoavaliação.");
      return;
    }
    if (relationship === "self" && fromUserId !== toUserId) {
      setError("Autoavaliação exige a mesma pessoa nos dois campos.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    createRequest(
      { cycleId, fromUserId, toUserId, relationship, dueDate: dueDate || undefined },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (mutationError: Error) => {
          setIsSubmitting(false);
          setError(mutationError.message || "Não foi possível criar o pedido.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Solicitar feedback 360</DialogTitle>
          <DialogDescription>
            Escolha o ciclo, quem avalia e quem recebe. Quem avalia responde na própria tela de
            Feedback.
          </DialogDescription>
        </DialogHeader>

        {cycles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum ciclo ativo no momento. Crie e ative um ciclo em Administração &gt; Feedback 360°
            antes de solicitar avaliações.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycle">Ciclo</Label>
              <Select value={cycleId} onValueChange={setCycleId}>
                <SelectTrigger id="cycle">
                  <SelectValue placeholder="Escolha o ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map(cycle => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Tipo de avaliação</Label>
              <Select
                value={relationship}
                onValueChange={(value) => setRelationship(value as FeedbackRequest["relationship"])}
              >
                <SelectTrigger id="relationship">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-user">Quem avalia</Label>
              <Select value={fromUserId} onValueChange={setFromUserId}>
                <SelectTrigger id="from-user">
                  <SelectValue placeholder="Escolha o avaliador" />
                </SelectTrigger>
                <SelectContent>
                  {people.map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-user">Quem recebe</Label>
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger id="to-user">
                  <SelectValue placeholder="Escolha o avaliado" />
                </SelectTrigger>
                <SelectContent>
                  {people.map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">Prazo (opcional)</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
              />
            </div>

            {!isLoadingProfiles && people.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum colaborador disponível para selecionar.
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || cycles.length === 0 || people.length === 0}
          >
            {isSubmitting ? "Criando..." : "Criar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}