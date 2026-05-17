import { useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeagues } from "@/hooks/useLeagues";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Zap, Info, Timer, ChevronRight, Star } from "lucide-react";

interface LeaderboardUser {
  user_id: string;
  weekly_xp: number;
  profile?: {
    display_name?: string;
    avatar_url?: string;
  };
}

export const LeagueCard = memo(function LeagueCard() {
  const { leagues, myLeague, leaderboard, isLoading } = useLeagues();
  const { playAchievementSound, playLevelUpSound } = useSoundEffects();
  const previousPositionRef = useRef<number | null>(null);

  const currentLeague = useMemo(() => {
    if (!myLeague) return null;
    return leagues.find(l => l.id === myLeague.league_id);
  }, [leagues, myLeague]);
  
  const userPosition = useMemo(() => {
    if (!myLeague) return 0;
    return leaderboard.findIndex(u => u.user_id === myLeague.user_id) + 1;
  }, [leaderboard, myLeague]);
  
  const promotionZone = currentLeague?.promotion_slots || 3;
  const demotionZone = leaderboard.length - (currentLeague?.demotion_slots || 3);

  const getPositionStyle = useCallback((position: number) => {
    if (position <= promotionZone) return "text-green-500 bg-green-500/10";
    if (position > demotionZone) return "text-red-500 bg-red-500/10";
    return "text-muted-foreground bg-muted";
  }, [promotionZone, demotionZone]);

  const getPositionIcon = useCallback((position: number) => {
    if (position === 1) return <Crown className="h-4 w-4 text-amber-500" />;
    if (position <= promotionZone) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (position > demotionZone) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }, [promotionZone, demotionZone]);

  useEffect(() => {
    if (!myLeague || leaderboard.length === 0) return;
    
    const currentPosition = leaderboard.findIndex(u => u.user_id === myLeague.user_id) + 1;
    
    if (previousPositionRef.current !== null && currentPosition > 0) {
      const previousPosition = previousPositionRef.current;
      const currentLeagueData = leagues.find(l => l.id === myLeague.league_id);
      const promotionSlots = currentLeagueData?.promotion_slots || 3;
      
      if (currentPosition < previousPosition) {
        if (currentPosition <= promotionSlots && previousPosition > promotionSlots) {
          playLevelUpSound();
        } else {
          playAchievementSound();
        }
      }
      if (currentPosition === 1 && previousPosition !== 1) {
        playLevelUpSound();
      }
    }
    
    previousPositionRef.current = currentPosition;
  }, [leaderboard, myLeague, leagues, playAchievementSound, playLevelUpSound]);

  if (isLoading) {
    return (
      <Card className="border-none bg-card/50 backdrop-blur-xl">
        <CardContent className="p-12 text-center text-muted-foreground animate-pulse">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
          Sincronizando ligas de elite...
        </CardContent>
      </Card>
    );
  }

  if (!myLeague) {
    return (
      <Card className="border-none bg-card/50 backdrop-blur-xl ring-1 ring-white/10">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight mb-2">Sem Divisão</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            A jornada competitiva espera por você. Complete sua primeira atividade para entrar no ranking mundial.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-2xl ring-1 ring-white/10 relative">
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 pointer-events-none rounded-full"
        style={{ backgroundColor: currentLeague?.color || 'var(--primary)' }}
      />
      
      <CardHeader className="pb-4 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shadow-lg ring-1 ring-white/20 transform transition-transform hover:scale-110"
              style={{ backgroundColor: `${currentLeague?.color}20`, border: `1px solid ${currentLeague?.color}40` }}
            >
              {currentLeague?.icon}
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase">
                Liga {currentLeague?.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Timer className="w-3 h-3" />
                Termina em 3 dias
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge 
              className="px-3 py-1 font-bold text-xs shadow-glow-sm"
              style={{ backgroundColor: currentLeague?.color, color: 'white' }}
            >
              +{currentLeague?.xp_bonus_percent}% XP BOOST
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-2 py-4 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted-foreground/10 -translate-y-1/2 z-0" />
          {leagues.map((league, idx) => {
            const isPast = idx < leagues.findIndex(l => l.id === myLeague.league_id);
            const isCurrent = league.id === myLeague.league_id;
            
            return (
              <div key={league.id} className="relative z-10 group cursor-help">
                <motion.div 
                  whileHover={{ scale: 1.2 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shadow-lg ${
                    isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 
                    isPast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                  style={isCurrent ? { backgroundColor: league.color, color: 'white' } : {}}
                >
                  {isPast ? <ChevronRight className="w-4 h-4" /> : league.icon}
                </motion.div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                  {league.name}
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Sua Posição</span>
            <div className="flex items-center gap-2">
              {getPositionIcon(userPosition)}
              <span className="text-2xl font-black italic tracking-tighter">#{userPosition}</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-muted/30 border border-white/5 flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">XP Semanal</span>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span className="text-2xl font-black italic tracking-tighter">{myLeague.weekly_xp.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 px-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
            <span className="text-green-500 flex items-center gap-1">
              <Star className="w-3 h-3 fill-green-500" /> PROMOÇÃO (TOP {promotionZone})
            </span>
            <span className="text-red-500">REBAIXAMENTO (ZONA DE RISCO)</span>
          </div>
          <div className="relative h-4 w-full rounded-full bg-muted/50 overflow-hidden border border-white/5 p-1">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-transparent to-red-500/20" />
            <motion.div
              className="h-full w-4 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] ring-1 ring-white/20"
              initial={{ left: "0%" }}
              animate={{ 
                left: `${leaderboard.length > 0 ? Math.min(96, ((userPosition - 1) / (leaderboard.length || 1)) * 100) : 0}%` 
              }}
              transition={{ type: "spring", stiffness: 100 }}
              style={{ position: 'absolute' }}
            />
          </div>
        </div>

        <div className="bg-muted/20 rounded-3xl p-2 border border-white/5">
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Trophy className="w-3 h-3" /> Top Concorrentes
            </span>
            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
          </div>
          
          <ScrollArea className="h-[260px] px-2">
            <div className="space-y-1 pb-2">
              {leaderboard.slice(0, 15).map((u, index) => {
                const position = index + 1;
                const isCurrentUser = u.user_id === myLeague.user_id;
                const typedUser = u as LeaderboardUser;

                return (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrentUser ? 'bg-primary/20 ring-1 ring-primary/40 shadow-glow-sm' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                      getPositionStyle(position)
                    }`}>
                      {position}
                    </div>
                    <Avatar className="h-9 w-9 border border-white/10 shadow-lg">
                      <AvatarImage src={typedUser.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-xs font-black">
                        {typedUser.profile?.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`flex-1 truncate text-sm tracking-tight ${isCurrentUser ? 'font-black uppercase' : 'font-bold'}`}>
                      {typedUser.profile?.display_name || 'Usuário'}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black italic ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {u.weekly_xp.toLocaleString()}
                      </span>
                      <span className="text-[9px] uppercase font-black text-muted-foreground opacity-50 tracking-tighter">XP</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="text-[10px] font-black text-center text-muted-foreground/40 tracking-[0.2em] uppercase pt-2">
          O destino está em suas mãos
        </div>
      </CardContent>
    </Card>
  );
});
