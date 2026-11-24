// Guarda das migrations: fixtures sinteticas, nenhum acesso a banco ou rede.
// Os casos marcados REGRESSAO vem da auditoria adversarial de 2026-11-08, que
// quebrou a primeira versao deste guarda (dispensa por arquivo, lexer de
// dollar-quoting, drop de outro objeto, ratchet cego a repeticao, fase 2 sem
// ledger). Cada um falhava antes da reescrita.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  analisarArquivo,
  auditar,
  chave,
  comparar,
  compararComSnapshot,
  contar,
  faixaDe,
  ledgerDeTabelas,
  lerMigrations,
  limparCorpo,
  nomeObjeto,
  registrar,
  tokenizar,
} from '../db-audit/check-migration-drift.mjs';

function raiz(t, arquivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'migdrift-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    fs.writeFileSync(path.join(dir, nome), conteudo);
  }
  return dir;
}
const naoIdemp = (a) => a.filter((x) => x.tipo === 'nao_idempotente');
const destrut = (a) => a.filter((x) => x.tipo === 'ddl_destrutivo');
const mig = (sql) => analisarArquivo('20260101000000_a.sql', sql);

// ───────────────────────── lexer ─────────────────────────

test('tokenizar remove comentario de linha, de bloco (aninhado) e literal', () => {
  const { sql } = tokenizar(`-- create table solto\nCREATE TABLE a (x text default 'create table b');\n/* /* create table c */ */`);
  assert.match(sql, /create table a/);
  assert.doesNotMatch(sql, /create table b/);
  assert.doesNotMatch(sql, /create table c/);
  assert.doesNotMatch(sql, /create table solto/);
});

test('REGRESSAO: apostrofe dentro de corpo $tag$ nao engole o resto do arquivo', () => {
  // Antes: o `'` de "Don't" abria uma string que nunca fechava e apagava o arquivo.
  const sql = `insert into public.docs (corpo) values ($t$ Don't do that $t$);
CREATE TABLE public.depois (id int);
DROP TABLE public.legado;`;
  const a = mig(sql);
  assert.equal(naoIdemp(a).length, 1, 'create table depois do $t$ tem de ser visto');
  assert.equal(destrut(a).length, 1, 'drop table depois do $t$ tem de ser visto');
});

test('REGRESSAO: identificador entre aspas duplas nao e reinjetado como codigo', () => {
  // Antes: "create table fantasma" dentro da definicao virava acusacao.
  const a = mig(`CREATE TABLE IF NOT EXISTS public.t ("create table fantasma" text, "drop table users" text);`);
  assert.deepEqual(a, []);
});

test('REGRESSAO: aspas duplas preservam a caixa (identificador nao e minusculado)', () => {
  const { sql } = tokenizar('create table if not exists "App"."MinhaTabela" (id int)');
  assert.match(sql, /"App"\."MinhaTabela"/);
  assert.equal(nomeObjeto('"App"."MinhaTabela"'), 'App.MinhaTabela');
});

test('faixas marcam identificador e corpo dollar, com codigo/dado distinguidos', () => {
  const { faixas } = tokenizar(`do $$ begin perform 1; end $$; insert into t values ($d$ texto $d$); select "Id" from t;`);
  const dollars = faixas.filter((f) => f.tipo === 'dollar');
  assert.equal(dollars.length, 2);
  assert.equal(dollars[0].codigo, true, 'corpo apos `do` e codigo');
  assert.equal(dollars[1].codigo, false, 'corpo em `values (...)` e dado');
  assert.equal(faixas.filter((f) => f.tipo === 'ident').length, 1);
});

test('tokenizar nao perde o arquivo quando a tag $$ nao fecha', () => {
  const { sql, faixas } = tokenizar('do $$ begin perform 1;');
  assert.match(sql, /perform 1/);
  assert.equal(faixas.at(-1).tipo, 'dollar');
});

test('E-string com barra invertida nao vaza codigo falso', () => {
  const { sql } = tokenizar("select E'abc\\'; create table public.furo (id int); --', 1;");
  assert.doesNotMatch(sql, /create table public\.furo/);
});

