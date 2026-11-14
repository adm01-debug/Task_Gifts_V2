// Guarda de build: impede redeploy com env do Supabase ausente/vazia/placeholder.
// O incidente de 2026-11-11 ("supabaseUrl is required") aconteceu porque o build
// da Vercel foi feito com VITE_SUPABASE_URL vazia e VITE_SUPABASE_PUBLISHABLE_KEY
// inexistente no projeto; o bundle nasceu com createClient("", ...) e só quebrou
// em runtime. Este script roda ANTES do `vite build` (não apenas no CI, que usa
// fallback placeholder para PRs do Dependabot sem secrets).
//
// Regras:
//  - Falha (exit 1) se VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY estiver
//    ausente, vazia ou com valor de placeholder ("placeholder.supabase.co",
//    ".placeholder" no JWT). São as duas que o runtime usa (src/integrations/
//    supabase/client.ts:5-11).
//  - Avisa (sem falhar) se VITE_SUPABASE_ANON_KEY estiver ausente/vazia, pois não
//    é consumida em runtime — mantida para compatibilidade de ferramentas.
//  - `--allow-placeholder` permite valores placeholder (usado pelo CI apenas para
//    PRs de Dependabot, onde secrets não são expostos por política do GitHub).
export function checar(env, { allowPlaceholder = false } = {}) {
  const exigidas = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
  const faltando = [];
  for (const chave of exigidas) {
    const valor = (env[chave] || '').trim();
    if (!valor) { faltando.push(`${chave}`); continue; }
    if (!allowPlaceholder && /placeholder\.supabase\.co|\.placeholder/i.test(valor)) {
      faltando.push(`${chave} (valor placeholder)`);
    }
  }
  const anon = (env.VITE_SUPABASE_ANON_KEY || '').trim();
  return {
    ok: faltando.length === 0,
    faltando,
    anonOk: Boolean(anon) && !/placeholder/i.test(anon),
  };
}

const direto = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (direto) {
  const allow = process.argv.includes('--allow-placeholder');
  const r = checar(process.env, { allowPlaceholder: allow });
  if (r.ok && r.anonOk) {
    console.log('check-supabase-env: OK — envs do Supabase presentes.');
    process.exit(0);
  }
  if (!r.ok) {
    console.error(`check-supabase-env: FAIL — envs ausentes/vazias inválidas: ${r.faltando.join(', ')}`);
    console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no projeto Vercel/CI antes do build.');
    process.exit(1);
  }
  console.warn(`check-supabase-env: VITE_SUPABASE_ANON_KEY ausente/vazia/placeholder (não usada em runtime).`);
  process.exit(0);
}