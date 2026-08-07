import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Fase 20 — Testes de acesso a RPCs administrativos.
 * Garante que usuários não autenticados (anon) recebem erro `42501`
 * ao chamar funções protegidas por `_require_admin()` / `_require_manager_or_admin()`.
 *
 * Nota: Testes assumem VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY no ambiente.
 * Em CI sem esses valores, os testes são pulados para não falhar builds.
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const hasEnv = !!(supabaseUrl && supabaseAnonKey);

// Lazy initialization to avoid "supabaseKey is required" during module load
const getAnonClient = () => {
  if (!hasEnv) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  return createClient(supabaseUrl, supabaseAnonKey);
};

const describeIf = hasEnv ? describe : describe.skip;

describeIf('RPC Access Control — Admin-only functions', () => {
  const adminRpcs = [
    'get_executive_metrics',
    'get_department_metrics',
    'get_monthly_trends',
    'get_security_stats',
    'get_quiz_category_stats',
  ] as const;

  for (const fn of adminRpcs) {
    it(`anon deve receber 42501 ao chamar ${fn}`, async () => {
      const anon = getAnonClient();
      const { error } = await anon.rpc(fn as never);
      expect(error).toBeDefined();
      // Pode ser 42501 (defense in depth) ou 42883/PGRST202 (execute revogado)
      expect(['42501', '42883', 'PGRST202', 'PGRST301']).toContain(error?.code ?? '');
    });
  }
});

describeIf('RPC Access Control — Manager/Admin functions', () => {
  it('anon deve receber erro ao chamar get_leaderboard_api', async () => {
    const anon = getAnonClient();
    const { error } = await anon.rpc('get_leaderboard_api', { p_limit: 10 });
    expect(error).toBeDefined();
    expect(['42501', '42883', 'PGRST202', 'PGRST301']).toContain(error?.code ?? '');
  });

  it('anon deve receber erro ao chamar get_user_stats_api', async () => {
    const { error } = await anon.rpc('get_user_stats_api', {
      p_user_email: 'x@x.com',
    });
    expect(error).toBeDefined();
    expect(['42501', '42883', 'PGRST202', 'PGRST301']).toContain(error?.code ?? '');
  });
});

describeIf('RPC Access Control — Sensitive per-user functions', () => {
  const otherUserId = '00000000-0000-0000-0000-000000000000';

  it('anon deve receber erro ao chamar get_2fa_status de outro usuário', async () => {
    const anon = getAnonClient();
    const { error } = await anon.rpc('get_2fa_status', { p_user_id: otherUserId });
    expect(error).toBeDefined();
    expect(['42501', '42883', 'PGRST202', 'PGRST301']).toContain(error?.code ?? '');
  });

  it('anon deve receber erro ao chamar validate_reset_token', async () => {
    const anon = getAnonClient();
    const { error } = await anon.rpc('validate_reset_token', {
      p_token: otherUserId,
    });
    expect(error).toBeDefined();
    expect(['42501', '42883', 'PGRST202', 'PGRST301']).toContain(error?.code ?? '');
  });
});