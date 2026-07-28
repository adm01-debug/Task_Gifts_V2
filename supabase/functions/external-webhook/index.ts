import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ExternalWebhookSchema, validatePayload, createValidationErrorResponse } from "../_shared/validation.ts";
import { withSentry, addBreadcrumb, captureException } from "../_shared/sentry.ts";
import {
  verifySignedWebhook,
  claimIdempotency,
  completeIdempotency,
  releaseIdempotency,
  derivedIdempotencyKey,
} from "../_shared/webhookSecurity.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-api-key, x-api-secret, x-webhook-signature, x-webhook-timestamp',
};

serve(withSentry("external-webhook", async (req, { requestId }) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  addBreadcrumb("external-webhook:received", { method: req.method, requestId });

  // Get Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fora do try para que o catch possa liberar a reserva em caso de falha.
  let idemKeyToRelease: string | null = null;

  try {
    // Validate API Key
    const apiKey = req.headers.get('x-api-key');
    const apiSecret = req.headers.get('x-api-secret');

    if (!apiKey || !apiSecret) {
      return jsonResponse({ 
        error: 'Missing API credentials',
        message: 'Provide x-api-key and x-api-secret headers'
      }, 401);
    }

    // Validate credentials
    const { data: keyData, error: keyError } = await supabase
      .rpc('validate_api_key', { p_api_key: apiKey, p_api_secret: apiSecret });

    if (keyError || !keyData || keyData.length === 0) {
      console.error('[Webhook] Invalid API key:', keyError);
      return jsonResponse({ error: 'Invalid API credentials' }, 401);
    }

    const apiKeyInfo = keyData[0];
    console.log(`[Webhook] Authenticated: ${apiKeyInfo.name}`);

    const rawPayload = await req.text();

    // Assinatura HMAC OBRIGATÓRIA com janela anti-replay de 5 min.
    // Antes era opcional: bastava omitir os headers para pular a checagem,
    // permitindo reenviar indefinidamente uma requisição capturada.
    const sigCheck = await verifySignedWebhook({
      signedPayload: `${req.headers.get('x-webhook-timestamp') ?? ''}.${rawPayload}`,
      signature: req.headers.get('x-webhook-signature'),
      secret: apiSecret,
      timestamp: req.headers.get('x-webhook-timestamp'),
    });

    if (!sigCheck.ok) {
      console.error('[Webhook] assinatura rejeitada', { reason: sigCheck.reason, requestId });
      return jsonResponse({
        error: 'Assinatura inválida ou ausente',
        message: 'Envie x-webhook-timestamp e x-webhook-signature = HMAC-SHA256("<timestamp>.<body>", api_secret) em hex.',
      }, 401);
    }

    // Idempotência: entregas duplicadas não podem creditar XP/moedas 2x.
    const idemKey = req.headers.get('x-idempotency-key')
      ?? await derivedIdempotencyKey('external', `${apiKeyInfo.id ?? apiKey}.${rawPayload}`);
    const claim = await claimIdempotency(supabase, 'external', idemKey);

    if (claim.state === 'duplicate') {
      return jsonResponse({ success: true, duplicate: true, result: claim.response }, 200);
    }
    if (claim.state === 'in_progress') {
      return jsonResponse({ error: 'Evento já em processamento' }, 409);
    }
    const idemTracked = claim.state === 'fresh';
    if (idemTracked) idemKeyToRelease = claim.key;

    // Parse and validate webhook payload
    const payloadResult = JSON.parse(rawPayload);
    const validation = validatePayload(ExternalWebhookSchema, payloadResult);
    
    if (!validation.success) {
      if (idemTracked) await releaseIdempotency(supabase, claim.key);
      return createValidationErrorResponse(validation.error, corsHeaders);
    }

    const payload = validation.data;
    
    // Normalize v1/v2 payload
    let event: string;
    let data: any;
    
    if ('version' in payload && payload.version === 'v2') {
      event = payload.event;
      data = payload.payload;
    } else {
      event = payload.event;
      data = payload.data;
    }

    if (!event) {
      return jsonResponse({ error: 'Missing event type in payload' }, 400);
    }

    console.log(`[Webhook] Processing event: ${event}`);

    let result: any;

    switch (event) {
      // ===== TASK EVENTS =====
      case 'task.created':
        result = await handleTaskCreated(supabase, apiKeyInfo, data);
        break;

      case 'task.started':
        result = await handleTaskStarted(supabase, apiKeyInfo, data);
        break;

      case 'task.completed':
        result = await handleTaskCompleted(supabase, apiKeyInfo, data);
        break;

      case 'task.late':
        result = await handleTaskCompleted(supabase, apiKeyInfo, { ...data, status: 'late' });
        break;

      case 'task.rejected':
        result = await handleTaskCompleted(supabase, apiKeyInfo, { ...data, status: 'rejected' });
        break;

      case 'task.rework':
        result = await handleTaskCompleted(supabase, apiKeyInfo, { ...data, status: 'rework' });
        break;

      case 'task.updated':
        result = await handleTaskUpdated(supabase, apiKeyInfo, data);
        break;

      case 'task.deleted':
        result = await handleTaskDeleted(supabase, apiKeyInfo, data);
        break;

      // ===== USER EVENTS =====
      case 'user.checkin':
        result = await handleUserCheckin(supabase, data);
        break;

      case 'user.checkout':
        result = await handleUserCheckout(supabase, data);
        break;

      case 'user.award_xp':
        result = await handleAwardXp(supabase, data);
        break;

      case 'user.award_coins':
        result = await handleAwardCoins(supabase, data);
        break;

      case 'user.penalty':
        result = await handlePenalty(supabase, data);
        break;

      // ===== ACHIEVEMENT EVENTS =====
      case 'achievement.grant':
        result = await handleGrantAchievement(supabase, data);
        break;

      // ===== BATCH EVENTS =====
      case 'batch.tasks':
        result = await handleBatchTasks(supabase, apiKeyInfo, data);
        break;

      case 'batch.complete':
        result = await handleBatchComplete(supabase, apiKeyInfo, data);
        break;

      default:
        if (idemTracked) await releaseIdempotency(supabase, claim.key);
        return jsonResponse({ 
          error: 'Unknown event type',
          event,
          supported_events: getSupportedEvents()
        }, 400);
    }

    console.log(`[Webhook] Event ${event} processed:`, result);

    if (idemTracked) {
      await completeIdempotency(supabase, claim.key, 'completed', { event, result });
      idemKeyToRelease = null;
    }

    return jsonResponse({
      success: true,
      event,
      result
    }, 200);

  } catch (error: unknown) {
    captureException(error, { fn: "external-webhook", requestId });
    console.error('[Webhook] erro inesperado', error);
    // Falha => libera a chave para que o provedor possa reentregar o evento.
    if (idemKeyToRelease) await releaseIdempotency(supabase, idemKeyToRelease);
    return jsonResponse({ 
      error: 'Internal server error',
      requestId
    }, 500);
  }
}));

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function getSupportedEvents() {
  return {
    task: [
      'task.created - Create a new task',
      'task.started - Mark task as started',
      'task.completed - Complete task (on_time)',
      'task.late - Complete task as late',
      'task.rejected - Reject task',
      'task.rework - Send task for rework',
      'task.updated - Update task details',
      'task.deleted - Delete task'
    ],
    user: [
      'user.checkin - Record user check-in',
      'user.checkout - Record user check-out',
      'user.award_xp - Add XP to user',
      'user.award_coins - Add coins to user',
      'user.penalty - Apply penalty to user'
    ],
    achievement: [
      'achievement.grant - Grant achievement to user'
    ],
    batch: [
      'batch.tasks - Create multiple tasks',
      'batch.complete - Complete multiple tasks'
    ]
  };
}