test('limparCorpo descarta literal e comentario de dentro do corpo de funcao', () => {
  const out = limparCorpo(`$$ begin raise notice 'drop table users'; -- drop table x\n end $$`);
  assert.doesNotMatch(out, /drop table/);
});

test('faixaDe localiza a posicao', () => {
  const { sql, faixas } = tokenizar('select "Abc" from t');
  const i = sql.indexOf('"Abc"');
  assert.equal(faixaDe(faixas, i).tipo, 'ident');
  assert.equal(faixaDe(faixas, 0), null);
});

// ───────────────────── idempotencia ──────────────────────

test('nome fora de AAAAMMDDHHMMSS_slug.sql e acusado', () => {
  assert.equal(analisarArquivo('migracao.sql', 'select 1;').filter((x) => x.tipo === 'nome_invalido').length, 1);
  assert.deepEqual(analisarArquivo('20260101000000_ok.sql', 'select 1;'), []);
});

test('create table: sem IF NOT EXISTS acusa, com nao', () => {
  assert.equal(naoIdemp(mig('CREATE TABLE public.x (id uuid);')).length, 1);
  assert.deepEqual(mig('CREATE TABLE IF NOT EXISTS public.x (id uuid);'), []);
  assert.deepEqual(mig('DROP TABLE IF EXISTS public.x;\nCREATE TABLE public.x (id uuid);').filter((x) => x.tipo === 'nao_idempotente'), []);
});

test('REGRESSAO: drop de OUTRA policy nao dispensa o create policy', () => {
  // Antes: qualquer `drop policy if exists` no arquivo zerava todos os creates.
  const a = mig(`DROP POLICY IF EXISTS "antiga" ON public.t;
CREATE POLICY "nova" ON public.t FOR SELECT USING (true);
CREATE POLICY "outra" ON public.t FOR INSERT WITH CHECK (true);`);
  assert.equal(naoIdemp(a).length, 1);
  assert.equal(naoIdemp(a)[0].n, 2, 'as duas policies novas contam');
});

test('drop da MESMA policy (nome e tabela) dispensa', () => {
  assert.deepEqual(mig(`DROP POLICY IF EXISTS "p" ON public.t; CREATE POLICY "p" ON public.t FOR SELECT USING (true);`), []);
});

test('REGRESSAO: drop de OUTRO tipo/trigger nao dispensa', () => {
  assert.equal(naoIdemp(mig(`DROP TYPE IF EXISTS public.velho; CREATE TYPE public.novo AS ENUM ('a');`)).length, 1);
  assert.equal(naoIdemp(mig(`DROP TRIGGER IF EXISTS t_velho ON public.x; CREATE TRIGGER t_novo BEFORE INSERT ON public.x FOR EACH ROW EXECUTE FUNCTION f();`)).length, 1);
});

test('create or replace trigger e idempotente', () => {
  assert.deepEqual(mig('CREATE OR REPLACE TRIGGER t BEFORE INSERT ON public.x FOR EACH ROW EXECUTE FUNCTION f();'), []);
});

test('create view exige OR REPLACE; matview exige IF NOT EXISTS', () => {
  assert.equal(naoIdemp(mig('CREATE VIEW v AS SELECT 1;')).length, 1);
  assert.deepEqual(mig('CREATE OR REPLACE VIEW v AS SELECT 1;'), []);
  assert.equal(naoIdemp(mig('CREATE MATERIALIZED VIEW mv AS SELECT 1;')).length, 1);
  assert.deepEqual(mig('CREATE MATERIALIZED VIEW IF NOT EXISTS mv AS SELECT 1;'), []);
});

test('create index: concurrently e unique com IF NOT EXISTS passam limpos', () => {
  assert.deepEqual(mig('CREATE INDEX CONCURRENTLY IF NOT EXISTS i ON t (c);'), []);
  assert.deepEqual(mig('CREATE UNIQUE INDEX IF NOT EXISTS i ON t (c);'), []);
  assert.equal(naoIdemp(mig('CREATE INDEX i ON t (c);')).length, 1);
});

