import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Query string `?action=ping|credentials` (padrão ping). Corpo ignorado. */
export const MigrateHelperQuerySchema = z.object({
  // `?action=` (vazio) vinha caindo em "ping" no código antigo (`|| "ping"`); sem o preprocess
  // viraria 422 e a URL usada no runbook de migração deixaria de funcionar.
  action: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? "ping" : v),
    z.enum(["ping", "credentials"]),
  ),
});

export const migrateHelperContract = defineContract({
  name: "migrate-helper",
  methods: ["GET", "POST"],
  auth: "access-key",
  request: EmptyBodySchema,
  query: MigrateHelperQuerySchema,
  bodyRequired: false,
});
