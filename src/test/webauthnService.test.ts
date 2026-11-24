import { describe, it, expect, vi, beforeEach } from "vitest";

const { invokeEdgeSafeMock, isFunctionDeployedMock, verifyOtpMock, fromMock, loggerMock } = vi.hoisted(() => ({
  invokeEdgeSafeMock: vi.fn(),
  isFunctionDeployedMock: vi.fn(),
  verifyOtpMock: vi.fn(),
  fromMock: vi.fn(),
  loggerMock: { apiError: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/requestId", () => ({ invokeEdgeSafe: invokeEdgeSafeMock }));
vi.mock("@/lib/edgeAvailability", () => ({ isFunctionDeployed: isFunctionDeployedMock }));
vi.mock("@/services/loggingService", () => ({ logger: loggerMock }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { verifyOtp: verifyOtpMock }, from: fromMock },
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
  // Cadeia do supabase-js para `webauthn_challenges`/`webauthn_credentials`:
  // `insert` resolve sem erro e `select(...).eq(...).eq(...)` devolve o mesmo
  // objeto (as queries de cadastro aceitam lista vazia de credenciais).
  const chain: Record<string, unknown> = {
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  fromMock.mockReturnValue(chain);
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

  it("informa o tempo de espera quando o limite de tentativas é atingido", async () => {
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
          kind: "rate_limited",
          status: 429,
          retryable: false,
          retryAfterSeconds: 45,
          message: "Muitas solicitações seguidas. Tente novamente em 45 segundos.",
          payloadCode: "rate_limited",
        },
        requestId: "req-2",
        attempts: 1,
      });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Muitas tentativas. Aguarde 45 segundos e tente novamente.");
  });

  it("usa o código do corpo quando o status 401 troca a mensagem por uma fixa", async () => {
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
          kind: "unauthorized",
          status: 401,
          retryable: false,
          retryAfterSeconds: null,
          message: "Sessão expirada. Entre novamente para continuar.",
          payloadCode: "challenge_invalido",
        },
        requestId: "req-2",
        attempts: 1,
      });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Tempo de autenticação expirado. Tente novamente.");
  });

  it("explica que o e-mail informado está inválido quando o contrato responde 422", async () => {
    invokeEdgeSafeMock.mockResolvedValueOnce({
      data: null,
      error: {
        kind: "invalid",
        status: 422,
        retryable: false,
        retryAfterSeconds: null,
        message: "A validação dos dados falhou: 1 campo(s) inválido(s)",
        payloadCode: null,
      },
      requestId: "req-1",
      attempts: 1,
    });

    const result = await webauthnService.authenticate("email-invalido");

    expect(result.success).toBe(false);
    expect(result.error).toContain("E-mail inválido");
    expect(result.error).toContain("limpe o campo");
  });

  it("mantém a mensagem genérica no 422 quando nenhum e-mail foi informado", async () => {
    invokeEdgeSafeMock.mockResolvedValueOnce({
      data: null,
      error: {
        kind: "invalid",
        status: 422,
        retryable: false,
        retryAfterSeconds: null,
        message: "A validação dos dados falhou: 1 campo(s) inválido(s)",
        payloadCode: null,
      },
      requestId: "req-1",
      attempts: 1,
    });

    const result = await webauthnService.authenticate();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Não foi possível iniciar o login por passkey");
  });
});

describe("webauthnService.generateRegistrationOptions — cadastro de passkey", () => {
  it("não restringe o cadastro ao autenticador de plataforma (chave externa)", async () => {
    const options = await webauthnService.generateRegistrationOptions(
      "user-1",
      "rh@empresa.com",
      "RH",
    );

    expect(options.authenticatorSelection.authenticatorAttachment).toBeUndefined();
    expect(options.authenticatorSelection.requireResidentKey).toBe(true);
    expect(options.authenticatorSelection.residentKey).toBe("required");
    expect(options.authenticatorSelection.userVerification).toBe("required");
    expect(options.rp.id).toBe(window.location.hostname);
  });
});
