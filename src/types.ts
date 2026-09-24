export interface SimulationSettings {
  cubeColor: string;
  rotationSpeed: number;
}

export interface StoredSimulationSettings extends SimulationSettings {
  name: string;
  image: string; // Base64 encoded
}
