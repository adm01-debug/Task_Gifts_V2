import { beforeEach, describe, expect, it, vi } from "vitest";
import { avatarService, type AvatarCategory } from "@/services/avatarService";
import { celebrationsService } from "@/services/celebrationsService";
import { developmentPlanService } from "@/services/developmentPlanService";
import { enpsService } from "@/services/enpsService";
import { nineBoxService } from "@/services/nineBoxService";
import { positionsService } from "@/services/positionsService";
import { quizQuestionsService } from "@/services/quizQuestionsService";
import { weeklyChallengesService } from "@/services/weeklyChallengesService";

const db = vi.hoisted(() => {
  const update = vi.fn(), insert = vi.fn(), select = vi.fn(), eq = vi.fn();
  const maybeSingle = vi.fn(async (): Promise<{ data: { id: string } | null; error: null }> => ({ data: { id: "saved" }, error: null }));
  const single = vi.fn(async () => ({ data: { id: "saved" }, error: null }));
  const response = Promise.resolve({ data: null, error: null });
  const query = { update, insert, select, eq, single, maybeSingle, then: response.then.bind(response) };
  for (const method of [update, insert, select, eq]) method.mockReturnValue(query);
  return { ...query, from: vi.fn(() => query) };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: db.from, auth: { getUser: vi.fn(async () => ({ data: { user: { id: "fixture-user" } }, error: null })) } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  db.maybeSingle.mockResolvedValue({ data: { id: "saved" }, error: null });
});

describe("payloads de atualização respeitam colunas reais", () => {
  const categories: Array<[AvatarCategory, string]> = [
    ["background", "selected_background"], ["frame", "selected_frame"],
    ["accessory", "selected_accessory"], ["effect", "selected_effect"], ["badge_style", "selected_badge_style"],
  ];
  it.each(categories)("avatar %s atualiza somente %s", async (category, column) => {
    await avatarService.updateConfig("fixture-user", category, "item-1");
    expect(db.update).toHaveBeenCalledWith({ [column]: "item-1" });
    expect(db.eq).toHaveBeenCalledWith("user_id", "fixture-user");
  });
  it("avatar novo mantém user_id e permite limpar a seleção", async () => {
    db.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await avatarService.updateConfig("fixture-user", "frame", null);
    expect(db.insert).toHaveBeenCalledWith({ user_id: "fixture-user", selected_frame: null });
  });
  it("datas do perfil não alteram outros campos", async () => {
    await celebrationsService.updateProfileDates("2000-01-01", "2020-01-01");
    expect(db.update).toHaveBeenCalledWith({ birth_date: "2000-01-01", hire_date: "2020-01-01" });
    expect(db.eq).toHaveBeenCalledWith("id", "fixture-user");
  });
  it("não envia update vazio de datas", async () => {
    await celebrationsService.updateProfileDates();
    expect(db.update).not.toHaveBeenCalled();
  });
  it("plano não envia perfil nem lista de ações ao banco", async () => {
    await developmentPlanService.updatePlan("plan", { title: "Título", profiles: { display_name: "Pessoa", avatar_url: null, email: "fixture@example.test" }, actions: [] });
    expect(db.update).toHaveBeenCalledWith({ title: "Título", updated_at: expect.any(String) });
  });
  it("concluir ação preserva progresso automático e remove competência expandida", async () => {
    await developmentPlanService.updateAction("action", { status: "completed", competencies: { name: "Técnica", category: "tech" } });
    expect(db.update).toHaveBeenCalledWith({ status: "completed", updated_at: expect.any(String), completed_at: expect.any(String), progress_percent: 100 });
  });
  it("pesquisa não tenta gravar departamento nem estatísticas derivadas", async () => {
    await enpsService.updateSurvey("survey", { title: "Pesquisa", departments: { name: "Time" }, response_count: 12, enps_score: 40 });
    expect(db.update).toHaveBeenCalledWith({ title: "Pesquisa", updated_at: expect.any(String) });
  });
  it("avaliação não tenta gravar perfil expandido", async () => {
    await nineBoxService.updateEvaluation("evaluation", { performance_score: 3, profiles: { display_name: "Pessoa", avatar_url: null, email: "fixture@example.test" } });
    expect(db.update).toHaveBeenCalledWith({ performance_score: 3, updated_at: expect.any(String) });
  });
  it("cargo não envia join de departamento", async () => {
    await positionsService.updatePosition("position", { name: "Analista", departments: { name: "Time", color: null } });
    expect(db.update).toHaveBeenCalledWith({ name: "Analista" });
  });
  it("modelo de tarefa não envia cargo expandido", async () => {
    await positionsService.updateTaskTemplate("template", { title: "Entrega", positions: { name: "Analista" } });
    expect(db.update).toHaveBeenCalledWith({ title: "Entrega" });
  });
  it("questão preserva a atualização parcial de campos", async () => {
    await quizQuestionsService.updateQuestion("question", { question: "Qual a resposta?", points: 10 });
    expect(db.update).toHaveBeenCalledWith({ question: "Qual a resposta?", points: 10 });
  });
  it.each([true, false])("XP do desafio atualiza o participante correto: %s", async (challenger) => {
    await weeklyChallengesService.updateXpGained("challenge", "fixture-user", challenger, 25);
    expect(db.update).toHaveBeenCalledWith(challenger ? { challenger_xp_gained: 25 } : { opponent_xp_gained: 25 });
  });
});
