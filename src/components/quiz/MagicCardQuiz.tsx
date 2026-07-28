import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, X, Trophy, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import { useRecordAnswer } from "@/hooks/useQuizStats";
import { quizPlayService } from "@/services/quizQuestionsService";
import { logger } from "@/services/loggingService";
import { toast } from "sonner";

export interface QuizQuestion {
  id: string;
  question: string;
  /** Alternativas sem gabarito — a correção acontece no servidor. */
  options: {
    id: string;
    text: string;
  }[];
  explanation?: string;
  points: number;
}

interface MagicCardQuizProps {
  questions: QuizQuestion[];
  title?: string;
  onComplete?: (score: number, totalPoints: number, correctAnswers: number) => void;
}

function MagicCard({
  question,
  isFlipped,
  isAnswered,
  selectedAnswer,
  correctOptionId,
  onFlip,
  onAnswer,
}: {
  question: QuizQuestion;
  isFlipped: boolean;
  isAnswered: boolean;
  selectedAnswer: string | null;
  correctOptionId: string | null;
  onFlip: () => void;
  onAnswer: (optionId: string) => void;
}) {
  const getOptionStyle = (option: { id: string }) => {
    if (!isAnswered) return "border-border/50 hover:border-primary/50 hover:bg-primary/5";
    if (option.id === correctOptionId) return "border-emerald-500 bg-emerald-500/20 text-emerald-400";
    if (selectedAnswer === option.id) return "border-red-500 bg-red-500/20 text-red-400";
    return "border-border/30 opacity-50";
  };

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <motion.div
        className="relative w-full aspect-[3/4] cursor-pointer preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        onClick={() => !isFlipped && onFlip()}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back of card (shown initially) */}
        <div
          className="absolute inset-0 backface-hidden rounded-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMjAgMjBtLTIgMGEyIDIgMCAxIDAgNCAwYTIgMiAwIDEgMCAtNCAwIiBmaWxsPSJjdXJyZW50Q29sb3IiIG9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-30" />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="text-center"
            >
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-lg font-bold text-primary">Toque para revelar</p>
              <p className="text-sm text-muted-foreground mt-1">Carta Mágica</p>
            </motion.div>
          </Card>
        </div>

        {/* Front of card (question) */}
        <div
          className="absolute inset-0 backface-hidden rounded-2xl"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <Card className="w-full h-full bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 p-6 flex flex-col overflow-hidden">
            {/* Question */}
            <div className="flex-1 flex items-center justify-center mb-4">
              <div className="text-center">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                  <Zap className="w-3 h-3 mr-1" />
                  {question.points} pontos
                </Badge>
                <h3 className="text-lg font-semibold leading-relaxed">
                  {question.question}
                </h3>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={option.id}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${getOptionStyle(option)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAnswered) onAnswer(option.id);
                  }}
                  disabled={isAnswered}
                  whileHover={!isAnswered ? { scale: 1.02 } : {}}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                >
                  <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-sm">{option.text}</span>
                  {isAnswered && option.id === correctOptionId && (
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  {isAnswered && selectedAnswer === option.id && option.id !== correctOptionId && (
                    <X className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {isAnswered && question.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50"
                >
                  <p className="text-sm text-muted-foreground">
                    💡 {question.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

export function MagicCardQuiz({ questions, title = "Quiz Cartas Mágicas", onComplete }: MagicCardQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [score, setScore] = useState(0);
  const [gradedAnswers, setGradedAnswers] = useState<Map<number, { correctOptionId: string | null; isCorrect: boolean }>>(new Map());
  const [isGrading, setIsGrading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const questionStartTime = useRef<number>(Date.now());
  const recordAnswer = useRecordAnswer();

  const currentQuestion = questions[currentIndex];
  const isCurrentFlipped = flippedCards.has(currentIndex);
  const isCurrentAnswered = answers.has(currentIndex);
  const selectedAnswer = answers.get(currentIndex) || null;

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const correctCount = Array.from(gradedAnswers.values()).filter(g => g.isCorrect).length;
  const currentCorrectOptionId = gradedAnswers.get(currentIndex)?.correctOptionId ?? null;

  const handleFlip = () => {
    setFlippedCards(prev => new Set([...prev, currentIndex]));
    questionStartTime.current = Date.now();
  };

  const handleAnswer = async (optionId: string) => {
    if (isGrading) return;
    const timeSpent = Date.now() - questionStartTime.current;
    setIsGrading(true);

    let isCorrect = false;
    try {
      const result = await quizPlayService.gradeAnswer(currentQuestion.id, optionId);
      isCorrect = result.is_correct;
      setAnswers(prev => new Map([...prev, [currentIndex, optionId]]));
      setGradedAnswers(prev => new Map([...prev, [currentIndex, { correctOptionId: result.correct_option_id, isCorrect }]]));
    } catch (err: unknown) {
      logger.apiError("grade_quiz_answer", err, "MagicCardQuiz");
      toast.error("Não foi possível validar sua resposta. Tente novamente.");
      setIsGrading(false);
      return;
    }
    setIsGrading(false);

    // Record answer for statistics
    recordAnswer.mutate({
      question_id: currentQuestion.id,
      selected_option_id: optionId,
      is_correct: isCorrect,
      time_spent_ms: timeSpent,
    });

    if (isCorrect) {
      const streakBonus = streak >= 2 ? Math.floor(currentQuestion.points * 0.1 * streak) : 0;
      setScore(prev => prev + currentQuestion.points + streakBonus);
      setStreak(prev => prev + 1);
      
      // Celebrate correct answer
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#10b981', '#34d399']
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      onComplete?.(score, totalPoints, correctCount);
      
      // Final celebration
      if (correctCount === questions.length) {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFlippedCards(new Set());
    setAnswers(new Map());
    setScore(0);
    setStreak(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const isPerfect = correctCount === questions.length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: isPerfect ? [0, 10, -10, 0] : 0
          }}
          transition={{ duration: 0.5 }}
        >
          <Trophy className={`w-20 h-20 mx-auto mb-6 ${isPerfect ? 'text-amber-400' : 'text-primary'}`} />
        </motion.div>
        
        <h2 className="text-3xl font-bold mb-2">
          {isPerfect ? "Perfeito! 🎉" : percentage >= 70 ? "Muito bem! 👏" : "Continue praticando! 💪"}
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Você completou o quiz!
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
          <Card className="p-4 bg-primary/10 border-primary/20">
            <p className="text-2xl font-bold text-primary">{score}</p>
            <p className="text-xs text-muted-foreground">Pontos</p>
          </Card>
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-500">{correctCount}/{questions.length}</p>
            <p className="text-xs text-muted-foreground">Acertos</p>
          </Card>
          <Card className="p-4 bg-amber-500/10 border-amber-500/20">
            <p className="text-2xl font-bold text-amber-500">{percentage}%</p>
            <p className="text-xs text-muted-foreground">Aproveitamento</p>
          </Card>
        </div>

        <Button onClick={handleRestart} size="lg" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Jogar Novamente
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            Carta {currentIndex + 1} de {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
              🔥 Streak x{streak}
            </Badge>
          )}
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Zap className="w-4 h-4 mr-1 text-amber-400" />
            {score} pts
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={(currentIndex / questions.length) * 100} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{correctCount} acertos</span>
          <span>{questions.length - currentIndex - 1} restantes</span>
        </div>
      </div>

      {/* Card */}
      <MagicCard
        question={currentQuestion}
        isFlipped={isCurrentFlipped}
        isAnswered={isCurrentAnswered}
        selectedAnswer={selectedAnswer}
        onFlip={handleFlip}
        onAnswer={handleAnswer}
      />

      {/* Next button */}
      <AnimatePresence>
        {isCurrentAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex justify-center"
          >
            <Button onClick={handleNext} size="lg" className="gap-2">
              {currentIndex < questions.length - 1 ? "Próxima Carta" : "Ver Resultado"}
              <Sparkles className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}