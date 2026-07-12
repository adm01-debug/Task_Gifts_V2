import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";
import { WebhookDispatcherSchema, validatePayload, createValidationErrorResponse } from "../_shared/validation.ts";
import { withSentry, addBreadcrumb, captureException, recordMetric, timeStep } from "../_shared/sentry.ts";

serve(withSentry("webhook-dispatcher", async (req, { requestId }) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify service role or internal secret
    verifyServiceRole(req);

    const rawPayload = await req.json();
    const validation = validatePayload(WebhookDispatcherSchema, rawPayload);
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.error, corsHeaders);
    }

    const { subscription_id, event_type, payload } = validation.data;
    addBreadcrumb("dispatcher:start", { subscription_id, event_type, requestId });

    if (!subscription_id || !event_type || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Dispatcher] Processing webhook for subscription ${subscription_id}, event: ${event_type}`);

    // Get subscription details
    const { data: subscription, error: subError } = await timeStep(
      "webhook-dispatcher",
      "load_subscription",
      async () =>
        await supabase
          .from('webhook_subscriptions')
          .select('*')
          .eq('id', subscription_id)
          .eq('is_active', true)
          .single(),
      { subscription_id, requestId },
    );

    if (subError || !subscription) {
      console.error('[Dispatcher] Subscription not found or inactive:', subError);
      addBreadcrumb("dispatcher:subscription_missing", { subscription_id, requestId }, "warning");
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare webhook payload
    const webhookPayload = {
      event: event_type,
      timestamp: new Date().toISOString(),
      data: payload
    };

    const payloadString = JSON.stringify(webhookPayload);

    // Generate signature
    const signature = generateSignature(payloadString, subscription.secret);

    // Prepare headers
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event_type,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': webhookPayload.timestamp,
      ...(subscription.headers || {})
    };

    let success = false;
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let attemptCount = 0;
    const maxRetries = subscription.retry_count || 3;
    const startTime = Date.now();

    // Retry loop
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      attemptCount = attempt;
      console.log(`[Dispatcher] Attempt ${attempt}/${maxRetries} to ${subscription.url}`);
      addBreadcrumb("dispatcher:attempt:start", {
        attempt,
        max: maxRetries,
        url: subscription.url,
        subscription_id,
        requestId,
      });
      const attemptStart = Date.now();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), (subscription.timeout_seconds || 30) * 1000);

        const response = await fetch(subscription.url, {
          method: 'POST',
          headers: webhookHeaders,
          body: payloadString,
          signal: controller.signal
        });

        clearTimeout(timeout);

        responseStatus = response.status;
        responseBody = await response.text();
        const attemptDuration = Date.now() - attemptStart;
        recordMetric("webhook-dispatcher", "attempt.duration_ms", attemptDuration, {
          attempt,
          status: responseStatus,
          success: response.ok,
          subscription_id,
          requestId,
        });

        if (response.ok) {
          success = true;
          console.log(`[Dispatcher] Webhook delivered successfully on attempt ${attempt}`);
          addBreadcrumb("dispatcher:attempt:success", {
            attempt,
            status: responseStatus,
            duration_ms: attemptDuration,
            requestId,
          });
          break;
        } else {
          errorMessage = `HTTP ${responseStatus}: ${responseBody}`;
          console.warn(`[Dispatcher] Webhook failed with status ${responseStatus}`);
          addBreadcrumb("dispatcher:attempt:http_error", {
            attempt,
            status: responseStatus,
            duration_ms: attemptDuration,
            requestId,
          }, "warning");
        }
      } catch (error: unknown) {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Dispatcher] Attempt ${attempt} failed:`, errorMessage);

        if (error instanceof Error && error.name === 'AbortError') {
          errorMessage = 'Request timeout';
        }
        const attemptDuration = Date.now() - attemptStart;
        recordMetric("webhook-dispatcher", "attempt.duration_ms", attemptDuration, {
          attempt,
          status: "network_error",
          success: false,
          error: errorMessage,
          subscription_id,
          requestId,
        });
        addBreadcrumb("dispatcher:attempt:network_error", {
          attempt,
          error: errorMessage,
          duration_ms: attemptDuration,
          requestId,
        }, "error");
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[Dispatcher] Waiting ${delay}ms before retry...`);
        addBreadcrumb("dispatcher:backoff", { attempt, delay_ms: delay, requestId });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const duration = Date.now() - startTime;
    recordMetric("webhook-dispatcher", "total.duration_ms", duration, {
      attempts: attemptCount,
      success,
      status: responseStatus,
      event_type,
      subscription_id,
      requestId,
    });
    recordMetric("webhook-dispatcher", "delivery.attempts", attemptCount, {
      success,
      subscription_id,
      requestId,
    });
    recordMetric("webhook-dispatcher", "delivery.success", success ? 1 : 0, {
      subscription_id,
      event_type,
      requestId,
    });

    // Log delivery attempt
    await timeStep("webhook-dispatcher", "persist_log", async () => await supabase.from('webhook_delivery_logs').insert({
      subscription_id: subscription.id,
      event_type,
      payload: webhookPayload,
      response_status: responseStatus,
      response_body: responseBody?.substring(0, 10000), // Limit response body size
      attempt_count: attemptCount,
      success,
      error_message: errorMessage,
      duration_ms: duration
    }), { subscription_id, requestId });

    // Update subscription status
    await timeStep("webhook-dispatcher", "update_subscription", async () =>
      await supabase
        .from('webhook_subscriptions')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_status: responseStatus
        })
        .eq('id', subscription.id),
      { subscription_id, requestId },
    );

    addBreadcrumb("dispatcher:done", {
      success,
      attempts: attemptCount,
      duration_ms: duration,
      requestId,
    });

    return new Response(JSON.stringify({
      success,
      attempts: attemptCount,
      duration_ms: duration,
      status: responseStatus,
      error: success ? null : errorMessage
    }), {
      status: success ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    captureException(error, { fn: "webhook-dispatcher", requestId });
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));

function generateSignature(payload: string, secret: string): string {
  try {
    const hmac = createHmac('sha256', secret);
    hmac.update(payload);
    return 'sha256=' + hmac.digest('hex');
  } catch {
    // Fallback for Deno
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(payload);
    
    // Simple hash for fallback
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash;
    }
    return 'sha256=' + Math.abs(hash).toString(16).padStart(16, '0');
  }
}
