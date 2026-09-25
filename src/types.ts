/**
 * Shared success/failure result. Carries `data` when `ok` is true, otherwise an
 * `error`. `E` defaults to a user-facing message string, or a union of error
 * codes when the caller must branch on it.
 */
export type Result<T = void, E = string> = { ok: true; data: T } | { ok: false; error: E };

/** Terrain generation settings: how large it is and how finely it is subdivided. */
export interface TerrainSettings {
  /** Terrain size in world units (an integer ≥ 1). */
  size: number;

  /** Grid subdivisions of the terrain plane per edge (an integer ≥ 1). */
  segments: number;
}

/** Live settings the scene reads on every frame and the user adjusts via the sidebar. */
export interface SimulationSettings {
  terrain: TerrainSettings;
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
