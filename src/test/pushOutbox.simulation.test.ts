import { describe, it, expect } from "vitest";
import {
  applyDispatch,
  claimBatch,
  deferForQuietHours,
  isTerminal,
  MAX_PUSH_ATTEMPTS,
  quietHoursUntil,
  releaseDeferred,
  type DispatchResult,
  type OutboxItem,
  type QuietHoursPreference,
} from "@/lib/pushOutbox";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const fresh = (id: string): OutboxItem => ({ id, status: "pending", attempts: 0, lastError: null });

describe("fila de push — máquina de estados", () => {
  it("entrega no primeiro sucesso", () => {
    const out = applyDispatch({ ...fresh("a"), status: "processing" }, { kind: "delivered" });
    expect(out.status).toBe("sent");
    expect(out.attempts).toBe(1);
  });

  it("erro permanente não consome retries extras", () => {
    const out = applyDispatch({ ...fresh("a"), status: "processing" }, {
      kind: "permanent_error",
      error: "401",
    });
    expect(out.status).toBe("failed");
    expect(out.attempts).toBe(1);
  });

  it("erro transitório volta para a fila até esgotar tentativas", () => {
    let item: OutboxItem = { ...fresh("a"), status: "processing" };
    for (let i = 1; i <= MAX_PUSH_ATTEMPTS; i++) {
      item = applyDispatch({ ...item, status: "processing" }, { kind: "transient_error", error: "503" });
      expect(item.attempts).toBe(i);
    }
    expect(item.status).toBe("failed");
  });

  it("não reprocessa item terminal", () => {
    const done: OutboxItem = { id: "a", status: "sent", attempts: 1, lastError: null };
    expect(applyDispatch(done, { kind: "delivered" })).toBe(done);
  });

  it("recicla itens presos em processamento", () => {
    const items: OutboxItem[] = [{ id: "a", status: "processing", attempts: 1, lastError: null }];
    const { claimed } = claimBatch(items, 10, new Set(["a"]));
    expect(claimed.map((i) => i.id)).toEqual(["a"]);
  });

  it("respeita o teto do lote e nunca reivindica duas vezes", () => {
    const items = Array.from({ length: 20 }, (_, i) => fresh(`i-${i}`));
    const first = claimBatch(items, 5);
    expect(first.claimed).toHaveLength(5);
    const second = claimBatch(first.next, 5);
    expect(second.claimed.some((c) => first.claimed.some((f) => f.id === c.id))).toBe(false);
  });

  it("converge sem perdas nem duplicidade em 400 filas aleatórias", () => {
    const rng = makeRng(72026);

    for (let sim = 0; sim < 400; sim++) {
      const size = 1 + Math.floor(rng() * 25);
      let items: OutboxItem[] = Array.from({ length: size }, (_, i) => fresh(`i-${i}`));
      const deliveredOnce = new Set<string>();

      for (let round = 0; round < 12; round++) {
        const { claimed, next } = claimBatch(items, 1 + Math.floor(rng() * 10));
        items = next;
        if (claimed.length === 0) break;

        for (const c of claimed) {
          const roll = rng();
          const result: DispatchResult =
            roll < 0.45
              ? { kind: "delivered" }
              : roll < 0.6
                ? { kind: "no_subscription" }
                : roll < 0.75
                  ? { kind: "permanent_error", error: "400" }
                  : { kind: "transient_error", error: "503" };

          const updated = applyDispatch(c, result);

          // Nenhuma entrega dupla do mesmo item.
          if (updated.status === "sent") {
            expect(deliveredOnce.has(updated.id)).toBe(false);
            deliveredOnce.add(updated.id);
          }
          // attempts nunca ultrapassa o teto.
          expect(updated.attempts).toBeLessThanOrEqual(MAX_PUSH_ATTEMPTS);

          items = items.map((i) => (i.id === updated.id ? updated : i));
        }
      }

      // Convergência: nada fica preso em 'processing' ou 'pending' após o loop.
      expect(items.every((i) => isTerminal(i.status))).toBe(true);
      // Nenhum item perdido.
      expect(items).toHaveLength(size);
    }
  });
});

