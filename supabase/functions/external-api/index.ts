import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-api-key, x-api-secret',
};

interface ApiKeyInfo {
  id: string;
  name: string;
  system_type: string;
  permissions: string[];
  rate_limit_per_minute: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const url = new URL(req.url);
  const path = url.pathname.replace('/external-api', '');
  
  console.log(`[API] ${req.method} ${path}`);

  // Get Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.error('[API] Invalid API key:', keyError);
    return jsonResponse({ error: 'Invalid API credentials' }, 401);
  }

  const apiKeyInfo: ApiKeyInfo = keyData[0];
  console.log(`[API] Authenticated: ${apiKeyInfo.name} (${apiKeyInfo.system_type})`);

  try {
    let result: any;
    let requestBody: any = null;

    // Parse body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        requestBody = await req.json();
      } catch {
        requestBody = {};
      }
    }

    // Route handling
    switch (true) {
      // ===== HEALTH CHECK =====
      case path === '/health' && req.method === 'GET':
        result = { status: 'ok', timestamp: new Date().toISOString(), system: apiKeyInfo.name };
        break;

      // ===== TASKS =====
      case path === '/tasks' && req.method === 'POST':
        if (!hasPermission(apiKeyInfo.permissions, 'write')) {
          return jsonResponse({ error: 'Permission denied: write access required' }, 403);
        }
        result = await createTask(supabase, apiKeyInfo, requestBody);
        break;

      case path === '/tasks' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getTasks(supabase, apiKeyInfo, url.searchParams);
        break;

      case path.match(/^\/tasks\/[^\/]+$/) && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        const taskId = path.split('/')[2];
        result = await getTask(supabase, apiKeyInfo, taskId);
        break;

      case path.match(/^\/tasks\/[^\/]+\/complete$/) && req.method === 'POST':
        if (!hasPermission(apiKeyInfo.permissions, 'write')) {
          return jsonResponse({ error: 'Permission denied: write access required' }, 403);
        }
        const completeTaskId = path.split('/')[2];
        result = await completeTask(supabase, apiKeyInfo, completeTaskId, requestBody);
        break;

      case path.match(/^\/tasks\/[^\/]+$/) && req.method === 'PUT':
        if (!hasPermission(apiKeyInfo.permissions, 'write')) {
          return jsonResponse({ error: 'Permission denied: write access required' }, 403);
        }
        const updateTaskId = path.split('/')[2];
        result = await updateTask(supabase, apiKeyInfo, updateTaskId, requestBody);
        break;

      // ===== USERS =====
      case path === '/users' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getUsers(supabase, url.searchParams);
        break;

      case path.match(/^\/users\/[^\/]+$/) && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        const userEmail = decodeURIComponent(path.split('/')[2]);
        result = await getUser(supabase, userEmail);
        break;

      case path.match(/^\/users\/[^\/]+\/add-xp$/) && req.method === 'POST':
        if (!hasPermission(apiKeyInfo.permissions, 'write')) {
          return jsonResponse({ error: 'Permission denied: write access required' }, 403);
        }
        const addXpEmail = decodeURIComponent(path.split('/')[2]);
        result = await addUserXp(supabase, addXpEmail, requestBody);
        break;

      case path.match(/^\/users\/[^\/]+\/add-coins$/) && req.method === 'POST':
        if (!hasPermission(apiKeyInfo.permissions, 'write')) {
          return jsonResponse({ error: 'Permission denied: write access required' }, 403);
        }
        const addCoinsEmail = decodeURIComponent(path.split('/')[2]);
        result = await addUserCoins(supabase, addCoinsEmail, requestBody);
        break;

      // ===== LEADERBOARD =====
      case path === '/leaderboard' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getLeaderboard(supabase, url.searchParams);
        break;

      // ===== DEPARTMENTS =====
      case path === '/departments' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getDepartments(supabase);
        break;

      // ===== POSITIONS =====
      case path === '/positions' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getPositions(supabase);
        break;

      // ===== ACHIEVEMENTS =====
      case path === '/achievements' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getAchievements(supabase);
        break;

      case path.match(/^\/users\/[^\/]+\/achievements$/) && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        const achievementsEmail = decodeURIComponent(path.split('/')[2]);
        result = await getUserAchievements(supabase, achievementsEmail);
        break;

      case path.match(/^\/users\/[^\/]+\/achievements$/) && req.method === 'POST':
        if (!hasPermission(apiKeyInfo.permissions, 'write')) {
          return jsonResponse({ error: 'Permission denied: write access required' }, 403);
        }
        const grantAchievementEmail = decodeURIComponent(path.split('/')[2]);
        result = await grantAchievement(supabase, grantAchievementEmail, requestBody);
        break;

      // ===== WEBHOOKS =====
      case path === '/webhooks' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getWebhooks(supabase, apiKeyInfo.id);
        break;

      case path === '/webhooks' && req.method === 'POST':
        if (!hasPermission(apiKeyInfo.permissions, 'admin')) {
          return jsonResponse({ error: 'Permission denied: admin access required' }, 403);
        }
        result = await createWebhook(supabase, apiKeyInfo.id, requestBody);
        break;

      case path.match(/^\/webhooks\/[^\/]+$/) && req.method === 'DELETE':
        if (!hasPermission(apiKeyInfo.permissions, 'admin')) {
          return jsonResponse({ error: 'Permission denied: admin access required' }, 403);
        }
        const webhookId = path.split('/')[2];
        result = await deleteWebhook(supabase, apiKeyInfo.id, webhookId);
        break;

      // ===== STATS =====
      case path === '/stats/summary' && req.method === 'GET':
        if (!hasPermission(apiKeyInfo.permissions, 'read')) {
          return jsonResponse({ error: 'Permission denied: read access required' }, 403);
        }
        result = await getStatsSummary(supabase);
        break;

      default:
        return jsonResponse({ 
          error: 'Endpoint not found',
          available_endpoints: getAvailableEndpoints()
        }, 404);
    }

    // Log request
    const duration = Date.now() - startTime;
    await logRequest(supabase, apiKeyInfo.id, path, req.method, requestBody, 200, result, duration, req);

    return jsonResponse(result, 200);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error:', message);
    const duration = Date.now() - startTime;
    await logRequest(supabase, apiKeyInfo.id, path, req.method, null, 500, { error: message }, duration, req);
    return jsonResponse({ error: 'Internal server error', message }, 500);
  }
});

