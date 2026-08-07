import { describe, expect, it } from "vitest";
import { computeDeviceFingerprint } from "@/lib/deviceFingerprint";
import { buildDeviceList, describeDevice, type PushDeviceRow } from "@/lib/pushDevices";

const NOW = new Date("2026-07-26T12:00:00.000Z");
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

function row(over: Partial<PushDeviceRow> = {}): PushDeviceRow {
  return {
    id: "fp-1",
    endpoint: "https://push.example/fp-1",
    device_fingerprint: "fp-1",
    subscription_id: "sub-1",
    device_label: null,
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    last_used_at: ago(1),
    created_at: ago(10),
    disabled_at: null,
    disabled_reason: null,
    failure_count: 0,
    push_active: true,
    is_trusted: false,
    last_seen_at: ago(1),
    ...over,
  };
}

describe("fingerprint — estabilidade e unicidade", () => {
  const base = {
    userAgent: "Mozilla/5.0 (Windows NT 10.0)",
    language: "pt-BR",
    colorDepth: 24,
    screenSize: "1920x1080",
    timezoneOffset: 180,
    hardwareConcurrency: 8,
    deviceMemory: 8,
  };

  it("é determinística para os mesmos sinais", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(computeDeviceFingerprint(base)).toBe(computeDeviceFingerprint(base));
    }
  });

  it("muda quando qualquer sinal muda", () => {
    const reference = computeDeviceFingerprint(base);
    const variants = [
      { userAgent: "Mozilla/5.0 (X11; Linux x86_64)" },
      { language: "en-US" },
      { colorDepth: 30 },
      { screenSize: "1280x800" },
      { timezoneOffset: 0 },
      { hardwareConcurrency: 4 },
      { deviceMemory: 16 },
    ];
    for (const v of variants) {
      expect(computeDeviceFingerprint({ ...base, ...v })).not.toBe(reference);
    }
  });

  it("nunca estoura com unicode nem com sinais ausentes", () => {
    expect(computeDeviceFingerprint(null).length).toBeGreaterThan(0);
    expect(computeDeviceFingerprint({}).length).toBeGreaterThan(0);
    expect(computeDeviceFingerprint({ ...base, userAgent: "Navegador 🚀 çãé" }).length).toBe(32);
  });
});

describe("buildDeviceList — unificação por aparelho", () => {
  it("reconhece o aparelho atual pela impressão digital, sem endpoint local", () => {
    const [entry] = buildDeviceList([row()], { now: NOW, currentFingerprint: "fp-1" });
    expect(entry.isCurrent).toBe(true);
    expect(entry.status).toBe("current");
  });

  it("mantém aparelho só com histórico de acesso (sem push)", () => {
    const [entry] = buildDeviceList(
      [row({ endpoint: "", subscription_id: null, push_active: false })],
      { now: NOW },
    );
    expect(entry.subscriptionId).toBeNull();
    expect(entry.pushActive).toBe(false);
    expect(entry.canRevoke).toBe(true);
  });

  it("descarta linhas sem endpoint e sem impressão digital", () => {
    expect(
      buildDeviceList([row({ endpoint: "", device_fingerprint: null })], { now: NOW }),
    ).toHaveLength(0);
  });

  it("expõe estado revogado coerente entre acesso e push", () => {
    const [entry] = buildDeviceList(
      [row({ disabled_at: ago(1), disabled_reason: "revoked_by_user", push_active: false })],
      { now: NOW },
    );
    expect(entry.status).toBe("revoked");
    expect(entry.canRevoke).toBe(false);
    expect(entry.disabledReason).toBe("revoked_by_user");
  });

  it("preserva compatibilidade com linhas antigas (id = inscrição)", () => {
    const legacy = {
      id: "sub-legacy",
      endpoint: "https://push.example/legacy",
      device_label: "Notebook",
      user_agent: "Mozilla/5.0 (Windows NT 10.0)",
      last_used_at: ago(2),
      created_at: ago(30),
      disabled_at: null,
      disabled_reason: null,
      failure_count: 0,
    } satisfies PushDeviceRow;
    const [entry] = buildDeviceList([legacy], { now: NOW });
    expect(entry.subscriptionId).toBe("sub-legacy");
    expect(entry.fingerprint).toBeNull();
    expect(entry.pushActive).toBe(true);
  });

  it("mantém unicidade por aparelho em combinações massivas", () => {
    const rows: PushDeviceRow[] = [];
    for (let i = 0; i < 200; i += 1) {
      const fp = `fp-${i % 25}`;
      rows.push(row({ id: fp, device_fingerprint: fp, subscription_id: `sub-${i}` }));
    }
    const list = buildDeviceList(rows, { now: NOW });
    expect(list).toHaveLength(25);
    expect(new Set(list.map((d) => d.fingerprint)).size).toBe(25);
  });
});

