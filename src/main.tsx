import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Sentry — configuração condicional por ambiente (Item #6).
// Regras:
//  - Só inicializa quando VITE_SENTRY_DSN está definido.
//  - Em produção: amostragem baixa de traces e sessions para não gastar quota.
//  - Em dev/preview: sem replays de sessão contínua (apenas em erro), traces amostrados.
//  - Session Replay com mascaramento total de texto e mídia para proteger PII.
//  - Filtro beforeSend descarta erros de ruído conhecidos (extensões, network aborts).
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const MODE = import.meta.env.MODE;
const IS_PROD = MODE === "production";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        maskAllInputs: true,
      }),
    ],
    tracesSampleRate: IS_PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: IS_PROD ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      "Non-Error promise rejection captured",
      "NetworkError when attempting to fetch resource",
      "AbortError",
      "Failed to fetch",
      /Loading chunk \d+ failed/,
      /Loading CSS chunk \d+ failed/,
    ],
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
    beforeSend(event, hint) {
      // Não enviar erros originados de extensões do browser.
      const stack = hint?.originalException instanceof Error
        ? hint.originalException.stack ?? ""
        : "";
      if (/chrome-extension:|moz-extension:/i.test(stack)) return null;
      return event;
    },
  });
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
