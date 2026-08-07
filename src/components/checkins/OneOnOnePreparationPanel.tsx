import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Target,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ThumbsUp,
  TrendingDown,
  Calendar,
  BookOpen,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OneOnOnePreparation, SuggestedAgenda } from "@/services/oneOnOnePreparationService";

interface OneOnOnePreparationPanelProps {
  preparation: OneOnOnePreparation | null;
  isLoading: boolean;
  onClose?: () => void;
}

export function OneOnOnePreparationPanel({ preparation, isLoading, onClose }: OneOnOnePreparationPanelProps) {
  const [expandedAgenda, setExpandedAgenda] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">Preparando 1:1 com IA...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!preparation) {
    return null;
  }

  const { context, suggestedAgenda, talkingPoints, warningFlags, positiveHighlights, followUpFromLast } = preparation;

  const totalDuration = suggestedAgenda.reduce((acc, item) => acc + item.duration, 0);

  const getPriorityColor = (priority: SuggestedAgenda["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "low": return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    }
  };

  const getPriorityLabel = (priority: SuggestedAgenda["priority"]) => {
    switch (priority) {
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with employee info */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={context.employee.avatar_url} />
                  <AvatarFallback>{context.employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Preparação IA para 1:1
                </CardTitle>
                <CardDescription>
                  {context.employee.name}
                  {context.employee.position && ` • ${context.employee.position}`}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~{totalDuration} min</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Warning Flags */}
      {warningFlags.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Pontos de Atenção ({warningFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {warningFlags.map((flag, idx) => (
                <li key={idx} className="text-sm text-red-700 dark:text-red-400">
                  {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Positive Highlights */}
      {positiveHighlights.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <ThumbsUp className="h-4 w-4" />
              Destaques Positivos ({positiveHighlights.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {positiveHighlights.map((highlight, idx) => (
                <li key={idx} className="text-sm text-green-700 dark:text-green-400">
                  {highlight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Follow up from last meeting */}
      {followUpFromLast.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <Calendar className="h-4 w-4" />
              Pendências do Último 1:1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {followUpFromLast.map((item, idx) => (
                <li key={idx} className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Suggested Agenda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Pauta Sugerida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {suggestedAgenda.map((item, idx) => (
                <Collapsible
                  key={idx}
                  open={expandedAgenda === item.topic}
                  onOpenChange={(open) => setExpandedAgenda(open ? item.topic : null)}
                >
                  <CollapsibleTrigger asChild>
                    <div className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${getPriorityColor(item.priority)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getPriorityColor(item.priority)}>
                            {getPriorityLabel(item.priority)}
                          </Badge>
                          <span className="font-medium text-sm">{item.topic}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="text-xs">{item.duration} min</span>
                          {expandedAgenda === item.topic ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="ml-4 mt-2 p-3 bg-muted/30 rounded-lg"
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Perguntas sugeridas:
                      </p>
                      <ul className="space-y-1.5">
                        {item.questions.map((question, qIdx) => (
                          <li key={qIdx} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {question}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Talking Points */}
      {talkingPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Insights Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {talkingPoints.map((point, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="h-3 w-3 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-primary">{context.goals.length}</div>
          <div className="text-xs text-muted-foreground">Metas Ativas</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-primary">
            {context.recentKudos.length}
          </div>
          <div className="text-xs text-muted-foreground">Kudos Recentes</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-lg font-bold text-primary">
            {context.pdiProgress ? 
              `${Math.round((context.pdiProgress.completedActions / Math.max(context.pdiProgress.totalActions, 1)) * 100)}%` : 
              "N/A"
            }
          </div>
          <div className="text-xs text-muted-foreground">PDI Concluído</div>
        </Card>
      </div>
    </motion.div>
  );
}
