import { create } from 'zustand';

interface FullscreenState {
  isFullscreen: boolean;
  enterFullscreen: () => void;
}

export const useFullscreenStore = create<FullscreenState>()(() => ({
  isFullscreen: document.fullscreenElement !== null,
  enterFullscreen: () => {
    void document.documentElement.requestFullscreen();
  },
}));
