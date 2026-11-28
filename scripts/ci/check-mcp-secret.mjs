// Guarda: impede que o canal MCP de administracao volte a ser versionado.
// Origem: .mcp.json entrou no repo no primeiro commit (df2d2d5d) carregando um
// token de 32 hex que da acesso total ao Supabase, fora da RLS. Qualquer pessoa
// com acesso ao repositorio tinha a chave de administracao do banco.
// Detalhe em docs/pendencias/01-mcp-json-com-segredo.md.
//
// Regras:
//  - Falha (exit 1) se `.mcp.json` estiver rastreado pelo Git no commit atual.
//  - Falha se algum arquivo rastreado contiver a URL do worker MCP com token
//    embutido (`*-mcp.adm01.workers.dev/<32 hex>/mcp`).
import { execFileSync } from 'node:child_process';

const PADRAO_URL = /[a-z0-9-]+-mcp\.adm01\.workers\.dev\/[0-9a-fA-F]{16,}\/mcp/i;

export function arquivosRastreados(git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })) {
  return git(['ls-files']).split('\n').map((s) => s.trim()).filter(Boolean);
}

export function auditar(arquivos, ler) {
  const problemas = [];
  if (arquivos.includes('.mcp.json')) {
    problemas.push('.mcp.json esta rastreado pelo Git (deve estar no .gitignore)');
  }
  for (const caminho of arquivos) {
    if (!/\.(json|md|ya?ml|toml|env|txt|ts|tsx|js|mjs|cjs)$/i.test(caminho)) continue;
    let texto;
    try { texto = ler(caminho); } catch { continue; }
    if (PADRAO_URL.test(texto)) {
      problemas.push(`${caminho} contem URL de MCP com token embutido`);
    }
  }
  return { ok: problemas.length === 0, problemas };
}

const direto = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (direto) {
  const fs = await import('node:fs');
  const r = auditar(arquivosRastreados(), (p) => fs.readFileSync(p, 'utf8'));
  if (r.ok) {
    console.log('check-mcp-secret: OK - nenhum token de MCP versionado.');
    process.exit(0);
  }
  console.error('check-mcp-secret: FAIL');
  for (const p of r.problemas) console.error(`  - ${p}`);
  console.error('Remova o arquivo do indice (git rm --cached) e rotacione o token exposto.');
  process.exit(1);
}