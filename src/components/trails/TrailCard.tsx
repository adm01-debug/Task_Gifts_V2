import { motion } from "framer-motion";
import { Clock, Star, Trophy, Play, CheckCircle2, Lock, Award, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { LearningTrail, TrailEnrollment } from "@/services/trailsService";

const statusConfig = {
  not_started: { label: "Iniciar", color: "bg-primary", icon: Play },
  in_progress: { label: "Continuar", color: "bg-amber-500", icon: Play },
  completed: { label: "Concluído", color: "bg-emerald-500", icon: CheckCircle2 },
  locked: { label: "Bloqueado", color: "bg-muted", icon: Lock },
};

interface TrailCardProps {
  trail: LearningTrail;
  enrollment?: TrailEnrollment;
  hasCertification?: boolean;
  certificationName?: string;
  isLocked?: boolean;
  missingPrerequisiteNames?: string[];
  isEnrolling?: boolean;
  onEnroll: () => void;
  onContinue: () => void;
}

export function TrailCard({ trail, enrollment, hasCertification, certificationName, isLocked, missingPrerequisiteNames, isEnrolling, onEnroll, onContinue }: TrailCardProps) {
  const status = isLocked ? "locked" : enrollment ? (enrollment.completed_at ? "completed" : "in_progress") : "not_started";
  const config = statusConfig[status];
  const Icon = config.icon;
  const progress = enrollment?.progress_percent || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: isLocked ? 0 : -4 }} transition={{ duration: 0.2 }}>
       <Card variant={isLocked ? "subtle" : "interactive"} className={`overflow-hidden transition-all duration-300 h-full flex flex-col ${isLocked ? 'opacity-60 grayscale-[30%]' : hasCertification ? 'ring-1 ring-amber-500/30 hover:border-primary/30' : ''}`}>
        <div className="relative group/card-img h-40 overflow-hidden bg-muted/20 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-black/40 z-10" />
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 5 }}
            className={`text-6xl z-20 transition-all duration-500 ${isLocked ? 'opacity-30 grayscale' : 'drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]'}`}
          >
            {trail.icon}
          </motion.div>
          
          <div className="absolute top-3 left-3 z-30 flex gap-2">
            {isLocked && (
              <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Bloqueado</span>
              </div>
            )}
            {hasCertification && !isLocked && (
              <div className="px-2 py-1 bg-amber-500/20 backdrop-blur-md rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                <Award className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Elite</span>
              </div>
            )}
          </div>
          
          <div className="absolute bottom-3 right-3 z-30">
             <Badge variant="secondary" className="font-black bg-black/40 backdrop-blur-md border-white/10">{trail.estimated_hours}H</Badge>
          </div>
        </div>

        <CardHeader className="pb-2 pt-4">
           <CardTitle className="text-xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">{trail.title}</CardTitle>
           <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-[40px] leading-relaxed">{trail.description}</p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Star className="h-3.5 w-3.5 fill-current" />
              {trail.xp_reward} XP
            </div>
            {trail.coin_reward > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="text-sm">🪙</span>
                {trail.coin_reward}
              </div>
            )}
            {trail.badge_name && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Trophy className="h-3.5 w-3.5" />
                {trail.badge_name}
              </div>
            )}
          </div>
          {isLocked && missingPrerequisiteNames && missingPrerequisiteNames.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Link2 className="h-4 w-4" /><span className="font-medium">Pré-requisitos:</span></div>
              <ul className="space-y-1">{missingPrerequisiteNames.map((name, idx) => <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-3 w-3" /><span>{name}</span></li>)}</ul>
            </div>
          )}
          {enrollment && (
            <div className="space-y-2 py-1">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-muted-foreground">Sync Progress</span><span className="text-primary">{progress}%</span></div>
              <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                />
              </div>
            </div>
          )}

          <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="pt-2">
            <Button 
              className={`w-full h-11 font-black uppercase tracking-widest text-xs gap-3 group/btn ${
                status === "completed" 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20" 
                  : status === "locked" 
                    ? "bg-muted text-muted-foreground cursor-not-allowed" 
                    : "shadow-[0_10px_20px_rgba(var(--primary),0.2)] hover:shadow-[0_15px_30px_rgba(var(--primary),0.3)] hover:-translate-y-0.5"
              }`}
              variant={status === "completed" ? "outline" : "default"}
              onClick={isLocked ? undefined : (enrollment ? onContinue : onEnroll)} 
              disabled={status === "completed" || isLocked || isEnrolling}
            >
              {isEnrolling ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon className={`h-4 w-4 transition-transform ${status !== "locked" ? "group-hover/btn:scale-125" : ""}`} />
              )}
              {isEnrolling ? 'Enrolling...' : config.label}
            </Button>
          </div></TooltipTrigger>{isLocked && <TooltipContent><p className="font-bold">Protocolo Bloqueado: Complete os pré-requisitos</p></TooltipContent>}</Tooltip></TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
}
