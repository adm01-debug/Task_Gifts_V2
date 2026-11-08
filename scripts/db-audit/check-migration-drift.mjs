#!/usr/bin/env node
/**
 * Guarda das migrations de supabase/migrations/.
 *
 * Por que existe: este banco NAO tem `supabase_migrations.schema_migrations`
 * (ver docs/agentes/banco.md), logo nao da' para comparar arquivo x ledger como
 * no Zapp_Web_V2 (scripts/db-audit/check-migration-drift.mjs de la'). Sem ledger,
 * "esta aplicada?" so' tem duas respostas possiveis:
 *
 *   FASE 1 (offline, sempre roda) - o arquivo e' seguro de reaplicar?
 *     Sem ledger, qualquer replay/reset reexecuta a migration inteira. Uma
 *     migration nao idempotente aborta no meio e deixa o banco pela metade.
 *     Confere nome, versao duplicada, idempotencia e DDL destrutivo, com
 *     ratchet (scripts/db-audit/migration-baseline.json): o legado nao quebra o
 *     CI, mas nenhum caso novo entra. Mesmo padrao dos ratchets do Zapp.
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
 *
 * Variaveis para teste offline:
 *   MIGRATIONS_DIR      diretorio das migrations (padrao: supabase/migrations)
 *   MIGRATION_BASELINE  caminho do baseline (padrao: scripts/db-audit/migration-baseline.json)
 *
 * Exit: 0 = dentro do baseline; 1 = caso novo ou drift; 2 = erro de uso.
 *
 * LIMITE CONHECIDO: a analise e' estatica e por token, nao um parser de
 * PostgreSQL. Guardas dentro de `DO $$ ... $$` sao reconhecidas por heuristica
 * (o bloco inteiro e' considerado guardado quando cita `if not exists`,
 * `to_regclass`, `pg_class`, `pg_policies` ou `information_schema`). Achado
 * aqui e' candidato a revisao, nao prova; ausencia de achado nao prova que a
 * migration e' idempotente.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = process.env.MIGRATIONS_DIR || 'supabase/migrations';
const BASELINE_PATH = process.env.MIGRATION_BASELINE || 'scripts/db-audit/migration-baseline.json';
const NOME_RE = /^(\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/;

export const TIPOS = [
  'nome_invalido',
  'versao_duplicada',
  'nao_idempotente',
  'ddl_destrutivo',
];

/**
 * Remove comentarios (`--`, blocos) e o conteudo de literais, mantendo o
 * comprimento irrelevante: o que sobra e' so' codigo SQL em minusculas. Corpos
 * `$$...$$` sao preservados porque e' la' que moram as guardas de idempotencia.
 */
export function normalizarSql(texto) {
  let fora = '';
  let i = 0;
  const n = texto.length;
  while (i < n) {
    const c = texto[i];
    const d = texto[i + 1];
    if (c === '-' && d === '-') {
      while (i < n && texto[i] !== '\n') i += 1;
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
      fora += ' ';
      continue;
    }
    // Aspas simples = literal (conteudo descartado). Aspas duplas = IDENTIFICADOR
    // no Postgres ("app"."c", nome de policy): o trecho e' consumido como unidade
    // e preservado, senao `create table "app"."c"` perderia o nome da tabela.
    if (c === "'" || c === '"') {
      const fim = c;
      const inicio = i;
      i += 1;
      while (i < n) {
        if (texto[i] === fim && texto[i + 1] === fim) { i += 2; continue; }
        if (texto[i] === fim) { i += 1; break; }
        i += 1;
      }
      fora += fim === "'" ? " '' " : texto.slice(inicio, i);
      continue;
    }
    fora += c;
    i += 1;
  }
  return fora.toLowerCase().replace(/\s+/g, ' ');
}

/** Os blocos `$tag$ ... $tag$` do texto normalizado. */
export function blocosDollar(sql) {
  const out = [];
  const re = /\$([a-z0-9_]*)\$/g;
  let abre = null;
  let m;
  while ((m = re.exec(sql)) !== null) {
    if (abre === null) { abre = { tag: m[1], fim: m.index + m[0].length }; continue; }
    if (m[1] === abre.tag) { out.push(sql.slice(abre.fim, m.index)); abre = null; }
  }
  return out;
}

const GUARDAS = /if not exists|if exists|to_regclass|pg_class|pg_policies|pg_policy|pg_type|pg_trigger|pg_proc|pg_matviews|information_schema|pg_indexes|exception when duplicate/;

/**
 * Statements que, sem guarda, abortam a migration numa reaplicacao.
 * `create policy` e `create trigger` nao aceitam IF NOT EXISTS no Postgres:
 * exigem `drop ... if exists` antes (ou um bloco guardado).
 */
