#!/usr/bin/env node
/**
 * Guarda das migrations de supabase/migrations/.
 *
 * Por que existe: a comparacao arquivo x ledger do Zapp_Web_V2
 * (scripts/db-audit/check-migration-drift.mjs de la') nao roda aqui, porque este
 * guarda roda no CI, sem credencial de banco. O banco TEM
 * `supabase_migrations.schema_migrations` - 281 registros para 281 arquivos, 0
 * pendentes (medido em 2026-11-24; ver docs/agentes/banco.md). Sem consultar o
 * ledger, "esta aplicada?" so' tem duas respostas possiveis:
 *
 *   FASE 1 (offline, sempre roda) - o arquivo e' seguro de reaplicar?
 *     Qualquer replay/reset reexecuta a migration inteira. Uma
 *     migration nao idempotente aborta no meio e deixa o banco pela metade.
 *     Confere nome, versao duplicada, codificacao (BOM), idempotencia e DDL
 *     destrutivo, com
 *     ratchet (scripts/db-audit/migration-baseline.json): o legado nao quebra o
 *     CI, mas nenhum caso novo entra.
 *
 *   FASE 2 (precisa do snapshot do banco) - o objeto existe de verdade la'?
 *     Compara as tabelas declaradas nas migrations com `db.tables` de
 *     docs/contexto/supabase/snapshot.json (produzido por
 *     scripts/supabase_snapshot/snapshot.py; formato 2). Sem o snapshot, a fase
 *     e' PULADA com aviso - nunca finge que conferiu.
 *
 * Uso:
 *   node scripts/db-audit/check-migration-drift.mjs
 *   node scripts/db-audit/check-migration-drift.mjs --snapshot docs/contexto/supabase
 *   node scripts/db-audit/check-migration-drift.mjs --atualizar-baseline
 *   node scripts/db-audit/check-migration-drift.mjs --atualizar-baseline --permitir-crescer
 *
 * Variaveis para teste offline:
 *   MIGRATIONS_DIR      diretorio das migrations (padrao: supabase/migrations)
 *   MIGRATION_BASELINE  caminho do baseline (padrao: scripts/db-audit/migration-baseline.json)
 *
 * Exit: 0 = nada novo; 1 = caso novo ou drift; 2 = erro de uso/ambiente
 *       (diretorio ausente ou vazio, baseline ilegivel, snapshot invalido,
 *       baseline crescendo sem --permitir-crescer). Nunca sai 0 por nao ter
 *       encontrado o que analisar.
 *
 * LIMITE CONHECIDO: analise estatica por token, nao um parser de PostgreSQL.
 * - SQL dinamico (`execute format('create table ...')`) e' invisivel: o
 *   conteudo de literais e' descartado. Isso vale tambem para `delete from`
 *   dentro de `execute '...'`.
 * - Dentro de corpo `$tag$` reconhecido como CODIGO (precedido por `do` ou
 *   `as`), uma guarda qualquer (`if not exists`, `to_regclass`, `pg_class`...)
 *   dispensa apenas os statements DAQUELE corpo, nunca o resto do arquivo.
 *   Corpo `$tag$` que e' DADO (ex.: `values ($t$ ... $t$)`) e' ignorado por
 *   completo.
 * - `alter table ... add column/add constraint`, `alter type ... add value`,
 *   `create extension` e `create schema` NAO entram nas regras de idempotencia
 *   (escopo). Em replay, `add column` sem `IF NOT EXISTS` aborta igual.
 * Achado aqui e' candidato a revisao, nao prova; ausencia de achado nao prova
 * que a migration e' idempotente.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DIR = process.env.MIGRATIONS_DIR || 'supabase/migrations';
const BASELINE_PATH = process.env.MIGRATION_BASELINE || 'scripts/db-audit/migration-baseline.json';
const NOME_RE = /^(\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/i;
const LIMITE_LISTA = 20;

export const TIPOS = [
  'nome_invalido',
  'versao_duplicada',
  'codificacao',
  'nao_idempotente',
  'ddl_destrutivo',
];

const BOM = [0xef, 0xbb, 0xbf];

const GUARDAS = /if not exists|if exists|to_regclass|to_regtype|to_regproc|pg_class|pg_policies|pg_policy|pg_type|pg_trigger|pg_proc|pg_matviews|pg_indexes|information_schema|exception when duplicate/;

/**
 * Tokeniza o SQL preservando POSICOES, para que a dispensa de idempotencia
 * seja por statement e nao por arquivo (era o furo principal da versao
 * anterior). Devolve:
 *   sql     texto normalizado, mesmo comprimento logico, minusculo FORA de
 *           identificadores entre aspas duplas (que no Postgres preservam caixa)
 *   faixas  [{ tipo: 'ident'|'dollar', inicio, fim, codigo, guardado }]
 *
 * Regras do lexer:
 * - `--` ate o fim da linha e `/* *\/` (aninhado) viram um espaco.
 * - `'...'` tem o CONTEUDO descartado (vira `''`). `''` escapa a aspa. Barra
 *   invertida so' escapa quando a literal e' E-string (`E'...\'...'`), que e'
 *   o unico caso em que o Postgres a interpreta com
 *   standard_conforming_strings=on.
 * - `"..."` e' IDENTIFICADOR: copiado verbatim, com a caixa original, e
 *   marcado como faixa `ident` (nada dentro dele e' codigo).
 * - `$tag$...$tag$` e' copiado verbatim (minusculo) e marcado como faixa
 *   `dollar`. `codigo` e' true quando o abre-tag e' precedido por `do` ou `as`
 *   (corpo de funcao/bloco); caso contrario e' DADO (ex.: `values ($t$...$t$)`).
 *   `guardado` diz se o corpo cita alguma guarda.
 */
