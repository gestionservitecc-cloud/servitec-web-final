"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = false,
}: {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      if (typeof window === "undefined") return defaultTheme;
      const stored = window.localStorage.getItem("theme") as Theme | null;
      return stored || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    const apply = (t: Theme) => {
      let resolved: "light" | "dark" = "light";
      if (t === "system") {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        resolved = prefersDark ? "dark" : "light";
      } else {
        resolved = t === "dark" ? "dark" : "light";
      }
      try {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(resolved);
      } catch {}
    };

    apply(theme);

    let mql: MediaQueryList | null = null;
    const onChange = () => {
      if (theme === "system") apply("system");
    };
    if (enableSystem && typeof window !== "undefined" && window.matchMedia) {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      if (mql.addEventListener) mql.addEventListener("change", onChange);
      else mql.addListener(onChange as any);
    }

    return () => {
      if (mql) {
        if (mql.removeEventListener) mql.removeEventListener("change", onChange);
        else mql.removeListener(onChange as any);
      }
    };
  }, [theme, enableSystem]);

  const setTheme = (t: Theme) => {
    try {
      window.localStorage.setItem("theme", t);
    } catch {}
    setThemeState(t);
  };

  const resolvedTheme: "light" | "dark" = theme === "system"
    ? (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : (theme === "dark" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "light" as Theme, setTheme: (() => {}) as (t: Theme) => void, resolvedTheme: "light" as "light" };
  return ctx;
}

export default ThemeProvider;
