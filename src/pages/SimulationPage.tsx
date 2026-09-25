import { Scene } from '@/scene/Scene';
import { Sidebar } from '@/components/Sidebar';
import { useFullscreenStore } from '@/store/fullscreen';

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
