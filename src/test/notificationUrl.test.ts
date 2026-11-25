import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROTA_POR_TIPO, resolveNotificationUrl } from "@/lib/notificationUrl";

describe("resolveNotificationUrl", () => {
  it("respeita a rota que a fonte gravou", () => {
    expect(resolveNotificationUrl("engagement_survey_reminder", { url: "/engajamento" })).toBe(
      "/engajamento",
    );
    // RPC antiga do relatorio executivo grava `deep_link`, nao `url`.
    expect(resolveNotificationUrl("info", { deep_link: "/campanhas" })).toBe("/campanhas");
    expect(resolveNotificationUrl("info", { url: "https://exemplo.test/aviso" })).toBe(
      "https://exemplo.test/aviso",
    );
  });

  it("navega o aviso antigo que so gravou o payload de negocio", () => {
    // Estado real de producao: 18 avisos de clima e 9 de leilao sem data.url.
    expect(
      resolveNotificationUrl("climate_survey_reminder", {
        survey_id: "0b7c0d5e-0000-4000-8000-000000000000",
        balde: "2026-11-24",
      }),
    ).toBe("/clima");
    expect(resolveNotificationUrl("auction", { auctionId: "x" })).toBe("/leilao");
  });

  it("leva o aviso ao lugar do assunto, nao a uma pagina vizinha", () => {
    // Desafio semanal e posicao no ranking global so existem no painel inicial.
    expect(resolveNotificationUrl("challenge", { challenge_id: "c1" })).toBe("/");
    expect(resolveNotificationUrl("rank_down", { currentRank: 15 })).toBe("/");
    // O radar de competencias esta no perfil, nao no PDI.
    expect(resolveNotificationUrl("competency_gap", { gaps: [] })).toBe("/profile");
    // Resgate da loja chega como `achievement`: o historico de compras e' o destino.
    expect(resolveNotificationUrl("achievement", { purchase_id: "p1" })).toBe("/loja");
    expect(resolveNotificationUrl("achievement", { achievement: "Primeiros passos" })).toBe(
      "/conquistas",
    );
  });

  it("abre o mes do relatorio executivo anunciado, nao o mais recente", () => {
    expect(resolveNotificationUrl("executive_report", { report_id: "9f1" })).toBe(
      "/admin/executive-report?report=9f1",
    );
    expect(resolveNotificationUrl("executive_report", { deep_link: "/admin/executive-report" })).toBe(
      "/admin/executive-report",
    );
  });

  it("ignora url vazia ou sem tipo string", () => {
    expect(resolveNotificationUrl("climate_survey_reminder", { url: "   " })).toBe("/clima");
    expect(resolveNotificationUrl("auction", { url: 42 })).toBe("/leilao");
  });

  it("nao inventa destino para tipo desconhecido", () => {
    expect(resolveNotificationUrl("tipo_inexistente", { foo: 1 })).toBeNull();
    expect(resolveNotificationUrl("tipo_inexistente")).toBeNull();
  });

  it("so aponta para rotas que existem em App.tsx", () => {
    const app = readFileSync(path.resolve(process.cwd(), "src/App.tsx"), "utf8");
    const rotas = Object.values(ROTA_POR_TIPO).map((rota) => rota.split("?")[0]);
    expect(rotas.length).toBeGreaterThan(0);
    const ausentes = rotas.filter((rota) => !app.includes(`path="${rota}"`));
    expect(ausentes).toEqual([]);
  });
});