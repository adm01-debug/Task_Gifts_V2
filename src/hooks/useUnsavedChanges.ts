import { useEffect, useCallback, useState } from "react";
import { useBeforeUnload } from "react-router-dom";

/**
 * useUnsavedChanges - Prevents accidental navigation when form has unsaved data
 * 
 * @param isDirty - Whether the form has unsaved changes
 * @param message - Custom warning message
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = "Você tem alterações não salvas. Deseja sair mesmo assim?"
) {
  // Prevent browser tab close / refresh
  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (isDirty) {
          e.preventDefault();
          // Modern browsers ignore custom messages but still show a dialog
          return message;
        }
      },
      [isDirty, message]
    )
  );

  // Native beforeunload for extra safety
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return message;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);
}

/**
 * useFormDirtyState - Track form dirty state easily
 */
export function useFormDirtyState() {
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  return { isDirty, markDirty, markClean, setIsDirty };
}
