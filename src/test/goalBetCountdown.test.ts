import { describe, expect, it } from "vitest";
import { computeGoalBetCountdown } from "@/lib/goalBetCountdown";

const NOW = new Date("2030-01-01T00:00:00Z");
const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();

describe("computeGoalBetCountdown", () => {
  it("ignora mercados que não estão abertos", () => {
    for (const status of ["draft", "locked", "settled", "voided"]) {
      const r = computeGoalBetCountdown({ status, locks_at: at(60_000) }, NOW);
      expect(r.urgency).toBe("none");
      expect(r.label).toBe("");
    }
  });

  it("marca como fechado quando o prazo já passou", () => {
    const r = computeGoalBetCountdown({ status: "open", locks_at: at(-1) }, NOW);
    expect(r.urgency).toBe("closed");
    expect(r.msLeft).toBe(0);
    expect(r.label).toBe("Fechado");
  });

  it("classifica urgência por faixas", () => {
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(30 * 60_000) }, NOW).urgency,
    ).toBe("urgent");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(5 * 3_600_000) }, NOW).urgency,
    ).toBe("soon");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(3 * 86_400_000) }, NOW).urgency,
    ).toBe("calm");
  });

  it("formata dias, horas e minutos", () => {
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(2 * 86_400_000 + 3 * 3_600_000) }, NOW)
        .label,
    ).toBe("2d 3h");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(2 * 86_400_000) }, NOW).label,
    ).toBe("2d");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(3_600_000 + 15 * 60_000) }, NOW).label,
    ).toBe("1h 15min");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(3_600_000) }, NOW).label,
    ).toBe("1h");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(45 * 60_000) }, NOW).label,
    ).toBe("45min");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: at(20_000) }, NOW).label,
    ).toBe("<1min");
  });

  it("tolera datas inválidas ou mercado ausente", () => {
    expect(computeGoalBetCountdown(null, NOW).urgency).toBe("none");
    expect(
      computeGoalBetCountdown({ status: "open", locks_at: "data-invalida" }, NOW).urgency,
    ).toBe("none");
  });

  it("gera texto acessível coerente", () => {
    const urgente = computeGoalBetCountdown({ status: "open", locks_at: at(10 * 60_000) }, NOW);
    expect(urgente.srLabel).toMatch(/Últimos 10min/);
    const calmo = computeGoalBetCountdown({ status: "open", locks_at: at(4 * 86_400_000) }, NOW);
    expect(calmo.srLabel).toBe("Fecha em 4d.");
  });
});