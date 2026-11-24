/**
 * Shared Rate Limiting Utility using Upstash Redis
 * Recommended for high-traffic or sensitive Edge Functions.
 */

export async function checkRateLimit(identifier: string, limit: number = 10, windowSeconds: number = 60) {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    console.warn("Rate limiting skipped: Upstash credentials not configured.");
    return { success: true };
  }

  try {
    const key = `rate_limit:${identifier}`;
    // `encodeURIComponent`: a chave vem de dados do chamador (id de credencial,
    // e-mail, IP) e sem codificação um `/` ou `?` mudaria a rota chamada no
    // Upstash usando o token do projeto.
    const response = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const current = await response.json();
    const count = parseInt(current.result);

    if (count === 1) {
      // Set expiration for new key
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${windowSeconds}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (count > limit) {
      return { success: false, remaining: 0, reset: windowSeconds };
    }

    return { success: true, remaining: limit - count };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { success: true }; // Fail open to avoid blocking users
  }
}
