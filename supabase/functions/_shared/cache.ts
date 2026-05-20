/**
 * Shared Cache Utility using Upstash Redis
 * Essential for high-performance rankings and dashboards.
 */

export async function getCache<T>(key: string): Promise<T | null> {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) return null;

  try {
    const response = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.result) {
      return JSON.parse(data.result) as T;
    }
    return null;
  } catch (error) {
    console.error("Cache get failed:", error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600) {
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) return;

  try {
    await fetch(`${url}/set/${key}/${ttlSeconds}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(value),
    });
  } catch (error) {
    console.error("Cache set failed:", error);
  }
}
