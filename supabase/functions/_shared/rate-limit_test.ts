// Testes Deno do limitador compartilhado. Rodam no CI pelo workflow deno.yml
// (job "Tipos e testes das Edge Functions"); local: `bun run test:edge`.
import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { checkRateLimit } from "./rate-limit.ts";

const UPSTASH_URL = "https://upstash.exemplo.com";
Deno.env.set("UPSTASH_REDIS_REST_URL", UPSTASH_URL);
Deno.env.set("UPSTASH_REDIS_REST_TOKEN", "token-de-teste");

const originalFetch = globalThis.fetch;

/** Troca o fetch por um stub que registra as URLs chamadas. */
function captureFetch(result: unknown = { result: 1 }): string[] {
  const urls: string[] = [];
  globalThis.fetch = ((input: string | URL | Request) => {
    urls.push(String(input));
    return Promise.resolve(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;
  return urls;
}

Deno.test("codifica a chave para um id de credencial nao virar outra rota", async () => {
  const urls = captureFetch();
  try {
    await checkRateLimit("passkey-auth:verify:cred:abc/def?x=y", 15, 60);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assertEquals(urls.length, 2);
  assertStringIncludes(urls[0], "incr/rate_limit%3Apasskey-auth%3Averify%3Acred%3Aabc%2Fdef%3Fx%3Dy");
  assertStringIncludes(urls[1], "expire/rate_limit%3Apasskey-auth%3Averify%3Acred%3Aabc%2Fdef%3Fx%3Dy/60");
  assertEquals(urls[0].includes("cred:abc/def"), false);
});

Deno.test("chaves que colidiriam sem codificacao seguem separadas", async () => {
  const first = captureFetch({ result: 1 });
  await checkRateLimit("cred:a/b", 1, 60);
  globalThis.fetch = originalFetch;

  const second = captureFetch({ result: 1 });
  try {
    await checkRateLimit("cred:a?b", 1, 60);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assertEquals(first[0] === second[0], false);
});

Deno.test("acima do limite devolve success=false e expoe o ttl da chave", async () => {
  const urls = captureFetch({ result: 99 });
  try {
    const out = await checkRateLimit("ip:1.2.3.4", 5, 30);
    assertEquals(out.success, false);
    if (out.success) throw new Error("unreachable");
    // Stub devolve 99 > janela: o teto da janela prevalece.
    assertEquals(out.reset, 30);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assertEquals(urls.length, 2);
  assertStringIncludes(urls[1], "/ttl/rate_limit%3Aip%3A1.2.3.4");
});

Deno.test("espera devolvida no bloqueio e o ttl restante da chave", async () => {
  const urls: string[] = [];
  globalThis.fetch = ((input: string | URL | Request) => {
    const target = String(input);
    urls.push(target);
    const body = target.includes("/ttl/") ? { result: 12 } : { result: 99 };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;

  try {
    const out = await checkRateLimit("ip:5.6.7.8", 5, 60);
    assertEquals(out.success, false);
    if (out.success) throw new Error("unreachable");
    assertEquals(out.reset, 12);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("ttl zero nao anuncia a janela inteira", async () => {
  globalThis.fetch = ((input: string | URL | Request) => {
    const target = String(input);
    const body = target.includes("/ttl/") ? { result: 0 } : { result: 99 };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;

  try {
    const out = await checkRateLimit("ip:4.4.4.4", 5, 60);
    assertEquals(out.success, false);
    if (out.success) throw new Error("unreachable");
    assertEquals(out.reset, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("ttl indisponivel cai para a janela configurada", async () => {
  globalThis.fetch = ((input: string | URL | Request) => {
    if (String(input).includes("/ttl/")) {
      return Promise.reject(new Error("upstash fora do ar"));
    }
    return Promise.resolve(
      new Response(JSON.stringify({ result: 42 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;

  try {
    const out = await checkRateLimit("ip:9.9.9.9", 5, 60);
    assertEquals(out.success, false);
    if (out.success) throw new Error("unreachable");
    assertEquals(out.reset, 60);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("ttl negativo (chave ausente) cai para a janela configurada", async () => {
  globalThis.fetch = ((input: string | URL | Request) => {
    const target = String(input);
    const body = target.includes("/ttl/") ? { result: -2 } : { result: 99 };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch;

  try {
    const out = await checkRateLimit("ip:7.7.7.7", 5, 60);
    assertEquals(out.success, false);
    if (out.success) throw new Error("unreachable");
    assertEquals(out.reset, 60);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("sem credenciais do Upstash nao chama a rede", async () => {
  const urls = captureFetch();
  Deno.env.delete("UPSTASH_REDIS_REST_URL");
  try {
    const out = await checkRateLimit("ip:1.2.3.4", 5, 60);
    assertEquals(out.success, true);
    assertEquals(urls.length, 0);
  } finally {
    Deno.env.set("UPSTASH_REDIS_REST_URL", UPSTASH_URL);
    globalThis.fetch = originalFetch;
  }
});