test('REGRESSAO: guarda num bloco $$ dispensa SO aquele bloco, nao o arquivo', () => {
  // Antes: o bloco zerava as 7 regras para todo o arquivo.
  const a = mig(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname='outra') THEN RAISE NOTICE 'x'; END IF; END $$;
CREATE TABLE public.vai_explodir (id uuid);
CREATE TYPE public.novo AS ENUM ('a');
CREATE POLICY "p" ON public.vai_explodir FOR SELECT USING (true);`);
  assert.equal(naoIdemp(a).length, 3, 'tres rotulos distintos fora do bloco');
});

test('REGRESSAO: funcao auxiliar com $$ nao dispensa o resto do arquivo', () => {
  const a = mig(`CREATE OR REPLACE FUNCTION public.tem(p text) RETURNS boolean LANGUAGE sql AS $$
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE column_name = p) $$;
CREATE TABLE public.nua (id int);`);
  assert.equal(naoIdemp(a).length, 1);
});

test('statement guardado DENTRO do bloco e dispensado', () => {
  assert.deepEqual(mig(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='r') THEN CREATE TYPE r AS ENUM ('a'); END IF; END $$;`), []);
});

test('create temp table nao conta (sessao nova em todo replay)', () => {
  assert.deepEqual(mig('CREATE TEMP TABLE tmp_x (id int);'), []);
});

test('mesma falha repetida no mesmo arquivo e contada', () => {
  const a = naoIdemp(mig('CREATE TABLE a (i int); CREATE TABLE b (i int); CREATE TABLE c (i int);'));
  assert.equal(a.length, 1);
  assert.equal(a[0].n, 3);
  assert.match(a[0].detalhe, /\(3x\)/);
});

// ───────────────────── DDL destrutivo ────────────────────

test('DDL destrutivo e contado por ocorrencia', () => {
  const a = destrut(mig('DELETE FROM public.x; DELETE FROM public.y; TRUNCATE public.z;'));
  assert.equal(a.find((x) => x.rotulo === 'delete from').n, 2);
  assert.equal(a.find((x) => x.rotulo === 'truncate').n, 1);
});

test('REGRESSAO: destrutivo em literal e em corpo de dado nao conta', () => {
  assert.deepEqual(mig("SELECT 'drop table x';"), []);
  assert.deepEqual(mig(`INSERT INTO public.docs (corpo) VALUES ($t$ Para limpar: drop table public.tmp; truncate public.log; $t$);`), []);
  assert.deepEqual(mig(`DO $doc$ BEGIN RAISE NOTICE 'nunca faca drop table em producao'; END $doc$;`), []);
});

// ───────────────────── leitura de arquivos ───────────────

test('REGRESSAO: .SQL maiusculo e symlink sao lidos', (t) => {
  const dir = raiz(t, { '20260101000000_a.SQL': 'CREATE TABLE x (i int);', '20260101000001_b.sql': 'select 1;' });
  fs.symlinkSync(path.join(dir, '20260101000000_a.SQL'), path.join(dir, '20260101000002_link.sql'));
  assert.equal(lerMigrations(dir).length, 3);
});

test('REGRESSAO: diretorio ausente e diretorio sem .sql devolvem erro, nao vazio', (t) => {
  assert.equal(lerMigrations('/tmp/nao-existe-mesmo-xyz'), null);
  assert.match(auditar('/tmp/nao-existe-mesmo-xyz').erro, /nao existe/);
  const vazio = raiz(t, {});
  assert.match(auditar(vazio).erro, /nenhum \.sql/);
});

test('versao duplicada e acusada uma vez', (t) => {
  const dir = raiz(t, { '20260101000000_a.sql': 'select 1;', '20260101000000_b.sql': 'select 1;' });
  assert.equal(auditar(dir).achados.filter((x) => x.tipo === 'versao_duplicada').length, 1);
});

