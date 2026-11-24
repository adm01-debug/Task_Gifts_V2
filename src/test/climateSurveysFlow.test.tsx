import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClimateSurveyAnswerForm } from "@/components/climate/ClimateSurveyAnswerForm";
import { ClimateSurveyForm } from "@/components/climate/ClimateSurveyForm";
import { ClimateSurveyResults } from "@/components/climate/ClimateSurveyResults";
import { ClimateSurveyQuestions } from "@/components/climate/ClimateSurveyQuestions";
import type { ClimateSurvey, ClimateSurveyQuestion } from "@/services/climateSurveyService";

const h = vi.hoisted(() => ({
  enps: { data: undefined as unknown, isLoading: false, isError: false },
  pillars: { data: undefined as unknown, isLoading: false, isError: false },
  mutate: vi.fn(),
  recalcPending: false,
}));

vi.mock("@/hooks/useClimateSurveys", () => ({
  useENPS: () => h.enps,
  usePillarScores: () => h.pillars,
  useRecalculatePillarScores: () => ({ mutate: h.mutate, isPending: h.recalcPending }),
}));

vi.mock("@/components/engagement/diagnostics/AnonymityGuardNotice", () => ({
  AnonymityGuardNotice: ({ context }: { context: string }) => (
    <p data-testid="aviso-anonimato">{context}</p>
  ),
}));

const survey = (over: Partial<ClimateSurvey> = {}) =>
  ({
    id: "s1",
    title: "Clima Q4",
    allow_skip: true,
    is_anonymous: true,
    ...over,
  }) as unknown as ClimateSurvey;

const question = (over: Partial<ClimateSurveyQuestion> = {}) =>
  ({
    id: "q1",
    survey_id: "s1",
    pillar: "peers",
    question_text: "Como você avalia a colaboração do time?",
    question_type: "likert_5",
    options: null,
    is_required: true,
    order_index: 0,
    created_at: "2026-01-01T00:00:00Z",
    ...over,
  }) as unknown as ClimateSurveyQuestion;

beforeEach(() => {
  h.enps = { data: undefined, isLoading: false, isError: false };
  h.pillars = { data: [], isLoading: false, isError: false };
  h.mutate = vi.fn();
  h.recalcPending = false;
});

