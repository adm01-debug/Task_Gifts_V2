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
      // Janela real restante: sem consultar o TTL a tela anuncia a janela
      // inteira como espera, mesmo quando faltam poucos segundos.
      return { success: false, remaining: 0, reset: await remainingSeconds(url, token, key, windowSeconds) };
    }

    return { success: true, remaining: limit - count };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return { success: true }; // Fail open to avoid blocking users
  }
}

/** Segundos que ainda faltam para a chave expirar, com a janela como teto. */
async function remainingSeconds(
  url: string,
  token: string,
  key: string,
  fallback: number,
): Promise<number> {
  try {
    const response = await fetch(`${url}/ttl/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    const ttl = Number(body?.result);
    // -1 (sem expiração) e -2 (chave ausente) não dizem nada sobre a espera.
    if (!Number.isFinite(ttl) || ttl < 0) return fallback;
    // TTL 0 = expira em menos de um segundo; anunciar a janela inteira faria a
    // tela pedir 60 s de espera para um bloqueio que já acabou.
    return Math.max(1, Math.min(ttl, fallback));
  } catch {
    return fallback;
  }
}
