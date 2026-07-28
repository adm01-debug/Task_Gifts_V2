import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

interface GeoResponse {
  country_code?: string;
  country_name?: string;
  ip?: string;
  error?: string;
}

async function getGeoFromIP(ip: string): Promise<GeoResponse> {
  try {
    // Use ip-api.com (free, no API key required, 45 requests per minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country_code: data.countryCode,
        country_name: data.country,
        ip: ip
      };
    }
    
    console.log('Geo lookup failed:', data.message);
    return { ip, error: data.message };
  } catch (error) {
    console.error('Error fetching geo data:', error);
    return { ip, error: 'Failed to fetch geo data' };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    const clientIp = cfConnectingIp || 
                     (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                     realIp || 
                     'unknown';

    console.log('Checking geo for IP:', clientIp);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get geo settings
    const { data: settings, error: settingsError } = await supabase
      .from('geo_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Error fetching geo settings:', settingsError);
      // Default to allowing access if we can't fetch settings
      return new Response(
        JSON.stringify({
          allowed: true,
          ip: clientIp,
          reason: 'settings_error',
          message: 'Não foi possível verificar configurações, acesso permitido'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If geo blocking is disabled, allow all
    if (!settings.is_enabled) {
      console.log('Geo blocking is disabled, allowing access');
      return new Response(
        JSON.stringify({
          allowed: true,
          ip: clientIp,
          reason: 'geo_disabled',
          message: 'Bloqueio geográfico desativado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get geo information for the IP
    const geoInfo = await getGeoFromIP(clientIp);
    console.log('Geo info:', geoInfo);

    let allowed = false;
    let reason = '';
    let message = '';

    if (geoInfo.error || !geoInfo.country_code) {
      // Unknown country
      allowed = !settings.block_unknown_countries;
      reason = allowed ? 'unknown_allowed' : 'unknown_blocked';
      message = allowed 
        ? 'País não identificado, acesso permitido' 
        : 'País não identificado, acesso bloqueado';
    } else {
      // Check if country is in whitelist
      const { data: countryData, error: countryError } = await supabase
        .from('geo_allowed_countries')
        .select('*')
        .eq('country_code', geoInfo.country_code)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (countryError && countryError.code !== 'PGRST116') {
        console.error('Error checking country:', countryError);
      }

      allowed = !!countryData;
      reason = allowed ? 'country_allowed' : 'country_blocked';
      message = allowed 
        ? `Acesso permitido de ${geoInfo.country_name}` 
        : `Acesso bloqueado de ${geoInfo.country_name}`;
    }

    // Log access if enabled
    if (settings.log_all_access || !allowed) {
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      try {
        await supabase.from('geo_access_logs').insert({
          ip_address: clientIp,
          country_code: geoInfo.country_code || null,
          country_name: geoInfo.country_name || null,
          was_allowed: allowed,
          reason: reason,
          user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error logging geo access:', logError);
      }
    }

    console.log('Geo check result:', { allowed, reason, country: geoInfo.country_code });

    return new Response(
      JSON.stringify({
        allowed,
        ip: clientIp,
        country_code: geoInfo.country_code || null,
        country_name: geoInfo.country_name || null,
        reason,
        message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in verify-geo:', error);
    
    // In case of error, default to allowing access to prevent lockouts
    return new Response(
      JSON.stringify({
        allowed: true,
        reason: 'error',
        message: 'Erro na verificação, acesso permitido por segurança'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
