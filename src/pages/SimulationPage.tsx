import { useState } from 'react';
import { Scene } from '@/scene/Scene';
import { Sidebar } from '@/components/Sidebar';
import type { SimulationSettings } from '@/types';

export const SimulationPage = () => {
  const [settings, setSettings] = useState<SimulationSettings>({
    cubeColor: '#4ade80',
    rotationSpeed: 1,
  });

  return (
    <div className="flex h-full">
      <Sidebar settings={settings} onChange={setSettings} />
      <div className="min-w-0 flex-1">
        <Scene settings={settings} />
      </div>
    </div>
  );
};
