import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  createRateLimitResponse,
  RATE_LIMITS 
} from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
};

interface TokenRecord {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  domain: string;
  member_id: string | null;
  user_id: string;
}

interface BitrixApiParams {
  [key: string]: unknown;
}

interface RequestData {
  id?: string | number;
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

// Helper to get valid access token (refreshing if needed)
async function getValidToken(supabase: SupabaseClient) {
  const { data: tokenRecord, error } = await supabase
    .from('bitrix24_tokens')
    .select('*')
    .maybeSingle() as { data: TokenRecord | null; error: Error | null };

  if (error || !tokenRecord) {
    throw new Error('Bitrix24 não conectado');
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(tokenRecord.expires_at);
  const now = new Date(Date.now() + 5 * 60 * 1000);

  if (expiresAt < now) {
    // Refresh token
    const clientId = Deno.env.get('BITRIX24_CLIENT_ID');
    const clientSecret = Deno.env.get('BITRIX24_CLIENT_SECRET');

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
      throw new Error(`Token refresh failed: ${tokenData.error_description || tokenData.error}`);
    }

    const newExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    await supabase
      .from('bitrix24_tokens')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: newExpiresAt,
      })
      .eq('id', tokenRecord.id);

    return { token: tokenData.access_token, domain: tokenRecord.domain };
  }

  return { token: tokenRecord.access_token, domain: tokenRecord.domain };
}

