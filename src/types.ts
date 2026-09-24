export type Result<T = void, E = string> = { ok: true; data: T } | { ok: false; error: E };

export interface SimulationSettings {
  cubeColor: string;
  rotationSpeed: number;
}

export interface StoredSimulationSettings {
  name: string;
  image: string; // Base64 encoded
  settings: SimulationSettings;
}
