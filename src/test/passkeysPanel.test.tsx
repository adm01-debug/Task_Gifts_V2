import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  webauthn: {
    isSupported: true,
    hasBiometric: false,
    credentials: [],
    isLoading: false,
    register: vi.fn(),
    isRegistering: false,
    remove: vi.fn(),
    isRemoving: false,
    rename: vi.fn(),
    isRenaming: false,
  },
  twoFactor: { isEnabled: false },
  isFunctionDeployed: vi.fn(() => true),
}));

vi.mock("@/hooks/useWebAuthn", () => ({ useWebAuthn: () => mocks.webauthn }));
vi.mock("@/hooks/useTwoFactor", () => ({ useTwoFactor: () => mocks.twoFactor }));
vi.mock("@/lib/edgeAvailability", () => ({ isFunctionDeployed: mocks.isFunctionDeployed }));

const { PasskeysPanel } = await import("@/components/security/PasskeysPanel");

beforeEach(() => {
  mocks.webauthn.isSupported = true;
  mocks.twoFactor.isEnabled = false;
  mocks.isFunctionDeployed.mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PasskeysPanel — cadastro so quando o login por passkey funciona", () => {
  it("libera o cadastro quando a funcao esta publicada e a conta nao exige segundo fator", () => {
    render(<PasskeysPanel />);

    expect(screen.getByRole("button", { name: /adicionar passkey/i })).toBeEnabled();
  });

  it("bloqueia o cadastro e explica quando a conta exige verificacao em duas etapas", () => {
    mocks.twoFactor.isEnabled = true;

    render(<PasskeysPanel />);

    expect(screen.getByRole("button", { name: /adicionar passkey/i })).toBeDisabled();
    expect(
      screen.getByText(/verificação em duas etapas, que o login por passkey não substitui/i),
    ).toBeInTheDocument();
  });

  it("bloqueia o cadastro quando a funcao nao esta liberada no ambiente", () => {
    mocks.isFunctionDeployed.mockReturnValue(false);

    render(<PasskeysPanel />);

    expect(screen.getByRole("button", { name: /adicionar passkey/i })).toBeDisabled();
    expect(screen.getByText(/não está liberado neste ambiente/i)).toBeInTheDocument();
  });
});