import { describe, it, expect } from "vitest";
import {
  ALERT_PHASES,
  applyBossAlert,
  buildBossAlertDedupeKey,
  detectBossAlert,
  type BossAlertPhase,
} from "@/lib/bossAlerts";

/** PRNG determinístico (xorshift) — simulações reprodutíveis. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return Math.abs(s) / 2147483647;
  };
}

const base = { battleId: "b1", battleTitle: "Chefão do Comercial", totalHp: 1000 };

describe("bossAlerts — travessia de fases", () => {
  it("emite o alerta correto em cada limiar", () => {
    expect(detectBossAlert({ ...base, hpBefore: 700, hpAfter: 650 })?.phase).toBe("wounded");
    expect(detectBossAlert({ ...base, hpBefore: 500, hpAfter: 320 })?.phase).toBe("enraged");
    expect(detectBossAlert({ ...base, hpBefore: 200, hpAfter: 90 })?.phase).toBe("critical");
    expect(detectBossAlert({ ...base, hpBefore: 50, hpAfter: 0 })?.phase).toBe("defeated");
  });

  it("emite apenas a fase mais grave quando várias são cruzadas de uma vez", () => {
    const alert = detectBossAlert({ ...base, hpBefore: 1000, hpAfter: 50 });
    expect(alert?.phase).toBe("critical");
    expect(alert?.hpPercent).toBe(5);
  });

  it("não alerta quando o HP sobe ou não muda", () => {
    expect(detectBossAlert({ ...base, hpBefore: 200, hpAfter: 900 })).toBeNull();
    expect(detectBossAlert({ ...base, hpBefore: 200, hpAfter: 200 })).toBeNull();
  });

  it("não alerta em golpes dentro da mesma fase", () => {
    expect(detectBossAlert({ ...base, hpBefore: 900, hpAfter: 800 })).toBeNull();
    expect(detectBossAlert({ ...base, hpBefore: 500, hpAfter: 400 })).toBeNull();
  });

  it("sanitiza entradas inválidas sem lançar", () => {
    expect(detectBossAlert({ ...base, totalHp: 0, hpBefore: 5, hpAfter: 0 })?.phase).toBe("defeated");
    expect(detectBossAlert({ ...base, hpBefore: Number.NaN, hpAfter: 10 })).toBeNull();
    expect(detectBossAlert({ ...base, hpBefore: 5000, hpAfter: -20 })?.phase).toBe("defeated");
    expect(detectBossAlert({ ...base, battleTitle: "   ", hpBefore: 50, hpAfter: 0 })?.message).toContain(
      "O chefão",
    );
  });
});

describe("bossAlerts — idempotência e antisspam", () => {
  it("cada fase notifica no máximo uma vez por batalha (600 batalhas simuladas)", () => {
    const rand = rng(53);
    for (let i = 0; i < 600; i++) {
      const totalHp = 100 + Math.floor(rand() * 4000);
      let hp = totalHp;
      const sent = new Set<string>();
      const counts = new Map<BossAlertPhase, number>();
      let guard = 0;
      while (hp > 0 && guard < 500) {
        guard += 1;
        const hit = 1 + Math.floor(rand() * Math.max(1, totalHp / 8));
        const after = Math.max(0, hp - hit);
        const alert = detectBossAlert({ ...base, totalHp, hpBefore: hp, hpAfter: after });
        const res = applyBossAlert(sent, alert);
        if (res.sent && alert) counts.set(alert.phase, (counts.get(alert.phase) ?? 0) + 1);
        expect(res.duplicate).toBe(false);
        hp = after;
      }
      counts.forEach((n) => expect(n).toBe(1));
      expect(sent.has(buildBossAlertDedupeKey("b1", "defeated"))).toBe(true);
      expect(sent.size).toBeLessThanOrEqual(ALERT_PHASES.length);
    }
  });

  it("reprocesso do mesmo golpe é detectado como duplicata", () => {
    const sent = new Set<string>();
    const input = { ...base, hpBefore: 400, hpAfter: 300 };
    expect(applyBossAlert(sent, detectBossAlert(input)).sent).toBe(true);
    expect(applyBossAlert(sent, detectBossAlert(input))).toEqual({ sent: false, duplicate: true });
  });

  it("oscilação em torno do limiar não gera novo alerta", () => {
    const sent = new Set<string>();
    expect(applyBossAlert(sent, detectBossAlert({ ...base, hpBefore: 340, hpAfter: 330 })).sent).toBe(true);
    expect(applyBossAlert(sent, detectBossAlert({ ...base, hpBefore: 330, hpAfter: 400 })).sent).toBe(false);
    expect(applyBossAlert(sent, detectBossAlert({ ...base, hpBefore: 400, hpAfter: 330 })).duplicate).toBe(true);
  });

  it("chave é pura e estável e a copy é curta o bastante para push", () => {
    expect(buildBossAlertDedupeKey("xyz", "critical")).toBe("boss_phase:xyz:critical");
    ALERT_PHASES.forEach((phase) => {
      const hpAfter = phase === "defeated" ? 0 : phase === "critical" ? 50 : phase === "enraged" ? 300 : 600;
      const alert = detectBossAlert({ ...base, hpBefore: 1000, hpAfter });
      expect(alert!.title.length).toBeLessThanOrEqual(40);
      expect(alert!.message.length).toBeLessThanOrEqual(160);
      expect(alert!.url).toBe("/chefao");
    });
  });
});