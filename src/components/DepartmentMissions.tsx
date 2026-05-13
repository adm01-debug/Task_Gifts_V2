import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Star, Coins, CheckCircle2, Clock, 
  Trophy, Flame, ChevronRight, Sparkles, Calendar
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
  daily: { label: "Diária", icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  weekly: { label: "Semanal", icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  monthly: { label: "Mensal", icon: Trophy, color: "text-amber-500", bgColor: "bg-amber-500/10" },
};

function MissionCard({ 
  mission, 
  onClaim,
  isClaiming,
}: { 
  mission: MissionWithProgress;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  const progress = mission.progress;
  const currentValue = progress?.current_value || 0;
  const isCompleted = !!progress?.completed_at;
  const isClaimed = !!progress?.claimed;
  const progressPercent = Math.min((currentValue / mission.target_value) * 100, 100);
  
  const freqConfig = frequencyConfig[mission.frequency];
  const FreqIcon = freqConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`relative ${isClaimed ? "opacity-60" : ""}`}
    >
      <Card className={`overflow-hidden transition-all duration-300 card-shimmer ${
        isCompleted && !isClaimed 
          ? "border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-transparent" 
          : "border-border/50 hover:border-primary/30"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`text-3xl p-2 rounded-xl ${freqConfig.bgColor}`}>
              {mission.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate">{mission.title}</h4>
                <Badge variant="outline" className={`text-xs ${freqConfig.color}`}>
                  <FreqIcon className="h-3 w-3 mr-1" />
                  {freqConfig.label}
                </Badge>
              </div>
              
              {mission.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                  {mission.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className={isCompleted ? "text-emerald-500 font-medium" : ""}>
                    {currentValue}/{mission.target_value}
                  </span>
                </div>
                <Progress 
                  value={progressPercent} 
                  className={`h-2 ${isCompleted ? "[&>div]:bg-emerald-500" : ""}`}
                />
              </div>
            </div>

            {/* Rewards & Action */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 text-amber-400" />
                  {mission.xp_reward}
                </Badge>
                {mission.coin_reward > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    🪙 {mission.coin_reward}
                  </Badge>
                )}
              </div>

              {isCompleted && !isClaimed && (
                <Button
                  size="sm"
                  className="gap-1 bg-emerald-500 hover:bg-emerald-600"
                  onClick={onClaim}
                  disabled={isClaiming}
                >
                  <Sparkles className="h-3 w-3" />
                  Coletar
                </Button>
              )}

              {isClaimed && (
                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Coletado
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

 function DepartmentMissions() {
 export const DepartmentMissionsLazy = memo(DepartmentMissions);
 export default DepartmentMissionsLazy;
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  
  const { data: departments = [] } = useDepartments();
  const { data: missions = [], isLoading } = useDepartmentMissions(
    selectedDepartment === "all" ? null : selectedDepartment
  );
  const claimMutation = useClaimMissionReward();

  // Filter by frequency
  const filteredMissions = missions.filter(m => m.frequency === activeTab);

  // Stats
  const completedToday = missions.filter(m => m.frequency === "daily" && m.progress?.completed_at).length;
  const totalDaily = missions.filter(m => m.frequency === "daily").length;
  const claimableMissions = missions.filter(m => m.progress?.completed_at && !m.progress?.claimed);

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
      <Card variant="glass" className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Missões do Setor</CardTitle>
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonMissionList items={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Missões do Setor</CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedToday}/{totalDaily} diárias concluídas
              </p>
            </div>
          </div>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <AllSelectItem label="Todos / Geral" />
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {claimableMissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium">
                {claimableMissions.length} recompensa{claimableMissions.length > 1 ? "s" : ""} disponível!
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              onClick={() => {
                claimableMissions.forEach(m => {
                  if (m.progress) handleClaim(m.progress.id);
                });
              }}
            >
              Coletar Todas
            </Button>
          </motion.div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "daily" | "weekly" | "monthly")}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily" className="gap-1">
              <Clock className="h-4 w-4" />
              Diárias
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-1">
              <Calendar className="h-4 w-4" />
              Semanais
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-1">
              <Trophy className="h-4 w-4" />
              Mensais
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {filteredMissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma missão {activeTab === "daily" ? "diária" : activeTab === "weekly" ? "semanal" : "mensal"} disponível</p>
                </div>
              ) : (
                filteredMissions.map((mission, index) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MissionCard
                      mission={mission}
                      onClaim={() => mission.progress && handleClaim(mission.progress.id)}
                      isClaiming={claimingIds.has(mission.progress?.id || "")}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}
