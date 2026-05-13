import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
 import { corsHeaders } from "../_shared/security.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting survey reminders processing...");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    
    // 1. Buscar pesquisas ativas
    const { data: activeSurveys, error: surveysError } = await supabase
      .from('pulse_surveys')
      .select('*')
      .eq('status', 'active')
      .gte('ends_at', today.toISOString());

    if (surveysError) {
      console.error("Error fetching surveys:", surveysError);
      throw surveysError;
    }

    console.log(`Found ${activeSurveys?.length || 0} active surveys`);

    let remindersCreated = 0;

    for (const survey of activeSurveys || []) {
      const endsAt = new Date(survey.ends_at);
      const daysUntilEnd = Math.ceil((endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Send reminder if ending in 1-3 days
      if (daysUntilEnd <= 3 && daysUntilEnd > 0) {
        console.log(`Survey "${survey.title}" ends in ${daysUntilEnd} days`);

        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name');

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          continue;
        }

        // Get users who already responded
        const { data: responses, error: responsesError } = await supabase
          .from('pulse_responses')
          .select('user_id')
          .eq('survey_id', survey.id);

        if (responsesError) {
          console.error("Error fetching responses:", responsesError);
          continue;
        }

        const respondedUserIds = new Set(responses?.map(r => r.user_id) || []);

        // Send reminders to users who haven't responded
        for (const profile of profiles || []) {
          if (!respondedUserIds.has(profile.id)) {
            // Check if reminder was already sent today
            const { data: existingReminder } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', profile.id)
              .eq('type', 'survey_reminder')
              .gte('created_at', today.toISOString().split('T')[0])
              .maybeSingle();

            if (!existingReminder) {
              const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                  user_id: profile.id,
                  title: `📋 Pesquisa pendente: ${survey.title}`,
                  message: `A pesquisa "${survey.title}" encerra em ${daysUntilEnd} ${daysUntilEnd === 1 ? 'dia' : 'dias'}. Sua opinião é importante!`,
                  type: 'survey_reminder',
                  data: {
                    survey_id: survey.id,
                    survey_title: survey.title,
                    ends_at: survey.ends_at,
                    days_remaining: daysUntilEnd,
                  },
                });

              if (!notificationError) {
                remindersCreated++;
              }
            }
          }
        }
      }

      // Check for surveys ending today - send urgent reminder
      if (daysUntilEnd === 0) {
        console.log(`Survey "${survey.title}" ends TODAY`);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id');

        const { data: responses } = await supabase
          .from('pulse_responses')
          .select('user_id')
          .eq('survey_id', survey.id);

        const respondedUserIds = new Set(responses?.map(r => r.user_id) || []);

        for (const profile of profiles || []) {
          if (!respondedUserIds.has(profile.id)) {
            await supabase
              .from('notifications')
              .insert({
                user_id: profile.id,
                title: `⚠️ ÚLTIMO DIA: ${survey.title}`,
                message: `A pesquisa "${survey.title}" encerra HOJE! Não perca a chance de participar.`,
                type: 'survey_reminder',
                data: {
                  survey_id: survey.id,
                  urgent: true,
                },
              });
            remindersCreated++;
          }
        }
      }
    }

    console.log(`Processing complete. Created ${remindersCreated} reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        active_surveys: activeSurveys?.length || 0,
        reminders_created: remindersCreated,
        date: today.toISOString().split('T')[0],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in survey reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
