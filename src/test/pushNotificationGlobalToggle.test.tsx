import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Contrato do kill-switch global de push: `notification_preferences.push_enabled`
 * e lido por `user_wants_push_notification` em `enqueue_push` e no
 * `push-outbox-dispatcher`, entao sem interruptor na tela o usuario nao tinha como
 * pausar o push sem desinscrever o aparelho.
 *
 * Cobre tambem os dois efeitos colaterais que a revisao apontou: falha de leitura
 * nao pode aparecer como "ligado", e a primeira gravacao nao pode impor o DEFAULT
 * de `type_preferences` (que ja vem com campaign_progress/xp/checkin em push=false).
 */

let existingRow = false;
let stored: Record<string, unknown> = {};
let queryError = false;
let failNextUpsert = false;
const upserts: Array<Record<string, unknown>> = [];

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
          maybeSingle: async () => {
            if (queryError) return { data: null, error: new Error("falha simulada") };
            return { data: existingRow ? { push_enabled: stored.push_enabled } : null, error: null };
          },
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        if (failNextUpsert) {
          failNextUpsert = false;
          return { error: new Error("falha simulada") };
        }
        upserts.push(row);
        existingRow = true;
        stored = { ...stored, ...row };
        return { error: null };
      },
    }),
  },
}));

import { PushNotificationGlobalToggle } from "@/components/PushNotificationGlobalToggle";

const toggle = () => screen.getByRole("switch");

beforeEach(() => {
  existingRow = false;
  stored = {};
  queryError = false;
  failNextUpsert = false;
  upserts.length = 0;
});

afterEach(() => cleanup());

describe("PushNotificationGlobalToggle", () => {
  it("comeca ligado quando a conta nao tem linha (COALESCE default true)", async () => {
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    expect(toggle()).toBeChecked();
  });

  it("reflete push_enabled=false salvo no banco", async () => {
    existingRow = true;
    stored = { push_enabled: false };
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).not.toBeChecked());
    expect(screen.getByText(/sao descartados antes do envio/i)).toBeInTheDocument();
  });

  it("primeira gravacao nao impoe os padroes por tipo do banco", async () => {
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(upserts).toHaveLength(1));
    expect(upserts[0]).toMatchObject({ user_id: "u1", push_enabled: false });
    expect(upserts[0].type_preferences).toEqual({});
  });

  it("com linha existente nao toca em type_preferences", async () => {
    existingRow = true;
    stored = { push_enabled: true };
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(upserts).toHaveLength(1));
    expect(upserts[0]).not.toHaveProperty("type_preferences");
  });

  it("mostra erro de leitura, esconde o interruptor e recarrega ao tentar de novo", async () => {
    queryError = true;
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();

    queryError = false;
    await userEvent.click(screen.getByRole("button", { name: /tentar de novo/i }));
    await waitFor(() => expect(toggle()).toBeChecked());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("volta o interruptor para o valor anterior quando o upsert falha", async () => {
    existingRow = true;
    stored = { push_enabled: true };
    failNextUpsert = true;
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toBeChecked());
  });
});