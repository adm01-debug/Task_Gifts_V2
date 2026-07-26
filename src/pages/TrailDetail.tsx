import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
   ArrowLeft, BookOpen, Clock, Star, Trophy, Play, TrendingUp,
  CheckCircle2, Video, FileText, HelpCircle, Layers,
  ChevronRight, Lock, Sparkles, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useTrailWithModules, useUserEnrollments, useModuleProgress, useEnrollInTrail, useStartModule, useCompleteModule } from "@/hooks/useTrails";
import { useRBAC } from "@/hooks/useRBAC";
import TrailModuleEditor from "@/components/trails/TrailModuleEditor";
import { useAuth } from "@/hooks/useAuth";
import type { TrailModule, ModuleProgress } from "@/services/trailsService";
import { PageShell } from "@/components/navigation";
import ModuleViewer from "@/components/lms/ModuleViewer";

const contentTypeConfig = {
  video: { icon: Video, label: "Vídeo", color: "text-red-500" },
  text: { icon: FileText, label: "Texto", color: "text-blue-500" },
  quiz: { icon: HelpCircle, label: "Quiz", color: "text-amber-500" },
  flashcard: { icon: Layers, label: "Flashcards", color: "text-purple-500" },
  infographic: { icon: FileText, label: "Infográfico", color: "text-emerald-500" },
  simulation: { icon: Play, label: "Simulação", color: "text-cyan-500" },
  checklist: { icon: CheckCircle2, label: "Checklist", color: "text-green-500" },
};

