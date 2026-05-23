import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  createRateLimitResponse,
  RATE_LIMITS 
} from "../_shared/rate-limiter.ts";
import { Bitrix24WebhookSchema, validatePayload, createValidationErrorResponse } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BitrixEventData {
  FIELDS?: { ID?: string; [key: string]: unknown };
  id?: string;
  [key: string]: unknown;
}

interface AdminRole {
  user_id: string;
}

interface SyncMapping {
  local_id: string;
  [key: string]: unknown;
}

interface QuestAssignment {
  id: string;
  user_id: string;
  quest_id: string;
  completed_at: string | null;
}

interface Quest {
  xp_reward: number;
  coin_reward: number;
}

async function verifyHMAC(payload: string, signature: string, secret: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    data
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting (webhooks are more lenient)
  const identifier = getRateLimitIdentifier(req, "bitrix24-webhook");
  const rateLimitResult = checkRateLimit(identifier, RATE_LIMITS.webhook);
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse webhook payload
    let payload: Record<string, unknown>;
    const contentType = req.headers.get('content-type') || '';
    const rawBody = await req.text();
    
    // HMAC Validation
    const signature = req.headers.get('x-bitrix24-signature');
    const secret = Deno.env.get('BITRIX24_WEBHOOK_SECRET');
    
    if (signature && secret) {
      const isValid = await verifyHMAC(rawBody, signature, secret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid HMAC' }), { status: 401, headers: corsHeaders });
      }
    }

    if (contentType.includes('application/json')) {
      payload = JSON.parse(rawBody);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params);
    } else {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }
    }

    // Validate payload with schema
    const validation = validatePayload(Bitrix24WebhookSchema, payload);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return createValidationErrorResponse(validation.error, corsHeaders);
    }
    
    const validatedData = validation.data;

    // Webhook payload logged to database for audit

    // Determine event type
    const eventType = (validatedData.event || validatedData.EVENT || 'unknown') as string;
    const eventData = (validatedData.data || validatedData.DATA || validatedData) as BitrixEventData;

    // Log the webhook
    const { data: logEntry, error: logError } = await supabase
      .from('bitrix24_webhook_logs')
      .insert({
        event_type: eventType,
        payload: eventData,
        processed: false,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Process different event types
    let processed = false;
    let errorMessage = null;

    try {
      switch (eventType) {
        // CRM Lead events
        case 'ONCRMLEADADD':
        case 'ONCRMLEADUPDATE':
        case 'ONCRMLEADDELETE':
          await processCrmEvent(supabase, 'lead', eventType, eventData);
          processed = true;
          break;

        // CRM Deal events
        case 'ONCRMDEALADD':
        case 'ONCRMDEALUPDATE':
        case 'ONCRMDEALDELETE':
          await processCrmEvent(supabase, 'deal', eventType, eventData);
          processed = true;
          break;

        // CRM Contact events
        case 'ONCRMCONTACTADD':
        case 'ONCRMCONTACTUPDATE':
        case 'ONCRMCONTACTDELETE':
          await processCrmEvent(supabase, 'contact', eventType, eventData);
          processed = true;
          break;

        // Task events
        case 'ONTASKADD':
        case 'ONTASKUPDATE':
        case 'ONTASKDELETE':
        case 'ONTASKCOMPLETE':
          await processTaskEvent(supabase, eventType, eventData);
          processed = true;
          break;

        // User events
        case 'ONUSERADD':
        case 'ONUSERUPDATE':
          await processUserEvent(supabase, eventType, eventData);
          processed = true;
          break;

        default:
          // Unhandled event type - marked as processed to avoid retry loops
          processed = true; // Mark as processed to avoid retry loops
      }
    } catch (processError) {
      console.error('Error processing webhook:', processError);
      errorMessage = processError instanceof Error ? processError.message : 'Erro ao processar';
    }

    // Update log entry with processing status
    if (logEntry) {
      await supabase
        .from('bitrix24_webhook_logs')
        .update({ 
          processed, 
          error_message: errorMessage 
        })
        .eq('id', logEntry.id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bitrix24 webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Process CRM events (leads, deals, contacts)
async function processCrmEvent(supabase: SupabaseClient, entityType: string, eventType: string, data: BitrixEventData) {
  const bitrixId = data.FIELDS?.ID || data.id;
  
  if (!bitrixId) return;

  const action = eventType.includes('ADD') ? 'created' : 
                 eventType.includes('UPDATE') ? 'updated' : 'deleted';

  // Update or create sync mapping
  if (action !== 'deleted') {
    await supabase
      .from('bitrix24_sync_mappings')
      .upsert({
        entity_type: 'bitrix_crm',
        local_id: `bitrix_${entityType}_${bitrixId}`,
        bitrix_id: bitrixId.toString(),
        bitrix_entity_type: entityType,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        metadata: data.FIELDS || data,
      }, { onConflict: 'entity_type,local_id,bitrix_entity_type' });
  } else {
    await supabase
      .from('bitrix24_sync_mappings')
      .update({ sync_status: 'deleted' })
      .eq('bitrix_id', bitrixId.toString())
      .eq('bitrix_entity_type', entityType);
  }

  // Create notification for admins
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin') as { data: AdminRole[] | null };

  if (admins?.length) {
    const notifications = admins.map((admin: AdminRole) => ({
      user_id: admin.user_id,
      title: `Bitrix24: ${entityType} ${action}`,
      message: `Um ${entityType} foi ${action === 'created' ? 'criado' : action === 'updated' ? 'atualizado' : 'deletado'} no Bitrix24`,
      type: 'bitrix24',
      data: { entityType, action, bitrixId },
    }));

    await supabase.from('notifications').insert(notifications);
  }
}

// Process Task events
async function processTaskEvent(supabase: SupabaseClient, eventType: string, data: BitrixEventData) {
  const taskId = data.FIELDS?.ID || data.id;
  
  if (!taskId) return;

  const action = eventType.includes('ADD') ? 'created' : 
                 eventType.includes('UPDATE') ? 'updated' : 
                 eventType.includes('COMPLETE') ? 'completed' : 'deleted';

  // Check if we have a local quest mapped to this task
  const { data: mapping } = await supabase
    .from('bitrix24_sync_mappings')
    .select('*')
    .eq('bitrix_id', taskId.toString())
    .eq('bitrix_entity_type', 'task')
    .maybeSingle() as { data: SyncMapping | null };

  if (mapping && action === 'completed') {
    // Auto-complete the linked quest assignment
    const { data: assignment } = await supabase
      .from('quest_assignments')
      .select('*')
      .eq('id', mapping.local_id)
      .is('completed_at', null)
      .maybeSingle() as { data: QuestAssignment | null };

    if (assignment) {
      await supabase
        .from('quest_assignments')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', assignment.id);

      // Grant rewards
      const { data: quest } = await supabase
        .from('custom_quests')
        .select('xp_reward, coin_reward')
        .eq('id', assignment.quest_id)
        .maybeSingle() as { data: Quest | null };

      if (quest) {
        await supabase.rpc('add_user_xp', { 
          user_id: assignment.user_id, 
          xp_amount: quest.xp_reward 
        });
      }
    }
  }

  // Update sync mapping
  await supabase
    .from('bitrix24_sync_mappings')
    .upsert({
      entity_type: 'bitrix_task',
      local_id: mapping?.local_id || `bitrix_task_${taskId}`,
      bitrix_id: taskId.toString(),
      bitrix_entity_type: 'task',
      sync_status: action === 'deleted' ? 'deleted' : 'synced',
      last_synced_at: new Date().toISOString(),
      metadata: data.FIELDS || data,
    }, { onConflict: 'entity_type,local_id,bitrix_entity_type' });
}

// Process User events
async function processUserEvent(supabase: SupabaseClient, eventType: string, data: BitrixEventData) {
  const userId = data.FIELDS?.ID || data.id;
  
  if (!userId) return;

  // Store user mapping for future sync
  await supabase
    .from('bitrix24_sync_mappings')
    .upsert({
      entity_type: 'user',
      local_id: `bitrix_user_${userId}`,
      bitrix_id: userId.toString(),
      bitrix_entity_type: 'user',
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
      metadata: data.FIELDS || data,
    }, { onConflict: 'entity_type,local_id,bitrix_entity_type' });
}
