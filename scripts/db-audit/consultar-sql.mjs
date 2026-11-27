// Leitura avulsa no banco vivo pela Management API (mesma porta do apply-migrations).
// Existe para consultar producao sem depender de SUPABASE_DB_URL, que so vale para o snapshot.
//
// Uso: SELECAO_SQL=<nome> node scripts/db-audit/consultar-sql.mjs   (catalogo)
//      SQL_FILE=consulta.sql node scripts/db-audit/consultar-sql.mjs   (avulso, local)
//   SELECAO_SQL  nome da consulta marcada no catalogo scripts/db-audit/consultas.sql
//   SQL_FILE     arquivo com o proprio SQL; sem SELECAO_SQL le esse arquivo
//   LIMITE       maximo de linhas impressas (padrao 200)
//
// O SQL vem do catalogo versionado, nunca de texto digitado no disparo.
//
// Variaveis: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID, SQL_FILE, LIMITE

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { consultar } from "./apply-migrations.mjs";

const SOMENTE_LEITURA = /^\s*(select|with)\b/i;
const PROIBIDO = /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|copy|call|do)\b/i;
// Ensaio de funcao: precisa chamar a funcao de verdade para saber se ela quebra, e o unico jeito de
// nao gravar nada e' rodar dentro de BEGIN e terminar em ROLLBACK. O guarda continua valendo para o
// que estiver entre o BEGIN e o ROLLBACK (so SELECT), e o ROLLBACK e' acrescentado pelo runner, nao
const ENSAIO = /^begin\s*;\s*select\s+(\*\s+from\s+)?public\.([a-z_]+)\(([^;]*)\)\s+as\s+([a-z_]+)\s*;?$/i;

export function lerSql() {
  const caminho = path.resolve(process.env.SQL_FILE || path.join("scripts", "db-audit", "consultas.sql"));
  // Caminho A: catalogo versionado, escolhido por nome (o que o workflow usa).
  // Caminho B: arquivo avulso por SQL_FILE, para investigacao local â€” sem SELECAO_SQL.
  const escolhida = (process.env.SELECAO_SQL || "").trim();
  const avulso = (process.env.SQL_FILE || "").trim();
  let sql;
  if (escolhida) {
    const fonte = readFileSync(caminho, "utf8").split(/\r?\n/);
    let coletando = false;
    let sqlComecou = false;
    const guardadas = [];
    for (const linha of fonte) {
      const marcador = /^--\s*nome:\s*(\S+)\s*/i.exec(linha.trim());
      if (marcador) {
        coletando = marcador[1] === escolhida;
        continue;
      }
      // O bloco termina na primeira linha em branco depois do SQL: nome repetido no catalogo resolve
      // pelo bloco seguinte, e um SELECT que comeca com WITH tem subquery dentro, entao nao serve
      // parar na primeira linha de dados (run 46022198719 enviou so a primeira linha).
      if (coletando) { guardadas.push(linha); if (linha.trim() !== "" && !linha.trim().startsWith("--")) sqlComecou = true; }
    }
    sql = guardadas.filter(function (l) { return !l.trim().startsWith("--"); }).join("\n").trim();
    if (!sql) {
      const nomes = fonte.map(function (l) { return /^--\s*nome:\s*(\S+)\s*$/.exec(l.trim()); })
        .filter(Boolean).map(function (m) { return m[1]; });
      throw new Error("consulta '" + escolhida + "' nao existe em " + path.basename(caminho) + "; disponiveis: " + nomes.join(", "));
    }
  } else if (avulso) {
    sql = readFileSync(avulso, "utf8").trim().replace(/;$/, "").trim();
    if (!sql) throw new Error("SQL_FILE vazio");
  } else {
    throw new Error("informe SELECAO_SQL (catalogo) ou SQL_FILE (arquivo avulso)");
  }
  if (!SOMENTE_LEITURA.test(sql)) {
    const ensaio = ENSAIO.exec(sql.replace(/\s+/g, " ").trim());
    // So' funcao de envio/agendamento/verificacao tem ensaio liberado, e o rollback e' imposto aqui.
    // `check_` e' leitura pura: roda dentro do BEGIN e o ROLLBACK descarta o que ela gravar.
    if (!/^(send|notify|enqueue|dispatch|push|process|run|refresh|check)_/.test(ensaio[2])) {
      throw new Error("ensaio permitido apenas para funcoes de envio/agendamento/verificacao");
    }
    // Argumento do ensaio: so' literal simples (numero, booleano, texto sem aspas internas).
    const args = (ensaio[3] || "").trim();
    if (args && !/^([a-z_]+\s*=>\s*)?(\d+|true|false|null|'[^']*')$/i.test(args)) {
      throw new Error("ensaio com argumento nao literal nao e' aceito");
    }
    return "begin; select " + (ensaio[1] ? "* from " : "") + "public." + ensaio[2] + "(" + args + ") as " + ensaio[4] + "; rollback;";
  }
  sql = sql.replace(/;$/, "").trim();
  // Sem isso um "select 1; delete ..." passaria pela checagem do inicio.
  if (sql.includes(";")) throw new Error("uma unica instrucao por arquivo (sem ponto e virgula no meio)");
  if (PROIBIDO.test(sql)) throw new Error("palavra de escrita encontrada na consulta");
  return sql;
}

function imprimir(valor) {
  if (valor === null) return "NULL";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

async function main() {
  const sql = lerSql();
  const limite = Number.parseInt(process.env.LIMITE || "200", 10);
  const linhas = await consultar(sql);
  if (!Array.isArray(linhas)) {
    console.log(String(linhas));
    return 0;
  }
  if (linhas.length === 0) {
    console.log("(nenhuma linha)");
    return 0;
  }
  for (const linha of linhas.slice(0, limite)) {
    const pares = Object.entries(linha).map(function (par) { return `${par[0]}=` + imprimir(par[1]); });
    console.log(pares.join(" | "));
  }
  if (linhas.length > limite) console.log("... " + (linhas.length - limite) + " linhas omitidas");
  return 0;
}

// Só executa como CLI: importado (teste do parser), exporta lerSql sem rodar nada.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
main()
  .then(function (codigo) { process.exit(codigo || 0); })
  .catch(function (erro) {
    console.error("erro: " + erro.message);
    process.exit(2);
  });
}

