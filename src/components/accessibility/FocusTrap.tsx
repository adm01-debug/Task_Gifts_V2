import { memo, useRef, useEffect, ReactNode, useCallback } from "react";

interface FocusTrapProps {
  children: ReactNode;
  /** Whether the focus trap is active */
  active?: boolean;
  /** Whether to return focus to the element that had focus before the trap was activated */
  returnFocus?: boolean;
  /** Initial focus target selector */
  initialFocus?: string;
  /** Called when trying to escape the trap */
  onEscape?: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]:not([disabled])",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * FocusTrap - Traps keyboard focus within a container (for modals, dialogs)
 */
export const FocusTrap = memo(function FocusTrap({
  children,
  active = true,
  returnFocus = true,
  initialFocus,
  onEscape,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null); // Only visible elements
  }, []);

  // Store previous focus and set initial focus
  useEffect(() => {
    if (!active) return;

    previousFocus.current = document.activeElement as HTMLElement;

    // Set initial focus
    requestAnimationFrame(() => {
      if (!containerRef.current) return;

      if (initialFocus) {
        const target = containerRef.current.querySelector<HTMLElement>(initialFocus);
        if (target) {
          target.focus();
          return;
        }
      }

      // Focus first focusable element
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // Focus container itself if no focusable children
        containerRef.current.focus();
      }
    });

    // Return focus on unmount
    return () => {
      if (returnFocus && previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [active, initialFocus, returnFocus, getFocusableElements]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: move backwards
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: move forwards
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, getFocusableElements, onEscape]);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
});
