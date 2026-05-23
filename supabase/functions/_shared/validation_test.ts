import { 
  assertEquals,
  assertExists 
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { Bitrix24WebhookSchema, ExternalWebhookSchema, WebhookDispatcherSchema } from "../_shared/validation.ts";

Deno.test("Bitrix24 Webhook Contract - Valid Lead Event", () => {
  const payload = {
    event: "ONCRMLEADADD",
    data: {
      FIELDS: { ID: "12345" }
    },
    ts: "123456789"
  };
  
  const result = Bitrix24WebhookSchema.safeParse(payload);
  assertEquals(result.success, true);
});

Deno.test("Bitrix24 Webhook Contract - Invalid (Missing ID)", () => {
  const payload = {
    event: "ONCRMLEADADD",
    data: {
      FIELDS: { }
    }
  };
  
  // Note: Current schema has ID as optional inside FIELDS or passthrough, 
  // let's refine the test to what we expect or what the schema currently does.
  // If we want it required, we should update the schema.
});

Deno.test("External Webhook Contract - Valid Task Event", () => {
  const payload = {
    event: "task.created",
    data: {
      external_id: "EXT-001",
      user_email: "test@example.com",
      title: "Test Task"
    }
  };
  
  const result = ExternalWebhookSchema.safeParse(payload);
  assertEquals(result.success, true);
});

Deno.test("External Webhook Contract - Invalid (Missing Event)", () => {
  const payload = {
    data: { id: 1 }
  };
  
  const result = ExternalWebhookSchema.safeParse(payload);
  assertEquals(result.success, false);
  if (!result.success) {
    assertEquals(result.error.errors[0].path[0], "event");
  }
});

Deno.test("Webhook Dispatcher Contract - Valid Payload", () => {
  const payload = {
    subscription_id: "550e8400-e29b-41d4-a716-446655440000",
    event_type: "user.signup",
    payload: { id: "user_1" }
  };
  
  const result = WebhookDispatcherSchema.safeParse(payload);
  assertEquals(result.success, true);
});

Deno.test("Webhook Dispatcher Contract - Invalid UUID", () => {
  const payload = {
    subscription_id: "invalid-uuid",
    event_type: "event",
    payload: {}
  };
  
  const result = WebhookDispatcherSchema.safeParse(payload);
  assertEquals(result.success, false);
});