/**
 * Limpa um corpo `$tag$`: dentro dele, `'...'` E' literal de verdade (plpgsql),
 * entao o conteudo e' descartado, igual fora. Sem isto, `raise notice 'nao faca
 * drop table'` viraria acusacao de DDL destrutivo. O preco e' que SQL dinamico
 * (`execute format('create table ...')`) fica invisivel — limite documentado no
 * topo do arquivo.
 */
export function limparCorpo(corpo) {
  let out = '';
  let i = 0;
  const n = corpo.length;
  while (i < n) {
    const c = corpo[i];
    const d = corpo[i + 1];
    if (c === '-' && d === '-') { while (i < n && corpo[i] !== '\n') i += 1; out += ' '; continue; }
    if (c === '/' && d === '*') {
      i += 2;
      let nivel = 1;
      while (i < n && nivel > 0) {
        if (corpo[i] === '/' && corpo[i + 1] === '*') { nivel += 1; i += 2; continue; }
        if (corpo[i] === '*' && corpo[i + 1] === '/') { nivel -= 1; i += 2; continue; }
        i += 1;
      }
      out += ' ';
      continue;
    }
    if (c === "'") {
      i += 1;
      while (i < n) {
        if (corpo[i] === "'" && corpo[i + 1] === "'") { i += 2; continue; }
        if (corpo[i] === "'") { i += 1; break; }
        i += 1;
      }
      out += " '' ";
      continue;
    }
    out += c.toLowerCase();
    i += 1;
  }
  return out;
}