function ModuleCard({
  module,
  progress,
  isLocked,
  isActive,
  onClick,
}: {
  module: TrailModule;
  progress?: ModuleProgress;
  isLocked: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const config = contentTypeConfig[module.content_type];
  const Icon = config.icon;
  const isCompleted = !!progress?.completed_at;

  return (
    <motion.div
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 ${
          isActive 
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
            : isCompleted
              ? "border-emerald-500/50 bg-emerald-500/5"
              : isLocked
                ? "opacity-60 cursor-not-allowed"
                : "hover:border-primary/30"
        }`}
        onClick={!isLocked ? onClick : undefined}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${
            isCompleted 
              ? "bg-emerald-500/20" 
              : isLocked 
                ? "bg-muted" 
                : "bg-primary/10"
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : isLocked ? (
              <Lock className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Icon className={`h-6 w-6 ${config.color}`} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {module.duration_minutes} min
              </span>
            </div>
            <h4 className="font-medium truncate">{module.title}</h4>
            {module.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {module.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 text-amber-400" />
              {module.xp_reward}
            </Badge>
            {!isLocked && !isCompleted && (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TrailDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: trail, isLoading: trailLoading } = useTrailWithModules(id || "");
  const { data: enrollments = [] } = useUserEnrollments();
  const { data: moduleProgressList = [] } = useModuleProgress(
    trail?.modules.map(m => m.id) || []
  );

  const enrollMutation = useEnrollInTrail();
  const startModuleMutation = useStartModule();
  const completeModuleMutation = useCompleteModule();

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const enrollment = enrollments.find(e => e.trail_id === id);
  const isEnrolled = !!enrollment;
  const progressMap = new Map(moduleProgressList.map(p => [p.module_id, p]));

  // Calculate progress
  const completedModules = moduleProgressList.filter(p => p.completed_at).length;
  const totalModules = trail?.modules.length || 0;
  const progressPercent = totalModules > 0 
    ? Math.round((completedModules / totalModules) * 100) 
    : 0;

  // Find first incomplete module
  useEffect(() => {
    if (trail?.modules && isEnrolled && !activeModuleId) {
      const firstIncomplete = trail.modules.find(
        m => !progressMap.get(m.id)?.completed_at
      );
      if (firstIncomplete) {
        setActiveModuleId(firstIncomplete.id);
      }
    }
  }, [trail, isEnrolled, progressMap, activeModuleId]);

  const handleEnroll = async () => {
    if (id) {
      await enrollMutation.mutateAsync(id);
    }
  };

  const handleModuleClick = async (module: TrailModule) => {
    setActiveModuleId(module.id);
    await startModuleMutation.mutateAsync(module.id);
    setShowViewer(true);
  };

  const handleModuleComplete = async (score?: number) => {
    if (!activeModuleId || !trail) return;

    const module = trail.modules.find(m => m.id === activeModuleId);
    if (!module) return;

    await completeModuleMutation.mutateAsync({
      moduleId: activeModuleId,
      score,
      xpReward: module.xp_reward,
      trailId: trail.id,
      totalModules,
      completedModules,
    });

    setShowViewer(false);

    // Move to next module
    const currentIndex = trail.modules.findIndex(m => m.id === activeModuleId);
    if (currentIndex < trail.modules.length - 1) {
      setActiveModuleId(trail.modules[currentIndex + 1].id);
    }
  };

  if (trailLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Trilha não encontrada</h2>
          <Button onClick={() => navigate("/trails")}>Voltar às Trilhas</Button>
        </div>
      </div>
    );
  }

  const activeModule = trail.modules.find(m => m.id === activeModuleId);

  return (
    <PageShell title={trail.title} backFallback="/trails">
      {/* Page Header Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 pb-24 relative">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Trail Header Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="premium" className="overflow-hidden border-none shadow-2xl">
                <div className="relative p-8 md:p-10">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="text-8xl opacity-10 blur-[2px]">{trail.icon}</div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[10px]">
                        Trilha de Especialização
                      </Badge>
                    </div>

                    {canAuthor && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowEditor(true)}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar módulos
                        </Button>
                      </div>
                    )}
                    
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">{trail.title}</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                      {trail.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-background/50 backdrop-blur-md border border-border/50">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">{trail.estimated_hours}h estimadas</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-background/50 backdrop-blur-md border border-border/50">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">{totalModules} módulos</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-background/50 backdrop-blur-md border border-border/50">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-bold">{trail.xp_reward} XP Reward</span>
                      </div>
                    </div>
                  </div>
                </div>

                {isEnrolled && (
                 <div className="bg-muted/10 p-8 border-t border-border/30 relative overflow-hidden group/progress">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/progress:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <TrendingUp className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Sync Protocol Progress</span>
                            <span className="text-sm font-bold text-foreground">Otimização de Carreira</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-primary tracking-tighter">
                            {progressPercent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-muted/30 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)] relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        </motion.div>
                      </div>
                      <div className="flex justify-between mt-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{completedModules} COMPLETED</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{totalModules - completedModules} PENDING</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Modules Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  Conteúdo do Programa
                </h2>
                {isEnrolled && (
                   <Badge variant="secondary" className="font-bold">
                     Próximo: {trail.modules[completedModules]?.title || "Concluído"}
                   </Badge>
                )}
              </div>

              <div className="grid gap-4">
                {trail.modules.map((module, index) => {
                  const progress = progressMap.get(module.id);
                  const prevCompleted = index === 0 || progressMap.get(trail.modules[index - 1].id)?.completed_at;
                  const isLocked = !isEnrolled || (index > 0 && !prevCompleted);

                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ModuleCard
                        module={module}
                        progress={progress}
                        isLocked={isLocked}
                        isActive={activeModuleId === module.id}
                        onClick={() => handleModuleClick(module)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Primary Action Card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              {!isEnrolled ? (
                <Card variant="premium" className="overflow-hidden border-primary/20 group">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="relative mx-auto w-24 h-24">
                       <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                       <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                         <Sparkles className="h-10 w-10 text-primary" />
                       </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight">Liberar Acesso</h3>
                      <p className="text-muted-foreground">
                        Inscreva-se agora para começar a trilha e conquistar recompensas exclusivas.
                      </p>
                    </div>
                    <Button 
                      className="w-full h-14 text-lg font-black tracking-widest uppercase gap-3 shadow-[0_10px_30px_rgba(var(--primary),0.3)] hover:shadow-[0_15px_40px_rgba(var(--primary),0.4)] transition-all hover:-translate-y-1" 
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="h-5 w-5 fill-current" />
                          INICIAR AGORA
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : progressPercent >= 100 ? (
                <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 overflow-hidden">
                  <CardContent className="p-8 text-center space-y-6">
                    <div className="relative mx-auto w-24 h-24">
                       <motion.div 
                        animate={{ rotate: [0, 10, -10, 10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                       >
                         <Award className="h-24 w-24 text-emerald-500" />
                       </motion.div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tight text-emerald-500">EXCELÊNCIA ATINGIDA</h3>
                      <p className="text-muted-foreground font-medium">
                        Você dominou todos os conceitos desta trilha com maestria!
                      </p>
                    </div>
                    {trail.badge_name && (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center gap-2">
                        <span className="text-4xl">{trail.badge_icon}</span>
                        <span className="font-black text-xs tracking-[0.2em] uppercase">{trail.badge_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card variant="stat" className="bg-card/50 backdrop-blur-xl border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Status da Missão</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex justify-between items-end border-b border-border/50 pb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Concluídos</p>
                        <p className="text-3xl font-black">{completedModules}/{totalModules}</p>
                      </div>
                      <Badge variant="outline" className="mb-1">{Math.round((completedModules/totalModules)*100)}%</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP Acumulado</p>
                        <p className="font-black text-amber-500">
                          {moduleProgressList.filter(p => p.completed_at).reduce((acc, p) => {
                            const mod = trail.modules.find(m => m.id === p.module_id);
                            return acc + (mod?.xp_reward || 0);
                          }, 0)} XP
                        </p>
                      </div>
                    </div>

                    <Button 
                      className="w-full h-12 font-black tracking-widest uppercase"
                      onClick={() => {
                        const next = trail.modules[completedModules];
                        if (next) handleModuleClick(next);
                      }}
                    >
                      CONTINUAR APRENDIZADO
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Rewards Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 bg-card/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Prêmios da Trilha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="h-6 w-6 text-amber-500" />
                      <div>
                        <p className="font-black text-lg">+{trail.xp_reward}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">XP de Bônus</p>
                      </div>
                    </div>
                  </div>
                  
                  {trail.coin_reward > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🪙</span>
                        <div>
                          <p className="font-black text-lg">+{trail.coin_reward}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Coins Corporativos</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {trail.badge_name && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{trail.badge_icon}</span>
                        <div>
                          <p className="font-black text-lg">{trail.badge_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Badge de Mestria</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Module Viewer Modal */}
      <AnimatePresence>
        {showViewer && activeModule && (
          <SectionErrorBoundary sectionName="Visualizador de Módulo">
            <ModuleViewer
              module={activeModule}
              onComplete={handleModuleComplete}
              onClose={() => setShowViewer(false)}
            />
          </SectionErrorBoundary>
        )}
      </AnimatePresence>
       </PageShell>
     );
   }
