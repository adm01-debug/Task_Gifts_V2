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
    <Card variant="ultra" className="overflow-hidden relative bg-gradient-to-br from-card/80 via-card/50 to-primary/10 border-white/5 ring-1 ring-white/10 shadow-2xl">
      {/* Scanning Line Animation */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div 
          className="w-full h-[2px] bg-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute' }}
        />
      </div>

      <div 
        className="absolute -top-32 -right-32 w-80 h-80 blur-[120px] opacity-20 pointer-events-none rounded-full"
        style={{ backgroundColor: currentLeague?.color || 'var(--primary)' }}
      />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-glow ring-2 ring-white/10"
              style={{ backgroundColor: `${currentLeague?.color}30`, border: `2px solid ${currentLeague?.color}60` }}
            >
              {currentLeague?.icon}
            </motion.div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-primary/30 text-primary bg-primary/5">
                  Operational Level
                </Badge>
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter uppercase italic text-shadow-glow">
                Divisão {currentLeague?.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                <Timer className="w-3 h-3 text-primary" />
                Cycle reset in <span className="text-foreground">3D 14H</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Xp Protocol</div>
              <Badge 
                className="px-4 py-1.5 font-black text-xs shadow-glow border-none"
                style={{ backgroundColor: currentLeague?.color, color: 'white' }}
              >
                +{currentLeague?.xp_bonus_percent}% YIELD
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-4 py-6 relative bg-white/5 rounded-2xl border border-white/5 shadow-inner">
          <div className="absolute top-1/2 left-8 right-8 h-[2px] bg-white/10 -translate-y-1/2 z-0" />
          {leagues.map((league, idx) => {
            const isPast = idx < leagues.findIndex(l => l.id === myLeague.league_id);
            const isCurrent = league.id === myLeague.league_id;
            
            return (
              <div key={league.id} className="relative z-10 group cursor-help">
                <motion.div 
                  whileHover={{ scale: 1.3, rotate: 10 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all shadow-xl ${
                    isCurrent ? 'ring-2 ring-primary ring-offset-4 ring-offset-background scale-125' : 
                    isPast ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-white/5'
                  }`}
                  style={isCurrent ? { backgroundColor: league.color, color: 'white', boxShadow: `0 0 20px ${league.color}40` } : {}}
                >
                  {isPast ? <ChevronRight className="w-5 h-5" /> : league.icon}
                </motion.div>
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap uppercase tracking-[0.2em] text-primary">
                  {league.name}
                </div>
              </div>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 relative">
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-2 group shadow-xl"
          >
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Combat Rank</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {getPositionIcon(userPosition)}
              </div>
              <span className="text-3xl font-black italic tracking-tighter text-shadow-glow">#{userPosition}</span>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="p-5 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-2 group shadow-xl"
          >
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-amber-500 transition-colors">Weekly Intel</span>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500 shadow-glow-sm" />
              </div>
              <span className="text-3xl font-black italic tracking-tighter text-shadow-glow">{myLeague.weekly_xp.toLocaleString()}</span>
            </div>
          </motion.div>
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

        <div className="bg-black/20 backdrop-blur-md rounded-[2.5rem] p-3 border border-white/5 relative z-10">
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
              <Trophy className="w-4 h-4" /> Global Operatives
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Live Feed</span>
            </div>
          </div>
          
          <ScrollArea className="h-[280px] px-3">
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
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                      isCurrentUser ? 'bg-primary/25 ring-2 ring-primary/50 shadow-glow mx-1' : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black italic tracking-tighter shadow-lg ${
                      getPositionStyle(position)
                    }`}>
                      {position}
                    </div>
                    <Avatar className="h-11 w-11 border-2 border-white/10 shadow-2xl ring-2 ring-black/20">
                      <AvatarImage src={typedUser.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted/50 text-xs font-black">
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
      </CardContent>
      
      <div className="p-4 bg-white/5 border-t border-white/5 text-center">
        <div className="text-[10px] font-black text-primary/40 tracking-[0.4em] uppercase">
          Victory is the only acceptable outcome
        </div>
      </div>
    </Card>
  );
});
