import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navigate = vi.fn();
const markRead = vi.fn();
const remove = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: "n-auction",
        user_id: "u1",
        type: "auction",
        title: "Leilão encerrando",
        message: "Seu lance está em primeiro lugar.",
        // Aviso antigo: so o payload de negocio, sem `url`.
        data: { auctionId: "a1" },
        read: false,
        created_at: new Date().toISOString(),
      },
    ],
    unreadCount: 1,
    isLoading: false,
    realtimeEnabled: false,
  }),
  useMarkAsRead: () => ({ mutate: markRead }),
  useMarkAllAsRead: () => ({ mutate: vi.fn() }),
  useDeleteNotification: () => ({ mutate: remove }),
  useClearAllNotifications: () => ({ mutate: vi.fn() }),
}));

import { NotificationCenter } from "@/components/NotificationCenter";

beforeEach(() => {
  navigate.mockClear();
  markRead.mockClear();
  remove.mockClear();
  // O Radix usa ResizeObserver, ausente no jsdom.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

async function abrirPainel() {
  const user = userEvent.setup();
  render(<NotificationCenter />);
  await user.click(screen.getByRole("button", { name: /Notifica/ }));
  return user;
}

describe("NotificationCenter com aviso sem data.url", () => {
  it("navega para o leilao ao acionar o aviso", async () => {
    const user = await abrirPainel();
    await user.click(await screen.findByText("Leilão encerrando"));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/leilao"));
  });

  it("Enter no botao Excluir exclui, nao navega", async () => {
    const user = await abrirPainel();
    const excluir = await screen.findByRole("button", { name: /Excluir notifica/ });
    excluir.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(remove).toHaveBeenCalledWith("n-auction"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("Enter no proprio aviso navega", async () => {
    const user = await abrirPainel();
    const aviso = (await screen.findByText("Leilão encerrando")).closest("[role='button']");
    expect(aviso).not.toBeNull();
    (aviso as HTMLElement).focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/leilao"));
  });
});