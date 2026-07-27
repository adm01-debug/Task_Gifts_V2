import { useState } from "react";
import { usePublishedTrails } from "@/hooks/useTrails";
import { useCreateQuizQuestion } from "@/hooks/useQuizQuestions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, Check, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/services/loggingService";
import { describeEdgeError } from "@/lib/edgeErrors";

interface GeneratedQuestion {
  question: string;
  difficulty: string;
  category: string;
  explanation: string;
  options: Array<{ text: string; is_correct: boolean }>;
}

interface AIQuestionGeneratorProps {
  onQuestionsGenerated?: () => void;
}

export default function AIQuestionGenerator({ onQuestionsGenerated }: AIQuestionGeneratorProps) {
  const [selectedTrail, setSelectedTrail] = useState<string>("");
  const [quizType, setQuizType] = useState<string>("magic_cards");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: trails, isLoading: trailsLoading } = usePublishedTrails();
  const createQuestion = useCreateQuizQuestion();

  const handleGenerate = async () => {
    if (!selectedTrail) {
      toast.error("Selecione uma trilha");
      return;
    }

    // Trava de reentrância: cliques repetidos saturam o rate limit da IA.
    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratedQuestions([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz-questions", {
        body: { trailId: selectedTrail, quizType, questionCount }
      });

      if (error) throw error;

      if (!data || typeof data !== "object") {
        throw new Error("Resposta inválida do serviço de geração de perguntas.");
      }

      if (data.error) {
        throw new Error(String(data.error));
      }

      setGeneratedQuestions(data.questions || []);
      toast.success(`${data.questions?.length || 0} perguntas geradas!`);
    } catch (err: unknown) {
      logger.apiError('handleGenerate', err, 'AIQuestionGenerator');
      const { message } = await describeEdgeError(err);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (generatedQuestions.length === 0) return;

    setIsSaving(true);
    let savedCount = 0;

    try {
      for (const q of generatedQuestions) {
        await createQuestion.mutateAsync({
          question: q.question,
          quiz_type: quizType,
          difficulty: q.difficulty as "easy" | "medium" | "hard",
          explanation: q.explanation,
          category: q.category || undefined,
          points: q.difficulty === "hard" ? 300 : q.difficulty === "medium" ? 200 : 100,
          options: q.options.map((opt, idx) => ({
            text: opt.text,
            is_correct: opt.is_correct,
            order_index: idx
          }))
        });
        savedCount++;
      }

      toast.success(`${savedCount} perguntas salvas com sucesso!`);
      setGeneratedQuestions([]);
      onQuestionsGenerated?.();
    } catch (err: unknown) {
      logger.apiError('handleSaveAll', err, 'AIQuestionGenerator');
      toast.error(`Erro ao salvar. ${savedCount} de ${generatedQuestions.length} salvas.`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTrailData = trails?.find(t => t.id === selectedTrail);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Geração por IA
        </CardTitle>
        <CardDescription>
          Gere perguntas automaticamente baseadas no conteúdo das trilhas de aprendizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Trilha de Aprendizado</Label>
            <Select value={selectedTrail} onValueChange={setSelectedTrail}>
              <SelectTrigger>
                <SelectValue placeholder={trailsLoading ? "Carregando..." : "Selecione uma trilha"} />
              </SelectTrigger>
              <SelectContent>
                {trails?.map((trail) => (
                  <SelectItem key={trail.id} value={trail.id}>
                    <div className="flex items-center gap-2">
                      <span>{trail.icon}</span>
                      <span>{trail.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Quiz</Label>
            <Select value={quizType} onValueChange={setQuizType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="magic_cards">🎴 Cartas Mágicas</SelectItem>
                <SelectItem value="millionaire">💰 Show do Milhão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade: {questionCount}</Label>
            <Slider
              value={[questionCount]}
              onValueChange={([v]) => setQuestionCount(v)}
              min={3}
              max={10}
              step={1}
              className="mt-3"
            />
          </div>
        </div>

        {selectedTrailData && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Trilha selecionada: <strong>{selectedTrailData.title}</strong>
            </span>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!selectedTrail || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando perguntas...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Perguntas
            </>
          )}
        </Button>

        <AnimatePresence>
          {generatedQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {generatedQuestions.length} perguntas geradas
                </h4>
                <Button onClick={handleSaveAll} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Salvar Todas
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {generatedQuestions.map((q, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{q.question}</p>
                        {q.category && (
                          <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {q.category}
                          </span>
                        )}
                      </div>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full shrink-0
                        ${q.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' : ''}
                        ${q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : ''}
                        ${q.difficulty === 'hard' ? 'bg-red-500/20 text-red-500' : ''}
                      `}>
                        {q.difficulty}
                      </span>
                    </div>
                    <div className="grid gap-1 text-xs text-muted-foreground">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-1 ${opt.is_correct ? 'text-green-500 font-medium' : ''}`}
                        >
                          {opt.is_correct && <Check className="h-3 w-3" />}
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedTrail && trails?.length === 0 && (
          <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Nenhuma trilha publicada encontrada</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
