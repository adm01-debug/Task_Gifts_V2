import "@testing-library/jest-dom";

// Mock das variáveis de ambiente do Supabase para testes unitários.
// O @supabase/supabase-js@2.118+ valida o URL na criação do cliente;
// sem esse mock, a importação de qualquer service que usa o cliente falha.
import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-anon-key";

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
