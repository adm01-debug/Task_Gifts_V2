import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { invokeEdgeSafe } from "@/lib/requestId";
import { isFunctionDeployed } from "@/lib/edgeAvailability";
import type { EdgeErrorInfo } from "@/lib/edgeErrors";

// Tipos
export interface WebAuthnCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_type: string;
  device_name: string | null;
  transports: string[] | null;
  aaguid: string | null;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: { alg: number; type: "public-key" }[];
  timeout: number;
  attestation: AttestationConveyancePreference;
  authenticatorSelection: {
    authenticatorAttachment?: AuthenticatorAttachment;
    requireResidentKey: boolean;
    residentKey: ResidentKeyRequirement;
    userVerification: UserVerificationRequirement;
  };
  excludeCredentials: { id: ArrayBuffer; type: "public-key"; transports?: AuthenticatorTransport[] }[];
}

/** Resposta de `passkey-auth` no passo `options`. */
interface PasskeyOptionsResponse {
  ok: boolean;
  challenge?: string;
  rpId?: string;
  timeout?: number;
  userVerification?: string;
  allowCredentials?: { id: string; type?: string }[];
  error?: string;
}

/** Resposta de `passkey-auth` no passo `verify`. */
interface PasskeyVerifyResponse {
  ok: boolean;
  tokenHash?: string;
  email?: string;
  userId?: string;
  error?: string;
}

/** Motivos de recusa devolvidos pela Edge Function, em linguagem de usuário. */
const PASSKEY_ERROR_MESSAGES: Record<string, string> = {
  rate_limited: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  challenge_invalido: "Tempo de autenticação expirado. Tente novamente.",
  credencial_nao_encontrada: "Nenhuma passkey ativa para este dispositivo.",
  credencial_invalida: "Esta passkey está corrompida. Cadastre novamente em Perfil → Passkeys.",
  conta_diferente: "Essa passkey pertence a outra conta. Use a passkey do e-mail informado.",
  mfa_obrigatorio:
    "Sua conta usa verificação em duas etapas. Entre com e-mail e senha e confirme o código.",
  contador_fora_de_ordem:
    "Não foi possível confirmar a passkey agora. Tente novamente em alguns segundos.",
  concorrencia: "Outra tentativa de login foi concluída. Tente novamente.",
  assinatura_invalida: "Não foi possível validar a biometria. Tente novamente.",
  origem_nao_permitida: "Domínio não autorizado para login por passkey.",
  rp_id_invalido: "Passkey registrada para outro domínio.",
  usuario_nao_presente: "Presença do usuário não confirmada.",
  verificacao_do_usuario_ausente: "Confirme a biometria ou o PIN do dispositivo.",
};

/**
 * Mensagem de usuário para o motivo da recusa. O 429 tem prioridade porque a
 * espera exata (`retryAfterSeconds`) importa mais que o rótulo do motivo.
 */
export function passkeyFailureMessage(
  code: string,
  error: EdgeErrorInfo | null | undefined,
  fallback: string,
): string {
  if (error?.kind === "rate_limited") {
    const seconds = error.retryAfterSeconds ?? 60;
    return `Muitas tentativas. Aguarde ${seconds} segundos e tente novamente.`;
  }
  return PASSKEY_ERROR_MESSAGES[code] ?? fallback;
}

// Utilitários
function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64URLDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

// Verificar suporte a WebAuthn
export function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

// Verificar suporte a biometria
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

