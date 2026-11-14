import "@testing-library/jest-dom";

// Mock das variaveis de ambiente do Supabase para testes unitarios.
// O @supabase/supabase-js@2.118+ valida o URL na criacao do cliente;
// sem esse mock, a importacao de qualquer service que usa o cliente falha.
// Se env real (URL + ANON) for fornecido (.env.local / ambiente), preserva-o
// para os testes de integracao/seguranca (rls.test.ts, rpcAccess.test.ts)
// alcançarem o host real; caso contrario, usa o mock de rede inexistente.
const realUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const realAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const realPublishable =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "test-anon-key";

const isMock =
  !realUrl ||
  !realAnonKey ||
  realUrl.includes("placeholder.supabase.co") ||
  realUrl.includes("test.supabase.co");

if (isMock) {
  import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";
} else {
  // Propaga o env real tambem para process.env (os testes de RLS/RPC leem process.env).
  import.meta.env.VITE_SUPABASE_URL = realUrl;
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = realPublishable;
  import.meta.env.VITE_SUPABASE_ANON_KEY = realAnonKey;
  process.env.VITE_SUPABASE_URL = realUrl;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = realPublishable;
  process.env.VITE_SUPABASE_ANON_KEY = realAnonKey;
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Recharts requires ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverMock;
