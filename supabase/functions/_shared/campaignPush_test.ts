// Testes Deno da chave de dedupe dos avisos de campanha. Rodam no CI pelo workflow
// deno.yml (job "Tipos e testes das Edge Functions"); local: `bun run test:edge`.
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { campaignPushDedupeKey, truncateCodePoints } from "./campaignPush.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const OUTRO = "33333333-3333-4333-8333-333333333333";

const base = {
  campaignId: "22222222-2222-4222-8222-222222222222",
  type: "campaign_milestone",
  title: "Marco de 25%",
  message: "Equipe A chegou a 25% da meta",
  url: "/campanhas/22222222",
};

/** Surrogate solto (metade de um par UTF-16): o Postgres recusa esse texto. */
const SURROGATE_SOLTO = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

Deno.test("os quatro avisos da mesma campanha geram quatro chaves distintas", () => {
  const chaves = [
    campaignPushDedupeKey(base, USER),
    campaignPushDedupeKey(
      { ...base, title: "Marco de 50%", message: "Equipe A chegou a 50% da meta" },
      USER,
    ),
    campaignPushDedupeKey(
      { ...base, title: "Marco de 75%", message: "Equipe A chegou a 75% da meta" },
      USER,
    ),
    campaignPushDedupeKey(
      { ...base, type: "campaign_completed", title: "Meta concluida", message: "Equipe A bateu a meta" },
      USER,
    ),
  ];
  assertEquals(new Set(chaves).size, 4);
});

Deno.test("o mesmo aviso, para a mesma pessoa, repete a chave (dedupe legitimo)", () => {
  assertEquals(campaignPushDedupeKey(base, USER), campaignPushDedupeKey({ ...base }, USER));
});

Deno.test("pessoas diferentes nunca compartilham a chave", () => {
  assertNotEquals(campaignPushDedupeKey(base, USER), campaignPushDedupeKey(base, OUTRO));
});

Deno.test("campanha sem id continua distinguindo o conteudo", () => {
  const semCampanha = { ...base, campaignId: null };
  assertNotEquals(
    campaignPushDedupeKey(semCampanha, USER),
    campaignPushDedupeKey({ ...semCampanha, title: "Outro marco" }, USER),
  );
});

Deno.test("titulo gigante e' cortado, mas o uuid do usuario nunca", () => {
  const gigante = { ...base, title: "T".repeat(400), message: "M".repeat(400) };
  const chave = campaignPushDedupeKey(gigante, USER);
  assert(chave.endsWith(`:${USER}`));
  assert(chave.length <= 200);
  assertNotEquals(chave, campaignPushDedupeKey(gigante, OUTRO));
  assertNotEquals(
    chave,
    campaignPushDedupeKey({ ...gigante, campaignId: "44444444-4444-4444-8444-444444444444" }, USER),
  );
});

Deno.test("emoji na posicao do corte nao deixa surrogate solto na chave", () => {
  // O corte cai no meio de uma sequencia de emojis; a variacao em `extra` desloca
  // o corte para dentro de um par (o defeito antigo) e para fora dele.
  for (let extra = 0; extra < 12; extra++) {
    const titulo = `${"A".repeat(extra)}${"🏆".repeat(200)}`;
    const chave = campaignPushDedupeKey({ ...base, title: titulo, message: "" }, USER);
    assert(
      !SURROGATE_SOLTO.test(chave),
      `surrogate solto na chave (extra=${extra}): ${JSON.stringify(chave)}`,
    );
    assert(chave.endsWith(`:${USER}`));
    // A base foi mesmo cortada no teto (senao o caso nao testa nada).
    assertEquals(Array.from(chave).length, 150 + 1 + USER.length);
  }
});

Deno.test("corte por ponto de codigo preserva o texto quando cabe", () => {
  assertEquals(truncateCodePoints("🏆 meta", 10), "🏆 meta");
  assertEquals(truncateCodePoints("🏆🏆🏆", 2), "🏆🏆");
  assert(!SURROGATE_SOLTO.test(truncateCodePoints("🏆🏆🏆", 2)));
});

Deno.test("mesmo marco com outro texto nao duplica o aviso", () => {
  const comMarco = { ...base, marker: 50 };
  const primeiro = campaignPushDedupeKey(comMarco, USER);
  const depoisDoAjuste = campaignPushDedupeKey(
    { ...comMarco, title: "Marco de 50% em outra equipe", message: "Agora 12/20", url: "/outro" },
    USER,
  );
  assertEquals(primeiro, depoisDoAjuste);
  assertStringIncludes(primeiro, "|50:");
  // Marcos diferentes continuam distintos, e o uuid segue no fim.
  assertNotEquals(primeiro, campaignPushDedupeKey({ ...comMarco, marker: 75 }, USER));
  assertEquals(primeiro, campaignPushDedupeKey(comMarco, USER));
  assert(!primeiro.includes("Outra equipe"));
});

Deno.test("sem marco a chave volta a depender do conteudo", () => {
  assertNotEquals(
    campaignPushDedupeKey(base, USER),
    campaignPushDedupeKey({ ...base, message: "outro total" }, USER),
  );
});