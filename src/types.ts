/**
 * Shared success/failure result. Carries `data` when `ok` is true, otherwise an
 * `error`. `E` defaults to a user-facing message string, or a union of error
 * codes when the caller must branch on it.
 */
export type Result<T = void, E = string> = { ok: true; data: T } | { ok: false; error: E };

/** Live settings the scene reads on every frame and the user adjusts via the sidebar. */
export interface SimulationSettings {
  /** CSS color string for the scene's cube. */
  cubeColor: string;

  /** Multiplier for the scene's rotation speed (1 is the default). */
  rotationSpeed: number;
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
