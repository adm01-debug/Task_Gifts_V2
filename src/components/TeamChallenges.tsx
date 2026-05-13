import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback, memo } from "react";
import { Users, Clock, Zap, ChevronRight, Flame, Swords, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useActiveDuels } from "@/hooks/useDuels";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonDuelList } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { differenceInHours, differenceInMinutes } from "date-fns";

 const TeamChallengesComponent = () => {
 export const TeamChallengesLazy = memo(TeamChallengesComponent);
 export const TeamChallenges = TeamChallengesLazy;
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: duels = [], isLoading } = useActiveDuels();

  // Filter for active challenges (both weekly and direct duels)
  const activeChallenges = useMemo(() => duels.filter(d => d.status === "active"), [duels]);

  const goToDuels = useCallback(() => navigate("/duelos"), [navigate]);
  const formatTimeLeft = useCallback((endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const hoursLeft = differenceInHours(end, now);
    const minutesLeft = differenceInMinutes(end, now) % 60;
    
    if (hoursLeft > 24) {
      const days = Math.floor(hoursLeft / 24);
      return `${days}d ${hoursLeft % 24}h`;
    }
    return `${hoursLeft}h ${minutesLeft}m`;
  }, []);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border overflow-hidden card-shimmer"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
              <Swords className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold">Desafios Ativos</h3>
              <p className="text-xs text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
        <SkeletonDuelList items={2} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 border border-border transition-all duration-300"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
            <Swords className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <h3 className="font-bold">Desafios Ativos</h3>
            <p className="text-xs text-muted-foreground">
              {activeChallenges.length} duelo{activeChallenges.length !== 1 ? "s" : ""} em andamento
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          <Flame className="w-5 h-5 text-streak streak-fire" />
        </motion.div>
      </div>

      {/* Challenges */}
      <div className="divide-y divide-border">
        {activeChallenges.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Nenhum desafio ativo no momento</p>
            <Button
              variant="outline"
              size="sm"
              onClick={goToDuels}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Desafiar alguém
            </Button>
          </div>
        ) : (
          activeChallenges.slice(0, 3).map((duel, i) => {
            const isChallenger = user?.id === duel.challenger_id;
            const myXp = isChallenger ? duel.challenger_xp_gained : duel.opponent_xp_gained;
            const opponentXp = isChallenger ? duel.opponent_xp_gained : duel.challenger_xp_gained;
            const myProfile = isChallenger ? duel.challenger : duel.opponent;
            const opponentProfile = isChallenger ? duel.opponent : duel.challenger;
            
            const totalTarget = 100; // Visual target for progress bar
            const myPercent = Math.min((myXp / totalTarget) * 100, 100);
            const opponentPercent = Math.min((opponentXp / totalTarget) * 100, 100);

            const isWinning = myXp > opponentXp;

            return (
              <motion.div
                key={duel.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onMouseEnter={() => setActiveChallenge(duel.id)}
                onMouseLeave={() => setActiveChallenge(null)}
                onClick={() => navigate("/duelos")}
                className="p-4 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                {/* Title Row */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">Duelo Direto</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/20 text-destructive">
                        AO VIVO
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quem ganha mais XP vence!
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* VS Battle */}
                <div className="relative mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        isWinning ? "bg-success/20 text-success ring-2 ring-success" : "bg-primary/20 text-primary"
                      )}>
                        {myProfile?.display_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{myProfile?.display_name || "Você"}</p>
                        <p className="text-xs text-muted-foreground">+{myXp} XP</p>
                      </div>
                    </div>

                    <motion.div
                      animate={activeChallenge === duel.id ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5 }}
                      className="text-lg font-bold text-muted-foreground"
                    >
                      VS
                    </motion.div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="font-semibold text-sm">{opponentProfile?.display_name || "Oponente"}</p>
                        <p className="text-xs text-muted-foreground">+{opponentXp} XP</p>
                      </div>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        !isWinning && myXp !== opponentXp ? "bg-success/20 text-success ring-2 ring-success" : "bg-accent/20 text-accent"
                      )}>
                        {opponentProfile?.display_name?.charAt(0) || "?"}
                      </div>
                    </div>
                  </div>

                  {/* Progress Battle Bar */}
                  <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${myPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.2 }}
                      className="h-full bg-gradient-to-r from-primary to-primary/70"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${opponentPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.2 }}
                      className="h-full bg-gradient-to-l from-accent to-accent/70"
                    />
                  </div>
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{duel.ends_at ? formatTimeLeft(duel.ends_at) : "Em andamento"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-xp" />
                    <span className="font-semibold text-xp">+{duel.xp_reward} XP</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* View All / Create CTA */}
      <div className="p-4 border-t border-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={goToDuels}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-secondary to-accent text-secondary-foreground font-semibold text-sm transition-all duration-200 hover:opacity-90"
        >
          {activeChallenges.length > 0 ? "Ver todos os desafios" : "Criar novo desafio"}
        </motion.button>
      </div>
    </motion.div>
  );
};