describe("describeDevice — identidade visual do aparelho", () => {
  const UAS: Record<string, { ua: string; browser: string; os: string; kind: string }> = {
    chromeWin: {
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
      browser: "Chrome",
      os: "Windows",
      kind: "desktop",
    },
    edgeWin: {
      ua: "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0",
      browser: "Edge",
      os: "Windows",
      kind: "desktop",
    },
    operaMac: {
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0 Safari/537.36 OPR/112.0",
      browser: "Opera",
      os: "macOS",
      kind: "desktop",
    },
    safariIphone: {
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      browser: "Safari",
      os: "iOS",
      kind: "mobile",
    },
    safariIpad: {
      ua: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      browser: "Safari",
      os: "iOS",
      kind: "tablet",
    },
    chromeAndroid: {
      ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
      browser: "Chrome",
      os: "Android",
      kind: "mobile",
    },
    firefoxLinux: {
      ua: "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
      browser: "Firefox",
      os: "Linux",
      kind: "desktop",
    },
  };

  it("classifica corretamente cada família de user agent", () => {
    for (const { ua, browser, os, kind } of Object.values(UAS)) {
      const d = describeDevice({ user_agent: ua });
      expect(d.browser).toBe(browser);
      expect(d.os).toBe(os);
      expect(d.kind).toBe(kind);
      expect(d.descriptor).toBe(`${browser} · ${os}`);
    }
  });

  it("dá prioridade aos campos vindos do histórico de acesso", () => {
    const d = describeDevice({
      browser: "  Brave  ",
      os: "ChromeOS",
      device_type: "TABLET",
      user_agent: UAS.chromeWin.ua,
    });
    expect(d.browser).toBe("Brave");
    expect(d.os).toBe("ChromeOS");
    expect(d.kind).toBe("tablet");
  });

  it("ignora ruído: vazio, 'unknown', espaços e tipo inválido", () => {
    const d = describeDevice({ browser: "  ", os: "unknown", device_type: "geladeira", user_agent: "" });
    expect(d.browser).toBeNull();
    expect(d.os).toBeNull();
    expect(d.kind).toBe("unknown");
    expect(d.descriptor).toBe("");
  });

  it("nunca lança em nenhuma combinação de entradas hostis", () => {
    const values = [null, undefined, "", "   ", "unknown", "Chrome", 42, {}, "x".repeat(500)];
    let count = 0;
    for (const browser of values) {
      for (const os of values) {
        for (const device_type of values) {
          for (const ua of [null, "", UAS.chromeWin.ua, UAS.safariIphone.ua]) {
            const d = describeDevice({
              browser: browser as string,
              os: os as string,
              device_type: device_type as string,
              user_agent: ua,
            });
            expect(typeof d.descriptor).toBe("string");
            expect((d.browser ?? "").length).toBeLessThanOrEqual(40);
            expect((d.os ?? "").length).toBeLessThanOrEqual(40);
            expect(["mobile", "tablet", "desktop", "unknown"]).toContain(d.kind);
            count += 1;
          }
        }
      }
    }
    expect(count).toBe(values.length ** 3 * 4);
  });

  it("propaga a identidade para as entradas da lista", () => {
    const [entry] = buildDeviceList(
      [row({ browser: "Chrome", os: "Windows", device_type: "desktop" })],
      { now: NOW },
    );
    expect(entry.descriptor).toBe("Chrome · Windows");
    expect(entry.kind).toBe("desktop");
  });
});