import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ROTA_POR_TIPO, resolveNotificationUrl } from "@/lib/notificationUrl";

describe("resolveNotificationUrl", () => {
  it("respeita a rota que a fonte gravou em data.url", () => {
    expect(resolveNotificationUrl("engagement_survey_reminder", { url: "/engajamento" })).toBe(
      "/engajamento",
    );
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
    const rotas = Object.values(ROTA_POR_TIPO);
    expect(rotas.length).toBeGreaterThan(0);
    const ausentes = rotas.filter((rota) => !app.includes(`path="${rota}"`));
    expect(ausentes).toEqual([]);
  });
});