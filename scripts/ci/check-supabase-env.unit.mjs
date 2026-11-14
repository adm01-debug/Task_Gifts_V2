// Guarda de env do build: fixtures sinteticas, zero rede/banco.
// Cobrem o incidente real de 2026-11-11 (bundle com createClient("", ...)) e o
// fallback placeholder usado só em PRs do Dependabot (CI não expõe secrets).
import test from 'node:test';
import assert from 'node:assert/strict';
import { checar } from './check-supabase-env.mjs';

const envCompleta = {
  VITE_SUPABASE_URL: 'https://eidsaqymojyuhprobfpn.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_teste',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiJ9.teste',
};

test('env completo passa', () => {
  const r = checar(envCompleta);
  assert.equal(r.ok, true);
  assert.deepEqual(r.faltando, []);
  assert.equal(r.anonOk, true);
});

test('URL ausente falha', () => {
  const { VITE_SUPABASE_URL: _omitido, ...env } = envCompleta;
  const r = checar(env);
  assert.equal(r.ok, false);
  assert.ok(r.faltando.includes('VITE_SUPABASE_URL'));
});

test('URL vazia falha (caso real do incidente 2026-11-11)', () => {
  const r = checar({ ...envCompleta, VITE_SUPABASE_URL: '' });
  assert.equal(r.ok, false);
});

test('publishable key ausente falha (caso real do incidente 2026-11-11)', () => {
  const { VITE_SUPABASE_PUBLISHABLE_KEY: _omitido, ...env } = envCompleta;
  const r = checar(env);
  assert.equal(r.ok, false);
  assert.ok(r.faltando.includes('VITE_SUPABASE_PUBLISHABLE_KEY'));
});

test('ambas vazias e anon ausente falha', () => {
  const r = checar({});
  assert.equal(r.ok, false);
  assert.ok(r.faltando.length === 2);
  assert.equal(r.anonOk, false);
});

test('valor placeholder falha por padrao', () => {
  const r = checar({ ...envCompleta, VITE_SUPABASE_URL: 'https://placeholder.supabase.co' });
  assert.equal(r.ok, false);
  assert.ok(r.faltando.some((f) => f.includes('placeholder')));
});

test('valor placeholder passa com --allow-placeholder (Dependabot)', () => {
  const r = checar(
    {
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiJ9.placeholder',
    },
    { allowPlaceholder: true },
  );
  assert.equal(r.ok, true);
});

test('anon key ausente/vazia avisa e nao falha (nao usada em runtime)', () => {
  const r = checar({ ...envCompleta, VITE_SUPABASE_ANON_KEY: '' });
  assert.equal(r.ok, true);
  assert.equal(r.anonOk, false);
});