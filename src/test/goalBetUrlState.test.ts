import { describe, expect, it } from "vitest";
import {
  GOAL_BET_QUERY_MAX_LENGTH,
  readGoalBetUrlState,
  sanitizeGoalBetQuery,
  writeGoalBetUrlState,
} from "@/lib/goalBetUrlState";

describe("sanitizeGoalBetQuery", () => {
  it("apara e colapsa espaços", () => {
    expect(sanitizeGoalBetQuery("  meta   vendas ")).toBe("meta vendas");
  });

  it("trunca consultas patológicas", () => {
    const long = "a".repeat(500);
    expect(sanitizeGoalBetQuery(long)).toHaveLength(GOAL_BET_QUERY_MAX_LENGTH);
  });

  it("tolera valores nulos", () => {
    expect(sanitizeGoalBetQuery(null)).toBe("");
    expect(sanitizeGoalBetQuery(undefined)).toBe("");
  });
});

describe("readGoalBetUrlState", () => {
  it("lê filtro e busca válidos", () => {
    expect(readGoalBetUrlState("f=open&q=meta")).toEqual({
      filter: "open",
      query: "meta",
    });
  });

  it("descarta filtro inválido", () => {
    expect(readGoalBetUrlState("f=hacked").filter).toBeNull();
  });

  it("aceita URLSearchParams e ausência de parâmetros", () => {
    expect(readGoalBetUrlState(new URLSearchParams())).toEqual({
      filter: null,
      query: "",
    });
    expect(readGoalBetUrlState(null)).toEqual({ filter: null, query: "" });
  });
});

describe("writeGoalBetUrlState", () => {
  it("omite o filtro padrão e a busca vazia", () => {
    const params = writeGoalBetUrlState("f=open&q=meta", {
      filter: "all",
      query: "   ",
    });
    expect(params.toString()).toBe("");
  });

  it("grava filtro e busca sanitizada", () => {
    const params = writeGoalBetUrlState("", {
      filter: "mine",
      query: "  Meta  Vendas ",
    });
    expect(params.get("f")).toBe("mine");
    expect(params.get("q")).toBe("Meta Vendas");
  });

  it("preserva parâmetros de terceiros e não muta a origem", () => {
    const origin = new URLSearchParams("utm=abc&f=open");
    const params = writeGoalBetUrlState(origin, { filter: "all", query: "x" });
    expect(params.get("utm")).toBe("abc");
    expect(params.get("f")).toBeNull();
    expect(origin.get("f")).toBe("open");
  });
});
