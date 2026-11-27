#!/usr/bin/env node
/**
 * Aplica em producao as migrations de `supabase/migrations/` que ainda nao
 * estao no ledger `supabase_migrations.schema_migrations`.
 *
 * Por que existe: nenhum workflow deste repositorio aplicava migration. A
 * 20261229000000 (janela de silencio) entrou em producao por uma branch
 * descartavel com um workflow de uma vez; sem isso, um rebuild/reset reconstroi
 * o schema sem o que ficou fora do ledger e o buraco so' aparece em producao.
 *
 * Como acessa: Management API (`POST /v1/projects/{ref}/database/query`), a
 * mesma porta do `supabase db push`. O repositorio ja tem SUPABASE_ACCESS_TOKEN
 * como secret; nao existe SUPABASE_DB_URL nem senha do banco para o CLI.
 *
 * Uso:
 *   node scripts/db-audit/apply-migrations.mjs            # check: so relata
 *   node scripts/db-audit/apply-migrations.mjs --apply     # aplica as faltantes
 *   node scripts/db-audit/apply-migrations.mjs --verify=demo # + confere objeto no banco
 *   node scripts/db-audit/apply-migrations.mjs --dir outro/diretorio
 *
 * Variaveis: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID, MIGRATIONS_DIR
 *            (MIGRATIONS_DIR padrao: supabase/migrations)
 *
 * Politica: migration no ledger sem arquivo no repo e' divergencia. O check sempre
 * barra; o --apply so' barra quando nenhuma migration do repo tem aquela versao,
 * porque a versao cujo arquivo esta' em PR aberta volta a existir no merge.
 *
 * Exit: 0 = nada pendente e nada divergente; 1 = pendencia ou divergencia;
 *       2 = erro de uso/ambiente. Nunca sai 0 sem ter consultado o ledger.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const USO = "uso: node scripts/db-audit/apply-migrations.mjs [--apply] [--verify <objeto>] [--reaplicar <versao>] [--dir <dir>]";

const IDENTIFICADOR = /^[a-z_][a-z0-9_]*$/i;
const VERSAO = /^\d{14}$/;

function lerArgs(argv) {
  const opts = {
    apply: false,
    verify: null,
    reaplicar: null,
    dir: process.env.MIGRATIONS_DIR || "supabase/migrations",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    // `--verify=objeto` e `--verify objeto`: o workflow passa a forma com `=`.
    const separado = /^--verify=(.*)$/.exec(arg);
    // Reaplica uma versao JA registrada no ledger: so' para arquivo corrigido com
    // CREATE OR REPLACE, quando o banco ficou com a versao quebrada da funcao.
    const reaplicar = /^--reaplicar=(.*)$/.exec(arg);
    if (reaplicar) {
      if (!VERSAO.test(reaplicar[1])) {
        throw new Error(`--reaplicar exige a versao de 14 digitos\n${USO}`);
      }
      opts.reaplicar = reaplicar[1];
    } else if (separado) {
      if (!IDENTIFICADOR.test(separado[1])) {
        throw new Error(`--verify exige um nome de objeto (letras, digitos e _)\n${USO}`);
      }
      opts.verify = separado[1];
    } else if (arg === "--apply") {
      opts.apply = true;
    } else if (arg === "--verify") {
      i += 1;
      if (!argv[i] || !IDENTIFICADOR.test(argv[i])) {
        throw new Error(`--verify exige um nome de objeto (letras, digitos e _)\n${USO}`);
      }
      opts.verify = argv[i];
    } else if (arg === "--dir") {
      i += 1;
      if (!argv[i]) throw new Error(`--dir exige um caminho\n${USO}`);
      opts.dir = argv[i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(USO);
      return 0;
    } else {
      throw new Error(`argumento desconhecido: ${arg}\n${USO}`);
    }
  }
  return opts;
}

function listarLocais(dir) {
  let nomes;
  try {
    nomes = readdirSync(dir);
  } catch {
    throw new Error(`diretorio de migrations ilegivel: ${dir}`);
  }
  const sql = nomes.filter((n) => n.endsWith(".sql")).sort();
  if (sql.length === 0) throw new Error(`nenhuma migration em ${dir}`);
  return sql.map((nome) => {
    const m = /^(\d{14})_(.+)\.sql$/.exec(nome);
    if (!m) throw new Error(`nome fora do padrao AAAAAMMDDHHMMSS_slug.sql: ${nome}`);
    return { version: m[1], name: m[2], arquivo: path.join(dir, nome), nome };
  });
}

const ref = process.env.SUPABASE_PROJECT_ID;
const token = process.env.SUPABASE_ACCESS_TOKEN;

// Mesma porta da Management API, reaproveitada pelo consultar-sql.mjs para
// leituras avulsas no banco vivo sem precisar de SUPABASE_DB_URL.
export async function consultar(sql) {
  const resposta = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const texto = await resposta.text();
  if (!resposta.ok) {
    throw new Error(`Management API ${resposta.status}: ${texto.slice(0, 500)}`);
  }
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}
function aspas(texto) {
  return `'${String(texto).replace(/'/g, "''")}'`;
}

export async function main(argv = process.argv.slice(2)) {
  const opts = lerArgs(argv);
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN ausente no ambiente");
  if (!ref) throw new Error("SUPABASE_PROJECT_ID ausente no ambiente");
  const local = listarLocais(opts.dir);

  const ledger = await consultar(
    "select version, name from supabase_migrations.schema_migrations order by version;",
  );
  const porVersao = new Map(ledger.map((l) => [l.version, l.name]));
  const pendentes = local.filter((m) => !porVersao.has(m.version));
  // O nome no ledger e' metadado: o que importa e' a versao aplicada. O CLI grava
  // ora o slug, ora o nome do arquivo, e registro antigo ficou com name nulo -
  // por isso nome fora do padrao e' aviso (corrigido no --apply), nao bloqueio.
  const nomesDivergentes = local.filter(
    (m) => porVersao.has(m.version) && porVersao.get(m.version) !== m.name,
  );
  const orfaos = ledger.filter((l) => !local.some((m) => m.version === l.version));

  console.log(
    `banco: ${ledger.length} registros no ledger | repo: ${local.length} arquivos ` +
      `| pendentes: ${pendentes.length} | nome fora do padrao: ${nomesDivergentes.length} ` +
      `| no banco sem arquivo: ${orfaos.length}`,
  );
  for (const m of pendentes) console.log(`  PENDENTE    ${m.version} ${m.name} (${m.nome})`);
  if (opts.reaplicar) {
    const alvo = local.find((m) => m.version === opts.reaplicar);
    if (!alvo) throw new Error(`--reaplicar: versao ${opts.reaplicar} nao existe em ${opts.dir}`);
    if (!porVersao.has(alvo.version)) {
      throw new Error(
        `--reaplicar: versao ${alvo.version} ainda nao esta no ledger; use --apply (o arquivo roda sozinho)`,
      );
    }
    pendentes.push(alvo);
    console.log(`  REAPLICAR   ${alvo.version} ${alvo.name} (${alvo.nome})`);
  }
  for (const m of nomesDivergentes) {
    console.log(`  NOME        ${m.version}: repo="${m.name}" banco="${porVersao.get(m.version)}"`);
  }
  for (const l of orfaos) console.log(`  SEM ARQUIVO ${l.version} ${l.name} (aplicada direto no banco)`);

  // Registro no ledger sem arquivo no repo: alguem aplicou direto no banco. Se a
  // migration correspondente esta' no repo (PR aberta), o merge e' a cura, entao
  // e' aviso e o --apply segue com o resto; se nenhuma migration do repo tem essa
  // versao, o arquivo se perdeu e nada pode ser aplicado ate' recupera-lo.
  const versoesDoRepo = new Set(local.map((m) => m.version));

  if (orfaos.length > 0 && !opts.apply) {
    console.log("::error::migration aplicada no banco sem arquivo no repo - traga o arquivo antes de aplicar.");
    return 1;
  }
  const semArquivo = orfaos.filter((l) => !versoesDoRepo.has(l.version));
  if (semArquivo.length > 0) {
    console.log(
      "::error::versao no ledger e nenhuma migration do repo com ela: "
        + `${semArquivo.map((l) => l.version).join(", ")} - recupere o arquivo antes de aplicar.`,
    );
    return 1;
  }
  if (pendentes.length === 0 && orfaos.length === 0 && !opts.verify) {
    console.log("nada a aplicar: repo e banco alinhados.");
    return 0;
  }
  if (!opts.apply) {
    console.log("modo check: nada foi escrito. Rode com --apply para aplicar as pendentes.");
    return 1;
  }

  for (const m of nomesDivergentes) {
    await consultar(
      "update supabase_migrations.schema_migrations "
        + `set name = ${aspas(m.name)} where version = ${aspas(m.version)};`,
    );
    console.log(`  nome do ledger corrigido: ${m.version} -> ${m.name}`);
  }

  for (const m of pendentes) {
    console.log(`> aplicando ${m.nome}`);
    await consultar(readFileSync(m.arquivo, "utf8"));
    await consultar(
      "insert into supabase_migrations.schema_migrations (version, name) "
        + `values (${aspas(m.version)}, ${aspas(m.name)}) `
        + "on conflict (version) do update set name = excluded.name;",
    );
    console.log(`  ok ${m.version} registrada no ledger`);
  }

  const depois = await consultar(
    "select version from supabase_migrations.schema_migrations order by version;",
  );
  const faltam = local
    .filter((m) => !depois.some((l) => l.version === m.version))
    .map((m) => m.version);
  if (faltam.length > 0) {
    console.log(`::error::ainda faltam no ledger: ${faltam.join(", ")}`);
    return 1;
  }
  console.log(`aplicadas ${pendentes.length} migration(s); ledger com ${depois.length} registros.`);

  // O apply so' e' prova de que o SQL rodou: quem diz que o efeito esta' no banco
  // e' uma consulta ao banco vivo. Objeto ausente = ::error (exit 1).
  if (opts.verify) {
    const linhas = await consultar(
      // to_regprocedure enxerga funcao; to_regclass so' cobre tabela/view quando o nome
      // existe como relacao. O fallback mantem o comportamento antigo para tabela/view.
      "select coalesce("
        + "to_regclass(" + aspas(`public.${opts.verify}`) + ")::text, "
        // Qualquer assinatura em public: a funcao pode ter argumento com default, e o
        // to_regprocedure de um nome so nao resolve para ela.
        + "(select p.oid::regprocedure::text from pg_proc p "
        + "where p.proname = " + aspas(opts.verify) + " and p.pronamespace = 'public'::regnamespace limit 1)"
        + ") as objeto;",
    );
    const objeto = Array.isArray(linhas) && linhas[0] ? linhas[0].objeto : null;
    if (!objeto) {
      console.log(`::error::objeto public.${opts.verify} ausente no banco depois do apply.`);
      return 1;
    }
    console.log(`  verificado: public.${opts.verify} existe no banco (${objeto}).`);
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((codigo) => process.exit(codigo ?? 0))
    .catch((erro) => {
      console.error(`erro: ${erro.message}`);
      process.exit(2);
    });
}