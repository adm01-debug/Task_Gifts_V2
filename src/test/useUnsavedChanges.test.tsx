import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedChanges, useFormDirtyState } from "@/hooks/useUnsavedChanges";

/**
 * Contrato do guard de alteracoes nao salvas (agora montado em Mentoria > Missoes):
 *  - formulario sujo bloqueia beforeunload/refresh;
 *  - formulario limpo nao bloqueia;
 *  - limpar depois de sujo volta a liberar a saida.
 */
function fireBeforeUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
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

  it("useFormDirtyState reflete markDirty/markClean", () => {
    const { result } = renderHook(() => useFormDirtyState());
    expect(result.current.isDirty).toBe(false);

    act(() => result.current.markDirty());
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.markClean());
    expect(result.current.isDirty).toBe(false);
  });
});