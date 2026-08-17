import { create } from "zustand";
import { DEFAULT_SELECTION, SAMPLE_SELECTION } from "../data/roster";

interface SquadState {
  selectedIds: string[];
  hasValidated: boolean;
  togglePlayer: (id: string) => void;
  reset: () => void;
  loadSample: () => void;
  setValidated: () => void;
}

export const useSquadStore = create<SquadState>()((set) => ({
  selectedIds: [...DEFAULT_SELECTION],
  hasValidated: false,

  togglePlayer: (id: string) =>
    set((state) => {
      const next = state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id];
      return { selectedIds: next };
    }),

  reset: () =>
    set({ selectedIds: [...DEFAULT_SELECTION], hasValidated: false }),

  loadSample: () =>
    set({ selectedIds: [...SAMPLE_SELECTION], hasValidated: true }),

  setValidated: () => set({ hasValidated: true }),
}));
