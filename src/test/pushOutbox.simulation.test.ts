import { describe, it, expect } from "vitest";
import {
  applyDispatch,
  claimBatch,
  isTerminal,
  MAX_PUSH_ATTEMPTS,
  type DispatchResult,
  type OutboxItem,
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
