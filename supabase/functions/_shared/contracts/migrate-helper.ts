import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Query string `?action=ping|credentials` (padrão ping). Corpo ignorado. */
export const MigrateHelperQuerySchema = z.object({
  action: z.enum(["ping", "credentials"]).default("ping"),
});

export const migrateHelperContract = defineContract({
  name: "migrate-helper",
  methods: ["GET", "POST"],
  auth: "access-key",
  request: EmptyBodySchema,
  query: MigrateHelperQuerySchema,
  bodyRequired: false,
});
