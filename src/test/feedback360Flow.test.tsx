import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { aggregateFeedbackSummary } from "@/services/feedbackService";
import type { FeedbackCycle } from "@/services/feedbackService";
import { FeedbackSummaryCard } from "@/components/feedback/FeedbackSummaryCard";
import { FeedbackRequestForm } from "@/components/feedback/FeedbackRequestForm";

const h = vi.hoisted(() => ({
  createRequest: vi.fn(),
  userId: "user-1" as string | undefined,
  summary: {
    isLoading: false,
    isError: false,
    data: undefined as unknown,
    refetch: () => {},
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: h.userId ? { id: h.userId } : null }),
}));

vi.mock("@/hooks/useProfiles", () => ({
  useProfiles: () => ({
    data: [
      { id: "user-1", display_name: "Ana", email: null },
      { id: "user-2", display_name: "Bruno", email: null },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useFeedback360", () => ({
  useFeedback360: () => ({ createRequest: h.createRequest }),
  useFeedbackSummary: () => h.summary,
}));

const emptySummary = {
  avgRating: 0,
  totalResponses: 0,
  byRelationship: {},
  commonStrengths: [],
  commonImprovements: [],
};

beforeEach(() => {
  h.createRequest.mockClear();
  h.userId = "user-1";
  h.summary = { isLoading: false, isError: false, data: emptySummary, refetch: () => {} };
});

describe("aggregateFeedbackSummary", () => {
  it("ranks repeated comments by real frequency, ignoring case and extra spaces", () => {
    const summary = aggregateFeedbackSummary([
      {
        relationship: "peer",
        responses: [
          { overall_rating: 5, strengths: "Comunica bem", improvements: null },
          { overall_rating: 4, strengths: "comunica  bem", improvements: "Delegar mais" },
        ],
      },
      {
        relationship: "manager",
        responses: [
          { overall_rating: 4, strengths: "Comunica bem", improvements: "Delegar mais" },
        ],
      },
    ]);

    // "Comunica bem" aparece 3x (grafia da 1a ocorrencia preservada) e vem antes dos citados 1x.
    expect(summary.commonStrengths[0]).toBe("Comunica bem");
    expect(summary.commonImprovements[0]).toBe("Delegar mais");
    expect(summary.avgRating).toBe(4.3);
    expect(summary.totalResponses).toBe(3);
    expect(summary.byRelationship.peer).toEqual({ count: 2, avgRating: 4.5 });
    expect(summary.byRelationship.manager).toEqual({ count: 1, avgRating: 4 });
  });

  it("caps the ranking at the 5 most cited comments", () => {
    const responses = Array.from({ length: 6 }, (_, index) => ({
      overall_rating: 5,
      strengths: `Comentario ${index}`,
      improvements: null,
    }));
    responses.push({ overall_rating: 5, strengths: "Comentario 5", improvements: null });

    const summary = aggregateFeedbackSummary([{ relationship: "peer", responses }]);

    expect(summary.commonStrengths).toHaveLength(5);
    expect(summary.commonStrengths[0]).toBe("Comentario 5");
  });

  it("computes average and breakdown by relationship", () => {
    const summary = aggregateFeedbackSummary([
      { relationship: "peer", responses: [{ overall_rating: 5, strengths: null, improvements: null }] },
      { relationship: "peer", responses: [{ overall_rating: 4, strengths: null, improvements: null }] },
      { relationship: "self", responses: [{ overall_rating: 3, strengths: null, improvements: null }] },
    ]);

    expect(summary.avgRating).toBe(4);
    expect(summary.totalResponses).toBe(3);
    expect(summary.byRelationship).toEqual({
      peer: { count: 2, avgRating: 4.5 },
      self: { count: 1, avgRating: 3 },
    });
  });

  it("keeps comment-only responses out of the rating average", () => {
    const summary = aggregateFeedbackSummary([
      {
        relationship: "peer",
        responses: [{ overall_rating: null, strengths: "Ajuda o time", improvements: "Falar mais" }],
      },
    ]);

    expect(summary.totalResponses).toBe(0);
    expect(summary.avgRating).toBe(0);
    expect(summary.commonStrengths).toEqual(["Ajuda o time"]);
    expect(summary.commonImprovements).toEqual(["Falar mais"]);
  });

  it("returns an empty summary when there are no requests", () => {
    expect(aggregateFeedbackSummary([])).toEqual(emptySummary);
  });
});

describe("FeedbackSummaryCard", () => {
  it("shows the consolidated average, the breakdown and the top comments", () => {
    h.summary = {
      isLoading: false,
      isError: false,
      refetch: () => {},
      data: {
        avgRating: 4.5,
        totalResponses: 3,
        byRelationship: { peer: { count: 2, avgRating: 5 } },
        commonStrengths: ["Comunica bem"],
        commonImprovements: ["Delegar mais"],
      },
    };

    render(<FeedbackSummaryCard />);

    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/Pares: 5.0 \(2\)/)).toBeInTheDocument();
    expect(screen.getByText("Comunica bem")).toBeInTheDocument();
    expect(screen.getByText("Delegar mais")).toBeInTheDocument();
  });

  it("shows the empty state when nothing was received", () => {
    render(<FeedbackSummaryCard />);

    expect(screen.getByText("Nenhum feedback recebido ainda")).toBeInTheDocument();
  });

  it("offers a retry when the summary query fails", () => {
    h.summary = { isLoading: false, isError: true, data: undefined, refetch: () => {} };

    render(<FeedbackSummaryCard />);

    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});

describe("FeedbackRequestForm", () => {
  const cycles = [{ id: "cycle-1", name: "Ciclo 2026" }] as unknown as FeedbackCycle[];

  it("guides the manager when there is no active cycle", () => {
    render(<FeedbackRequestForm open onOpenChange={() => {}} cycles={[]} />);

    expect(screen.getByText(/Nenhum ciclo ativo/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar pedido" })).toBeDisabled();
  });

  it("blocks submit until a cycle is chosen", () => {
    render(<FeedbackRequestForm open onOpenChange={() => {}} cycles={cycles} />);

    fireEvent.click(screen.getByRole("button", { name: "Criar pedido" }));

    expect(screen.getByText("Escolha o ciclo de feedback.")).toBeInTheDocument();
    expect(h.createRequest).not.toHaveBeenCalled();
  });
});