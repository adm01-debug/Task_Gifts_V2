import { describe, expect, it } from "vitest";
import { buildCertificateFileName, buildVerificationUrl } from "@/lib/certificatePdf";

const CODE_RE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/;
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Reproduz o gerador do banco para validar propriedades do formato. */
function fakeCode(seed: number): string {
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += ALPHABET[(seed * (i + 7) + i * 13) % ALPHABET.length];
  }
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}

describe("certificados verificáveis — simulação", () => {
  it("gera códigos sempre no formato público esperado (500 cenários)", () => {
    for (let seed = 1; seed <= 500; seed++) {
      expect(fakeCode(seed)).toMatch(CODE_RE);
    }
  });

  it("nunca usa caracteres ambíguos (0, O, 1, I)", () => {
    for (const ambiguous of ["0", "O", "1", "I"]) {
      expect(ALPHABET).not.toContain(ambiguous);
    }
  });

  it("monta URL de verificação absoluta e sem barras duplicadas", () => {
    const bases = ["https://app.exemplo.com", "https://app.exemplo.com/", "https://a.com//"];
    for (const base of bases) {
      const url = buildVerificationUrl("ABCD-EFGH-JKLM", base);
      expect(url.startsWith("https://")).toBe(true);
      expect(url.endsWith("/verificar/ABCD-EFGH-JKLM")).toBe(true);
      expect(url.split("://")[1]).not.toContain("//");
    }
  });

  it("escapa códigos hostis na URL", () => {
    const url = buildVerificationUrl("../../admin?x=1", "https://a.com");
    expect(url).not.toContain("../");
    expect(url).not.toContain("?x=1");
  });

  it("produz nomes de arquivo seguros para títulos arbitrários (300 cenários)", () => {
    const titles = [
      "Segurança do Trabalho — NR-1",
      "Ação/Reação: 100% <script>",
      "   ",
      "Ünïcödé ✅ Trilha",
      "A".repeat(200),
    ];
    for (let i = 0; i < 300; i++) {
      const title = titles[i % titles.length] + (i % 7 === 0 ? " #" + i : "");
      const name = buildCertificateFileName({ certificationName: title, certificateCode: fakeCode(i + 1) });
      expect(name.endsWith(".pdf")).toBe(true);
      expect(name).toMatch(/^certificado-[a-z0-9-]+-[A-Z0-9-]+\.pdf$/);
      expect(name).not.toMatch(/[\\/:*?"<>|\s]/);
      expect(name.length).toBeLessThan(120);
    }
  });
});
