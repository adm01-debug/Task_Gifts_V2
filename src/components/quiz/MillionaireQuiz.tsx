import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, HelpCircle, Users, Phone, Percent, Timer, Zap, Check, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import { useRecordAnswer } from "@/hooks/useQuizStats";
import { AudienceHelp, PhoneHelp, PrizeLadder, GameOverScreen, PRIZE_LADDER, CHECKPOINTS, formatPrize } from "./MillionaireHelpers";
import { quizPlayService } from "@/services/quizQuestionsService";
import { logger } from "@/services/loggingService";
import { toast } from "sonner";

export interface MillionaireQuestion {
  id: string;
  question: string;
  /** Alternativas sem gabarito — a correção é sempre feita no servidor. */
  options: { id: string; text: string }[];
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
}

interface MillionaireQuizProps {
  questions: MillionaireQuestion[];
  title?: string;
  onComplete?: (level: number, prize: number) => void;
}

export function MillionaireQuiz({ questions, title = "Show do Milhão", onComplete }: MillionaireQuizProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [wonPrize, setWonPrize] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const questionStartTime = useRef<number>(Date.now());
  const recordAnswer = useRecordAnswer();
  const [usedLifelines, setUsedLifelines] = useState({ fifty: false, audience: false, phone: false });
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<string>>(new Set());
  const [showAudience, setShowAudience] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const currentQuestion = questions[currentLevel];
  const currentPrize = PRIZE_LADDER[currentLevel];
  const guaranteedPrize = CHECKPOINTS.filter(cp => cp < currentLevel).length > 0 ? PRIZE_LADDER[CHECKPOINTS.filter(cp => cp < currentLevel).pop()!] : 0;

  useEffect(() => { questionStartTime.current = Date.now(); }, [currentLevel]);

  useEffect(() => {
    if (isRevealed || isGameOver || isTimerPaused || showAudience || showPhone) return;
    if (timeLeft === 0) { setIsGameOver(true); setWonPrize(guaranteedPrize); onComplete?.(currentLevel, guaranteedPrize); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isRevealed, isGameOver, isTimerPaused, showAudience, showPhone]);

  const handleConfirm = async () => {
    if (!selectedOption || isGrading) return;
    setIsGrading(true);
    try {
      const result = await quizPlayService.gradeAnswer(currentQuestion.id, selectedOption);
      setCorrectOptionId(result.correct_option_id);
      setIsRevealed(true);
      recordAnswer.mutate({ question_id: currentQuestion.id, selected_option_id: selectedOption, is_correct: result.is_correct, time_spent_ms: Date.now() - questionStartTime.current });
      if (result.is_correct) confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#fbbf24', '#f59e0b', '#d97706'] });
    } catch (err: unknown) {
      logger.apiError("grade_quiz_answer", err, "MillionaireQuiz");
      toast.error("Não foi possível validar sua resposta. Tente novamente.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleNext = () => {
    const isCorrect = correctOptionId !== null && selectedOption === correctOptionId;
    if (!isCorrect) { setIsGameOver(true); setWonPrize(guaranteedPrize); onComplete?.(currentLevel, guaranteedPrize); return; }
    if (currentLevel >= questions.length - 1) { setIsGameOver(true); setWonPrize(PRIZE_LADDER[currentLevel]); onComplete?.(currentLevel + 1, PRIZE_LADDER[currentLevel]); confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } }); return; }
    setCurrentLevel(l => l + 1); setSelectedOption(null); setIsRevealed(false); setCorrectOptionId(null); setEliminatedOptions(new Set()); setTimeLeft(30 - Math.floor(currentLevel / 5) * 5);
  };

  const handleRestart = () => { setCurrentLevel(0); setSelectedOption(null); setIsRevealed(false); setCorrectOptionId(null); setIsGameOver(false); setWonPrize(0); setTimeLeft(30); setUsedLifelines({ fifty: false, audience: false, phone: false }); setEliminatedOptions(new Set()); };

  const getOptionStyle = (option: { id: string }) => {
    if (eliminatedOptions.has(option.id)) return "opacity-30 pointer-events-none";
    if (!isRevealed) return selectedOption === option.id ? "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20" : "border-border/50 hover:border-primary/50";
    if (option.id === correctOptionId) return "border-emerald-500 bg-emerald-500/20";
    if (selectedOption === option.id) return "border-red-500 bg-red-500/20";
    return "border-border/30 opacity-50";
  };

  if (isGameOver) return <GameOverScreen wonPrize={wonPrize} onRestart={handleRestart} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" />{title}</h2><p className="text-sm text-muted-foreground">Pergunta {currentLevel + 1} de {questions.length}</p></div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-lg px-4 py-2 ${timeLeft <= 10 ? 'border-red-500 text-red-500 animate-pulse' : ''}`}><Timer className="w-4 h-4 mr-1" />{timeLeft}s</Badge>
          <Badge className="text-lg px-4 py-2 bg-amber-500/20 text-amber-400 border-amber-500/30"><Zap className="w-4 h-4 mr-1" />{formatPrize(currentPrize)}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <PrizeLadder currentLevel={currentLevel} />
        <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
          <div className="flex justify-center gap-3">
            <Button variant="outline" size="lg" className={`gap-2 ${usedLifelines.fifty ? 'opacity-30 line-through' : ''}`} onClick={async () => {
              if (usedLifelines.fifty) return;
              setUsedLifelines(p => ({ ...p, fifty: true }));
              try {
                const wrongIds = await quizPlayService.fiftyFifty(currentQuestion.id);
                setEliminatedOptions(new Set(wrongIds));
              } catch (err: unknown) {
                logger.apiError("quiz_fifty_fifty", err, "MillionaireQuiz");
                toast.error("Não foi possível usar a ajuda agora.");
              }
            }} disabled={usedLifelines.fifty || isRevealed}><Percent className="w-4 h-4" />50/50</Button>
            <Button variant="outline" size="lg" className={`gap-2 ${usedLifelines.audience ? 'opacity-30 line-through' : ''}`} onClick={() => { if (usedLifelines.audience || isRevealed) return; setUsedLifelines(p => ({ ...p, audience: true })); setShowAudience(true); }} disabled={usedLifelines.audience || isRevealed}><Users className="w-4 h-4" />Plateia</Button>
            <Button variant="outline" size="lg" className={`gap-2 ${usedLifelines.phone ? 'opacity-30 line-through' : ''}`} onClick={() => { if (usedLifelines.phone || isRevealed) return; setUsedLifelines(p => ({ ...p, phone: true })); setShowPhone(true); }} disabled={usedLifelines.phone || isRevealed}><Phone className="w-4 h-4" />Ligar</Button>
          </div>

          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <Badge className="bg-primary/20 text-primary mb-4">{currentQuestion.difficulty === "easy" ? "Fácil" : currentQuestion.difficulty === "medium" ? "Média" : "Difícil"}</Badge>
            <h3 className="text-xl font-semibold leading-relaxed">{currentQuestion.question}</h3>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => (
              <motion.button key={option.id} className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3 ${getOptionStyle(option)}`}
                onClick={() => { if (!isRevealed && !eliminatedOptions.has(option.id)) setSelectedOption(option.id); }} whileHover={!isRevealed && !eliminatedOptions.has(option.id) ? { scale: 1.02 } : {}} whileTap={!isRevealed ? { scale: 0.98 } : {}}>
                <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">{String.fromCharCode(65 + idx)}</span>
                <span className="text-sm font-medium">{option.text}</span>
                {isRevealed && option.id === correctOptionId && <Sparkles className="w-5 h-5 text-emerald-500 ml-auto" />}
              </motion.button>
            ))}
          </div>

          {isRevealed && currentQuestion.explanation && <div className="p-4 rounded-xl bg-muted/50 border"><p className="text-sm"><strong>💡 Explicação:</strong> {currentQuestion.explanation}</p></div>}

          <div className="flex justify-center gap-3">
            {!isRevealed ? (
              <>
                <Button variant="outline" onClick={() => { const prize = currentLevel > 0 ? PRIZE_LADDER[currentLevel - 1] : 0; setIsGameOver(true); setWonPrize(prize); onComplete?.(currentLevel, prize); }}>Parar (garantir {formatPrize(currentLevel > 0 ? PRIZE_LADDER[currentLevel - 1] : 0)})</Button>
                <Button onClick={handleConfirm} disabled={!selectedOption || isGrading} size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500"><HelpCircle className="w-4 h-4" />{isGrading ? "Validando..." : "Confirmar Resposta"}</Button>
              </>
            ) : <Button onClick={handleNext} size="lg" className="gap-2"><ChevronRight className="w-4 h-4" />{selectedOption === correctOptionId ? "Próxima Pergunta" : "Ver Resultado"}</Button>}
          </div>
        </div>
      </div>

      {showAudience && <AudienceHelp question={currentQuestion} onClose={() => setShowAudience(false)} />}
      {showPhone && <PhoneHelp question={currentQuestion} onClose={() => setShowPhone(false)} />}
    </div>
  );
}
