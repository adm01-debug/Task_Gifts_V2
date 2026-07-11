import { supabase } from "@/integrations/supabase/client";
import { highPotentialService, HighPotentialScore } from "./highPotentialService";

export interface CriticalPosition {
  id: string;
  title: string;
  department: string;
  departmentId?: string;
  currentHolder?: {
    userId: string;
    name: string;
    avatarUrl?: string;
    tenure: number; // years
    retirementRisk: 'low' | 'medium' | 'high';
  };
  importance: 'critical' | 'high' | 'medium';
  successorCount: number;
  readyNowCount: number;
  readySoonCount: number;
  riskLevel: 'covered' | 'at_risk' | 'critical';
}

export interface SuccessorCandidate {
  userId: string;
  name: string;
  avatarUrl?: string;
  currentPosition?: string;
  department?: string;
  level: number;
  hipoScore: number;
  readiness: 'ready_now' | 'ready_1_year' | 'ready_2_years' | 'developing';
  readinessScore: number; // 0-100
  gaps: string[];
  strengths: string[];
  developmentActions: string[];
  matchScore: number; // 0-100 fit for the specific position
}

export interface SuccessionPlan {
  position: CriticalPosition;
  successors: SuccessorCandidate[];
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  benchStrength: number; // percentage of positions with ready successors
}

