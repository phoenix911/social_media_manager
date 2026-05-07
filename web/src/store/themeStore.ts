import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface State {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const applyTheme = (t: Theme) => {
  const html = document.documentElement;
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const wantDark = t === "dark" || (t === "system" && sysDark);
  html.classList.toggle("dark", wantDark);
};

export const useThemeStore = create<State>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "smm.theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

// Apply on boot, before React renders, so there's no flash.
export const bootTheme = (): void => {
  try {
    const raw = localStorage.getItem("smm.theme");
    const parsed = raw ? (JSON.parse(raw) as { state?: { theme?: Theme } }) : null;
    applyTheme(parsed?.state?.theme ?? "system");
  } catch {
    applyTheme("system");
  }
  // React to system changes when in 'system' mode.
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const raw = localStorage.getItem("smm.theme");
    const parsed = raw ? (JSON.parse(raw) as { state?: { theme?: Theme } }) : null;
    if ((parsed?.state?.theme ?? "system") === "system") applyTheme("system");
  });
};
