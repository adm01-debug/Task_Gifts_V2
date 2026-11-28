// Guarda do segredo MCP: fixtures sinteticas, zero rede/banco.
// Cobre o achado real: .mcp.json versionado em df2d2d5d com token de 32 hex.
import test from 'node:test';
import assert from 'node:assert/strict';
import { auditar } from './check-mcp-secret.mjs';

const token = 'a'.repeat(32);
const limpo = { 'src/App.tsx': 'export default function App() { return null; }' };
const ler = (mapa) => (p) => { if (!(p in mapa)) throw new Error('ENOENT'); return mapa[p]; };

test('repo sem .mcp.json e sem token passa', () => {
  const r = auditar(Object.keys(limpo), ler(limpo));
  assert.equal(r.ok, true);
  assert.deepEqual(r.problemas, []);
});

test('.mcp.json rastreado falha', () => {
  const mapa = { ...limpo, '.mcp.json': '{"mcpServers":{}}' };
  const r = auditar(Object.keys(mapa), ler(mapa));
  assert.equal(r.ok, false);
  assert.match(r.problemas.join(' '), /\.mcp\.json esta rastreado/);
});

test('URL de MCP com token embutido em qualquer arquivo falha', () => {
  const mapa = { ...limpo, 'docs/exemplo.md': `use https://x-mcp.adm01.workers.dev/${token}/mcp` };
  const r = auditar(Object.keys(mapa), ler(mapa));
  assert.equal(r.ok, false);
  assert.match(r.problemas.join(' '), /docs\/exemplo\.md contem URL de MCP/);
});

test('placeholder do .mcp.example.json nao acusa', () => {
  const mapa = { '.mcp.example.json': '{"url":"https://supabase-<projeto>-mcp.adm01.workers.dev/<TOKEN>/mcp"}' };
  const r = auditar(Object.keys(mapa), ler(mapa));
  assert.equal(r.ok, true);
});