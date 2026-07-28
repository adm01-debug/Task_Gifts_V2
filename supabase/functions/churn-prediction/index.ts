import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  createRateLimitResponse,
  RATE_LIMITS 
} from "../_shared/rate-limiter.ts";
import { corsHeaders, verifyUser } from "../_shared/security.ts";


interface UserMetrics {
  userId: string;
  displayName: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  questsCompleted: number;
  lastActiveDate: string;
  daysInactive: number;
  attendancePunctualityRate: number;
  kudosReceived: number;
  kudosSent: number;
  trailsEnrolled: number;
  trailsCompleted: number;
  avgComboMultiplier: number;
  recentXpGain: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting (AI function, stricter limits)
  const identifier = getRateLimitIdentifier(req, "churn-prediction");
  const rateLimitResult = await checkRateLimit(identifier, RATE_LIMITS.ai);
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
  }

  try {
    // Verify user JWT
    await verifyUser(req);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, email, level, xp, streak, quests_completed, updated_at');

    if (profilesError) throw profilesError;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch additional metrics for each user
    const userMetrics: UserMetrics[] = await Promise.all(
      profiles.map(async (profile) => {
        // Get attendance records
        const { data: attendance } = await supabase
          .from('attendance_records')
          .select('is_punctual, check_in')
          .eq('user_id', profile.id)
          .gte('check_in', thirtyDaysAgo.toISOString());

        const punctualDays = attendance?.filter(a => a.is_punctual).length || 0;
        const totalAttendance = attendance?.length || 1;
        const punctualityRate = Math.round((punctualDays / totalAttendance) * 100);

        // Get kudos received
        const { count: kudosReceived } = await supabase
          .from('kudos')
          .select('*', { count: 'exact', head: true })
          .eq('to_user_id', profile.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Get kudos sent
        const { count: kudosSent } = await supabase
          .from('kudos')
          .select('*', { count: 'exact', head: true })
          .eq('from_user_id', profile.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Get trail enrollments
        const { data: enrollments } = await supabase
          .from('trail_enrollments')
          .select('completed_at')
          .eq('user_id', profile.id);

        const trailsEnrolled = enrollments?.length || 0;
        const trailsCompleted = enrollments?.filter(e => e.completed_at).length || 0;

        // Get combo data
        const { data: combos } = await supabase
          .from('user_combos')
          .select('current_multiplier')
          .eq('user_id', profile.id)
          .gte('combo_date', sevenDaysAgo.toISOString().split('T')[0]);

        const avgCombo = combos?.length 
          ? combos.reduce((acc, c) => acc + c.current_multiplier, 0) / combos.length 
          : 1;

        // Get recent XP gain from audit logs
        const { data: xpLogs } = await supabase
          .from('audit_logs')
          .select('new_data')
          .eq('user_id', profile.id)
          .eq('action', 'xp_gained')
          .gte('created_at', sevenDaysAgo.toISOString());

        const recentXp = xpLogs?.reduce((acc, log) => {
          const xp = (log.new_data as { xp_gained?: number } | null)?.xp_gained || 0;
          return acc + xp;
        }, 0) || 0;

        // Calculate days inactive
        const lastActive = new Date(profile.updated_at);
        const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

        return {
          userId: profile.id,
          displayName: profile.display_name || 'Usuário',
          email: profile.email || '',
          level: profile.level,
          xp: profile.xp,
          streak: profile.streak,
          questsCompleted: profile.quests_completed,
          lastActiveDate: profile.updated_at,
          daysInactive,
          attendancePunctualityRate: punctualityRate,
          kudosReceived: kudosReceived || 0,
          kudosSent: kudosSent || 0,
          trailsEnrolled,
          trailsCompleted,
          avgComboMultiplier: Math.round(avgCombo * 10) / 10,
          recentXpGain: recentXp,
        };
      })
    );

    // Use AI to analyze churn risk
    const systemPrompt = `Você é um analista de RH especializado em engajamento de colaboradores. 
Analise os dados de atividade dos colaboradores e identifique aqueles em risco de desengajamento (churn).

Critérios de risco:
- ALTO RISCO: Inativo por mais de 5 dias, streak zerado, pouca atividade recente, baixa pontualidade
- MÉDIO RISCO: Sinais de declínio (streak caindo, menos XP que antes, pontualidade irregular)
- BAIXO RISCO: Ativo regularmente, bom streak, boa pontualidade

Para cada colaborador em risco (médio ou alto), forneça:
1. Nível de risco (high, medium)
2. Score de risco (0-100, onde 100 é maior risco)
3. Principais indicadores de risco
4. Sugestões de intervenção personalizadas`;

    const userPrompt = `Analise os seguintes colaboradores e identifique os que estão em risco de desengajamento:

${JSON.stringify(userMetrics, null, 2)}

Retorne apenas colaboradores com risco médio ou alto no formato JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_churn_predictions",
              description: "Report the churn risk predictions for employees",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        userId: { type: "string" },
                        displayName: { type: "string" },
                        riskLevel: { type: "string", enum: ["high", "medium"] },
                        riskScore: { type: "number", minimum: 0, maximum: 100 },
                        riskIndicators: {
                          type: "array",
                          items: { type: "string" }
                        },
                        interventionSuggestions: {
                          type: "array",
                          items: { type: "string" }
                        },
                        metrics: {
                          type: "object",
                          properties: {
                            daysInactive: { type: "number" },
                            streak: { type: "number" },
                            punctualityRate: { type: "number" },
                            recentXpGain: { type: "number" }
                          }
                        }
                      },
                      required: ["userId", "displayName", "riskLevel", "riskScore", "riskIndicators", "interventionSuggestions"]
                    }
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalAnalyzed: { type: "number" },
                      highRiskCount: { type: "number" },
                      mediumRiskCount: { type: "number" },
                      overallHealthScore: { type: "number" }
                    }
                  }
                },
                required: ["predictions", "summary"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "report_churn_predictions" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    // AI response processed successfully

    // Extract the tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const predictions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(predictions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Churn prediction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
