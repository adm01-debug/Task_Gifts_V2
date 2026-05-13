import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonActivityList } from "@/components/ui/skeleton";
import { useSocialFeed } from "@/hooks/useSocialFeed";
import { useCommentsCounts } from "@/hooks/useActivityComments";
import { useActivityReactions } from "@/hooks/useActivityReactions";
import { ActivityComments } from "@/components/ActivityComments";
import { ActivityReactions } from "@/components/ActivityReactions";
import { Activity, Users } from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

interface SocialFeedProps {
  limit?: number;
  compact?: boolean;
  className?: string;
}

/**
 * SocialFeed - Displays team activity timeline with reactions and comments
 * Wrapped in React.memo to prevent unnecessary re-renders from parent state changes
 */
export const SocialFeed = memo(function SocialFeed({ limit = 30, compact = false, className }: SocialFeedProps) {
  const { activities, isLoading } = useSocialFeed(limit);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const activityIds = useMemo(() => activities.map((a) => a.id), [activities]);
  const { data: commentCounts = {} } = useCommentsCounts(activityIds);
  const { reactions } = useActivityReactions(activityIds);

  const toggleComments = useCallback((id: string) => {
    setOpenComments((prev) => (prev === id ? null : id));
  }, []);

  if (isLoading) {
    return (
      <Card variant="default" className={cn("h-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Feed da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonActivityList count={5} />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card variant="default" className={cn("h-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Feed da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
            <p className="text-sm text-muted-foreground/70">
              As conquistas da equipe aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Feed da Equipe
          <motion.span
            className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {activities.length} atividades
          </motion.span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className={compact ? "h-[300px]" : "h-[500px]"}>
          <div className="px-4 pb-4">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200,
                  }}
                  className="group relative"
                >
                  {/* Timeline connector */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-border to-transparent" />
                  )}

                  <div className="py-3 rounded-lg hover:bg-muted/50 transition-colors px-2 -mx-2">
                    <div className="flex items-start gap-3">
                      {/* Avatar with icon overlay */}
                      <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                          <AvatarImage src={activity.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {activity.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <motion.div
                          className="absolute -bottom-1 -right-1 text-base bg-background rounded-full p-0.5 shadow-sm"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                        >
                           {activity.icon}
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <motion.p
                          className="text-sm leading-relaxed"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.1 }}
                        >
                          <span className={cn("font-medium", activity.color)}>
                            {activity.userName}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {activity.message.replace(activity.userName, "").trim()}
                          </span>
                        </motion.p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        {/* Reactions */}
                        <div className="mt-2">
                          <ActivityReactions
                            activityId={activity.id}
                            reactions={reactions[activity.id] || []}
                          />
                        </div>

                        {/* Comments section */}
                        <ActivityComments
                          activityId={activity.id}
                          isOpen={openComments === activity.id}
                          onToggle={() => toggleComments(activity.id)}
                          commentCount={commentCounts[activity.id] || 0}
                        />
                      </div>

                      {/* XP/Coins badge if applicable */}
                      {activity.metadata?.xp_amount && (
                        <motion.div
                          className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.3, type: "spring" }}
                        >
                          +{activity.metadata.xp_amount as number} XP
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