// Serviço WebAuthn
export const webauthnService = {
  // Gerar opções de registro
  async generateRegistrationOptions(userId: string, userEmail: string, displayName: string): Promise<RegistrationOptions> {
    const challenge = generateChallenge();
    
    // Salvar challenge no banco
    await supabase.from("webauthn_challenges").insert({
      user_id: userId,
      challenge,
      type: "registration"
    });

    // Buscar credenciais existentes para excluir
    const { data: existingCredentials } = await supabase
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", userId)
      .eq("is_active", true);

    const excludeCredentials = (existingCredentials || []).map(cred => ({
      id: base64URLDecode(cred.credential_id),
      type: "public-key" as const,
      transports: (cred.transports as AuthenticatorTransport[]) || undefined
    }));

    return {
      challenge,
      rp: {
        name: "Task Gifts",
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: userEmail,
        displayName: displayName || userEmail
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "required"
      },
      excludeCredentials
    };
  },

  // Registrar credencial
  async register(userId: string, userEmail: string, displayName: string, deviceName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isWebAuthnSupported()) {
        return { success: false, error: "WebAuthn não é suportado neste navegador" };
      }

      const options = await this.generateRegistrationOptions(userId, userEmail, displayName);
      
      // Criar opções para API do navegador
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64URLDecode(options.challenge),
        rp: options.rp,
        user: {
          id: new TextEncoder().encode(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        attestation: options.attestation,
        authenticatorSelection: options.authenticatorSelection,
        excludeCredentials: options.excludeCredentials
      };

      // Chamar API WebAuthn
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (!credential) {
        return { success: false, error: "Falha ao criar credencial" };
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      
      // Extrair dados
      const credentialId = base64URLEncode(credential.rawId);
      const publicKey = base64URLEncode(response.getPublicKey()!);
      const transports = response.getTransports?.() || [];
      
      // Determinar tipo de dispositivo
      let deviceType = "unknown";
      if (transports.includes("internal")) {
        deviceType = "platform";
      } else if (transports.includes("usb") || transports.includes("nfc") || transports.includes("ble")) {
        deviceType = "security-key";
      }

      // Salvar no banco
      const { error } = await supabase.from("webauthn_credentials").insert({
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        device_type: deviceType,
        device_name: deviceName || this.getDeviceName(),
        transports,
        counter: 0
      });

      if (error) {
        logger.apiError('Save credential', error, 'webauthnService');
        return { success: false, error: "Erro ao salvar credencial" };
      }

      // Limpar challenge usado
      await supabase
        .from("webauthn_challenges")
        .delete()
        .eq("user_id", userId)
        .eq("challenge", options.challenge);

      return { success: true };
    } catch (err: unknown) {
      logger.apiError('WebAuthn register', err, 'webauthnService');
      
      const error = err as Error & { name?: string };
      if (error.name === "NotAllowedError") {
        return { success: false, error: "Operação cancelada pelo usuário" };
      }
      if (error.name === "InvalidStateError") {
        return { success: false, error: "Este dispositivo já está registrado" };
      }
      
      return { success: false, error: error.message || "Erro ao registrar passkey" };
    }
  },

  // Autenticar com passkey. O servidor (`passkey-auth`) emite o challenge,
  // valida a assinatura e só então devolve um token de sessão — o cliente não
  // decide mais se o login é válido.
  async authenticate(email?: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      if (!isWebAuthnSupported()) {
        return { success: false, error: "WebAuthn não é suportado neste navegador" };
      }
      if (!isFunctionDeployed("passkey-auth")) {
        return { success: false, error: "Login por passkey indisponível no momento" };
      }

      const optionsResult = await invokeEdgeSafe<PasskeyOptionsResponse>("passkey-auth", {
        body: { action: "options", email: email?.trim() || undefined },
        maxAttempts: 2
      });
      const options = optionsResult.data;
      if (optionsResult.error || !options?.ok || !options.challenge || !options.rpId) {
        logger.apiError("WebAuthn options", optionsResult.error ?? new Error("resposta inválida"), "webauthnService");
        return {
          success: false,
          error: passkeyFailureMessage(
            optionsResult.error?.payloadCode ?? optionsResult.error?.message ?? "",
            optionsResult.error,
            "Não foi possível iniciar o login por passkey"
          )
        };
      }

      const allowCredentials = options.allowCredentials?.length
        ? options.allowCredentials.map((item) => ({
            id: base64URLDecode(item.id),
            type: "public-key" as const
          }))
        : undefined;

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: base64URLDecode(options.challenge),
          rpId: options.rpId,
          timeout: options.timeout ?? 60000,
          userVerification: (options.userVerification ?? "required") as UserVerificationRequirement,
          allowCredentials
        }
      })) as PublicKeyCredential | null;

      if (!assertion) {
        return { success: false, error: "Falha na autenticação" };
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      // maxAttempts 1: o challenge é de uso único no servidor; repetir a chamada
      // só queimaria a tentativa e devolveria erro confuso ao usuário.
      const verifyResult = await invokeEdgeSafe<PasskeyVerifyResponse>("passkey-auth", {
        body: {
          action: "verify",
          credentialId: base64URLEncode(assertion.rawId),
          authenticatorData: base64URLEncode(response.authenticatorData),
          clientDataJSON: base64URLEncode(response.clientDataJSON),
          signature: base64URLEncode(response.signature)
        },
        maxAttempts: 1
      });

      const verified = verifyResult.data;
      // Em resposta 4xx o corpo do erro carrega o código (`mfa_obrigatorio`,
      // `conta_diferente`, ...) e `invokeEdgeSafe` devolve `data: null`. Em
      // 401/429 o classificador troca a mensagem por uma fixa, então o código
      // vem de `payloadCode`; `error.message` fica como reserva.
      const failureCode =
        verified?.error ?? verifyResult.error?.payloadCode ?? verifyResult.error?.message ?? "";
      if (verifyResult.error || !verified?.ok || !verified.tokenHash || !verified.email) {
        return {
          success: false,
          error: passkeyFailureMessage(
            failureCode,
            verifyResult.error,
            "Não foi possível validar a passkey"
          )
        };
      }

      // A sessão só nasce depois de a assinatura ser validada no servidor.
      const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: verified.tokenHash,
        type: "magiclink"
      });
      if (sessionError) {
        logger.apiError("WebAuthn verifyOtp", sessionError, "webauthnService");
        return { success: false, error: "Não foi possível criar a sessão" };
      }

      return { success: true, userId: verified.userId };
    } catch (err: unknown) {
      logger.apiError("WebAuthn authenticate", err, "webauthnService");

      const error = err as Error & { name?: string };
      if (error.name === "NotAllowedError") {
        return { success: false, error: "Operação cancelada pelo usuário" };
      }

      return { success: false, error: error.message || "Erro na autenticação" };
    }
  },

  // Listar credenciais do usuário
  async getCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const { data, error } = await supabase
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      logger.apiError('Get credentials', error, 'webauthnService');
      return [];
    }

    return data as WebAuthnCredential[];
  },

  // Remover credencial
  async removeCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from("webauthn_credentials")
      .update({ is_active: false })
      .eq("id", credentialId);

    if (error) {
      return { success: false, error: "Erro ao remover credencial" };
    }

    return { success: true };
  },

  // Renomear credencial
  async renameCredential(credentialId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from("webauthn_credentials")
      .update({ device_name: newName })
      .eq("id", credentialId);

    if (error) {
      return { success: false, error: "Erro ao renomear credencial" };
    }

    return { success: true };
  },

  // Verificar se usuário tem passkeys
  async hasPasskeys(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc("user_has_passkeys", { p_user_id: userId });

    if (error) return false;
    return data === true;
  },

  // Helper para nome do dispositivo
  getDeviceName(): string {
    const ua = navigator.userAgent;
    
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/Mac/.test(ua)) return "Mac";
    if (/Android/.test(ua)) return "Android";
    if (/Windows/.test(ua)) return "Windows PC";
    if (/Linux/.test(ua)) return "Linux";
    
    return "Dispositivo";
  }
};