export function tokenizar(texto) {
  let sql = '';
  const faixas = [];
  let i = 0;
  const n = texto.length;
  const antesEhPalavra = (palavras) => {
    const cauda = sql.replace(/\s+$/, '');
    return palavras.some((p) => cauda.endsWith(p) && !/[a-z0-9_]/.test(cauda.charAt(cauda.length - p.length - 1) || ' '));
  };
  while (i < n) {
    const c = texto[i];
    const d = texto[i + 1];
    if (c === '-' && d === '-') {
      while (i < n && texto[i] !== '\n') i += 1;
      sql += ' ';
      continue;
    }
    if (c === '/' && d === '*') {
      i += 2;
      let nivel = 1;
      while (i < n && nivel > 0) {
        if (texto[i] === '/' && texto[i + 1] === '*') { nivel += 1; i += 2; continue; }
        if (texto[i] === '*' && texto[i + 1] === '/') { nivel -= 1; i += 2; continue; }
        i += 1;
      }
      sql += ' ';
      continue;
    }
    // Dollar-quoting ANTES do ramo de aspas: dentro do corpo, `'` e' texto puro.
    const dollar = /^\$([a-zA-Z0-9_]*)\$/.exec(texto.slice(i, i + 64));
    if (dollar) {
      const tag = dollar[0];
      const fechamento = texto.indexOf(tag, i + tag.length);
      const ehCodigo = antesEhPalavra(['do', 'as']);
      if (fechamento === -1) {
        // Tag sem fechamento: trata o resto como corpo, sem perder o arquivo.
        const corpo = limparCorpo(texto.slice(i));
        const inicio = sql.length;
        sql += corpo;
        faixas.push({ tipo: 'dollar', inicio, fim: sql.length, codigo: ehCodigo, guardado: GUARDAS.test(corpo) });
        break;
      }
      const corpo = limparCorpo(texto.slice(i, fechamento + tag.length));
      const inicio = sql.length;
      sql += corpo;
      faixas.push({ tipo: 'dollar', inicio, fim: sql.length, codigo: ehCodigo, guardado: GUARDAS.test(corpo) });
      i = fechamento + tag.length;
      continue;
    }
    if (c === "'") {
      const eString = antesEhPalavra(['e']);
      i += 1;
      while (i < n) {
        if (texto[i] === "'" && texto[i + 1] === "'") { i += 2; continue; }
        if (eString && texto[i] === '\\' && i + 1 < n) { i += 2; continue; }
        if (texto[i] === "'") { i += 1; break; }
        i += 1;
      }
      sql += " '' ";
      continue;
    }
    if (c === '"') {
      const inicioTexto = i;
      i += 1;
      while (i < n) {
        if (texto[i] === '"' && texto[i + 1] === '"') { i += 2; continue; }
        if (texto[i] === '"') { i += 1; break; }
        i += 1;
      }
      const inicio = sql.length;
      sql += texto.slice(inicioTexto, i); // caixa original: "App"."X" nao e' app.x
      faixas.push({ tipo: 'ident', inicio, fim: sql.length });
      continue;
    }
    sql += c.toLowerCase();
    i += 1;
  }
  return { sql, faixas };
}

/** Em que faixa cai a posicao (ou null). */
export function faixaDe(faixas, pos) {
  for (const f of faixas) if (pos >= f.inicio && pos < f.fim) return f;
  return null;
}

/** Normaliza um nome de objeto: tira aspas, minuscula SO o que nao estava citado. */
export function nomeObjeto(bruto) {
  return bruto
    .split('.')
    .map((p) => (p.startsWith('"') ? p.slice(1, -1).replace(/""/g, '"') : p.toLowerCase()))
    .join('.');
}

const ALVO = '(?:"(?:[^"]|"")+"|[a-z0-9_]+)(?:\\.(?:"(?:[^"]|"")+"|[a-z0-9_]+))*';

/**
 * Criacoes conferidas. `proprio` = a guarda vem no proprio statement;
 * `drop` = par `DROP <kind> IF EXISTS <mesmo nome>` no arquivo dispensa.
 * `temp`/`temporary` ficam de fora: em replay a sessao e' nova, logo
 * `create temp table` nao colide (e nao polui a fase 2).
 */
