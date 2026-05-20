import * as Sentry from "https://deno.land/x/sentry/index.ts";

export const initSentry = () => {
  const dsn = Deno.env.get("SENTRY_DSN");
  if (dsn) {
    Sentry.init({
      dsn,
      // Sample rate for transactions
      tracesSampleRate: 1.0,
    });
  }
};

export const captureException = (error: Error, context?: any) => {
  console.error(error);
  if (Deno.env.get("SENTRY_DSN")) {
    Sentry.captureException(error, { extra: context });
  }
};
