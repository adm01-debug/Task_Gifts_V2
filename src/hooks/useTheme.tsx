import { createContext, useContext, useEffect, useState, ReactNode, forwardRef } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = "task-gifts-theme";

export const ThemeProvider = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function ThemeProvider({ children }, _ref) {
    const [theme, setThemeState] = useState<Theme>(() => {
      // Check localStorage first
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
          return stored;
        }
        // Check system preference
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          return "dark";
        }
      }
      return "dark"; // Default to dark for gaming theme
    });

    useEffect(() => {
      const root = window.document.documentElement;
      
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent) => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        // Only auto-switch if user hasn't set a preference
        if (!stored) {
          setThemeState(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const setTheme = (newTheme: Theme) => {
      setThemeState(newTheme);
    };

    const toggleTheme = () => {
      setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
      <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }
);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
