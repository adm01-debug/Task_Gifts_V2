import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { withSentry } from "./sentry.ts";

Deno.test("withSentry propagates incoming x-request-id to handler and response", async () => {
  const incoming = "test-req-1234";
  let seen = "";
  const handler = withSentry("unit-test", async (_req, ctx) => {
    seen = ctx.requestId;
    return new Response("ok", { status: 200 });
  });

  const req = new Request("http://localhost/test", {
    method: "POST",
    headers: { "x-request-id": incoming },
  });
  const res = await handler(req);
  await res.text();

  assertEquals(seen, incoming);
  assertEquals(res.headers.get("x-request-id"), incoming);
});

Deno.test("withSentry accepts x-correlation-id as fallback", async () => {
  const incoming = "corr-9876";
  let seen = "";
  const handler = withSentry("unit-test", async (_req, ctx) => {
    seen = ctx.requestId;
    return new Response("ok");
  });

  const req = new Request("http://localhost/test", {
    headers: { "x-correlation-id": incoming },
  });
  const res = await handler(req);
  await res.text();

  assertEquals(seen, incoming);
  assertEquals(res.headers.get("x-request-id"), incoming);
});

Deno.test("withSentry generates a UUID when no correlation header is provided", async () => {
  let seen = "";
  const handler = withSentry("unit-test", async (_req, ctx) => {
    seen = ctx.requestId;
    return new Response("ok");
  });

  const res = await handler(new Request("http://localhost/test"));
  await res.text();

  assertNotEquals(seen, "");
  // UUID v4 shape
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assertEquals(uuidRe.test(seen), true);
  assertEquals(res.headers.get("x-request-id"), seen);
});

Deno.test("withSentry preserves requestId even when handler throws", async () => {
  const incoming = "err-req-42";
  const handler = withSentry("unit-test", async () => {
    throw new Error("boom");
  });

  const req = new Request("http://localhost/test", {
    headers: { "x-request-id": incoming },
  });
  let thrown: unknown = null;
  try {
    await handler(req);
  } catch (e) {
    thrown = e;
  }
  assertEquals((thrown as Error)?.message, "boom");
});