// ===== HELPER FUNCTIONS =====

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes('admin')) return true;
  if (required === 'read' && permissions.includes('write')) return true;
  return permissions.includes(required);
}

async function logRequest(
  supabase: any,
  apiKeyId: string,
  endpoint: string,
  method: string,
  requestBody: any,
  status: number,
  responseBody: any,
  duration: number,
  req: Request
) {
  try {
    await supabase.from('api_request_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      request_body: requestBody,
      response_status: status,
      response_body: responseBody,
      ip_address: clientIpForLogging(req),
      user_agent: req.headers.get('user-agent'),
      duration_ms: duration
    });
  } catch (e) {
    console.error('[API] Failed to log request:', e);
  }
}

function getAvailableEndpoints() {
  return {
    health: { GET: '/health' },
    tasks: {
      GET: '/tasks - List tasks',
      'GET :id': '/tasks/{external_id} - Get task by external ID',
      POST: '/tasks - Create task',
      PUT: '/tasks/{external_id} - Update task',
      'POST complete': '/tasks/{external_id}/complete - Complete task'
    },
    users: {
      GET: '/users - List users',
      'GET :email': '/users/{email} - Get user by email',
      'POST add-xp': '/users/{email}/add-xp - Add XP to user',
      'POST add-coins': '/users/{email}/add-coins - Add coins to user',
      'GET achievements': '/users/{email}/achievements - Get user achievements',
      'POST achievements': '/users/{email}/achievements - Grant achievement'
    },
    leaderboard: { GET: '/leaderboard?limit=10&department_id=...' },
    departments: { GET: '/departments' },
    positions: { GET: '/positions' },
    achievements: { GET: '/achievements' },
    webhooks: {
      GET: '/webhooks - List your webhooks',
      POST: '/webhooks - Create webhook',
      DELETE: '/webhooks/{id} - Delete webhook'
    },
    stats: { GET: '/stats/summary' }
  };
}

// ===== TASK FUNCTIONS =====

