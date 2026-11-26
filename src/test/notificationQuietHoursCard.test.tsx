import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { NotificationQuietHoursCard } from "@/components/NotificationQuietHoursCard";

/**
 * Contrato da janela de silencio (`notification_preferences.do_not_disturb_*`,
 * lida por `push_quiet_hours_until` no `push-outbox-dispatcher`):
 * - default desligada, com 22:00-08:00 sugeridos;
 * - o nome legado (`quiet_hours_*`) aparece quando `do_not_disturb_*` e' nulo;
 * - ligar grava as quatro colunas e nao toca em `type_preferences`;
 * - falha de leitura nao pode aparecer como "ligado";
 * - falha de gravacao desfaz o que a tela mostrou.
 */

let existingRow = true;
let row: Record<string, unknown> = {};
let queryError = false;
let failNextWrite = false;
const writes: Array<Record<string, unknown>> = [];

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
            return { data: existingRow ? row : null, error: null };
          },
        }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: () => ({
          select: async () => {
            if (failNextWrite) {
              failNextWrite = false;
              return { data: null, error: new Error("falha simulada") };
            }
            if (!existingRow) return { data: [], error: null };
            writes.push(values);
            row = { ...row, ...values };
            return { data: [{ user_id: "u1" }], error: null };
          },
        }),
      }),
      insert: async (values: Record<string, unknown>) => {
        writes.push(values);
        existingRow = true;
        row = { ...values };
        return { error: null };
      },
    }),
  },
}));

beforeEach(() => {
  existingRow = true;
  row = {
    do_not_disturb_enabled: false,
    do_not_disturb_start: "22:00:00",
    do_not_disturb_end: "08:00:00",
    do_not_disturb_weekends: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
    type_preferences: { xp: { push: false } },
  };
  queryError = false;
  failNextWrite = false;
  writes.length = 0;
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => cleanup());

describe("janela de silencio", () => {
  it("comeca desligada, sugerindo 22:00-08:00", async () => {
    render(<NotificationQuietHoursCard />);
    const toggle = await screen.findByRole("switch", { name: /Silenciar avisos push/i });
    expect(toggle).toHaveAttribute("data-state", "unchecked");
    await waitFor(() => expect(screen.getByLabelText("Inicio do silencio")).toHaveValue("22:00"));
    expect(screen.getByLabelText("Fim do silencio")).toHaveValue("08:00");
    expect(screen.getByText(/Desligada\./)).toBeInTheDocument();
  });

  it("usa o nome legado quiet_hours quando do_not_disturb esta nulo", async () => {
    row = {
      ...row,
      do_not_disturb_start: null,
      do_not_disturb_end: null,
      quiet_hours_start: "23:00:00",
      quiet_hours_end: "07:00:00",
    };
    render(<NotificationQuietHoursCard />);
    await waitFor(() => expect(screen.getByLabelText("Inicio do silencio")).toHaveValue("23:00"));
    expect(screen.getByLabelText("Fim do silencio")).toHaveValue("07:00");
  });

  it("ligar grava as quatro colunas sem apagar type_preferences", async () => {
    render(<NotificationQuietHoursCard />);
    const toggle = await screen.findByRole("switch", { name: /Silenciar avisos push/i });
    await userEvent.click(toggle);

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toEqual({
      do_not_disturb_enabled: true,
      do_not_disturb_start: "22:00:00",
      do_not_disturb_end: "08:00:00",
      do_not_disturb_weekends: true,
    });
    expect(writes[0]).not.toHaveProperty("type_preferences");
    expect(toggle).toHaveAttribute("data-state", "checked");
    expect(toast.success).toHaveBeenCalled();
  });

  it("alterar o inicio persiste ao sair do campo", async () => {
    row = { ...row, do_not_disturb_enabled: true };
    render(<NotificationQuietHoursCard />);
    const inicio = await screen.findByLabelText("Inicio do silencio");
    fireEvent.change(inicio, { target: { value: "21:30" } });
    fireEvent.blur(inicio);

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({ do_not_disturb_start: "21:30:00", do_not_disturb_enabled: true });
  });

  it("falha de leitura aparece como erro, nao como ligado", async () => {
    queryError = true;
    render(<NotificationQuietHoursCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/nao reflete o que/i);
    expect(screen.getByRole("button", { name: /Tentar de novo/i })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: /Silenciar avisos push/i })).not.toBeInTheDocument();
    expect(writes).toHaveLength(0);
  });

  it("falha ao gravar desfaz o que a tela mostrou", async () => {
    failNextWrite = true;
    render(<NotificationQuietHoursCard />);
    const toggle = await screen.findByRole("switch", { name: /Silenciar avisos push/i });
    await userEvent.click(toggle);

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toggle).toHaveAttribute("data-state", "unchecked");
    expect(writes).toHaveLength(0);
  });

  it("sem linha ainda, cria com type_preferences vazio", async () => {
    existingRow = false;
    render(<NotificationQuietHoursCard />);
    const toggle = await screen.findByRole("switch", { name: /Silenciar avisos push/i });
    await userEvent.click(toggle);

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({ user_id: "u1", do_not_disturb_enabled: true, type_preferences: {} });
    expect(existingRow).toBe(true);
  });
});