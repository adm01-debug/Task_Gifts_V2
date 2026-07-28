import { describe, expect, it } from "vitest";
import {
  buildCardPackPush,
  CARD_PACK_URL,
  PUSH_MESSAGE_MAX,
  PUSH_TITLE_MAX,
  PUSH_TYPE_CARD_PACK,
} from "@/lib/cardPackNotifications";
import type { CardPackSource } from "@/lib/cardPackTriggers";

const SOURCES: CardPackSource[] = ["task", "training", "quest", "campaign", "manual", "streak"];

describe("notificação de pacote de cartas", () => {
  it("gera payload válido para toda origem e tamanho 1..20 (120 cenários)", () => {
    for (const source of SOURCES) {
      for (let size = 1; size <= 20; size += 1) {
        const p = buildCardPackPush({ id: `p-${source}-${size}`, userId: "u1", source, size });
        expect(p).not.toBeNull();
        expect(p!.type).toBe(PUSH_TYPE_CARD_PACK);
        expect(p!.url).toBe(CARD_PACK_URL);
        expect(p!.title.length).toBeLessThanOrEqual(PUSH_TITLE_MAX);
        expect(p!.message.length).toBeLessThanOrEqual(PUSH_MESSAGE_MAX);
        expect(p!.data.size).toBe(size);
        expect(p!.message).toContain(size === 1 ? "1 carta " : `${size} cartas`);
      }
    }
  });

  it("chave de dedupe é única por pacote (1000 cenários)", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      const p = buildCardPackPush({ id: `pack-${i}`, userId: `u${i % 7}`, source: "task", size: 3 });
      keys.add(p!.dedupeKey);
    }
    expect(keys.size).toBe(1000);
  });

  it("mesmo pacote sempre produz a mesma chave (determinismo)", () => {
    const a = buildCardPackPush({ id: "pack-x", userId: "u1", source: "streak", size: 4 });
    const b = buildCardPackPush({ id: "pack-x", userId: "u1", source: "streak", size: 4 });
    expect(a!.dedupeKey).toBe(b!.dedupeKey);
    expect(a!.message).toBe(b!.message);
  });

  it("normaliza tamanhos absurdos (fora de 1..20)", () => {
    for (const bad of [0, -5, 999, Number.NaN, 3.9]) {
      const p = buildCardPackPush({ id: "p1", userId: "u1", source: "task", size: bad });
      expect(p!.data.size).toBeGreaterThanOrEqual(1);
      expect(p!.data.size).toBeLessThanOrEqual(20);
    }
  });

  it("recusa linhas sem identificador ou com origem desconhecida", () => {
    expect(buildCardPackPush({ id: " ", userId: "u1", source: "task", size: 3 })).toBeNull();
    expect(buildCardPackPush({ id: "p1", userId: "", source: "task", size: 3 })).toBeNull();
    expect(
      buildCardPackPush({ id: "p1", userId: "u1", source: "hack" as CardPackSource, size: 3 }),
    ).toBeNull();
  });

  it("cada origem explica o motivo da recompensa", () => {
    for (const source of SOURCES) {
      const p = buildCardPackPush({ id: "p1", userId: "u1", source, size: 3 });
      expect(p!.message.length).toBeGreaterThan("Você recebeu um pacote com 3 cartas".length);
    }
  });
});
