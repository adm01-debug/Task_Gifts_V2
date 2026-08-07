import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Award,
  Star,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { SuccessionPlan, SuccessorCandidate } from "@/services/successionService";

interface SuccessionPlanDetailsProps {
  plan: SuccessionPlan;
  getReadinessColor: (readiness: string) => string;
  getReadinessLabel: (readiness: string) => string;
}

export function SuccessionPlanDetails({ plan, getReadinessColor, getReadinessLabel }: SuccessionPlanDetailsProps) {
  return (
    <ScrollArea className="h-[70vh]">
      <div className="space-y-6 p-2">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{plan.position.title}</h3>
                <p className="text-muted-foreground">
                  {plan.position.department} • Ocupante: {plan.position.currentHolder?.name || "Vago"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${
          plan.riskAssessment.overallRisk === 'high' ? 'border-l-red-500 bg-red-500/5' :
          plan.riskAssessment.overallRisk === 'medium' ? 'border-l-yellow-500 bg-yellow-500/5' :
          'border-l-green-500 bg-green-500/5'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${
                plan.riskAssessment.overallRisk === 'high' ? 'text-red-500' :
                plan.riskAssessment.overallRisk === 'medium' ? 'text-yellow-500' : 'text-green-500'
              }`} />
              <h4 className="font-semibold">Avaliação de Risco: {
                plan.riskAssessment.overallRisk === 'high' ? 'Alto' :
                plan.riskAssessment.overallRisk === 'medium' ? 'Médio' : 'Baixo'
              }</h4>
            </div>
            {plan.riskAssessment.factors.length > 0 && (
              <ul className="text-sm text-muted-foreground space-y-1">
                {plan.riskAssessment.factors.map((factor, idx) => (
                  <li key={idx}>• {factor}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Candidatos à Sucessão ({plan.successors.length})
          </h4>
          {plan.successors.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h5 className="font-semibold text-lg mb-2">Sem Candidatos Identificados</h5>
                <p className="text-muted-foreground">
                  Nenhum colaborador foi identificado como potencial sucessor para esta posição.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {plan.successors.map((candidate, index) => (
                <CandidateCard
                  key={candidate.userId}
                  candidate={candidate}
                  rank={index + 1}
                  getReadinessColor={getReadinessColor}
                  getReadinessLabel={getReadinessLabel}
                />
              ))}
            </div>
          )}
        </div>

        {plan.riskAssessment.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.riskAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

function CandidateCard({
  candidate,
  rank,
  getReadinessColor,
  getReadinessLabel,
}: {
  candidate: SuccessorCandidate;
  rank: number;
  getReadinessColor: (readiness: string) => string;
  getReadinessLabel: (readiness: string) => string;
}) {
  const getRankIcon = () => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <Star className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className={rank === 1 ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1">
            {getRankIcon()}
            <span className="text-xs font-bold">#{rank}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="font-semibold">{candidate.name}</h5>
                <p className="text-sm text-muted-foreground">
                  {candidate.currentPosition} • {candidate.department}
                </p>
              </div>
              <Badge className={getReadinessColor(candidate.readiness)}>
                {getReadinessLabel(candidate.readiness)}
              </Badge>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Score de Compatibilidade</span>
                <span className="font-semibold">{candidate.matchScore}%</span>
              </div>
              <Progress value={candidate.matchScore} className="h-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="bg-muted rounded p-2">
                <p className="text-muted-foreground">HiPo Score</p>
                <p className="font-semibold">{candidate.hipoScore}%</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-muted-foreground">Prontidão</p>
                <p className="font-semibold">{candidate.readinessScore}%</p>
              </div>
              <div className="bg-muted rounded p-2">
                <p className="text-muted-foreground">Nível</p>
                <p className="font-semibold">{candidate.level}</p>
              </div>
            </div>
            {candidate.gaps.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Gaps de Desenvolvimento:</p>
                <div className="flex flex-wrap gap-1">
                  {candidate.gaps.map((gap, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{gap}</Badge>
                  ))}
                </div>
              </div>
            )}
            {candidate.strengths.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Pontos Fortes:</p>
                <div className="flex flex-wrap gap-1">
                  {candidate.strengths.map((strength, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-500/10 text-green-600">{strength}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