const CRIACOES = [
  {
    rotulo: 'create table', kind: 'table', exige: 'IF NOT EXISTS',
    re: new RegExp(`create\\s+(?:unlogged\\s+)?table\\s+(if\\s+not\\s+exists\\s+)?(${ALVO})`, 'gi'),
    proprio: (m) => Boolean(m[1]), nome: (m) => nomeObjeto(m[2]),
  },
  {
    rotulo: 'create index', kind: 'index', exige: 'IF NOT EXISTS',
    re: new RegExp(`create\\s+(?:unique\\s+)?index\\s+(?:concurrently\\s+)?(if\\s+not\\s+exists\\s+)?(${ALVO})?`, 'gi'),
    proprio: (m) => Boolean(m[1]), nome: (m) => (m[2] ? nomeObjeto(m[2]) : '<sem nome>'),
  },
  {
    rotulo: 'create type', kind: 'type', exige: 'DROP TYPE IF EXISTS do mesmo tipo (CREATE TYPE nao aceita IF NOT EXISTS)',
    re: new RegExp(`create\\s+type\\s+(${ALVO})`, 'gi'),
    proprio: () => false, nome: (m) => nomeObjeto(m[1]),
  },
  {
    rotulo: 'create policy', kind: 'policy', exige: 'DROP POLICY IF EXISTS da mesma policy',
    re: new RegExp(`create\\s+policy\\s+(${ALVO})\\s+on\\s+(${ALVO})`, 'gi'),
    proprio: () => false, nome: (m) => `${nomeObjeto(m[1])}@${nomeObjeto(m[2])}`,
  },
  {
    rotulo: 'create trigger', kind: 'trigger', exige: 'CREATE OR REPLACE TRIGGER ou DROP TRIGGER IF EXISTS do mesmo trigger',
    re: new RegExp(`create\\s+(or\\s+replace\\s+)?trigger\\s+(${ALVO})\\s+(?:before|after|instead)\\s[\\s\\S]{0,400}?\\son\\s+(${ALVO})`, 'gi'),
    proprio: (m) => Boolean(m[1]), nome: (m) => `${nomeObjeto(m[2])}@${nomeObjeto(m[3])}`,
  },
  {
    rotulo: 'create materialized view', kind: 'materialized view', exige: 'IF NOT EXISTS',
    re: new RegExp(`create\\s+materialized\\s+view\\s+(if\\s+not\\s+exists\\s+)?(${ALVO})`, 'gi'),
    proprio: (m) => Boolean(m[1]), nome: (m) => nomeObjeto(m[2]),
  },
  {
    rotulo: 'create view', kind: 'view', exige: 'OR REPLACE',
    re: new RegExp(`create\\s+(or\\s+replace\\s+)?view\\s+(${ALVO})`, 'gi'),
    proprio: (m) => Boolean(m[1]), nome: (m) => nomeObjeto(m[2]),
  },
];

const DESTRUTIVOS = [
  { rotulo: 'drop table', re: /drop\s+table\s+/gi },
  { rotulo: 'drop column', re: /drop\s+column\s+/gi },
  { rotulo: 'drop schema', re: /drop\s+schema\s+/gi },
  { rotulo: 'truncate', re: /truncate\s+/gi },
  { rotulo: 'delete from', re: /delete\s+from\s+/gi },
];

const DROPS = [
  { kind: 'table', re: new RegExp(`drop\\s+table\\s+if\\s+exists\\s+(${ALVO})`, 'gi'), nome: (m) => nomeObjeto(m[1]) },
  { kind: 'index', re: new RegExp(`drop\\s+index\\s+(?:concurrently\\s+)?if\\s+exists\\s+(${ALVO})`, 'gi'), nome: (m) => nomeObjeto(m[1]) },
  { kind: 'type', re: new RegExp(`drop\\s+type\\s+if\\s+exists\\s+(${ALVO})`, 'gi'), nome: (m) => nomeObjeto(m[1]) },
  { kind: 'policy', re: new RegExp(`drop\\s+policy\\s+if\\s+exists\\s+(${ALVO})\\s+on\\s+(${ALVO})`, 'gi'), nome: (m) => `${nomeObjeto(m[1])}@${nomeObjeto(m[2])}` },
  { kind: 'trigger', re: new RegExp(`drop\\s+trigger\\s+if\\s+exists\\s+(${ALVO})\\s+on\\s+(${ALVO})`, 'gi'), nome: (m) => `${nomeObjeto(m[1])}@${nomeObjeto(m[2])}` },
  { kind: 'view', re: new RegExp(`drop\\s+view\\s+if\\s+exists\\s+(${ALVO})`, 'gi'), nome: (m) => nomeObjeto(m[1]) },
  { kind: 'materialized view', re: new RegExp(`drop\\s+materialized\\s+view\\s+if\\s+exists\\s+(${ALVO})`, 'gi'), nome: (m) => nomeObjeto(m[1]) },
];

