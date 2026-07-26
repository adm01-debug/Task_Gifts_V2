import { describe, it, expect } from "vitest";
import {
  buildDeviceList,
  summarizeDevices,
  canRevokeDevice,
  describeAlertDevice,
  buildNewDeviceMessage,
  sameEndpoint,
  STALE_DEVICE_DAYS,
  type PushDeviceRow,
} from "@/lib/pushDevices";

const NOW = new Date("2026-07-26T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

const UAS = {
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 Version/17.0 Mobile Safari/604.1",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605 Version/17.0 Safari/604.1",
  winEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537 Chrome/120 Safari/537 Edg/120",
  winChrome: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537 Chrome/120 Safari/537",
  android: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537 Chrome/120 Mobile Safari/537",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537 Chrome/120 Safari/537",
};

function row(over: Partial<PushDeviceRow> = {}): PushDeviceRow {
  return {
    id: over.id ?? "id-1",
    endpoint: over.endpoint ?? "https://fcm.googleapis.com/x/1",
    device_label: over.device_label ?? null,
    user_agent: over.user_agent ?? UAS.winChrome,
    last_used_at: over.last_used_at ?? ago(1),
    created_at: over.created_at ?? ago(10),
    disabled_at: over.disabled_at ?? null,
    disabled_reason: over.disabled_reason ?? null,
    failure_count: over.failure_count ?? 0,
  };
}

describe("buildDeviceList — saneamento de linhas", () => {
  it("descarta linhas sem id ou sem endpoint", () => {
    const bad = [
      null,
      undefined,
      {},
      row({ id: "" }),
      row({ id: "   " }),
      row({ endpoint: "" }),
      // @ts-expect-error simulação de payload cru inválido
      row({ id: 42 }),
    ] as unknown as PushDeviceRow[];
    expect(buildDeviceList(bad, { now: NOW })).toHaveLength(0);
  });

  it("nunca quebra com entrada nula/indefinida", () => {
    expect(buildDeviceList(null)).toEqual([]);
    expect(buildDeviceList(undefined)).toEqual([]);
    expect(buildDeviceList([])).toEqual([]);
  });

  it("deduplica ids repetidos mantendo a primeira ocorrência", () => {
    const list = buildDeviceList(
      [row({ id: "a", device_label: "Primeiro" }), row({ id: "a", device_label: "Segundo" })],
      { now: NOW },
    );
    expect(list).toHaveLength(1);
    expect(list[0].label).toBe("Primeiro");
  });

  it("normaliza failure_count negativo, fracionário e inválido", () => {
    const cases: Array<[unknown, number]> = [
      [-5, 0], [0, 0], [3, 3], [3.9, 3], [NaN, 0], [null, 0], [undefined, 0], ["7" as unknown, 0],
    ];
    for (const [input, expected] of cases) {
      const [entry] = buildDeviceList([row({ failure_count: input as number })], { now: NOW });
      expect(entry.failureCount, `entrada ${String(input)}`).toBe(expected);
    }
  });

  it("rejeita datas inválidas sem derrubar a entrada", () => {
    const [entry] = buildDeviceList(
      [row({ last_used_at: "não é data", created_at: "2026-13-45T99:99:99Z" })],
      { now: NOW },
    );
    expect(entry.lastUsedAt).toBeNull();
    expect(entry.createdAt).toBeNull();
    expect(entry.lastUsedRelative).toBe("—");
    expect(entry.status).toBe("active");
  });
});

describe("buildDeviceList — matriz de status", () => {
  const scenarios: Array<{ disabled: boolean; current: boolean; days: number; expected: string }> = [];
  for (const disabled of [false, true]) {
    for (const current of [false, true]) {
      for (const days of [0, 1, 15, 29, 30, 31, 120, 900]) {
        const expected = disabled
          ? "revoked"
          : current
            ? "current"
            : days > STALE_DEVICE_DAYS
              ? "idle"
              : "active";
        scenarios.push({ disabled, current, days, expected });
      }
    }
  }

  it(`resolve ${scenarios.length} combinações de estado`, () => {
    for (const s of scenarios) {
      const endpoint = "https://push/x";
      const [entry] = buildDeviceList(
        [row({ endpoint, last_used_at: ago(s.days), disabled_at: s.disabled ? ago(0) : null })],
        { now: NOW, currentEndpoint: s.current ? endpoint : "https://push/outro" },
      );
      expect(entry.status, JSON.stringify(s)).toBe(s.expected);
      expect(entry.canRevoke).toBe(!s.disabled);
      expect(entry.isCurrent).toBe(s.current);
      expect(entry.statusLabel.length).toBeGreaterThan(0);
    }
  });

  it("revogado vence 'atual': um endpoint revogado nunca aparece como ativo", () => {
    const endpoint = "https://push/me";
    const [entry] = buildDeviceList([row({ endpoint, disabled_at: ago(1) })], {
      now: NOW,
      currentEndpoint: endpoint,
    });
    expect(entry.status).toBe("revoked");
    expect(entry.canRevoke).toBe(false);
    expect(entry.isCurrent).toBe(true);
  });

  it("usa created_at quando last_used_at é nulo para decidir ociosidade", () => {
    const [novo] = buildDeviceList([row({ last_used_at: null, created_at: ago(2) })], { now: NOW });
    const [velho] = buildDeviceList([row({ last_used_at: null, created_at: ago(200) })], { now: NOW });
    expect(novo.status).toBe("active");
    expect(velho.status).toBe("idle");
  });

  it("data futura de último uso jamais marca como ocioso", () => {
    const [entry] = buildDeviceList(
      [row({ last_used_at: new Date(NOW.getTime() + 5 * DAY).toISOString() })],
      { now: NOW },
    );
    expect(entry.status).toBe("active");
    expect(entry.lastUsedRelative).toBe("agora");
  });
});

describe("buildDeviceList — ordenação estável", () => {
  it("atual → ativos → ociosos → revogados", () => {
    const rows = [
      row({ id: "revogado", endpoint: "e1", disabled_at: ago(1) }),
      row({ id: "ocioso", endpoint: "e2", last_used_at: ago(90) }),
      row({ id: "ativo", endpoint: "e3", last_used_at: ago(2) }),
      row({ id: "atual", endpoint: "e4", last_used_at: ago(40) }),
    ];
    const list = buildDeviceList(rows, { now: NOW, currentEndpoint: "e4" });
    expect(list.map((d) => d.id)).toEqual(["atual", "ativo", "ocioso", "revogado"]);
  });

  it("dentro do mesmo status ordena por último uso decrescente", () => {
    const rows = [3, 1, 2, 5, 4].map((d) =>
      row({ id: `d${d}`, endpoint: `e${d}`, last_used_at: ago(d) }),
    );
    const list = buildDeviceList(rows, { now: NOW });
    expect(list.map((d) => d.id)).toEqual(["d1", "d2", "d3", "d4", "d5"]);
  });

  it("empate total desempata por id — ordem independe da entrada", () => {
    const mk = (ids: string[]) =>
      buildDeviceList(
        ids.map((id) => row({ id, endpoint: `e-${id}`, last_used_at: ago(3) })),
        { now: NOW },
      ).map((d) => d.id);
    expect(mk(["c", "a", "b"])).toEqual(["a", "b", "c"]);
    expect(mk(["b", "c", "a"])).toEqual(["a", "b", "c"]);
    expect(mk(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("é idempotente sob embaralhamento (100 permutações)", () => {
    const base = Array.from({ length: 8 }, (_, i) =>
      row({ id: `dev-${i}`, endpoint: `e-${i}`, last_used_at: ago(i % 3) }),
    );
    const reference = buildDeviceList(base, { now: NOW }).map((d) => d.id);
    for (let seed = 0; seed < 100; seed++) {
      const shuffled = [...base].sort(() => ((seed * 9301 + 49297) % 233280) / 233280 - 0.5);
      expect(buildDeviceList(shuffled, { now: NOW }).map((d) => d.id)).toEqual(reference);
    }
  });
});

describe("rótulos", () => {
  it("apelido do usuário vence a heurística de user agent", () => {
    const [entry] = buildDeviceList([row({ device_label: "  Notebook   do  Trabalho  ", user_agent: UAS.mac })], { now: NOW });
    expect(entry.label).toBe("Notebook do Trabalho");
    expect(entry.hasCustomLabel).toBe(true);
    expect(entry.platform).toBe("Mac · Chrome");
  });

  it("sem apelido cai na plataforma derivada", () => {
    const cases: Array<[string, string]> = [
      [UAS.iphone, "iPhone · Safari"],
      [UAS.winEdge, "Windows · Edge"],
      [UAS.winChrome, "Windows · Chrome"],
      [UAS.android, "Android · Chrome"],
      [UAS.mac, "Mac · Chrome"],
    ];
    for (const [ua, expected] of cases) {
      const [entry] = buildDeviceList([row({ user_agent: ua, device_label: null })], { now: NOW });
      expect(entry.label, ua).toBe(expected);
      expect(entry.hasCustomLabel).toBe(false);
    }
  });

  it("apelido só com espaços/controles equivale a sem apelido", () => {
    for (const junk of ["", "   ", "\n\t", "\u0000\u001F"]) {
      const [entry] = buildDeviceList([row({ device_label: junk, user_agent: UAS.iphone })], { now: NOW });
      expect(entry.hasCustomLabel, JSON.stringify(junk)).toBe(false);
      expect(entry.label).toBe("iPhone · Safari");
    }
  });

  it("user agent ausente não gera rótulo vazio", () => {
    const [entry] = buildDeviceList([row({ user_agent: null, device_label: null })], { now: NOW });
    expect(entry.label).toBe("Este dispositivo");
  });
});

describe("summarizeDevices", () => {
  it("conta ativos e revogados em dezenas de composições", () => {
    for (let ativos = 0; ativos <= 6; ativos++) {
      for (let revogados = 0; revogados <= 6; revogados++) {
        const rows = [
          ...Array.from({ length: ativos }, (_, i) => row({ id: `a${i}`, endpoint: `ea${i}` })),
          ...Array.from({ length: revogados }, (_, i) =>
            row({ id: `r${i}`, endpoint: `er${i}`, disabled_at: ago(1) }),
          ),
        ];
        const s = summarizeDevices(buildDeviceList(rows, { now: NOW }));
        expect(s.total).toBe(ativos + revogados);
        expect(s.active).toBe(ativos);
        expect(s.revoked).toBe(revogados);
        if (s.total === 0) expect(s.text).toBe("Nenhum dispositivo inscrito.");
        else expect(s.text).toContain(String(ativos));
      }
    }
  });

  it("usa singular e plural corretamente", () => {
    expect(summarizeDevices(buildDeviceList([row({ id: "a", endpoint: "e" })], { now: NOW })).text)
      .toBe("1 dispositivo ativo");
    const dois = buildDeviceList([row({ id: "a", endpoint: "e1" }), row({ id: "b", endpoint: "e2" })], { now: NOW });
    expect(summarizeDevices(dois).text).toBe("2 dispositivos ativos");
  });
});

describe("canRevokeDevice — guarda de revogação", () => {
  const [ativo] = buildDeviceList([row({ id: "a", endpoint: "e1" })], { now: NOW });
  const [revogado] = buildDeviceList([row({ id: "r", endpoint: "e2", disabled_at: ago(1) })], { now: NOW });
  const [atual] = buildDeviceList([row({ id: "c", endpoint: "e3" })], { now: NOW, currentEndpoint: "e3" });

  it("bloqueia alvo inexistente", () => {
    expect(canRevokeDevice(null)).toEqual({ allowed: false, reason: "not_found" });
    expect(canRevokeDevice(undefined)).toEqual({ allowed: false, reason: "not_found" });
  });

  it("bloqueia revogação dupla (idempotência do lado do cliente)", () => {
    expect(canRevokeDevice(revogado)).toEqual({ allowed: false, reason: "already_revoked" });
    expect(canRevokeDevice(revogado, { confirmedCurrent: true })).toEqual({
      allowed: false,
      reason: "already_revoked",
    });
  });

  it("exige confirmação para revogar o dispositivo em uso", () => {
    expect(canRevokeDevice(atual)).toEqual({ allowed: false, reason: "needs_confirmation" });
    expect(canRevokeDevice(atual, { confirmedCurrent: true })).toEqual({ allowed: true });
  });

  it("permite revogar outro dispositivo ativo sem confirmação extra", () => {
    expect(canRevokeDevice(ativo)).toEqual({ allowed: true });
  });
});

describe("sameEndpoint", () => {
  it("exige igualdade exata e rejeita vazios/não-strings", () => {
    expect(sameEndpoint("a", "a")).toBe(true);
    expect(sameEndpoint("a", "A")).toBe(false);
    expect(sameEndpoint("", "")).toBe(false);
    expect(sameEndpoint(null, null)).toBe(false);
    expect(sameEndpoint(undefined, "a")).toBe(false);
    expect(sameEndpoint("https://p/1", "https://p/12")).toBe(false);
  });
});

describe("describeAlertDevice — apelido nos alertas de segurança", () => {
  const devices = buildDeviceList(
    [
      row({ id: "1", endpoint: "e1", device_label: "iPhone do João", user_agent: UAS.iphone }),
      row({ id: "2", endpoint: "e2", device_label: null, user_agent: UAS.winEdge }),
      row({ id: "3", endpoint: "e3", device_label: "PC da Sala", user_agent: UAS.winChrome }),
    ],
    { now: NOW },
  );

  it("prefere o apelido salvo quando a plataforma casa", () => {
    expect(describeAlertDevice({ user_agent: UAS.iphone, browser: "Safari", os: "iOS" }, devices))
      .toBe("iPhone do João");
    expect(describeAlertDevice({ user_agent: UAS.winChrome, browser: "Chrome", os: "Windows" }, devices))
      .toBe("PC da Sala");
  });

  it("ignora dispositivos sem apelido personalizado", () => {
    // O Edge está cadastrado, mas sem apelido → deve usar browser/os do alerta.
    expect(describeAlertDevice({ user_agent: UAS.winEdge, browser: "Edge", os: "Windows" }, devices))
      .toBe("Edge em Windows");
  });

  it("não confunde plataformas diferentes", () => {
    expect(describeAlertDevice({ user_agent: UAS.android, browser: "Chrome", os: "Android" }, devices))
      .toBe("Chrome em Android");
    expect(describeAlertDevice({ user_agent: UAS.mac, browser: "Chrome", os: "macOS" }, devices))
      .toBe("Chrome em macOS");
  });

  it("degrada em cascata quando faltam dados", () => {
    expect(describeAlertDevice({ user_agent: UAS.iphone }, [])).toBe("iPhone · Safari");
    expect(describeAlertDevice({ browser: "Firefox" }, [])).toBe("Firefox");
    expect(describeAlertDevice({ os: "Linux" }, [])).toBe("Linux");
    expect(describeAlertDevice({}, [])).toBe("Dispositivo desconhecido");
    expect(describeAlertDevice(null, null)).toBe("Dispositivo desconhecido");
    expect(describeAlertDevice(undefined, devices)).toBe("Dispositivo desconhecido");
  });

  it("trata 'Desconhecido' do detector como ausência de dado", () => {
    expect(describeAlertDevice({ browser: "Desconhecido", os: "Desconhecido", user_agent: UAS.android }, []))
      .toBe("Android · Chrome");
    expect(describeAlertDevice({ browser: "Desconhecido", os: "Windows" }, [])).toBe("Windows");
    expect(describeAlertDevice({ browser: "Chrome", os: "Desconhecido" }, [])).toBe("Chrome");
    expect(describeAlertDevice({ browser: "Desconhecido", os: "Desconhecido" }, [])).toBe("Dispositivo desconhecido");
  });

  it("user agent irreconhecível não casa com nenhum apelido", () => {
    for (const ua of ["curl/8.0", "", "   ", "???"]) {
      const out = describeAlertDevice({ user_agent: ua }, devices);
      expect(out, ua).not.toBe("iPhone do João");
    }
  });

  it("varre a matriz completa UA × browser × os sem retornar texto vazio", () => {
    const uas = [...Object.values(UAS), "curl/8.0", "", null, undefined];
    const browsers = ["Chrome", "Safari", "Desconhecido", "", null, undefined];
    const oses = ["Windows", "iOS", "Desconhecido", "", null, undefined];
    let count = 0;
    for (const user_agent of uas) {
      for (const browser of browsers) {
        for (const os of oses) {
          for (const list of [devices, [], null]) {
            const out = describeAlertDevice(
              { user_agent: user_agent as string | null, browser: browser as string | null, os: os as string | null },
              list,
            );
            expect(typeof out).toBe("string");
            expect(out.trim().length).toBeGreaterThan(0);
            count++;
          }
        }
      }
    }
    expect(count).toBeGreaterThan(700);
  });
});

describe("buildNewDeviceMessage", () => {
  it("inclui o IP quando disponível e omite quando não", () => {
    expect(buildNewDeviceMessage({ browser: "Chrome", os: "Windows", ip_address: "203.0.113.9" }, []))
      .toBe("Novo acesso: Chrome em Windows (IP: 203.0.113.9)");
    expect(buildNewDeviceMessage({ browser: "Chrome", os: "Windows" }, []))
      .toBe("Novo acesso: Chrome em Windows");
    expect(buildNewDeviceMessage({ browser: "Chrome", os: "Windows", ip_address: "   " }, []))
      .toBe("Novo acesso: Chrome em Windows");
  });

  it("nunca produz 'undefined' ou 'null' no corpo", () => {
    const inputs = [null, undefined, {}, { ip_address: null }, { browser: null, os: null, user_agent: null }];
    for (const input of inputs) {
      const msg = buildNewDeviceMessage(input as never, null);
      expect(msg).not.toMatch(/undefined|null|NaN/);
    }
  });
});
