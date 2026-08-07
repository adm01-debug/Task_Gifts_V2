import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveClientIp } from "../_shared/clientIp.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-forwarded-for, x-real-ip',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Só o header sobrescrito pelo proxy é confiável. Ver _shared/clientIp.ts.
    const { ip: resolvedIp, trusted } = resolveClientIp(req);
    const clientIp = resolvedIp ?? 'unknown';

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Whitelist vazia => recurso desligado (libera geral). Usamos `count`,
    // não `data.length`: com head:true o corpo vem nulo e a contagem antiga
    // resultava sempre em 0, desativando a whitelist silenciosamente.
    const { count: activeCount, error: countError } = await supabase
      .from('ip_whitelist')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.error('[verify-ip] Error counting whitelist:', countError);
      // If error checking, allow access (fail open for availability)
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          ip: clientIp,
          reason: 'whitelist_check_error',
          message: 'Erro ao verificar whitelist, acesso permitido temporariamente'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalActive = activeCount ?? 0;
    if (totalActive === 0) {
      console.log('[verify-ip] Whitelist is empty, allowing all IPs');
      return new Response(
        JSON.stringify({ 
          allowed: true, 
          ip: clientIp,
          reason: 'whitelist_empty',
          message: 'Whitelist vazia, todos os IPs permitidos'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist ATIVA e IP não determinável com confiança => fail closed.
    if (!trusted) {
      await supabase.from('ip_access_logs').insert({
        ip_address: 'unknown',
        endpoint: '/verify-ip',
        was_allowed: false,
        reason: 'IP de origem não pôde ser determinado com confiança',
        user_agent: req.headers.get('user-agent') || null,
      });
      return new Response(
        JSON.stringify({
          allowed: false,
          ip: 'unknown',
          reason: 'untrusted_source_ip',
          message: 'Não foi possível validar a origem da sua conexão',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Check if IP is in whitelist
    const { data: whitelistEntry, error: checkError } = await supabase
      .from('ip_whitelist')
      .select('id, description, expires_at')
      .eq('ip_address', clientIp)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      console.error('[verify-ip] Error checking IP:', checkError);
      return new Response(
        JSON.stringify({ 
          allowed: false,
          ip: clientIp,
          reason: 'check_error',
          message: 'Erro ao verificar IP'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    // Check if entry exists and is not expired
    const isAllowed = whitelistEntry && 
      (!whitelistEntry.expires_at || new Date(whitelistEntry.expires_at) > new Date());

    // Log the access attempt
    const { error: logError } = await supabase
      .from('ip_access_logs')
      .insert({
        ip_address: clientIp,
        endpoint: '/verify-ip',
        was_allowed: isAllowed,
        reason: isAllowed ? 'IP na whitelist' : 'IP não autorizado',
        user_agent: req.headers.get('user-agent') || null
      });

    if (logError) {
      console.error('[verify-ip] Error logging access:', logError);
    }

    console.log(`[verify-ip] IP ${clientIp} - Allowed: ${isAllowed}`);

    return new Response(
      JSON.stringify({ 
        allowed: isAllowed, 
        ip: clientIp,
        reason: isAllowed ? 'whitelisted' : 'not_whitelisted',
        message: isAllowed 
          ? `Acesso permitido - ${whitelistEntry?.description || 'IP autorizado'}`
          : 'Seu IP não está autorizado a acessar este sistema'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-ip] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        ip: 'unknown',
        reason: 'error',
        message: 'Erro interno, acesso permitido temporariamente'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
