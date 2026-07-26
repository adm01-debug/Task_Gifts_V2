import { describe, it, expect } from "vitest";
import {
  DEVICE_LABEL_MAX_LENGTH,
  buildSyncHistory,
  displayDeviceLabel,
  isValidDeviceLabel,
  normalizeDeviceLabel,
  relativeTime,
  suggestDeviceLabel,
  type PushSyncEvent,
} from "@/lib/deviceLabel";

describe("normalizeDeviceLabel", () => {
  it("descarta entradas não textuais ou vazias", () => {
    for (const junk of [null, undefined, 42, {}, [], true, "", "   ", "\n\t  \r"]) {
      expect(normalizeDeviceLabel(junk as never)).toBeNull();
      expect(isValidDeviceLabel(junk as never)).toBe(false);
    }
  });

  it("colapsa espaços e remove caracteres de controle", () => {
    // Controle vira espaço e depois colapsa — nunca some silenciosamente do meio da palavra.
    expect(normalizeDeviceLabel("  Note\u0000book   do   João \n")).toBe("Note book do João");
    expect(normalizeDeviceLabel("Casa\tSala")).toBe("Casa Sala");
  });

  it("trunca respeitando o limite e sem deixar espaço final", () => {
    for (let len = 1; len <= DEVICE_LABEL_MAX_LENGTH + 25; len++) {
      const out = normalizeDeviceLabel("a".repeat(len));
      expect(out).not.toBeNull();
      expect((out as string).length).toBeLessThanOrEqual(DEVICE_LABEL_MAX_LENGTH);
      expect(out).toBe(out?.trimEnd());
    }
    const cut = normalizeDeviceLabel(`${"b".repeat(DEVICE_LABEL_MAX_LENGTH - 1)} extra`);
    expect(cut).toBe("b".repeat(DEVICE_LABEL_MAX_LENGTH - 1));
  });

  it("é idempotente", () => {
    const samples = ["Mac do escritório", "  PC   Recepção ", "x".repeat(80), "Ponto\u001Fdoca"];
    for (const s of samples) {
      const once = normalizeDeviceLabel(s);
      expect(normalizeDeviceLabel(once)).toBe(once);
    }
  });
});