test('REGRESSAO: BOM no inicio do arquivo vira achado `codificacao`', (t) => {
  // O CLI entrega o arquivo cru ao Postgres: o BOM vira token e aborta o parse
  // (`syntax error at or near "\ufeff"`), e o arquivo nunca entra no ledger.
  const comBom = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    Buffer.from('-- ok\nCREATE TABLE IF NOT EXISTS public.a (id int);\n'),
  ]);
  const dir = raiz(t, {
    '20260101000000_bom.sql': comBom,
    '20260101000001_limpo.sql': '-- ok\nCREATE TABLE IF NOT EXISTS public.b (id int);\n',
  });
  const achados = auditar(dir).achados;
  const cod = achados.filter((x) => x.tipo === 'codificacao');
  assert.equal(cod.length, 1);
  assert.equal(cod[0].arquivo, '20260101000000_bom.sql');
  assert.equal(contar(achados).codificacao, 1);
  // BOM novo em arquivo nao baselinado e caso novo para o ratchet.
  assert.equal(comparar(achados, { achados: {} }).novos.some((n) => n.tipo === 'codificacao'), true);
});

// ───────────────────── ledger de tabelas ─────────────────

test('REGRESSAO: ledger desconta tabela dropada por migration posterior', (t) => {
  const dir = raiz(t, {
    '20260101000000_cria.sql': 'CREATE TABLE IF NOT EXISTS public.efemera (id int); CREATE TABLE IF NOT EXISTS public.fica (id int);',
    '20260101000001_dropa.sql': 'DROP TABLE IF EXISTS public.efemera;',
  });
  assert.deepEqual([...auditar(dir).declaradas].sort(), ['public.fica']);
});

test('REGRESSAO: temp table nao entra no ledger', (t) => {
  const dir = raiz(t, { '20260101000000_a.sql': 'CREATE TEMP TABLE tmp_backfill (id int); CREATE TABLE IF NOT EXISTS public.real (id int);' });
  assert.deepEqual([...auditar(dir).declaradas], ['public.real']);
});

test('ledger resolve schema implicito e citado', () => {
  const t1 = tokenizar('CREATE TABLE IF NOT EXISTS sem_schema (i int); CREATE TABLE IF NOT EXISTS "app"."c" (i int);');
  assert.deepEqual([...ledgerDeTabelas([t1])].sort(), ['app.c', 'public.sem_schema']);
});

// ───────────────────────── ratchet ───────────────────────

test('REGRESSAO: ratchet por contagem — subir reprova, cair nao', () => {
  const base = { achados: registrar([{ tipo: 'nao_idempotente', arquivo: 'a.sql', rotulo: 'create table sem IF NOT EXISTS', n: 2 }]) };
  const igual = comparar([{ tipo: 'nao_idempotente', arquivo: 'a.sql', rotulo: 'create table sem IF NOT EXISTS', n: 2 }], base);
  assert.deepEqual(igual.novos, []);
  assert.deepEqual(igual.resolvidos, []);

  const subiu = comparar([{ tipo: 'nao_idempotente', arquivo: 'a.sql', rotulo: 'create table sem IF NOT EXISTS', n: 3 }], base);
  assert.equal(subiu.novos.length, 1);
  assert.deepEqual([subiu.novos[0].de, subiu.novos[0].para], [2, 3]);

  // Consertar METADE do problema nao pode reprovar (era o bug: a chave tinha (Nx)).
  const caiu = comparar([{ tipo: 'nao_idempotente', arquivo: 'a.sql', rotulo: 'create table sem IF NOT EXISTS', n: 1 }], base);
  assert.deepEqual(caiu.novos, []);
  assert.equal(caiu.resolvidos.length, 1);
});

test('REGRESSAO: ratchet pega destrutivo repetido em arquivo ja baselinado', () => {
  const base = { achados: registrar([{ tipo: 'ddl_destrutivo', arquivo: 'a.sql', rotulo: 'delete from', n: 1 }]) };
  const r = comparar([{ tipo: 'ddl_destrutivo', arquivo: 'a.sql', rotulo: 'delete from', n: 4 }], base);
  assert.equal(r.novos.length, 1);
});

