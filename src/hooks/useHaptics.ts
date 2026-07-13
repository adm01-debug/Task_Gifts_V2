import { useCallback } from "react";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";

export type HapticStyle =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection"
  | "none";

interface HapticOptions {
  pattern?: number | number[];
  fallbackVibration?: number;
}

/**
 * Predefined vibration patterns (ms). Kept in one place so accessibility
 * gating and consumers stay consistent across the app.
 */
const STYLE_PATTERNS: Record<Exclude<HapticStyle, "none">, number | number[]> = {
  selection: 10,
  light: 15,
  medium: 30,
  heavy: 50,
  success: [30, 50, 30],
  warning: [20, 30, 20, 30, 20],
  error: [100],
};

const isVibrationSupported = () =>
  typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

const isHapticsEnabledFallback = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem("accessibility-settings");
    if (!stored) return true;
    const parsed = JSON.parse(stored) as { hapticsEnabled?: boolean };
    return parsed.hapticsEnabled !== false;
  } catch {
    return true;
  }
};

/**
 * Central haptic feedback hook. Every vibration is gated by the user's
 * accessibility preference (`hapticsEnabled`). Exposes both the low-level
 * primitives (`vibrate`, `trigger`) and gamification helpers.
 */
export const useHaptics = () => {
  const { settings } = useAccessibility();
  const isSupported = isVibrationSupported();

  const vibrate = useCallback(
    (pattern: number | number[] | HapticStyle): boolean => {
      if (!isSupported || !settings.hapticsEnabled) return false;
      if (typeof pattern === "string") {
        if (pattern === "none") return false;
        const stylePattern = STYLE_PATTERNS[pattern];
        if (stylePattern === undefined) return false;
        try {
          return navigator.vibrate(stylePattern);
        } catch {
          return false;
        }
      }
      try {
        return navigator.vibrate(pattern);
      } catch {
        return false;
      }
    },
    [isSupported, settings.hapticsEnabled],
  );

  const trigger = useCallback(
    (style: HapticStyle = "light", options?: HapticOptions): boolean => {
      if (style === "none") return false;
      if (options?.pattern !== undefined) return vibrate(options.pattern);
      const pattern = STYLE_PATTERNS[style] ?? options?.fallbackVibration ?? 20;
      return vibrate(pattern);
    },
    [vibrate],
  );

  // Gamification helpers
  const xpGained = useCallback(
    (amount: number) => {
      if (amount >= 100) return trigger("success");
      if (amount >= 50) return trigger("medium");
      return trigger("light");
    },
    [trigger],
  );

  const levelUp = useCallback(
    () => vibrate([50, 100, 50, 100, 50, 100, 100]),
    [vibrate],
  );

  const achievementUnlocked = useCallback(
    () => vibrate([30, 50, 30, 50, 30, 100, 50, 50]),
    [vibrate],
  );

  const questCompleted = useCallback(() => trigger("success"), [trigger]);

  const streakMilestone = useCallback(
    (days: number) => {
      if (days >= 30) return vibrate([50, 50, 50, 50, 50, 100, 100]);
      if (days >= 7) return vibrate([30, 50, 30, 50, 100]);
      return trigger("success");
    },
    [vibrate, trigger],
  );

  const comboMultiplier = useCallback(
    (multiplier: number) => {
      const pulses = Math.max(1, Math.min(multiplier, 5));
      const pattern = Array.from({ length: pulses }, () => [20, 30]).flat();
      return vibrate(pattern);
    },
    [vibrate],
  );

  const buttonPress = useCallback(() => trigger("selection"), [trigger]);
  const error = useCallback(() => trigger("error"), [trigger]);
  const coinCollected = useCallback(() => trigger("light"), [trigger]);
  const duelWon = useCallback(
    () => vibrate([50, 100, 50, 100, 50, 200]),
    [vibrate],
  );
  const kudosReceived = useCallback(() => trigger("medium"), [trigger]);

  return {
    isSupported,
    vibrate,
    trigger,
    xpGained,
    levelUp,
    achievementUnlocked,
    questCompleted,
    streakMilestone,
    comboMultiplier,
    buttonPress,
    error,
    coinCollected,
    duelWon,
    kudosReceived,
  };
};

/**
 * @deprecated Use `useHaptics` instead. Kept as an alias so legacy callers
 * (`useHapticFeedback`) continue to compile during the migration window.
 */
export const useHapticFeedback = useHaptics;

/**
 * Singleton utility for non-hook usage (e.g. one-off calls from event
 * handlers outside React). Respects the accessibility preference via a
 * localStorage fallback because the AccessibilityProvider is React-only.
 */
export const triggerHaptic = (style: HapticStyle = "light"): boolean => {
  if (!isVibrationSupported() || !isHapticsEnabledFallback()) return false;
  if (style === "none") return false;
  const pattern = STYLE_PATTERNS[style] ?? 15;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
};
