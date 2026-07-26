/**
 * Impressão digital do aparelho — chave única que une o histórico de acessos
 * (`user_devices`) às inscrições de notificação (`push_subscriptions`).
 *
 * Precisa ser estável entre sessões e idêntica nos dois fluxos: se cada lado
 * calcular de um jeito, revogar um acesso não desligaria o push do mesmo
 * aparelho — exatamente a incoerência que esta camada existe para evitar.
 *
 * A função pura recebe os sinais já coletados para poder ser simulada.
 */

export interface FingerprintSignals {
  userAgent: string;
  language: string;
  colorDepth: number | string;
  screenSize: string;
  timezoneOffset: number | string;
  hardwareConcurrency: number | string;
  deviceMemory: number | string;
}

export const FINGERPRINT_LENGTH = 32;

function toToken(value: unknown): string {
  if (value === null || value === undefined || value === "") return "unknown";
  const text = String(value).trim();
  return text.length > 0 ? text : "unknown";
}

/** Base64 tolerante a unicode (btoa puro estoura com acentos em UA exóticos). */
function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  if (typeof btoa === "function") return btoa(binary);
  // Ambiente sem `btoa` (SSR/teste): fallback determinístico e sem I/O.
  return Buffer.from(bytes).toString("base64");
}

/** Deriva a impressão digital determinística a partir dos sinais coletados. */
export function computeDeviceFingerprint(signals: Partial<FingerprintSignals> | null | undefined): string {
  const parts = [
    toToken(signals?.userAgent),
    toToken(signals?.language),
    toToken(signals?.colorDepth),
    toToken(signals?.screenSize),
    toToken(signals?.timezoneOffset),
    toToken(signals?.hardwareConcurrency),
    toToken(signals?.deviceMemory),
  ];
  return encodeBase64(parts.join("|")).slice(0, FINGERPRINT_LENGTH);
}

/** Coleta os sinais do navegador atual. Retorna `null` fora do browser. */
export function collectFingerprintSignals(): FingerprintSignals | null {
  if (typeof navigator === "undefined" || typeof window === "undefined") return null;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const screen = window.screen;
  return {
    userAgent: nav.userAgent,
    language: nav.language,
    colorDepth: screen?.colorDepth ?? "unknown",
    screenSize: `${screen?.width ?? 0}x${screen?.height ?? 0}`,
    timezoneOffset: new Date().getTimezoneOffset(),
    hardwareConcurrency: nav.hardwareConcurrency ?? "unknown",
    deviceMemory: nav.deviceMemory ?? "unknown",
  };
}

/** Impressão digital deste navegador, ou `null` fora do browser. */
export function getDeviceFingerprint(): string | null {
  const signals = collectFingerprintSignals();
  return signals ? computeDeviceFingerprint(signals) : null;
}