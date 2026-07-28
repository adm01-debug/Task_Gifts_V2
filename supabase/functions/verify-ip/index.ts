import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Get client IP from headers (set by proxy/CDN)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Priority: CF > X-Real-IP > X-Forwarded-For (first IP)
    let clientIp = cfConnectingIp || realIp || (forwardedFor?.split(',')[0]?.trim()) || 'unknown';
    
    console.log(`[verify-ip] Checking IP: ${clientIp}`);
    console.log(`[verify-ip] Headers - X-Forwarded-For: ${forwardedFor}, X-Real-IP: ${realIp}, CF-Connecting-IP: ${cfConnectingIp}`);

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if whitelist is empty (if empty, allow all)
    const { data: whitelistCount, error: countError } = await supabase
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

    // If whitelist is empty, allow all IPs
    const totalActive = whitelistCount?.length || 0;
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
          allowed: true, 
          ip: clientIp,
          reason: 'check_error',
          message: 'Erro ao verificar IP'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
