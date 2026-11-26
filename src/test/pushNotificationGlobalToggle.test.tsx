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
 * Cobre tambem os efeitos colaterais apontados na revisao: falha de leitura nao
 * pode aparecer como "ligado"; a gravacao nao pode apagar as escolhas por tipo
 * feitas por outro controle depois do carregamento; e a criacao da linha nao pode
 * impor o DEFAULT de `type_preferences` (que ja traz campaign_progress, xp,
 * checkin e development_tip em push=false).
 */

let existingRow = false;
let stored: Record<string, unknown> = {};
let queryError = false;
let failNextWrite = false;
let failInsert = false;
let raceOnInsert = false;
const writes: Array<Record<string, unknown>> = [];

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/loggingService", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const applyWrite = (row: Record<string, unknown>) => {
  writes.push(row);
  stored = { ...stored, ...row };
};

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
      update: (row: Record<string, unknown>) => ({
        eq: () => {
          const run = () => {
            if (failNextWrite) {
              failNextWrite = false;
              return { data: null, error: new Error("falha simulada") };
            }
            if (!existingRow) return { data: [], error: null };
            applyWrite(row);
            return { data: [{ user_id: "u1" }], error: null };
          };
          return {
            select: async () => run(),
            then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve().then(run).then(resolve, reject),
          };
        },
      }),
      insert: async (row: Record<string, unknown>) => {
        if (failInsert) {
          failInsert = false;
          return { error: Object.assign(new Error("falha simulada"), { code: "500" }) };
        }
        if (raceOnInsert) {
          raceOnInsert = false;
          existingRow = true;
          stored = { ...stored, user_id: "u1" };
          return { error: Object.assign(new Error("duplicate key"), { code: "23505" }) };
        }
        if (existingRow) {
          return { error: Object.assign(new Error("duplicate key"), { code: "23505" }) };
        }
        existingRow = true;
        applyWrite(row);
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
  failNextWrite = false;
  failInsert = false;
  raceOnInsert = false;
  writes.length = 0;
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

  it("primeira gravacao cria a linha sem os padroes por tipo do banco", async () => {
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({ user_id: "u1", push_enabled: false });
    expect(writes[0].type_preferences).toEqual({});
  });

  it("com linha existente atualiza so push_enabled", async () => {
    existingRow = true;
    stored = { push_enabled: true };
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toEqual({ push_enabled: false });
  });

  it("nao apaga escolhas por tipo salvas por outro controle depois do carregamento", async () => {
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());

    // Outro card do perfil cria a linha e salva uma escolha por tipo.
    existingRow = true;
    stored = { push_enabled: true, type_preferences: { quest: { push: false } } };

    await userEvent.click(toggle());
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(stored.type_preferences).toEqual({ quest: { push: false } });
    expect(writes[0]).not.toHaveProperty("type_preferences");
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

  it("nao confirma a pausa quando nada foi gravado", async () => {
    failInsert = true;
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toBeChecked());
    expect(writes).toHaveLength(0);
  });

  it("confirma a pausa quando outra tela cria a linha no meio do caminho", async () => {
    raceOnInsert = true;
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(stored.push_enabled).toBe(false));
    expect(toggle()).not.toBeChecked();
    expect(writes).toEqual([{ push_enabled: false }]);
  });

  it("volta o interruptor para o valor anterior quando a gravacao falha", async () => {
    existingRow = true;
    stored = { push_enabled: true };
    failNextWrite = true;
    render(<PushNotificationGlobalToggle />);
    await waitFor(() => expect(toggle()).toBeEnabled());
    await userEvent.click(toggle());
    await waitFor(() => expect(toggle()).toBeChecked());
  });
});