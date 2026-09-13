import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "auto";
type ThemeChangeListener = (mode: ThemeMode) => void;
const listeners = new Set<ThemeChangeListener>();
function notifyThemeChange() { const mode = getCurrentThemeMode(); listeners.forEach((listener) => listener(mode)); }
function subscribeToThemeChange(listener: ThemeChangeListener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function updateTheme(darkPreferred: boolean): void { document.body.classList.toggle("dark", darkPreferred); }
let currentMediaQuery: MediaQueryList | null = null;
export function switchToDarkMode(): void { if (currentMediaQuery) { currentMediaQuery.onchange = null; currentMediaQuery = null; } document.body.classList.add("dark"); notifyThemeChange(); }
export function switchToLightMode(): void { if (currentMediaQuery) { currentMediaQuery.onchange = null; currentMediaQuery = null; } document.body.classList.remove("dark"); notifyThemeChange(); }
export function switchToAutoMode(): void {
  if (currentMediaQuery) currentMediaQuery.onchange = null;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.onchange = (event: MediaQueryListEvent) => updateTheme(event.matches);
  currentMediaQuery = mediaQuery;
  updateTheme(mediaQuery.matches);
  notifyThemeChange();
}
export function getCurrentThemeMode(): ThemeMode { if (currentMediaQuery) return "auto"; return document.body.classList.contains("dark") ? "dark" : "light"; }
interface ThemeModeContextValue { mode: ThemeMode; switchToDarkMode: () => void; switchToLightMode: () => void; switchToAutoMode: () => void; }
const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getCurrentThemeMode());
  useEffect(() => subscribeToThemeChange((newMode) => setMode(newMode)), []);
  const value = useMemo(() => ({ mode, switchToDarkMode, switchToLightMode, switchToAutoMode }), [mode]);
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}
export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error("useThemeMode must be used within a ThemeModeProvider");
  return context;
}
