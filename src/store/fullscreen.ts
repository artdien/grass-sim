import { create } from 'zustand';

interface FullscreenState {
  /** Whether the document currently has fullscreen. */
  isFullscreen: boolean;

  /** Requests fullscreen on the document. */
  enterFullscreen: () => void;
}

/** Zustand store mirroring the document's fullscreen state. */
export const useFullscreenStore = create<FullscreenState>()(() => ({
  isFullscreen: document.fullscreenElement !== null,

  enterFullscreen: () => {
    void document.documentElement.requestFullscreen();
  },
}));
