import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Send,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useActiveSurveyForUser, useSubmitENPSResponse } from "@/hooks/useENPS";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const SCORE_COLORS: Record<string, string> = {
  detractor: "bg-red-500 hover:bg-red-600",
  passive: "bg-yellow-500 hover:bg-yellow-600",
  promoter: "bg-green-500 hover:bg-green-600",
};

export function ENPSSurveyWidget() {
  const { data: activeSurvey, isLoading, refetch } = useActiveSurveyForUser();
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitResponse = useSubmitENPSResponse();

  const handleSubmit = async () => {
    if (selectedScore === null || !activeSurvey) return;

    await submitResponse.mutateAsync({
      survey_id: activeSurvey.id,
      score: selectedScore,
      follow_up_answer: followUpAnswer || undefined,
    });

    setIsSubmitted(true);
    refetch();
  };

  const getScoreCategory = (score: number) => {
    if (score >= 9) return "promoter";
    if (score >= 7) return "passive";
    return "detractor";
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
          <CardContent className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
            </motion.div>
            <h3 className="font-semibold text-lg mb-1">Obrigado pelo feedback!</h3>
            <p className="text-sm text-muted-foreground">
              Sua resposta foi registrada com sucesso.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!activeSurvey) {
    return null; // Don't show widget if no active survey
  }

  const daysLeft = differenceInDays(new Date(activeSurvey.ends_at), new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Pesquisa de Satisfação
            </CardTitle>
            {daysLeft > 0 && (
              <Badge variant="outline" className="text-xs">
                {daysLeft} dias restantes
              </Badge>
            )}
          </div>
          <CardDescription>{activeSurvey.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Question */}
          <div className="text-center">
            <p className="text-sm font-medium mb-4">
              Em uma escala de 0 a 10, o quanto você recomendaria nossa empresa como um bom lugar para trabalhar?
            </p>

            {/* Score Selector */}
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const category = getScoreCategory(score);
                const isSelected = selectedScore === score;

                return (
                  <motion.button
                    key={score}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedScore(score)}
                    className={`w-9 h-9 rounded-lg font-semibold text-sm transition-all ${
                      isSelected
                        ? `${SCORE_COLORS[category]} text-white shadow-lg`
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {score}
                  </motion.button>
                );
              })}
            </div>

            {/* Score Labels */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
              <div className="flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                <span>Nada provável</span>
              </div>
              <div className="flex items-center gap-1">
                <Minus className="w-3 h-3" />
                <span>Neutro</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Muito provável</span>
                <ThumbsUp className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Selected Score Feedback */}
          <AnimatePresence>
            {selectedScore !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-center gap-2 py-2">
                  <Badge
                    className={
                      selectedScore >= 9
                        ? "bg-green-500"
                        : selectedScore >= 7
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }
                  >
                    {selectedScore >= 9 ? "Promotor" : selectedScore >= 7 ? "Neutro" : "Detrator"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Você selecionou: <strong>{selectedScore}</strong>
                  </span>
                </div>

                {/* Follow-up Question */}
                {activeSurvey.follow_up_question && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {activeSurvey.follow_up_question}
                    </p>
                    <Textarea
                      value={followUpAnswer}
                      onChange={(e) => setFollowUpAnswer(e.target.value)}
                      placeholder="Compartilhe sua opinião (opcional)..."
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitResponse.isPending}
                >
                  {submitResponse.isPending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Resposta
                    </>
                  )}
                </Button>

                {activeSurvey.is_anonymous && (
                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Sua resposta é anônima
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
