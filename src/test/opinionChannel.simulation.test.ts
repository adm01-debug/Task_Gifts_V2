import { describe, expect, it } from "vitest";
import {
  CLOSED_STATUSES,
  OPINION_CATEGORIES,
  OPINION_CONTENT_MAX,
  OPINION_MIN_AGGREGATE,
  OPINION_STATUSES,
  OPINION_SUBJECT_MAX,
  OPINION_URGENCIES,
  SLA_HOURS_BY_URGENCY,
  buildOpinionActionPlanSeed,
  computeOpinionSla,
  sanitizeOpinionText,
  sortOpinionQueue,
  summarizeOpinionFeed,
  toOpinionFeedEntry,
  validateOpinionDraft,
  type OpinionFeedEntry,
} from "@/lib/opinionChannel";

const SECRET_ID = "11111111-2222-3333-4444-555555555555";
const NOWS = [
  new Date("2026-01-01T00:00:00.000Z"),
  new Date("2026-07-26T13:45:12.000Z"),
  new Date("2030-12-31T23:59:59.000Z"),
];
const AGES_HOURS = [0, 1, 23, 25, 72, 200, 400, 5000];

describe("sanitizeOpinionText — texto livre hostil", () => {
  it("remove controle, bidi e colapsa espaços em todas as combinações", () => {
    const samples = [
      "  texto   normal  ",
      "linha1\n\n   linha2",
      "com\u0000nulo\u0007bell",
      "bidi\u202Eoculto\u202C",
      "zero\u200Bwidth\uFEFFjoin",
      "Ω".repeat(50),
      "emoji 🙂 ok",
      "",
      "     ",
    ];
    let assertions = 0;
    for (const sample of samples) {
      for (const limit of [10, 80, 4000]) {
        const out = sanitizeOpinionText(sample, limit);
        expect(typeof out).toBe("string");
        expect(out.length).toBeLessThanOrEqual(limit);
        // eslint-disable-next-line no-control-regex
        expect(out).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/);
        expect(out).not.toMatch(/[\u200B-\u200F\u202A-\u202E\uFEFF]/);
        expect(out).toBe(out.trim());
        assertions += 5;
      }
    }
    expect(assertions).toBeGreaterThan(100);
  });

  it("nunca lança com entradas não textuais", () => {
    for (const bad of [null, undefined, 42, {}, [], true, Symbol("x")]) {
      expect(sanitizeOpinionText(bad as unknown)).toBe("");
    }
    expect(sanitizeOpinionText("abc", -5).length).toBeLessThanOrEqual(OPINION_CONTENT_MAX);
    expect(sanitizeOpinionText("abc", Number.NaN)).toBe("abc");
  });

  it("trunca conteúdo gigante mantendo o limite", () => {
    const huge = "a".repeat(OPINION_CONTENT_MAX * 3);
    const out = sanitizeOpinionText(huge);
    expect(out.length).toBe(OPINION_CONTENT_MAX);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("validateOpinionDraft — combinatória de rascunhos", () => {
  it("cobre categoria × urgência × anonimato × conteúdo", () => {
    const contents = ["", "curto", "Conteúdo suficientemente longo para passar.", " ".repeat(30)];
    const categories = [...OPINION_CATEGORIES, "invalida", null, undefined];
    const urgencies = [...OPINION_URGENCIES, "urgentissimo", null];
    let assertions = 0;

    for (const content of contents) {
      for (const category of categories) {
        for (const urgency of urgencies) {
          for (const isAnonymous of [true, false, undefined]) {
            const res = validateOpinionDraft({
              content,
              category: category as string | null,
              urgency: urgency as string | null,
              isAnonymous,
              subject: "  Assunto  ",
            });
            expect(OPINION_CATEGORIES).toContain(res.value.category);
            expect(OPINION_URGENCIES).toContain(res.value.urgency);
            expect(res.value.subject).toBe("Assunto");
            expect(res.value.isAnonymous).toBe(isAnonymous !== false);
            expect(res.value.recipientType).toBe("hr");
            const shouldFailContent = sanitizeOpinionText(content).length < 10;
            const hasContentError = res.errors.some((e) => e.includes("caracteres"));
            expect(hasContentError).toBe(shouldFailContent);
            expect(res.valid).toBe(res.errors.length === 0);
            assertions += 7;
          }
        }
      }
    }
    expect(assertions).toBeGreaterThan(1000);
  });

  it("aceita rascunho nulo sem quebrar", () => {
    for (const bad of [null, undefined]) {
      const res = validateOpinionDraft(bad);
      expect(res.valid).toBe(false);
      expect(res.value.category).toBe("suggestion");
      expect(res.value.isAnonymous).toBe(true);
    }
  });

  it("limita assunto ao máximo permitido", () => {
    const res = validateOpinionDraft({ content: "conteúdo válido aqui", subject: "x".repeat(500) });
    expect(res.value.subject!.length).toBeLessThanOrEqual(OPINION_SUBJECT_MAX);
  });
});

describe("computeOpinionSla — prazos por urgência", () => {
  it("cobre urgência × status × idade × relógio", () => {
    let assertions = 0;
    for (const urgency of OPINION_URGENCIES) {
      for (const status of OPINION_STATUSES) {
        for (const age of AGES_HOURS) {
          for (const now of NOWS) {
            const createdAt = new Date(now.getTime() - age * 3_600_000).toISOString();
            const sla = computeOpinionSla({ createdAt, urgency, status }, now);

            const expectedDue = new Date(
              new Date(createdAt).getTime() + SLA_HOURS_BY_URGENCY[urgency] * 3_600_000,
            ).toISOString();
            expect(sla.dueAt).toBe(expectedDue);
            expect(sla.label.length).toBeGreaterThan(0);

            if (CLOSED_STATUSES.includes(status)) {
              expect(sla.state).toBe("closed");
            } else {
              const remaining = SLA_HOURS_BY_URGENCY[urgency] - age;
              const expected = remaining < 0 ? "overdue" : remaining <= 24 ? "due_soon" : "on_track";
              expect(sla.state).toBe(expected);
            }
            assertions += 3;
          }
        }
      }
    }
    expect(assertions).toBeGreaterThan(1000);
  });

  it("é resiliente a datas inválidas", () => {
    const sla = computeOpinionSla({ createdAt: "não é data", urgency: "???", status: null }, NOWS[1]);
    expect(() => new Date(sla.dueAt).toISOString()).not.toThrow();
    expect(sla.state).not.toBe("closed");
  });
});

describe("toOpinionFeedEntry — guarda de anonimato", () => {
  it("nunca vaza identidade em manifestação anônima", () => {
    let assertions = 0;
    for (const isAnonymous of [true, false, undefined, null, "sim"]) {
      for (const category of [...OPINION_CATEGORIES, "hack"]) {
        for (const status of [...OPINION_STATUSES, "zumbi"]) {
          for (const now of NOWS) {
            const entry = toOpinionFeedEntry(
              {
                id: "op-1",
                sender_id: SECRET_ID,
                sender_name: "João da Silva",
                is_anonymous: isAnonymous,
                subject: "Assunto\u202Eruim",
                content: "Conteúdo da manifestação com detalhes.",
                category,
                urgency: "high",
                status,
                department_name: "Comercial",
                support_count: "7",
                response_count: -3,
                viewer_supported: "true",
                created_at: new Date(now.getTime() - 3_600_000).toISOString(),
              },
              now,
            )!;

            expect(entry).not.toBeNull();
            const anon = isAnonymous !== false;
            expect(entry.isAnonymous).toBe(anon);
            expect(entry.authorId).toBe(anon ? null : SECRET_ID);
            expect(entry.authorName).toBe(anon ? "Colaborador anônimo" : "João da Silva");
            if (anon) {
              expect(JSON.stringify(entry)).not.toContain(SECRET_ID);
              expect(JSON.stringify(entry)).not.toContain("João");
            }
            expect(OPINION_CATEGORIES).toContain(entry.category);
            expect(OPINION_STATUSES).toContain(entry.status);
            expect(entry.supportCount).toBe(7);
            expect(entry.responseCount).toBe(0);
            expect(entry.viewerSupported).toBe(false);
            expect(entry.subject).not.toMatch(/[\u202A-\u202E]/);
            assertions += 9;
          }
        }
      }
    }
    expect(assertions).toBeGreaterThan(900);
  });

  it("descarta linhas sem id utilizável", () => {
    for (const bad of [null, undefined, {}, { id: "" }, { id: "   " }, { id: 42 }]) {
      expect(toOpinionFeedEntry(bad as never)).toBeNull();
    }
  });
});

describe("summarizeOpinionFeed — k-anonimato e contagens", () => {
  function makeEntry(i: number): OpinionFeedEntry {
    return toOpinionFeedEntry(
      {
        id: `op-${i}`,
        is_anonymous: true,
        content: `Manifestação número ${i} com texto.`,
        category: OPINION_CATEGORIES[i % OPINION_CATEGORIES.length],
        urgency: OPINION_URGENCIES[i % OPINION_URGENCIES.length],
        status: OPINION_STATUSES[i % OPINION_STATUSES.length],
        created_at: new Date(NOWS[1].getTime() - i * 20 * 3_600_000).toISOString(),
        support_count: i,
      },
      NOWS[1],
    )!;
  }

  it("libera recortes só acima do mínimo", () => {
    for (let size = 0; size <= 12; size += 1) {
      const entries = Array.from({ length: size }, (_, i) => makeEntry(i));
      const summary = summarizeOpinionFeed(entries);
      expect(summary.total).toBe(size);
      expect(summary.aggregatesVisible).toBe(size >= OPINION_MIN_AGGREGATE);
      expect(summary.anonymityNotice === null).toBe(size >= OPINION_MIN_AGGREGATE);
      const catSum = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);
      const statSum = Object.values(summary.byStatus).reduce((a, b) => a + b, 0);
      expect(catSum).toBe(size);
      expect(statSum).toBe(size);
      expect(summary.open + summary.byStatus.resolved + summary.byStatus.archived).toBe(size);
      expect(summary.overdue).toBeLessThanOrEqual(size);
    }
  });

  it("ignora entradas inválidas na lista", () => {
    const summary = summarizeOpinionFeed([null, undefined, makeEntry(1)] as never);
    expect(summary.total).toBe(1);
  });

  it("ordena a fila por atraso, urgência e apoio", () => {
    const entries = Array.from({ length: 40 }, (_, i) => makeEntry(i));
    const sorted = sortOpinionQueue(entries);
    expect(sorted).toHaveLength(entries.length);
    const rank = { overdue: 0, due_soon: 1, on_track: 2, closed: 3 } as const;
    for (let i = 1; i < sorted.length; i += 1) {
      expect(rank[sorted[i - 1].sla.state]).toBeLessThanOrEqual(rank[sorted[i].sla.state]);
    }
  });
});

describe("buildOpinionActionPlanSeed", () => {
  it("gera semente 5W2H sem vazar identidade", () => {
    const entry = toOpinionFeedEntry(
      {
        id: "op-9",
        sender_id: SECRET_ID,
        sender_name: "Maria",
        is_anonymous: true,
        subject: "Reconhecimento do time",
        content: "Falta reconhecimento no time comercial.",
        category: "complaint",
        urgency: "high",
        status: "new",
        support_count: 12,
        created_at: NOWS[1].toISOString(),
      },
      NOWS[1],
    )!;
    const seed = buildOpinionActionPlanSeed(entry)!;
    expect(seed.title).toContain("Reconhecimento do time");
    expect(seed.why).toContain("12");
    expect(JSON.stringify(seed)).not.toContain(SECRET_ID);
    expect(JSON.stringify(seed)).not.toContain("Maria");
    expect(buildOpinionActionPlanSeed(null)).toBeNull();
  });
});