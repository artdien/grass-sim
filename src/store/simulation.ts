import { create } from 'zustand';

import goldenWheatFieldText from '@/assets/scenes/golden-wheat-field.json?raw';
import frostedWinterGrassText from '@/assets/scenes/frosted-winter-grass.json?raw';
import summerMeadowText from '@/assets/scenes/summer-meadow.json?raw';

import { parseSimulationSettings } from '@/store/parsing';
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
  loadSettings: (entry: StoredSimulationSettings) => void;

  /** Removes the stored entry with `name`. */
  deleteSettings: (name: string) => void;
}

/**
 * The store's initial `storedSettings`, built from the bundled example scenes and parsed
 * through the same path as a manual JSON import so they validate identically.
 */
const initialStoredSettings = [
  goldenWheatFieldText,
  summerMeadowText,
  frostedWinterGrassText,
].flatMap((text) => {
  const result = parseSimulationSettings(text);
  return result.ok ? [result.data] : [];
});

/** Zustand store: the active simulation settings plus the saved settings entries. */
export const useSimulationStore = create<SimulationState>()((set, get) => ({
  activeSettings: {
    wind: {
      velocity: 0.5,
      randomness: 0.45,
      angle: 115,
    },
    // The color defaults are the sRGB hex equivalents of the linear palette
    // values the shader used before these were configurable.
    grass: {
      bladeWidth: 0.5,
      bladeHeight: 4.5,
      bladeBending: 20.0,
      bladeHeightRandomness: 0.85,
      bladeThickening: 0.2,
      colorMix: 0.7,
      colorDistribution: 0.25,
      baseColor1: '#664d1a',
      tipColor1: '#e6cc66',
      baseColor2: '#806633',
      tipColor2: '#ccb34d',
      shadowing: 7.0,
      softness: 1.5,
    },
    terrain: {
      color: '#8a6d4b',
      height: 0.25,
      frequency: 0.5,
    },
    lighting: {
      hemisphere: {
        skyColor: '#99c1f1',
        groundColor: '#856a4f',
      },
      diffuse: {
        color: '#ff7800',
        direction: { x: -0.5, y: -1, z: -0.5 },
      },
      specular: {
        shininess: 32,
        intensity: 0.35,
      },
      environment: {
        strength: 0.1,
      },
    },
  },
  storedSettings: initialStoredSettings,
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
        wind: { ...active.wind },
        grass: { ...active.grass },
        terrain: { ...active.terrain },
        lighting: {
          hemisphere: { ...active.lighting.hemisphere },
          diffuse: {
            color: active.lighting.diffuse.color,
            direction: { ...active.lighting.diffuse.direction },
          },
          specular: { ...active.lighting.specular },
          environment: { ...active.lighting.environment },
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
  loadSettings: (entry) =>
    set({
      activeSettings: {
        wind: { ...entry.settings.wind },
        grass: { ...entry.settings.grass },
        terrain: { ...entry.settings.terrain },
        lighting: {
          hemisphere: { ...entry.settings.lighting.hemisphere },
          diffuse: {
            color: entry.settings.lighting.diffuse.color,
            direction: { ...entry.settings.lighting.diffuse.direction },
          },
          specular: { ...entry.settings.lighting.specular },
          environment: { ...entry.settings.lighting.environment },
        },
      },
    }),
  deleteSettings: (name) =>
    set((state) => ({ storedSettings: state.storedSettings.filter((item) => item.name !== name) })),
}));
