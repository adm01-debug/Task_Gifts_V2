/**
 * Hybrid Rate Limiter for Supabase Edge Functions
 * Uses Upstash Redis for global consistency, falls back to in-memory for performance/offline.
 */
import { resolveClientIp } from "./clientIp.ts";
/**
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// In-memory store (fallback)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): Promise<{ allowed: boolean; remaining: number; resetAt: number; retryAfter?: number }> {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (url && token) {
    try {
      const key = `rate_limit:${identifier}`;
      const res = await fetch(`${url}/incr/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const count = parseInt(data.result);

      if (count === 1) {
        await fetch(`${url}/expire/${key}/${Math.floor(config.windowMs / 1000)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (count > config.maxRequests) {
        return { allowed: false, remaining: 0, resetAt: Date.now() + config.windowMs, retryAfter: Math.floor(config.windowMs / 1000) };
      }

      return { allowed: true, remaining: config.maxRequests - count, resetAt: Date.now() + config.windowMs };
    } catch (error) {
      console.error("Upstash rate limit failed, falling back to memory:", error);
    }
  }

  // In-memory fallback
  const now = Date.now();
  let entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + config.windowMs };
    rateLimitStore.set(identifier, entry);
  } else {
    entry.count++;
  }
  
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitIdentifier(req: Request, functionName: string): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.sub) return `${functionName}:user:${payload.sub}`;
    } catch {}
  }
  // Fallback anônimo: usa o IP inforjável do proxy. Um `x-forwarded-for`
  // controlado pelo cliente permitiria burlar o limite trocando o header.
  const ip = resolveClientIp(req).ip ?? "unknown";
  return `${functionName}:ip:${ip}`;
}

export function createRateLimitResponse(retryAfter: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Rate limit exceeded", retryAfter }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
  );
}

export const RATE_LIMITS = {
  ai: { windowMs: 60000, maxRequests: 10 },
  standard: { windowMs: 60000, maxRequests: 30 },
  webhook: { windowMs: 60000, maxRequests: 100 }
} as const;

