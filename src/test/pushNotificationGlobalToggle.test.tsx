import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Contrato do kill-switch global de push: `notification_preferences.push_enabled`
 * e lido por `user_wants_push_notification` dentro de `enqueue_push`, entao sem
 * interruptor na tela o usuario nao tinha como pausar o push sem desinscrever o
 * aparelho. O teste fixa leitura, gravacao do valor e reversao em erro.
 */

let stored: { push_enabled?: boolean } = {};
const upserts: Array<Record<string, unknown>> = [];
let failNextUpsert = false;

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/loggingService", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { push_enabled: stored.push_enabled }, error: null }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        if (failNextUpsert) {
          failNextUpsert = false;
          return { error: new Error("falha simulada") };
        }
        upserts.push(row);
        stored = { ...stored, ...row };
        return { error: null };
      },
    }),
  },
}));

import { PushNotificationGlobalToggle } from "@/components/PushNotificationGlobalToggle";

const toggle = () => screen.getByRole("switch");

beforeEach(() => {
  stored = {};
  upserts.length = 0;
  failNextUpsert = false;
});

afterEach(() => cleanup());

describe("PushNotificationGlobalToggle", () => {
  it("comeca ligado quando o banco nao tem valor (COALESCE default true)", async () => {
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    expect(toggle()).toBeChecked();
  });

  it("reflete push_enabled=false salvo no banco", async () => {
    stored = { push_enabled: false };
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).not.toBeChecked());
    expect(screen.getByText(/a fila descarta os avisos/i)).toBeInTheDocument();
  });

  it("grava push_enabled no upsert por user_id ao desligar", async () => {
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(upserts).toHaveLength(1));
    expect(upserts[0]).toMatchObject({ user_id: "u1", push_enabled: false });
    expect(toggle()).not.toBeChecked();
  });

  it("volta o interruptor para o valor anterior quando o upsert falha", async () => {
    failNextUpsert = true;
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toBeChecked());
  });
});