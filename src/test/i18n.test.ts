import { describe, it, expect } from "vitest";
import { translations, defaultLocale } from "@/i18n/translations";
import { localeDisplayNames, localeFlags } from "@/hooks/useI18n";

describe("i18n translations", () => {
  const locales = Object.keys(translations) as Array<keyof typeof translations>;

  it("expõe pt-BR como locale padrão", () => {
    expect(defaultLocale).toBe("pt-BR");
    expect(translations[defaultLocale]).toBeDefined();
  });

  it("cobre todos os locais suportados com nome e bandeira", () => {
    for (const loc of locales) {
      expect(localeDisplayNames[loc]).toBeTruthy();
      expect(localeFlags[loc]).toBeTruthy();
    }
  });

  it("mantém paridade das chaves top-level entre locais", () => {
    const base = Object.keys(translations[defaultLocale]).sort();
    for (const loc of locales) {
      expect(Object.keys(translations[loc]).sort()).toEqual(base);
    }
  });

  it("garante paridade profunda para common/auth", () => {
    const sections = ["common", "auth"] as const;
    for (const section of sections) {
      const baseKeys = Object.keys((translations[defaultLocale] as any)[section]).sort();
      for (const loc of locales) {
        expect(Object.keys((translations[loc] as any)[section]).sort()).toEqual(baseKeys);
      }
    }
  });
});