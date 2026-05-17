import { useCallback } from "react";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "none";

export const useHaptics = () => {
  const { settings } = useAccessibility();

  const vibrate = useCallback((style: HapticStyle = "light") => {
    if (typeof window === "undefined" || !navigator.vibrate || !settings.hapticsEnabled) return;

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
  }, [settings.hapticsEnabled]);

  return { vibrate };
};

/**
 * Singleton utility for non-hook usage
 */
export const triggerHaptic = (style: HapticStyle = "light") => {
  if (typeof window === "undefined" || !navigator.vibrate) return;
  
  // Check localStorage for hapticsEnabled (fallback for non-hook usage)
  try {
    const stored = localStorage.getItem("accessibility-settings");
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.hapticsEnabled === false) return;
    }
  } catch (e) {
    // If storage fails, continue with default enabled
  }
  
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