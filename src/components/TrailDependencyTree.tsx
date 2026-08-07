import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitBranch, ChevronDown, ChevronRight, CheckCircle2, 
  Lock, Play, Trophy, Sparkles, ZoomIn, ZoomOut, Maximize2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedTrails, useUserEnrollments, useTrailPrerequisites } from "@/hooks/useTrails";
import type { LearningTrail, TrailEnrollment, TrailPrerequisite } from "@/services/trailsService";

interface TreeNode {
  trail: LearningTrail;
  children: TreeNode[];
  depth: number;
  isCompleted: boolean;
  isInProgress: boolean;
  isLocked: boolean;
}

function buildDependencyTree(
  trails: LearningTrail[],
  prerequisites: TrailPrerequisite[],
  completedTrailIds: Set<string>,
  inProgressTrailIds: Set<string>
): TreeNode[] {
  const trailMap = new Map(trails.map(t => [t.id, t]));
  
  // Find trails that have prerequisites (child trails)
  const childTrailIds = new Set(prerequisites.map(p => p.trail_id));
  
  // Find root trails (trails that are prerequisites but have no prerequisites themselves)
  const prereqTrailIds = new Set(prerequisites.map(p => p.prerequisite_trail_id));
  const rootTrailIds = new Set<string>();
  
  // A root is a trail that is a prerequisite for something but has no prerequisites itself
  prereqTrailIds.forEach(id => {
    if (!childTrailIds.has(id)) {
      rootTrailIds.add(id);
    }
  });

  // Also add trails that have no relationship at all (standalone)
  trails.forEach(t => {
    if (!childTrailIds.has(t.id) && !prereqTrailIds.has(t.id)) {
      rootTrailIds.add(t.id);
    }
  });

  // Build prerequisite map: trail_id -> array of prerequisite_trail_ids
  const prereqMap = new Map<string, string[]>();
  prerequisites.forEach(p => {
    const existing = prereqMap.get(p.trail_id) || [];
    existing.push(p.prerequisite_trail_id);
    prereqMap.set(p.trail_id, existing);
  });

  // Build children map: prerequisite_trail_id -> array of trail_ids that depend on it
  const childrenMap = new Map<string, string[]>();
  prerequisites.forEach(p => {
    const existing = childrenMap.get(p.prerequisite_trail_id) || [];
    existing.push(p.trail_id);
    childrenMap.set(p.prerequisite_trail_id, existing);
  });

  const checkIsLocked = (trailId: string): boolean => {
    const prereqs = prereqMap.get(trailId) || [];
    if (prereqs.length === 0) return false;
    return prereqs.some(pid => !completedTrailIds.has(pid));
  };

  const buildNode = (trailId: string, depth: number, visited: Set<string>): TreeNode | null => {
    if (visited.has(trailId)) return null; // Prevent cycles
    const trail = trailMap.get(trailId);
    if (!trail) return null;

    visited.add(trailId);

    const childIds = childrenMap.get(trailId) || [];
    const children = childIds
      .map(cid => buildNode(cid, depth + 1, new Set(visited)))
      .filter((n): n is TreeNode => n !== null);

    return {
      trail,
      children,
      depth,
      isCompleted: completedTrailIds.has(trailId),
      isInProgress: inProgressTrailIds.has(trailId),
      isLocked: checkIsLocked(trailId),
    };
  };

  const roots: TreeNode[] = [];
  const visited = new Set<string>();

  rootTrailIds.forEach(id => {
    const node = buildNode(id, 0, new Set());
    if (node) {
      roots.push(node);
      visited.add(id);
    }
  });

  return roots;
}

