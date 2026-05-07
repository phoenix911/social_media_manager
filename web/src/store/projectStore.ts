// Persisted client state — currently just remembers which project the
// user was last on. Server data is owned by SWR; don't mirror it here.

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface State {
  currentSlug: string | null;
  setCurrent: (slug: string | null) => void;
}

export const useProjectStore = create<State>()(
  persist(
    (set) => ({
      currentSlug: null,
      setCurrent: (slug) => set({ currentSlug: slug }),
    }),
    { name: "smm.project" },
  ),
);
