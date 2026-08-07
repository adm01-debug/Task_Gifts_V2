import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAvatarConfig, useAvatarItems } from "@/hooks/useAvatar";
import { Sparkles, Lock } from "lucide-react";

interface AvatarPreviewProps {
  userId: string;
  userLevel: number;
  userStreak: number;
  displayName: string;
  size?: "sm" | "md" | "lg" | "xl";
  showEffects?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  sm: { container: "w-12 h-12", inner: "w-10 h-10", text: "text-lg", accessory: "text-sm", effect: "text-xs" },
  md: { container: "w-20 h-20", inner: "w-16 h-16", text: "text-2xl", accessory: "text-lg", effect: "text-sm" },
  lg: { container: "w-28 h-28", inner: "w-24 h-24", text: "text-3xl", accessory: "text-xl", effect: "text-base" },
  xl: { container: "w-36 h-36", inner: "w-32 h-32", text: "text-4xl", accessory: "text-2xl", effect: "text-lg" },
};

interface EffectAnimation {
  animate: Record<string, number | number[]>;
  transition: { duration: number; repeat: number };
}

const effectAnimations: Record<string, EffectAnimation> = {
  "✨": { animate: { scale: [1, 1.3, 1], rotate: [0, 180, 360] }, transition: { duration: 2, repeat: Infinity } },
  "⭐": { animate: { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }, transition: { duration: 1.5, repeat: Infinity } },
  "🌈": { animate: { y: [-5, 5, -5], rotate: [-5, 5, -5] }, transition: { duration: 2, repeat: Infinity } },
  "💕": { animate: { scale: [1, 1.2, 1], y: [0, -10, 0] }, transition: { duration: 1.5, repeat: Infinity } },
  "❄️": { animate: { rotate: [0, 360], y: [0, 5, 0] }, transition: { duration: 3, repeat: Infinity } },
  "🫧": { animate: { y: [0, -15, 0], scale: [1, 1.2, 1] }, transition: { duration: 2.5, repeat: Infinity } },
  "🎵": { animate: { x: [-3, 3, -3], rotate: [-10, 10, -10] }, transition: { duration: 1.2, repeat: Infinity } },
  "⚡": { animate: { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }, transition: { duration: 0.5, repeat: Infinity } },
  "🔥": { animate: { y: [0, -5, 0], scale: [1, 1.1, 1] }, transition: { duration: 0.8, repeat: Infinity } },
  "🌺": { animate: { rotate: [0, 10, -10, 0], y: [0, -3, 0] }, transition: { duration: 2, repeat: Infinity } },
  "🌌": { animate: { rotate: [0, 360], scale: [1, 1.1, 1] }, transition: { duration: 4, repeat: Infinity } },
  "🐲": { animate: { x: [0, 5, 0], scale: [1, 1.2, 1] }, transition: { duration: 1.5, repeat: Infinity } },
};

