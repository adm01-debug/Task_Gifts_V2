// Testes Deno (runtime real das edge functions) do registro de contratos e do versionamento
// do webhook. Espelham os casos essenciais dos *.contract.spec.ts (vitest). Rodam no CI (deno.yml); local: `bun run test:edge`.
import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { CONTRACTS, EDGE_FUNCTION_NAMES } from "./index.ts";
import { resolveWebhookDispatch, WEBHOOK_V1_SUNSET } from "./webhook-dispatcher.ts";
import { ValidationErrorSchema, validateBody } from "../validation.ts";

const UUID = "8d6f2b1e-3c4a-4e5f-9a7b-1c2d3e4f5a6b";

Deno.test("registro: toda pasta de supabase/functions tem contrato", () => {
  const dirs: string[] = [];
  for (const e of Deno.readDirSync(new URL("../../", import.meta.url))) {
    if (e.isDirectory && !e.name.startsWith("_")) dirs.push(e.name);
  }
  assertEquals(EDGE_FUNCTION_NAMES, dirs.sort());
});

Deno.test("todo contrato rejeita corpo não-objeto no formato único 422", () => {
  for (const name of EDGE_FUNCTION_NAMES) {
    const c = CONTRACTS[name];
    const r = c.validate ? c.validate("texto") : validateBody(c.request, "texto");
    assert(!r.ok, `${name} aceitou string como corpo`);
    if (r.ok) continue;
    assert(ValidationErrorSchema.safeParse(r.error).success, `${name}: corpo fora do formato`);
    assertEquals(r.error.fields[0].field, "(body)");
  }
});

Deno.test("webhook v1 aceito com depreciação; v2 aceito sem; v3 recusado; v1 após sunset recusado", () => {
  const antes = new Date("2026-11-22T12:00:00Z");
  const depois = new Date(WEBHOOK_V1_SUNSET.getTime() + 1);
  const v1 = { subscription_id: UUID, event_type: "test.ping", payload: {} };
  const v2 = { version: "v2", subscription_id: UUID, event: { type: "test.ping" }, payload: {} };

  const r1 = resolveWebhookDispatch(v1, { now: antes });
  assert(r1.ok && r1.deprecated);
  assert(r1.headers.Sunset && r1.headers.Deprecation);

  const r2 = resolveWebhookDispatch(v2, { now: antes });
  assert(r2.ok && !r2.deprecated);
  assertEquals(r2.headers, { "X-Contract-Version": "v2" });

  const r3 = resolveWebhookDispatch({ ...v1, version: "v3" }, { now: antes });
  assert(!r3.ok);
  if (!r3.ok) assertEquals(r3.error.code, "UNSUPPORTED_VERSION");

  const r4 = resolveWebhookDispatch(v1, { now: depois });
  assert(!r4.ok);
  if (!r4.ok) assertEquals(r4.error.fields[0].code, "sunset");
});

Deno.test("send-campaign-push aceita caminho do app em url e recusa javascript:", () => {
  const base = { user_ids: [UUID], type: "campaign_completed", title: "Meta batida!", message: "100%" };
  const ok = validateBody(CONTRACTS["send-campaign-push"].request, { ...base, url: `/campanhas/${UUID}` });
  assert(ok.ok, "caminho relativo do app deveria ser aceito (salesCampaignsService envia assim)");
  for (const url of ["javascript:alert(1)", "data:text/html,x", "nao-e-url"]) {
    const r = validateBody(CONTRACTS["send-campaign-push"].request, { ...base, url });
    assert(!r.ok, `deveria recusar ${url}`);
    if (!r.ok) assertEquals(r.error.fields[0].field, "url");
  }
});

Deno.test("webhook aceita version v1 explícita e mantém o envelope histórico", () => {
  const r = resolveWebhookDispatch(
    { version: "v1", subscription_id: UUID, event_type: "order.created", payload: { id: 1 } },
    { now: new Date("2026-11-22T12:00:00Z") },
  );
  assert(r.ok);
  if (!r.ok) return;
  assertEquals(r.data.version, "v1");
  assertEquals(r.deprecated, true);
});
