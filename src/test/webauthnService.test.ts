import { describe, it, expect, vi, beforeEach } from "vitest";

const { invokeEdgeSafeMock, isFunctionDeployedMock, verifyOtpMock, loggerMock } = vi.hoisted(() => ({
  invokeEdgeSafeMock: vi.fn(),
  isFunctionDeployedMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  loggerMock: { apiError: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/requestId", () => ({ invokeEdgeSafe: invokeEdgeSafeMock }));
vi.mock("@/lib/edgeAvailability", () => ({ isFunctionDeployed: isFunctionDeployedMock }));
vi.mock("@/services/loggingService", () => ({ logger: loggerMock }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { verifyOtp: verifyOtpMock }, from: vi.fn() },
}));

const { webauthnService } = await import("@/services/webauthnService");

const CHALLENGE = "Y2hhbGxlbmdlLWRlLXRlc3Rl";

function toBase64Url(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fakeAssertion(challenge = CHALLENGE) {
  const clientDataJSON = new TextEncoder().encode(
    JSON.stringify({ type: "webauthn.get", challenge, origin: "https://app.exemplo.com" }),
  );
  return {
    rawId: new Uint8Array([1, 2, 3, 4]).buffer,
    response: {
      clientDataJSON: clientDataJSON.buffer,
      authenticatorData: new Uint8Array(37).buffer,
      signature: new Uint8Array([9, 9, 9]).buffer,
    },
  };
}

const getMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  isFunctionDeployedMock.mockReturnValue(true);
  verifyOtpMock.mockResolvedValue({ error: null });
  Object.defineProperty(window, "PublicKeyCredential", {
    value: function PublicKeyCredential() {},
    configurable: true,
  });
  Object.defineProperty(navigator, "credentials", {
    value: { get: getMock },
    configurable: true,
  });
  getMock.mockResolvedValue(fakeAssertion());
});

describe("webauthnService.authenticate — login por passkey verificado no servidor", () => {
  it("emite sessão só depois de options → get → verify e confirma o token", async () => {
    invokeEdgeSafeMock
      .mockResolvedValueOnce({
        data: {
          ok: true,
          challenge: CHALLENGE,
          rpId: "app.exemplo.com",
          timeout: 60000,
          userVerification: "required",
          allowCredentials: [{ id: toBase64Url([1, 2, 3, 4]), type: "public-key" }],
        },
        error: null,
        requestId: "req-1",
        attempts: 1,
      })
      .mockResolvedValueOnce({
        data: { ok: true, tokenHash: "hash-de-sessao", email: "rh@empresa.com", userId: "user-1" },
        error: null,
        requestId: "req-2",
        attempts: 1,
      });

    const result = await webauthnService.authenticate("rh@empresa.com");

    expect(result).toEqual({ success: true, userId: "user-1" });
    expect(invokeEdgeSafeMock).toHaveBeenCalledTimes(2);

    const [firstFn, firstOptions] = invokeEdgeSafeMock.mock.calls[0];
    expect(firstFn).toBe("passkey-auth");
    expect(firstOptions.body).toEqual({ action: "options", email: "rh@empresa.com" });

    const [secondFn, secondOptions] = invokeEdgeSafeMock.mock.calls[1];
    expect(secondFn).toBe("passkey-auth");
    expect(secondOptions.body.action).toBe("verify");
    expect(secondOptions.body.credentialId).toBe(toBase64Url([1, 2, 3, 4]));
    // Challenge é de uso único: repetir a chamada queimaria a tentativa.
    expect(secondOptions.maxAttempts).toBe(1);

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(verifyOtpMock).toHaveBeenCalledWith({ token_hash: "hash-de-sessao", type: "magiclink" });
  });

  it("restrição de credenciais é repassada ao autenticador", async () => {
    invokeEdgeSafeMock
      .mockResolvedValueOnce({
        data: {
          ok: true,
          challenge: CHALLENGE,
          rpId: "app.exemplo.com",
          allowCredentials: [{ id: toBase64Url([7, 8]), type: "public-key" }],
        },
        error: null,
        requestId: "req-1",
        attempts: 1,
      })
      .mockResolvedValueOnce({
        data: { ok: true, tokenHash: "h", email: "a@b.c", userId: "u" },
        error: null,
        requestId: "req-2",
        attempts: 1,
      });

    await webauthnService.authenticate();

    const publicKey = getMock.mock.calls[0][0].publicKey;
    expect(publicKey.rpId).toBe("app.exemplo.com");
    expect(publicKey.userVerification).toBe("required");
    expect(publicKey.allowCredentials).toHaveLength(1);
    expect(invokeEdgeSafeMock.mock.calls[0][1].body.email).toBeUndefined();
  });

  it("não chama a rede quando a função não está na allowlist de deploy", async () => {
    isFunctionDeployedMock.mockReturnValue(false);

    const result = await webauthnService.authenticate("rh@empresa.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("indisponível");
    expect(invokeEdgeSafeMock).not.toHaveBeenCalled();
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("devolve mensagem clara quando o contador sai de ordem (sem bloquear a passkey)", async () => {
    invokeEdgeSafeMock
      .mockResolvedValueOnce({
        data: { ok: true, challenge: CHALLENGE, rpId: "app.exemplo.com" },
        error: null,
        requestId: "req-1",
        attempts: 1,
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          kind: "bad_request",
          status: 409,
          retryable: false,
          retryAfterSeconds: null,
          message: "contador_fora_de_ordem",
        },
        requestId: "req-2",
        attempts: 1,
      });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tente novamente em alguns segundos");
    expect(result.error).not.toContain("bloqueada");
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("avisa quando a passkey apresentada é de outra conta", async () => {
    invokeEdgeSafeMock
      .mockResolvedValueOnce({
        data: { ok: true, challenge: CHALLENGE, rpId: "app.exemplo.com" },
        error: null,
        requestId: "req-1",
        attempts: 1,
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          kind: "bad_request",
          status: 409,
          retryable: false,
          retryAfterSeconds: null,
          message: "conta_diferente",
        },
        requestId: "req-2",
        attempts: 1,
      });

    const result = await webauthnService.authenticate("rh@empresa.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("outra conta");
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("não emite sessão quando a conta exige segundo fator", async () => {
    invokeEdgeSafeMock
      .mockResolvedValueOnce({
        data: { ok: true, challenge: CHALLENGE, rpId: "app.exemplo.com" },
        error: null,
        requestId: "req-1",
        attempts: 1,
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          kind: "forbidden",
          status: 403,
          retryable: false,
          retryAfterSeconds: null,
          message: "mfa_obrigatorio",
        },
        requestId: "req-2",
        attempts: 1,
      });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toContain("duas etapas");
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("falha sem criar sessão quando o token não pôde ser trocado por sessão", async () => {
    invokeEdgeSafeMock
      .mockResolvedValueOnce({
        data: { ok: true, challenge: CHALLENGE, rpId: "app.exemplo.com" },
        error: null,
        requestId: "req-1",
        attempts: 1,
      })
      .mockResolvedValueOnce({
        data: { ok: true, tokenHash: "h", email: "a@b.c", userId: "u" },
        error: null,
        requestId: "req-2",
        attempts: 1,
      });
    verifyOtpMock.mockResolvedValue({ error: { message: "token expirado" } });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Não foi possível criar a sessão");
  });

  it("aborta antes da biometria quando o servidor não emite o challenge", async () => {
    invokeEdgeSafeMock.mockResolvedValueOnce({
      data: null,
      error: { kind: "not_found", status: 404, retryable: false, message: "não deployada" },
      requestId: "req-1",
      attempts: 0,
    });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Não foi possível iniciar o login por passkey");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("trata cancelamento do usuário no prompt biométrico", async () => {
    invokeEdgeSafeMock.mockResolvedValueOnce({
      data: { ok: true, challenge: CHALLENGE, rpId: "app.exemplo.com" },
      error: null,
      requestId: "req-1",
      attempts: 1,
    });
    const cancel = new Error("cancelado");
    cancel.name = "NotAllowedError";
    getMock.mockRejectedValueOnce(cancel);

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Operação cancelada pelo usuário");
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("não tenta autenticar quando o navegador não suporta WebAuthn", async () => {
    Object.defineProperty(window, "PublicKeyCredential", { value: undefined, configurable: true });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toContain("não é suportado");
    expect(invokeEdgeSafeMock).not.toHaveBeenCalled();
  });
});
