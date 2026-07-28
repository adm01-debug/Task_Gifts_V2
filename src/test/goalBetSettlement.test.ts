import { describe, expect, it } from "vitest";
import { NO_WINNER_LABEL, type GoalBetCandidate } from "@/lib/goalBetting";
import {
  extractGoalBetCampaignName,
  resolveGoalBetOutcome,
} from "@/lib/goalBetSettlement";

function candidate(over: Partial<GoalBetCandidate> = {}): GoalBetCandidate {
  return {
    userId: over.userId ?? "u1",
    name: over.name ?? "Ana",
    progress: over.progress ?? 50,
    target: over.target ?? 100,
    progressPercent: over.progressPercent ?? 50,
    declined: over.declined,
  };
}

const OPTIONS = [
  { id: "o-ana", label: "Ana" },
  { id: "o-bia", label: "Bia" },
  { id: "o-none", label: NO_WINNER_LABEL },
];

describe("goalBetSettlement", () => {
  it("S1: sem ninguém batendo a meta, vence a opção “ninguém”", () => {
    const out = resolveGoalBetOutcome({
      options: OPTIONS,
      candidates: [candidate({ progressPercent: 80 }), candidate({ userId: "u2", name: "Bia", progressPercent: 99 })],
    });
    expect(out.kind).toBe("no_winner_option");
    expect(out.optionId).toBe("o-none");
    expect(out.autoApplicable).toBe(true);
  });

  it("S1b: sem opção “ninguém”, sugere reembolso", () => {
    const out = resolveGoalBetOutcome({
      options: OPTIONS.slice(0, 2),
      candidates: [candidate({ progressPercent: 10 })],
    });
    expect(out.kind).toBe("refund");
    expect(out.optionId).toBeNull();
  });

  it("aponta o líder que bateu a meta", () => {
    const out = resolveGoalBetOutcome({
      options: OPTIONS,
      candidates: [
        candidate({ userId: "u1", name: "Ana", progressPercent: 120, progress: 120 }),
        candidate({ userId: "u2", name: "Bia", progressPercent: 105, progress: 105 }),
      ],
    });
    expect(out.kind).toBe("winner");
    expect(out.optionId).toBe("o-ana");
    expect(out.achievers).toHaveLength(2);
  });

  it("S2: empate técnico nunca é aplicado automaticamente", () => {
    const out = resolveGoalBetOutcome({
      options: OPTIONS,
      candidates: [
        candidate({ userId: "u1", name: "Ana", progressPercent: 110, progress: 110 }),
        candidate({ userId: "u2", name: "Bia", progressPercent: 110, progress: 110 }),
      ],
    });
    expect(out.kind).toBe("tie");
    expect(out.autoApplicable).toBe(false);
    expect(out.optionId).toBeNull();
  });

  it("S3: vencedor fora das opções não vira outra opção", () => {
    const out = resolveGoalBetOutcome({
      options: OPTIONS,
      candidates: [candidate({ userId: "u3", name: "Carlos", progressPercent: 130, progress: 130 })],
    });
    expect(out.kind).toBe("unmatched_winner");
    expect(out.optionId).toBeNull();
  });

  it("recusa rótulos ambíguos de homônimos", () => {
    const out = resolveGoalBetOutcome({
      options: [
        { id: "a1", label: "Ana Silva" },
        { id: "a2", label: "Ana Silva (2)" },
      ],
      candidates: [candidate({ name: "Ana Silva", progressPercent: 140, progress: 140 })],
    });
    expect(out.kind).toBe("ambiguous_label");
    expect(out.autoApplicable).toBe(false);
  });

  it("ignora quem recusou a meta", () => {
    const out = resolveGoalBetOutcome({
      options: OPTIONS,
      candidates: [candidate({ progressPercent: 150, declined: true })],
    });
    expect(out.kind).toBe("no_winner_option");
  });

  it("S4: é determinístico para a mesma entrada", () => {
    const input = {
      options: OPTIONS,
      candidates: [
        candidate({ userId: "u1", name: "Ana", progressPercent: 101, progress: 101 }),
        candidate({ userId: "u2", name: "Bia", progressPercent: 101, progress: 90 }),
      ],
    };
    expect(resolveGoalBetOutcome(input)).toEqual(resolveGoalBetOutcome(input));
    expect(resolveGoalBetOutcome(input).optionId).toBe("o-ana");
  });

  it("extrai o nome da campanha apenas de títulos de aposta de meta", () => {
    expect(extractGoalBetCampaignName('Quem bate a meta da campanha "Verão"?')).toBe("Verão");
    expect(extractGoalBetCampaignName("Quem vence o duelo?")).toBeNull();
  });
});