test('ratchet: arquivo novo com achado vira caso novo', () => {
  const r = comparar([{ tipo: 'ddl_destrutivo', arquivo: 'z.sql', rotulo: 'truncate', n: 1 }], { achados: {} });
  assert.equal(r.novos.length, 1);
  assert.equal(r.novos[0].chave, chave({ arquivo: 'z.sql', rotulo: 'truncate' }));
});

test('chave do ratchet nao carrega a contagem', () => {
  assert.equal(chave({ arquivo: 'a.sql', rotulo: 'truncate' }), 'a.sql :: truncate');
});

test('contar soma ocorrencias e cobre tipo com zero', () => {
  const c = contar([{ tipo: 'ddl_destrutivo', n: 3 }, { tipo: 'ddl_destrutivo', n: 1 }]);
  assert.equal(c.ddl_destrutivo, 4);
  assert.equal(c.nao_idempotente, 0);
});

// ───────────────────────── fase 2 ────────────────────────

const snap = (t, db, extra = {}) => raiz(t, { 'snapshot.json': JSON.stringify({ format_version: 2, db, api: {}, ...extra }) });

test('fase 2 e PULADA sem snapshot, em formato desconhecido e com db.tables vazio', (t) => {
  assert.match(compararComSnapshot(new Set(['public.a']), raiz(t, {})).motivo, /nao existe/);
  assert.match(compararComSnapshot(new Set(['public.a']), snap(t, {}, { format_version: 1 })).motivo, /formato 2/);
  assert.match(compararComSnapshot(new Set(['public.a']), snap(t, { tables: [] })).motivo, /vazio/);
});

test('REGRESSAO: db.tables reaproveitado (carried) nao vira verdade atual', (t) => {
  const dir = snap(t, { tables: [{ schema: 'public', name: 'a' }] }, { carried: ['tables'] });
  const r = compararComSnapshot(new Set(['public.b']), dir);
  assert.equal(r.pulado, true);
  assert.match(r.motivo, /carried/);
});

test('REGRESSAO: entrada invalida em db.tables falha limpo, sem crash', (t) => {
  const dir = snap(t, { tables: [{ schema: 'public', name: 'a' }, null] });
  const r = compararComSnapshot(new Set(['public.a']), dir);
  assert.equal(r.invalido, true);
  assert.match(r.motivo, /sem schema\/name/);
});

test('fase 2 acusa tabela declarada ausente e avisa a orfa', (t) => {
  const dir = snap(t, { tables: [{ schema: 'public', name: 'a', kind: 'table' }, { schema: 'public', name: 'orfa', kind: 'table' }] });
  const r = compararComSnapshot(new Set(['public.a', 'public.sumiu']), dir);
  assert.deepEqual(r.semNoBanco, ['public.sumiu']);
  assert.deepEqual(r.soNoBanco, ['public.orfa']);
});

test('REGRESSAO: particao, pai particionado, foreign e tabela de extensao nao viram orfas', (t) => {
  const dir = snap(t, { tables: [
    { schema: 'public', name: 'a', kind: 'table' },
    { schema: 'public', name: 'eventos_2026_01', kind: 'table', is_partition: true },
    { schema: 'public', name: 'eventos', kind: 'partitioned' },
    { schema: 'public', name: 'spatial_ref_sys', kind: 'table', from_extension: true },
    { schema: 'public', name: 'fdw_remota', kind: 'foreign' },
  ] });
  const r = compararComSnapshot(new Set(['public.a', 'public.eventos']), dir);
  assert.deepEqual(r.semNoBanco, [], 'pai particionado declarado existe no banco');
  assert.deepEqual(r.soNoBanco, [], 'nada disso nasce de CREATE TABLE em migration');
});

test('REGRESSAO: schema que o snapshot nao cobre nao vira drift, e sim aviso', (t) => {
  const dir = snap(t, { tables: [{ schema: 'public', name: 'a', kind: 'table' }] });
  const r = compararComSnapshot(new Set(['public.a', 'storage.objects']), dir);
  assert.deepEqual(r.semNoBanco, []);
  assert.deepEqual(r.foraDoSnapshot, ['storage.objects']);
});
