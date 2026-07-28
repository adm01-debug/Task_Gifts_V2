import { describe, expect, it } from "vitest";
import {
  clampStake,
  maxAllowedStake,
  parseDailyWager,
  parseWagerOptions,
  previewWager,
  stakePresets,
  wagerReasonMessage,
  type DailyWagerQuestion,
} from "@/lib/dailyWager";

const baseQuestion = (over: Partial<DailyWagerQuestion> = {}): DailyWagerQuestion => ({
  id: "q1",
  question: "Qual o prazo padrão de resposta ao cliente?",
  options: [
    { id: "a", label: "2 horas" },
    { id: "b", label: "24 horas" },
  ],
  difficulty: "medium",
  multiplier: 2,
  maxStake: 100,
  scheduledDate: "2026-07-28",
  correctOption: null,
  explanation: null,
  ...over,
});

describe("parseWagerOptions", () => {
  it("descarta itens inválidos, vazios e duplicados", () => {
    expect(
      parseWagerOptions([
        { id: "a", label: "A" },
        { id: "a", label: "A duplicada" },
        { id: "", label: "sem id" },
        null,
        "texto",
        { id: "b" },
      ]),
    ).toEqual([
      { id: "a", label: "A" },
      { id: "b", label: "b" },
    ]);
  });

  it("retorna vazio para payload não-array", () => {
    expect(parseWagerOptions(null)).toEqual([]);
    expect(parseWagerOptions({})).toEqual([]);
  });
});

describe("parseDailyWager", () => {
  it("trata payload nulo, string ou array", () => {
    for (const raw of [null, undefined, "erro", []]) {
      const state = parseDailyWager(raw);
      expect(state.question).toBeNull();
      expect(state.balance).toBe(0);
    }
  });

  it("preserva o saldo mesmo sem pergunta do dia", () => {
    expect(parseDailyWager({ success: true, question: null, balance: 320 })).toEqual({
      question: null,
      entry: null,
      balance: 320,
    });
  });

  it("invalida pergunta com menos de duas alternativas", () => {
    const state = parseDailyWager({
      balance: 10,
      question: { id: "q1", question: "P?", options: [{ id: "a", label: "A" }] },
    });
    expect(state.question).toBeNull();
    expect(state.balance).toBe(10);
  });

  it("normaliza dificuldade desconhecida, multiplicador e teto absurdos", () => {
    const state = parseDailyWager({
      balance: "150",
      question: {
        id: "q1",
        question: " Pergunta ",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        difficulty: "impossivel",
        multiplier: 99,
        max_stake: 999999,
      },
    });
    expect(state.question?.difficulty).toBe("medium");
    expect(state.question?.multiplier).toBe(5);
    expect(state.question?.maxStake).toBe(1000);
    expect(state.question?.question).toBe("Pergunta");
    expect(state.balance).toBe(150);
  });

  it("aplica fallbacks quando o multiplicador chega NaN/Infinity", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, "abc"]) {
      const state = parseDailyWager({
        question: {
          id: "q",
          question: "P",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
          multiplier: bad,
        },
      });
      expect(Number.isFinite(state.question?.multiplier ?? Number.NaN)).toBe(true);
    }
  });

  it("lê a aposta já registrada e revela gabarito", () => {
    const state = parseDailyWager({
      balance: 90,
      question: {
        id: "q1",
        question: "P",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        correct_option: "b",
        explanation: "Porque sim",
      },
      entry: {
        id: "e1",
        stake_coins: 40,
        chosen_option: "b",
        is_correct: true,
        multiplier: 2,
        coins_delta: 40,
        xp_awarded: 40,
        created_at: "2026-07-28T10:00:00Z",
      },
    });
    expect(state.entry?.isCorrect).toBe(true);
    expect(state.entry?.coinsDelta).toBe(40);
    expect(state.question?.correctOption).toBe("b");
  });

  it("ignora aposta corrompida (sem id ou alternativa)", () => {
    const state = parseDailyWager({
      question: {
        id: "q1",
        question: "P",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
      },
      entry: { stake_coins: 10 },
    });
    expect(state.entry).toBeNull();
  });
});

describe("limites de aposta", () => {
  it("cruza teto da pergunta com o saldo", () => {
    expect(maxAllowedStake(baseQuestion(), 40)).toBe(40);
    expect(maxAllowedStake(baseQuestion(), 5000)).toBe(100);
    expect(maxAllowedStake(null, 500)).toBe(0);
    expect(maxAllowedStake(baseQuestion(), -10)).toBe(0);
  });

  it("clampa valores fora da faixa e entradas inválidas", () => {
    expect(clampStake(0, baseQuestion(), 100)).toBe(1);
    expect(clampStake(-50, baseQuestion(), 100)).toBe(1);
    expect(clampStake(9999, baseQuestion(), 100)).toBe(100);
    expect(clampStake(Number.NaN, baseQuestion(), 100)).toBe(1);
    expect(clampStake(33.9, baseQuestion(), 100)).toBe(33);
    expect(clampStake(10, baseQuestion(), 0)).toBe(0);
  });

  it("gera presets únicos e crescentes", () => {
    expect(stakePresets(baseQuestion(), 100)).toEqual([25, 50, 100]);
    expect(stakePresets(baseQuestion(), 1)).toEqual([1]);
    expect(stakePresets(baseQuestion(), 0)).toEqual([]);
  });
});

describe("previewWager", () => {
  it("espelha FLOOR(stake * (multiplicador - 1)) do servidor", () => {
    const q = baseQuestion({ multiplier: 1.5 });
    expect(previewWager(33, q, 100).gain).toBe(16);
    expect(previewWager(100, baseQuestion({ multiplier: 3 }), 500).gain).toBe(200);
  });

  it("nunca deixa o saldo projetado negativo", () => {
    const preview = previewWager(100, baseQuestion(), 100);
    expect(preview.balanceIfWrong).toBe(0);
    expect(preview.balanceIfCorrect).toBe(200);
  });

  it("zera tudo sem pergunta ou sem saldo", () => {
    expect(previewWager(50, null, 100)).toMatchObject({ stake: 0, gain: 0, loss: 0 });
    expect(previewWager(50, baseQuestion(), 0)).toMatchObject({ stake: 0, gain: 0 });
  });
});

describe("wagerReasonMessage", () => {
  it("traduz motivos conhecidos e usa fallback", () => {
    expect(wagerReasonMessage("insufficient_coins")).toContain("insuficiente");
    expect(wagerReasonMessage("already_answered")).toContain("já apostou");
    expect(wagerReasonMessage("motivo_desconhecido")).toContain("Não foi possível");
    expect(wagerReasonMessage(null)).toContain("Não foi possível");
  });
});