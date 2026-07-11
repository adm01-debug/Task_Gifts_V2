import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { BOX_LABELS } from "@/services/nineBoxService";
import { pdiGeneratorService } from "@/services/pdiGeneratorService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Evaluation {
  id: string;
  user_id: string;
  performance_score: number;
  potential_score: number;
  performance_notes: string | null;
  potential_notes: string | null;
  strengths: string[] | null;
  development_areas: string[] | null;
  evaluation_period: string;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface BoxDetailViewProps {
  box: number;
  evaluations: Evaluation[];
  profiles: Profile[];
}

export function BoxDetailView({ box, evaluations, profiles }: BoxDetailViewProps) {
  const label = BOX_LABELS[box];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${label.color}`} />
          {label.name}
        </DialogTitle>
        <DialogDescription>{label.description}</DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        {evaluations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum colaborador nesta posição</p>
        ) : (
          evaluations.map((evaluation) => {
            const profile = profiles.find((p) => p.id === evaluation.user_id);
            return (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} profile={profile} box={box} />
            );
          })
        )}
      </div>
    </>
  );
}

function EvaluationCard({
  evaluation,
  profile,
  box,
}: {
  evaluation: Evaluation;
  profile: Profile | undefined;
  box: number;
}) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDI = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const plan = await pdiGeneratorService.generatePDIFromNineBox(
        evaluation.user_id, box, evaluation.id, user.id,
        evaluation.development_areas || undefined
      );
      toast.success("PDI gerado com sucesso!", { description: `Plano "${plan.title}" criado para ${profile?.display_name}` });
    } catch {
      toast.error("Erro ao gerar PDI", { description: "Não foi possível criar o plano de desenvolvimento." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{profile?.display_name}</h4>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{evaluation.evaluation_period}</Badge>
                <Button size="sm" variant="outline" onClick={handleGeneratePDI} disabled={isGenerating} className="gap-1">
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  Gerar PDI
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Desempenho</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${evaluation.performance_score}%` }} />
                  </div>
                  <span className="text-sm font-medium">{evaluation.performance_score}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Potencial</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${evaluation.potential_score}%` }} />
                  </div>
                  <span className="text-sm font-medium">{evaluation.potential_score}%</span>
                </div>
              </div>
            </div>

            {(evaluation.strengths?.length || 0) > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Pontos Fortes</p>
                <div className="flex flex-wrap gap-1">
                  {evaluation.strengths?.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>
              </div>
            )}

            {(evaluation.development_areas?.length || 0) > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Áreas de Desenvolvimento</p>
                <div className="flex flex-wrap gap-1">
                  {evaluation.development_areas?.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
