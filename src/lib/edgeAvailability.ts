/**
 * Edge function availability system (Fase 28 + allowlist).
 *
 * Problem: when an Edge Function is not deployed yet, every component call
 * fires a network request that returns 404 + CORS preflight errors in the
 * console. This floods the dev console with noise on every page load.
 *
 * Solution — two layers:
 *
 *  1. COMPILED ALLOWLIST (VITE_DEPLOYED_EDGE_FUNCTIONS env var):
 *     Set to a comma-separated list of deployed function names before running.
 *     Any function NOT in the list is short-circuited instantly — zero network
 *     traffic.  No localStorage/sessionStorage needed.
 *
 *  2. SESSION CACHE (sessionStorage) — only consulted when a function IS in
 *     the allowlist. Used to remember probe results (available / unavailable)
 *     within the same session so we don't re-probe on every render.
 *
 * Manual override: localStorage "edge-skills:disabled" disables every edge
 * call site until cleared. Useful while functions are still being rolled out.
 *
 * Usage:
 *   # .env — list every function you have actually deployed
 *   VITE_DEPLOYED_EDGE_FUNCTIONS=verify-ip,verify-geo,ai-coach,...
 */

const SESSION_KEY = "edge-availability";
const GLOBAL_DISABLE_KEY = "edge-skills:disabled";

type AvailabilityMap = Record<string, boolean>;

// ── Layer 1: compiled allowlist ─────────────────────────────────────────────

function getDeployedAllowlist(): Set<string> {
  const raw = import.meta.env.VITE_DEPLOYED_EDGE_FUNCTIONS as string | undefined;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Returns true if fnName is in the compiled allowlist (i.e. explicitly deployed). */
export function isFunctionDeployed(fnName: string): boolean {
  const allowlist = getDeployedAllowlist();
  // allowlist vazia = block all (nenhuma função foi deployada ainda).
  if (allowlist.size === 0) return false;
  return allowlist.has(fnName.toLowerCase());
}

// ── Layer 2: session cache ───────────────────────────────────────────────────

function loadCache(): AvailabilityMap {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AvailabilityMap) : {};
  } catch {
    return {};
  }
}

function persist(map: AvailabilityMap): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {
    /* storage may be full or disabled */
  }
}

export function markEdgeAvailable(fnName: string): void {
  const map = loadCache();
  map[fnName] = true;
  persist(map);
}

export function markEdgeUnavailable(fnName: string): void {
  const map = loadCache();
  map[fnName] = false;
  persist(map);
}

export function isEdgeAvailable(fnName: string): boolean | null {
  const map = loadCache();
  const v = map[fnName];
  return v === undefined ? null : v;
}

// ── Global kill switch ────────────────────────────────────────────────────────

export function isEdgeSkillsDisabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(GLOBAL_DISABLE_KEY) === "true";
}

export function setEdgeSkillsDisabled(disabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  if (disabled) localStorage.setItem(GLOBAL_DISABLE_KEY, "true");
  else localStorage.removeItem(GLOBAL_DISABLE_KEY);
}

export function clearEdgeAvailabilityCache(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}
