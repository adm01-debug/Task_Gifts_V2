import { describe, it, expect } from "vitest";
import { renderHook, render, fireEvent, act } from "@testing-library/react";
import { useState } from "react";
import { useUnsavedChanges, useFormDirtyState } from "@/hooks/useUnsavedChanges";

/**
 * Contrato do guard de alteracoes nao salvas (montado em Mentoria > Missoes):
 *  - digitar no formulario passa a bloquear beforeunload/refresh;
 *  - salvar (que zera os campos) volta a liberar a saida;
 *  - limpo nunca bloqueia.
 */
function fireBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

/** Reproduz o padrao do AdminMissionsTab: sujeira derivada do proprio estado + reset no salvar. */
function MissionDraftForm() {
  const [title, setTitle] = useState("");
  useUnsavedChanges(title.trim() !== "");

  return (
    <>
      <input
        aria-label="Titulo da missao"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="button" onClick={() => setTitle("")}>
        Salvar
      </button>
    </>
  );
}

describe("useUnsavedChanges", () => {
  it("bloqueia beforeunload quando ha alteracoes nao salvas", () => {
    renderHook(() => useUnsavedChanges(true));
    const event = fireBeforeUnload();
    expect(event.defaultPrevented).toBe(true);
  });

  it("nao bloqueia beforeunload quando o formulario esta limpo", () => {
    const { rerender } = renderHook(({ dirty }) => useUnsavedChanges(dirty), {
      initialProps: { dirty: true },
    });
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    rerender({ dirty: false });
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it("remove o listener ao desmontar", () => {
    const { unmount } = renderHook(() => useUnsavedChanges(true));
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it("avisa ao digitar e para de avisar depois de salvar", () => {
    const { getByLabelText, getByRole } = render(<MissionDraftForm />);

    expect(fireBeforeUnload().defaultPrevented).toBe(false);

    fireEvent.change(getByLabelText("Titulo da missao"), {
      target: { value: "Revisar o plano de desenvolvimento" },
    });
    expect(fireBeforeUnload().defaultPrevented).toBe(true);

    fireEvent.click(getByRole("button", { name: "Salvar" }));
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it("mantem o aviso enquanto o formulario continua sujo", () => {
    const { getByLabelText } = render(<MissionDraftForm />);

    fireEvent.change(getByLabelText("Titulo da missao"), { target: { value: "a" } });
    fireEvent.change(getByLabelText("Titulo da missao"), { target: { value: "ab" } });
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it("useFormDirtyState reflete markDirty/markClean", () => {
    const { result } = renderHook(() => useFormDirtyState());
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.markDirty());
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.markClean());
    expect(result.current.isDirty).toBe(false);
  });
});
