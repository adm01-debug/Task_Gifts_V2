import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, Sparkles, Frame, Crown, Wand2, Shield,
  Lock, Check, Coins, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  useAvatarItems, 
  useAvatarConfig, 
  useUnlockItem, 
  usePurchaseItem,
  useUpdateAvatarConfig 
} from "@/hooks/useAvatar";
import { AvatarCategory, AvatarItemWithOwnership, AvatarRarity } from "@/services/avatarService";
import { cn } from "@/lib/utils";

interface AvatarCustomizerProps {
  userId: string;
  userLevel: number;
  userStreak: number;
  userCoins: number;
  displayName: string;
  open: boolean;
  onClose: () => void;
}

const categoryConfig: Record<AvatarCategory, { label: string; icon: React.ElementType }> = {
  background: { label: "Fundo", icon: Palette },
  frame: { label: "Moldura", icon: Frame },
  accessory: { label: "Acessório", icon: Crown },
  effect: { label: "Efeito", icon: Sparkles },
  badge_style: { label: "Badge", icon: Shield },
};

const rarityColors: Record<AvatarRarity, string> = {
  common: "border-muted-foreground/30 bg-muted/20",
  rare: "border-secondary/50 bg-secondary/10",
  epic: "border-accent/50 bg-accent/10",
  legendary: "border-gold/50 bg-gold/10 shadow-[0_0_15px_hsl(var(--gold)/0.2)]",
};

