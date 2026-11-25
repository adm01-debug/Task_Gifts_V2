import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * Contrato do painel "Avisos de pesquisa": os dois lembretes automaticos
 * (engajamento e clima) precisam de interruptor proprio, porque hoje so existia
 * o liga/desliga global e quem queria silencio perdia tambem o que importa.
 */

let stored: Record<string, unknown> = {};
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
          maybeSingle: async () => ({ data: { type_preferences: stored }, error: null }),
        }),
      }),
      upsert: async (row: { type_preferences: Record<string, unknown> }) => {
        upserts.push(row.type_preferences);
        stored = row.type_preferences;
        return { error: null };
      },
    }),
  },
}));

import { SurveyNotificationPreferences } from "@/components/SurveyNotificationPreferences";

beforeEach(() => {
  stored = {};
  upserts.length = 0;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SurveyNotificationPreferences", () => {
  it("mostra in-app e push dos dois lembretes, ligados por padrao", async () => {
    render(<SurveyNotificationPreferences />);

    const switches = await screen.findAllByRole("switch");
    expect(switches).toHaveLength(4);
    for (const sw of switches) expect(sw).toBeChecked();
  });

  it("hidrata o que ja esta salvo sem alterar o outro lembrete", async () => {
    stored = { climate_survey_reminder: { in_app: false, push: false } };
    render(<SurveyNotificationPreferences />);

    const climaInApp = await screen.findByRole("switch", {
      name: /Lembrete da pesquisa de clima . In-app/i,
    });
    await waitFor(() => expect(climaInApp).not.toBeChecked());
    expect(
      screen.getByRole("switch", { name: /Lembrete da pesquisa de engajamento . Push/i }),
    ).toBeChecked();
  });

  it("desligar um canal grava so aquele tipo e preserva os demais modulos", async () => {
    stored = { card_pack: { in_app: true, push: true, email: false } };
    const user = userEvent.setup();
    render(<SurveyNotificationPreferences />);

    await user.click(
      await screen.findByRole("switch", { name: /Lembrete da pesquisa de clima . Push/i }),
    );

    await waitFor(() => expect(upserts.length).toBe(1));
    const written = upserts[0]!;
    expect(written.card_pack).toEqual({ in_app: true, push: true, email: false });
    expect(written.climate_survey_reminder).toMatchObject({ in_app: true, push: false });
    expect(written.engagement_survey_reminder).toBeUndefined();
  });
});