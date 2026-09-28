import type { SimulationSettings, StoredSimulationSettings } from '@/types';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSimulationStore } from '@/store/simulation';

// The store replaces its state wholesale and never mutates it, so the initial
// default object can be reused as the reset snapshot for every test.
const initialActiveSettings = useSimulationStore.getState().activeSettings;

const buildEntry = (
  name: string,
  settings: SimulationSettings = initialActiveSettings,
): StoredSimulationSettings => ({ name, image: 'aW1hZ2U', settings });

beforeEach(() => {
  useSimulationStore.setState({ activeSettings: initialActiveSettings, storedSettings: [] });
});

describe('saveSettings', () => {
  it('refuses a blank name before touching anything', () => {
    const result = useSimulationStore.getState().saveSettings('   ', 'aW1hZ2U');

    expect(result).toEqual({ ok: false, error: 'EMPTY_NAME' });
    expect(useSimulationStore.getState().storedSettings).toHaveLength(0);
  });

  it('refuses an empty image', () => {
    expect(useSimulationStore.getState().saveSettings('Alpha', '')).toEqual({
      ok: false,
      error: 'EMPTY_IMAGE',
    });
  });

  it('refuses a duplicate name, comparing trimmed names', () => {
    // The first save stores the trimmed name 'Alpha'; the second arrives with
    // different surrounding whitespace and must still be treated as a duplicate.
    expect(useSimulationStore.getState().saveSettings('  Alpha  ', 'aW1hZ2U')).toEqual({
      ok: true,
      data: undefined,
    });

    expect(useSimulationStore.getState().saveSettings('Alpha', 'aW1hZ2U')).toEqual({
      ok: false,
      error: 'DUPLICATE_ENTRY',
    });
    expect(useSimulationStore.getState().storedSettings).toHaveLength(1);
  });

  it('appends one entry with the trimmed name and image', () => {
    useSimulationStore.getState().saveSettings('  Alpha  ', 'aW1hZ2U');

    const [entry] = useSimulationStore.getState().storedSettings;
    expect(entry.name).toBe('Alpha');
    expect(entry.image).toBe('aW1hZ2U');
  });

  it('stores a deep copy of the active settings, decoupled from later edits', () => {
    useSimulationStore.getState().saveSettings('Alpha', 'aW1hZ2U');
    const [entry] = useSimulationStore.getState().storedSettings;

    const active = useSimulationStore.getState().activeSettings;
    useSimulationStore.getState().updateActiveSettings({
      ...active,
      grass: { ...active.grass, tileSize: 99 },
    });

    expect(useSimulationStore.getState().activeSettings.grass.tileSize).toBe(99);
    expect(entry.settings.grass.tileSize).toBe(initialActiveSettings.grass.tileSize);
  });

  it('keeps the active settings intact when a saved entry is mutated', () => {
    useSimulationStore.getState().saveSettings('Alpha', 'aW1hZ2U');
    const [entry] = useSimulationStore.getState().storedSettings;

    entry.settings.wind.velocity = initialActiveSettings.wind.velocity * 0.1;

    expect(useSimulationStore.getState().activeSettings.wind.velocity).toBe(
      initialActiveSettings.wind.velocity,
    );
  });
});

describe('importSettings', () => {
  it('replaces an existing entry with the same name in place, preserving order', () => {
    const state = useSimulationStore.getState();
    state.importSettings(buildEntry('Alpha'));
    state.importSettings(buildEntry('Beta'));
    state.importSettings(buildEntry('Gamma'));

    const replacement = buildEntry('Beta');
    useSimulationStore.getState().importSettings(replacement);

    const stored = useSimulationStore.getState().storedSettings;
    expect(stored).toHaveLength(3);
    expect(stored.map((item) => item.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(stored[1]).toBe(replacement);
  });

  it('appends a new entry when its name is not already stored', () => {
    const state = useSimulationStore.getState();
    state.importSettings(buildEntry('Alpha'));
    state.importSettings(buildEntry('Beta'));

    useSimulationStore.getState().importSettings(buildEntry('Delta'));

    const stored = useSimulationStore.getState().storedSettings;
    expect(stored).toHaveLength(3);
    expect(stored.map((item) => item.name)).toEqual(['Alpha', 'Beta', 'Delta']);
  });
});

describe('loadSettings', () => {
  it('applies an entry settings as the active settings', () => {
    const settings: SimulationSettings = {
      ...initialActiveSettings,
      wind: { velocity: 0.9, randomness: 0.4, angle: 45 },
      grass: { ...initialActiveSettings.grass, tileSize: 24 },
    };
    const entry = buildEntry('Loaded', settings);

    useSimulationStore.getState().loadSettings(entry);

    expect(useSimulationStore.getState().activeSettings).toEqual(settings);
  });

  it('decouples the active settings from the loaded entry', () => {
    const settings: SimulationSettings = {
      ...initialActiveSettings,
      wind: { velocity: 0.9, randomness: 0.4, angle: 45 },
    };
    const entry = buildEntry('Loaded', settings);

    useSimulationStore.getState().loadSettings(entry);

    const active = useSimulationStore.getState().activeSettings;
    useSimulationStore.getState().updateActiveSettings({
      ...active,
      wind: { ...active.wind, velocity: 0.1 },
    });

    expect(useSimulationStore.getState().activeSettings.wind.velocity).toBe(0.1);
    expect(entry.settings.wind.velocity).toBe(0.9);
  });
});

describe('deleteSettings', () => {
  it('removes only the stored entry with the given name', () => {
    const state = useSimulationStore.getState();
    state.importSettings(buildEntry('Alpha'));
    state.importSettings(buildEntry('Beta'));

    useSimulationStore.getState().deleteSettings('Beta');

    expect(useSimulationStore.getState().storedSettings.map((item) => item.name)).toEqual([
      'Alpha',
    ]);
  });

  it('is a no-op for an unknown name', () => {
    useSimulationStore.getState().importSettings(buildEntry('Alpha'));

    useSimulationStore.getState().deleteSettings('Gamma');

    expect(useSimulationStore.getState().storedSettings.map((item) => item.name)).toEqual([
      'Alpha',
    ]);
  });
});