const REGRAS = [
  { rotulo: 'create table', re: /create\s+(unlogged\s+|temp\s+|temporary\s+)?table\s+(?!if\s+not\s+exists)/g, exige: 'IF NOT EXISTS' },
  { rotulo: 'create index', re: /create\s+(unique\s+)?index\s+(?!(if\s+not\s+exists|concurrently\s+if\s+not\s+exists))/g, exige: 'IF NOT EXISTS' },
  { rotulo: 'create type', re: /create\s+type\s+/g, exige: 'bloco guardado (CREATE TYPE nao aceita IF NOT EXISTS)' },
  { rotulo: 'create policy', re: /create\s+policy\s+/g, exige: 'DROP POLICY IF EXISTS antes' },
  { rotulo: 'create trigger', re: /create\s+trigger\s+/g, exige: 'DROP TRIGGER IF EXISTS antes' },
  { rotulo: 'create view', re: /create\s+view\s+(?!if\s+not\s+exists)/g, exige: 'OR REPLACE' },
  { rotulo: 'create materialized view', re: /create\s+materialized\s+view\s+(?!if\s+not\s+exists)/g, exige: 'IF NOT EXISTS' },
];

const DESTRUTIVOS = [
  { rotulo: 'drop table', re: /drop\s+table\s+/ },
  { rotulo: 'drop column', re: /drop\s+column\s+/ },
  { rotulo: 'drop schema', re: /drop\s+schema\s+/ },
  { rotulo: 'truncate', re: /truncate\s+/ },
  { rotulo: 'delete from', re: /delete\s+from\s+/ },
];

/** Analisa um arquivo e devolve os achados (sem decidir se falham). */
export function analisarArquivo(nome, texto) {
  const achados = [];
  if (!NOME_RE.test(nome)) {
    achados.push({ tipo: 'nome_invalido', arquivo: nome, detalhe: 'esperado AAAAMMDDHHMMSS_slug.sql' });
  }
  const sql = normalizarSql(texto);
  // Cada statement `create policy`/`create trigger` tem a sua propria guarda se
  // o arquivo derruba o objeto antes; a conferencia e' por arquivo, nao por linha.
  const corpoGuardado = blocosDollar(sql).some((b) => GUARDAS.test(b));
  for (const regra of REGRAS) {
    regra.re.lastIndex = 0;
    const ocorrencias = [...sql.matchAll(regra.re)];
    if (ocorrencias.length === 0) continue;
    if (corpoGuardado) continue;
    if (regra.rotulo === 'create policy' && /drop\s+policy\s+if\s+exists/.test(sql)) continue;
    if (regra.rotulo === 'create trigger' && /drop\s+trigger\s+if\s+exists/.test(sql)) continue;
    if (regra.rotulo === 'create type' && /drop\s+type\s+if\s+exists/.test(sql)) continue;
    if (regra.rotulo === 'create view' && /create\s+or\s+replace\s+view/.test(sql)) continue;
    achados.push({
      tipo: 'nao_idempotente',
      arquivo: nome,
      detalhe: `${regra.rotulo} sem ${regra.exige} (${ocorrencias.length}x)`,
    });
  }
  for (const d of DESTRUTIVOS) {
    if (d.re.test(sql)) achados.push({ tipo: 'ddl_destrutivo', arquivo: nome, detalhe: d.rotulo });
  }
  return achados;
}

/** Tabelas declaradas por `create table [if not exists] [schema.]nome`. */
export function tabelasDeclaradas(sql) {
  const out = new Set();
  const re = /create\s+(?:unlogged\s+|temp\s+|temporary\s+)?table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const bruto = m[1].replace(/"/g, '');
    const partes = bruto.split('.');
    const nome = partes.pop();
    const schema = partes.pop() || 'public';
    if (nome) out.add(`${schema}.${nome}`);
  }
  return out;
}

export function lerMigrations(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.sql'))
    .map((d) => d.name)
    .sort();
}

export function auditar(dir) {
  const arquivos = lerMigrations(dir);
  const achados = [];
  const versoes = new Map();
  let declaradas = new Set();
  for (const nome of arquivos) {
    const texto = fs.readFileSync(path.join(dir, nome), 'utf8');
    achados.push(...analisarArquivo(nome, texto));
    const m = NOME_RE.exec(nome);
    if (m) {
      const antes = versoes.get(m[1]);
      if (antes) achados.push({ tipo: 'versao_duplicada', arquivo: nome, detalhe: `mesma versao de ${antes}` });
      else versoes.set(m[1], nome);
    }
    declaradas = new Set([...declaradas, ...tabelasDeclaradas(normalizarSql(texto))]);
  }
  return { arquivos, achados, declaradas };
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
  const reais = new Set(snap.db.tables.map((t) => `${t.schema}.${t.name}`));
  const semNoBanco = [...declaradas].filter((t) => !reais.has(t)).sort();
  const soNoBanco = [...reais]
    .filter((t) => t.startsWith('public.') && !declaradas.has(t))
    .sort();
  return { pulado: false, reais: reais.size, semNoBanco, soNoBanco };
}

