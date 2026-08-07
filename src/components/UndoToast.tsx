import { toast } from "sonner";
import { Undo2 } from "lucide-react";

interface UndoToastOptions {
  message: string;
  undoLabel?: string;
  duration?: number;
  onUndo: () => void | Promise<void>;
}

/**
 * Shows a toast with an undo button for reversible actions
 * 
 * Usage:
 * ```ts
 * showUndoToast({
 *   message: "Duelo cancelado",
 *   onUndo: async () => {
 *     await restoreDuel(duelId);
 *   }
 * });
 * ```
 */
export function showUndoToast({
  message,
  undoLabel = "Desfazer",
  duration = 5000,
  onUndo,
}: UndoToastOptions) {
  let undone = false;

  const toastId = toast(message, {
    duration,
    action: {
      label: undoLabel,
      onClick: async () => {
        if (undone) return;
        undone = true;
        
        try {
          await onUndo();
          toast.success("Ação desfeita!");
        } catch {
          toast.error("Erro ao desfazer ação");
        }
      },
    },
    icon: <Undo2 className="w-4 h-4" />,
  });

  return toastId;
}

// Helper for common undo scenarios
export const undoToasts = {
  deleted: (itemName: string, onUndo: () => void | Promise<void>) =>
    showUndoToast({
      message: `${itemName} removido`,
      onUndo,
    }),

  cancelled: (itemName: string, onUndo: () => void | Promise<void>) =>
    showUndoToast({
      message: `${itemName} cancelado`,
      onUndo,
    }),

  archived: (itemName: string, onUndo: () => void | Promise<void>) =>
    showUndoToast({
      message: `${itemName} arquivado`,
      onUndo,
    }),

  moved: (itemName: string, destination: string, onUndo: () => void | Promise<void>) =>
    showUndoToast({
      message: `${itemName} movido para ${destination}`,
      onUndo,
    }),
};
