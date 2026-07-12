import * as Sentry from "npm:@sentry/deno@8";

export const initSentry = () => {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (dsn) {
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      environment: Deno.env.get("SENTRY_ENV") ?? "production",
    });
  }
};

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  console.error(error);
  if (Deno.env.get("SENTRY_DSN")) {
    Sentry.captureException(error as Error, { extra: context });
  }
};

export const addBreadcrumb = (
  message: string,
  data?: Record<string, unknown>,
  level: "info" | "warning" | "error" = "info",
  category = "edge",
) => {
  if (Deno.env.get("SENTRY_DSN")) {
    Sentry.addBreadcrumb({ message, data, level, category, timestamp: Date.now() / 1000 });
  }
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
      return res;
    } catch (err) {
      captureException(err, { fnName, requestId, url: req.url });
      throw err;
    }
  };
};
