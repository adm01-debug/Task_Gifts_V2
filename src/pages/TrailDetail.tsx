import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, BookOpen, Clock, Star, Trophy, Play, 
  CheckCircle2, Video, FileText, HelpCircle, Layers,
  ChevronRight, Lock, Sparkles, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useTrailWithModules, useUserEnrollments, useModuleProgress, useEnrollInTrail, useStartModule, useCompleteModule } from "@/hooks/useTrails";
import { useAuth } from "@/hooks/useAuth";
import type { TrailModule, ModuleProgress } from "@/services/trailsService";
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
       <div className="container max-w-7xl mx-auto px-4 py-6 md:py-8 pb-24">
         <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trail Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">{trail.icon}</div>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-2">{trail.title}</h1>
                      <p className="text-muted-foreground mb-4">{trail.description}</p>
                      
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {trail.estimated_hours}h estimadas
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          {totalModules} módulos
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 text-amber-400" />
                          {trail.xp_reward} XP total
                        </Badge>
                        {trail.badge_name && (
                          <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                            <Trophy className="h-3 w-3" />
                            {trail.badge_icon} {trail.badge_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isEnrolled && (
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Seu Progresso</span>
                      <span className="text-sm text-muted-foreground">
                        {completedModules}/{totalModules} módulos
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {progressPercent}% concluído
                    </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* Modules List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Conteúdo da Trilha
              </h2>

              <div className="space-y-3">
                {trail.modules.map((module, index) => {
                  const progress = progressMap.get(module.id);
                  const prevCompleted = index === 0 || progressMap.get(trail.modules[index - 1].id)?.completed_at;
                  const isLocked = !isEnrolled || (index > 0 && !prevCompleted);

                  return (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      progress={progress}
                      isLocked={isLocked}
                      isActive={activeModuleId === module.id}
                      onClick={() => handleModuleClick(module)}
                    />
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enroll CTA or Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {!isEnrolled ? (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Comece sua jornada!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Inscreva-se para acessar todos os módulos e ganhar recompensas.
                    </p>
                    <Button 
                      className="w-full gap-2" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending}
                    >
                      <Play className="h-4 w-4" />
                      {enrollMutation.isPending ? "Inscrevendo..." : "Iniciar Trilha"}
                    </Button>
                  </CardContent>
                </Card>
              ) : progressPercent >= 100 ? (
                <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
                  <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-emerald-500">
                      🎉 Trilha Concluída!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Parabéns! Você completou todos os módulos.
                    </p>
                    {trail.badge_name && (
                      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                        {trail.badge_icon} {trail.badge_name} Conquistado!
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Módulos completos</span>
                      <span className="font-medium">{completedModules}/{totalModules}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">XP ganho</span>
                      <span className="font-medium text-amber-500">
                        {moduleProgressList.filter(p => p.completed_at).reduce((acc, p) => {
                          const mod = trail.modules.find(m => m.id === p.module_id);
                          return acc + (mod?.xp_reward || 0);
                        }, 0)} XP
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tempo restante</span>
                      <span className="font-medium">
                        ~{Math.ceil(trail.estimated_hours * (1 - progressPercent / 100))}h
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Rewards Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Recompensas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">{trail.xp_reward} XP</p>
                      <p className="text-xs text-muted-foreground">Experiência total</p>
                    </div>
                  </div>
                  
                  {trail.coin_reward > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10">
                      <span className="text-xl">🪙</span>
                      <div>
                        <p className="font-medium">{trail.coin_reward} Moedas</p>
                        <p className="text-xs text-muted-foreground">Para a loja</p>
                      </div>
                    </div>
                  )}

                  {trail.badge_name && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                      <span className="text-xl">{trail.badge_icon}</span>
                      <div>
                        <p className="font-medium">{trail.badge_name}</p>
                        <p className="text-xs text-muted-foreground">Badge exclusivo</p>
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
