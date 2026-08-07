import { useState, useEffect, useMemo, forwardRef } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, Percent, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActivePromotions } from "@/hooks/useShop";
import { shopService, type ShopPromotion } from "@/services/shopService";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDate: string): TimeLeft {
  const difference = new Date(endDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const isUrgent = useMemo(() => 
    timeLeft.days === 0 && timeLeft.hours < 6, 
    [timeLeft.days, timeLeft.hours]
  );

  return (
    <div className={`flex items-center gap-1 text-sm font-mono ${isUrgent ? "text-red-500" : "text-muted-foreground"}`}>
      <Clock className={`w-4 h-4 ${isUrgent ? "animate-pulse" : ""}`} />
      {timeLeft.days > 0 && (
        <span className="font-bold">{timeLeft.days}d</span>
      )}
      <span className="font-bold">
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

interface PromotionCardProps {
  promotion: ShopPromotion;
  onPurchase: (rewardId: string, discountedPrice: number) => void;
}

const PromotionCard = forwardRef<HTMLDivElement, PromotionCardProps>(
  function PromotionCard({ promotion, onPurchase }, ref) {
  if (!promotion.reward) return null;

  const originalPrice = promotion.reward.price_coins;
  const discountedPrice = shopService.getDiscountedPrice(
    originalPrice,
    promotion.discount_percent,
    promotion.discount_coins
  );
  const savings = originalPrice - discountedPrice;
  const rarityConfig = shopService.getRarityConfig(promotion.reward.rarity);
  const categoryConfig = shopService.getCategoryConfig(promotion.reward.category);

  const isLimitedQuantity = promotion.max_claims !== null;
  const remaining = isLimitedQuantity
    ? promotion.max_claims! - promotion.current_claims
    : null;
  const isSoldOut = remaining !== null && remaining <= 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <Card className="overflow-hidden border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-500/10">
        {/* Flash sale banner */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm">{promotion.title}</span>
          </div>
          <CountdownTimer endDate={promotion.ends_at} />
        </div>

        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Product icon */}
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 ${
                promotion.reward.rarity === "legendary"
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : promotion.reward.rarity === "epic"
                  ? "bg-gradient-to-br from-purple-400 to-pink-500"
                  : promotion.reward.rarity === "rare"
                  ? "bg-gradient-to-br from-blue-400 to-cyan-500"
                  : "bg-muted"
              }`}
            >
              {categoryConfig.icon}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold truncate">{promotion.reward.name}</h3>
                <Badge
                  className={`${rarityConfig.color} text-white text-xs shrink-0`}
                >
                  {rarityConfig.label}
                </Badge>
              </div>

              {promotion.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {promotion.description}
                </p>
              )}

              {/* Price */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-sm">
                    🪙 {originalPrice}
                  </span>
                  <span className="text-xl font-bold text-orange-500">
                    🪙 {discountedPrice}
                  </span>
                </div>
                {promotion.discount_percent && (
                  <Badge className="bg-red-500 text-white">
                    <Percent className="w-3 h-3 mr-1" />
                    -{promotion.discount_percent}%
                  </Badge>
                )}
                {savings > 0 && (
                  <span className="text-sm text-green-500 font-medium">
                    Economize {savings}!
                  </span>
                )}
              </div>

              {/* Limited quantity indicator */}
              {isLimitedQuantity && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, (promotion.current_claims / promotion.max_claims!) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {remaining} restantes
                  </span>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="shrink-0 flex items-center">
              <Button
                onClick={() => onPurchase(promotion.reward_id, discountedPrice)}
                disabled={isSoldOut}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Zap className="w-4 h-4 mr-1" />
                {isSoldOut ? "Esgotado" : "Resgatar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

interface FlashSalesBannerProps {
  onPurchase: (rewardId: string) => void;
}

export function FlashSalesBanner({ onPurchase }: FlashSalesBannerProps) {
  const { data: promotions, isLoading } = useActivePromotions();

  if (isLoading || !promotions || promotions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold">Ofertas Relâmpago</h2>
        <Badge variant="destructive" className="animate-pulse">
          Por tempo limitado!
        </Badge>
      </div>

      <div className="space-y-3">
        {promotions.map((promo) => (
          <PromotionCard
            key={promo.id}
            promotion={promo}
            onPurchase={onPurchase}
          />
        ))}
      </div>
    </div>
  );
}
