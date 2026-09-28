import type {
  GrassSettings,
  LightingSettings,
  Result,
  StoredSimulationSettings,
  TerrainSettings,
  WindSettings,
} from '@/types';

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
  if (typeof name !== 'string' || name.trim().length === 0) {
    return { ok: false, error: 'The settings are missing a valid name.' };
  }

  const image = candidate.image;
  if (typeof image !== 'string' || image.length === 0) {
    return { ok: false, error: 'The settings are missing a render screenshot.' };
  }

  const settingsField = candidate.settings;
  if (typeof settingsField !== 'object' || settingsField === null) {
    return { ok: false, error: 'The simulation settings are missing their values.' };
  }

  const settings = settingsField as Record<string, unknown>;
  const wind = parseWindSettings(settings.wind);
  if (!wind.ok) return { ok: false, error: wind.error };

  const grass = parseGrassSettings(settings.grass);
  if (!grass.ok) return { ok: false, error: grass.error };

  const terrain = parseTerrainSettings(settings.terrain);
  if (!terrain.ok) return { ok: false, error: terrain.error };

  const lighting = parseLightingSettings(settings.lighting);
  if (!lighting.ok) return { ok: false, error: lighting.error };

  return {
    ok: true,
    data: {
      name: name.trim(),
      image,
      settings: {
        wind: wind.data,
        grass: grass.data,
        terrain: terrain.data,
        lighting: lighting.data,
      },
    },
  };
}

/** Parses and validates the wind section of an imported settings file. */
function parseWindSettings(input: unknown): Result<WindSettings> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The wind settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const velocity = fields.velocity;
  if (typeof velocity !== 'number' || !Number.isFinite(velocity) || velocity < 0 || velocity > 1) {
    return { ok: false, error: 'The wind velocity is missing or invalid.' };
  }

  const strength = fields.strength;
  if (typeof strength !== 'number' || !Number.isFinite(strength) || strength < 0 || strength > 1) {
    return { ok: false, error: 'The wind strength is missing or invalid.' };
  }

  const angle = fields.angle;
  if (typeof angle !== 'number' || !Number.isFinite(angle) || angle < 0 || angle > 360) {
    return { ok: false, error: 'The wind angle is missing or invalid.' };
  }

  return { ok: true, data: { velocity, strength, angle } };
}

/** Parses and validates the grass section of an imported settings file. */
function parseGrassSettings(input: unknown): Result<GrassSettings> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The grass settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const tileSize = fields.tileSize;
  if (typeof tileSize !== 'number' || !Number.isInteger(tileSize) || tileSize < 1) {
    return { ok: false, error: 'The grass tile size is missing or invalid.' };
  }

  const bladeWidth = fields.bladeWidth;
  if (
    typeof bladeWidth !== 'number' ||
    !Number.isFinite(bladeWidth) ||
    bladeWidth <= 0 ||
    bladeWidth > 1
  ) {
    return { ok: false, error: 'The blade width is missing or invalid.' };
  }

  const bladeHeight = fields.bladeHeight;
  if (
    typeof bladeHeight !== 'number' ||
    !Number.isFinite(bladeHeight) ||
    bladeHeight <= 0 ||
    bladeHeight > 5
  ) {
    return { ok: false, error: 'The blade height is missing or invalid.' };
  }

  const bladeBending = fields.bladeBending;
  if (
    typeof bladeBending !== 'number' ||
    !Number.isFinite(bladeBending) ||
    bladeBending < 0 ||
    bladeBending > 45
  ) {
    return { ok: false, error: 'The blade bending is missing or invalid.' };
  }

  const heightRandomness = fields.heightRandomness;
  if (
    typeof heightRandomness !== 'number' ||
    !Number.isFinite(heightRandomness) ||
    heightRandomness < 0 ||
    heightRandomness > 1
  ) {
    return { ok: false, error: 'The blade height randomness is missing or invalid.' };
  }

  const colorRandomness = fields.colorRandomness;
  if (
    typeof colorRandomness !== 'number' ||
    !Number.isFinite(colorRandomness) ||
    colorRandomness < 0 ||
    colorRandomness > 1
  ) {
    return { ok: false, error: 'The blade color randomness is missing or invalid.' };
  }

  const colorDistribution = fields.colorDistribution;
  if (
    typeof colorDistribution !== 'number' ||
    !Number.isFinite(colorDistribution) ||
    colorDistribution < 0 ||
    colorDistribution > 1
  ) {
    return { ok: false, error: 'The blade color distribution is missing or invalid.' };
  }

  const baseColor1 = fields.baseColor1;
  if (typeof baseColor1 !== 'string' || !HEX_COLOR.test(baseColor1)) {
    return { ok: false, error: 'The first blade base color is missing or invalid.' };
  }

  const tipColor1 = fields.tipColor1;
  if (typeof tipColor1 !== 'string' || !HEX_COLOR.test(tipColor1)) {
    return { ok: false, error: 'The first blade tip color is missing or invalid.' };
  }

  const baseColor2 = fields.baseColor2;
  if (typeof baseColor2 !== 'string' || !HEX_COLOR.test(baseColor2)) {
    return { ok: false, error: 'The second blade base color is missing or invalid.' };
  }

  const tipColor2 = fields.tipColor2;
  if (typeof tipColor2 !== 'string' || !HEX_COLOR.test(tipColor2)) {
    return { ok: false, error: 'The second blade tip color is missing or invalid.' };
  }

  const selfShadowing = fields.selfShadowing;
  if (
    typeof selfShadowing !== 'number' ||
    !Number.isFinite(selfShadowing) ||
    selfShadowing < 0 ||
    selfShadowing > 10
  ) {
    return { ok: false, error: 'The blade self-shadowing is missing or invalid.' };
  }

  return {
    ok: true,
    data: {
      tileSize,
      bladeWidth,
      bladeHeight,
      bladeBending,
      heightRandomness,
      colorRandomness,
      colorDistribution,
      baseColor1,
      tipColor1,
      baseColor2,
      tipColor2,
      selfShadowing,
    },
  };
}

