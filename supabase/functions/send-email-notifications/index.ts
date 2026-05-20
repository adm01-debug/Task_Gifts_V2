import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";



interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  type: 'digest' | 'reminder' | 'notification' | 'celebration';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify service role or internal secret for system triggers
    verifyServiceRole(req);
    
    console.log("Starting email notifications processing...");


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, userId } = await req.json();
    
    console.log(`Processing ${type} email notifications${userId ? ` for user ${userId}` : ''}`);

    // If specific user, send only to them
    let profiles;
    if (userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      profiles = [data];
    } else {
      // Get all profiles with email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .not('email', 'is', null);
      
      if (error) throw error;
      profiles = data;
    }

    console.log(`Found ${profiles?.length || 0} profiles to notify`);

    const emailsToSend: EmailPayload[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      switch (type) {
        case 'digest': {
          // Weekly digest with user stats
          const { data: userStats } = await supabase
            .from('profiles')
            .select('xp, coins, level, streak, quests_completed')
            .eq('id', profile.id)
            .single();

          // Get unread notifications count
          const { count: unreadCount } = await supabase
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('user_id', profile.id)
            .eq('read', false);

          // Get pending surveys
          const { count: pendingSurveys } = await supabase
            .from('pulse_surveys')
            .select('id', { count: 'exact' })
            .eq('status', 'active');

          emailsToSend.push({
            to: profile.email,
            subject: `📊 Seu Resumo Semanal - Task Gifts`,
            html: `
              <h1>Olá, ${profile.display_name}!</h1>
              <p>Aqui está seu resumo semanal:</p>
              <ul>
                <li>🌟 XP Total: ${userStats?.xp || 0}</li>
                <li>💰 Moedas: ${userStats?.coins || 0}</li>
                <li>📈 Nível: ${userStats?.level || 1}</li>
                <li>🔥 Sequência: ${userStats?.streak || 0} dias</li>
                <li>✅ Quests Completadas: ${userStats?.quests_completed || 0}</li>
              </ul>
              <p>Você tem ${unreadCount || 0} notificações não lidas e ${pendingSurveys || 0} pesquisas para responder.</p>
              <p>Continue assim! 🚀</p>
            `,
            type: 'digest',
          });
          break;
        }

        case 'reminder': {
          // Get pending items
          const { data: pendingCheckins } = await supabase
            .from('checkins')
            .select('id')
            .eq('employee_id', profile.id)
            .eq('status', 'scheduled')
            .limit(5);

          const { data: pendingFeedback } = await supabase
            .from('feedback_requests')
            .select('id')
            .eq('from_user_id', profile.id)
            .eq('status', 'pending')
            .limit(5);

          if ((pendingCheckins?.length || 0) > 0 || (pendingFeedback?.length || 0) > 0) {
            emailsToSend.push({
              to: profile.email,
              subject: `⏰ Lembretes Pendentes - Task Gifts`,
              html: `
                <h1>Olá, ${profile.display_name}!</h1>
                <p>Você tem tarefas pendentes:</p>
                <ul>
                  ${pendingCheckins?.length ? `<li>📝 ${pendingCheckins.length} check-ins agendados</li>` : ''}
                  ${pendingFeedback?.length ? `<li>💬 ${pendingFeedback.length} feedbacks para enviar</li>` : ''}
                </ul>
                <p>Não perca seus pontos! Acesse a plataforma agora.</p>
              `,
              type: 'reminder',
            });
          }
          break;
        }

        case 'celebration': {
          // Get today's celebrations for this user
          const today = new Date().toISOString().split('T')[0];
          const { data: celebrations } = await supabase
            .from('celebrations')
            .select('*')
            .eq('user_id', profile.id)
            .eq('celebration_date', today);

          for (const celebration of celebrations || []) {
            emailsToSend.push({
              to: profile.email,
              subject: celebration.title,
              html: `
                <h1>${celebration.title}</h1>
                <p>${celebration.description}</p>
                <p>🎁 Você ganhou ${celebration.xp_reward} XP e ${celebration.coin_reward} moedas!</p>
              `,
              type: 'celebration',
            });
          }
          break;
        }
      }
    }

    console.log(`Prepared ${emailsToSend.length} emails to send`);

    // In production, you would integrate with an email service like Resend, SendGrid, etc.
    // For now, we log the emails that would be sent
    for (const email of emailsToSend) {
      console.log(`Would send email to ${email.to}: ${email.subject}`);
      
      // Log the email attempt for tracking
      await supabase
        .from('audit_logs')
        .insert({
          action: 'CREATE',
          entity_type: 'email_notification',
          entity_id: email.to,
          user_id: userId || '00000000-0000-0000-0000-000000000000',
          metadata: {
            email_type: email.type,
            subject: email.subject,
            status: 'logged', // Would be 'sent' with actual email service
          },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        emails_prepared: emailsToSend.length,
        type,
        message: "Emails logged. Integrate with email service for actual delivery.",
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in email notifications:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
