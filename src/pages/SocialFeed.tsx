import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Filter,
  Heart,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
  Trophy,
  Star,
  Gift,
  Flame,
  CheckCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useSocialFeed } from "@/hooks/useSocialFeed";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type ActivityType = "all" | "xp_gained" | "level_up" | "quest_completed" | "kudos_given" | "kudos_received" | "achievement_unlocked" | "streak_updated";
type PeriodType = "today" | "week" | "month" | "all" | "custom";

const activityTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "Todas", icon: Activity, color: "text-primary" },
  xp_gained: { label: "XP Ganho", icon: Zap, color: "text-yellow-500" },
  level_up: { label: "Level Up", icon: Trophy, color: "text-purple-500" },
  quest_completed: { label: "Quests", icon: CheckCircle, color: "text-green-500" },
  kudos_given: { label: "Kudos Enviados", icon: Star, color: "text-amber-500" },
  kudos_received: { label: "Kudos Recebidos", icon: Gift, color: "text-pink-500" },
  achievement_unlocked: { label: "Conquistas", icon: Trophy, color: "text-orange-500" },
  streak_updated: { label: "Streaks", icon: Flame, color: "text-red-500" },
};

const periodConfig: Record<PeriodType, { label: string; getDays: () => number | null }> = {
  today: { label: "Hoje", getDays: () => 0 },
  week: { label: "Última semana", getDays: () => 7 },
  month: { label: "Último mês", getDays: () => 30 },
  all: { label: "Todo período", getDays: () => null },
  custom: { label: "Personalizado", getDays: () => null },
};

export default function SocialFeedPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { activities, isLoading, refetch } = useSocialFeed(100);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const seoData = useSEO();
  
  // Filters
  const [activityType, setActivityType] = useState<ActivityType>("all");
  const [period, setPeriod] = useState<PeriodType>("week");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleLike = useCallback((id: string) => {
    setLikedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filter activities - memoized
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Type filter
      if (activityType !== "all" && activity.type !== activityType) {
        return false;
      }

      // Period filter
      const activityDate = new Date(activity.createdAt);
      const now = new Date();

      if (period === "today") {
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        if (activityDate < todayStart || activityDate > todayEnd) return false;
      } else if (period === "week") {
        const weekAgo = subDays(now, 7);
        if (activityDate < weekAgo) return false;
      } else if (period === "month") {
        const monthAgo = subDays(now, 30);
        if (activityDate < monthAgo) return false;
      } else if (period === "custom" && customDateRange.from) {
        const from = startOfDay(customDateRange.from);
        const to = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(now);
        if (activityDate < from || activityDate > to) return false;
      }

      return true;
    });
  }, [activities, activityType, period, customDateRange]);

  // Stats - memoized
  const stats = useMemo(() => ({
    total: filteredActivities.length,
    xpGained: filteredActivities.filter((a) => a.type === "xp_gained").length,
    levelUps: filteredActivities.filter((a) => a.type === "level_up").length,
    kudos: filteredActivities.filter((a) => a.type === "kudos_given" || a.type === "kudos_received").length,
    quests: filteredActivities.filter((a) => a.type === "quest_completed").length,
  }), [filteredActivities]);

  return (
    <PageWrapper pageName="Feed Social" className="min-h-screen bg-background pb-24">
      <SEOHead {...seoData} />
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Feed da Equipe
              </h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe as conquistas e atividades
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {/* Activity Type Filter */}
              <div className="flex-1 min-w-[200px]">
                <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(activityTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={cn("w-4 h-4", config.color)} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Filter */}
              <div className="flex-1 min-w-[200px]">
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(periodConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {period === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      {customDateRange.from
                        ? customDateRange.to
                          ? `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`
                          : customDateRange.from.toLocaleDateString()
                        : "Selecionar datas"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: customDateRange.from,
                        to: customDateRange.to,
                      }}
                      onSelect={(range) =>
                        setCustomDateRange({
                          from: range?.from,
                          to: range?.to,
                        })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {activityType !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {activityTypeConfig[activityType].label}
                  <button
                    onClick={() => setActivityType("all")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Badge variant="outline">{periodConfig[period].label}</Badge>
              <Badge variant="outline" className="bg-muted">
                {filteredActivities.length} atividades
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <Activity className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.xpGained}</p>
            <p className="text-xs text-muted-foreground">XP Ganho</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <Trophy className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.levelUps}</p>
            <p className="text-xs text-muted-foreground">Level Ups</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <Star className="w-5 h-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{stats.kudos}</p>
            <p className="text-xs text-muted-foreground">Kudos</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.quests}</p>
            <p className="text-xs text-muted-foreground">Quests</p>
          </motion.div>
        </div>

        {/* Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Timeline de Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma atividade encontrada
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Ajuste os filtros para ver mais resultados
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {filteredActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.2,
                        delay: Math.min(index * 0.03, 0.5),
                      }}
                      className="group relative"
                    >
                      {/* Timeline connector */}
                      {index < filteredActivities.length - 1 && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-border to-transparent" />
                      )}

                      <div className="flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                            <AvatarImage src={activity.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {activity.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <motion.div
                            className="absolute -bottom-1 -right-1 text-base bg-background rounded-full p-0.5 shadow-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring" }}
                          >
                             {activity.icon as any}
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed">
                            <span className={cn("font-medium", activity.color)}>
                              {activity.userName}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {activity.message.replace(activity.userName, "").trim()}
                            </span>
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>

                            {/* Interaction buttons */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                onClick={() => handleLike(activity.id)}
                                className={cn(
                                  "flex items-center gap-1 text-xs transition-colors",
                                  likedItems.has(activity.id)
                                    ? "text-pink-500"
                                    : "text-muted-foreground hover:text-pink-500"
                                )}
                                whileTap={{ scale: 0.9 }}
                              >
                                <motion.div
                                  animate={
                                    likedItems.has(activity.id)
                                      ? { scale: [1, 1.3, 1] }
                                      : {}
                                  }
                                >
                                  <Heart
                                    className="h-3.5 w-3.5"
                                    fill={likedItems.has(activity.id) ? "currentColor" : "none"}
                                  />
                                </motion.div>
                              </motion.button>
                              <button className="text-muted-foreground hover:text-primary transition-colors">
                                <MessageCircle className="h-3.5 w-3.5" />
                              </button>
                              <button className="text-muted-foreground hover:text-amber-500 transition-colors">
                                <Sparkles className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* XP badge */}
                        {activity.metadata?.xp_amount && (
                          <Badge
                            variant="outline"
                            className="shrink-0 text-amber-500 border-amber-500/30 bg-amber-500/10"
                          >
                            +{activity.metadata.xp_amount as number} XP
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