export function contar(achados) {
  const out = {};
  for (const tipo of TIPOS) out[tipo] = achados.filter((a) => a.tipo === tipo).length;
  return out;
}

/** Chave estavel de um achado, usada no baseline. */
export const chave = (a) => `${a.arquivo} :: ${a.detalhe}`;

/** { tipo: [chave, ...] } ordenado — o baseline guarda a lista, nao so' a contagem. */
export function registrar(achados) {
  const out = {};
  for (const tipo of TIPOS) {
    out[tipo] = achados.filter((a) => a.tipo === tipo).map(chave).sort();
  }
  return out;
}

function lerBaseline(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Compara achado a achado, nao contagem a contagem: assim o CI aponta a
 * migration NOVA em vez de despejar o legado inteiro. `resolvidos` existe para
 * o baseline poder encolher sem virar mentira.
 */
export function comparar(achados, baseline) {
  const atual = registrar(achados);
  const novos = [];
  const resolvidos = [];
  for (const tipo of TIPOS) {
    const antes = new Set(baseline?.achados?.[tipo] ?? []);
    const agora = new Set(atual[tipo]);
    for (const k of agora) if (!antes.has(k)) novos.push({ tipo, chave: k });
    for (const k of antes) if (!agora.has(k)) resolvidos.push({ tipo, chave: k });
  }
  return { novos, resolvidos };
}

function main(argv) {
  const snapshotIdx = argv.indexOf('--snapshot');
  const snapshotDir = snapshotIdx === -1 ? null : argv[snapshotIdx + 1];
  if (snapshotIdx !== -1 && !snapshotDir) {
    console.error('--snapshot exige um diretorio');
    return 2;
  }
  const { arquivos, achados, declaradas } = auditar(DIR);
  const contagem = contar(achados);
  console.log(`migrations: ${arquivos.length} arquivo(s) em ${DIR}`);
  for (const tipo of TIPOS) console.log(`  ${tipo}: ${contagem[tipo]}`);

  if (argv.includes('--atualizar-baseline')) {
    const conteudo = {
      aviso: 'GERADO por scripts/db-audit/check-migration-drift.mjs --atualizar-baseline. Esta lista so deve ENCOLHER.',
      gerado_de: `${arquivos.length} arquivos`,
      contagem,
      achados: registrar(achados),
    };
    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(conteudo, null, 2)}\n`);
    console.log(`baseline gravado em ${BASELINE_PATH}`);
    return 0;
  }

  let falhou = false;
  const baseline = lerBaseline(BASELINE_PATH);
  if (!baseline) {
    console.error(`::error::baseline ${BASELINE_PATH} nao existe — rode --atualizar-baseline`);
    falhou = true;
  } else {
    const { novos, resolvidos } = comparar(achados, baseline);
    if (novos.length) {
      console.error(`::error::${novos.length} caso(s) NOVO(s) — corrija a migration, nao o baseline:`);
      for (const n of novos) console.error(`  ${n.tipo} ${n.chave}`);
      falhou = true;
    } else {
      console.log('nenhum caso novo em relacao ao baseline.');
    }
    if (resolvidos.length) {
      console.log(`${resolvidos.length} caso(s) do baseline nao existem mais — rode --atualizar-baseline para encolher a lista:`);
      for (const r of resolvidos.slice(0, 20)) console.log(`  ${r.tipo} ${r.chave}`);
    }
  }

  if (snapshotDir) {
    const drift = compararComSnapshot(declaradas, snapshotDir);
    if (drift.pulado) {
      console.log(`::warning::fase 2 (drift contra o banco) PULADA: ${drift.motivo}`);
    } else {
      console.log(`fase 2: ${declaradas.size} tabela(s) declarada(s) nas migrations x ${drift.reais} no banco`);
      if (drift.semNoBanco.length) {
        console.error(`::error::declarada em migration e AUSENTE no banco (${drift.semNoBanco.length}): ${drift.semNoBanco.join(', ')}`);
        falhou = true;
      }
      if (drift.soNoBanco.length) {
        console.log(`::warning::no banco sem CREATE TABLE em migration (${drift.soNoBanco.length}): ${drift.soNoBanco.join(', ')}`);
      }
      if (!drift.semNoBanco.length) console.log('fase 2: nenhuma tabela declarada falta no banco.');
    }
  } else {
    console.log('fase 2 nao solicitada (passe --snapshot <dir> para comparar com o banco).');
  }
  return falhou ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