/** Parses and validates the terrain section of an imported settings file. */
function parseTerrainSettings(input: unknown): Result<TerrainSettings> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The terrain settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const size = fields.size;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) {
    return { ok: false, error: 'The terrain size is missing or invalid.' };
  }

  const segments = fields.segments;
  if (typeof segments !== 'number' || !Number.isInteger(segments) || segments < 1) {
    return { ok: false, error: 'The terrain segments are missing or invalid.' };
  }

  const color = fields.color;
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) {
    return { ok: false, error: 'The terrain color is missing or invalid.' };
  }

  const height = fields.height;
  if (typeof height !== 'number' || !Number.isFinite(height) || height < 0) {
    return { ok: false, error: 'The terrain height is missing or invalid.' };
  }

  const frequency = fields.frequency;
  if (typeof frequency !== 'number' || !Number.isFinite(frequency) || frequency < 0) {
    return { ok: false, error: 'The terrain frequency is missing or invalid.' };
  }

  return {
    ok: true,
    data: {
      size,
      segments,
      color,
      height,
      frequency,
    },
  };
}

/** Parses and validates the lighting section of an imported settings file. */
function parseLightingSettings(input: unknown): Result<LightingSettings> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The lighting settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const hemisphere = parseHemisphereLightingSettings(fields.hemisphere);
  if (!hemisphere.ok) return { ok: false, error: hemisphere.error };

  const diffuse = parseDiffuseLightingSettings(fields.diffuse);
  if (!diffuse.ok) return { ok: false, error: diffuse.error };

  const specular = parseSpecularLightingSettings(fields.specular);
  if (!specular.ok) return { ok: false, error: specular.error };

  const environment = parseEnvironmentLightingSettings(fields.environment);
  if (!environment.ok) return { ok: false, error: environment.error };

  return {
    ok: true,
    data: {
      hemisphere: hemisphere.data,
      diffuse: diffuse.data,
      specular: specular.data,
      environment: environment.data,
    },
  };
}

/** Parses and validates the hemispherical lighting section. */
function parseHemisphereLightingSettings(input: unknown): Result<LightingSettings['hemisphere']> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The hemispherical lighting settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const skyColor = fields.skyColor;
  if (typeof skyColor !== 'string' || !HEX_COLOR.test(skyColor)) {
    return { ok: false, error: 'The sky color is missing or invalid.' };
  }

  const groundColor = fields.groundColor;
  if (typeof groundColor !== 'string' || !HEX_COLOR.test(groundColor)) {
    return { ok: false, error: 'The ground color is missing or invalid.' };
  }

  return { ok: true, data: { skyColor, groundColor } };
}

/** Parses and validates the diffuse (directional) lighting section. */
function parseDiffuseLightingSettings(input: unknown): Result<LightingSettings['diffuse']> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The diffuse lighting settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const color = fields.color;
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) {
    return { ok: false, error: 'The light color is missing or invalid.' };
  }

  const direction = fields.direction;
  if (typeof direction !== 'object' || direction === null) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }

  const directionFields = direction as Record<string, unknown>;
  const x = directionFields.x;
  if (typeof x !== 'number' || !Number.isFinite(x)) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }

  const y = directionFields.y;
  if (typeof y !== 'number' || !Number.isFinite(y)) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }

  const z = directionFields.z;
  if (typeof z !== 'number' || !Number.isFinite(z)) {
    return { ok: false, error: 'The light direction is missing or invalid.' };
  }

  return { ok: true, data: { color, direction: { x, y, z } } };
}

/** Parses and validates the specular lighting section. */
function parseSpecularLightingSettings(input: unknown): Result<LightingSettings['specular']> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The specular lighting settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const shininess = fields.shininess;
  if (typeof shininess !== 'number' || !Number.isInteger(shininess) || shininess < 1) {
    return { ok: false, error: 'The specular shininess is missing or invalid.' };
  }

  const intensity = fields.intensity;
  if (typeof intensity !== 'number' || !Number.isFinite(intensity) || intensity < 0) {
    return { ok: false, error: 'The specular intensity is missing or invalid.' };
  }

  return { ok: true, data: { shininess, intensity } };
}

/** Parses the environment lighting section. Files saved before this term existed */
function parseEnvironmentLightingSettings(input: unknown): Result<LightingSettings['environment']> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'The environment lighting settings are missing or invalid.' };
  }

  const fields = input as Record<string, unknown>;
  const strength = fields.strength;
  if (typeof strength !== 'number' || !Number.isFinite(strength) || strength < 0 || strength > 1) {
    return { ok: false, error: 'The environment strength is missing or invalid.' };
  }

  return { ok: true, data: { strength } };
}
