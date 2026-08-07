import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PDIAlert {
  id: string;
  type: "pdi_overdue" | "pdi_expiring" | "low_performance" | "competency_gap" | "certification_expiring";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  userId?: string;
  userName?: string | null;
  userAvatar?: string | null;
  relatedId?: string;
  dueDate?: string;
  createdAt: string;
}

interface PDIData {
  id: string;
  title: string;
  target_date: string | null;
  status: string;
  user_id: string;
}

interface ActionData {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  plan_id: string;
}

interface NineBoxEvaluation {
  id: string;
  user_id: string;
  box_position: number;
  performance_score: number;
  potential_score: number;
  created_at: string;
}

interface UserCertification {
  id: string;
  user_id: string;
  expires_at: string | null;
  status: string;
  certification_id: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

async function fetchPDIAlerts(_departmentId?: string): Promise<PDIAlert[]> {
  const alerts: PDIAlert[] = [];
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1. PDIs vencidos ou próximos de vencer
  const { data: pdiData } = await supabase
    .from("development_plans")
    .select(`
      id,
      title,
      target_date,
      status,
      user_id
    `)
    .in("status", ["active", "in_progress"])
    .order("target_date", { ascending: true });

  // Get profiles separately
  const userIds = [...new Set((pdiData as PDIData[] | null)?.map(p => p.user_id) || [])];
  const { data: profiles } = userIds.length > 0 
    ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
    : { data: [] };
  
  const profileMap = new Map<string, Profile>();
  (profiles as Profile[] | null)?.forEach(p => profileMap.set(p.id, p));

  (pdiData as PDIData[] | null)?.forEach((pdi) => {
    if (!pdi.target_date) return;
    const targetDate = new Date(pdi.target_date);
    const profile = profileMap.get(pdi.user_id);

    if (targetDate < now) {
      alerts.push({
        id: `pdi-overdue-${pdi.id}`,
        type: "pdi_overdue",
        severity: "critical",
        title: "PDI Vencido",
        description: `O plano "${pdi.title}" de ${profile?.display_name || "colaborador"} está vencido`,
        userId: pdi.user_id,
        userName: profile?.display_name,
        userAvatar: profile?.avatar_url,
        relatedId: pdi.id,
        dueDate: pdi.target_date,
        createdAt: now.toISOString(),
      });
    } else if (targetDate <= in7Days) {
      alerts.push({
        id: `pdi-expiring-${pdi.id}`,
        type: "pdi_expiring",
        severity: "warning",
        title: "PDI Vencendo em Breve",
        description: `O plano "${pdi.title}" vence em menos de 7 dias`,
        userId: pdi.user_id,
        userName: profile?.display_name,
        userAvatar: profile?.avatar_url,
        relatedId: pdi.id,
        dueDate: pdi.target_date,
        createdAt: now.toISOString(),
      });
    }
  });

  // 2. Ações de PDI vencidas
  const { data: actionsData } = await supabase
    .from("development_plan_actions")
    .select(`
      id,
      title,
      due_date,
      status,
      plan_id
    `)
    .in("status", ["pending", "in_progress"])
    .lt("due_date", now.toISOString())
    .limit(20);

  // Get plan info for actions
  const planIds = [...new Set((actionsData as ActionData[] | null)?.map(a => a.plan_id) || [])];
  const { data: plans } = planIds.length > 0
    ? await supabase.from("development_plans").select("id, user_id").in("id", planIds)
    : { data: [] };
  
  const planMap = new Map<string, { id: string; user_id: string }>();
  (plans as { id: string; user_id: string }[] | null)?.forEach(p => planMap.set(p.id, p));

  (actionsData as ActionData[] | null)?.forEach((action) => {
    const plan = planMap.get(action.plan_id);
    const profile = plan ? profileMap.get(plan.user_id) : null;
    
    alerts.push({
      id: `action-overdue-${action.id}`,
      type: "pdi_overdue",
      severity: "warning",
      title: "Ação de PDI Vencida",
      description: `A ação "${action.title}" está pendente e vencida`,
      userId: plan?.user_id,
      userName: profile?.display_name,
      userAvatar: profile?.avatar_url,
      relatedId: action.plan_id,
      dueDate: action.due_date ?? undefined,
      createdAt: now.toISOString(),
    });
  });

  // 3. Avaliações 9-Box com baixo desempenho
  const { data: lowPerformance } = await supabase
    .from("nine_box_evaluations")
    .select(`
      id,
      user_id,
      box_position,
      performance_score,
      potential_score,
      created_at
    `)
    .in("box_position", [1, 4]) // Baixo desempenho
    .order("created_at", { ascending: false })
    .limit(10);

  // Deduplicate by user_id (keep only latest evaluation)
  const latestByUser = new Map<string, NineBoxEvaluation>();
  (lowPerformance as NineBoxEvaluation[] | null)?.forEach((eval_) => {
    if (!latestByUser.has(eval_.user_id)) {
      latestByUser.set(eval_.user_id, eval_);
    }
  });

  latestByUser.forEach((eval_) => {
    const profile = profileMap.get(eval_.user_id);
    alerts.push({
      id: `low-perf-${eval_.id}`,
      type: "low_performance",
      severity: eval_.box_position === 1 ? "critical" : "warning",
      title: "Baixo Desempenho Identificado",
      description: `${profile?.display_name || "Colaborador"} está na posição ${eval_.box_position} da matriz 9-Box`,
      userId: eval_.user_id,
      userName: profile?.display_name,
      userAvatar: profile?.avatar_url,
      relatedId: eval_.id,
      createdAt: eval_.created_at,
    });
  });

  // 4. Certificações expirando
  const { data: certifications } = await supabase
    .from("user_certifications")
    .select(`
      id,
      user_id,
      expires_at,
      status,
      certification_id
    `)
    .eq("status", "active")
    .lt("expires_at", in30Days.toISOString())
    .gt("expires_at", now.toISOString())
    .limit(10);

  if (certifications && certifications.length > 0) {
    const certIds = [...new Set((certifications as UserCertification[]).map(c => c.certification_id))];
    const { data: certInfo } = await supabase
      .from("certifications")
      .select("id, name")
      .in("id", certIds);
    
    const certMap = new Map((certInfo as { id: string; name: string }[] | null)?.map(c => [c.id, c]) || []);

    (certifications as UserCertification[]).forEach((cert) => {
      const profile = profileMap.get(cert.user_id);
      const certification = certMap.get(cert.certification_id);
      const expiresAt = cert.expires_at ? new Date(cert.expires_at) : null;
      const isUrgent = expiresAt ? expiresAt <= in7Days : false;

      alerts.push({
        id: `cert-expiring-${cert.id}`,
        type: "certification_expiring",
        severity: isUrgent ? "warning" : "info",
        title: "Certificação Expirando",
        description: `A certificação "${certification?.name || "N/A"}" de ${profile?.display_name || "colaborador"} expira em breve`,
        userId: cert.user_id,
        userName: profile?.display_name,
        userAvatar: profile?.avatar_url,
        relatedId: cert.id,
        dueDate: cert.expires_at ?? undefined,
        createdAt: now.toISOString(),
      });
    });
  }

  // Sort by severity and date
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function usePDIAlerts(departmentId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pdi-alerts", departmentId],
    queryFn: () => fetchPDIAlerts(departmentId),
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePDIAlertCounts() {
  const { data: alerts } = usePDIAlerts();

  return {
    critical: alerts?.filter((a) => a.severity === "critical").length || 0,
    warning: alerts?.filter((a) => a.severity === "warning").length || 0,
    info: alerts?.filter((a) => a.severity === "info").length || 0,
    total: alerts?.length || 0,
  };
}
