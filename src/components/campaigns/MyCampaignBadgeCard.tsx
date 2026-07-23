import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Target } from "lucide-react";
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
      if (!user?.id) return { completed: 0, totalXp: 0, totalCoins: 0 };
      const { data, error } = await supabase
        .from("campaign_participants")
        .select("xp_earned, coins_earned, completed_at")
        .eq("user_id", user.id)
        .not("completed_at", "is", null);
      if (error) throw error;
      const rows = data ?? [];
      return {
        completed: rows.length,
        totalXp: rows.reduce((s, r) => s + (r.xp_earned ?? 0), 0),
        totalCoins: rows.reduce((s, r) => s + (r.coins_earned ?? 0), 0),
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (!data) return null;

  const hasBadge = data.completed > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-5 flex items-center gap-4",
        hasBadge
          ? "border-yellow-400/40 bg-gradient-to-r from-yellow-400/10 via-amber-500/5 to-transparent"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
          hasBadge
            ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-950 shadow-lg shadow-yellow-500/30"
            : "bg-muted text-muted-foreground",
        )}
      >
        {hasBadge ? <Trophy className="w-7 h-7" /> : <Target className="w-7 h-7" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-base font-bold">
            {hasBadge ? "Meta batida" : "Metas de campanha"}
          </h3>
          {hasBadge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600 dark:text-yellow-400">
              {data.completed}× conquistada{data.completed > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {hasBadge
            ? `+${data.totalXp.toLocaleString("pt-BR")} XP e +${data.totalCoins.toLocaleString("pt-BR")} moedas em recompensas.`
            : "Aceite e conclua uma campanha para desbloquear seu primeiro selo."}
        </p>
      </div>
    </motion.div>
  );
}