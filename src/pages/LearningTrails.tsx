import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
 import { BookOpen, Sparkles, Filter, Link2, SearchX, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { usePublishedTrails, useUserEnrollments, useEnrollInTrail, useTrailPrerequisites } from "@/hooks/useTrails";
import { useDepartments } from "@/hooks/useDepartments";
import { useAuth } from "@/hooks/useAuth";
import { useCertifications } from "@/hooks/useCertifications";
import { TrailRecommendations } from "@/components/TrailRecommendations";
import { TrailDependencyTree } from "@/components/TrailDependencyTree";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { PageShell } from "@/components/navigation";
import { TrailStatsCards } from "@/components/trails/TrailStatsCards";
 import type { TrailEnrollment } from "@/services/trailsService";
 import { TrailCard } from "@/components/trails/TrailCard";
 import { AICourseBuilderDialog } from "@/components/trails/AICourseBuilderDialog";


export default function LearningTrails() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const seoData = useSEO();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [enrollingTrailId, setEnrollingTrailId] = useState<string | null>(null);

  const { data: trails = [], isLoading: trailsLoading } = usePublishedTrails();
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useUserEnrollments();
  const { data: departments = [] } = useDepartments();
  const { data: certifications = [] } = useCertifications();
  const { data: prerequisites = [] } = useTrailPrerequisites();
  const enrollMutation = useEnrollInTrail();

  const trailCertificationMap = new Map(certifications.filter(c => c.trail_id).map(c => [c.trail_id, c]));
  const trailPrerequisiteMap = useMemo(() => {
    const map = new Map<string, string[]>();
    prerequisites.forEach(p => { const e = map.get(p.trail_id) || []; e.push(p.prerequisite_trail_id); map.set(p.trail_id, e); });
    return map;
  }, [prerequisites]);
  const trailNameMap = useMemo(() => new Map(trails.map(t => [t.id, t.title])), [trails]);
  const completedTrailIds = useMemo(() => new Set(enrollments.filter(e => e.completed_at).map(e => e.trail_id)), [enrollments]);

  const getLockedInfo = (trailId: string) => {
    const prereqIds = trailPrerequisiteMap.get(trailId) || [];
    if (prereqIds.length === 0) return { isLocked: false, missingNames: [] as string[] };
    const missingIds = prereqIds.filter(id => !completedTrailIds.has(id));
    return { isLocked: missingIds.length > 0, missingNames: missingIds.map(id => trailNameMap.get(id) || "Trilha desconhecida") };
  };

  const isLoading = trailsLoading || enrollmentsLoading;
  const enrollmentMap = new Map(enrollments.map(e => [e.trail_id, e]));

  const filteredTrails = useMemo(() => trails.filter(trail => {
    if (selectedDepartment !== "all" && trail.department_id !== selectedDepartment) return false;
    const enrollment = enrollmentMap.get(trail.id);
    if (activeTab === "enrolled") return enrollment && !enrollment.completed_at;
    if (activeTab === "completed") return enrollment?.completed_at;
    if (activeTab === "available") return !enrollment;
    return true;
  }), [trails, selectedDepartment, activeTab, enrollmentMap]);

  const completedCount = enrollments.filter(e => e.completed_at).length;
  const inProgressCount = enrollments.filter(e => !e.completed_at).length;
  const totalXpEarned = enrollments.filter(e => e.completed_at).reduce((sum, e) => sum + (trails.find(t => t.id === e.trail_id)?.xp_reward || 0), 0);

  const handleEnroll = async (trailId: string) => { setEnrollingTrailId(trailId); try { await enrollMutation.mutateAsync(trailId); navigate(`/trails/${trailId}`); } finally { setEnrollingTrailId(null); } };

  return (
    <PageShell 
      title="Trilhas de Conhecimento" 
      subtitle="Sua jornada de aprendizado personalizada rumo à excelência."
      icon={<BookOpen className="h-6 w-6 text-primary" />}
    >
      <SEOHead {...seoData} />
      
      {/* Hero Section Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 via-primary/2 to-transparent pointer-events-none" />

      <div className="container max-w-7xl mx-auto px-4 pb-24 relative">
        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
            </div>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10"
            >
              <TrailStatsCards totalTrails={trails.length} inProgressCount={inProgressCount} completedCount={completedCount} totalXpEarned={totalXpEarned} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              <div className="lg:col-span-8 space-y-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h2 className="text-xl font-bold tracking-tight">Recomendações para Você</h2>
                  </div>
                  <TrailRecommendations />
                </motion.div>

                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.2 }} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card/30 backdrop-blur-md border border-border/50"
                  >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                      <TabsList className="bg-muted/50 p-1.5 rounded-xl border border-border/50 h-auto flex flex-wrap sm:flex-nowrap">
                        <TabsTrigger value="all" className="rounded-lg px-4 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Todas</TabsTrigger>
                        <TabsTrigger value="enrolled" className="rounded-lg px-4 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Em Curso</TabsTrigger>
                        <TabsTrigger value="available" className="rounded-lg px-4 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Novas</TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-lg px-4 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Concluídas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-full sm:w-[220px] bg-muted/50 border-none rounded-lg ring-offset-background focus:ring-1 focus:ring-primary/20">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-primary" />
                          <SelectValue placeholder="Departamento" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-xl bg-background/95">
                        <AllSelectItem label="Todos os Departamentos" />
                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <AICourseBuilderDialog />
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {filteredTrails.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <EmptyState
                          icon={SearchX}
                          title="Nenhuma trilha encontrada"
                          description="Tente ajustar os filtros para encontrar novos desafios."
                          action={{ label: "Limpar Filtros", onClick: () => { setSelectedDepartment("all"); setActiveTab("all"); } }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="grid gap-6 sm:grid-cols-2"
                      >
                        {filteredTrails.map((trail, index) => {
                          const lockedInfo = getLockedInfo(trail.id);
                          return (
                            <motion.div 
                              key={trail.id} 
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              transition={{ delay: index * 0.05 }}
                            >
                              <TrailCard 
                                trail={trail} 
                                enrollment={enrollmentMap.get(trail.id)} 
                                hasCertification={trailCertificationMap.has(trail.id)} 
                                certificationName={trailCertificationMap.get(trail.id)?.name} 
                                isLocked={lockedInfo.isLocked} 
                                missingPrerequisiteNames={lockedInfo.missingNames} 
                                isEnrolling={enrollingTrailId === trail.id} 
                                onEnroll={() => handleEnroll(trail.id)} 
                                onContinue={() => navigate(`/trails/${trail.id}`)} 
                              />
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.18 }}
                  className="sticky top-24"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Mapa de Carreira</h2>
                  </div>
                  <div className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-md overflow-hidden p-1 shadow-2xl">
                    <TrailDependencyTree />
                  </div>
                  
                  <Card variant="subtle" className="mt-8 overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Próximo Nível</h3>
                          <p className="text-sm text-muted-foreground">Complete trilhas para subir no ranking.</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Progressão Global</span>
                          <span>{completedCount}/{trails.length} Concluídas</span>
                        </div>
                        <Progress value={(completedCount / trails.length) * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
