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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`text-4xl ${isLocked ? 'opacity-50' : ''}`}>{trail.icon}</div>
                {isLocked && <div className="absolute -top-1 -right-1 w-5 h-5 bg-muted-foreground rounded-full flex items-center justify-center shadow-lg"><Lock className="w-3 h-3 text-background" /></div>}
                {hasCertification && !isLocked && <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"><Award className="w-3 h-3 text-white" /></div>}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg leading-tight">{trail.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{trail.description}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{trail.estimated_hours}h</Badge>
            <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3 text-amber-400" />{trail.xp_reward} XP</Badge>
            {trail.coin_reward > 0 && <Badge variant="secondary" className="gap-1">🪙 {trail.coin_reward}</Badge>}
            {trail.badge_name && <Badge variant="outline" className="gap-1 border-primary/30"><Trophy className="h-3 w-3 text-primary" />{trail.badge_icon} {trail.badge_name}</Badge>}
            {hasCertification && (
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"><Award className="h-3 w-3" />Certificação</Badge>
              </TooltipTrigger><TooltipContent><p>Concede: {certificationName}</p></TooltipContent></Tooltip></TooltipProvider>
            )}
          </div>
          {isLocked && missingPrerequisiteNames && missingPrerequisiteNames.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Link2 className="h-4 w-4" /><span className="font-medium">Pré-requisitos:</span></div>
              <ul className="space-y-1">{missingPrerequisiteNames.map((name, idx) => <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="h-3 w-3" /><span>{name}</span></li>)}</ul>
            </div>
          )}
          {enrollment && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Progresso</span><span className="font-medium">{progress}%</span></div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <TooltipProvider><Tooltip><TooltipTrigger asChild><div>
            <Button className={`w-full gap-2 ${status === "completed" ? "bg-emerald-500 hover:bg-emerald-600" : status === "locked" ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
              onClick={isLocked ? undefined : (enrollment ? onContinue : onEnroll)} disabled={status === "completed" || isLocked || isEnrolling}>
              {isEnrolling ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Icon className="h-4 w-4" />}
              {isEnrolling ? 'Inscrevendo...' : config.label}
            </Button>
          </div></TooltipTrigger>{isLocked && <TooltipContent><p>Complete os pré-requisitos para desbloquear</p></TooltipContent>}</Tooltip></TooltipProvider>
        </CardContent>
      </Card>
    </motion.div>
  );
}
