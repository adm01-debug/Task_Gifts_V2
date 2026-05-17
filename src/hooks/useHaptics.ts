import { useCallback } from "react";

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "none";

export const useHaptics = () => {
  const vibrate = useCallback((style: HapticStyle = "light") => {
    if (typeof window === "undefined" || !navigator.vibrate) return;

    switch (style) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate(50);
        break;
      case "success":
        navigator.vibrate([10, 30, 10]);
        break;
      case "warning":
        navigator.vibrate([20, 50, 20]);
        break;
      case "error":
        navigator.vibrate([50, 100, 50, 100]);
        break;
      default:
        break;
    }
  }, []);

  return { vibrate };
};

/**
 * Singleton utility for non-hook usage
 */
export const triggerHaptic = (style: HapticStyle = "light") => {
  if (typeof window === "undefined" || !navigator.vibrate) return;
  
  switch (style) {
    case "light":
      navigator.vibrate(10);
      break;
    case "medium":
      navigator.vibrate(20);
      break;
    case "heavy":
      navigator.vibrate(50);
      break;
    case "success":
      navigator.vibrate([10, 30, 10]);
      break;
    case "warning":
      navigator.vibrate([20, 50, 20]);
      break;
    case "error":
      navigator.vibrate([50, 100, 50, 100]);
      break;
    default:
      break;
  }
};