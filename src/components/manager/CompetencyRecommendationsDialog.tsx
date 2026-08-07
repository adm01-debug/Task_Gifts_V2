import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Target,
  BookOpen,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrailRecommendation {
  trailId: string;
  title: string;
  reason: string;
  priority: "alta" | "média" | "baixa";
  skillGap: string;
}

interface RecommendationsResponse {
  recommendations: TrailRecommendation[];
  analysis: {
    strengths: string[];
    gaps: string[];
    nextSteps: string;
  };
}

interface CompetencyRecommendationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  isLoading: boolean;
  recommendations: RecommendationsResponse | null;
}

export function CompetencyRecommendationsDialog({
  open, onOpenChange, memberName, isLoading, recommendations,
}: CompetencyRecommendationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recomendações de Trilhas para {memberName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 py-4">
            <Card className="p-4 bg-muted/30 border-border/50 space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex flex-wrap gap-1">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}</div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex flex-wrap gap-1">{[1, 2].map((i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}</div>
                </div>
              </div>
            </Card>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 border-border/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </Card>
            ))}
            <p className="text-center text-sm text-muted-foreground">Analisando perfil e gerando recomendações...</p>
          </div>
        ) : recommendations ? (
          <div className="space-y-6">
            {recommendations.analysis && (
              <Card className="p-4 bg-muted/30 border-border/50">
                <h4 className="font-semibold text-foreground mb-3">Análise do Perfil</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {recommendations.analysis.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-400" /> Pontos Fortes
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recommendations.analysis.strengths.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-green-500/30 text-green-400">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.analysis.gaps?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Gaps Identificados
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recommendations.analysis.gaps.map((g, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-amber-500/30 text-amber-400">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {recommendations.analysis.nextSteps && (
                  <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/30">
                    <strong>Próximos passos:</strong> {recommendations.analysis.nextSteps}
                  </p>
                )}
              </Card>
            )}

            <div>
              <h4 className="font-semibold text-foreground mb-3">Trilhas Recomendadas</h4>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {recommendations.recommendations?.map((rec, index) => (
                    <motion.div key={rec.trailId || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <Card className="p-4 bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-primary" />
                              <h5 className="font-medium text-foreground">{rec.title}</h5>
                              <Badge variant="outline" className={`text-xs ${
                                rec.priority === "alta" ? "border-red-500/30 text-red-400"
                                : rec.priority === "média" ? "border-amber-500/30 text-amber-400"
                                : "border-green-500/30 text-green-400"
                              }`}>{rec.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                            {rec.skillGap && (
                              <div className="flex items-center gap-1 mt-2">
                                <Target className="w-3 h-3 text-primary" />
                                <span className="text-xs text-primary">Desenvolve: {rec.skillGap}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export type { RecommendationsResponse, TrailRecommendation };
