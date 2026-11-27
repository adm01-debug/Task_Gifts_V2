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

import { consultar } from "./apply-migrations.mjs";

const SOMENTE_LEITURA = /^\s*(select|with)\b/i;
const PROIBIDO = /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|copy|call|do)\b/i;

function lerSql() {
  const caminho = path.resolve(process.env.SQL_FILE || path.join("scripts", "db-audit", "consultas.sql"));
  // Caminho A: catalogo versionado, escolhido por nome (o que o workflow usa).
  // Caminho B: arquivo avulso por SQL_FILE, para investigacao local — sem SELECAO_SQL.
  const escolhida = (process.env.SELECAO_SQL || "").trim();
  const avulso = (process.env.SQL_FILE || "").trim();
  let sql;
  if (escolhida) {
    const fonte = readFileSync(caminho, "utf8").split(/\r?\n/);
    let coletando = false;
    const guardadas = [];
    for (const linha of fonte) {
      const marcador = /^--\s*nome:\s*(\S+)\s*/i.exec(linha.trim());
      if (marcador) {
        coletando = marcador[1] === escolhida;
        continue;
      }
      if (coletando) guardadas.push(linha);
    }
    sql = guardadas.filter(function (l) { return !l.trim().startsWith("--"); }).join("\n").trim().replace(/;$/, "").trim();
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
  if (!SOMENTE_LEITURA.test(sql)) throw new Error("a consulta precisa comecar por SELECT ou WITH");
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

main()
  .then(function (codigo) { process.exit(codigo || 0); })
  .catch(function (erro) {
    console.error("erro: " + erro.message);
    process.exit(2);
  });

