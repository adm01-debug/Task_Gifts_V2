import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { usePulseSurveys } from "@/hooks/usePulseSurveys";
import { ClipboardList, Check, ChevronRight, ChevronLeft, Send } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PulseSurveyWidget() {
  const { activeSurveys, submitResponse, isSubmitting, isLoading } = usePulseSurveys();
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const pendingSurveys = activeSurveys.filter(s => !s.has_responded);
  const activeSurvey = pendingSurveys.find(s => s.id === activeSurveyId);

  const handleAnswer = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!activeSurveyId) return;
    
    submitResponse({ surveyId: activeSurveyId, answers });
    setActiveSurveyId(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const renderQuestion = () => {
    if (!activeSurvey) return null;
    
    const question = activeSurvey.questions[currentQuestionIndex];
    if (!question) return null;

    const currentAnswer = answers[question.id];

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Pergunta {currentQuestionIndex + 1} de {activeSurvey.questions.length}</span>
          <Progress 
            value={((currentQuestionIndex + 1) / activeSurvey.questions.length) * 100} 
            className="w-24 h-2" 
          />
        </div>

        <h4 className="font-medium text-lg">{question.question}</h4>

        {question.type === 'rating' && (
          <div className="space-y-4">
            <Slider
              value={[Number(currentAnswer) || 5]}
              onValueChange={([value]) => handleAnswer(question.id, value)}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muito Insatisfeito</span>
              <span className="font-bold text-lg text-primary">{currentAnswer || 5}</span>
              <span>Muito Satisfeito</span>
            </div>
          </div>
        )}

        {question.type === 'nps' && (
          <div className="space-y-4">
            <div className="flex justify-between gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(question.id, i)}
                  className={`w-8 h-10 rounded text-sm font-medium transition-colors ${
                    currentAnswer === i
                      ? i <= 6 ? 'bg-red-500 text-white' 
                        : i <= 8 ? 'bg-amber-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nada provável</span>
              <span>Extremamente provável</span>
            </div>
          </div>
        )}

        {question.type === 'select' && question.options && (
          <RadioGroup
            value={String(currentAnswer || '')}
            onValueChange={(value) => handleAnswer(question.id, value)}
          >
            {question.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'text' && (
          <Textarea
            value={String(currentAnswer || '')}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder="Sua resposta..."
            rows={3}
          />
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Carregando pesquisas...
        </CardContent>
      </Card>
    );
  }

  if (pendingSurveys.length === 0) {
    return null;
  }

  if (!activeSurveyId) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            Pesquisas Pendentes
            <Badge variant="secondary">{pendingSurveys.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingSurveys.map((survey) => {
            const daysLeft = differenceInDays(new Date(survey.ends_at), new Date());
            
            return (
              <div
                key={survey.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setActiveSurveyId(survey.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{survey.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {survey.questions.length} perguntas • {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Último dia!'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  const isLastQuestion = activeSurvey && currentQuestionIndex === activeSurvey.questions.length - 1;
  const currentQuestion = activeSurvey?.questions[currentQuestionIndex];
  const canProceed = currentQuestion && answers[currentQuestion.id] !== undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{activeSurvey?.title}</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setActiveSurveyId(null);
              setCurrentQuestionIndex(0);
              setAnswers({});
            }}
          >
            Cancelar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {renderQuestion()}
        </AnimatePresence>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {isLastQuestion ? (
            <Button
              disabled={!canProceed || isSubmitting}
              onClick={handleSubmit}
            >
              <Send className="h-4 w-4 mr-1" />
              Enviar +25 XP
            </Button>
          ) : (
            <Button
              disabled={!canProceed}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
