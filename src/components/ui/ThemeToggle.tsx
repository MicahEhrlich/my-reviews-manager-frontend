import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../mockData";

export interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const dark = theme === "dark";
  return <button className="icon-button theme-toggle" onClick={onToggle} aria-label={dark ? "מעבר למצב בהיר" : "מעבר למצב כהה"}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>;
}