/** Posicao e' codigo analisavel? (fora de identificador e de corpo `$$` que e' dado) */
function analisavel(faixas, pos) {
  const f = faixaDe(faixas, pos);
  if (!f) return true;
  if (f.tipo === 'ident') return false;
  return f.codigo === true; // corpo $$ de funcao/DO conta; corpo que e' dado, nao
}

/** A posicao esta dentro de um corpo `$$` de codigo que tem guarda? */
function dispensadaPorBloco(faixas, pos) {
  const f = faixaDe(faixas, pos);
  return Boolean(f && f.tipo === 'dollar' && f.codigo && f.guardado);
}

const TEMP_RE = /create\s+(?:global\s+|local\s+)?(?:temp|temporary)\s+table/i;

function ehTemp(sql, pos) {
  const janela = sql.slice(Math.max(0, pos - 40), pos + 40);
  return TEMP_RE.test(janela);
}

/** Analisa um arquivo e devolve os achados (sem decidir se falham). */
export function analisarArquivo(nome, texto) {
  const achados = [];
  if (!NOME_RE.test(nome)) {
    achados.push({ tipo: 'nome_invalido', arquivo: nome, rotulo: 'nome fora do padrao', detalhe: 'esperado AAAAMMDDHHMMSS_slug.sql' });
  }
  const { sql, faixas } = tokenizar(texto);

  const dropados = new Set();
  for (const d of DROPS) {
    d.re.lastIndex = 0;
    for (const m of sql.matchAll(d.re)) {
      if (!analisavel(faixas, m.index)) continue;
      dropados.add(`${d.kind}:${d.nome(m)}`);
    }
  }

  const contagem = new Map();
  for (const regra of CRIACOES) {
    regra.re.lastIndex = 0;
    for (const m of sql.matchAll(regra.re)) {
      if (!analisavel(faixas, m.index)) continue;
      if (dispensadaPorBloco(faixas, m.index)) continue;
      if (regra.proprio(m)) continue;
      if (regra.kind === 'table' && ehTemp(sql, m.index)) continue;
      if (dropados.has(`${regra.kind}:${regra.nome(m)}`)) continue;
      const chave = `${regra.rotulo} sem ${regra.exige}`;
      contagem.set(chave, (contagem.get(chave) || 0) + 1);
    }
  }
  for (const [rotulo, n] of contagem) {
    achados.push({ tipo: 'nao_idempotente', arquivo: nome, rotulo, detalhe: `${rotulo} (${n}x)`, n });
  }

  const destr = new Map();
  for (const d of DESTRUTIVOS) {
    d.re.lastIndex = 0;
    for (const m of sql.matchAll(d.re)) {
      if (!analisavel(faixas, m.index)) continue;
      destr.set(d.rotulo, (destr.get(d.rotulo) || 0) + 1);
    }
  }
  for (const [rotulo, n] of destr) {
    achados.push({ tipo: 'ddl_destrutivo', arquivo: nome, rotulo, detalhe: `${rotulo} (${n}x)`, n });
  }
  return achados;
}

/**
 * Ledger de tabelas: processa os arquivos em ORDEM e remove o que foi dropado
 * depois. `create temp table` nunca entra (nao vive no catalogo).
 */
