import { motion } from "framer-motion";
import { Zap, TrendingUp, Target, Trophy, Heart, Flame, Star, ChevronRight, Activity, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonActivityList } from "@/components/ui/skeleton";
import { useRecentAuditLogs } from "@/hooks/useAudit";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const activityConfig: Record<string, { icon: React.ElementType; color: string; label: string; glow: string }> = {
  xp_gained: { icon: Zap, color: "success", label: "Energia Sincronizada", glow: "shadow-success/20" },
  level_up: { icon: TrendingUp, color: "primary", label: "Promoção de Patente", glow: "shadow-primary/20" },
  quest_completed: { icon: Target, color: "secondary", label: "Operação Concluída", glow: "shadow-secondary/20" },
  achievement_unlocked: { icon: Trophy, color: "warning", label: "Conquista Desbloqueada", glow: "shadow-warning/20" },
  kudos_received: { icon: Heart, color: "accent", label: "Elogio Tático Recebido", glow: "shadow-accent/20" },
  kudos_given: { icon: Heart, color: "primary", label: "Reconhecimento de Campo", glow: "shadow-primary/20" },
  streak_updated: { icon: Flame, color: "primary", label: "Constância Operacional", glow: "shadow-primary/20" },
  coins_earned: { icon: Star, color: "warning", label: "Créditos Adquiridos", glow: "shadow-warning/20" },
  coins_spent: { icon: Star, color: "muted", label: "Suprimentos Adquiridos", glow: "shadow-slate/20" },
};

const colorClasses: Record<string, string> = {
  success: "bg-success/20 text-success border-success/30",
  primary: "bg-primary/20 text-primary border-primary/30",
  secondary: "bg-secondary/20 text-secondary border-secondary/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  accent: "bg-accent/20 text-accent border-accent/30",
  muted: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function ProfileActivityTimeline({ userId }: { userId?: string }) {
  const { data: auditLogs = [], isLoading } = useRecentAuditLogs(10);
  const userLogs = auditLogs.filter(log => log.user_id === userId);

  const ContentWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-card/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative group"
    >
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.02] pointer-events-none" />
      
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            {title}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Log de Operações em Tempo Real</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white/5 border-white/10 px-3 py-1">Histórico de Elite</Badge>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>
      <div className="p-8 relative z-10">
        {children}
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <ContentWrapper title="Atividade Recente">
        <div className="space-y-8 relative">
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-white/5 z-0" />
          <SkeletonActivityList count={5} />
        </div>
      </ContentWrapper>
    );
  }

  if (userLogs.length === 0) {
    return (
      <ContentWrapper title="Atividade Recente">
        <div className="text-center py-12 relative">
          <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Shield className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <h4 className="font-black italic uppercase text-muted-foreground/40 text-lg mb-2">Sem registros detectados</h4>
          <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
            Inicie operações táticas para popular seu log de atividade de elite.
          </p>
        </div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="Atividade Recente">
      <div className="space-y-8 relative">
        {/* Timeline Connector Line */}
        <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/20 via-border to-transparent z-0" />
        
        {userLogs.slice(0, 6).map((log, i) => {
          const config = activityConfig[log.action] || { icon: Target, color: "muted", label: log.action.replace(/_/g, ' '), glow: "" };
          const Icon = config.icon;
          const metadata = log.metadata as { xp_amount?: number } | null;
          const newData = log.new_data as { xp_amount?: number } | null;
          const xpAmount = metadata?.xp_amount || newData?.xp_amount || 0;
          let activityText = config.label;
          if (log.entity_type && log.entity_type !== 'profile' && log.entity_type !== 'activity') {
            activityText += ` - ${log.entity_type.toUpperCase()}`;
          }

          return (
            <motion.div 
              key={log.id} 
              initial={{ opacity: 0, x: -30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="flex items-start gap-6 group relative z-10"
            >
              <div className={cn(
                "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-xl border-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                colorClasses[config.color] || colorClasses.muted,
                config.glow
              )}>
                <Icon className="w-7 h-7" />
              </div>
              
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <p className="font-black italic uppercase text-sm tracking-tight group-hover:text-primary transition-colors duration-300">
                    {activityText}
                  </p>
                  {xpAmount > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black italic text-[10px] tracking-tighter"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      +{xpAmount} XP
                    </motion.div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <Clock className="w-3 h-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 rounded-2xl -m-2 pointer-events-none" />
            </motion.div>
          );
        })}
      </div>
      
      <motion.button 
        whileHover={{ x: 5 }}
        className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors duration-300 group"
      >
        Expandir Log Completo
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </motion.button>
    </ContentWrapper>
  );
}
