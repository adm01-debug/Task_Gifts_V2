import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
 import { corsHeaders } from "../_shared/security.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting birthday celebrations check...");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log(`Checking for birthdays on ${monthDay}`);

    // 1. Buscar perfis com aniversário hoje
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, birth_date, hire_date')
      .not('birth_date', 'is', null);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with birth dates`);

    let birthdayCelebrations = 0;
    let anniversaryCelebrations = 0;

    for (const profile of profiles || []) {
      // Check birthday
      if (profile.birth_date) {
        const birthDate = new Date(profile.birth_date);
        const birthMonthDay = `${String(birthDate.getMonth() + 1).padStart(2, '0')}-${String(birthDate.getDate()).padStart(2, '0')}`;
        
        if (birthMonthDay === monthDay) {
          console.log(`Birthday found for user ${profile.id}: ${profile.display_name}`);
          
          // Check if celebration already exists for today
          const { data: existingCelebration } = await supabase
            .from('celebrations')
            .select('id')
            .eq('user_id', profile.id)
            .eq('celebration_type', 'birthday')
            .eq('celebration_date', today.toISOString().split('T')[0])
            .maybeSingle();

          if (!existingCelebration) {
            const age = today.getFullYear() - birthDate.getFullYear();
            
            // Create birthday celebration
            const { error: celebrationError } = await supabase
              .from('celebrations')
              .insert({
                user_id: profile.id,
                celebration_type: 'birthday',
                title: `🎂 Feliz Aniversário, ${profile.display_name}!`,
                description: `Hoje ${profile.display_name} completa ${age} anos! Deseje parabéns!`,
                celebration_date: today.toISOString().split('T')[0],
                xp_reward: 50,
                coin_reward: 25,
                is_public: true,
                auto_generated: true,
                year_count: age,
              });

            if (celebrationError) {
              console.error(`Error creating birthday celebration for ${profile.id}:`, celebrationError);
            } else {
              birthdayCelebrations++;
              console.log(`Created birthday celebration for ${profile.display_name}`);

              // Award XP and coins
              await supabase.rpc('increment_user_xp_coins', {
                user_id: profile.id,
                xp_amount: 50,
                coin_amount: 25,
              });

              // Create notification
              await supabase
                .from('notifications')
                .insert({
                  user_id: profile.id,
                  title: '🎂 Feliz Aniversário!',
                  message: `Parabéns pelo seu aniversário! Você ganhou 50 XP e 25 moedas!`,
                  type: 'celebration',
                });
            }
          }
        }
      }

      // Check work anniversary (hire_date)
      if (profile.hire_date) {
        const hireDate = new Date(profile.hire_date);
        const hireMonthDay = `${String(hireDate.getMonth() + 1).padStart(2, '0')}-${String(hireDate.getDate()).padStart(2, '0')}`;
        
        if (hireMonthDay === monthDay && hireDate.getFullYear() < today.getFullYear()) {
          console.log(`Work anniversary found for user ${profile.id}: ${profile.display_name}`);
          
          // Check if celebration already exists for today
          const { data: existingCelebration } = await supabase
            .from('celebrations')
            .select('id')
            .eq('user_id', profile.id)
            .eq('celebration_type', 'work_anniversary')
            .eq('celebration_date', today.toISOString().split('T')[0])
            .maybeSingle();

          if (!existingCelebration) {
            const years = today.getFullYear() - hireDate.getFullYear();
            const xpReward = years * 100;
            const coinReward = years * 50;
            
            // Create work anniversary celebration
            const { error: celebrationError } = await supabase
              .from('celebrations')
              .insert({
                user_id: profile.id,
                celebration_type: 'work_anniversary',
                title: `🎊 ${years} ${years === 1 ? 'Ano' : 'Anos'} de Empresa!`,
                description: `${profile.display_name} completa ${years} ${years === 1 ? 'ano' : 'anos'} na empresa hoje!`,
                celebration_date: today.toISOString().split('T')[0],
                xp_reward: xpReward,
                coin_reward: coinReward,
                is_public: true,
                auto_generated: true,
                year_count: years,
              });

            if (celebrationError) {
              console.error(`Error creating work anniversary celebration for ${profile.id}:`, celebrationError);
            } else {
              anniversaryCelebrations++;
              console.log(`Created work anniversary celebration for ${profile.display_name}`);

              // Award XP and coins
              await supabase.rpc('increment_user_xp_coins', {
                user_id: profile.id,
                xp_amount: xpReward,
                coin_amount: coinReward,
              });

              // Create notification
              await supabase
                .from('notifications')
                .insert({
                  user_id: profile.id,
                  title: `🎊 ${years} ${years === 1 ? 'Ano' : 'Anos'} de Empresa!`,
                  message: `Parabéns pelo seu aniversário de empresa! Você ganhou ${xpReward} XP e ${coinReward} moedas!`,
                  type: 'celebration',
                });
            }
          }
        }
      }
    }

    console.log(`Processing complete. Birthdays: ${birthdayCelebrations}, Anniversaries: ${anniversaryCelebrations}`);

    return new Response(
      JSON.stringify({
        success: true,
        birthday_celebrations: birthdayCelebrations,
        anniversary_celebrations: anniversaryCelebrations,
        date: today.toISOString().split('T')[0],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in birthday celebrations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