export function ledgerDeTabelas(arquivosOrdenados) {
  const vivas = new Set();
  for (const { sql, faixas } of arquivosOrdenados) {
    const criar = CRIACOES.find((r) => r.kind === 'table');
    criar.re.lastIndex = 0;
    for (const m of sql.matchAll(criar.re)) {
      if (!analisavel(faixas, m.index)) continue;
      if (ehTemp(sql, m.index)) continue;
      const nome = criar.nome(m);
      vivas.add(nome.includes('.') ? nome : `public.${nome}`);
    }
    const dropRe = new RegExp(`drop\\s+table\\s+(?:if\\s+exists\\s+)?(${ALVO})`, 'gi');
    for (const m of sql.matchAll(dropRe)) {
      if (!analisavel(faixas, m.index)) continue;
      const nome = nomeObjeto(m[1]);
      vivas.delete(nome.includes('.') ? nome : `public.${nome}`);
    }
  }
  return vivas;
}

export function lerMigrations(dir) {
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => (d.isFile() || d.isSymbolicLink()) && d.name.toLowerCase().endsWith('.sql'))
    .map((d) => d.name)
    .sort();
}

export function auditar(dir) {
  const arquivos = lerMigrations(dir);
  if (arquivos === null) return { erro: `${dir} nao existe` };
  if (arquivos.length === 0) return { erro: `${dir} nao tem nenhum .sql` };
  const achados = [];
  const versoes = new Map();
  const ordenados = [];
  for (const nome of arquivos) {
    const bruto = fs.readFileSync(path.join(dir, nome));
    if (BOM.every((b, i) => bruto[i] === b)) {
      achados.push({
        tipo: 'codificacao',
        arquivo: nome,
        rotulo: 'BOM no inicio do arquivo',
        detalhe: 'os 3 primeiros bytes sao EF BB BF; o Postgres le o BOM como token e aborta com "syntax error at or near \\ufeff" (SQLSTATE 42601)',
      });
    }
    const texto = bruto.toString('utf8');
    achados.push(...analisarArquivo(nome, texto));
    const m = NOME_RE.exec(nome);
    if (m) {
      const antes = versoes.get(m[1]);
      if (antes) achados.push({ tipo: 'versao_duplicada', arquivo: nome, rotulo: 'versao duplicada', detalhe: `mesma versao de ${antes}` });
      else versoes.set(m[1], nome);
    }
    ordenados.push(tokenizar(texto));
  }
  return { arquivos, achados, declaradas: ledgerDeTabelas(ordenados) };
}