async function createTask(supabase: any, apiKeyInfo: ApiKeyInfo, body: any) {
  const { external_id, user_email, title, description, category, priority, xp_reward, coin_reward, xp_penalty_late, xp_penalty_rework, deadline_at, metadata } = body;

  if (!external_id || !user_email || !title) {
    return { success: false, error: 'Missing required fields: external_id, user_email, title' };
  }

  const { data, error } = await supabase
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
    console.error('[API] Create task error:', error);
    return { success: false, error: error.message };
  }

  // Process task to link user
  const processResult = await supabase.rpc('process_external_task', { p_external_task_id: data.id });

  return { 
    success: true, 
    task: data,
    processed: processResult.data
  };
}

async function getTasks(supabase: any, apiKeyInfo: ApiKeyInfo, params: URLSearchParams) {
  const status = params.get('status');
  const userEmail = params.get('user_email');
  const limit = parseInt(params.get('limit') || '50');
  const offset = parseInt(params.get('offset') || '0');

  let query = supabase
    .from('external_tasks')
    .select('*')
    .eq('external_system', apiKeyInfo.system_type)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (userEmail) query = query.eq('user_email', userEmail);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, tasks: data, count: data?.length || 0 };
}

async function getTask(supabase: any, apiKeyInfo: ApiKeyInfo, externalId: string) {
  const { data, error } = await supabase
    .from('external_tasks')
    .select('*')
    .eq('external_system', apiKeyInfo.system_type)
    .eq('external_id', externalId)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: 'Task not found' };
  }

  return { success: true, task: data };
}

