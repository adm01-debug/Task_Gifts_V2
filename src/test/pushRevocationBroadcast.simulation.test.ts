import { describe, expect, it } from "vitest";
import { buildRevocationBroadcast } from "@/lib/pushDevices";

const IDS = ["11111111-1111-4111-8111-111111111111", " 22222222-2222-4222-8222-222222222222 ", "", "   "];
const LABELS = ["iPhone do João", "Notebook Trabalho", "", "   ", "Ω".repeat(5), 'Aspas "duplas"'];
const NOWS = [
  new Date("2026-01-01T00:00:00.000Z"),
  new Date("2026-07-26T13:45:12.000Z"),
  new Date("2031-02-28T23:59:59.000Z"),
];

describe("buildRevocationBroadcast — simulação combinatória", () => {
  it("cobre id × apelido × atual × relógio", () => {
    let assertions = 0;
    for (const id of IDS) {
      for (const label of LABELS) {
        for (const isCurrent of [true, false]) {
          for (const now of NOWS) {
            const b = buildRevocationBroadcast({ id, label, isCurrent }, now);
            if (!id.trim()) {
              expect(b).toBeNull();
              assertions += 1;
              continue;
            }
            expect(b).not.toBeNull();
            const x = b!;
            expect(x.type).toBe("security_device_revoked");
            expect(x.exclude_subscription_id).toBe(id.trim());
            expect(x.url).toBe("/security?tab=devices");
            expect(x.title.length).toBeGreaterThan(0);
            expect(x.message.length).toBeLessThanOrEqual(400);
            expect(x.data.revoked_at).toBe(now.toISOString());
            const expected = label.trim() || "Dispositivo desconhecido";
            expect(x.data.device_label).toBe(expected);
            expect(x.message).toContain(expected);
            // Nunca expõe endpoint nem URL absoluta no texto.
            expect(x.message).not.toMatch(/https?:\/\//);
            // Texto é sempre de terceira pessoa, inclusive quando foi o atual.
            expect(x.message).toContain("Se não foi você");
            assertions += 10;
          }
        }
      }
    }
    expect(assertions).toBeGreaterThan(400);
  });

  it("resiste a entradas inválidas", () => {
    expect(buildRevocationBroadcast(null)).toBeNull();
    expect(buildRevocationBroadcast(undefined)).toBeNull();
    // @ts-expect-error validação de runtime
    expect(buildRevocationBroadcast({ id: 7, label: "x", isCurrent: false })).toBeNull();
    const bad = buildRevocationBroadcast({ id: "abc", label: "PC", isCurrent: true }, new Date("nope"));
    expect(bad).not.toBeNull();
    expect(() => new Date(bad!.data.revoked_at).toISOString()).not.toThrow();
  });
});
