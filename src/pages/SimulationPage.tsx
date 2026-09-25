import { Scene } from '@/scene/Scene';
import { Sidebar } from '@/components/Sidebar';
import { useFullscreenStore } from '@/store/fullscreen';

/** Simulation view: the 3D scene beside the settings sidebar; in fullscreen only the scene remains. */
export const SimulationPage = () => {
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);

  return (
    <div className="flex h-full">
      {!isFullscreen && <Sidebar />}
      <div className="min-w-0 flex-1">
        <Scene />
      </div>
    </div>
  );
};
