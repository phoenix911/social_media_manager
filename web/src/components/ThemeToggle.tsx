import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore, type Theme } from "@/store/themeStore";

const ICONS: Record<Theme, JSX.Element> = {
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
  system: <Monitor size={16} />,
};
const ORDER: Theme[] = ["light", "dark", "system"];
const LABEL: Record<Theme, string> = { light: "light", dark: "dark", system: "system" };

export const ThemeToggle = () => {
  const { theme, setTheme } = useThemeStore();
  const next = () => {
    const i = ORDER.indexOf(theme);
    setTheme(ORDER[(i + 1) % ORDER.length]!);
  };
  return (
    <button
      onClick={next}
      className="inline-flex items-center gap-1 rounded-md p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground"
      aria-label={`theme: ${LABEL[theme]} (click to cycle)`}
      title={`theme: ${LABEL[theme]}`}
    >
      {ICONS[theme]}
    </button>
  );
};
