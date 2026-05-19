import { motion } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import { Wand2, Sparkles, Lock, ChevronRight, Crown, Palette, Frame, Target } from "lucide-react";
import { AvatarPreview, AvatarCollectionPreview } from "./AvatarPreview";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { useAvatarItems } from "@/hooks/useAvatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
interface ProfileAvatarSectionProps {
  userId: string;
  userLevel: number;
  userStreak: number;
  userCoins: number;
  displayName: string;
}

const categories = [
  { key: "background", label: "Fundos", icon: Palette },
  { key: "frame", label: "Molduras", icon: Frame },
  { key: "accessory", label: "Acessórios", icon: Crown },
  { key: "effect", label: "Efeitos", icon: Sparkles },
  { key: "badge_style", label: "Badges", icon: Wand2 },
];

export function ProfileAvatarSection({
  userId,
  userLevel,
  userStreak,
  userCoins,
  displayName,
}: ProfileAvatarSectionProps) {
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const { data: items } = useAvatarItems(userId, userLevel, userStreak);

  const openCustomizer = useCallback(() => setCustomizerOpen(true), []);
  const closeCustomizer = useCallback(() => setCustomizerOpen(false), []);

  // Calculate collection stats
  const { totalItems, ownedItems, collectionPercent, legendaryOwned, epicOwned, nextUnlocks } = useMemo(() => {
    const total = items?.length || 0;
    const owned = items?.filter(i => i.owned)?.length || 0;
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;
    const legendary = items?.filter(i => i.owned && i.rarity === 'legendary')?.length || 0;
    const epic = items?.filter(i => i.owned && i.rarity === 'epic')?.length || 0;
    const unlocks = items?.filter(i => !i.owned && i.canUnlock)?.slice(0, 4) || [];
    return { totalItems: total, ownedItems: owned, collectionPercent: percent, legendaryOwned: legendary, epicOwned: epic, nextUnlocks: unlocks };
  }, [items]);

  if (!items) {
    return (
      <div className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl group">
        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex flex-col space-y-2">
              <Skeleton variant="shimmer" className="h-8 w-48 rounded-xl" />
              <Skeleton variant="shimmer" className="h-3 w-64 opacity-50" />
            </div>
            <Skeleton variant="glow" className="h-12 w-44 rounded-2xl" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <Skeleton variant="glow" shape="circle" className="w-48 h-48 md:w-56 md:h-56 shrink-0" />
            <div className="flex-1 space-y-6 w-full">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <Skeleton variant="shimmer" className="h-3 w-32" />
                    <Skeleton variant="shimmer" className="h-8 w-40" />
                  </div>
                  <Skeleton variant="shimmer" className="h-6 w-24" />
                </div>
                <Skeleton variant="shimmer" className="h-3 w-full rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton variant="shimmer" className="h-20 rounded-2xl" />
                <Skeleton variant="shimmer" className="h-20 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">
          <Skeleton variant="shimmer" className="h-3 w-40 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} variant="shimmer" className="aspect-square rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl group"
    >
      {/* Header with Glassmorphism */}
      <div className="p-8 border-b border-white/5 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] -mr-16 -mt-16 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full blur-[60px] -ml-12 -mb-12" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex flex-col">
            <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                <Wand2 className="w-5 h-5 text-primary" />
              </div>
              Laboratório de Avatar
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">Configuração de Identidade Visual Tática</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(var(--primary), 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={openCustomizer}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all text-xs font-black uppercase tracking-widest group"
          >
            <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
            Customizar Arsenal
          </motion.button>
        </div>

        {/* Main Preview Area */}
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          {/* Large Avatar Preview with Podium */}
          <div className="relative group/avatar">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10">
              <AvatarPreview
                userId={userId}
                userLevel={userLevel}
                userStreak={userStreak}
                displayName={displayName}
                size="xl"
                showEffects={true}
                onClick={openCustomizer}
              />
            </div>

            {/* Holographic Base */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-primary/20 blur-xl rounded-full" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)] rounded-full" />

            {/* Legendary Glow */}
            {legendaryOwned > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 25px rgba(245, 158, 11, 0.2)",
                    "0 0 50px rgba(245, 158, 11, 0.4)",
                    "0 0 25px rgba(245, 158, 11, 0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ pointerEvents: "none" }}
              />
            )}
          </div>

          {/* Collection Mastery Stats */}
          <div className="flex-1 space-y-6 w-full md:w-auto">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Domínio de Coleção</span>
                  <span className="text-2xl font-black italic tracking-tighter text-foreground">{collectionPercent}% Sincronizado</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">{ownedItems}</span>
                  <span className="text-xs font-medium text-muted-foreground/60"> / {totalItems} módulos</span>
                </div>
              </div>
              
              <div className="h-3 rounded-full bg-white/5 border border-white/5 overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${collectionPercent}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className={cn(
                    "h-full rounded-full relative",
                    collectionPercent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-primary via-secondary to-accent"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                  <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent w-[200%] -translate-x-full" />
                </motion.div>
              </div>
            </div>

            {/* Rarity Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors group/card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Lendários</p>
                    <p className="text-lg font-black italic text-amber-500">{legendaryOwned}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors group/card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Épicos</p>
                    <p className="text-lg font-black italic text-purple-500">{epicOwned}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <Lock className="w-3 h-3 text-amber-500/60" />
              <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-tight">
                Complete missões críticas para desbloquear novos módulos táticos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid with Improved Hover Effects */}
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Módulos de Customização</h4>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/40" />)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
              <AvatarCollectionPreview
                userId={userId}
                userLevel={userLevel}
                userStreak={userStreak}
                category={cat.key}
                onClick={openCustomizer}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Unlocks with Modern Cards */}
      <div className="p-8 border-t border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Próximos Alvos de Desbloqueio</h4>
          <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase tracking-widest hover:bg-white/5" onClick={openCustomizer}>
            Ver Roadmap <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items
            ?.filter(i => !i.owned && i.canUnlock)
            ?.slice(0, 4)
            ?.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                onClick={openCustomizer}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group/item",
                  "bg-white/5 border-white/5",
                  item.rarity === 'rare' && "hover:border-blue-500/30",
                  item.rarity === 'epic' && "hover:border-purple-500/30",
                  item.rarity === 'legendary' && "hover:border-amber-500/30",
                )}
              >
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground/40 group-hover/item:text-primary/60 transition-colors" />
                </div>

                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner",
                  item.rarity === 'legendary' ? "bg-amber-500/10" : 
                  item.rarity === 'epic' ? "bg-purple-500/10" : "bg-white/5"
                )}>
                  {item.icon}
                </div>
                
                <div className="text-left">
                  <p className="text-sm font-black italic uppercase tracking-tighter leading-none mb-1 group-hover/item:text-primary transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-tight">
                    {item.unlockReason}
                  </p>
                </div>
              </motion.div>
            ))}

          {(!items || items.filter(i => !i.owned && i.canUnlock).length === 0) && (
            <div className="col-span-full py-4 flex flex-col items-center justify-center text-center opacity-40">
              <Target className="w-6 h-6 mb-2" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Sincronização Máxima Atingida</p>
            </div>
          )}
        </div>
      </div>

      <AvatarCustomizer
        userId={userId}
        userLevel={userLevel}
        userStreak={userStreak}
        userCoins={userCoins}
        displayName={displayName}
        open={customizerOpen}
        onClose={closeCustomizer}
      />
    </motion.div>
  );
}