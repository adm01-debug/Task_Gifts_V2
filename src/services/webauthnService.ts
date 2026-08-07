import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";

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

export interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  userVerification: UserVerificationRequirement;
  allowCredentials: { id: ArrayBuffer; type: "public-key"; transports?: AuthenticatorTransport[] }[];
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

  // Gerar opções de autenticação
  async generateAuthenticationOptions(email?: string): Promise<AuthenticationOptions & { credentialIds: string[] }> {
    const challenge = generateChallenge();
    
    // Salvar challenge
    await supabase.from("webauthn_challenges").insert({
      challenge,
      type: "authentication"
    });

    let allowCredentials: { id: ArrayBuffer; type: "public-key"; transports?: AuthenticatorTransport[] }[] = [];
    let credentialIds: string[] = [];

    // Se email fornecido, buscar credenciais do usuário
    if (email) {
      const { data: credentials } = await supabase
        .rpc("get_passkeys_by_email", { p_email: email });

      if (credentials && credentials.length > 0) {
        allowCredentials = credentials.map((cred: { credential_id: string }) => ({
          id: base64URLDecode(cred.credential_id),
          type: "public-key" as const
        }));
        credentialIds = credentials.map((cred: { credential_id: string }) => cred.credential_id);
      }
    }

    return {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: "required",
      allowCredentials,
      credentialIds
    };
  },

  // Autenticar com passkey
  async authenticate(email?: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      if (!isWebAuthnSupported()) {
        return { success: false, error: "WebAuthn não é suportado neste navegador" };
      }

      const options = await this.generateAuthenticationOptions(email);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64URLDecode(options.challenge),
        timeout: options.timeout,
        rpId: options.rpId,
        userVerification: options.userVerification,
        allowCredentials: options.allowCredentials.length > 0 ? options.allowCredentials : undefined
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (!assertion) {
        return { success: false, error: "Falha na autenticação" };
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      const credentialId = base64URLEncode(assertion.rawId);

      // Buscar credencial no banco
      const { data: credential, error: fetchError } = await supabase
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", credentialId)
        .eq("is_active", true)
        .maybeSingle();

      if (fetchError || !credential) {
        return { success: false, error: "Credencial não encontrada" };
      }

      // Verificar contador (proteção contra replay)
      const clientDataJSON = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
      const authenticatorData = new Uint8Array(response.authenticatorData);
      const newCounter = (authenticatorData[33] << 24) | (authenticatorData[34] << 16) | 
                         (authenticatorData[35] << 8) | authenticatorData[36];

      if (newCounter <= credential.counter && credential.counter !== 0) {
        return { success: false, error: "Possível ataque de replay detectado" };
      }

      // Atualizar contador e último uso
      await supabase
        .from("webauthn_credentials")
        .update({
          counter: newCounter,
          last_used_at: new Date().toISOString()
        })
        .eq("id", credential.id);

      // Limpar challenge usado
      await supabase
        .from("webauthn_challenges")
        .delete()
        .eq("challenge", options.challenge);

      return { success: true, userId: credential.user_id };
    } catch (err: unknown) {
      logger.apiError('WebAuthn authenticate', err, 'webauthnService');
      
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
