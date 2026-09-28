import { describe, expect, it, vi } from 'vitest';

import { useFullscreenStore } from '@/store/fullscreen';

// jsdom has no Fullscreen API: `requestFullscreen` is `undefined` on DOM elements,
// so it must be assigned rather than spied on (vi.spyOn requires the property to
// already exist on the instance).
const requestFullscreen = vi.fn();
(document.documentElement as unknown as Record<string, unknown>).requestFullscreen =
  requestFullscreen;

describe('useFullscreenStore', () => {
  it('requests fullscreen on the document element', () => {
    requestFullscreen.mockClear();

    useFullscreenStore.getState().enterFullscreen();

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });
});
