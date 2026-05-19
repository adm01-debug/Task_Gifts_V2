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
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       whileHover={{ scale: 1.01 }}
       className="w-full perspective-1000"
     >
       <Card
         className="overflow-hidden cursor-pointer group relative border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-black/40 rounded-3xl"
         onClick={() => navigate(`/eventos/${event.id}`)}
       >
         {/* Dynamic Pulse Ring */}
         <div 
           className="absolute inset-0 animate-pulse opacity-20 pointer-events-none"
           style={{ 
             boxShadow: `inset 0 0 100px ${event.banner_color}`
           }}
         />
 
         <div 
           className="absolute inset-0 opacity-100 transition-all duration-1000 group-hover:opacity-80 group-hover:scale-110"
           style={{ 
             background: `radial-gradient(circle at 20% 50%, ${event.banner_color}60, transparent 70%), linear-gradient(135deg, ${event.banner_color}20, transparent)`,
           }}
         />
         
         {/* Scanline Effect */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
 
         <div className="absolute inset-0 bg-background/20 backdrop-blur-xl" />
         <div 
           className="absolute top-0 left-0 right-0 h-[3px] shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" 
           style={{ background: `linear-gradient(90deg, transparent, ${event.banner_color}, white, ${event.banner_color}, transparent)` }}
         />
         
         <CardContent className="p-6 relative z-20">
           <div className="flex items-center gap-6">
             {/* Icon with Glowing Orbit */}
             <div className="relative shrink-0">
               <motion.div
                 className="absolute inset-0 blur-2xl opacity-50 rounded-full"
                 style={{ backgroundColor: event.banner_color }}
                 animate={{ scale: [1, 1.5, 1] }}
                 transition={{ duration: 3, repeat: Infinity }}
               />
               <motion.div
                 className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] filter saturate-200 relative z-10"
                 animate={{ 
                   scale: [1, 1.15, 1],
                   rotate: [0, 8, -8, 0],
                 }}
                 transition={{ 
                   duration: 2.5,
                   repeat: Infinity,
                   ease: "easeInOut"
                 }}
               >
                 {event.icon}
               </motion.div>
             </div>
 
             {/* Content */}
             <div className="flex-1 min-w-0 space-y-2">
               <div className="flex items-center gap-4">
                 <h3 className="font-black text-2xl tracking-tighter truncate uppercase italic leading-none group-hover:text-primary transition-colors">
                   {event.title}
                 </h3>
                 <motion.div
                   className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] border border-white/20"
                   style={{ 
                     backgroundColor: event.banner_color,
                     color: '#fff',
                   }}
                   animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
                   transition={{ duration: 1.5, repeat: Infinity }}
                 >
                   {event.xp_multiplier}x XP MULTIPLIER
                 </motion.div>
               </div>
               <p className="text-sm text-foreground/80 font-bold line-clamp-1 uppercase tracking-tight">
                 <span className="text-primary mr-2">PROTOCOL_ACTIVE:</span>
                 {event.description}
               </p>
               <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 text-[11px] font-black text-primary border border-primary/30 shadow-glow-sm">
                   <Clock className="h-4 w-4 animate-pulse" />
                   <span className="tracking-widest uppercase">{timeText.toUpperCase()}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] animate-bounce" style={{ color: event.banner_color }}>
                   <Gift className="h-4 w-4" />
                   <span className="drop-shadow-lg">LEGENDARY DROPS DETECTED</span>
                 </div>
               </div>
             </div>
 
             {/* Action Visual */}
             <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-2">
               <ChevronRight className="h-8 w-8 text-primary" strokeWidth={3} />
               <span className="text-[8px] font-black uppercase tracking-widest">JOIN</span>
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
}
