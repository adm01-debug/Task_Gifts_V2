import { motion } from "framer-motion";
import { Gift, Star, Lock, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShopRewards } from "@/hooks/useShop";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { Skeleton, SkeletonRewardGrid } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "react-router-dom";
import { useMemo, useCallback } from "react";

const rarityConfig = {
  common: {
    border: "border-muted-foreground/30",
    bg: "from-muted/30 to-transparent",
    badge: "bg-muted text-muted-foreground",
    label: "Comum",
    glow: "",
  },
  rare: {
    border: "border-secondary/50",
    bg: "from-secondary/20 to-transparent",
    badge: "bg-secondary/20 text-secondary",
    label: "Raro",
    glow: "",
  },
  epic: {
    border: "border-accent/50",
    bg: "from-accent/20 to-transparent",
    badge: "bg-accent/20 text-accent",
    label: "Épico",
    glow: "",
  },
  legendary: {
    border: "border-gold/50",
    bg: "from-gold/20 to-transparent",
    badge: "bg-gold/20 text-gold",
    label: "Lendário",
    glow: "shadow-[0_0_30px_hsl(var(--gold)/0.3)]",
  },
};

// Category emojis
const categoryEmojis: Record<string, string> = {
  benefit: "🎁",
  product: "📦",
  experience: "✨",
};

export const RewardsShop = () => {
  const navigate = useNavigate();
  const { data: rewards = [], isLoading: rewardsLoading } = useShopRewards();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();

  const userCoins = profile?.coins || 0;
  const isLoading = rewardsLoading || profileLoading;

  // Memoize preview rewards
  const previewRewards = useMemo(() => rewards.slice(0, 4), [rewards]);

  // Memoized navigation handler
  const goToShop = useCallback(() => navigate("/loja"), [navigate]);

  if (isLoading) {
    return (
      <div className="bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent animate-pulse pointer-events-none" />
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <Skeleton variant="glow" shape="card" className="w-12 h-12 rounded-2xl ring-1 ring-white/10" />
            <div className="space-y-2">
              <Skeleton variant="shimmer" className="h-4 w-32 rounded-lg" />
              <Skeleton variant="shimmer" className="h-2.5 w-24 opacity-40 rounded-full" />
            </div>
          </div>
          <Skeleton variant="shimmer" className="h-9 w-24 rounded-full bg-black/40 border border-white/5" />
        </div>
        <div className="p-6 grid grid-cols-2 gap-4 relative z-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-white/5 bg-white/5 space-y-3">
              <div className="flex justify-between items-start">
                <Skeleton variant="shimmer" shape="pill" className="h-4 w-12 rounded-lg" />
                <Skeleton variant="glow" className="h-4 w-4 rounded-sm" />
              </div>
              <Skeleton variant="shimmer" className="h-10 w-10 mx-auto rounded-xl bg-black/40" />
              <Skeleton variant="shimmer" className="h-4 w-full rounded-lg" />
              <Skeleton variant="shimmer" className="h-2.5 w-3/4 mx-auto rounded-full opacity-40" />
              <Skeleton variant="shimmer" className="h-8 w-full rounded-xl bg-black/40" />
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-white/5 bg-black/20 relative z-10">
          <Skeleton variant="shimmer" className="h-4 w-1/2 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl overflow-hidden shadow-sm border border-border/60 bg-card/80"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coins/20 to-coins/5 flex items-center justify-center">
            <Gift className="w-4 h-4 text-coins" />
          </div>
          <div>
            <h3 className="font-bold">Recompensas</h3>
            <p className="text-xs text-muted-foreground">Troque suas coins</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-coins/10">
          <Star className="w-4 h-4 text-coins coin-shine" />
          <span className="font-bold text-coins">{userCoins.toLocaleString()}</span>
        </div>
      </div>

      {/* Rewards Grid */}
      {previewRewards.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhuma recompensa disponível"
          description="Volte mais tarde!"
          compact
        />
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
          {previewRewards.map((reward, i) => {
            const config = rarityConfig[reward.rarity as keyof typeof rarityConfig] || rarityConfig.common;
            const canAfford = userCoins >= reward.price_coins;
            const isAvailable = reward.is_active && (reward.stock === null || reward.stock > 0);
            const emoji = categoryEmojis[reward.category] || "🎁";

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={isAvailable && canAfford ? { scale: 1.03, y: -4 } : {}}
                className={cn(
                  "relative p-3 rounded-xl border transition-all duration-200",
                  config.border,
                  reward.rarity === "legendary" && config.glow,
                  !isAvailable && "opacity-60"
                )}
              >
                {/* Background gradient */}
                <div className={cn(
                  "absolute inset-0 rounded-xl bg-gradient-to-b opacity-50",
                  config.bg
                )} />

                <div className="relative z-10">
                  {/* Rarity badge */}
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold",
                      config.badge
                    )}>
                      {config.label}
                    </span>
                    {reward.rarity === "legendary" && (
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-4 h-4 text-gold" />
                      </motion.div>
                    )}
                  </div>

                  {/* Image/Emoji */}
                  <div className="text-3xl mb-2 text-center">{emoji}</div>

                  {/* Info */}
                  <h4 className="font-semibold text-sm text-center mb-1 line-clamp-1">{reward.name}</h4>
                  <p className="text-[10px] text-muted-foreground text-center mb-2 line-clamp-1">
                    {reward.description || "Recompensa especial"}
                  </p>

                  {/* Price/Action */}
                  {isAvailable ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToShop}
                      className={cn(
                        "w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors",
                        canAfford
                          ? "bg-coins/20 text-coins hover:bg-coins/30"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Star className="w-3 h-3" />
                      {reward.price_coins.toLocaleString()}
                    </motion.button>
                  ) : (
                    <div className="w-full py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      Esgotado
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* View All */}
      <div className="p-4 border-t border-border">
        <motion.button
          whileHover={{ x: 4 }}
          onClick={goToShop}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todas as recompensas
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
