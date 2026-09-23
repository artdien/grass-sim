import { useState } from 'react';
import { Renderer } from '@/Renderer';
import { SideBar } from '@/SideBar';
import type { Configuration } from '@/types';

export const ConfigurationPage = () => {
  const [configuration, setConfiguration] = useState<Configuration>({
    cubeColor: '#4ade80',
    rotationSpeed: 1,
  });

  return (
    <div className="flex h-full">
      <SideBar configuration={configuration} onChange={setConfiguration} />
      <div className="min-w-0 flex-1">
        <Renderer configuration={configuration} />
      </div>
    </div>
  );
};
