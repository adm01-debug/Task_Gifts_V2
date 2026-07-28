import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'authorize';

    // Get secrets
    const clientId = Deno.env.get('BITRIX24_CLIENT_ID');
    const clientSecret = Deno.env.get('BITRIX24_CLIENT_SECRET');
    const bitrixDomain = Deno.env.get('BITRIX24_DOMAIN');

    if (action === 'authorize') {
      // Step 1: Redirect to Bitrix24 OAuth
      if (!clientId || !bitrixDomain) {
        return new Response(
          JSON.stringify({ 
            error: 'Bitrix24 não configurado',
            missing: { clientId: !clientId, domain: !bitrixDomain }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const redirectUri = `${supabaseUrl}/functions/v1/bitrix24-oauth?action=callback`;
      const authUrl = `https://${bitrixDomain}/oauth/authorize/?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

      return new Response(
        JSON.stringify({ authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback') {
      // Step 2: Exchange code for tokens
      const code = url.searchParams.get('code');
      
      if (!code) {
        return new Response('Código de autorização não fornecido', { status: 400 });
      }

      if (!clientId || !clientSecret || !bitrixDomain) {
        return new Response('Configuração Bitrix24 incompleta', { status: 500 });
      }

      const redirectUri = `${supabaseUrl}/functions/v1/bitrix24-oauth?action=callback`;
      
      const tokenResponse = await fetch(`https://${bitrixDomain}/oauth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error('Bitrix24 token error:', tokenData);
        return new Response(
          `Erro ao obter token: ${tokenData.error_description || tokenData.error}`,
          { status: 400 }
        );
      }

      // Get authorization header to identify user
      const authHeader = req.headers.get('authorization');
      let userId = null;

      if (authHeader) {
        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
        const { data: { user } } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
        userId = user?.id;
      }

      // For now, store as system token (first admin who connects)
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Upsert token
      const { error: upsertError } = await supabase
        .from('bitrix24_tokens')
        .upsert({
          user_id: userId || '00000000-0000-0000-0000-000000000000', // System user placeholder
          domain: bitrixDomain,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
          member_id: tokenData.member_id,
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Error saving token:', upsertError);
        return new Response('Erro ao salvar token', { status: 500 });
      }

      // Redirect to success page
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
      return new Response(null, {
        status: 302,
        headers: { Location: `${frontendUrl}/admin?bitrix=connected` }
      });
    }

    if (action === 'refresh') {
      // Refresh expired token
      const { data: tokenRecord } = await supabase
        .from('bitrix24_tokens')
        .select('*')
        .maybeSingle();

      if (!tokenRecord) {
        return new Response(
          JSON.stringify({ error: 'Nenhum token encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenResponse = await fetch(`https://${tokenRecord.domain}/oauth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: tokenRecord.refresh_token,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(
          JSON.stringify({ error: tokenData.error_description || tokenData.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      await supabase
        .from('bitrix24_tokens')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt,
        })
        .eq('id', tokenRecord.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      // Check connection status
      const { data: tokenRecord, error } = await supabase
        .from('bitrix24_tokens')
        .select('domain, expires_at, member_id')
        .maybeSingle();

      const configured = !!clientId && !!clientSecret && !!bitrixDomain;
      const connected = !!tokenRecord && !error;
      const expired = tokenRecord ? new Date(tokenRecord.expires_at) < new Date() : false;

      return new Response(
        JSON.stringify({
          configured,
          connected,
          expired,
          domain: tokenRecord?.domain || bitrixDomain || null,
          memberId: tokenRecord?.member_id || null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bitrix24 OAuth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
