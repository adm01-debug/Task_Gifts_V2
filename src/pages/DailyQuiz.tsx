import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Gamepad2, ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MagicCardQuiz, QuizQuestion } from "@/components/quiz/MagicCardQuiz";
import { MillionaireQuiz, MillionaireQuestion } from "@/components/quiz/MillionaireQuiz";
import { QuizDailyRanking } from "@/components/quiz/QuizDailyRanking";
import { useSaveQuizScore } from "@/hooks/useQuizScores";
import { useQuizQuestionsWithOptions } from "@/hooks/useQuizQuestions";
import { QuizQuestion as DbQuizQuestion } from "@/services/quizQuestionsService";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
 import { MobilePageLayout } from "@/components/mobile";
 import { PageShell } from "@/components/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

// Transform database questions to MagicCardQuiz format
function transformToMagicQuestions(dbQuestions: DbQuizQuestion[]): QuizQuestion[] {
  return dbQuestions.map(q => ({
    id: q.id,
    question: q.question,
    options: (q.options || []).map(opt => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.is_correct,
    })),
    explanation: q.explanation || undefined,
    points: q.points,
  }));
}

// Transform database questions to MillionaireQuiz format
function transformToMillionaireQuestions(dbQuestions: DbQuizQuestion[]): MillionaireQuestion[] {
  // Sort by difficulty: easy -> medium -> hard
  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  const sorted = [...dbQuestions].sort((a, b) => 
    (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
    (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
  );

  return sorted.map(q => ({
    id: q.id,
    question: q.question,
    options: (q.options || []).map(opt => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.is_correct,
    })),
    difficulty: (q.difficulty as "easy" | "medium" | "hard") || "easy",
    explanation: q.explanation || undefined,
  }));
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function DailyQuiz() {
  const seoConfig = useSEO();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeQuiz, setActiveQuiz] = useState<"magic" | "millionaire" | null>(null);
  const [completedToday, setCompletedToday] = useState({
    magic: false,
    millionaire: false,
  });
  const saveScore = useSaveQuizScore();

  // Fetch questions from database
  const { data: magicDbQuestions, isLoading: loadingMagic } = useQuizQuestionsWithOptions({
    quiz_type: 'magic_cards',
    is_active: true,
    limit: 10,
  });

  const { data: millionaireDbQuestions, isLoading: loadingMillionaire } = useQuizQuestionsWithOptions({
    quiz_type: 'millionaire',
    is_active: true,
    limit: 15,
  });

  // Transform and shuffle questions
  const magicQuestions = useMemo(() => {
    if (!magicDbQuestions?.length) return [];
    return shuffleArray(transformToMagicQuestions(magicDbQuestions)).slice(0, 5);
  }, [magicDbQuestions]);

  const millionaireQuestions = useMemo(() => {
    if (!millionaireDbQuestions?.length) return [];
    return transformToMillionaireQuestions(millionaireDbQuestions).slice(0, 8);
  }, [millionaireDbQuestions]);

  const handleMagicComplete = (score: number, totalPoints: number, correctAnswers: number) => {
    saveScore.mutate({
      quiz_type: 'magic_cards',
      score,
      correct_answers: correctAnswers,
      total_questions: magicQuestions.length,
      streak_bonus: score - (correctAnswers * 100),
    }, {
      onSuccess: () => {
        toast.success("Pontuação salva no ranking!");
        setCompletedToday(prev => ({ ...prev, magic: true }));
      },
    });
  };

  const handleMillionaireComplete = (level: number, prize: number) => {
    saveScore.mutate({
      quiz_type: 'millionaire',
      score: prize,
      correct_answers: level,
      total_questions: millionaireQuestions.length,
    }, {
      onSuccess: () => {
        toast.success("Pontuação salva no ranking!");
        setCompletedToday(prev => ({ ...prev, millionaire: true }));
      },
    });
  };

  const isLoading = loadingMagic || loadingMillionaire;
  const hasMagicQuestions = magicQuestions.length >= 3;
  const hasMillionaireQuestions = millionaireQuestions.length >= 5;

   return (
     <PageShell title="Quiz Diário" backFallback="/">
       <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
       <header className="px-4 py-6 border-b border-border/50 mb-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="p-3 rounded-xl bg-primary/10">
             <Gamepad2 className="w-8 h-8 text-primary" />
           </div>
           <div>
             <h1 className="text-3xl font-bold">Quiz Diário</h1>
             <p className="text-muted-foreground text-sm">Aprenda jogando e ganhe XP</p>
           </div>
         </div>
         {activeQuiz && (
           <Button variant="outline" size="sm" onClick={() => setActiveQuiz(null)} className="gap-2">
             <ArrowLeft className="w-4 h-4" />
             Voltar
           </Button>
         )}
       </header>
 
       <div className="container max-w-5xl mx-auto px-4 pb-24">
          {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-16 w-full" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </Card>
          </div>
        ) : !activeQuiz ? (
          /* Quiz Selection + Ranking */
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 grid md:grid-cols-2 gap-6"
            >
              {/* Magic Cards Quiz */}
              <Card 
                className={`overflow-hidden border-2 transition-all ${
                  hasMagicQuestions 
                    ? "border-primary/20 bg-gradient-to-br from-primary/10 to-purple-500/10 hover:border-primary/40 cursor-pointer group"
                    : "border-muted bg-muted/30 opacity-60"
                }`}
                onClick={() => hasMagicQuestions && setActiveQuiz("magic")}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${hasMagicQuestions ? 'bg-primary/20 group-hover:scale-110' : 'bg-muted'} transition-transform`}>
                      <Sparkles className={`w-8 h-8 ${hasMagicQuestions ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    {completedToday.magic && (
                      <span className="text-xs text-emerald-500 font-medium">✓ Concluído hoje</span>
                    )}
                    {!hasMagicQuestions && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Sem perguntas
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl mt-4">Cartas Mágicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Vire as cartas para revelar perguntas! Cada carta esconde um desafio com pontuação baseada na dificuldade.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Animações de flip interativas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Sistema de streak para bônus
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Explicações após cada resposta
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Button 
                      className="w-full gap-2" 
                      disabled={!hasMagicQuestions}
                    >
                      <Sparkles className="w-4 h-4" />
                      {hasMagicQuestions ? 'Jogar Cartas Mágicas' : 'Cadastre perguntas'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Millionaire Quiz */}
              <Card 
                className={`overflow-hidden border-2 transition-all ${
                  hasMillionaireQuestions 
                    ? "border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:border-amber-500/40 cursor-pointer group"
                    : "border-muted bg-muted/30 opacity-60"
                }`}
                onClick={() => hasMillionaireQuestions && setActiveQuiz("millionaire")}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${hasMillionaireQuestions ? 'bg-amber-500/20 group-hover:scale-110' : 'bg-muted'} transition-transform`}>
                      <Trophy className={`w-8 h-8 ${hasMillionaireQuestions ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </div>
                    {completedToday.millionaire && (
                      <span className="text-xs text-emerald-500 font-medium">✓ Concluído hoje</span>
                    )}
                    {!hasMillionaireQuestions && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Sem perguntas
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl mt-4">Show do Milhão</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Responda perguntas de dificuldade crescente e acumule pontos! Use suas ajudas com sabedoria.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Escada de prêmios progressiva
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      3 ajudas: 50/50, Plateia, Telefone
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Timer e checkpoints de segurança
                    </li>
                  </ul>
                  <div className="mt-6">
                    <Button 
                      className="w-full gap-2 bg-amber-500 hover:bg-amber-600" 
                      disabled={!hasMillionaireQuestions}
                    >
                      <Trophy className="w-4 h-4" />
                      {hasMillionaireQuestions ? 'Jogar Show do Milhão' : 'Cadastre perguntas'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Ranking */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <QuizDailyRanking />
            </motion.div>
          </div>
        ) : activeQuiz === "magic" ? (
          /* Magic Cards Game */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <MagicCardQuiz 
              questions={magicQuestions} 
              title="Quiz Diário - Cartas Mágicas"
              onComplete={handleMagicComplete}
            />
          </motion.div>
        ) : (
          /* Millionaire Game */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <MillionaireQuiz 
              questions={millionaireQuestions}
              title="Show do Milhão - Promo Brindes"
              onComplete={handleMillionaireComplete}
            />
          </motion.div>
        )}
       </div>
     </PageShell>
   );
}
