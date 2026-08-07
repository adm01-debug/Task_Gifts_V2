/**
 * Resolução confiável do IP do cliente.
 *
 * Modelo de confiança
 * -------------------
 * As Edge Functions ficam atrás do proxy da plataforma (Cloudflare). O header
 * `cf-connecting-ip` é SEMPRE sobrescrito por esse proxy, portanto é o único
 * valor que um cliente não consegue forjar.
 *
 * `x-real-ip` e `x-forwarded-for` são totalmente controláveis pelo cliente
 * (o proxy apenas ANEXA à cadeia existente, não a substitui). Usar o primeiro
 * elemento de `x-forwarded-for` — como o código anterior fazia — permite que
 * qualquer pessoa envie `X-Forwarded-For: 10.0.0.1` e se passe por um IP
 * autorizado, derrotando whitelist de IP e bloqueio geográfico.
 *
 * Por isso: só `cf-connecting-ip` é considerado confiável. Na sua ausência o
 * resultado é marcado como não confiável e a decisão de segurança deve
 * "fail closed" (negar) em vez de "fail open".
 */

export interface ResolvedClientIp {
  /** IP resolvido, ou null quando não foi possível determinar com confiança. */
  ip: string | null;
  /** true somente quando veio de um header sobrescrito pelo proxy. */
  trusted: boolean;
  /** Cadeia bruta, apenas para auditoria/diagnóstico — nunca para decisão. */
  rawForwardedFor: string | null;
}

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
// IPv6 simplificado: hextetos e/ou compressão "::", opcionalmente com sufixo IPv4.
const IPV6 = /^(([0-9a-fA-F]{1,4}:){1,7}:?|::)([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4})*)?$/;

export function isValidIp(value: string | null | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  if (!v || v.length > 45) return false;
  return IPV4.test(v) || (v.includes(":") && IPV6.test(v));
}

export function resolveClientIp(req: Request): ResolvedClientIp {
  const rawForwardedFor = req.headers.get("x-forwarded-for");
  const cf = req.headers.get("cf-connecting-ip")?.trim() ?? null;

  if (isValidIp(cf)) {
    return { ip: cf, trusted: true, rawForwardedFor };
  }

  return { ip: null, trusted: false, rawForwardedFor };
}

/**
 * Versão "best effort" para uso EXCLUSIVO em logs/telemetria, onde um valor
 * forjado não gera decisão de acesso. Nunca use em controle de acesso.
 */
export function clientIpForLogging(req: Request): string {
  const { ip } = resolveClientIp(req);
  if (ip) return ip;
  const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return isValidIp(first) ? first : "unknown";
}
