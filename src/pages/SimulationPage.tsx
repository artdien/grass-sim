import { Scene } from '@/scene/Scene';
import { Sidebar } from '@/components/Sidebar';

export const SimulationPage = () => {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Scene />
      </div>
    </div>
  );
};
