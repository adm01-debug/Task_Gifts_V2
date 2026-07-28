import { describe, it, expect } from "vitest";
import {
  NOTIFICATION_CHANNELS,
  type ChannelMap,
  type NotificationChannel,
  mergeChannelPreference,
  mergeManyChannelPreferences,
  normalizeTypePrefs,
  resolveChannels,
} from "@/lib/notificationTypePrefs";

const DEF: ChannelMap = { in_app: true, push: true, email: false };
const TYPES = ["card_pack", "card_set_reward", "auction", "prediction_market", "lucky_wheel", "tournament"];

describe("normalizeTypePrefs", () => {
  it("trata entradas invalidas como objeto vazio", () => {
    for (const raw of [null, undefined, 0, "", "x", [], [1, 2], true, NaN]) {
      expect(normalizeTypePrefs(raw)).toEqual({});
    }
  });

  it("descarta canais nao booleanos e prioridade vazia", () => {
    const out = normalizeTypePrefs({
      card_pack: { push: "false", in_app: true, email: null, priority: "  " },
    });
    expect(out.card_pack).toEqual({ in_app: true });
  });

  it("preserva prioridade valida", () => {
    expect(normalizeTypePrefs({ a: { priority: "high" } }).a.priority).toBe("high");
  });

  it("e idempotente", () => {
    const raw = { a: { push: false, priority: "high" }, b: { email: true } };
    const once = normalizeTypePrefs(raw);
    expect(normalizeTypePrefs(once)).toEqual(once);
  });
});

describe("resolveChannels", () => {
  it("cai nos defaults quando o tipo nao existe", () => {
    expect(resolveChannels({}, "card_pack", DEF)).toEqual(DEF);
  });

  it("aplica overrides parciais sem perder os demais canais", () => {
    const out = resolveChannels({ card_pack: { push: false } }, "card_pack", DEF);
    expect(out).toEqual({ in_app: true, push: false, email: false });
  });
});

describe("mergeChannelPreference - matriz exaustiva", () => {
  it("cobre todas as combinacoes tipo x canal x valor x estado inicial", () => {
    const initials: unknown[] = [
      {},
      null,
      { card_pack: { push: false } },
      { outro_modulo: { in_app: false, priority: "high" } },
      { card_pack: { in_app: false, push: false, email: true, priority: "high" } },
    ];
    let count = 0;
    for (const type of TYPES) {
      for (const channel of NOTIFICATION_CHANNELS) {
        for (const value of [true, false]) {
          for (const initial of initials) {
            const next = mergeChannelPreference(initial, type, channel, value, DEF);
            count++;
            // 1. a celula alvo reflete o valor pedido
            expect(next[type][channel as NotificationChannel]).toBe(value);
            // 2. todos os canais ficam booleanos explicitos
            for (const c of NOTIFICATION_CHANNELS) {
              expect(typeof next[type][c]).toBe("boolean");
            }
            // 3. outros modulos preservados
            const base = normalizeTypePrefs(initial);
            for (const key of Object.keys(base)) {
              if (key === type) continue;
              expect(next[key]).toEqual(base[key]);
            }
            // 4. canais nao tocados do mesmo tipo preservam o valor anterior resolvido
            const before = resolveChannels(base, type, DEF);
            for (const c of NOTIFICATION_CHANNELS) {
              if (c === channel) continue;
              expect(next[type][c]).toBe(before[c]);
            }
            // 5. prioridade previa nunca e perdida
            if (base[type]?.priority) expect(next[type].priority).toBe(base[type].priority);
            // 6. idempotencia
            expect(mergeChannelPreference(next, type, channel, value, DEF)).toEqual(next);
          }
        }
      }
    }
    expect(count).toBe(TYPES.length * 3 * 2 * initials.length);
    expect(count).toBeGreaterThanOrEqual(180);
  });

  it("nao grava prioridade quando nao ha previa nem sugestao", () => {
    const out = mergeChannelPreference({}, "card_pack", "push", false, DEF);
    expect(out.card_pack.priority).toBeUndefined();
  });

  it("aplica prioridade sugerida apenas na ausencia de previa", () => {
    expect(mergeChannelPreference({}, "a", "push", true, DEF, "high").a.priority).toBe("high");
    expect(
      mergeChannelPreference({ a: { priority: "low" } }, "a", "push", true, DEF, "high").a.priority,
    ).toBe("low");
  });

  it("sobrevive a sequencias aleatorias longas mantendo invariantes", () => {
    let state: unknown = {};
    const expected: Record<string, ChannelMap> = {};
    for (const t of TYPES) expected[t] = { ...DEF };
    for (let i = 0; i < 400; i++) {
      const type = TYPES[i % TYPES.length];
      const channel = NOTIFICATION_CHANNELS[i % 3];
      const value = (i * 7) % 3 !== 0;
      state = mergeChannelPreference(state, type, channel, value, DEF);
      expected[type][channel] = value;
      for (const t of TYPES) {
        const resolved = resolveChannels(normalizeTypePrefs(state), t, DEF);
        expect(resolved).toEqual(expected[t]);
      }
    }
  });
});

describe("mergeManyChannelPreferences", () => {
  it("liga e desliga push em lote sem tocar outros canais", () => {
    for (const value of [true, false]) {
      const start = { card_pack: { in_app: false, email: true }, externo: { push: false } };
      const next = mergeManyChannelPreferences(start, TYPES, "push", value, () => DEF);
      for (const t of TYPES) expect(next[t].push).toBe(value);
      expect(next.card_pack.in_app).toBe(false);
      expect(next.card_pack.email).toBe(true);
      expect(next.externo).toEqual({ push: false });
    }
  });

  it("e idempotente em lote", () => {
    const once = mergeManyChannelPreferences({}, TYPES, "push", false, () => DEF);
    expect(mergeManyChannelPreferences(once, TYPES, "push", false, () => DEF)).toEqual(once);
  });

  it("aceita lista vazia", () => {
    expect(mergeManyChannelPreferences({ a: { push: true } }, [], "push", false, () => DEF)).toEqual({
      a: { push: true },
    });
  });
});
