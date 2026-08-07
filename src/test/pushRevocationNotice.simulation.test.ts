import { describe, expect, it } from "vitest";
import { buildRevocationNotice } from "@/lib/pushDevices";

const LABELS = [
  "iPhone do João",
  "Notebook Trabalho",
  "  ",
  "",
  "Android",
  "Chrome em Windows",
  "Ω".repeat(3),
];
const IDS = ["a1", " b2 ", "", "   ", "sub-3"];
const NOWS = [
  new Date("2026-01-01T00:00:00.000Z"),
  new Date("2026-07-26T13:45:12.000Z"),
  new Date("2030-12-31T23:59:59.000Z"),
];

describe("buildRevocationNotice — simulação combinatória", () => {
  it("cobre todas as combinações id × apelido × atual × relógio", () => {
    let assertions = 0;
    for (const id of IDS) {
      for (const label of LABELS) {
        for (const isCurrent of [true, false]) {
          for (const now of NOWS) {
            const notice = buildRevocationNotice({ id, label, isCurrent }, now);
            if (!id.trim()) {
              expect(notice).toBeNull();
              assertions += 1;
              continue;
            }
            expect(notice).not.toBeNull();
            const n = notice!;
            expect(n.type).toBe("security_device_revoked");
            expect(n.title.length).toBeGreaterThan(0);
            expect(n.data.subscription_id).toBe(id.trim());
            expect(n.data.was_current).toBe(isCurrent);
            expect(n.data.revoked_at).toBe(now.toISOString());
            expect(n.data.device_label).toBe(label.trim() || "Dispositivo desconhecido");
            expect(n.message).toContain(n.data.device_label);
            // Nunca deve vazar endpoint/URL no texto.
            expect(n.message).not.toMatch(/https?:\/\//);
            expect(n.message.includes("troque sua senha")).toBe(!isCurrent);
            assertions += 9;
          }
        }
      }
    }
    expect(assertions).toBeGreaterThan(600);
  });

  it("é resiliente a entradas inválidas", () => {
    expect(buildRevocationNotice(null)).toBeNull();
    expect(buildRevocationNotice(undefined)).toBeNull();
    // @ts-expect-error validação de runtime
    expect(buildRevocationNotice({ id: 42, label: "x", isCurrent: false })).toBeNull();
    const bad = buildRevocationNotice({ id: "x", label: "PC", isCurrent: false }, new Date("nope"));
    expect(bad).not.toBeNull();
    expect(() => new Date(bad!.data.revoked_at).toISOString()).not.toThrow();
  });
});