describe("ClimateSurveyAnswerForm", () => {
  it("envia a nota escolhida para cada pergunta respondida", () => {
    const onSubmit = vi.fn();
    render(
      <ClimateSurveyAnswerForm
        survey={survey()}
        questions={[question()]}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getByLabelText("4"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar respostas" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toEqual([{ questionId: "q1", score: 4, textAnswer: undefined }]);
  });

  it("bloqueia o envio quando nenhuma pergunta foi respondida", () => {
    const onSubmit = vi.fn();
    render(
      <ClimateSurveyAnswerForm
        survey={survey()}
        questions={[question()]}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Enviar respostas" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Responda ao menos uma pergunta antes de enviar.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("quando a pesquisa não permite pular, cobra todas as perguntas obrigatórias", () => {
    const onSubmit = vi.fn();
    render(
      <ClimateSurveyAnswerForm
        survey={survey({ allow_skip: false })}
        questions={[question(), question({ id: "q2", order_index: 1, pillar: "leadership" })]}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />,
    );

    fireEvent.click(screen.getAllByLabelText("5")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Enviar respostas" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Esta pesquisa não permite pular perguntas. Faltam 1 resposta(s).");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("desabilita o envio enquanto a resposta está sendo gravada", () => {
    render(
      <ClimateSurveyAnswerForm
        survey={survey()}
        questions={[question()]}
        isSubmitting
        onSubmit={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});

describe("ClimateSurveyForm", () => {
  it("exige título antes de criar", () => {
    const onSubmit = vi.fn();
    render(<ClimateSurveyForm creatorId="u1" isSubmitting={false} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Criar pesquisa" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Informe um título para a pesquisa.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("recusa período com encerramento anterior ao início", () => {
    const onSubmit = vi.fn();
    render(<ClimateSurveyForm creatorId="u1" isSubmitting={false} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Clima Q4" } });
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-05-10" } });
    fireEvent.change(screen.getByLabelText("Encerramento"), { target: { value: "2026-05-09" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar pesquisa" }));

    expect(screen.getByRole("alert")).toHaveTextContent("A data de encerramento precisa ser posterior à data de início.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cria a pesquisa como rascunho com o período e o criador informados", () => {
    const onSubmit = vi.fn();
    render(<ClimateSurveyForm creatorId="u1" isSubmitting={false} onSubmit={onSubmit} onCancel={() => {}} />);

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "  Clima Q4  " } });
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-05-10" } });
    fireEvent.change(screen.getByLabelText("Encerramento"), { target: { value: "2026-05-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar pesquisa" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: "Clima Q4",
      status: "draft",
      survey_type: "monthly",
      is_anonymous: true,
      allow_skip: true,
      created_by: "u1",
      department_id: null,
    });
    // Compara com o mesmo cálculo local do componente: asserção por string fixa
    // quebra em fuso à frente de UTC.
    expect(payload.starts_at).toBe(new Date("2026-05-10T00:00:00").toISOString());
    expect(payload.ends_at).toBe(new Date("2026-05-17T23:59:59.999").toISOString());
  });
});

describe("ClimateSurveyQuestions", () => {
  const renderQuestions = (over: {
    questions?: ClimateSurveyQuestion[];
    survey?: ClimateSurvey;
    onAdd?: Mock<(question: Omit<ClimateSurveyQuestion, "id" | "created_at">) => void>;
  } = {}) => {
    const onAdd: Mock<(question: Omit<ClimateSurveyQuestion, "id" | "created_at">) => void> =
      over.onAdd ?? vi.fn();
    render(
      <ClimateSurveyQuestions
        survey={over.survey ?? survey({ status: "draft" })}
        questions={over.questions ?? []}
        canManage
        isAdding={false}
        isRemoving={false}
        onAdd={onAdd}
        onRemove={() => {}}
      />,
    );
    return onAdd;
  };

  it("continua a numeração a partir do maior índice já usado", () => {
    const onAdd = renderQuestions({
      questions: [
        question({ id: "q1", order_index: 1 }),
        question({ id: "q3", order_index: 3 }),
      ],
    });

    fireEvent.change(screen.getByLabelText("Pergunta"), { target: { value: "Nova pergunta" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar pergunta" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    // length + 1 daria 3, colidindo com a pergunta existente e jogando a nova no meio.
    expect(onAdd.mock.calls[0][0].order_index).toBe(4);
  });

  it("avisa quando o texto da pergunta está vazio", () => {
    const onAdd = renderQuestions();

    fireEvent.click(screen.getByRole("button", { name: "Adicionar pergunta" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Escreva o texto da pergunta.");
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("trava a edição das perguntas fora do rascunho", () => {
    renderQuestions({ survey: survey({ status: "active" }) });

    expect(screen.queryByLabelText("Pergunta")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remover pergunta/ })).not.toBeInTheDocument();
    expect(screen.getByText("Perguntas travadas após a publicação")).toBeInTheDocument();
  });
});

describe("ClimateSurveyResults", () => {
  it("esconde o eNPS enquanto a amostra mínima não é atingida", () => {
    h.enps = {
      data: { survey_id: "s1", enps: 0, promoters: 0, passives: 0, detractors: 0, response_count: 4, min_responses: 5, suppressed: true },
      isLoading: false,
      isError: false,
    };

    render(<ClimateSurveyResults surveyId="s1" />);

    expect(screen.queryByText("eNPS")).not.toBeInTheDocument();
    expect(screen.getByTestId("aviso-anonimato")).toHaveTextContent("4 resposta(s) registrada(s) até agora.");
  });

  it("mostra o eNPS e a divisão de promotores, neutros e detratores", () => {
    h.enps = {
      data: { survey_id: "s1", enps: 62, promoters: 7, passives: 2, detractors: 1, response_count: 10, min_responses: 5, suppressed: false },
      isLoading: false,
      isError: false,
    };

    render(<ClimateSurveyResults surveyId="s1" />);

    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/10 resposta\(s\) — mínimo de 5 para divulgar/)).toBeInTheDocument();
  });

  it("ordena os pilares do maior para o menor score", () => {
    h.pillars = {
      data: [
        { id: "p1", survey_id: "s1", pillar: "peers", score: 40, response_count: 6, department_id: null },
        { id: "p2", survey_id: "s1", pillar: "leadership", score: 90, response_count: 8, department_id: null },
      ],
      isLoading: false,
      isError: false,
    };

    render(<ClimateSurveyResults surveyId="s1" />);

    const notas = screen.getAllByText(/^\d+\.\d$/).map((el) => el.textContent);
    expect(notas).toEqual(["90.0", "40.0"]);
    expect(screen.getByText("8 respostas")).toBeInTheDocument();
    expect(screen.getByText("6 respostas")).toBeInTheDocument();
  });

  it("explica o estado vazio quando nenhum pilar foi calculado", () => {
    h.pillars = { data: [], isLoading: false, isError: false };

    render(<ClimateSurveyResults surveyId="s1" />);

    expect(screen.getByText(/Nenhum pilar calculado ainda/)).toBeInTheDocument();
  });

  it("avisa quando o motor de resultados não está disponível no ambiente", () => {
    h.pillars = { data: undefined, isLoading: false, isError: true };

    render(<ClimateSurveyResults surveyId="s1" />);

    expect(screen.getByText("Motor de resultados indisponível")).toBeInTheDocument();
  });

  it("pede o recálculo dos pilares da pesquisa exibida", () => {
    render(<ClimateSurveyResults surveyId="s1" />);

    fireEvent.click(screen.getByRole("button", { name: /Recalcular resultados/ }));

    expect(h.mutate).toHaveBeenCalledWith({ surveyId: "s1" });
  });
});