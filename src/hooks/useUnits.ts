"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UnitSystem } from "@/lib/units/convert";

/**
 * Measurement-system preference. Persisted to localStorage so the choice
 * sticks across visits and applies everywhere ingredient amounts render.
 *
 * `hasHydrated` follows the same discipline as `useCookingSession`: consumers
 * read the in-memory default ("metric") until rehydration completes, which
 * keeps server-rendered markup and the first client render in agreement
 * before the stored preference takes over.
 */
interface UnitsState {
  system: UnitSystem;
  hasHydrated: boolean;
  setSystem: (system: UnitSystem) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useUnits = create<UnitsState>()(
  persist(
    (set) => ({
      system: "metric",
      hasHydrated: false,
      setSystem: (system) => set({ system }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "savor-units",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ system: s.system }),
      onRehydrateStorage: () => (state) => {
        // Go through set (not direct mutation) so hasHydrated-gated
        // components re-render once the stored preference is applied.
        state?.setHasHydrated(true);
      },
    },
  ),
);