export function AvatarPreview({
  userId,
  userLevel,
  userStreak,
  displayName,
  size = "lg",
  showEffects = true,
  className,
  onClick,
}: AvatarPreviewProps) {
  const { data: items } = useAvatarItems(userId, userLevel, userStreak);
  const { data: config } = useAvatarConfig(userId);

  const selectedBackground = items?.find(i => i.id === config?.selected_background);
  const selectedFrame = items?.find(i => i.id === config?.selected_frame);
  const selectedAccessory = items?.find(i => i.id === config?.selected_accessory);
  const selectedEffect = items?.find(i => i.id === config?.selected_effect);
  const selectedBadgeStyle = items?.find(i => i.id === config?.selected_badge_style);

  const sizeStyles = sizeConfig[size];
  const effectAnim = selectedEffect?.icon ? effectAnimations[selectedEffect.icon] : null;

  const getFrameStyles = () => {
    if (!selectedFrame || selectedFrame.icon === '⭕') return {};

    const frameStyles: React.CSSProperties = {};

    if (selectedFrame.preview_color) {
      frameStyles.boxShadow = `0 0 0 3px ${selectedFrame.preview_color}, 0 0 15px ${selectedFrame.preview_color}50`;
    }

    if (selectedFrame.rarity === 'legendary') {
      frameStyles.boxShadow = `0 0 0 4px ${selectedFrame.preview_color || 'hsl(var(--gold))'}, 0 0 25px ${selectedFrame.preview_color || 'hsl(var(--gold))'}80`;
    }

    return frameStyles;
  };

  return (
    <motion.div
      className={cn("relative group cursor-pointer", className)}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {/* Background layer */}
      <motion.div
        className={cn(
          "rounded-full flex items-center justify-center overflow-hidden",
          sizeStyles.container
        )}
        style={{
          background: selectedBackground?.preview_color
            ? `linear-gradient(135deg, ${selectedBackground.preview_color}, ${selectedBackground.preview_color}88)`
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Frame layer */}
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold transition-all duration-300",
            sizeStyles.inner,
            sizeStyles.text
          )}
          style={getFrameStyles()}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      </motion.div>

      {/* Accessory */}
      <AnimatePresence>
        {selectedAccessory && selectedAccessory.icon !== '➖' && (
          <motion.span
            key={selectedAccessory.id}
            initial={{ scale: 0, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: 10, opacity: 0 }}
            className={cn(
              "absolute -top-1 -right-1 drop-shadow-lg",
              sizeStyles.accessory
            )}
          >
            {selectedAccessory.icon}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Effect */}
      <AnimatePresence>
        {showEffects && selectedEffect && selectedEffect.icon !== '➖' && (
          <motion.div
            key={selectedEffect.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={effectAnim?.animate as { scale?: number[]; rotate?: number[]; y?: number[]; x?: number[]; opacity?: number[] } || { scale: [1, 1.2, 1] }}
            transition={effectAnim?.transition as { duration: number; repeat: number } || { duration: 2, repeat: Infinity }}
            className={cn(
              "absolute -bottom-1 -right-1 drop-shadow-lg",
              sizeStyles.effect
            )}
          >
            {selectedEffect.icon}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Badge with style */}
      <div
        className={cn(
          "absolute -bottom-1 -left-1 rounded-full bg-card border-2 border-background flex items-center justify-center",
          size === "sm" && "w-5 h-5",
          size === "md" && "w-6 h-6",
          size === "lg" && "w-8 h-8",
          size === "xl" && "w-10 h-10"
        )}
        style={{
          background: selectedBadgeStyle?.preview_color 
            ? `linear-gradient(135deg, ${selectedBadgeStyle.preview_color}, ${selectedBadgeStyle.preview_color}88)`
            : undefined,
        }}
      >
        <span className={cn(
          "font-bold text-primary",
          size === "sm" && "text-[10px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm",
          size === "xl" && "text-base"
        )}>
          {userLevel}
        </span>
      </div>

      {/* Hover overlay */}
      {onClick && (
        <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Sparkles className={cn(
            "text-primary",
            size === "sm" && "w-4 h-4",
            size === "md" && "w-5 h-5",
            size === "lg" && "w-6 h-6",
            size === "xl" && "w-8 h-8"
          )} />
        </div>
      )}
    </motion.div>
  );
}

// Compact collection preview component
interface AvatarCollectionPreviewProps {
  userId: string;
  userLevel: number;
  userStreak: number;
  category: string;
  onClick?: () => void;
}

export function AvatarCollectionPreview({
  userId,
  userLevel,
  userStreak,
  category,
  onClick,
}: AvatarCollectionPreviewProps) {
  const { data: items, isLoading } = useAvatarItems(userId, userLevel, userStreak);

  const categoryItems = items?.filter(i => i.category === category) || [];
  const ownedItems = categoryItems.filter(i => i.owned);
  const totalItems = categoryItems.length;
  const unlockedPercent = totalItems > 0 ? Math.round((ownedItems.length / totalItems) * 100) : 0;

  // Show up to 5 items preview
  const previewItems = categoryItems.slice(0, 5);

  if (isLoading) {
    return (
      <div className="h-16 rounded-xl bg-muted/50 animate-pulse" />
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium capitalize">{category.replace('_', ' ')}</span>
        <span className="text-xs text-muted-foreground">{ownedItems.length}/{totalItems}</span>
      </div>

      <div className="flex items-center gap-1">
        {previewItems.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all",
              item.owned 
                ? "bg-muted/50 border-border" 
                : "bg-muted/20 border-border/50 opacity-50 grayscale",
              item.rarity === 'rare' && item.owned && "border-secondary/50",
              item.rarity === 'epic' && item.owned && "border-accent/50",
              item.rarity === 'legendary' && item.owned && "border-gold/50 shadow-sm",
            )}
          >
            {item.owned ? item.icon : <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
        {categoryItems.length > 5 && (
          <div className="w-8 h-8 rounded-lg bg-muted/30 border border-border flex items-center justify-center text-xs text-muted-foreground">
            +{categoryItems.length - 5}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${unlockedPercent}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={cn(
            "h-full rounded-full",
            unlockedPercent === 100 ? "bg-success" : "bg-primary"
          )}
        />
      </div>
    </motion.button>
  );
}