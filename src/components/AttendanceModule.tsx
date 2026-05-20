import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  LogIn, 
  LogOut,
  Calendar,
  Trophy,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  useAttendanceSettings, 
  useUserStreak, 
  useTodayAttendance,
  useRecentAttendance,
  useCheckIn,
  useCheckOut,
  useStreakLeaderboard
} from "@/hooks/useAttendance";
import { useProfiles } from "@/hooks/useProfiles";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const AttendanceModule = () => {
  const { data: settings, isLoading: settingsLoading } = useAttendanceSettings();
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: todayRecord, isLoading: todayLoading } = useTodayAttendance();
  const { data: recentRecords, isLoading: recentLoading } = useRecentAttendance(7);
  const { data: leaderboard, isLoading: leaderboardLoading } = useStreakLeaderboard(5);
  const { data: profiles, isLoading: profilesLoading } = useProfiles();

  const isLoading = settingsLoading || streakLoading || todayLoading || recentLoading || leaderboardLoading || profilesLoading;
  
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  // Calculate if within work hours
  const workStart = settings?.work_start_time || '08:00:00';
  const workEnd = settings?.work_end_time || '18:00:00';
  const tolerance = settings?.tolerance_minutes || 10;
  
  const [startHour, startMin] = workStart.split(':').map(Number);
  const toleranceEnd = new Date(now);
  toleranceEnd.setHours(startHour, startMin + tolerance, 0, 0);
  
  const isWithinTolerance = now <= toleranceEnd;
  const hasCheckedIn = !!todayRecord;
  const hasCheckedOut = todayRecord?.check_out !== null;

  // Calculate punctuality rate for the week
  const punctualDays = recentRecords?.filter(r => r.is_punctual).length || 0;
  const totalDays = recentRecords?.length || 0;
  const punctualityRate = totalDays > 0 ? (punctualDays / totalDays) * 100 : 0;

  // Get profile by user_id helper
  const getProfile = (userId: string) => profiles?.find(p => p.id === userId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card variant="prominent" className="overflow-hidden">
          <CardHeader>
            <Skeleton variant="shimmer" className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Skeleton variant="glow" className="h-16 w-32 mx-auto rounded-xl" />
            <Skeleton variant="shimmer" className="h-4 w-48 mx-auto" />
            <div className="flex justify-center gap-4">
              <Skeleton variant="shimmer" className="h-4 w-24" />
              <Skeleton variant="shimmer" className="h-4 w-24" />
            </div>
            <Skeleton variant="glow" className="h-12 w-40 mx-auto rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-4">
            <Skeleton variant="shimmer" className="h-4 w-40" />
            <div className="flex justify-between items-center">
              <Skeleton variant="glow" className="h-12 w-20" />
              <Skeleton variant="shimmer" className="h-12 w-32" />
            </div>
            <Skeleton variant="shimmer" className="h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Check-in Card */}
      <Card variant="prominent" className="overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Ponto Digital
          </CardTitle>
        </CardHeader>
        
        <CardContent className="relative space-y-6">
          {/* Current Time Display */}
          <div className="text-center">
            <motion.div
              key={currentTime}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-foreground tabular-nums"
            >
              {currentTime}
            </motion.div>
            <p className="text-muted-foreground text-sm mt-1">
              {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Work Hours Info */}
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <LogIn className="h-4 w-4" />
              <span>Entrada: {workStart.slice(0, 5)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span>Saída: {workEnd.slice(0, 5)}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            {!hasCheckedIn ? (
              isWithinTolerance ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Dentro da tolerância (+{tolerance}min)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                  <Clock className="h-3 w-3 mr-1" />
                  Fora da tolerância
                </Badge>
              )
            ) : hasCheckedOut ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Expediente finalizado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                <Clock className="h-3 w-3 mr-1" />
                Em expediente desde {format(parseISO(todayRecord.check_in), 'HH:mm')}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            {!hasCheckedIn ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  className={cn(
                    "gap-2 min-w-[160px]",
                    isWithinTolerance 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  {checkInMutation.isPending ? 'Registrando...' : 'Check-in'}
                </Button>
              </motion.div>
            ) : !hasCheckedOut ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                  className="gap-2 min-w-[160px]"
                >
                  <LogOut className="h-4 w-4" />
                  {checkOutMutation.isPending ? 'Registrando...' : 'Check-out'}
                </Button>
              </motion.div>
            ) : null}
          </div>

          {/* Today's Record Details */}
          {todayRecord && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 rounded-lg p-3 text-sm"
            >
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Entrada:</span>
                <span className="font-medium flex items-center gap-1">
                  {format(parseISO(todayRecord.check_in), 'HH:mm')}
                  {todayRecord.is_punctual ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-orange-500 text-xs">
                      (+{todayRecord.late_minutes}min)
                    </span>
                  )}
                </span>
              </div>
              {todayRecord.check_out && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-muted-foreground">Saída:</span>
                  <span className="font-medium">
                    {format(parseISO(todayRecord.check_out), 'HH:mm')}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card variant="elevated" className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Streak de Pontualidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <motion.div
                key={streak?.current_streak}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-baseline gap-1"
              >
                <span className="text-4xl font-bold text-orange-500">
                  {streak?.current_streak || 0}
                </span>
                <span className="text-muted-foreground text-sm">dias</span>
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Recorde: {streak?.best_streak || 0} dias
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">+{settings?.xp_punctual_checkin || 15} XP</span>
              </div>
              <p className="text-xs text-muted-foreground">por check-in pontual</p>
            </div>
          </div>

          {/* Streak Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Próximo bônus</span>
              <span>{(streak?.current_streak || 0) % (settings?.streak_milestone || 5)}/{settings?.streak_milestone || 5} dias</span>
            </div>
            <Progress 
              value={((streak?.current_streak || 0) % (settings?.streak_milestone || 5)) / (settings?.streak_milestone || 5) * 100} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Bônus de +{settings?.xp_streak_bonus || 50} XP a cada {settings?.streak_milestone || 5} dias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly History */}
      <Card variant="subtle">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Histórico da Semana
            </div>
            <Badge variant="secondary" className="font-normal">
              {punctualityRate.toFixed(0)}% pontual
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const dateStr = date.toISOString().split('T')[0];
              const record = recentRecords?.find(r => 
                r.check_in.startsWith(dateStr)
              );
              
              const isToday = i === 6;
              const dayName = format(date, 'EEE', { locale: ptBR }).slice(0, 3);
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex flex-col items-center gap-1 flex-1",
                    isToday && "relative"
                  )}
                >
                  <span className="text-xs text-muted-foreground capitalize">
                    {dayName}
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      !record && "bg-muted text-muted-foreground",
                      record?.is_punctual && "bg-green-500/20 text-green-500",
                      record && !record.is_punctual && "bg-orange-500/20 text-orange-500",
                      isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                  {record && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(record.check_in), 'HH:mm')}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Streak Leaderboard */}
      <Card variant="subtle">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <AnimatePresence>
              {leaderboard?.slice(0, 5).map((entry, index) => {
                const profile = getProfile(entry.user_id);
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg",
                      index === 0 && "bg-yellow-500/10",
                      index === 1 && "bg-slate-400/10",
                      index === 2 && "bg-amber-700/10"
                    )}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 && "bg-yellow-500 text-yellow-950",
                      index === 1 && "bg-slate-400 text-slate-950",
                      index === 2 && "bg-amber-700 text-amber-100",
                      index > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {profile?.display_name?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium truncate">
                      {profile?.display_name || 'Usuário'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-bold">{entry.current_streak}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