async function updateTask(supabase: any, apiKeyInfo: ApiKeyInfo, externalId: string, body: any) {
  const { title, description, category, priority, xp_reward, coin_reward, deadline_at, metadata } = body;

  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;
  if (priority !== undefined) updates.priority = priority;
  if (xp_reward !== undefined) updates.xp_reward = xp_reward;
  if (coin_reward !== undefined) updates.coin_reward = coin_reward;
  if (deadline_at !== undefined) updates.deadline_at = deadline_at;
  if (metadata !== undefined) updates.metadata = metadata;

  const { data, error } = await supabase
    .from('external_tasks')
    .update(updates)
    .eq('external_system', apiKeyInfo.system_type)
    .eq('external_id', externalId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function completeTask(supabase: any, apiKeyInfo: ApiKeyInfo, externalId: string, body: any) {
  const { status = 'on_time', metadata = {} } = body;

  const validStatuses = ['on_time', 'late', 'rework', 'rejected'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }

  const result = await supabase.rpc('complete_external_task', {
    p_external_system: apiKeyInfo.system_type,
    p_external_id: externalId,
    p_status: status,
    p_metadata: metadata
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return result.data;
}

// ===== USER FUNCTIONS =====

async function getUsers(supabase: any, params: URLSearchParams) {
  const limit = parseInt(params.get('limit') || '50');
  const offset = parseInt(params.get('offset') || '0');
  const search = params.get('search');

  let query = supabase
    .from('profiles')
    .select('id, email, display_name, level, xp, coins, streak, quests_completed, created_at')
    .order('xp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, users: data, count: data?.length || 0 };
}

async function getUser(supabase: any, email: string) {
  const result = await supabase.rpc('get_user_stats_api', { p_user_email: email });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return result.data;
}

async function addUserXp(supabase: any, email: string, body: any) {
  const { amount, reason } = body;

  if (!amount || typeof amount !== 'number') {
    return { success: false, error: 'Missing or invalid amount' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, xp')
    .eq('email', email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const newXp = Math.max(0, user.xp + amount);
  const newLevel = Math.floor(newXp / 1000) + 1;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { 
    success: true, 
    user_id: user.id,
    previous_xp: user.xp,
    new_xp: newXp,
    new_level: newLevel,
    amount_added: amount,
    reason
  };
}

async function addUserCoins(supabase: any, email: string, body: any) {
  const { amount, reason } = body;

  if (!amount || typeof amount !== 'number') {
    return { success: false, error: 'Missing or invalid amount' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, coins')
    .eq('email', email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const newCoins = Math.max(0, user.coins + amount);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: newCoins, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { 
    success: true, 
    user_id: user.id,
    previous_coins: user.coins,
    new_coins: newCoins,
    amount_added: amount,
    reason
  };
}

// ===== LEADERBOARD =====

async function getLeaderboard(supabase: any, params: URLSearchParams) {
  const limit = parseInt(params.get('limit') || '10');
  const departmentId = params.get('department_id');

  const result = await supabase.rpc('get_leaderboard_api', {
    p_limit: limit,
    p_department_id: departmentId || null
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return result.data;
}

// ===== DEPARTMENTS =====

async function getDepartments(supabase: any) {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, description, color')
    .order('name');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, departments: data };
}

// ===== POSITIONS =====

async function getPositions(supabase: any) {
  const { data, error } = await supabase
    .from('positions')
    .select('id, name, description, department_id, level, is_active')
    .eq('is_active', true)
    .order('level');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, positions: data };
}

// ===== ACHIEVEMENTS =====

async function getAchievements(supabase: any) {
  const { data, error } = await supabase
    .from('achievements')
    .select('id, key, name, description, icon, category, rarity, xp_reward, coin_reward')
    .order('category');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, achievements: data };
}

async function getUserAchievements(supabase: any, email: string) {
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      id,
      unlocked_at,
      achievement:achievements(id, key, name, description, icon, category, rarity, xp_reward, coin_reward)
    `)
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, achievements: data };
}

async function grantAchievement(supabase: any, email: string, body: any) {
  const { achievement_key } = body;

  if (!achievement_key) {
    return { success: false, error: 'Missing achievement_key' };
  }

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const { data: achievement, error: achError } = await supabase
    .from('achievements')
    .select('id, xp_reward, coin_reward')
    .eq('key', achievement_key)
    .maybeSingle();

  if (achError || !achievement) {
    return { success: false, error: 'Achievement not found' };
  }

  // Check if already has achievement
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', user.id)
    .eq('achievement_id', achievement.id)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'User already has this achievement' };
  }

  // Grant achievement
  const { error: grantError } = await supabase
    .from('user_achievements')
    .insert({
      user_id: user.id,
      achievement_id: achievement.id
    });

  if (grantError) {
    return { success: false, error: grantError.message };
  }

  // Add rewards
  await supabase
    .from('profiles')
    .update({
      xp: supabase.raw(`xp + ${achievement.xp_reward}`),
      coins: supabase.raw(`coins + ${achievement.coin_reward}`)
    })
    .eq('id', user.id);

  return { 
    success: true, 
    message: 'Achievement granted',
    xp_reward: achievement.xp_reward,
    coin_reward: achievement.coin_reward
  };
}

// ===== WEBHOOKS =====

async function getWebhooks(supabase: any, apiKeyId: string) {
  const { data, error } = await supabase
    .from('webhook_subscriptions')
    .select('id, name, url, events, is_active, last_triggered_at, last_status, created_at')
    .eq('api_key_id', apiKeyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, webhooks: data };
}

async function createWebhook(supabase: any, apiKeyId: string, body: any) {
  const { name, url, events, headers } = body;

  if (!name || !url || !events || !Array.isArray(events)) {
    return { success: false, error: 'Missing required fields: name, url, events (array)' };
  }

  const validEvents = [
    'task.created', 'task.completed', 'task.late', 'task.rejected',
    'user.level_up', 'user.achievement_unlocked',
    'leaderboard.update', 'penalty.applied'
  ];

  const invalidEvents = events.filter(e => !validEvents.includes(e));
  if (invalidEvents.length > 0) {
    return { success: false, error: `Invalid events: ${invalidEvents.join(', ')}. Valid: ${validEvents.join(', ')}` };
  }

  // Generate webhook secret
  const secret = crypto.randomUUID() + '-' + Date.now().toString(36);

  const { data, error } = await supabase
    .from('webhook_subscriptions')
    .insert({
      api_key_id: apiKeyId,
      name,
      url,
      secret,
      events,
      headers: headers || {}
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { 
    success: true, 
    webhook: data,
    message: 'Store the secret securely - it will be sent in X-Webhook-Secret header'
  };
}

async function deleteWebhook(supabase: any, apiKeyId: string, webhookId: string) {
  const { error } = await supabase
    .from('webhook_subscriptions')
    .delete()
    .eq('api_key_id', apiKeyId)
    .eq('id', webhookId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'Webhook deleted' };
}

// ===== STATS =====

async function getStatsSummary(supabase: any) {
  const result = await supabase.rpc('get_executive_metrics');

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return { success: true, stats: result.data };
}