const rarityLabels: Record<AvatarRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export function AvatarCustomizer({
  userId,
  userLevel,
  userStreak,
  userCoins,
  displayName,
  open,
  onClose,
}: AvatarCustomizerProps) {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>("background");

  const { data: items, isLoading } = useAvatarItems(userId, userLevel, userStreak);
  const { data: config } = useAvatarConfig(userId);

  const unlockItem = useUnlockItem();
  const purchaseItem = usePurchaseItem();
  const updateConfig = useUpdateAvatarConfig();

  const categoryItems = useMemo(() => items?.filter(i => i.category === activeCategory) || [], [items, activeCategory]);

  const getSelectedItemId = useCallback((category: AvatarCategory): string | null => {
    if (!config) return null;
    switch (category) {
      case 'background': return config.selected_background;
      case 'frame': return config.selected_frame;
      case 'accessory': return config.selected_accessory;
      case 'effect': return config.selected_effect;
      case 'badge_style': return config.selected_badge_style;
    }
  }, [config]);

  const { selectedBackground, selectedFrame, selectedAccessory, selectedEffect } = useMemo(() => ({
    selectedBackground: items?.find(i => i.id === config?.selected_background),
    selectedFrame: items?.find(i => i.id === config?.selected_frame),
    selectedAccessory: items?.find(i => i.id === config?.selected_accessory),
    selectedEffect: items?.find(i => i.id === config?.selected_effect),
  }), [items, config]);

  const handleItemClick = useCallback((item: AvatarItemWithOwnership) => {
    if (item.owned) {
      // Equip/unequip
      const currentSelected = getSelectedItemId(item.category);
      updateConfig.mutate({
        userId,
        category: item.category,
        itemId: currentSelected === item.id ? null : item.id,
      });
    } else if (item.canUnlock) {
      if (item.unlock_type === 'purchase' && item.price_coins) {
        if (userCoins >= item.price_coins) {
          purchaseItem.mutate({ userId, itemId: item.id, price: item.price_coins });
        }
      } else {
        unlockItem.mutate({ userId, itemId: item.id });
      }
    }
  }, [getSelectedItemId, updateConfig, unlockItem, purchaseItem, userId, userCoins]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-secondary" />
            Personalizar Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
          {/* Preview */}
          <div className="md:w-1/3 flex flex-col items-center">
            <div className="relative">
              {/* Background */}
              <motion.div
                key={selectedBackground?.id || 'default'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-32 h-32 rounded-2xl flex items-center justify-center"
                style={{
                  background: selectedBackground?.preview_color 
                    ? `linear-gradient(135deg, ${selectedBackground.preview_color}, ${selectedBackground.preview_color}88)`
                    : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                }}
              >
                {/* Frame */}
                <div 
                  className={cn(
                    "w-28 h-28 rounded-xl flex items-center justify-center text-4xl font-bold relative",
                    selectedFrame?.preview_color && "ring-4",
                  )}
                  style={{
                    '--tw-ring-color': selectedFrame?.preview_color || 'transparent',
                    boxShadow: selectedFrame?.rarity === 'legendary' 
                      ? `0 0 20px ${selectedFrame.preview_color}` 
                      : undefined,
                  } as React.CSSProperties & { '--tw-ring-color': string }}
                >
                  {displayName.charAt(0).toUpperCase()}

                  {/* Accessory */}
                  {selectedAccessory && selectedAccessory.icon !== '➖' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-3 -right-1 text-2xl"
                    >
                      {selectedAccessory.icon}
                    </motion.span>
                  )}
                </div>
              </motion.div>

              {/* Effect */}
              {selectedEffect && selectedEffect.icon !== '➖' && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -bottom-2 -right-2 text-2xl"
                >
                  {selectedEffect.icon}
                </motion.div>
              )}
            </div>

            <p className="mt-4 font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">Nível {userLevel}</p>

            <div className="flex items-center gap-2 mt-2 text-sm">
              <Coins className="w-4 h-4 text-gold" />
              <span className="font-semibold">{userCoins.toLocaleString()}</span>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AvatarCategory)}>
              <TabsList className="w-full grid grid-cols-5 mb-4">
                {(Object.keys(categoryConfig) as AvatarCategory[]).map(cat => {
                  const Icon = categoryConfig[cat].icon;
                  return (
                    <TabsTrigger key={cat} value={cat} className="flex-col gap-1 py-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs hidden md:block">{categoryConfig[cat].label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {(Object.keys(categoryConfig) as AvatarCategory[]).map(cat => (
                <TabsContent key={cat} value={cat} className="flex-1 overflow-y-auto max-h-[300px]">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {categoryItems.map(item => {
                        const isSelected = getSelectedItemId(item.category) === item.id;
                        const canAfford = item.unlock_type !== 'purchase' || 
                          (item.price_coins && userCoins >= item.price_coins);

                        return (
                          <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleItemClick(item)}
                            disabled={!item.owned && !item.canUnlock}
                            className={cn(
                              "relative p-3 rounded-xl border-2 transition-all text-center",
                              rarityColors[item.rarity],
                              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                              !item.owned && !item.canUnlock && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            {/* Icon */}
                            <span className="text-2xl block mb-1">{item.icon}</span>
                            
                            {/* Name */}
                            <p className="text-xs font-medium truncate">{item.name}</p>

                            {/* Rarity */}
                            <p className={cn(
                              "text-[10px] mt-1",
                              item.rarity === 'common' && "text-muted-foreground",
                              item.rarity === 'rare' && "text-secondary",
                              item.rarity === 'epic' && "text-accent",
                              item.rarity === 'legendary' && "text-gold",
                            )}>
                              {rarityLabels[item.rarity]}
                            </p>

                            {/* Status overlay */}
                            {item.owned ? (
                              isSelected && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                </div>
                              )
                            ) : item.canUnlock ? (
                              <div className="absolute top-1 right-1">
                                {item.unlock_type === 'purchase' ? (
                                  <div className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                                    canAfford ? "bg-gold/20 text-gold" : "bg-destructive/20 text-destructive"
                                  )}>
                                    <Coins className="w-3 h-3" />
                                    {item.price_coins}
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                                    <ChevronRight className="w-3 h-3 text-success-foreground" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="absolute inset-0 rounded-xl bg-background/60 flex items-center justify-center">
                                <div className="text-center">
                                  <Lock className="w-4 h-4 mx-auto text-muted-foreground" />
                                  <p className="text-[9px] text-muted-foreground mt-1 px-1">
                                    {item.unlockReason}
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Salvar e Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
