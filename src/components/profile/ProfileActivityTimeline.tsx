import { motion } from "framer-motion";
import { Zap, TrendingUp, Target, Trophy, Heart, Flame, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentAuditLogs } from "@/hooks/useAudit";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  xp_gained: { icon: Zap, color: "success", label: "Ganhou XP" },
  level_up: { icon: TrendingUp, color: "primary", label: "Subiu de nível" },
  quest_completed: { icon: Target, color: "secondary", label: "Completou quest" },
  achievement_unlocked: { icon: Trophy, color: "warning", label: "Desbloqueou conquista" },
  kudos_received: { icon: Heart, color: "accent", label: "Recebeu kudos" },
  kudos_given: { icon: Heart, color: "primary", label: "Enviou kudos" },
  streak_updated: { icon: Flame, color: "primary", label: "Streak atualizado" },
  coins_earned: { icon: Star, color: "warning", label: "Ganhou moedas" },
  coins_spent: { icon: Star, color: "muted", label: "Gastou moedas" },
};

const colorClasses: Record<string, string> = {
  success: "bg-success/20 text-success",
  primary: "bg-primary/20 text-primary",
  secondary: "bg-secondary/20 text-secondary",
  warning: "bg-warning/20 text-warning",
  accent: "bg-accent/20 text-accent",
  muted: "bg-muted text-muted-foreground",
};

 export function ProfileActivityTimeline({ userId }: { userId?: string }) {
   const { data: auditLogs = [], isLoading } = useRecentAuditLogs(10);
   const userLogs = auditLogs.filter(log => log.user_id === userId);
 
   const ContentWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => (
     <motion.div 
       initial={{ opacity: 0, y: 20 }} 
       animate={{ opacity: 1, y: 0 }} 
       transition={{ delay: 0.4 }} 
       className="bg-card/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden"
     >
       <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
         <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
           <TrendingUp className="w-4 h-4 text-primary" />
           {title}
         </h3>
         <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter bg-white/5 border-white/10">Histórico</Badge>
       </div>
       <div className="p-6">
         {children}
       </div>
     </motion.div>
   );
 
   if (isLoading) {
     return (
       <ContentWrapper title="Atividade Recente">
         <div className="space-y-4">
           {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
         </div>
       </ContentWrapper>
     );
   }
 
   if (userLogs.length === 0) {
     return (
       <ContentWrapper title="Atividade Recente">
         <div className="text-center py-8">
           <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 opacity-50">
             <TrendingUp className="w-8 h-8 text-muted-foreground" />
           </div>
           <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
             Nenhuma atividade registrada ainda. Complete quests e evolua seu perfil para preencher seu histórico!
           </p>
         </div>
       </ContentWrapper>
     );
   }
 
   return (
     <ContentWrapper title="Atividade Recente">
       <div className="space-y-4">
         {userLogs.slice(0, 5).map((log, i) => {
           const config = activityConfig[log.action] || { icon: Target, color: "muted", label: log.action.replace(/_/g, ' ') };
           const Icon = config.icon;
           const metadata = log.metadata as { xp_amount?: number } | null;
           const newData = log.new_data as { xp_amount?: number } | null;
           const xpAmount = metadata?.xp_amount || newData?.xp_amount || 0;
           let activityText = config.label;
           if (log.entity_type && log.entity_type !== 'profile') activityText += ` (${log.entity_type})`;
 
           return (
             <motion.div 
               key={log.id} 
               initial={{ opacity: 0, x: -20 }} 
               animate={{ opacity: 1, x: 0 }} 
               transition={{ delay: 0.5 + i * 0.1 }} 
               className="flex items-center gap-4 group"
             >
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${colorClasses[config.color] || colorClasses.muted}`}>
                 <Icon className="w-6 h-6" />
               </div>
               <div className="flex-1">
                 <p className="font-black italic uppercase text-xs tracking-tight group-hover:text-primary transition-colors">{activityText}</p>
                 <p className="text-[10px] text-muted-foreground font-medium uppercase opacity-70">
                   {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                 </p>
               </div>
               {xpAmount > 0 && (
                 <Badge className="bg-primary/20 text-primary border-primary/30 font-black italic tracking-tighter">
                   +{xpAmount} XP
                 </Badge>
               )}
             </motion.div>
           );
         })}
       </div>
     </ContentWrapper>
   );
 }