export const successionService = {
  async getCriticalPositions(): Promise<CriticalPosition[]> {
    // Get all positions
    const { data: positions } = await supabase
      .from("positions")
      .select("*")
      .order("name");

    if (!positions) return [];

    // Get user positions to find current holders
    const { data: userPositions } = await supabase
      .from("user_positions")
      .select("*")
      .eq("is_primary", true);

    // Get profiles separately
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at");

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get departments
    const { data: departments } = await supabase
      .from("departments")
      .select("*");

    const deptMap = new Map(departments?.map(d => [d.id, d.name]) || []);

    const criticalPositions: CriticalPosition[] = [];

    for (const position of positions) {
      const holders = userPositions?.filter(up => up.position_id === position.id) || [];
      const holder = holders[0];
      const holderProfile = holder ? profileMap.get(holder.user_id) : undefined;
      
      // Calculate tenure
      let tenure = 0;
      if (holderProfile?.created_at) {
        const createdAt = new Date(holderProfile.created_at);
        tenure = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365));
      }

      // Determine importance based on position name keywords
      let importance: 'critical' | 'high' | 'medium' = 'medium';
      const name = position.name.toLowerCase();
      if (name.includes('diretor') || name.includes('ceo') || name.includes('cto') || name.includes('cfo')) {
        importance = 'critical';
      } else if (name.includes('gerente') || name.includes('manager') || name.includes('líder') || name.includes('coordenador')) {
        importance = 'high';
      }

      const successorCount = 0;
      const readyNowCount = 0;
      const readySoonCount = 0;

      let riskLevel: 'covered' | 'at_risk' | 'critical' = 'critical';
      if (readyNowCount >= 1) {
        riskLevel = 'covered';
      } else if (successorCount >= 1) {
        riskLevel = 'at_risk';
      }

      criticalPositions.push({
        id: position.id,
        title: position.name,
        department: deptMap.get(position.department_id || '') || 'Geral',
        departmentId: position.department_id || undefined,
        currentHolder: holderProfile ? {
          userId: holderProfile.id,
          name: holderProfile.display_name || 'Não definido',
           avatarUrl: holderProfile.avatar_url || undefined,
          tenure,
          retirementRisk: tenure > 5 ? 'high' : tenure > 3 ? 'medium' : 'low',
        } : undefined,
        importance,
        successorCount,
        readyNowCount,
        readySoonCount,
        riskLevel,
      });
    }

    // Sort by importance and risk
    return criticalPositions.sort((a, b) => {
      const importanceOrder = { critical: 0, high: 1, medium: 2 };
      const riskOrder = { critical: 0, at_risk: 1, covered: 2 };
      
      if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      }
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
  },

  async findSuccessorCandidates(positionId: string, limit = 10): Promise<SuccessorCandidate[]> {
    // Get position details
    const { data: position } = await supabase
      .from("positions")
      .select("*")
      .eq("id", positionId)
      .single();

    if (!position) return [];

    // Get high potentials from the same or related department
     const hiPos = await highPotentialService.identifyHighPotentials(position.department_id || undefined);

    // Filter and score candidates
    const candidates: SuccessorCandidate[] = [];

    for (const hipo of hiPos.slice(0, limit * 2)) {
      // Skip if they already hold this position
      const { data: currentPosition } = await supabase
        .from("user_positions")
        .select("position_id")
        .eq("user_id", hipo.userId)
        .eq("is_primary", true)
        .maybeSingle();

      if (currentPosition?.position_id === positionId) continue;

      // Calculate match score based on various factors
       const matchScore = this.calculateMatchScore(hipo);
      
      // Determine readiness
      const { readiness, readinessScore } = this.determineReadiness(hipo, matchScore);

      // Generate gaps and development actions
      const gaps = this.identifyGaps(hipo);
      const developmentActions = this.suggestDevelopmentActions(gaps, readiness);

      candidates.push({
        userId: hipo.userId,
        name: hipo.displayName,
        avatarUrl: hipo.avatarUrl,
        currentPosition: hipo.position,
        department: hipo.department,
        level: hipo.level,
        hipoScore: hipo.overallScore,
        readiness,
        readinessScore,
        gaps,
        strengths: hipo.strengths,
        developmentActions,
        matchScore,
      });
    }

    // Sort by match score
    return candidates
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  },

  calculateMatchScore(hipo: HighPotentialScore, _position?: CriticalPosition): number {
    let score = 0;

    // Base score from HiPo assessment
    score += hipo.overallScore * 0.5;

    // Bonus for leadership readiness
    if (hipo.readyFor.some(r => r.toLowerCase().includes('liderança') || r.toLowerCase().includes('promoção'))) {
      score += 20;
    }

    // Bonus for high performance factor
    score += (hipo.factors.performance / 100) * 15;

    // Bonus for growth potential
    score += (hipo.factors.growth / 100) * 15;

    return Math.min(100, Math.round(score));
  },

  determineReadiness(hipo: HighPotentialScore, matchScore: number): { readiness: SuccessorCandidate['readiness']; readinessScore: number } {
    const readinessScore = Math.round((hipo.overallScore * 0.6 + matchScore * 0.4));

    if (readinessScore >= 85) {
      return { readiness: 'ready_now', readinessScore };
    } else if (readinessScore >= 70) {
      return { readiness: 'ready_1_year', readinessScore };
    } else if (readinessScore >= 55) {
      return { readiness: 'ready_2_years', readinessScore };
    }
    return { readiness: 'developing', readinessScore };
  },

  identifyGaps(hipo: HighPotentialScore): string[] {
    const gaps: string[] = [];
    
    if (hipo.factors.performance < 60) gaps.push('Melhorar performance geral');
    if (hipo.factors.learning < 60) gaps.push('Investir em capacitação');
    if (hipo.factors.engagement < 60) gaps.push('Aumentar engajamento');
    if (hipo.factors.collaboration < 60) gaps.push('Desenvolver habilidades colaborativas');
    if (hipo.factors.growth < 60) gaps.push('Acelerar crescimento');
    if (!hipo.readyFor.some(r => r.includes('Liderança'))) gaps.push('Desenvolver liderança');

    return gaps.slice(0, 4);
  },

  suggestDevelopmentActions(gaps: string[], readiness: SuccessorCandidate['readiness']): string[] {
    const actions: string[] = [];

    if (readiness === 'ready_now') {
      actions.push('Preparar transição gradual');
      actions.push('Aumentar exposição a decisões estratégicas');
    } else if (readiness === 'ready_1_year') {
      actions.push('Programa de mentoria intensiva');
      actions.push('Projetos de alta visibilidade');
    } else if (readiness === 'ready_2_years') {
      actions.push('PDI focado em liderança');
      actions.push('Job rotation em áreas-chave');
    } else {
      actions.push('Desenvolver competências técnicas');
      actions.push('Acompanhamento próximo de gestor');
    }

    // Add gap-specific actions
    if (gaps.includes('Desenvolver liderança')) {
      actions.push('Curso de liderança executiva');
    }
    if (gaps.includes('Melhorar performance geral')) {
      actions.push('Coaching de performance');
    }

    return actions.slice(0, 4);
  },

  async getSuccessionPlan(positionId: string): Promise<SuccessionPlan> {
    const positions = await this.getCriticalPositions();
    const position = positions.find(p => p.id === positionId);

    if (!position) {
      throw new Error('Position not found');
    }

    const successors = await this.findSuccessorCandidates(positionId);

    // Calculate risk assessment
    const readyNowCount = successors.filter(s => s.readiness === 'ready_now').length;
    const readySoonCount = successors.filter(s => s.readiness === 'ready_1_year').length;

    let overallRisk: 'low' | 'medium' | 'high' = 'high';
    const factors: string[] = [];
    const recommendations: string[] = [];

    if (readyNowCount >= 2) {
      overallRisk = 'low';
      factors.push(`${readyNowCount} sucessores prontos imediatamente`);
    } else if (readyNowCount >= 1) {
      overallRisk = 'medium';
      factors.push('Apenas 1 sucessor pronto - desenvolver backup');
    } else if (readySoonCount >= 1) {
      overallRisk = 'medium';
      factors.push('Nenhum sucessor pronto imediatamente');
      recommendations.push('Acelerar desenvolvimento do pipeline');
    } else {
      overallRisk = 'high';
      factors.push('Sem sucessores identificados ou em desenvolvimento');
      recommendations.push('Urgente: iniciar programa de desenvolvimento');
      recommendations.push('Considerar contratação externa');
    }

    if (position.currentHolder?.retirementRisk === 'high') {
      factors.push('Titular com alto risco de saída');
      if (overallRisk === 'low') overallRisk = 'medium';
    }

    if (position.importance === 'critical' && overallRisk !== 'low') {
      recommendations.push('Posição crítica requer atenção imediata');
    }

    const benchStrength = successors.length > 0
      ? Math.round((readyNowCount / successors.length) * 100)
      : 0;

    return {
      position,
      successors,
      riskAssessment: {
        overallRisk,
        factors,
        recommendations,
      },
      benchStrength,
    };
  },

  async getOverallSuccessionHealth(): Promise<{
    totalPositions: number;
    coveredPositions: number;
    atRiskPositions: number;
    criticalPositions: number;
    benchStrength: number;
    topRisks: CriticalPosition[];
  }> {
    const positions = await this.getCriticalPositions();

    const covered = positions.filter(p => p.riskLevel === 'covered').length;
    const atRisk = positions.filter(p => p.riskLevel === 'at_risk').length;
    const critical = positions.filter(p => p.riskLevel === 'critical').length;

    return {
      totalPositions: positions.length,
      coveredPositions: covered,
      atRiskPositions: atRisk,
      criticalPositions: critical,
      benchStrength: positions.length > 0 ? Math.round((covered / positions.length) * 100) : 0,
      topRisks: positions.filter(p => p.importance === 'critical' && p.riskLevel !== 'covered').slice(0, 5),
    };
  },
};
