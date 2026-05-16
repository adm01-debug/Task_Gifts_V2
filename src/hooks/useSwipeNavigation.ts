import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

 import { useSmartBack } from "./useNavigationHelpers";
 import { useHapticFeedback } from "./useHapticFeedback";
 
 /**
  * useSwipeNavigation - Adds edge swipe gesture support for back navigation
  */
 export function useSwipeNavigation(threshold = 50, edgeSize = 30) {
   const { goBack } = useSmartBack();
   const haptic = useHapticFeedback();
  const navigate = useNavigate();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only trigger if starting near the left edge
      if (touch.clientX < edgeSize) {
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = Math.abs(touch.clientY - touchStart.current.y);

       // Horizontal swipe to the right, with minimal vertical movement
       if (deltaX > threshold && deltaY < threshold) {
         haptic.trigger("medium");
         goBack();
       }

      touchStart.current = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, threshold, edgeSize]);
}
