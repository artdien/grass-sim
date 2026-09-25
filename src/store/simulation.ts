import { create } from 'zustand';

import type { Result, SimulationSettings, StoredSimulationSettings } from '@/types';

interface SimulationState {
  /** The live settings the scene renders with until replaced. */
  activeSettings: SimulationSettings;

  /** All saved settings entries, in insertion order. */
  storedSettings: StoredSimulationSettings[];

  /** Replaces the active (live) settings wholesale. */
  updateActiveSettings: (settings: SimulationSettings) => void;

  /**
   * Saves the current active settings plus a render snapshot as a new entry under
   * `name`. Returns a `Result` instead of throwing so the caller can surface the
   * failure; a duplicate name is refused.
   */
  saveSettings: (
    name: string,
    image: string,
  ) => Result<void, 'EMPTY_NAME' | 'EMPTY_IMAGE' | 'DUPLICATE_ENTRY'>;

  /**
   * Upserts `entry`: replaces a stored entry with the same name or appends it.
   * Unlike `saveSettings`, never refuses a duplicate — the caller confirms first.
   */
  importSettings: (entry: StoredSimulationSettings) => void;

  /** Applies `entry`'s settings as the active settings. */
  restoreSettings: (entry: StoredSimulationSettings) => void;

  /** Removes the stored entry with `name`. */
  deleteSettings: (name: string) => void;
}

/** Zustand store: the active simulation settings plus the saved settings entries. */
export const useSimulationStore = create<SimulationState>()((set, get) => ({
  activeSettings: {
    terrain: {
      size: 10,
      segments: 512,
      color: '#4a7c3a',
    },
    lighting: {
      hemisphere: {
        skyColor: '#87ceeb',
        groundColor: '#856a4f',
      },
      diffuse: {
        color: '#ffffff',
        direction: { x: -0.5, y: -1, z: 0.5 },
      },
      specular: {
        shininess: 32,
        intensity: 0.5,
      },
    },
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

    // Copy the active settings (including the nested sections) so later edits
    // don't mutate the saved entry.
    const active = get().activeSettings;
    const entry: StoredSimulationSettings = {
      name: trimmedName,
      image,
      settings: {
        terrain: { ...active.terrain },
        lighting: {
          hemisphere: { ...active.lighting.hemisphere },
          diffuse: {
            color: active.lighting.diffuse.color,
            direction: { ...active.lighting.diffuse.direction },
          },
          specular: { ...active.lighting.specular },
        },
      },
    };

    set((state) => ({ storedSettings: [...state.storedSettings, entry] }));

    return { ok: true, data: undefined };
  },
  importSettings: (entry) =>
    set((state) => {
      const exists = state.storedSettings.some((item) => item.name === entry.name);
      const storedSettings = exists
        ? state.storedSettings.map((item) => (item.name === entry.name ? entry : item))
        : [...state.storedSettings, entry];
      return { storedSettings };
    }),
  restoreSettings: (entry) =>
    set({
      activeSettings: {
        terrain: { ...entry.settings.terrain },
        lighting: {
          hemisphere: { ...entry.settings.lighting.hemisphere },
          diffuse: {
            color: entry.settings.lighting.diffuse.color,
            direction: { ...entry.settings.lighting.diffuse.direction },
          },
          specular: { ...entry.settings.lighting.specular },
        },
      },
    }),
  deleteSettings: (name) =>
    set((state) => ({ storedSettings: state.storedSettings.filter((item) => item.name !== name) })),
}));
