/**
 * Shared success/failure result. Carries `data` when `ok` is true, otherwise an
 * `error`. `E` defaults to a user-facing message string, or a union of error
 * codes when the caller must branch on it.
 */
export type Result<T = void, E = string> = { ok: true; data: T } | { ok: false; error: E };

/** The wind the grass blade shader bends the blades by: how fast, how hard, and from which direction. */
export interface WindSettings {
  /** Wind velocity (a number in [0, 1]); scales both the bend noise and the blade lean. */
  velocity: number;

  /** Wind randomness (a number in [0, 1]). */
  randomness: number;

  /** Direction the wind blows toward, in degrees [0, 360]. */
  angle: number;
}

/** The grass blade as the shaders render it: the blade shape and variation, and its color palettes and shading. */
export interface GrassSettings {
  /** How wide the blade is (a number in (0, 1]). */
  bladeWidth: number;

  /** How tall the blade is (a number in (0, 5]). */
  bladeHeight: number;

  /** The blade's resting bend angle, in degrees (a number in [0, 45]). */
  bladeBending: number;

  /** How much the blade height varies between blades (a number in [0, 1]). */
  bladeHeightRandomness: number;

  /** How strongly the blade widens in view space as it turns edge-on (a number in [0, 1]). */
  bladeThickening: number;

  /** How strongly the two color palettes blend (a number in [0, 1]). */
  colorMix: number;

  /** Spatial scale of the color-field variation (a number in [0, 1]). */
  colorDistribution: number;

  /** Base (ground) color of the first blade color palette, as a hex string (#rrggbb). */
  baseColor1: string;

  /** Tip color of the first blade color palette, as a hex string (#rrggbb). */
  tipColor1: string;

  /** Base (ground) color of the second blade color palette, as a hex string (#rrggbb). */
  baseColor2: string;

  /** Tip color of the second blade color palette, as a hex string (#rrggbb). */
  tipColor2: string;

  /** Exponent of the blade's shadowing toward its base (a number in [0, 10]). */
  shadowing: number;

  /** Exponent of the blade's half-lambertian diffuse wrap (a number in [0, 3]); 1 is pure half-lambertian. */
  softness: number;
}

/** Terrain generation settings: its base color and its height field. */
export interface TerrainSettings {
  /** Base color of the terrain as a hex string (#rrggbb). */
  color: string;

  /** Height amplitude of the noise displacement (a number in [0, 1]). */
  height: number;

  /** Spatial scale of the noise field; higher is finer. 0 is flat (a number in [0, 2]). */
  frequency: number;
}

/** Lighting applied to the terrain: hemispherical ambient, lambertian diffuse, Blinn-Phong specular, and environment-map reflection. */
export interface LightingSettings {
  /** Hemispherical (ambient) term: the tint seen between ground and sky. */
  hemisphere: {
    /** Color cast from the sky, as a hex string (#rrggbb). */
    skyColor: string;

    /** Color cast from the ground, as a hex string (#rrggbb). */
    groundColor: string;
  };

  /** Lambertian (diffuse) term: the color and travel direction of the directional light. */
  diffuse: {
    /** Light color as a hex string (#rrggbb). */
    color: string;

    /** Direction the light travels toward the scene (normalized before use). */
    direction: {
      x: number;
      y: number;
      z: number;
    };
  };

  /** Blinn-Phong (specular) term. */
  specular: {
    /** Specular exponent, controlling highlight tightness (an integer ≥ 1). */
    shininess: number;

    /** Specular contribution multiplier (a number in [0, 1]). */
    intensity: number;
  };

  /** Environment-map (reflection) term. */
  environment: {
    /** Environment-map contribution multiplier (a number in [0, 1]). */
    strength: number;
  };
}

/** Live settings the scene reads on every frame and the user adjusts via the sidebar. */
export interface SimulationSettings {
  wind: WindSettings;
  grass: GrassSettings;
  terrain: TerrainSettings;
  lighting: LightingSettings;
}

/** A saved settings entry: the settings plus a name and a render snapshot. */
export interface StoredSimulationSettings {
  /** Entry name; also the download file name (without extension). */
  name: string;

  /** Base64-encoded WebP snapshot of the scene, without the `data:` prefix. */
  image: string;

  /** The simulation settings this entry loads. */
  settings: SimulationSettings;
}
