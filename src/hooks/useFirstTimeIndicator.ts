import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "indicator_first_shown";

interface IndicatorState {
  level: boolean;
  streak: boolean;
  trophy: boolean;
}

const getStoredState = (): IndicatorState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors (e.g., private browsing mode)
  }
  return { level: false, streak: false, trophy: false };
};

const setStoredState = (state: IndicatorState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors (e.g., private browsing mode)
  }
};

export const useFirstTimeIndicator = () => {
  const [shownState, setShownState] = useState<IndicatorState>(getStoredState);
  const [celebrationType, setCelebrationType] = useState<"level" | "streak" | "trophy" | null>(null);

  const checkAndTrigger = useCallback((type: "level" | "streak" | "trophy", value: number) => {
    // Only trigger for valid values
    const isValid = type === "level" ? value > 0 : type === "streak" ? value > 0 : value >= 1 && value <= 3;
    
    if (!isValid) return false;

    if (!shownState[type]) {
      // First time showing this indicator
      setCelebrationType(type);
      const newState = { ...shownState, [type]: true };
      setShownState(newState);
      setStoredState(newState);
      return true;
    }
    return false;
  }, [shownState]);

  const clearCelebration = useCallback(() => {
    setCelebrationType(null);
  }, []);

  // Reset for testing (can be called from console)
  const resetAll = useCallback(() => {
    const newState = { level: false, streak: false, trophy: false };
    setShownState(newState);
    setStoredState(newState);
  }, []);

  // Expose reset function globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as Window & { resetIndicatorCelebrations?: () => void }).resetIndicatorCelebrations = resetAll;
    }
  }, [resetAll]);

  return {
    checkAndTrigger,
    celebrationType,
    clearCelebration,
    resetAll,
  };
};
