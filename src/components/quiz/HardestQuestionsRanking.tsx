import { useHardestQuestions } from "@/hooks/useQuizStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Users, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Fácil', color: 'bg-emerald-500/20 text-emerald-500' },
  medium: { label: 'Médio', color: 'bg-amber-500/20 text-amber-500' },
  hard: { label: 'Difícil', color: 'bg-red-500/20 text-red-500' },
};

export default function HardestQuestionsRanking() {
  const { data: questions, isLoading } = useHardestQuestions(10);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = questions && questions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Perguntas Mais Difíceis
        </CardTitle>
        <CardDescription>
          Ranking baseado na menor taxa de acerto (mínimo 3 respostas)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const diffConfig = difficultyConfig[q.difficulty] || difficultyConfig.medium;
              const isVeryHard = q.accuracy_rate < 30;
              
              return (
                <motion.div
                  key={q.question_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border bg-card ${
                    isVeryHard ? 'border-orange-500/30 bg-orange-500/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0
                    ${idx === 0 ? 'bg-orange-500 text-white' : ''}
                    ${idx === 1 ? 'bg-orange-400 text-white' : ''}
                    ${idx === 2 ? 'bg-orange-300 text-orange-900' : ''}
                    ${idx > 2 ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    {idx + 1}
                  </div>

                  {/* Question info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{q.question_text}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge className={`text-xs ${diffConfig.color}`}>
                        {diffConfig.label}
                      </Badge>
                      {q.category && (
                        <Badge variant="outline" className="text-xs">
                          {q.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className={`
                      text-lg font-bold
                      ${q.accuracy_rate < 30 ? 'text-red-500' : ''}
                      ${q.accuracy_rate >= 30 && q.accuracy_rate < 50 ? 'text-orange-500' : ''}
                      ${q.accuracy_rate >= 50 ? 'text-yellow-500' : ''}
                    `}>
                      {q.accuracy_rate}%
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {q.total_answers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(q.avg_time_ms / 1000)}s
                      </span>
                    </div>
                  </div>

                  {/* Warning indicator for very hard */}
                  {isVeryHard && (
                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Flame className="h-12 w-12 mb-4 opacity-50" />
            <p>Dados insuficientes</p>
            <p className="text-sm">Necessário mínimo de 3 respostas por pergunta</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
