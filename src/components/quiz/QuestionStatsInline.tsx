import { useQuestionStats } from "@/hooks/useQuizStats";
import { TrendingUp, TrendingDown, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuestionStatsInlineProps {
  questionId: string;
}

export default function QuestionStatsInline({ questionId }: QuestionStatsInlineProps) {
  const { data: stats, isLoading } = useQuestionStats(questionId);

  if (isLoading) {
    return <Skeleton className="h-5 w-20" />;
  }

  if (!stats || stats.total === 0) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Users className="h-3 w-3" />
        Sem respostas
      </span>
    );
  }

  const rateColor = stats.rate >= 70 
    ? "text-green-500" 
    : stats.rate >= 40 
      ? "text-yellow-500" 
      : "text-red-500";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              {stats.total}
            </span>
            <span className={`flex items-center gap-0.5 font-medium ${rateColor}`}>
              {stats.rate >= 50 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {stats.rate}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {stats.correct} de {stats.total} respostas corretas ({stats.rate}%)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
