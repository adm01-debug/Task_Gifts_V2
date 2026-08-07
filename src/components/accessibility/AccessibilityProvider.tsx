import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, forwardRef } from "react";

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "normal" | "large" | "larger";
  focusVisible: boolean;
  screenReaderMode: boolean;
  hapticsEnabled: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  toggleSetting: (key: keyof Omit<AccessibilitySettings, "fontSize">) => void;
  resetSettings: () => void;
  announceToScreenReader: (message: string, priority?: "polite" | "assertive") => void;
}

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  fontSize: "normal",
  focusVisible: true,
  screenReaderMode: false,
  hapticsEnabled: true,
};

const STORAGE_KEY = "accessibility-settings";

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function AccessibilityProvider({ children }, _ref) {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
      } catch {
        return defaultSettings;
      }
    });

    // Detect system preferences
    useEffect(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const prefersHighContrast = window.matchMedia("(prefers-contrast: more)");

      const handleMotionChange = (e: MediaQueryListEvent) => {
        setSettings((prev) => ({ ...prev, reducedMotion: e.matches }));
      };

      const handleContrastChange = (e: MediaQueryListEvent) => {
        setSettings((prev) => ({ ...prev, highContrast: e.matches }));
      };

      // Set initial values from system preferences if no stored settings
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setSettings((prev) => ({
          ...prev,
          reducedMotion: prefersReducedMotion.matches,
          highContrast: prefersHighContrast.matches,
        }));
      }

      prefersReducedMotion.addEventListener("change", handleMotionChange);
      prefersHighContrast.addEventListener("change", handleContrastChange);

      return () => {
        prefersReducedMotion.removeEventListener("change", handleMotionChange);
        prefersHighContrast.removeEventListener("change", handleContrastChange);
      };
    }, []);

    // Persist settings
    useEffect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Ignore storage errors
      }
    }, [settings]);

    // Apply settings to document
    useEffect(() => {
      const root = document.documentElement;

      // Reduced motion
      if (settings.reducedMotion) {
        root.classList.add("reduce-motion");
      } else {
        root.classList.remove("reduce-motion");
      }

      // High contrast
      if (settings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      // Font size
      root.classList.remove("font-large", "font-larger");
      if (settings.fontSize === "large") {
        root.classList.add("font-large");
      } else if (settings.fontSize === "larger") {
        root.classList.add("font-larger");
      }

      // Focus visible
      if (settings.focusVisible) {
        root.classList.add("focus-visible-enabled");
      } else {
        root.classList.remove("focus-visible-enabled");
      }
    }, [settings]);

    const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K]
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const toggleSetting = useCallback((key: keyof Omit<AccessibilitySettings, "fontSize">) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const resetSettings = useCallback(() => {
      setSettings(defaultSettings);
      localStorage.removeItem(STORAGE_KEY);
    }, []);

    const announceToScreenReader = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, []);

    return (
      <AccessibilityContext.Provider
        value={{
          settings,
          updateSetting,
          toggleSetting,
          resetSettings,
          announceToScreenReader,
        }}
      >
        {children}
      </AccessibilityContext.Provider>
    );
  }
);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}
