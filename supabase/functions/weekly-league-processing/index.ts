import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";



serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify service role or internal secret for cron job
    verifyServiceRole(req);
    
    console.log("Starting weekly league processing...");


    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar todas as ligas ordenadas por tier
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .order('tier', { ascending: true });

    if (leaguesError) {
      console.error("Error fetching leagues:", leaguesError);
      throw leaguesError;
    }

    console.log(`Found ${leagues?.length || 0} leagues`);

    if (!leagues || leagues.length === 0) {
      return new Response(
        JSON.stringify({ message: "No leagues found" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weekDate = new Date().toISOString().split('T')[0];
    let promotions = 0;
    let demotions = 0;
    let maintained = 0;

    // 2. Processar cada liga
    for (const league of leagues) {
      console.log(`Processing league: ${league.name} (tier ${league.tier})`);

      // Buscar membros da liga ordenados por XP semanal
      const { data: members, error: membersError } = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', league.id)
        .order('weekly_xp', { ascending: false });

      if (membersError) {
        console.error(`Error fetching members for league ${league.id}:`, membersError);
        continue;
      }

      if (!members || members.length === 0) {
        console.log(`No members in league ${league.name}`);
        continue;
      }

      console.log(`Found ${members.length} members in league ${league.name}`);

      // 3. Determinar promoções e rebaixamentos
      const promotionSlots = league.promotion_slots || 3;
      const demotionSlots = league.demotion_slots || 3;

      // Encontrar próxima liga (tier superior = promoção)
      const nextLeague = leagues.find(l => l.tier === league.tier + 1);
      // Encontrar liga anterior (tier inferior = rebaixamento)
      const prevLeague = leagues.find(l => l.tier === league.tier - 1);

      // Usar transação (limitado em Supabase JS via RPC ou Promise.all mas aqui fazemos sequencialmente por segurança de concorrência por enquanto)
      // Idealmente usaríamos um RPC para processar a liga toda em uma única transação DB
      
      const memberPromises = members.map(async (member, i) => {
        const position = i + 1;
        let changeType = 'maintained';
        let toLeagueId = league.id;

        // Top players get promoted (if there's a higher tier league)
        if (position <= promotionSlots && nextLeague) {
          changeType = 'promotion';
          toLeagueId = nextLeague.id;
        }
        // Bottom players get demoted (if there's a lower tier league)
        else if (position > members.length - demotionSlots && prevLeague) {
          changeType = 'demotion';
          toLeagueId = prevLeague.id;
        }

        // Registrar histórico
        const { error: historyError } = await supabase
          .from('league_history')
          .insert({
            user_id: member.user_id,
            from_league_id: league.id,
            to_league_id: toLeagueId,
            change_type: changeType,
            weekly_xp: member.weekly_xp,
            week_date: weekDate,
          });

        if (historyError) {
          console.error(`Error inserting history for user ${member.user_id}:`, historyError);
        }

        // Atualizar membro para nova liga e resetar XP semanal
        const { error: updateError } = await supabase
          .from('league_members')
          .update({
            league_id: toLeagueId,
            weekly_xp: 0,
          })
          .eq('user_id', member.user_id);

        if (updateError) {
          console.error(`Error updating member ${member.user_id}:`, updateError);
        }

        // Criar notificação para o usuário
        let notificationTitle = '';
        let notificationMessage = '';

        if (changeType === 'promotion') {
          notificationTitle = '🎉 Parabéns! Você foi promovido!';
          notificationMessage = `Você subiu para a liga ${nextLeague?.name}!`;
          promotions++;
        } else if (changeType === 'demotion') {
          notificationTitle = '📉 Rebaixamento de Liga';
          notificationMessage = `Você foi rebaixado para a liga ${prevLeague?.name}. Continue tentando!`;
          demotions++;
        } else {
          notificationTitle = '🏆 Liga Mantida';
          notificationMessage = `Você permanece na liga ${league.name}. Boa semana!`;
          maintained++;
        }

        await supabase
          .from('notifications')
          .insert({
            user_id: member.user_id,
            title: notificationTitle,
            message: notificationMessage,
            type: 'league',
            data: {
              change_type: changeType,
              from_league: league.name,
              to_league: changeType === 'promotion' ? nextLeague?.name : 
                         changeType === 'demotion' ? prevLeague?.name : league.name,
            },
          });
      });

      await Promise.all(memberPromises);
    }

    console.log(`Processing complete. Promotions: ${promotions}, Demotions: ${demotions}, Maintained: ${maintained}`);

    return new Response(
      JSON.stringify({
        success: true,
        promotions,
        demotions,
        maintained,
        week_date: weekDate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in weekly league processing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
