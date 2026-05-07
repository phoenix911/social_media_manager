// PWA bootstrap. vite-plugin-pwa auto-registers the SW; this hook
// listens for "new version ready" and prompts the user to reload.

import { registerSW } from "virtual:pwa-register";

export const initPwa = (): void => {
  if (typeof window === "undefined") return;

  const updateSW = registerSW({
    onNeedRefresh() {
      // Light prompt — small, non-blocking. Could be replaced with a
      // toast component later.
      if (confirm("A new version of SMM is available. Reload now?")) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      // First install — app is now offline-capable. No-op UX.
      console.info("SMM installed for offline use");
    },
  });
};
