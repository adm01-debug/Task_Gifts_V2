import { motion } from "framer-motion";
import { formatDistanceToNow, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Sparkles, Gift, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useActiveSeasonalEvents } from "@/hooks/useSeasonalEvents";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function SeasonalEventBanner() {
  const { events, isLoading } = useActiveSeasonalEvents();
  const navigate = useNavigate();

  if (isLoading || events.length === 0) return null;

  const event = events[0]; // Show first active event
  const endsAt = new Date(event.ends_at);
  const now = new Date();
  const daysRemaining = differenceInDays(endsAt, now);
  const hoursRemaining = differenceInHours(endsAt, now) % 24;

  const timeText = daysRemaining > 0 
    ? `${daysRemaining}d ${hoursRemaining}h restantes`
    : `${hoursRemaining}h restantes`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card
        className="overflow-hidden cursor-pointer group relative border-none shadow-2xl"
        onClick={() => navigate(`/eventos/${event.id}`)}
      >
        <div 
          className="absolute inset-0 opacity-100 transition-transform duration-700 group-hover:scale-110"
          style={{ 
            background: `radial-gradient(circle at 20% 50%, ${event.banner_color}40, transparent), linear-gradient(135deg, ${event.banner_color}10, transparent)`,
          }}
        />
        <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />
        <div 
          className="absolute top-0 left-0 right-0 h-[2px]" 
          style={{ background: `linear-gradient(90deg, transparent, ${event.banner_color}, transparent)` }}
        />
        
        <CardContent className="p-5 relative z-10">
          <div className="flex items-center gap-5">
            {/* Icon */}
            <motion.div
              className="text-5xl drop-shadow-2xl filter saturate-150"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              {event.icon}
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-xl tracking-tight truncate uppercase italic">{event.title}</h3>
                <motion.div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-lg"
                  style={{ 
                    backgroundColor: event.banner_color,
                    color: '#fff',
                    boxShadow: `0 0 20px ${event.banner_color}40`
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {event.xp_multiplier}x XP BOOST
                </motion.div>
              </div>
              <p className="text-sm text-muted-foreground font-medium line-clamp-1 opacity-90">
                {event.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-foreground/5 text-[11px] font-bold text-muted-foreground border border-border/40">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{timeText}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: event.banner_color }}>
                  <Gift className="h-3.5 w-3.5" />
                  <span>DROP LENDÁRIO DISPONÍVEL</span>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <motion.div
              className="text-muted-foreground group-hover:text-foreground transition-colors"
              whileHover={{ x: 5 }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
