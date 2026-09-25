/**
 * Shared success/failure result. Carries `data` when `ok` is true, otherwise an
 * `error`. `E` defaults to a user-facing message string, or a union of error
 * codes when the caller must branch on it.
 */
export type Result<T = void, E = string> = { ok: true; data: T } | { ok: false; error: E };

/** Terrain generation settings: how large it is, how finely it is subdivided, and its base color. */
export interface TerrainSettings {
  /** Terrain size in world units (an integer ≥ 1). */
  size: number;

  /** Grid subdivisions of the terrain plane per edge (an integer ≥ 1). */
  segments: number;

  /** Base color of the terrain as a hex string (#rrggbb). */
  color: string;
}

/** Lighting applied to the terrain: hemispherical ambient, lambertian diffuse, and Blinn-Phong specular. */
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

    /** Specular contribution multiplier (≥ 0). */
    intensity: number;
  };
}

/** Live settings the scene reads on every frame and the user adjusts via the sidebar. */
export interface SimulationSettings {
  terrain: TerrainSettings;
  lighting: LightingSettings;
}

/** A saved settings entry: the settings plus a name and a render snapshot. */
export interface StoredSimulationSettings {
  /** Entry name; also the download file name (without extension). */
  name: string;

  /** Base64-encoded PNG snapshot of the scene, without the `data:` prefix. */
  image: string;

  /** The simulation settings this entry restores. */
  settings: SimulationSettings;
}
