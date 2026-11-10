import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const panels = vi.hoisted(() => ({ group: vi.fn(), panel: vi.fn(), separator: vi.fn() }));
vi.mock("react-resizable-panels", () => ({
  Group: (props: { children?: ReactNode }) => { panels.group(props); return <div>{props.children}</div>; },
  Panel: (props: { children?: ReactNode }) => { panels.panel(props); return <div>{props.children}</div>; },
  Separator: (props: { children?: ReactNode }) => { panels.separator(props); return <div>{props.children}</div>; },
}));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return { ...actual, ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div> };
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("contratos das bibliotecas de UI instaladas", () => {
  it("calendário seleciona uma data e navega para o próximo mês", () => {
    const selected = vi.fn();
    const { container } = render(<Calendar mode="single" defaultMonth={new Date(2026, 0, 1)} onSelect={selected} />);
    const day = container.querySelector('[data-day="2026-01-06"] button');
    expect(day).not.toBeNull();
    fireEvent.click(day!);
    expect(selected.mock.calls[0][0]).toEqual(new Date(2026, 0, 6));
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });
  it("painéis preservam orientação e tamanhos percentuais da API anterior", () => {
    render(<ResizablePanelGroup direction="vertical"><ResizablePanel defaultSize={25} minSize={15} maxSize={80} collapsedSize={5}>Conteúdo</ResizablePanel><ResizableHandle withHandle /></ResizablePanelGroup>);
    expect(panels.group.mock.calls[0][0]).toMatchObject({ orientation: "vertical", "data-panel-group-direction": "vertical" });
    expect(panels.panel.mock.calls[0][0]).toMatchObject({ defaultSize: "25%", minSize: "15%", maxSize: "80%", collapsedSize: "5%" });
    expect(panels.separator.mock.calls[0][0]).toMatchObject({ "data-panel-group-direction": "vertical" });
  });
  it("tooltip entrega o payload inteiro como quinto argumento do formatter", () => {
    const payload = [{ graphicalItemId: "xp", dataKey: "xp", name: "XP", value: 42, color: "#123456", payload: { xp: 42 } }];
    const formatter = vi.fn(() => "42 pontos");
    render(<ChartContainer config={{ xp: { label: "Experiência" } }}><ChartTooltipContent active payload={payload} formatter={formatter} /></ChartContainer>);
    expect(screen.getByText("42 pontos")).toBeInTheDocument();
    expect(formatter).toHaveBeenCalledWith(42, "XP", payload[0], 0, payload);
  });
  it("legenda aceita payload readonly sem perder rótulos e cores", () => {
    const payload = [{ value: "XP", dataKey: "xp", color: "#123456" }] as const;
    render(<ChartContainer config={{ xp: { label: "Experiência" } }}><ChartLegendContent payload={payload} /></ChartContainer>);
    expect(screen.getByText("Experiência")).toBeInTheDocument();
  });
});
