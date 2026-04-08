import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { id: "midnight", label: "Midnight", description: "Clean & minimal dark theme" },
  { id: "cyberpunk", label: "Cyberpunk", description: "Neon pink & electric blue" },
  { id: "matrix", label: "Matrix", description: "Green-on-black hacker vibes" },
  { id: "dracula", label: "Dracula", description: "Classic dev-favorite purple" },
  { id: "solarized", label: "Solarized Dark", description: "Warm, easy on the eyes" },
  { id: "nord", label: "Nord", description: "Cool arctic blues" },
  { id: "amber", label: "Amber Terminal", description: "Retro CRT terminal glow" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem("ipam-theme");
    if (THEMES.some((t) => t.id === stored)) return stored as ThemeId;
    return "midnight";
  });

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("ipam-theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
