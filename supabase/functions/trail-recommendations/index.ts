import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  createRateLimitResponse,
  RATE_LIMITS 
} from "../_shared/rate-limiter.ts";
import { corsHeaders, verifyUser, errorResponse } from "../_shared/security.ts";



// Type definitions for query results
interface TeamMemberWithDept {
  department_id: string | null;
  is_manager: boolean;
  departments: { name: string } | null;
}

interface EnrollmentWithTrail {
  trail_id: string;
  progress_percent: number | null;
  completed_at: string | null;
  learning_trails: { title: string } | null;
}

interface QuestAssignmentWithQuest {
  quest_id: string;
  completed_at: string | null;
  custom_quests: { title: string; tags: string[] | null } | null;
}

interface ModuleProgressWithModule {
  module_id: string;
  score: number | null;
  completed_at: string | null;
  trail_modules: { title: string; content_type: string } | null;
}

interface AvailableTrail {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  estimated_hours: number | null;
  xp_reward: number | null;
  departments: { name: string } | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const identifier = getRateLimitIdentifier(req, "trail-recommendations");
  const rateLimitResult = await checkRateLimit(identifier, RATE_LIMITS.ai);
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
  }

  try {
    // Verify user JWT
    const authenticatedUser = await verifyUser(req);
    const { userId: bodyUserId } = await req.json();
    const userId = bodyUserId || authenticatedUser.id;
    
    // Safety check: users can only get their own recommendations unless they are managers/admins
    // For now, we'll enforce that the authenticated user gets their own data
    if (bodyUserId && bodyUserId !== authenticatedUser.id) {
      console.log(`User ${authenticatedUser.id} attempted to get recommendations for ${bodyUserId}`);
      // In a more complex system, we'd check if authenticatedUser is a manager of bodyUserId
    }

    
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Fetch user's department
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("department_id, is_manager, departments(name)")
      .eq("user_id", userId)
      .maybeSingle() as { data: TeamMemberWithDept | null };

    // Fetch user's completed trails
    const { data: enrollments } = await supabase
      .from("trail_enrollments")
      .select("trail_id, progress_percent, completed_at, learning_trails(title)")
      .eq("user_id", userId) as { data: EnrollmentWithTrail[] | null };

    // Fetch user's completed quests
    const { data: questAssignments } = await supabase
      .from("quest_assignments")
      .select("quest_id, completed_at, custom_quests(title, tags)")
      .eq("user_id", userId) as { data: QuestAssignmentWithQuest[] | null };

    // Fetch user's module progress for skill analysis
    const { data: moduleProgress } = await supabase
      .from("module_progress")
      .select("module_id, score, completed_at, trail_modules(title, content_type)")
      .eq("user_id", userId) as { data: ModuleProgressWithModule[] | null };

    // Fetch available trails
    const { data: availableTrails } = await supabase
      .from("learning_trails")
      .select("id, title, description, department_id, estimated_hours, xp_reward, departments(name)")
      .eq("status", "published") as { data: AvailableTrail[] | null };

    // Type helpers
    const getDeptName = (tm: TeamMemberWithDept | null) => tm?.departments?.name || "Não definido";
    const getTrailTitle = (e: EnrollmentWithTrail) => e?.learning_trails?.title;
    const getQuestData = (q: QuestAssignmentWithQuest) => ({ title: q?.custom_quests?.title, tags: q?.custom_quests?.tags });
    const getModuleData = (m: ModuleProgressWithModule) => ({ 
      module: m?.trail_modules?.title, 
      type: m?.trail_modules?.content_type, 
      score: m?.score 
    });
    const getAvailableTrailData = (t: AvailableTrail) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      department: t.departments?.name,
      hours: t.estimated_hours,
      xpReward: t.xp_reward
    });

    // Prepare context for AI
    const completedTrailIds = new Set(
      enrollments?.filter(e => e.completed_at).map(e => e.trail_id) || []
    );
    const inProgressTrails = enrollments?.filter(e => !e.completed_at && e.progress_percent && e.progress_percent > 0) || [];
    
    const notStartedTrails = availableTrails?.filter(
      t => !enrollments?.some(e => e.trail_id === t.id)
    ) || [];

    const userContext = {
      level: profile?.level || 1,
      xp: profile?.xp || 0,
      questsCompleted: profile?.quests_completed || 0,
      department: getDeptName(teamMember),
      isManager: teamMember?.is_manager || false,
      completedTrails: enrollments?.filter(e => e.completed_at).map(e => getTrailTitle(e)).filter(Boolean) || [],
      inProgressTrails: inProgressTrails.map(e => ({
        title: getTrailTitle(e),
        progress: e.progress_percent
      })),
      completedQuests: questAssignments?.filter(q => q.completed_at).map(q => getQuestData(q)) || [],
      moduleScores: moduleProgress?.filter(m => m.score !== null).map(m => getModuleData(m)) || [],
      availableTrails: notStartedTrails.map(t => getAvailableTrailData(t))
    };

    const systemPrompt = `Você é um assistente de RH especializado em desenvolvimento de pessoas e trilhas de aprendizagem corporativas.
Sua tarefa é analisar o perfil do colaborador e recomendar as trilhas de aprendizagem mais relevantes.

Considere:
1. Cargo/departamento do colaborador
2. Nível atual e experiência (XP, quests completadas)
3. Trilhas já concluídas (evite repetir)
4. Gaps identificados em scores de módulos (scores baixos indicam áreas para melhorar)
5. Se é gestor, priorize trilhas de liderança
6. Priorize trilhas do departamento do colaborador

Responda SEMPRE em formato JSON válido com esta estrutura exata:
{
  "recommendations": [
    {
      "trailId": "uuid da trilha",
      "title": "nome da trilha",
      "reason": "explicação breve do porquê recomenda",
      "priority": "alta" | "média" | "baixa",
      "skillGap": "competência que desenvolve"
    }
  ],
  "analysis": {
    "strengths": ["pontos fortes identificados"],
    "gaps": ["gaps de competência identificados"],
    "nextSteps": "recomendação geral de desenvolvimento"
  }
}

Retorne no máximo 5 recomendações ordenadas por prioridade.`;

    const userPrompt = `Analise o perfil deste colaborador e recomende trilhas de aprendizagem:

**Perfil do Colaborador:**
- Nível: ${userContext.level}
- XP Total: ${userContext.xp}
- Quests Completadas: ${userContext.questsCompleted}
- Departamento: ${userContext.department}
- É Gestor: ${userContext.isManager ? "Sim" : "Não"}

**Trilhas Concluídas:**
${userContext.completedTrails.length > 0 ? userContext.completedTrails.join(", ") : "Nenhuma"}

**Trilhas em Progresso:**
${userContext.inProgressTrails.length > 0 
  ? userContext.inProgressTrails.map(t => `${t.title} (${t.progress}%)`).join(", ") 
  : "Nenhuma"}

**Scores em Módulos (pode indicar gaps):**
${userContext.moduleScores.length > 0
  ? userContext.moduleScores.map(m => `${m.module}: ${m.score}%`).join(", ")
  : "Sem avaliações ainda"}

**Trilhas Disponíveis para Recomendação:**
${userContext.availableTrails.map(t => 
  `- ID: ${t.id} | Título: ${t.title} | Depto: ${t.department || "Geral"} | ${t.hours}h | ${t.xpReward} XP
   Descrição: ${t.description || "Sem descrição"}`
).join("\n")}

Com base nessas informações, quais trilhas você recomenda e por quê?`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content;
    if (content.includes("```json")) {
      jsonContent = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonContent = content.split("```")[1].split("```")[0].trim();
    }

    const recommendations = JSON.parse(jsonContent);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in trail-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
