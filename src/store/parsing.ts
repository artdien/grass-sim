import type { Result, StoredSimulationSettings } from '@/types';

/**
 * Parses and validates an imported settings file's JSON into a
 * `StoredSimulationSettings`. On a bad shape it resolves to a `Result` error
 * carrying a user-facing message the caller can display directly.
 */
export function parseSimulationSettings(text: string): Result<StoredSimulationSettings> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The selected file is not valid JSON.' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'The selected file does not contain simulation settings.' };
  }

  const candidate = parsed as Record<string, unknown>;
  const name = candidate.name;
  const image = candidate.image;
  const settingsField = candidate.settings;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { ok: false, error: 'The settings are missing a valid name.' };
  }
  if (typeof image !== 'string' || image.length === 0) {
    return { ok: false, error: 'The settings are missing a render screenshot.' };
  }
  if (typeof settingsField !== 'object' || settingsField === null) {
    return { ok: false, error: 'The simulation settings are missing their values.' };
  }

  const settings = settingsField as Record<string, unknown>;
  const terrain = settings.terrain;

  if (typeof terrain !== 'object' || terrain === null) {
    return { ok: false, error: 'The terrain settings are missing or invalid.' };
  }

  const terrainFields = terrain as Record<string, unknown>;
  const size = terrainFields.size;
  const segments = terrainFields.segments;

  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    return { ok: false, error: 'The terrain size is missing or invalid.' };
  }
  if (typeof segments !== 'number' || !Number.isInteger(segments) || segments < 1) {
    return { ok: false, error: 'The terrain segments are missing or invalid.' };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      image,
      settings: { terrain: { size, segments } },
    },
  };
}