// Make Bitrix24 API call
async function callBitrix(domain: string, token: string, method: string, params: BitrixApiParams = {}) {
  const url = `https://${domain}/rest/${method}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Bitrix24 API Error: ${data.error_description || data.error}`);
  }

  return data.result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const identifier = getRateLimitIdentifier(req, "bitrix24-api");
  const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.standard);
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, module, data: requestData } = await req.json() as { 
      action: string; 
      module: string; 
      data: RequestData | null;
    };
    const { token, domain } = await getValidToken(supabase);

    let result;

    // CRM Module
    if (module === 'crm') {
      switch (action) {
        // Leads
        case 'getLeads':
          result = await callBitrix(domain, token, 'crm.lead.list', {
            select: ['*', 'UF_*'],
            order: { ID: 'DESC' },
            ...requestData,
          });
          break;
        case 'getLead':
          result = await callBitrix(domain, token, 'crm.lead.get', { id: requestData?.id });
          break;
        case 'createLead':
          result = await callBitrix(domain, token, 'crm.lead.add', { fields: requestData });
          break;
        case 'updateLead':
          result = await callBitrix(domain, token, 'crm.lead.update', { 
            id: requestData?.id, 
            fields: requestData?.fields 
          });
          break;
        case 'deleteLead':
          result = await callBitrix(domain, token, 'crm.lead.delete', { id: requestData?.id });
          break;

        // Deals
        case 'getDeals':
          result = await callBitrix(domain, token, 'crm.deal.list', {
            select: ['*', 'UF_*'],
            order: { ID: 'DESC' },
            ...requestData,
          });
          break;
        case 'getDeal':
          result = await callBitrix(domain, token, 'crm.deal.get', { id: requestData?.id });
          break;
        case 'createDeal':
          result = await callBitrix(domain, token, 'crm.deal.add', { fields: requestData });
          break;
        case 'updateDeal':
          result = await callBitrix(domain, token, 'crm.deal.update', { 
            id: requestData?.id, 
            fields: requestData?.fields 
          });
          break;
        case 'deleteDeal':
          result = await callBitrix(domain, token, 'crm.deal.delete', { id: requestData?.id });
          break;

        // Contacts
        case 'getContacts':
          result = await callBitrix(domain, token, 'crm.contact.list', {
            select: ['*', 'UF_*', 'PHONE', 'EMAIL'],
            order: { ID: 'DESC' },
            ...requestData,
          });
          break;
        case 'getContact':
          result = await callBitrix(domain, token, 'crm.contact.get', { id: requestData?.id });
          break;
        case 'createContact':
          result = await callBitrix(domain, token, 'crm.contact.add', { fields: requestData });
          break;
        case 'updateContact':
          result = await callBitrix(domain, token, 'crm.contact.update', { 
            id: requestData?.id, 
            fields: requestData?.fields 
          });
          break;
        case 'deleteContact':
          result = await callBitrix(domain, token, 'crm.contact.delete', { id: requestData?.id });
          break;

        // Companies
        case 'getCompanies':
          result = await callBitrix(domain, token, 'crm.company.list', {
            select: ['*', 'UF_*'],
            order: { ID: 'DESC' },
            ...requestData,
          });
          break;

        default:
          throw new Error(`CRM action não suportada: ${action}`);
      }
    }

    // Tasks Module
    else if (module === 'tasks') {
      switch (action) {
        case 'getTasks':
          result = await callBitrix(domain, token, 'tasks.task.list', {
            select: ['*', 'UF_*'],
            order: { ID: 'DESC' },
            ...requestData,
          });
          break;
        case 'getTask':
          result = await callBitrix(domain, token, 'tasks.task.get', { taskId: requestData?.id });
          break;
        case 'createTask':
          result = await callBitrix(domain, token, 'tasks.task.add', { fields: requestData });
          break;
        case 'updateTask':
          result = await callBitrix(domain, token, 'tasks.task.update', { 
            taskId: requestData?.id, 
            fields: requestData?.fields 
          });
          break;
        case 'deleteTask':
          result = await callBitrix(domain, token, 'tasks.task.delete', { taskId: requestData?.id });
          break;
        case 'completeTask':
          result = await callBitrix(domain, token, 'tasks.task.complete', { taskId: requestData?.id });
          break;

        default:
          throw new Error(`Tasks action não suportada: ${action}`);
      }
    }

    // Calendar Module
    else if (module === 'calendar') {
      switch (action) {
        case 'getEvents':
          result = await callBitrix(domain, token, 'calendar.event.get', {
            type: 'user',
            ...requestData,
          });
          break;
        case 'createEvent':
          result = await callBitrix(domain, token, 'calendar.event.add', requestData || {});
          break;
        case 'updateEvent':
          result = await callBitrix(domain, token, 'calendar.event.update', requestData || {});
          break;
        case 'deleteEvent':
          result = await callBitrix(domain, token, 'calendar.event.delete', { id: requestData?.id });
          break;

        default:
          throw new Error(`Calendar action não suportada: ${action}`);
      }
    }

    // Users Module
    else if (module === 'users') {
      switch (action) {
        case 'getUsers':
          result = await callBitrix(domain, token, 'user.get', requestData || {});
          break;
        case 'getUser':
          result = await callBitrix(domain, token, 'user.get', { ID: requestData?.id });
          break;
        case 'getCurrentUser':
          result = await callBitrix(domain, token, 'user.current');
          break;
        case 'getDepartments':
          result = await callBitrix(domain, token, 'department.get', requestData || {});
          break;

        default:
          throw new Error(`Users action não suportada: ${action}`);
      }
    }

    // Timekeeping Module
    else if (module === 'timeman') {
      switch (action) {
        case 'getStatus':
          result = await callBitrix(domain, token, 'timeman.status', requestData || {});
          break;
        case 'open':
          result = await callBitrix(domain, token, 'timeman.open', requestData || {});
          break;
        case 'close':
          result = await callBitrix(domain, token, 'timeman.close', requestData || {});
          break;
        case 'pause':
          result = await callBitrix(domain, token, 'timeman.pause', requestData || {});
          break;
        case 'getSettings':
          result = await callBitrix(domain, token, 'timeman.settings', requestData || {});
          break;
        case 'getReports':
          result = await callBitrix(domain, token, 'timeman.reports.get', requestData || {});
          break;

        default:
          throw new Error(`Timeman action não suportada: ${action}`);
      }
    }

    // IM (Instant Messaging) Module
    else if (module === 'im') {
      switch (action) {
        case 'getDialogs':
          result = await callBitrix(domain, token, 'im.recent.list', requestData || {});
          break;
        case 'getMessages':
          result = await callBitrix(domain, token, 'im.dialog.messages.get', requestData || {});
          break;
        case 'sendMessage':
          result = await callBitrix(domain, token, 'im.message.add', requestData || {});
          break;
        case 'sendNotify':
          result = await callBitrix(domain, token, 'im.notify.personal.add', requestData || {});
          break;
        case 'getUnread':
          result = await callBitrix(domain, token, 'im.counters.get', requestData || {});
          break;
        case 'markRead':
          result = await callBitrix(domain, token, 'im.dialog.read', requestData || {});
          break;
        case 'getChatInfo':
          result = await callBitrix(domain, token, 'im.chat.get', requestData || {});
          break;
        case 'createChat':
          result = await callBitrix(domain, token, 'im.chat.add', requestData || {});
          break;
        case 'getUserStatus':
          result = await callBitrix(domain, token, 'im.user.status.get', requestData || {});
          break;

        default:
          throw new Error(`IM action não suportada: ${action}`);
      }
    }

    // Notifications Module
    else if (module === 'notify') {
      switch (action) {
        case 'send':
          result = await callBitrix(domain, token, 'im.notify.personal.add', requestData || {});
          break;
        case 'sendSystem':
          result = await callBitrix(domain, token, 'im.notify.system.add', requestData || {});
          break;
        case 'getList':
          result = await callBitrix(domain, token, 'im.notify.get', requestData || {});
          break;
        case 'markRead':
          result = await callBitrix(domain, token, 'im.notify.read', requestData || {});
          break;
        case 'delete':
          result = await callBitrix(domain, token, 'im.notify.delete', requestData || {});
          break;
        case 'confirm':
          result = await callBitrix(domain, token, 'im.notify.confirm', requestData || {});
          break;
        case 'decline':
          result = await callBitrix(domain, token, 'im.notify.decline', requestData || {});
          break;

        default:
          throw new Error(`Notify action não suportada: ${action}`);
      }
    }

    // Generic method call
    else if (module === 'raw') {
      result = await callBitrix(domain, token, action, requestData || {});
    }

    else {
      throw new Error(`Módulo não suportado: ${module}`);
    }

    // Log the API call
    await supabase.from('bitrix24_webhook_logs').insert({
      event_type: `${module}.${action}`,
      payload: { request: requestData, response: result },
      processed: true,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bitrix24 API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
