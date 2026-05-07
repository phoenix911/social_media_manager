// Capture the `beforeinstallprompt` event so we can offer a manual
// install button. Chromium-only — Safari (iOS) has no programmatic
// install; for those browsers we fall back to a one-line hint.

import { create } from "zustand";

type DeferredEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface State {
  deferred: DeferredEvent | null;
  installed: boolean;
  setDeferred: (e: DeferredEvent | null) => void;
  setInstalled: (v: boolean) => void;
}

export const useInstallStore = create<State>()((set) => ({
  deferred: null,
  installed: false,
  setDeferred: (deferred) => set({ deferred }),
  setInstalled: (installed) => set({ installed }),
}));

// Wire up the listeners once at boot.
export const initInstall = (): void => {
  if (typeof window === "undefined") return;

  // Standalone display = already installed.
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;
  if (standalone) useInstallStore.getState().setInstalled(true);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    useInstallStore.getState().setDeferred(e as DeferredEvent);
  });
  window.addEventListener("appinstalled", () => {
    useInstallStore.getState().setDeferred(null);
    useInstallStore.getState().setInstalled(true);
  });
};

export const triggerInstall = async (): Promise<"accepted" | "dismissed" | "ios" | "unsupported"> => {
  const { deferred } = useInstallStore.getState();
  if (deferred) {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    useInstallStore.getState().setDeferred(null);
    return outcome;
  }
  // iOS / Safari — no API. Caller shows hint.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return isIOS ? "ios" : "unsupported";
};
