import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useCreateNineBoxEvaluation } from "@/hooks/useNineBox";
import { BOX_LABELS } from "@/services/nineBoxService";
import { format } from "date-fns";

interface CreateEvaluationFormProps {
  profiles: { id: string; display_name: string | null; avatar_url: string | null }[];
  onClose: () => void;
}

export function CreateEvaluationForm({ profiles, onClose }: CreateEvaluationFormProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [performanceScore, setPerformanceScore] = useState([50]);
  const [potentialScore, setPotentialScore] = useState([50]);
  const [period, setPeriod] = useState(format(new Date(), "yyyy-'Q'Q"));
  const [performanceNotes, setPerformanceNotes] = useState("");
  const [potentialNotes, setPotentialNotes] = useState("");
  const [strengths, setStrengths] = useState("");
  const [developmentAreas, setDevelopmentAreas] = useState("");

  const createEvaluation = useCreateNineBoxEvaluation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    await createEvaluation.mutateAsync({
      user_id: selectedUser,
      evaluation_period: period,
      performance_score: performanceScore[0],
      potential_score: potentialScore[0],
      performance_notes: performanceNotes || undefined,
      potential_notes: potentialNotes || undefined,
      strengths: strengths ? strengths.split(",").map((s) => s.trim()) : undefined,
      development_areas: developmentAreas ? developmentAreas.split(",").map((s) => s.trim()) : undefined,
    });

    onClose();
  };

  const boxPosition =
    (potentialScore[0] <= 33 ? 0 : potentialScore[0] <= 66 ? 1 : 2) * 3 +
    (performanceScore[0] <= 33 ? 0 : performanceScore[0] <= 66 ? 1 : 2) +
    1;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nova Avaliação 9-Box</DialogTitle>
        <DialogDescription>Avalie o desempenho e potencial do colaborador</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Colaborador</Label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback>{profile.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {profile.display_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Período</Label>
          <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="ex: 2024-Q1" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Desempenho</Label>
            <span className="text-sm font-medium">{performanceScore[0]}%</span>
          </div>
          <Slider value={performanceScore} onValueChange={setPerformanceScore} max={100} step={1} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Potencial</Label>
            <span className="text-sm font-medium">{potentialScore[0]}%</span>
          </div>
          <Slider value={potentialScore} onValueChange={setPotentialScore} max={100} step={1} />
        </div>

        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Posição na Matriz</p>
          <Badge className={BOX_LABELS[boxPosition].color.replace("bg-", "bg-").replace("-500", "-500/80")}>
            {BOX_LABELS[boxPosition].name}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label>Notas sobre Desempenho</Label>
          <Textarea value={performanceNotes} onChange={(e) => setPerformanceNotes(e.target.value)} placeholder="Observações sobre o desempenho..." rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Notas sobre Potencial</Label>
          <Textarea value={potentialNotes} onChange={(e) => setPotentialNotes(e.target.value)} placeholder="Observações sobre o potencial..." rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Pontos Fortes (separados por vírgula)</Label>
          <Input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="Liderança, Comunicação, Técnico..." />
        </div>

        <div className="space-y-2">
          <Label>Áreas de Desenvolvimento (separados por vírgula)</Label>
          <Input value={developmentAreas} onChange={(e) => setDevelopmentAreas(e.target.value)} placeholder="Gestão de tempo, Delegação..." />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={!selectedUser || createEvaluation.isPending}>
            {createEvaluation.isPending ? "Salvando..." : "Criar Avaliação"}
          </Button>
        </div>
      </form>
    </>
  );
}
