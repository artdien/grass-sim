import { create } from 'zustand';

import type { Result, SimulationSettings, StoredSimulationSettings } from '@/types';

interface SimulationState {
  activeSettings: SimulationSettings;
  storedSettings: StoredSimulationSettings[];

  updateActiveSettings: (settings: SimulationSettings) => void;
  saveSettings: (
    name: string,
    image: string,
  ) => Result<void, 'EMPTY_NAME' | 'EMPTY_IMAGE' | 'DUPLICATE_ENTRY'>;
  importSettings: (entry: StoredSimulationSettings) => void;
  restoreSettings: (entry: StoredSimulationSettings) => void;
  deleteSettings: (name: string) => void;
}

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  activeSettings: {
    cubeColor: '#4ade80',
    rotationSpeed: 1,
  },
  storedSettings: [],
  updateActiveSettings: (settings) => set({ activeSettings: settings }),
  saveSettings: (name, image) => {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return { ok: false, error: 'EMPTY_NAME' };
    }
    if (!image) {
      return { ok: false, error: 'EMPTY_IMAGE' };
    }
    if (get().storedSettings.some((entry) => entry.name === trimmedName)) {
      return { ok: false, error: 'DUPLICATE_ENTRY' };
    }

    // Copy the active settings so later edits don't mutate the saved entry.
    const entry: StoredSimulationSettings = {
      name: trimmedName,
      image,
      settings: { ...get().activeSettings },
    };

    // Zustand merges the partial state by default, so only replacing the array is fine
    set((state) => ({ storedSettings: [...state.storedSettings, entry] }));

    return { ok: true, data: undefined };
  },
  // Replace an entry with the same name (overwrite) or append a new one.
  // Unlike `saveSettings`, this never refuses on a duplicate: importing is a
  // deliberate replace, so the UI confirms before calling this.
  importSettings: (entry) =>
    set((state) => {
      const exists = state.storedSettings.some((item) => item.name === entry.name);
      const storedSettings = exists
        ? state.storedSettings.map((item) => (item.name === entry.name ? entry : item))
        : [...state.storedSettings, entry];
      return { storedSettings };
    }),
  restoreSettings: (entry) => set({ activeSettings: { ...entry.settings } }),
  deleteSettings: (name) =>
    set((state) => ({ storedSettings: state.storedSettings.filter((item) => item.name !== name) })),
}));
