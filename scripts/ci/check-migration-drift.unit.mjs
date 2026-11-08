// Guarda das migrations: fixtures sinteticas, nenhum acesso a banco ou rede.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  analisarArquivo,
  auditar,
  blocosDollar,
  chave,
  comparar,
  compararComSnapshot,
  contar,
  registrar,
  normalizarSql,
  tabelasDeclaradas,
} from '../db-audit/check-migration-drift.mjs';

function raiz(t, arquivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migdrift-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    fs.writeFileSync(path.join(dir, nome), conteudo);
  }
  return dir;
}

test('normalizarSql remove comentarios de linha, bloco e literais', () => {
  const sql = normalizarSql(`-- create table solto\nCREATE TABLE a (x text default 'create table b');\n/* create table c */`);
  assert.match(sql, /create table a/);
  assert.doesNotMatch(sql, /create table b/);
  assert.doesNotMatch(sql, /create table c/);
  assert.doesNotMatch(sql, /create table solto/);
});

test('normalizarSql preserva corpo $$ (onde ficam as guardas)', () => {
  const sql = normalizarSql(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type) THEN CREATE TYPE t AS ENUM ('a'); END IF; END $$;`);
  assert.match(sql, /if not exists/);
  assert.deepEqual(blocosDollar(sql).length, 1);
});

test('nome fora de AAAAMMDDHHMMSS_slug.sql e acusado', () => {
  const a = analisarArquivo('migracao.sql', 'select 1;');
  assert.equal(a.filter((x) => x.tipo === 'nome_invalido').length, 1);
  assert.equal(analisarArquivo('20260101000000_ok.sql', 'select 1;').length, 0);
});

test('create table sem IF NOT EXISTS e acusado; com, nao', () => {
  const sem = analisarArquivo('20260101000000_a.sql', 'CREATE TABLE public.x (id uuid);');
  assert.equal(sem.filter((x) => x.tipo === 'nao_idempotente').length, 1);
  const com = analisarArquivo('20260101000000_a.sql', 'CREATE TABLE IF NOT EXISTS public.x (id uuid);');
  assert.equal(com.length, 0);
});

test('create policy sem drop e acusado; com DROP POLICY IF EXISTS, nao', () => {
  const sem = analisarArquivo('20260101000000_a.sql', 'CREATE POLICY "p" ON public.x FOR SELECT USING (true);');
  assert.equal(sem.filter((x) => x.tipo === 'nao_idempotente').length, 1);
  const com = analisarArquivo(
    '20260101000000_a.sql',
    'DROP POLICY IF EXISTS "p" ON public.x; CREATE POLICY "p" ON public.x FOR SELECT USING (true);',
  );
  assert.equal(com.length, 0);
});

test('create trigger e create type seguem a mesma regra', () => {
  assert.equal(analisarArquivo('20260101000000_a.sql', 'CREATE TRIGGER t BEFORE INSERT ON x EXECUTE FUNCTION f();')
    .filter((x) => x.tipo === 'nao_idempotente').length, 1);
  assert.equal(analisarArquivo('20260101000000_a.sql', "CREATE TYPE r AS ENUM ('a');")
    .filter((x) => x.tipo === 'nao_idempotente').length, 1);
  assert.equal(analisarArquivo('20260101000000_a.sql', "DROP TYPE IF EXISTS r; CREATE TYPE r AS ENUM ('a');").length, 0);
});

test('bloco $$ com guarda dispensa o aviso', () => {
  const texto = "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='r') THEN CREATE TYPE r AS ENUM ('a'); END IF; END $$;";
  assert.equal(analisarArquivo('20260101000000_a.sql', texto).length, 0);
});

test('create view exige OR REPLACE', () => {
  assert.equal(analisarArquivo('20260101000000_a.sql', 'CREATE VIEW v AS SELECT 1;')
    .filter((x) => x.tipo === 'nao_idempotente').length, 1);
  assert.equal(analisarArquivo('20260101000000_a.sql', 'CREATE OR REPLACE VIEW v AS SELECT 1;').length, 0);
});

test('DDL destrutivo e acusado em categoria propria', () => {
  const a = analisarArquivo('20260101000000_a.sql', 'DROP TABLE IF EXISTS public.x; TRUNCATE public.y;');
  const tipos = a.map((x) => x.tipo);
  assert.ok(tipos.includes('ddl_destrutivo'));
  assert.equal(a.filter((x) => x.tipo === 'ddl_destrutivo').length, 2);
});

test('DDL destrutivo dentro de literal nao conta', () => {
  assert.equal(analisarArquivo('20260101000000_a.sql', "SELECT 'drop table x';").length, 0);
});

test('versao duplicada e acusada uma vez', (t) => {
  const dir = raiz(t, {
    '20260101000000_a.sql': 'select 1;',
    '20260101000000_b.sql': 'select 1;',
  });
  const { achados } = auditar(dir);
  assert.equal(achados.filter((x) => x.tipo === 'versao_duplicada').length, 1);
});

test('tabelasDeclaradas resolve schema explicito e implicito', () => {
  const sql = normalizarSql('CREATE TABLE public.a (i int); CREATE TABLE IF NOT EXISTS b (i int); CREATE TABLE "app"."c" (i int);');
  assert.deepEqual([...tabelasDeclaradas(sql)].sort(), ['app.c', 'public.a', 'public.b']);
});

test('ratchet: achado do baseline passa, achado novo reprova e aponta o arquivo', () => {
  const legado = { tipo: 'nao_idempotente', arquivo: 'a.sql', detalhe: 'create table sem IF NOT EXISTS (1x)' };
  const novo = { tipo: 'nao_idempotente', arquivo: 'b.sql', detalhe: 'create table sem IF NOT EXISTS (1x)' };
  const baseline = { achados: registrar([legado]) };

  const igual = comparar([legado], baseline);
  assert.deepEqual(igual.novos, []);
  assert.deepEqual(igual.resolvidos, []);

  const comNovo = comparar([legado, novo], baseline);
  assert.equal(comNovo.novos.length, 1);
  assert.equal(comNovo.novos[0].chave, chave(novo));

  // baseline vazio => todo achado e novo
  assert.equal(comparar([legado], { achados: {} }).novos.length, 1);
});

test('ratchet: achado que desapareceu entra em resolvidos, sem reprovar', () => {
  const legado = { tipo: 'ddl_destrutivo', arquivo: 'a.sql', detalhe: 'truncate' };
  const r = comparar([], { achados: registrar([legado]) });
  assert.deepEqual(r.novos, []);
  assert.equal(r.resolvidos.length, 1);
  assert.equal(r.resolvidos[0].chave, chave(legado));
});

test('ratchet: mesma quantidade mas arquivo diferente ainda reprova', () => {
  const antes = { tipo: 'ddl_destrutivo', arquivo: 'a.sql', detalhe: 'truncate' };
  const depois = { tipo: 'ddl_destrutivo', arquivo: 'z.sql', detalhe: 'truncate' };
  const r = comparar([depois], { achados: registrar([antes]) });
  assert.equal(r.novos.length, 1);
  assert.equal(r.resolvidos.length, 1);
});

test('contar cobre todos os tipos, inclusive com zero', () => {
  const c = contar([{ tipo: 'ddl_destrutivo' }]);
  assert.equal(c.ddl_destrutivo, 1);
  assert.equal(c.nao_idempotente, 0);
});

test('fase 2 e PULADA sem snapshot, sem fingir conferencia', (t) => {
  const dir = raiz(t, {});
  const r = compararComSnapshot(new Set(['public.a']), dir);
  assert.equal(r.pulado, true);
  assert.match(r.motivo, /nao existe/);
});

test('fase 2 e PULADA com snapshot em formato desconhecido', (t) => {
  const dir = raiz(t, { 'snapshot.json': JSON.stringify({ format_version: 1, db: {} }) });
  const r = compararComSnapshot(new Set(['public.a']), dir);
  assert.equal(r.pulado, true);
  assert.match(r.motivo, /formato 2/);
});

test('fase 2 acusa tabela declarada que nao existe no banco', (t) => {
  const dir = raiz(t, {
    'snapshot.json': JSON.stringify({
      format_version: 2,
      db: { tables: [{ schema: 'public', name: 'a' }, { schema: 'public', name: 'orfa' }] },
      api: {},
    }),
  });
  const r = compararComSnapshot(new Set(['public.a', 'public.sumiu']), dir);
  assert.equal(r.pulado, false);
  assert.deepEqual(r.semNoBanco, ['public.sumiu']);
  assert.deepEqual(r.soNoBanco, ['public.orfa']);
});

test('fase 2 ignora schemas internos no sentido banco -> migration', (t) => {
  const dir = raiz(t, {
    'snapshot.json': JSON.stringify({
      format_version: 2,
      db: { tables: [{ schema: 'auth', name: 'users' }, { schema: 'public', name: 'a' }] },
      api: {},
    }),
  });
  const r = compararComSnapshot(new Set(['public.a']), dir);
  assert.deepEqual(r.soNoBanco, []);
});
