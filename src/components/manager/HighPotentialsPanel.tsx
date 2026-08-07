import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  TrendingUp, 
  AlertTriangle, 
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  BookOpen,
  Users,
  Zap,
  Award,
  Shield,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHighPotentialsManual } from "@/hooks/useHighPotentials";
import { useDepartments } from "@/hooks/useDepartments";
import { HighPotentialScore } from "@/services/highPotentialService";

interface HighPotentialsPanelProps {
  initialDepartmentId?: string;
}

export function HighPotentialsPanel({ initialDepartmentId }: HighPotentialsPanelProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(initialDepartmentId);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { data: departments = [] } = useDepartments();
  const { data: hiPos, isLoading, identify } = useHighPotentialsManual();

  const handleIdentify = () => {
    identify(selectedDepartment);
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Alto Risco</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1"><Shield className="h-3 w-3" />Médio</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1"><Shield className="h-3 w-3" />Baixo</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-muted-foreground";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30";
    if (score >= 60) return "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30";
    return "bg-muted/50";
  };

  const HiPoCard = ({ hipo, index }: { hipo: HighPotentialScore; index: number }) => (
    <Collapsible
      open={expandedUser === hipo.userId}
      onOpenChange={(open) => setExpandedUser(open ? hipo.userId : null)}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className={`${getScoreBg(hipo.overallScore)} transition-all hover:shadow-md`}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={hipo.avatarUrl} />
                      <AvatarFallback>{hipo.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className={`h-4 w-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {hipo.displayName}
                      {hipo.overallScore >= 80 && (
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {hipo.position || hipo.department || `Nível ${hipo.level}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(hipo.overallScore)}`}>
                      {hipo.overallScore}
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>
                  {expandedUser === hipo.userId ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Factor Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                <FactorBar label="Performance" value={hipo.factors.performance} icon={Target} />
                <FactorBar label="Aprendizado" value={hipo.factors.learning} icon={BookOpen} />
                <FactorBar label="Engajamento" value={hipo.factors.engagement} icon={Zap} />
                <FactorBar label="Consistência" value={hipo.factors.consistency} icon={TrendingUp} />
                <FactorBar label="Colaboração" value={hipo.factors.collaboration} icon={Users} />
                <FactorBar label="Crescimento" value={hipo.factors.growth} icon={TrendingUp} />
              </div>

              {/* Strengths */}
              {hipo.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Pontos Fortes</p>
                  <div className="flex flex-wrap gap-1">
                    {hipo.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready For */}
              {hipo.readyFor.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Pronto Para</p>
                  <div className="flex flex-wrap gap-1">
                    {hipo.readyFor.map((item, idx) => (
                      <Badge key={idx} className="text-xs bg-primary/10 text-primary border-primary/30">
                        <Award className="h-3 w-3 mr-1" />
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk & Recommendation */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Risco de Saída:</span>
                  {getRiskBadge(hipo.riskOfLeaving)}
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Recomendação</p>
                <p className="text-sm">{hipo.recommendation}</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </motion.div>
    </Collapsible>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Identificação de High Potentials</CardTitle>
              <CardDescription>Análise automática de talentos de alto potencial</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedDepartment || "all"} onValueChange={(v) => setSelectedDepartment(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleIdentify} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? "Analisando..." : "Identificar HiPos"}
          </Button>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Analisando perfis e calculando scores...</p>
            </div>
          </div>
        ) : hiPos.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium mb-2">Nenhuma análise realizada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em "Identificar HiPos" para analisar os colaboradores
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Card className="p-3 text-center bg-green-500/10 border-green-500/30">
                  <div className="text-2xl font-bold text-green-600">
                    {hiPos.filter(h => h.overallScore >= 80).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Star Players</div>
                </Card>
                <Card className="p-3 text-center bg-amber-500/10 border-amber-500/30">
                  <div className="text-2xl font-bold text-amber-600">
                    {hiPos.filter(h => h.overallScore >= 60 && h.overallScore < 80).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Alto Potencial</div>
                </Card>
                <Card className="p-3 text-center bg-red-500/10 border-red-500/30">
                  <div className="text-2xl font-bold text-red-600">
                    {hiPos.filter(h => h.riskOfLeaving === 'high').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Risco de Saída</div>
                </Card>
              </div>

              {/* HiPo Cards */}
              {hiPos.map((hipo, index) => (
                <HiPoCard key={hipo.userId} hipo={hipo} index={index} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function FactorBar({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
