import { describe, it, expect } from "vitest";
import {
  type ChannelMap,
  type NotificationChannel,
  NOTIFICATION_CHANNELS,
  mergeChannelPreference,
  mergeManyChannelPreferences,
  normalizeTypePrefs,
  resolveChannels,
} from "@/lib/notificationTypePrefs";

/**
 * Simulacao cruzada entre modulos.
 *
 * Por que: `notification_preferences.type_preferences` e um unico JSONB
 * compartilhado por tres telas distintas (jogos, campanhas comerciais e
 * relatorio executivo). Cada tela le o documento inteiro, altera uma celula
 * e regrava tudo. Se o merge nao for aditivo, a ultima escrita apaga as
 * preferencias das outras telas.
 *
 * Estas simulacoes exercitam centenas de sequencias de escrita pseudo-aleatorias
 * (deterministicas via LCG) e provam tres invariantes:
 *  1. Nenhum tipo de outro modulo desaparece do documento.
 *  2. Nenhum canal nao tocado muda de valor.
 *  3. O estado final independe de quantas vezes a mesma escrita e repetida.
 */

interface ModuleSpec {
  name: string;
  types: readonly string[];
  defaults: ChannelMap;
  priority?: string;
}

const MODULES: readonly ModuleSpec[] = [
  {
    name: "games",
    types: ["card_pack", "card_set_reward", "auction", "prediction_market", "lucky_wheel", "tournament"],
    defaults: { in_app: true, push: true, email: false },
  },
  {
    name: "campaigns",
    types: ["campaign_milestone", "campaign_ranking", "campaign_result_import"],
    defaults: { in_app: true, push: true, email: true },
  },
  {
    name: "executive",
    types: ["executive_report"],
    defaults: { in_app: true, push: false, email: true },
    priority: "high",
  },
];

const ALL_TYPES = MODULES.flatMap((m) => m.types);
const moduleOf = (type: string): ModuleSpec =>
  MODULES.find((m) => m.types.includes(type)) as ModuleSpec;
const defaultsOf = (type: string): ChannelMap => moduleOf(type).defaults;

/** LCG deterministico — testes precisam ser reproduziveis em CI. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

interface Write {
  type: string;
  channel: NotificationChannel;
  value: boolean;
}

/** Uma tela grava uma celula sobre o documento lido do banco. */
function applyWrite(doc: unknown, write: Write) {
  const spec = moduleOf(write.type);
  return mergeChannelPreference(
    doc,
    write.type,
    write.channel,
    write.value,
    spec.defaults,
    spec.priority,
  );
}

/** Estado esperado, calculado de forma independente do motor. */
function expectedFrom(writes: readonly Write[]) {
  const state = new Map<string, ChannelMap>();
  for (const w of writes) {
    const current = state.get(w.type) ?? { ...defaultsOf(w.type) };
    state.set(w.type, { ...current, [w.channel]: w.value });
  }
  return state;
}

describe("preferencias compartilhadas entre modulos", () => {
  it("nao perde tipos de outros modulos em 400 sequencias aleatorias", () => {
    for (let seed = 1; seed <= 400; seed++) {
      const rand = makeRandom(seed);
      const writes: Write[] = [];
      const steps = 3 + Math.floor(rand() * 18);
      let doc: unknown = {};

      for (let i = 0; i < steps; i++) {
        const write: Write = {
          type: ALL_TYPES[Math.floor(rand() * ALL_TYPES.length)],
          channel: NOTIFICATION_CHANNELS[Math.floor(rand() * NOTIFICATION_CHANNELS.length)],
          value: rand() > 0.5,
        };
        writes.push(write);
        doc = applyWrite(doc, write);
      }

      const final = normalizeTypePrefs(doc);
      const expected = expectedFrom(writes);

      // 1. todo tipo tocado continua presente
      for (const [type, channels] of expected) {
        expect(Object.keys(final)).toContain(type);
        const resolved = resolveChannels(final, type, defaultsOf(type));
        expect(resolved).toEqual(channels);
      }
      // 2. nenhum tipo fantasma foi criado
      expect(Object.keys(final).sort()).toEqual([...expected.keys()].sort());
    }
  });

  it("preserva a prioridade do modulo executivo apos escritas de outros modulos", () => {
    let doc: unknown = applyWrite({}, { type: "executive_report", channel: "email", value: false });
    expect(normalizeTypePrefs(doc).executive_report.priority).toBe("high");

    for (const type of MODULES[0].types) {
      doc = applyWrite(doc, { type, channel: "push", value: false });
    }
    const final = normalizeTypePrefs(doc);
    expect(final.executive_report.priority).toBe("high");
    expect(final.executive_report.email).toBe(false);
    expect(final.executive_report.push).toBe(false); // default do modulo, nunca push
  });

  it("silenciar push em lote nos jogos nao altera campanhas nem executivo", () => {
    let doc: unknown = {};
    doc = applyWrite(doc, { type: "campaign_milestone", channel: "push", value: true });
    doc = applyWrite(doc, { type: "executive_report", channel: "in_app", value: true });

    const before = normalizeTypePrefs(doc);
    const after = normalizeTypePrefs(
      mergeManyChannelPreferences(doc, MODULES[0].types, "push", false, defaultsOf),
    );

    expect(after.campaign_milestone).toEqual(before.campaign_milestone);
    expect(after.executive_report).toEqual(before.executive_report);
    for (const type of MODULES[0].types) expect(after[type].push).toBe(false);
  });

  it("e idempotente sob reenvio da mesma escrita (retry de rede)", () => {
    const rand = makeRandom(99);
    for (let seed = 0; seed < 120; seed++) {
      const type = ALL_TYPES[Math.floor(rand() * ALL_TYPES.length)];
      const channel = NOTIFICATION_CHANNELS[Math.floor(rand() * NOTIFICATION_CHANNELS.length)];
      const value = rand() > 0.5;
      const once = applyWrite({ campaign_ranking: { email: false } }, { type, channel, value });
      const twice = applyWrite(once, { type, channel, value });
      const thrice = applyWrite(twice, { type, channel, value });
      expect(thrice).toEqual(once);
      // A celula pre-existente so muda se for exatamente a celula reescrita.
      const touchesCell = type === "campaign_ranking" && channel === "email";
      expect(normalizeTypePrefs(thrice).campaign_ranking.email).toBe(
        touchesCell ? value : false,
      );
    }
  });

  it("sobrevive a documentos corrompidos vindos do banco", () => {
    const corrupted = [
      { card_pack: "sim" },
      { auction: ["push"] },
      { executive_report: { email: 1, priority: 42 } },
      { "": { push: true } },
      null,
      "{}",
    ];
    for (const raw of corrupted) {
      const doc = applyWrite(raw, { type: "campaign_ranking", channel: "in_app", value: false });
      const final = normalizeTypePrefs(doc);
      expect(final.campaign_ranking.in_app).toBe(false);
      expect(final.campaign_ranking.push).toBe(true);
      expect(final.campaign_ranking.email).toBe(true);
    }
  });
});
