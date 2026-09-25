import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useFullscreenStore } from '@/store/fullscreen';

export const App = () => {
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);

  useEffect(() => {
    const handleFullscreenChange = () => {
      useFullscreenStore.setState({ isFullscreen: document.fullscreenElement !== null });
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-green-50">
      {!isFullscreen && <Navbar />}
      <main className="relative min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};
