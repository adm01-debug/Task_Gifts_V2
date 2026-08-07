import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Radio, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepartmentWarFeed } from "@/hooks/useDepartmentWars";
import { relativeTime, summarizeFeed } from "@/lib/warFeed";
import { cn } from "@/lib/utils";

export interface WarLiveFeedProps {
  warId: string;
  /** Quantos eventos exibir. O banco limita a 100 independentemente do valor. */
  limit?: number;
  className?: string;
}

/** Feed "quem pontuou agora" — transparencia em tempo real do placar da guerra. */
export function WarLiveFeed({ warId, limit = 25, className }: WarLiveFeedProps) {
  const { data, isLoading, isError } = useDepartmentWarFeed(warId, limit);
  const items = useMemo(() => data ?? [], [data]);
  const pulse = useMemo(() => summarizeFeed(items), [items]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          Quem pontuou agora
        </CardTitle>
        {items.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              {pulse.events} evento{pulse.events === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Radio className="h-3.5 w-3.5" aria-hidden />
              {pulse.points.toLocaleString("pt-BR")} pts
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {pulse.departments} depto{pulse.departments === 1 ? "" : "s"}
            </span>
            {pulse.leader ? (
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" aria-hidden />
                {pulse.leader}
              </span>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o feed agora. Ele volta sozinho na próxima atualização.
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ninguém pontuou ainda. A primeira tarefa concluída aparece aqui na hora.
          </p>
        ) : (
          <ul className="space-y-2" aria-live="polite">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                    item.is_me
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60 bg-card/40",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.is_me ? "Você" : item.actor}
                      <span className="text-muted-foreground"> · {item.department_name}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.metric_label} · {relativeTime(item.created_at)}
                    </p>
                  </div>
                  <Badge variant={item.is_me ? "default" : "secondary"} className="shrink-0">
                    +{item.points.toLocaleString("pt-BR")}
                  </Badge>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </CardContent>
    </Card>
  );
}