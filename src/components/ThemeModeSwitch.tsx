import { Moon, Sun, SunMoon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./DropdownMenu";
import { Button } from "./Button";
import { useThemeMode, type ThemeMode } from "../helpers/themeMode";
import styles from "./ThemeModeSwitch.module.css";
export interface ThemeModeSwitchProps { className?: string; }
export const ThemeModeSwitch = ({ className }: ThemeModeSwitchProps) => {
  const { mode, switchToLightMode, switchToDarkMode, switchToAutoMode } = useThemeMode();
  const applyThemeMode = (newMode: ThemeMode) => { if (newMode === "light") switchToLightMode(); else if (newMode === "dark") switchToDarkMode(); else switchToAutoMode(); };
  const icon = mode === "dark" ? <Moon className={styles.icon} /> : mode === "auto" ? <SunMoon className={styles.icon} /> : <Sun className={styles.icon} />;
  return <div className={`${styles.container} ${className || ""}`}><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-md" aria-label={`Current theme: ${mode}. Click to change theme`} className={styles.themeButton}>{icon}</Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className={mode === "light" ? styles.activeItem : ""} onClick={() => applyThemeMode("light")}><Sun size={16} className={styles.menuIcon} />Light{mode === "light" && <span className={styles.checkmark}>✓</span>}</DropdownMenuItem><DropdownMenuItem className={mode === "dark" ? styles.activeItem : ""} onClick={() => applyThemeMode("dark")}><Moon size={16} className={styles.menuIcon} />Dark{mode === "dark" && <span className={styles.checkmark}>✓</span>}</DropdownMenuItem><DropdownMenuItem className={mode === "auto" ? styles.activeItem : ""} onClick={() => applyThemeMode("auto")}><SunMoon size={16} className={styles.menuIcon} />Auto{mode === "auto" && <span className={styles.checkmark}>✓</span>}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>;
};
