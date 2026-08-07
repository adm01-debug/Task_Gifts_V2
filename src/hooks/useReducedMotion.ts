import { useState, useEffect } from "react";

/**
 * useReducedMotion - Detects user's motion preference
 * 
 * Returns true if the user prefers reduced motion
 * Useful for accessibility and respecting system preferences
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check on initial render (SSR safe)
    if (typeof window === "undefined") return false;
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    return mediaQuery.matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add listener for changes
    mediaQuery.addEventListener("change", handleChange);

    // Sync state with current value
    setPrefersReducedMotion(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * getMotionProps - Helper to conditionally apply motion props
 * 
 * Usage:
 * const motionProps = getMotionProps(prefersReducedMotion, {
 *   animate: { scale: 1.2 },
 *   transition: { duration: 0.3 }
 * });
 */
export function getMotionProps<T extends Record<string, unknown>>(
  prefersReducedMotion: boolean,
  props: T
): T | Record<string, never> {
  if (prefersReducedMotion) {
    return {};
  }
  return props;
}
