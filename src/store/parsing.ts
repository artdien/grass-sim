import type { Result, StoredSimulationSettings } from '@/types';

/** A hex color such as the #rrggbb values a native color input produces. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

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

  const color = terrainFields.color;
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) {
    return { ok: false, error: 'The terrain color is missing or invalid.' };
  }

  const lighting = settings.lighting;
  if (typeof lighting !== 'object' || lighting === null) {
    return { ok: false, error: 'The lighting settings are missing or invalid.' };
  }

  const lightingFields = lighting as Record<string, unknown>;
  const hemisphere = lightingFields.hemisphere;
  const diffuse = lightingFields.diffuse;
  const specular = lightingFields.specular;

  if (typeof hemisphere !== 'object' || hemisphere === null) {
    return { ok: false, error: 'The hemispherical lighting settings are missing or invalid.' };
  }
  const hemisphereFields = hemisphere as Record<string, unknown>;
  const skyColor = hemisphereFields.skyColor;
  const groundColor = hemisphereFields.groundColor;

  if (typeof skyColor !== 'string' || !HEX_COLOR.test(skyColor)) {
    return { ok: false, error: 'The sky color is missing or invalid.' };
  }
  if (typeof groundColor !== 'string' || !HEX_COLOR.test(groundColor)) {
    return { ok: false, error: 'The ground color is missing or invalid.' };
  }

  if (typeof diffuse !== 'object' || diffuse === null) {
    return { ok: false, error: 'The diffuse lighting settings are missing or invalid.' };
  }
  const diffuseFields = diffuse as Record<string, unknown>;
  const lightColor = diffuseFields.color;
  const direction = diffuseFields.direction;

  if (typeof lightColor !== 'string' || !HEX_COLOR.test(lightColor)) {
    return { ok: false, error: 'The light color is missing or invalid.' };
  }
  if (typeof direction !== 'object' || direction === null) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }
  const directionFields = direction as Record<string, unknown>;
  const directionX = directionFields.x;
  const directionY = directionFields.y;
  const directionZ = directionFields.z;

  if (typeof directionX !== 'number' || !Number.isFinite(directionX)) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }
  if (typeof directionY !== 'number' || !Number.isFinite(directionY)) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }
  if (typeof directionZ !== 'number' || !Number.isFinite(directionZ)) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }

  if (typeof specular !== 'object' || specular === null) {
    return { ok: false, error: 'The specular lighting settings are missing or invalid.' };
  }
  const specularFields = specular as Record<string, unknown>;
  const shininess = specularFields.shininess;
  const intensity = specularFields.intensity;

  if (typeof shininess !== 'number' || !Number.isInteger(shininess) || shininess < 1) {
    return { ok: false, error: 'The specular shininess is missing or invalid.' };
  }
  if (typeof intensity !== 'number' || !Number.isFinite(intensity) || intensity < 0) {
    return { ok: false, error: 'The specular intensity is missing or invalid.' };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      image,
      settings: {
        terrain: { size, segments, color },
        lighting: {
          hemisphere: { skyColor, groundColor },
          diffuse: {
            color: lightColor,
            direction: { x: directionX, y: directionY, z: directionZ },
          },
          specular: { shininess, intensity },
        },
      },
    },
  };
}
