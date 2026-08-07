import { useState, useEffect, useRef, useCallback } from "react";

interface ScrollDirectionOptions {
  threshold?: number;
  initialDirection?: "up" | "down";
}

interface ScrollDirectionState {
  direction: "up" | "down";
  isAtTop: boolean;
  scrollY: number;
}

/**
 * useScrollDirection - Detects scroll direction for hiding/showing headers
 * 
 * @param threshold - Minimum scroll distance before direction change (default: 10)
 * @param initialDirection - Initial direction state (default: "up")
 * 
 * @returns { direction, isAtTop, scrollY }
 */
export function useScrollDirection({
  threshold = 10,
  initialDirection = "up",
}: ScrollDirectionOptions = {}): ScrollDirectionState {
  const [direction, setDirection] = useState<"up" | "down">(initialDirection);
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    setScrollY(currentScrollY);
    setIsAtTop(currentScrollY < 10);

    const diff = currentScrollY - lastScrollY.current;

    // Only update direction if we've scrolled past the threshold
    if (Math.abs(diff) >= threshold) {
      const newDirection = diff > 0 ? "down" : "up";
      
      if (newDirection !== direction) {
        setDirection(newDirection);
      }
      
      lastScrollY.current = currentScrollY;
    }
    
    ticking.current = false;
  }, [threshold, direction]);

  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    
    // Initialize on mount
    updateScrollDirection();

    return () => window.removeEventListener("scroll", onScroll);
  }, [updateScrollDirection]);

  return { direction, isAtTop, scrollY };
}

/**
 * useHiddenHeader - Simplified hook for header visibility
 * Returns true when header should be hidden
 */
export function useHiddenHeader(threshold = 10): boolean {
  const { direction, isAtTop } = useScrollDirection({ threshold });
  
  // Show header when at top or scrolling up
  return !isAtTop && direction === "down";
}
