import { useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { SkeletonMissionList } from "@/components/ui/skeleton";
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
  
  return (
    <div className={`p-3 rounded-lg border border-border/50 ${isCompleted && !isClaimed ? "bg-emerald-500/5 border-emerald-500/30" : "bg-card"}`}>
      <div className="flex items-center gap-2">
        <div className="text-xl shrink-0">{mission.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate">{mission.title}</h4>
          <Progress value={progressPercent} className="h-1 mt-1" />
        </div>
        <div className="shrink-0 flex flex-col items-end">
           <span className="text-[10px] font-bold">+{mission.xp_reward}XP</span>
           {isCompleted && !isClaimed && (
             <button onClick={onClaim} disabled={isClaiming} className="mt-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] rounded font-bold">
               {isClaiming ? "..." : "✓"}
             </button>
           )}
        </div>
      </div>
    </div>
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

  if (isLoading) return <SkeletonMissionList items={3} />;

  return (
    <Card variant="glass" className="border-border/50 h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Setor</CardTitle>
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="h-7 text-[10px] w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <AllSelectItem label="Geral" />
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id} className="text-[10px]">
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 h-7 mb-2 p-0.5 bg-muted/50">
            <TabsTrigger value="daily" className="text-[10px]">Dia</TabsTrigger>
            <TabsTrigger value="weekly" className="text-[10px]">Sem</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[10px]">Mês</TabsTrigger>
          </TabsList>
          <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onClaim={() => mission.progress && handleClaim(mission.progress.id)}
                isClaiming={claimingIds.has(mission.progress?.id || "")}
              />
            ))}
            {filteredMissions.length === 0 && <p className="text-[10px] text-center text-muted-foreground py-4">Sem missões</p>}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export const DepartmentMissionsLazy = memo(DepartmentMissions);
export default DepartmentMissionsLazy;
