import { describe, expect, it } from "vitest";
import { emailSchema, passwordSchema, questTitleSchema, validateData, getFirstError } from "@/lib/validations";
import { parseCampaignResultFile } from "@/lib/campaignImport";

describe("migração de validação preserva mensagens e resultados", () => {
  it.each([[emailSchema, "Email é obrigatório"], [passwordSchema, "Senha é obrigatória"], [questTitleSchema, "Título é obrigatório"]] as const)("mantém mensagem obrigatória em entrada ausente", (schema, message) => {
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(message);
  });
  it("validateData retorna mensagens Zod 4 sem lançar exceção", () => {
    expect(validateData(passwordSchema, "12")).toEqual({ success: false, errors: ["Senha deve ter pelo menos 6 caracteres"] });
    expect(getFirstError(passwordSchema, "12")).toBe("Senha deve ter pelo menos 6 caracteres");
    expect(validateData(emailSchema, "USER@EXAMPLE.TEST")).toEqual({ success: true, data: "user@example.test" });
  });
  it("XLSX preserva fórmulas/rich text e rejeita erros/booleanos como crédito", async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Resultados");
    sheet.addRow(["email", "valor", "data"]);
    sheet.addRow([{ richText: [{ text: "user" }, { text: "@example.test" }] }, { formula: "50+50", result: 100 }, new Date(2026, 0, 1)]);
    sheet.addRow([{ text: "other@example.test", hyperlink: "https://example.test" }, { error: "#DIV/0!" }, null]);
    sheet.addRow(["bool@example.test", true, null]);
    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer);
    const file = new File([], "resultados.xlsx");
    Object.defineProperty(file, "arrayBuffer", { value: async () => bytes.buffer });
    const result = await parseCampaignResultFile(file);
    expect(result.totalAmount).toBe(100);
    expect(result.validRows).toBe(1);
    expect(result.errorRows).toBe(2);
    expect(result.rows[0].sellerIdentifier).toBe("user@example.test");
  });
});