describe("suggestDeviceLabel", () => {
  const cases: Array<[string, string]> = [
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit Safari/604.1", "iPhone · Safari"],
    ["Mozilla/5.0 (iPad; CPU OS 17_0) AppleWebKit Safari/604.1", "iPad · Safari"],
    ["Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile Safari/537.36", "Android · Chrome"],
    ["Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36 Edg/120.0", "Windows · Edge"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Firefox/121.0", "Mac · Firefox"],
    ["Mozilla/5.0 (X11; CrOS x86_64) Chrome/120.0 Safari/537.36", "ChromeOS · Chrome"],
    ["Mozilla/5.0 (Linux; Android 13) SamsungBrowser/23.0 Chrome/115", "Android · Samsung Internet"],
    ["Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 OPR/106", "Windows · Opera"],
  ];

  it("prioriza corretamente sistema e navegador", () => {
    for (const [ua, expected] of cases) expect(suggestDeviceLabel(ua)).toBe(expected);
  });

  it("degrada com segurança em UA ausente ou inválido", () => {
    for (const junk of [null, undefined, 0, {}, "", "agente-desconhecido"]) {
      expect(suggestDeviceLabel(junk as never)).toBe("Este dispositivo");
    }
  });

  it("displayDeviceLabel prefere o apelido salvo", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36";
    expect(displayDeviceLabel("  Recepção  ", ua)).toBe("Recepção");
    expect(displayDeviceLabel("   ", ua)).toBe("Windows · Chrome");
    expect(displayDeviceLabel(null, null)).toBe("Este dispositivo");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const cases: Array<[string, string]> = [
    ["2026-07-26T12:00:00.000Z", "agora"],
    ["2026-07-26T11:59:31.000Z", "agora"],
    ["2026-07-26T11:58:00.000Z", "há 2 min"],
    ["2026-07-26T09:00:00.000Z", "há 3 h"],
    ["2026-07-25T09:00:00.000Z", "ontem"],
    ["2026-07-20T12:00:00.000Z", "há 6 dias"],
    ["2026-06-01T12:00:00.000Z", "há 1 mês"],
    ["2026-01-01T12:00:00.000Z", "há 6 meses"],
    ["2024-01-01T12:00:00.000Z", "há 2 anos"],
  ];

  it("formata todas as faixas", () => {
    for (const [iso, expected] of cases) expect(relativeTime(iso, now)).toBe(expected);
  });

  it("trata datas futuras como agora e inválidas como travessão", () => {
    expect(relativeTime("2027-01-01T00:00:00.000Z", now)).toBe("agora");
    for (const junk of [null, undefined, 7, "", "não-é-data"]) {
      expect(relativeTime(junk as never, now)).toBe("—");
    }
  });
});

describe("buildSyncHistory", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");
  const events = ["subscribed", "refreshed", "renamed", "disabled", "failed"] as const;

  function row(partial: Partial<PushSyncEvent>): PushSyncEvent {
    return {
      id: "e1",
      event: "subscribed",
      device_label: "Mac",
      detail: null,
      created_at: "2026-07-26T11:00:00.000Z",
      ...partial,
    };
  }

  it("aceita todos os eventos conhecidos e rejeita desconhecidos", () => {
    for (const event of [...events, "explodiu", "", null, undefined, 3]) {
      const out = buildSyncHistory([row({ event: event as never })], { now });
      const known = (events as readonly string[]).includes(event as string);
      expect(out.length).toBe(known ? 1 : 0);
      if (known) {
        expect(out[0].label.length).toBeGreaterThan(0);
        expect(["success", "muted", "destructive"]).toContain(out[0].tone);
      }
    }
  });

  it("descarta linhas sem id ou com data inválida", () => {
    const bad: Array<Partial<PushSyncEvent>> = [
      { id: "" },
      { id: "   " },
      { id: null as never },
      { id: 5 as never },
      { created_at: "" },
      { created_at: "amanhã" as never },
      { created_at: null as never },
    ];
    for (const partial of bad) {
      expect(buildSyncHistory([row(partial)], { now })).toHaveLength(0);
    }
    expect(buildSyncHistory(null, { now })).toHaveLength(0);
    expect(buildSyncHistory(undefined, { now })).toHaveLength(0);
  });

  it("ordena do mais recente para o mais antigo e respeita o limite", () => {
    const rows: PushSyncEvent[] = Array.from({ length: 12 }, (_, i) =>
      row({
        id: `e${i}`,
        created_at: new Date(now.getTime() - i * 3_600_000).toISOString(),
        event: events[i % events.length],
      }),
    );
    for (const limit of [0, 1, 3, 5, 12, 50, NaN, -4]) {
      const out = buildSyncHistory([...rows].reverse(), { now, limit });
      const expectedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 5;
      const expectedLength = expectedLimit > 0 ? Math.min(expectedLimit, rows.length) : rows.length;
      expect(out).toHaveLength(expectedLength);
      for (let i = 1; i < out.length; i++) {
        expect(out[i - 1].createdAt >= out[i].createdAt).toBe(true);
      }
    }
  });

  it("compõe a descrição com o apelido saneado", () => {
    const out = buildSyncHistory(
      [row({ device_label: "  Sala   de   Reunião  ", event: "renamed" })],
      { now },
    );
    expect(out[0].description).toBe("Apelido atualizado · Sala de Reunião");
    const noLabel = buildSyncHistory([row({ device_label: "  " })], { now });
    expect(noLabel[0].description).toBe("Notificações ativadas");
    expect(noLabel[0].description).not.toContain("null");
  });

  it("desempate estável por id em timestamps iguais", () => {
    const rows = [row({ id: "b" }), row({ id: "a" })];
    expect(buildSyncHistory(rows, { now }).map((e) => e.id)).toEqual(["a", "b"]);
    expect(buildSyncHistory([...rows].reverse(), { now }).map((e) => e.id)).toEqual(["a", "b"]);
  });
});
