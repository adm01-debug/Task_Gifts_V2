import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback, memo } from "react";
import { Users, Clock, Zap, ChevronRight, Flame, Swords, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useActiveDuels } from "@/hooks/useDuels";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonDuelList } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInHours, differenceInMinutes } from "date-fns";

const TeamChallengesComponent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: duels = [], isLoading } = useActiveDuels();

  const activeChallenges = useMemo(() => duels.filter(d => d.status === "active"), [duels]);

  if (isLoading) return <SkeletonDuelList items={2} />;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-secondary" />
          <CardTitle className="text-sm">Duelos</CardTitle>
        </div>
         <Button size="icon-xs" variant="ghost" className="h-7 w-auto px-2 text-[10px]" onClick={() => navigate("/duelos")}>Ver Todos</Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[300px]">
        {activeChallenges.length === 0 ? (
          <div className="p-4 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-[10px] text-muted-foreground">Sem duelos ativos</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeChallenges.slice(0, 3).map((duel) => (
              <div key={duel.id} className="p-3 text-[11px] cursor-pointer hover:bg-muted/50" onClick={() => navigate("/duelos")}>
                 <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">Duelo 1v1</span>
                    <span className="text-xp">+{duel.xp_reward}XP</span>
                 </div>
                 <p className="text-muted-foreground truncate">Você vs {duel.opponent?.display_name || "Oponente"}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const TeamChallengesLazy = memo(TeamChallengesComponent);
export const TeamChallenges = TeamChallengesLazy;
