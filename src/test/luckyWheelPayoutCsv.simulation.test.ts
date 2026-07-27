import { describe, expect, it } from "vitest";
import {
  buildPayoutCsv,
  payoutCsvFilename,
  buildPayoutReport,
  type PayoutSpin,
} from "@/lib/luckyWheelPayout";
import type { OddsPrize } from "@/lib/luckyWheelOdds";

/** Parser CSV mínimo (RFC 4180) usado só para validar o round-trip do export. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; } else { quoted = false; }
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") { quoted = true; continue; }
    if (ch === ",") { row.push(cell); cell = ""; continue; }
    if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function prize(over: Partial<OddsPrize> & { id: string }): OddsPrize {
  return {
    id: over.id,
    label: over.label ?? `Prêmio ${over.id}`,
    prize_type: over.prize_type ?? "coins",
    amount: over.amount ?? 10,
    weight: over.weight ?? 1,
    is_active: over.is_active ?? true,
    ...over,
  } as OddsPrize;
}

function spin(over: Partial<PayoutSpin> & { id: string }): PayoutSpin {
  return {
    id: over.id,
    user_id: over.user_id ?? "u1",
    prize_id: over.prize_id ?? null,
    prize_label: over.prize_label ?? "Prêmio A",
    prize_type: over.prize_type ?? "coins",
    amount: over.amount ?? 10,
    created_at: over.created_at ?? "2026-07-01T10:00:00.000Z",
    ...over,
  } as PayoutSpin;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PRIZES = [
  prize({ id: "p1", label: "Moedas", amount: 10, weight: 5 }),
  prize({ id: "p2", label: "XP", prize_type: "xp", amount: 50, weight: 3 }),
  prize({ id: "p3", label: "Nada", prize_type: "none", amount: 0, weight: 2 }),
];

function sampleSpins(count: number, rnd: () => number): PayoutSpin[] {
  const out: PayoutSpin[] = [];
  for (let i = 0; i < count; i += 1) {
    const p = BASE_PRIZES[Math.floor(rnd() * BASE_PRIZES.length)];
    out.push(
      spin({
        id: `s${i}`,
        user_id: `u${i % 40}`,
        prize_id: p.id,
        prize_label: p.label,
        prize_type: p.prize_type,
        amount: p.amount,
        created_at: `2026-07-${String((i % 28) + 1).padStart(2, "0")}T09:00:00.000Z`,
      }),
    );
  }
  return out;
}

describe("buildPayoutCsv — estrutura", () => {
  it("emite as quatro seções na ordem esperada", () => {
    const report = buildPayoutReport(sampleSpins(120, mulberry(1)), BASE_PRIZES);
    const csv = buildPayoutCsv(report, { periodLabel: "30 dias", generatedAt: "2026-07-27T00:00:00.000Z" });
    expect(csv).toContain("Relatório de reconciliação");
    expect(csv).toContain("Indicador,Valor");
    expect(csv).toContain("Setor,ID do prêmio,Observado");
    expect(csv).toContain("Dia,Giros,Moedas,XP");
    expect(csv).toContain("Nível,Código,Mensagem");
    expect(csv.indexOf("Indicador,Valor")).toBeLessThan(csv.indexOf("Setor,ID do prêmio"));
    expect(csv.indexOf("Setor,ID do prêmio")).toBeLessThan(csv.indexOf("Dia,Giros,Moedas,XP"));
    expect(csv.indexOf("Dia,Giros,Moedas,XP")).toBeLessThan(csv.indexOf("Nível,Código,Mensagem"));
  });

  it("é determinístico para o mesmo relatório e metadados", () => {
    const report = buildPayoutReport(sampleSpins(90, mulberry(7)), BASE_PRIZES);
    const meta = { periodLabel: "7 dias", generatedAt: "2026-07-27T00:00:00.000Z" };
    expect(buildPayoutCsv(report, meta)).toBe(buildPayoutCsv(report, meta));
  });

  it("suporta relatório totalmente vazio sem quebrar as seções", () => {
    const report = buildPayoutReport([], []);
    const csv = buildPayoutCsv(report, { generatedAt: "2026-07-27T00:00:00.000Z" });
    expect(csv).toContain("Giros,0");
    expect(() => parseCsv(csv)).not.toThrow();
  });
});

describe("buildPayoutCsv — hostilidade de dados", () => {
  const HOSTILE_LABELS = [
    'Prêmio "Top"',
    "Moedas, muitas",
    "Linha\nquebrada",
    "CRLF\r\nrótulo",
    "=SOMA(A1:A9)",
    "+1+1",
    "-cmd|'/c calc'",
    "@import",
    "\tTab inicial",
    ";separador",
    "Emoji 🎰 & acento çãé",
    "",
  ];

  it.each(HOSTILE_LABELS)("neutraliza e preserva o rótulo %j", (label) => {
    const prizes = [prize({ id: "px", label, amount: 5, weight: 1 })];
    const spins = [spin({ id: "s1", prize_id: "px", prize_label: label, amount: 5 })];
    const report = buildPayoutReport(spins, prizes);
    const csv = buildPayoutCsv(report, { generatedAt: "2026-07-27T00:00:00.000Z" });
    const rows = parseCsv(csv);
    const target = rows.find((r) => r[0] === label || r[0] === `'${label}`);
    expect(target, `rótulo ${JSON.stringify(label)} não encontrado`).toBeTruthy();
    if (/^[=+\-@\t\r]/.test(label)) {
      expect(target?.[0]).toBe(`'${label}`);
    }
  });

  it("nenhuma célula exportada inicia com caractere de fórmula ativa", () => {
    const prizes = HOSTILE_LABELS.map((label, i) => prize({ id: `h${i}`, label, amount: i, weight: 1 }));
    const spins = HOSTILE_LABELS.map((label, i) =>
      spin({ id: `s${i}`, prize_id: `h${i}`, prize_label: label, amount: i, user_id: `u${i}` }),
    );
    const report = buildPayoutReport(spins, prizes);
    for (const row of parseCsv(buildPayoutCsv(report))) {
      for (const cell of row) {
        expect(/^[=+@]/.test(cell)).toBe(false);
      }
    }
  });

  it("não emite NaN, Infinity ou undefined em nenhuma célula", () => {
    const prizes = [
      prize({ id: "n1", label: "NaN", amount: Number.NaN, weight: 1 }),
      prize({ id: "n2", label: "Inf", amount: Number.POSITIVE_INFINITY, weight: 0 }),
    ];
    const spins = [
      spin({ id: "s1", prize_id: "n1", prize_label: "NaN", amount: Number.NaN }),
      spin({ id: "s2", prize_id: "n2", prize_label: "Inf", amount: Number.POSITIVE_INFINITY }),
      spin({ id: "s3", prize_id: "fantasma", prize_label: "Fantasma", amount: 3, created_at: "data-ruim" }),
    ];
    const csv = buildPayoutCsv(buildPayoutReport(spins, prizes));
    expect(csv).not.toMatch(/\bNaN\b/);
    expect(csv).not.toMatch(/\bInfinity\b/);
    expect(csv).not.toMatch(/\bundefined\b/);
  });
});

describe("buildPayoutCsv — round-trip contábil", () => {
  it("reconstrói totais idênticos ao relatório em 200 cenários aleatórios", () => {
    for (let seed = 0; seed < 200; seed += 1) {
      const rnd = mulberry(seed + 1000);
      const spins = sampleSpins(20 + Math.floor(rnd() * 200), rnd);
      const report = buildPayoutReport(spins, BASE_PRIZES);
      const rows = parseCsv(buildPayoutCsv(report, { generatedAt: "2026-07-27T00:00:00.000Z" }));

      const header = rows.findIndex((r) => r[0] === "Setor");
      const sectorRows = rows.slice(header + 1).filter((r) => r.length > 6 && r[0] !== "");
      const observed = sectorRows.reduce((acc, r) => acc + Number(r[2]), 0);
      expect(observed).toBe(report.totals.spins);

      const dayHeader = rows.findIndex((r) => r[0] === "Dia");
      const dayRows = rows.slice(dayHeader + 1).filter((r) => r.length === 4 && r[0] !== "" && r[0] !== "Nível");
      expect(dayRows.reduce((a, r) => a + Number(r[1]), 0)).toBe(report.totals.spins);
      expect(dayRows.reduce((a, r) => a + Number(r[2]), 0)).toBe(report.totals.coinsPaid);
      expect(dayRows.reduce((a, r) => a + Number(r[3]), 0)).toBe(report.totals.xpPaid);

      const spinsCell = rows.find((r) => r[0] === "Giros");
      expect(Number(spinsCell?.[1])).toBe(report.totals.spins);
    }
  });

  it("exporta todos os alertas do relatório", () => {
    const spins = [
      spin({ id: "s1", prize_id: "p1", prize_label: "Moedas", amount: 999 }),
      spin({ id: "s1", prize_id: "p1", prize_label: "Moedas", amount: 10 }),
      spin({ id: "s2", prize_id: null, prize_label: "Fantasma", amount: 7 }),
    ];
    const report = buildPayoutReport(spins, BASE_PRIZES);
    const csv = buildPayoutCsv(report);
    for (const alert of report.alerts) {
      expect(csv).toContain(alert.code);
    }
  });
});

describe("payoutCsvFilename", () => {
  it.each([
    [30, "roleta-payout-30d-2026-07-27.csv"],
    [7.9, "roleta-payout-7d-2026-07-27.csv"],
    [0, "roleta-payout-1d-2026-07-27.csv"],
    [-5, "roleta-payout-1d-2026-07-27.csv"],
    [Number.NaN, "roleta-payout-30d-2026-07-27.csv"],
  ])("normaliza %s", (days, expected) => {
    expect(payoutCsvFilename(days as number, new Date("2026-07-27T12:00:00Z"))).toBe(expected);
  });

  it("tolera data inválida", () => {
    expect(payoutCsvFilename(30, new Date("x"))).toBe("roleta-payout-30d-sem-data.csv");
  });
});
