import type { Result, StoredSimulationSettings } from '@/types';

// Validates and shapes the JSON of an imported settings file into a
// StoredSimulationSettings, so an imported file round-trips against the values
// the app itself saves. Returns a friendly error message when the shape is
// wrong so the caller can surface it directly.
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
  const cubeColor = settings.cubeColor;
  const rotationSpeed = settings.rotationSpeed;

  if (typeof cubeColor !== 'string' || cubeColor.length === 0) {
    return { ok: false, error: 'The cube color is missing or invalid.' };
  }
  if (typeof rotationSpeed !== 'number' || !Number.isFinite(rotationSpeed)) {
    return { ok: false, error: 'The rotation speed is missing or invalid.' };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      image,
      settings: { cubeColor, rotationSpeed },
    },
  };
}