function TreeNodeCard({ 
  node, 
  isLast,
  parentConnector = false,
}: { 
  node: TreeNode; 
  isLast: boolean;
  parentConnector?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  const statusColor = node.isCompleted 
    ? "border-emerald-500 bg-emerald-500/10" 
    : node.isInProgress 
      ? "border-amber-500 bg-amber-500/10"
      : node.isLocked
        ? "border-muted-foreground/50 bg-muted/50 opacity-60"
        : "border-primary/50 bg-primary/10";

  const StatusIcon = node.isCompleted 
    ? CheckCircle2 
    : node.isInProgress 
      ? Play 
      : node.isLocked 
        ? Lock 
        : Sparkles;

  const statusIconColor = node.isCompleted 
    ? "text-emerald-500" 
    : node.isInProgress 
      ? "text-amber-500"
      : node.isLocked
        ? "text-muted-foreground"
        : "text-primary";

  return (
    <div className="relative">
      {/* Connector line from parent */}
      {parentConnector && (
        <div className="absolute -left-8 top-0 h-8 w-8">
          <div className="absolute left-0 top-0 h-8 w-px bg-border" />
          <div className="absolute left-0 top-8 h-px w-8 bg-border" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: node.depth * 0.1 }}
        className="mb-3"
      >
        <div className={`relative flex items-start gap-3 p-3 rounded-lg border-2 ${statusColor} transition-all duration-200 hover:shadow-md`}>
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Recolher dependências' : 'Expandir dependências'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {!hasChildren && <div className="w-6" />}

          {/* Trail icon */}
          <div className="text-2xl shrink-0">{node.trail.icon}</div>

          {/* Trail info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm truncate">{node.trail.title}</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <StatusIcon className={`h-4 w-4 ${statusIconColor}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    {node.isCompleted ? "Concluída" : node.isInProgress ? "Em andamento" : node.isLocked ? "Bloqueada" : "Disponível"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {node.trail.xp_reward} XP
              </Badge>
              {node.trail.badge_name && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Trophy className="h-3 w-3" />
                  {node.trail.badge_icon}
                </Badge>
              )}
              {hasChildren && (
                <Badge variant="outline" className="text-xs gap-1">
                  <GitBranch className="h-3 w-3" />
                  {node.children.length} dependente{node.children.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-8 mt-2 pl-6 border-l-2 border-border"
            >
              {node.children.map((child, index) => (
                <TreeNodeCard 
                  key={child.trail.id} 
                  node={child} 
                  isLast={index === node.children.length - 1}
                  parentConnector={false}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function TreeVisualization({ 
  roots, 
  zoom = 1 
}: { 
  roots: TreeNode[];
  zoom?: number;
}) {
  if (roots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma dependência configurada ainda</p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-4 transition-transform duration-200 origin-top-left"
      style={{ transform: `scale(${zoom})` }}
    >
      {roots.map((root, index) => (
        <TreeNodeCard 
          key={root.trail.id} 
          node={root} 
          isLast={index === roots.length - 1}
        />
      ))}
    </div>
  );
}

export function TrailDependencyTree() {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(0.5, prev - 0.1)), []);
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(1.5, prev + 0.1)), []);

  const { data: trails = [], isLoading: isLoadingTrails } = usePublishedTrails();
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useUserEnrollments();
  const { data: prerequisites = [], isLoading: isLoadingPrerequisites } = useTrailPrerequisites();

  const isLoading = isLoadingTrails || isLoadingEnrollments || isLoadingPrerequisites;

  const completedTrailIds = useMemo(() => {
    return new Set(
      enrollments
        .filter(e => e.completed_at)
        .map(e => e.trail_id)
    );
  }, [enrollments]);

  const inProgressTrailIds = useMemo(() => {
    return new Set(
      enrollments
        .filter(e => !e.completed_at)
        .map(e => e.trail_id)
    );
  }, [enrollments]);

  const treeRoots = useMemo(() => {
    return buildDependencyTree(trails, prerequisites, completedTrailIds, inProgressTrailIds);
  }, [trails, prerequisites, completedTrailIds, inProgressTrailIds]);

  // Stats
  const stats = useMemo(() => {
    const withPrereqs = new Set(prerequisites.map(p => p.trail_id)).size;
    const arePrereqs = new Set(prerequisites.map(p => p.prerequisite_trail_id)).size;
    return {
      totalTrails: trails.length,
      withPrerequisites: withPrereqs,
      arePrerequisites: arePrereqs,
      standalone: trails.length - withPrereqs - (arePrereqs - new Set([...prerequisites.map(p => p.trail_id)].filter(id => 
        prerequisites.some(pp => pp.prerequisite_trail_id === id)
      )).size),
    };
  }, [trails, prerequisites]);

  const SkeletonContent = (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
          {i === 1 && (
            <div className="ml-8 pl-6 border-l-2 border-border space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-border">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const TreeContent = isLoading ? SkeletonContent : (
    <>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500/20" />
          <span>Concluída</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-500/20" />
          <span>Em andamento</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded border-2 border-primary bg-primary/20" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded border-2 border-muted-foreground/50 bg-muted/50 opacity-60" />
          <span>Bloqueada</span>
        </div>
      </div>

      {/* Tree */}
      <ScrollArea className="h-[500px] pr-4">
        <TreeVisualization roots={treeRoots} zoom={zoom} />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Árvore de Dependências</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize a hierarquia entre trilhas de aprendizado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 1.5}
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Fullscreen dialog */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Expandir tela cheia">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Árvore de Dependências
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {TreeContent}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <Badge variant="secondary" className="gap-1">
            <span className="font-bold">{stats.totalTrails}</span> trilhas
          </Badge>
          <Badge variant="outline" className="gap-1">
            <GitBranch className="h-3 w-3" />
            <span className="font-bold">{stats.withPrerequisites}</span> com pré-requisitos
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="font-bold">{stats.arePrerequisites}</span> são pré-requisitos
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {TreeContent}
      </CardContent>
    </Card>
  );
}