// ===== TASK HANDLERS =====

async function handleTaskCreated(supabase: any, apiKeyInfo: any, data: any) {
  const { external_id, user_email, title, description, category, priority, xp_reward, coin_reward, xp_penalty_late, xp_penalty_rework, deadline_at, metadata } = data;

  if (!external_id || !user_email || !title) {
    return { success: false, error: 'Missing required fields: external_id, user_email, title' };
  }

  // Check if task already exists
  const { data: existing } = await supabase
    .from('external_tasks')
    .select('id')
    .eq('external_system', apiKeyInfo.system_type)
    .eq('external_id', external_id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Task already exists', task_id: existing.id };
  }

  const { data: task, error } = await supabase
    .from('external_tasks')
    .insert({
      api_key_id: apiKeyInfo.id,
      external_id,
      external_system: apiKeyInfo.system_type,
      user_email,
      title,
      description,
      category,
      priority: priority || 'medium',
      xp_reward: xp_reward || 50,
      coin_reward: coin_reward || 25,
      xp_penalty_late: xp_penalty_late || 25,
      xp_penalty_rework: xp_penalty_rework || 50,
      deadline_at,
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Process to link user
  const processResult = await supabase.rpc('process_external_task', { p_external_task_id: task.id });

  return { 
    success: true, 
    task_id: task.id,
    user_linked: processResult.data?.success || false
  };
}

async function handleTaskStarted(supabase: any, apiKeyInfo: any, data: any) {
  const { external_id } = data;

  if (!external_id) {
    return { success: false, error: 'Missing external_id' };
  }

  const { error } = await supabase
    .from('external_tasks')
    .update({ started_at: new Date().toISOString(), status: 'in_progress' })
    .eq('external_system', apiKeyInfo.system_type)
    .eq('external_id', external_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Task marked as started' };
}

async function handleTaskCompleted(supabase: any, apiKeyInfo: any, data: any) {
  const { external_id, status = 'on_time', metadata = {} } = data;

  if (!external_id) {
    return { success: false, error: 'Missing external_id' };
  }

  const result = await supabase.rpc('complete_external_task', {
    p_external_system: apiKeyInfo.system_type,
    p_external_id: external_id,
    p_status: status,
    p_metadata: metadata
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  // Trigger outbound webhooks
  await triggerWebhooks(supabase, `task.${status === 'on_time' ? 'completed' : status}`, {
    external_id,
    system: apiKeyInfo.system_type,
    ...result.data
  });

  return result.data;
}

async function handleTaskUpdated(supabase: any, apiKeyInfo: any, data: any) {
  const { external_id, ...updates } = data;

  if (!external_id) {
    return { success: false, error: 'Missing external_id' };
  }

  const allowedFields = ['title', 'description', 'category', 'priority', 'xp_reward', 'coin_reward', 'deadline_at', 'metadata'];
  const filteredUpdates: any = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return { success: false, error: 'No valid fields to update' };
  }

  const { error } = await supabase
    .from('external_tasks')
    .update(filteredUpdates)
    .eq('external_system', apiKeyInfo.system_type)
    .eq('external_id', external_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Task updated', updated_fields: Object.keys(filteredUpdates) };
}

async function handleTaskDeleted(supabase: any, apiKeyInfo: any, data: any) {
  const { external_id } = data;

  if (!external_id) {
    return { success: false, error: 'Missing external_id' };
  }

  const { error } = await supabase
    .from('external_tasks')
    .delete()
    .eq('external_system', apiKeyInfo.system_type)
    .eq('external_id', external_id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Task deleted' };
}

// ===== USER HANDLERS =====

async function handleUserCheckin(supabase: any, data: any) {
  const { user_email, timestamp, notes } = data;

  if (!user_email) {
    return { success: false, error: 'Missing user_email' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', user_email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  // Get attendance settings
  const { data: settings } = await supabase
    .from('attendance_settings')
    .select('*')
    .is('department_id', null)
    .maybeSingle();

  const checkInTime = timestamp ? new Date(timestamp) : new Date();
  const workStart = settings?.work_start_time || '08:00:00';
  const tolerance = settings?.tolerance_minutes || 10;

  // Calculate if punctual
  const [hours, minutes] = workStart.split(':').map(Number);
  const workStartDate = new Date(checkInTime);
  workStartDate.setHours(hours, minutes + tolerance, 0, 0);
  
  const isPunctual = checkInTime <= workStartDate;
  const lateMinutes = isPunctual ? 0 : Math.floor((checkInTime.getTime() - workStartDate.getTime()) / 60000);

  const { data: record, error } = await supabase
    .from('attendance_records')
    .insert({
      user_id: user.id,
      check_in: checkInTime.toISOString(),
      is_punctual: isPunctual,
      late_minutes: lateMinutes,
      notes
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Award XP if punctual
  if (isPunctual) {
    const xpReward = settings?.xp_punctual_checkin || 15;
    await supabase
      .from('profiles')
      .update({ xp: supabase.raw(`xp + ${xpReward}`) })
      .eq('id', user.id);

    return { 
      success: true, 
      record_id: record.id, 
      is_punctual: true, 
      xp_earned: xpReward 
    };
  }

  return { 
    success: true, 
    record_id: record.id, 
    is_punctual: false, 
    late_minutes: lateMinutes 
  };
}

async function handleUserCheckout(supabase: any, data: any) {
  const { user_email, timestamp } = data;

  if (!user_email) {
    return { success: false, error: 'Missing user_email' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', user_email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  // Find today's check-in
  const today = new Date().toISOString().split('T')[0];
  const { data: record, error } = await supabase
    .from('attendance_records')
    .update({ check_out: timestamp || new Date().toISOString() })
    .eq('user_id', user.id)
    .gte('check_in', today)
    .is('check_out', null)
    .select()
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!record) {
    return { success: false, error: 'No check-in found for today' };
  }

  return { success: true, record_id: record.id };
}

async function handleAwardXp(supabase: any, data: any) {
  const { user_email, amount, reason } = data;

  if (!user_email || !amount) {
    return { success: false, error: 'Missing user_email or amount' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, xp')
    .eq('email', user_email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const newXp = Math.max(0, user.xp + amount);
  const newLevel = Math.floor(newXp / 1000) + 1;

  await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel })
    .eq('id', user.id);

  // Trigger webhook if level up
  if (newLevel > Math.floor(user.xp / 1000) + 1) {
    await triggerWebhooks(supabase, 'user.level_up', {
      user_email,
      new_level: newLevel,
      total_xp: newXp
    });
  }

  return { 
    success: true, 
    previous_xp: user.xp, 
    new_xp: newXp, 
    new_level: newLevel,
    reason 
  };
}

async function handleAwardCoins(supabase: any, data: any) {
  const { user_email, amount, reason } = data;

  if (!user_email || !amount) {
    return { success: false, error: 'Missing user_email or amount' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, coins')
    .eq('email', user_email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const newCoins = Math.max(0, user.coins + amount);

  await supabase
    .from('profiles')
    .update({ coins: newCoins })
    .eq('id', user.id);

  return { 
    success: true, 
    previous_coins: user.coins, 
    new_coins: newCoins,
    reason 
  };
}

async function handlePenalty(supabase: any, data: any) {
  const { user_email, xp_deducted = 0, coins_deducted = 0, reason, penalty_type = 'manual' } = data;

  if (!user_email) {
    return { success: false, error: 'Missing user_email' };
  }

  if (xp_deducted <= 0 && coins_deducted <= 0) {
    return { success: false, error: 'Must deduct XP or coins' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, xp, coins')
    .eq('email', user_email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  // Update profile
  await supabase
    .from('profiles')
    .update({ 
      xp: Math.max(0, user.xp - xp_deducted),
      coins: Math.max(0, user.coins - coins_deducted)
    })
    .eq('id', user.id);

  // Record penalty
  await supabase
    .from('task_penalties')
    .insert({
      user_id: user.id,
      penalty_type,
      xp_deducted,
      coins_deducted,
      reason: reason || 'External system penalty'
    });

  // Trigger webhook
  await triggerWebhooks(supabase, 'penalty.applied', {
    user_email,
    xp_deducted,
    coins_deducted,
    reason
  });

  return { 
    success: true, 
    xp_deducted, 
    coins_deducted,
    new_xp: Math.max(0, user.xp - xp_deducted),
    new_coins: Math.max(0, user.coins - coins_deducted)
  };
}

// ===== ACHIEVEMENT HANDLER =====

async function handleGrantAchievement(supabase: any, data: any) {
  const { user_email, achievement_key } = data;

  if (!user_email || !achievement_key) {
    return { success: false, error: 'Missing user_email or achievement_key' };
  }

  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', user_email)
    .maybeSingle();

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const { data: achievement } = await supabase
    .from('achievements')
    .select('id, name, xp_reward, coin_reward')
    .eq('key', achievement_key)
    .maybeSingle();

  if (!achievement) {
    return { success: false, error: 'Achievement not found' };
  }

  // Check if already has
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', user.id)
    .eq('achievement_id', achievement.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'User already has this achievement' };
  }

  // Grant
  await supabase
    .from('user_achievements')
    .insert({ user_id: user.id, achievement_id: achievement.id });

  // Add rewards
  await supabase.rpc('add_user_rewards', {
    p_user_id: user.id,
    p_xp: achievement.xp_reward,
    p_coins: achievement.coin_reward
  });

  // Trigger webhook
  await triggerWebhooks(supabase, 'user.achievement_unlocked', {
    user_email,
    achievement_key,
    achievement_name: achievement.name
  });

  return { 
    success: true, 
    achievement: achievement.name,
    xp_reward: achievement.xp_reward,
    coin_reward: achievement.coin_reward
  };
}

// ===== BATCH HANDLERS =====

async function handleBatchTasks(supabase: any, apiKeyInfo: any, data: any) {
  const { tasks } = data;

  if (!tasks || !Array.isArray(tasks)) {
    return { success: false, error: 'Missing tasks array' };
  }

  const results = [];
  for (const task of tasks) {
    const result = await handleTaskCreated(supabase, apiKeyInfo, task);
    results.push({ external_id: task.external_id, ...result });
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return { 
    success: true, 
    total: tasks.length,
    successful,
    failed,
    results 
  };
}

async function handleBatchComplete(supabase: any, apiKeyInfo: any, data: any) {
  const { tasks } = data;

  if (!tasks || !Array.isArray(tasks)) {
    return { success: false, error: 'Missing tasks array' };
  }

  const results = [];
  for (const task of tasks) {
    const result = await handleTaskCompleted(supabase, apiKeyInfo, task);
    results.push({ external_id: task.external_id, ...result });
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return { 
    success: true, 
    total: tasks.length,
    successful,
    failed,
    results 
  };
}

// ===== OUTBOUND WEBHOOK TRIGGER =====

async function triggerWebhooks(supabase: any, eventType: string, payload: any) {
  try {
    // Get active subscriptions for this event
    const { data: subscriptions } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    console.log(`[Webhook] Triggering ${subscriptions.length} webhooks for ${eventType}`);

    for (const sub of subscriptions) {
      // Call webhook-dispatcher function
      await supabase.functions.invoke('webhook-dispatcher', {
        body: {
          subscription_id: sub.id,
          event_type: eventType,
          payload
        }
      });
    }
  } catch (error) {
    console.error('[Webhook] Failed to trigger webhooks:', error);
  }
}
