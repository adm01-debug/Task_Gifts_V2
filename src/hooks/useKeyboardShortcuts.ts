import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  requiresModifier?: boolean;
}

interface ShortcutGroup {
  label: string;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for keyboard shortcuts
 * Power users can navigate quickly using keyboard combinations
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [isEnabled, setIsEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Navigation shortcuts (G + key)
  const navigationShortcuts: KeyboardShortcut[] = [
    { key: "h", description: "Ir para Home", action: () => navigate("/") },
    { key: "q", description: "Ir para Quests", action: () => navigate("/quest-builder") },
    { key: "t", description: "Ir para Trilhas", action: () => navigate("/trails") },
    { key: "p", description: "Ir para Perfil", action: () => navigate("/profile") },
    { key: "l", description: "Ir para Loja", action: () => navigate("/loja") },
    { key: "d", description: "Ir para Duelos", action: () => navigate("/duelos") },
    { key: "f", description: "Ir para Feed", action: () => navigate("/feed") },
    { key: "c", description: "Ir para Conquistas", action: () => navigate("/conquistas") },
    { key: "m", description: "Ir para Mentoria", action: () => navigate("/mentoria") },
    { key: "z", description: "Ir para Quiz", action: () => navigate("/quiz") },
    { key: "e", description: "Ir para Estatísticas", action: () => navigate("/estatisticas") },
    { key: "a", description: "Ir para Ponto", action: () => navigate("/ponto") },
  ];

  // Action shortcuts (single key or with modifier)
  const actionShortcuts: KeyboardShortcut[] = [
    { 
      key: "?", 
      description: "Mostrar atalhos", 
      action: () => setShowHelp(prev => !prev) 
    },
    { 
      key: "Escape", 
      description: "Fechar modal/voltar", 
      action: () => {
        setShowHelp(false);
        // Could also trigger navigation back
      }
    },
  ];

  const shortcutGroups: ShortcutGroup[] = [
    { label: "Navegação (G + tecla)", shortcuts: navigationShortcuts },
    { label: "Ações", shortcuts: actionShortcuts },
  ];

  // Track if 'G' was pressed for navigation mode
  const [gPressed, setGPressed] = useState(false);
  const [gPressedTimeout, setGPressedTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.contentEditable === "true" ||
      !isEnabled
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    // Handle help shortcut
    if (event.key === "?") {
      event.preventDefault();
      setShowHelp(prev => !prev);
      return;
    }

    // Handle Escape
    if (event.key === "Escape") {
      setShowHelp(false);
      setGPressed(false);
      return;
    }

    // Handle G press for navigation mode
    if (key === "g" && !gPressed) {
      setGPressed(true);
      // Clear previous timeout if exists
      if (gPressedTimeout) {
        clearTimeout(gPressedTimeout);
      }
      // Auto-reset after 1.5 seconds
      const timeout = setTimeout(() => {
        setGPressed(false);
      }, 1500);
      setGPressedTimeout(timeout);
      return;
    }

    // Handle navigation shortcuts (G + key)
    if (gPressed) {
      const shortcut = navigationShortcuts.find(s => s.key === key);
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
        toast.info(`Navegando: ${shortcut.description}`, { duration: 1500 });
        setGPressed(false);
        if (gPressedTimeout) {
          clearTimeout(gPressedTimeout);
        }
      }
    }
  }, [gPressed, gPressedTimeout, isEnabled, navigate, navigationShortcuts]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gPressedTimeout) {
        clearTimeout(gPressedTimeout);
      }
    };
  }, [handleKeyDown, gPressedTimeout]);

  return {
    isEnabled,
    setIsEnabled,
    showHelp,
    setShowHelp,
    shortcutGroups,
    gPressed,
  };
}
