// Dynamic import keeps Sentry optional and avoids type-check pulling the module.
// deno-lint-ignore no-explicit-any
let SentryMod: any = null;
let initPromise: Promise<void> | null = null;

async function getSentry(): Promise<any> {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) return null;
  if (SentryMod) return SentryMod;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        // @ts-ignore - runtime dynamic import; type-check skipped
        const mod = await import("https://deno.land/x/sentry/index.ts");
        mod.init({
          dsn,
          tracesSampleRate: 1.0,
          environment: Deno.env.get("SENTRY_ENV") ?? "production",
        });
        SentryMod = mod;
      } catch (e) {
        console.error("[sentry] init failed", e);
      }
    })();
  }
  await initPromise;
  return SentryMod;
}

export const initSentry = () => {
  // Fire and forget; getSentry() is idempotent
  void getSentry();
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  console.error(error);
  void getSentry().then((s) => {
    if (s) s.captureException(error as Error, { extra: context });
  });
};

export const addBreadcrumb = (
  message: string,
  data?: Record<string, unknown>,
  level: "info" | "warning" | "error" = "info",
  category = "edge",
) => {
  void getSentry().then((s) => {
    if (s) s.addBreadcrumb({ message, data, level, category, timestamp: Date.now() / 1000 });
  });
};

/**
 * Wraps an edge function handler with Sentry init, request breadcrumbs,
 * requestId correlation and centralized exception capture.
 */
export const withSentry = (
  fnName: string,
  handler: (req: Request, ctx: { requestId: string }) => Promise<Response>,
) => {
  initSentry();
  return async (req: Request): Promise<Response> => {
    const requestId =
      req.headers.get("x-request-id") ??
      req.headers.get("x-correlation-id") ??
      crypto.randomUUID();
    addBreadcrumb(`${fnName}:request`, {
      method: req.method,
      url: req.url,
      requestId,
    });
    try {
      const res = await handler(req, { requestId });
      addBreadcrumb(`${fnName}:response`, { status: res.status, requestId });
      // Echo requestId back so clients (and tests) can confirm correlation
      if (!res.headers.has("x-request-id")) {
        res.headers.set("x-request-id", requestId);
      }
      // Ensure browsers/proxies expose the header to callers
      const expose = res.headers.get("access-control-expose-headers");
      if (!expose) {
        res.headers.set("access-control-expose-headers", "x-request-id");
      } else if (!/x-request-id/i.test(expose)) {
        res.headers.set("access-control-expose-headers", `${expose}, x-request-id`);
      }
      return res;
    } catch (err) {
      captureException(err, { fnName, requestId, url: req.url });
      throw err;
    }
  };
};
