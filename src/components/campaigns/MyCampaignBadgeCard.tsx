import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Compact card exibindo quantas metas de campanhas o usuário concluiu.
 * Mostra "Meta batida" com badge dourado quando >= 1.
 */
export function MyCampaignBadgeCard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-campaign-metas", user?.id],
    queryFn: async () => {
      if (!user?.id) return { completed: 0, totalXp: 0, totalCoins: 0, championships: 0 };
      const { data, error } = await supabase
        .from("campaign_participants")
        .select("xp_earned, coins_earned, completed_at, rank_position")
        .eq("user_id", user.id)
        .not("completed_at", "is", null);
      if (error) throw error;
      const rows = data ?? [];
      return {
        completed: rows.length,
        totalXp: rows.reduce((s, r) => s + (r.xp_earned ?? 0), 0),
        totalCoins: rows.reduce((s, r) => s + (r.coins_earned ?? 0), 0),
        championships: rows.filter((r) => r.rank_position === 1).length,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (!data) return null;

  const hasBadge = data.completed > 0;
  const isChampion = (data.championships ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-5 flex items-center gap-4",
        isChampion
          ? "border-yellow-500/60 bg-gradient-to-r from-yellow-400/20 via-amber-500/10 to-orange-500/10 shadow-lg shadow-yellow-500/20"
          : hasBadge
          ? "border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 via-amber-500/5 to-transparent"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative",
          isChampion
            ? "bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 text-yellow-950 shadow-xl shadow-yellow-500/50"
            : hasBadge
            ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950 shadow-lg shadow-yellow-500/30"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isChampion ? <Crown className="w-7 h-7" /> : hasBadge ? <Trophy className="w-7 h-7" /> : <Target className="w-7 h-7" />}
        {isChampion && (
          <motion.span
            aria-hidden
            initial={{ scale: 0.6, opacity: 0.4 }}
            animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl ring-2 ring-yellow-300/70"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-base font-bold">
            {isChampion ? "🥇 Campeão de Campanhas" : hasBadge ? "Meta batida" : "Metas de campanha"}
          </h3>
          {isChampion && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-950">
              {data.championships}× 1º lugar
            </span>
          )}
          {hasBadge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600 dark:text-yellow-400">
              {data.completed}× conquistada{data.completed > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isChampion
            ? `Você liderou ${data.championships} campanha${data.championships > 1 ? "s" : ""}. +${data.totalXp.toLocaleString("pt-BR")} XP e +${data.totalCoins.toLocaleString("pt-BR")} moedas conquistadas.`
            : hasBadge
            ? `+${data.totalXp.toLocaleString("pt-BR")} XP e +${data.totalCoins.toLocaleString("pt-BR")} moedas em recompensas.`
            : "Aceite e conclua uma campanha para desbloquear seu primeiro selo."}
        </p>
      </div>
    </motion.div>
  );
}