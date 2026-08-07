import { useEffect, useRef, RefObject } from "react";

/**
 * useClickOutside - Detects clicks outside of the specified element
 * Useful for closing dropdowns, modals, popovers when clicking outside
 * 
 * @param handler - Callback function to execute when clicking outside
 * @param enabled - Optional flag to enable/disable the listener
 * @returns RefObject to attach to the element you want to detect clicks outside of
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click was outside the ref element
      if (ref.current && !ref.current.contains(target)) {
        handler();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handler();
      }
    };

    // Add listeners with a small delay to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [handler, enabled]);

  return ref;
}
