import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Target, Star, CheckCircle2, Clock, 
  Trophy, Sparkles, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { Skeleton, SkeletonMissionList } from "@/components/ui/skeleton";
import { useDepartmentMissions, useClaimMissionReward } from "@/hooks/useMissions";
import { useDepartments } from "@/hooks/useDepartments";
import type { MissionWithProgress } from "@/services/missionsService";

const frequencyConfig = {
  daily: { label: "Dia", icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  weekly: { label: "Sem", icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  monthly: { label: "Mês", icon: Trophy, color: "text-amber-500", bgColor: "bg-amber-500/10" },
};

function MissionCard({ mission, onClaim, isClaiming }: { mission: MissionWithProgress; onClaim: () => void; isClaiming: boolean; }) {
  const progress = mission.progress;
  const currentValue = progress?.current_value || 0;
  const isCompleted = !!progress?.completed_at;
  const isClaimed = !!progress?.claimed;
  const progressPercent = Math.min((currentValue / mission.target_value) * 100, 100);
  const controls = useAnimation();

  useEffect(() => {
    if (isCompleted && !isClaimed) {
      controls.start({
        boxShadow: ["0 0 0px rgba(16, 185, 129, 0)", "0 0 20px rgba(16, 185, 129, 0.3)", "0 0 0px rgba(16, 185, 129, 0)"],
        transition: { duration: 2, repeat: Infinity }
      });
    }
  }, [isCompleted, isClaimed, controls]);

  return (
    <motion.div 
      animate={controls}
      className={cn(
        "relative group p-4 rounded-2xl border transition-all duration-500",
        isCompleted && !isClaimed 
          ? "bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10" 
          : "bg-card/40 backdrop-blur-md border-white/5 hover:border-primary/30 hover:bg-card/60",
        isClaimed && "opacity-60 grayscale-[0.5]"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner bg-background/50 border border-white/5 group-hover:scale-110 transition-transform duration-500",
          isCompleted && !isClaimed && "animate-bounce"
        )}>
          {mission.icon}
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/80 truncate">
              {mission.title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary italic">+{mission.xp_reward}XP</span>
              {mission.coin_reward > 0 && <span className="text-[10px] font-black text-amber-500 italic">+{mission.coin_reward}🪙</span>}
            </div>
          </div>
          
          <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                isCompleted ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary"
              )}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-muted-foreground/60 tracking-tighter">
              PROGRESS_PROTOCOL: {currentValue}/{mission.target_value}
            </span>
            {isCompleted && !isClaimed && (
              <Button 
                onClick={onClaim} 
                disabled={isClaiming}
                variant="success"
                size="sm"
                className="h-6 px-3 text-[9px] font-black uppercase tracking-widest animate-pulse"
              >
                {isClaiming ? "SYNC..." : "DEPLOY_REWARD"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {!isClaimed && (
        <motion.div 
          className="absolute left-0 right-0 h-[1px] bg-primary/20 pointer-events-none"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

function DepartmentMissions() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  
  const { data: departments = [] } = useDepartments();
  const { data: missions = [], isLoading } = useDepartmentMissions(
    selectedDepartment === "all" ? null : selectedDepartment
  );
  const claimMutation = useClaimMissionReward();

  const filteredMissions = missions.filter(m => m.frequency === activeTab);

  const handleClaim = (progressId: string) => {
    setClaimingIds(prev => new Set(prev).add(progressId));
    claimMutation.mutate(progressId, {
      onSettled: () => {
        setClaimingIds(prev => {
          const next = new Set(prev);
          next.delete(progressId);
          return next;
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card variant="ultra" className="h-full flex flex-col overflow-hidden border-white/5">
        <CardHeader className="p-5 bg-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="glow" shape="card" className="w-10 h-10 rounded-2xl" />
              <div className="space-y-1">
                <Skeleton variant="shimmer" className="h-3 w-24" />
                <Skeleton variant="shimmer" className="h-2 w-32" />
              </div>
            </div>
            <Skeleton variant="shimmer" className="h-9 w-32 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <Skeleton variant="shimmer" className="h-10 w-full rounded-2xl" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-2xl border border-white/5 bg-card/40 space-y-3">
                <div className="flex items-center gap-4">
                  <Skeleton variant="glow" shape="card" className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton variant="shimmer" className="h-2 w-32" />
                      <Skeleton variant="shimmer" className="h-2 w-16" />
                    </div>
                    <Skeleton variant="shimmer" className="h-1.5 w-full rounded-full" />
                    <Skeleton variant="shimmer" className="h-2 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="ultra" className="h-full flex flex-col overflow-hidden border-white/5">
      <CardHeader className="p-5 pb-3 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow-sm">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest leading-none mb-1">Tactical Ops</CardTitle>
              <p className="text-[10px] text-muted-foreground font-black opacity-70 uppercase tracking-tighter italic">MISSION_CONTROL_V4</p>
            </div>
          </div>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="h-9 text-[10px] w-32 font-black uppercase tracking-widest border-white/10 bg-black/20 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-white/10">
              <AllSelectItem label="Geral" />
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id} className="text-[10px] font-bold">
                  {dept.name.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-1 flex flex-col space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 h-10 mb-4 p-1 bg-black/20 rounded-2xl border border-white/5">
            <TabsTrigger value="daily" className="text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl">DIÁRIO</TabsTrigger>
            <TabsTrigger value="weekly" className="text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl">SEMANAL</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl">MENSAL</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {filteredMissions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MissionCard
                    mission={mission}
                    onClaim={() => mission.progress && handleClaim(mission.progress.id)}
                    isClaiming={claimingIds.has(mission.progress?.id || "")}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredMissions.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center border border-dashed border-muted/30">
                  <Target className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">NO_ACTIVE_MISSIONS_DETECTED</p>
              </motion.div>
            )}
          </div>
        </Tabs>
      </CardContent>
      
      <div className="px-5 py-2 bg-primary/5 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80">SYSTEM_OPERATIONAL</span>
        </div>
        <span className="text-[9px] font-black text-primary tracking-tighter italic">V4.0.0_STABLE</span>
      </div>
    </Card>
  );
}

export const DepartmentMissionsLazy = memo(DepartmentMissions);
export default DepartmentMissionsLazy;
