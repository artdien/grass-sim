import { create } from 'zustand';

import type { SimulationSettings } from '@/types';

interface SimulationState {
  settings: SimulationSettings;
  updateSettings: (settings: SimulationSettings) => void;
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  settings: {
    cubeColor: '#4ade80',
    rotationSpeed: 1,
  },
  updateSettings: (settings) => set({ settings }),
}));