describe("janela de silêncio (quiet hours)", () => {
  const pref = (o: Partial<QuietHoursPreference> = {}): QuietHoursPreference => ({
    enabled: true,
    start: "22:00",
    end: "08:00",
    weekends: true,
    ...o,
  });

  it("22:00-08:00 devolve 08:00 de Brasília quando o aviso chega de madrugada", () => {
    // 2026-11-26 02:00 BRT = 05:00 UTC
    expect(quietHoursUntil(new Date("2026-11-26T05:00:00Z"), pref())?.toISOString()).toBe(
      "2026-11-26T11:00:00.000Z",
    );
  });

  it("aviso fora da janela sai na hora", () => {
    // 2026-11-26 12:00 BRT
    expect(quietHoursUntil(new Date("2026-11-26T15:00:00Z"), pref())).toBeNull();
  });

  it("janela que cruza a meia-noite vence no dia seguinte", () => {
    // 2026-11-26 23:00 BRT = 2026-11-27 02:00 UTC
    expect(quietHoursUntil(new Date("2026-11-27T02:00:00Z"), pref())?.toISOString()).toBe(
      "2026-11-27T11:00:00.000Z",
    );
  });

  it("janela dentro do mesmo dia (13:00-14:00)", () => {
    const p = pref({ start: "13:00", end: "14:00" });
    // 12:30 BRT: ainda fora
    expect(quietHoursUntil(new Date("2026-11-26T15:30:00Z"), p)).toBeNull();
    // 13:30 BRT: dentro, vence 14:00 BRT
    expect(quietHoursUntil(new Date("2026-11-26T16:30:00Z"), p)?.toISOString()).toBe(
      "2026-11-26T17:00:00.000Z",
    );
    // 14:00 BRT: já fora
    expect(quietHoursUntil(new Date("2026-11-26T17:00:00Z"), p)).toBeNull();
  });

  it("janela desligada, sem horário ou com início igual ao fim não silencia", () => {
    const madrugada = new Date("2026-11-26T05:00:00Z");
    expect(quietHoursUntil(madrugada, pref({ enabled: false }))).toBeNull();
    expect(quietHoursUntil(madrugada, pref({ start: null }))).toBeNull();
    expect(quietHoursUntil(madrugada, pref({ start: "22:00", end: "22:00" }))).toBeNull();
  });

  it("weekends false não silencia sábado nem domingo", () => {
    // 2026-11-28 é sábado; 02:00 BRT
    const sabado = new Date("2026-11-28T05:00:00Z");
    expect(quietHoursUntil(sabado, pref())).not.toBeNull();
    expect(quietHoursUntil(sabado, pref({ weekends: false }))).toBeNull();
  });

  it("adiar não consome tentativa e a linha volta no fim da janela", () => {
    const until = quietHoursUntil(new Date("2026-11-26T05:00:00Z"), pref())!;
    let items: OutboxItem[] = [deferForQuietHours(fresh("a"), until)];
    expect(items[0].status).toBe("deferred");
    expect(items[0].attempts).toBe(0);

    // Enquanto a janela não fecha, nada é reivindicado.
    const dentro = claimBatch(items, 10, new Set(), new Date("2026-11-26T10:59:00Z"));
    expect(dentro.claimed).toHaveLength(0);
    items = dentro.next;
    expect(items[0].status).toBe("deferred");

    // No fim da janela a linha volta com a tentativa intacta e é entregue uma vez.
    const depois = claimBatch(items, 10, new Set(), until);
    expect(depois.claimed.map((c) => c.id)).toEqual(["a"]);
    expect(depois.claimed[0].attempts).toBe(0);

    const entregue = applyDispatch(depois.claimed[0], { kind: "delivered" });
    const final = depois.next.map((i) => (i.id === "a" ? entregue : i));
    expect(claimBatch(final, 10, new Set(), until).claimed).toHaveLength(0);
  });

  it("linha adiada sem prazo é devolvida à fila em vez de ficar presa", () => {
    const presa: OutboxItem = { ...fresh("a"), status: "deferred", deferredUntil: null };
    const released = releaseDeferred([presa], new Date("2026-11-26T05:00:00Z"));
    expect(released[0].status).toBe("pending");
    expect(released[0].deferredUntil).toBeNull();
  });

  it("a fila não perde nem duplica avisos que entram e saem da janela", () => {
    const rng = makeRng(1126);
    for (let sim = 0; sim < 60; sim++) {
      const size = 1 + Math.floor(rng() * 12);
      let items: OutboxItem[] = Array.from({ length: size }, (_, i) => fresh(`i-${i}`));
      let clock = new Date("2026-11-26T05:00:00Z").getTime();
      const entregues = new Set<string>();

      for (let round = 0; round < 10; round++) {
        const { claimed, next } = claimBatch(
          items,
          1 + Math.floor(rng() * 6),
          new Set(),
          new Date(clock),
        );
        items = next;
        clock += 90 * 60 * 1000;

        for (const c of claimed) {
          if (rng() < 0.5) {
            const adiado = deferForQuietHours(c, new Date(clock + 60 * 60 * 1000));
            items = items.map((i) => (i.id === adiado.id ? adiado : i));
            continue;
          }
          const entregue = applyDispatch(c, { kind: "delivered" });
          expect(entregues.has(entregue.id)).toBe(false);
          entregues.add(entregue.id);
          items = items.map((i) => (i.id === entregue.id ? entregue : i));
        }
      }

      // Passadas 48h, todo adiado venceu: a fila fica vazia e nada some.
      const fim = claimBatch(items, 500, new Set(), new Date(clock + 48 * 60 * 60 * 1000));
      expect(fim.next).toHaveLength(size);
      expect(
        fim.next.every(
          (i) => isTerminal(i.status) || i.status === "processing" || i.status === "deferred",
        ),
      ).toBe(true);
      expect(fim.next.filter((i) => i.status === "sent")).toHaveLength(entregues.size);
    }
  });
});
