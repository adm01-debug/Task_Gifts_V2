import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";


interface ProfileRef {
  id: string;
  display_name: string;
  email: string;
}

interface CheckinWithProfiles {
  id: string;
  employee_id: string;
  manager_id: string;
  scheduled_at: string;
  status: string;
  employee: ProfileRef | null;
  manager: ProfileRef | null;
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify service role or internal secret for cron job
    verifyServiceRole(req);
    
    console.log("Starting check-in reminders processing...");


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let remindersCreated = 0;

    // 1. Buscar check-ins agendados para hoje ou amanhã
    const { data: scheduledCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select(`
        *,
        employee:profiles!checkins_employee_id_fkey(id, display_name, email),
        manager:profiles!checkins_manager_id_fkey(id, display_name, email)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString().split('T')[0])
      .lte('scheduled_at', tomorrow.toISOString().split('T')[0] + 'T23:59:59');

    if (checkinsError) {
      console.error("Error fetching check-ins:", checkinsError);
      throw checkinsError;
    }

    console.log(`Found ${scheduledCheckins?.length || 0} scheduled check-ins`);

    for (const rawCheckin of scheduledCheckins || []) {
      const checkin = rawCheckin as unknown as CheckinWithProfiles;
      const employeeName = checkin.employee?.display_name || "Colaborador";
      const scheduledDate = new Date(checkin.scheduled_at);
      const isToday = scheduledDate.toDateString() === today.toDateString();
      const isTomorrow = scheduledDate.toDateString() === tomorrow.toDateString();

      // Format time
      const timeStr = scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (isToday) {
        // Urgent reminder for today's check-ins
        console.log(`Check-in for ${employeeName} is scheduled for TODAY at ${timeStr}`);

        // Notify manager
        if (checkin.manager_id) {
          const { data: existingReminder } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', checkin.manager_id)
            .eq('type', 'checkin_reminder')
            .gte('created_at', today.toISOString().split('T')[0])
            .eq('data->checkin_id', checkin.id)
            .maybeSingle();

          if (!existingReminder) {
            await supabase
              .from('notifications')
              .insert({
                user_id: checkin.manager_id,
                title: `⏰ Check-in HOJE às ${timeStr}`,
                message: `Você tem um check-in agendado com ${employeeName} para hoje às ${timeStr}.`,
                type: 'checkin_reminder',
                data: {
                  checkin_id: checkin.id,
                  employee_id: checkin.employee_id,
                  employee_name: employeeName,
                  scheduled_at: checkin.scheduled_at,
                  urgent: true,
                },
              });
            remindersCreated++;
          }
        }

        // Notify employee
        const { data: existingEmployeeReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', checkin.employee_id)
          .eq('type', 'checkin_reminder')
          .gte('created_at', today.toISOString().split('T')[0])
          .eq('data->checkin_id', checkin.id)
          .maybeSingle();

        if (!existingEmployeeReminder) {
          await supabase
            .from('notifications')
            .insert({
              user_id: checkin.employee_id,
              title: `⏰ Check-in HOJE às ${timeStr}`,
              message: `Você tem um check-in agendado com seu gestor para hoje às ${timeStr}. Prepare-se!`,
              type: 'checkin_reminder',
              data: {
                checkin_id: checkin.id,
                manager_id: checkin.manager_id,
                scheduled_at: checkin.scheduled_at,
                urgent: true,
              },
            });
          remindersCreated++;
        }
      } else if (isTomorrow) {
        // Advance reminder for tomorrow's check-ins
        console.log(`Check-in for ${employeeName} is scheduled for TOMORROW at ${timeStr}`);

        // Notify manager
        if (checkin.manager_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: checkin.manager_id,
              title: `📅 Check-in amanhã às ${timeStr}`,
              message: `Lembrete: você tem um check-in agendado com ${employeeName} amanhã às ${timeStr}.`,
              type: 'checkin_reminder',
              data: {
                checkin_id: checkin.id,
                employee_id: checkin.employee_id,
                employee_name: employeeName,
                scheduled_at: checkin.scheduled_at,
              },
            });
          remindersCreated++;
        }

        // Notify employee
        await supabase
          .from('notifications')
          .insert({
            user_id: checkin.employee_id,
            title: `📅 Check-in amanhã às ${timeStr}`,
            message: `Lembrete: você tem um check-in agendado com seu gestor amanhã às ${timeStr}.`,
            type: 'checkin_reminder',
            data: {
              checkin_id: checkin.id,
              manager_id: checkin.manager_id,
              scheduled_at: checkin.scheduled_at,
            },
          });
        remindersCreated++;
      }
    }

    // 2. Check for overdue check-ins
    const { data: overdueCheckins, error: overdueError } = await supabase
      .from('checkins')
      .select(`
        *,
        employee:profiles!checkins_employee_id_fkey(id, display_name),
        manager:profiles!checkins_manager_id_fkey(id, display_name)
      `)
      .eq('status', 'scheduled')
      .lt('scheduled_at', today.toISOString().split('T')[0]);

    if (!overdueError && overdueCheckins) {
      console.log(`Found ${overdueCheckins.length} overdue check-ins`);

      for (const rawOverdue of overdueCheckins) {
        const checkin = rawOverdue as unknown as CheckinWithProfiles;
        const employeeName = checkin.employee?.display_name || "Colaborador";
        // Notify manager about overdue
        if (checkin.manager_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: checkin.manager_id,
              title: `⚠️ Check-in atrasado`,
              message: `O check-in com ${employeeName} está atrasado. Por favor, reagende.`,
              type: 'checkin_overdue',
              data: {
                checkin_id: checkin.id,
                employee_id: checkin.employee_id,
                employee_name: employeeName,
                scheduled_at: checkin.scheduled_at,
              },
            });
          remindersCreated++;
        }
      }
    }

    console.log(`Processing complete. Created ${remindersCreated} reminders`);

    return new Response(
      JSON.stringify({
        success: true,
        scheduled_checkins: scheduledCheckins?.length || 0,
        overdue_checkins: overdueCheckins?.length || 0,
        reminders_created: remindersCreated,
        date: today.toISOString().split('T')[0],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in check-in reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
