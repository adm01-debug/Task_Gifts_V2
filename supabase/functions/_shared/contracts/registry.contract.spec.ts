import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CONTRACTS, EDGE_FUNCTION_NAMES, getContract, type EdgeContract } from "./index.ts";
import { fixturesFor, FIXTURE_NAMES } from "./_fixtures/index.ts";
import { responsesFor } from "./_fixtures/responses.ts";
import type { InvalidCase } from "./_fixtures/types.ts";
import { expectUnifiedValidationError, expectValidationResponse, toResponse, validateWithContract } from "./_testkit.ts";
import { ValidationErrorSchema } from "../validation.ts";

const FUNCTIONS_DIR = join(__dirname, "..", "..");

function edgeFunctionDirs(): string[] {
  return readdirSync(FUNCTIONS_DIR)
    .filter((d) => !d.startsWith("_") && statSync(join(FUNCTIONS_DIR, d)).isDirectory())
    .filter((d) => statSync(join(FUNCTIONS_DIR, d, "index.ts")).isFile())
    .sort();
}

describe("registro de contratos cobre TODAS as edge functions", () => {
  it("cada pasta de supabase/functions tem contrato e fixtures (nenhum endpoint sem validação)", () => {
    const dirs = edgeFunctionDirs();
    expect(dirs.length).toBeGreaterThan(0);
    expect(EDGE_FUNCTION_NAMES).toEqual(dirs);
    expect(FIXTURE_NAMES).toEqual(dirs);
  });

  it("cada contrato é coerente (nome = chave, métodos, auth, schema)", () => {
    for (const [name, contract] of Object.entries(CONTRACTS) as [string, EdgeContract][]) {
      expect(contract.name).toBe(name);
      expect(contract.methods.length).toBeGreaterThan(0);
      expect(["user", "service", "access-key", "none"]).toContain(contract.auth);
      expect(typeof contract.request.safeParse).toBe("function");
      if (contract.response) expect(typeof contract.response.safeParse).toBe("function");
      if (contract.versions) expect(contract.versions.length).toBeGreaterThan(0);
      expect(getContract(name)).toBe(contract);
    }
    expect(getContract("nao-existe")).toBeUndefined();
  });

  it("funções com corpo obrigatório têm casos de campo ausente, tipo errado e valor vazio", () => {
    for (const name of EDGE_FUNCTION_NAMES) {
      const c = CONTRACTS[name] as EdgeContract;
      const fx = fixturesFor(name)!;
      expect(fx.valid.length, `${name}: precisa de ≥1 payload válido`).toBeGreaterThan(0);
      expect(fx.notObject.length, `${name}: precisa rejeitar corpo não-objeto`).toBeGreaterThan(0);
      if (c.response) {
        const resp = responsesFor(name);
        expect(resp?.valid.length, `${name}: declara response mas não tem amostra 2xx em _fixtures/responses.ts`).toBeGreaterThan(0);
        expect(resp?.invalid.length, `${name}: response sem caso inválido (o teste não provaria nada)`).toBeGreaterThan(0);
      }
      if (c.bodyRequired) {
        expect(fx.missing.length, `${name}: campos ausentes`).toBeGreaterThan(0);
        expect(fx.wrongType.length, `${name}: tipos incorretos`).toBeGreaterThan(0);
        expect(fx.empty.length, `${name}: valores vazios`).toBeGreaterThan(0);
      }
    }
  });
});

for (const name of EDGE_FUNCTION_NAMES) {
  const contract = CONTRACTS[name] as EdgeContract;
  const fx = fixturesFor(name)!;
  const now = new Date("2026-11-22T12:00:00Z");

  describe(`contrato ${name}`, () => {
    for (const v of fx.valid) {
      it(`aceita: ${v.nome}`, () => {
        const r = validateWithContract(contract, v.payload, { now });
        expect(r.ok, r.ok ? "" : JSON.stringify(r.error)).toBe(true);
        if (r.ok && v.esperado !== undefined) expect(r.data).toEqual(v.esperado);
      });
    }

    const categorias: Array<[string, InvalidCase[]]> = [
      ["campo ausente", fx.missing],
      ["tipo incorreto", fx.wrongType],
      ["valor vazio", fx.empty],
      ["corpo não é objeto", fx.notObject],
    ];

    for (const [categoria, casos] of categorias) {
      for (const c of casos) {
        it(`rejeita (${categoria}): ${c.nome} → 422 com field "${c.field}"`, async () => {
          const r = validateWithContract(contract, c.payload, { now, requestId: "req-test" });
          expect(r.ok, `payload deveria ser inválido: ${JSON.stringify(c.payload)}`).toBe(false);
          if (r.ok) return;
          const err = expectUnifiedValidationError(r.error);
          expect(err.requestId).toBe("req-test");
          const hit = err.fields.find((f) => f.field === c.field && (c.code === undefined || f.code === c.code));
          expect(hit, `esperava field=${c.field} code=${c.code ?? "*"}; recebido ${JSON.stringify(err.fields)}`).toBeDefined();
          // A Response HTTP correspondente é 422 JSON no mesmo formato.
          await expectValidationResponse(toResponse(err));
        });
      }
    }

    it("payloads inválidos de categorias diferentes produzem o MESMO formato (consistência)", () => {
      const todos = [...fx.missing, ...fx.wrongType, ...fx.empty, ...fx.notObject];
      const corpos = todos.map((c) => validateWithContract(contract, c.payload, { now })).filter((r) => !r.ok).map((r) => (r as { error: unknown }).error);
      for (const corpo of corpos) {
        const parsed = ValidationErrorSchema.safeParse(corpo);
        expect(parsed.success).toBe(true);
        expect(Object.keys(corpo as object).sort()).toEqual(["code", "error", "fields", "message"]);
      }
    });

    const resp = responsesFor(name);
    if (contract.response && resp) {
      for (const v of resp.valid) {
        it(`resposta 2xx documentada passa no schema: ${v.nome}`, () => {
          const r = contract.response!.safeParse(v.payload);
          expect(r.success, r.success ? "" : JSON.stringify(r.error.issues)).toBe(true);
        });
      }
      for (const i of resp.invalid) {
        it(`resposta fora do contrato é rejeitada: ${i.nome}`, () => {
          expect(contract.response!.safeParse(i.payload).success).toBe(false);
        });
      }
    }
  });
}