/** Fase 2: migrations x catalogo real do snapshot (formato 2). */
export function compararComSnapshot(declaradas, snapshotDir) {
  const arquivo = path.join(snapshotDir, 'snapshot.json');
  if (!fs.existsSync(arquivo)) {
    return { pulado: true, motivo: `${arquivo} nao existe (snapshot do banco nao foi gerado)` };
  }
  let snap;
  try {
    snap = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (erro) {
    return { pulado: true, motivo: `${arquivo} ilegivel: ${erro.message}` };
  }
  if (snap?.format_version !== 2 || !Array.isArray(snap?.db?.tables)) {
    return { pulado: true, motivo: `${arquivo} nao tem db.tables no formato 2` };
  }
  if (snap.db.tables.length === 0) {
    // Sucesso vazio (ex.: role sem permissao) nao e' "o banco nao tem tabela":
    // tratar como verdade transformaria as declaradas todas em drift.
    return { pulado: true, motivo: `${arquivo}: db.tables veio vazio` };
  }
  if ((snap.carried || []).includes('tables')) {
    // snapshot.py reaproveita a secao da coleta anterior quando ela falha.
    return { pulado: true, motivo: `${arquivo}: db.tables reaproveitado de coleta anterior (carried)` };
  }
  const validas = snap.db.tables.filter((t) => t && typeof t.schema === 'string' && typeof t.name === 'string');
  if (validas.length !== snap.db.tables.length) {
    return { invalido: true, motivo: `${arquivo}: ${snap.db.tables.length - validas.length} entrada(s) de db.tables sem schema/name` };
  }
  // DOIS conjuntos, porque as duas perguntas sao diferentes:
  //  - "a declarada existe?" => PERMISSIVO: existir em qualquer forma basta
  //    (pai particionado, particao filha, foreign table).
  //  - "o que existe sem migration?" => RESTRITIVO: so' tabela comum que uma
  //    migration deveria ter criado. Particao nasce de funcao/pg_partman e
  //    tabela de extensao (ex.: postgis.spatial_ref_sys) nunca vem de migration.
  const existe = new Set(validas.map((t) => `${t.schema}.${t.name}`));
  const proprias = validas.filter((t) => t.is_partition !== true && t.from_extension !== true
    && (t.kind === undefined || t.kind === 'table'));
  const reais = new Set(proprias.map((t) => `${t.schema}.${t.name}`));
  // Simetria de schema: o coletor exclui auth/storage/realtime/cron/vault/...,
  // entao so' compara nos dois sentidos os schemas que ele cobre de verdade.
  const cobertos = new Set(validas.map((t) => t.schema));
  const semNoBanco = [...declaradas]
    .filter((t) => cobertos.has(t.split('.')[0]) && !existe.has(t)).sort();
  const foraDoSnapshot = [...declaradas]
    .filter((t) => !cobertos.has(t.split('.')[0])).sort();
  const soNoBanco = [...reais].filter((t) => !declaradas.has(t)).sort();
  return { pulado: false, reais: existe.size, semNoBanco, soNoBanco, foraDoSnapshot };
}

export function contar(achados) {
  const out = {};
  for (const tipo of TIPOS) out[tipo] = achados.filter((a) => a.tipo === tipo).reduce((s, a) => s + (a.n ?? 1), 0);
  return out;
}

/** Chave do ratchet: arquivo + rotulo, SEM a contagem (a contagem e' o valor). */
export const chave = (a) => `${a.arquivo} :: ${a.rotulo}`;

/** { tipo: { chave: n } } — o baseline guarda contagem por chave. */
export function registrar(achados) {
  const out = {};
  for (const tipo of TIPOS) {
    out[tipo] = {};
    for (const a of achados.filter((x) => x.tipo === tipo)) {
      out[tipo][chave(a)] = (out[tipo][chave(a)] || 0) + (a.n ?? 1);
    }
  }
  return out;
}

/**
 * Compara chave a chave e por CONTAGEM: falha so' quando aparece chave nova ou
 * a contagem sobe. Queda entra em `resolvidos` — consertar metade do problema
 * nao pode deixar o CI vermelho.
 */
export function comparar(achados, baseline) {
  const atual = registrar(achados);
  const novos = [];
  const resolvidos = [];
  for (const tipo of TIPOS) {
    const antes = baseline?.achados?.[tipo] ?? {};
    const agora = atual[tipo] ?? {};
    for (const [k, n] of Object.entries(agora)) {
      const limite = antes[k] ?? 0;
      if (n > limite) novos.push({ tipo, chave: k, de: limite, para: n });
    }
    for (const [k, n] of Object.entries(antes)) {
      const agoraN = agora[k] ?? 0;
      if (agoraN < n) resolvidos.push({ tipo, chave: k, de: n, para: agoraN });
    }
  }
  return { novos, resolvidos };
}

function lista(itens, rotulo) {
  const head = itens.slice(0, LIMITE_LISTA).join(', ');
  const resto = itens.length > LIMITE_LISTA ? ` … e mais ${itens.length - LIMITE_LISTA}` : '';
  return `${rotulo} (${itens.length}): ${head}${resto}`;
}

function main(argv) {
  const snapshotIdx = argv.indexOf('--snapshot');
  const snapshotDir = snapshotIdx === -1 ? null : argv[snapshotIdx + 1];
  if (snapshotIdx !== -1 && !snapshotDir) {
    console.error('--snapshot exige um diretorio');
    return 2;
  }
  const auditoria = auditar(DIR);
  if (auditoria.erro) {
    console.error(`::error::${auditoria.erro} — o guarda nao tem o que analisar (nao e' sucesso)`);
    return 2;
  }
  const { arquivos, achados, declaradas } = auditoria;
  const contagem = contar(achados);
  console.log(`migrations: ${arquivos.length} arquivo(s) em ${DIR}`);
  for (const tipo of TIPOS) console.log(`  ${tipo}: ${contagem[tipo]}`);

  if (argv.includes('--atualizar-baseline')) {
    const anterior = fs.existsSync(BASELINE_PATH) ? JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8')) : null;
    const { novos } = comparar(achados, anterior ?? { achados: {} });
    if (anterior && novos.length && !argv.includes('--permitir-crescer')) {
      console.error(`::error::o baseline cresceria em ${novos.length} caso(s). Corrija a migration; use --permitir-crescer so' quando o crescimento for intencional.`);
      for (const nv of novos.slice(0, LIMITE_LISTA)) console.error(`  ${nv.tipo} ${nv.chave}: ${nv.de} -> ${nv.para}`);
      return 2;
    }
    const conteudo = {
      aviso: 'GERADO por scripts/db-audit/check-migration-drift.mjs --atualizar-baseline. Contagem por chave; deve apenas CAIR.',
      gerado_de: `${arquivos.length} arquivos`,
      contagem,
      achados: registrar(achados),
    };
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(conteudo, null, 2)}\n`);
    console.log(`baseline gravado em ${BASELINE_PATH}`);
    return 0;
  }

  let falhou = false;
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`::error::baseline ${BASELINE_PATH} nao existe — rode --atualizar-baseline`);
    return 2;
  }
  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch (erro) {
    console.error(`::error::baseline ${BASELINE_PATH} ilegivel: ${erro.message}`);
    return 2;
  }
  const { novos, resolvidos } = comparar(achados, baseline);
  if (novos.length) {
    console.error(`::error::${novos.length} caso(s) NOVO(s) — corrija a migration, nao o baseline:`);
    for (const nv of novos.slice(0, LIMITE_LISTA)) {
      console.error(`  ${nv.tipo} ${nv.chave}${nv.de ? ` (era ${nv.de}, agora ${nv.para})` : ''}`);
    }
    if (novos.length > LIMITE_LISTA) console.error(`  … e mais ${novos.length - LIMITE_LISTA}`);
    falhou = true;
  } else {
    console.log('nenhum caso novo em relacao ao baseline.');
  }
  if (resolvidos.length) {
    console.log(`${resolvidos.length} caso(s) melhoraram — rode --atualizar-baseline para encolher a lista:`);
    for (const r of resolvidos.slice(0, LIMITE_LISTA)) console.log(`  ${r.tipo} ${r.chave} (era ${r.de}, agora ${r.para})`);
  }

  if (snapshotDir) {
    const drift = compararComSnapshot(declaradas, snapshotDir);
    if (drift.invalido) {
      console.error(`::error::fase 2: ${drift.motivo}`);
      return 2;
    }
    if (drift.pulado) {
      console.log(`::warning::fase 2 (drift contra o banco) PULADA: ${drift.motivo}`);
    } else {
      console.log(`fase 2: ${declaradas.size} tabela(s) no ledger das migrations x ${drift.reais} no banco`);
      if (drift.semNoBanco.length) {
        console.error(`::error::${lista(drift.semNoBanco, 'declarada em migration e AUSENTE no banco')}`);
        falhou = true;
      } else {
        console.log('fase 2: nenhuma tabela declarada falta no banco.');
      }
      if (drift.soNoBanco.length) console.log(`::warning::${lista(drift.soNoBanco, 'no banco sem CREATE TABLE em migration')}`);
      if (drift.foraDoSnapshot.length) console.log(`::warning::${lista(drift.foraDoSnapshot, 'declarada em schema que o snapshot nao cobre (nao conferida)')}`);
    }
  } else {
    console.log('fase 2 nao solicitada (passe --snapshot <dir> para comparar com o banco).');
  }
  return falhou ? 1 : 0;
}

// `file://${process.argv[1]}` nunca casa no Windows (barra invertida e drive), e o
// script saia com exit 0 sem analisar nada. pathToFileURL normaliza nos dois SOs.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv.slice(2)));
}
