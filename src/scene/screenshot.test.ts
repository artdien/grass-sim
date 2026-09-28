import { afterEach, describe, expect, it, vi } from 'vitest';

import { captureSceneScreenshot, registerSceneScreenshot } from '@/scene/screenshot';

const fakeError = new Error('nope');

afterEach(() => {
  registerSceneScreenshot(null);
  vi.restoreAllMocks();
});

describe('captureSceneScreenshot', () => {
  it('refuses with CAPTURE_NOT_REGISTERED when the scene is unmounted', async () => {
    registerSceneScreenshot(null);

    const result = await captureSceneScreenshot(400);

    expect(result).toEqual({ ok: false, error: 'CAPTURE_NOT_REGISTERED' });
  });

  it('forwards the width to the registered capture and returns its result', async () => {
    const fakeCapture = vi.fn().mockResolvedValue({ ok: true, data: 'aW1hZ2U' });
    registerSceneScreenshot(fakeCapture);

    const result = await captureSceneScreenshot(320);

    expect(fakeCapture).toHaveBeenCalledTimes(1);
    expect(fakeCapture).toHaveBeenCalledWith(320);
    expect(result).toEqual({ ok: true, data: 'aW1hZ2U' });
  });

  // A capture that rejects (the real one can surface a WebGL or encoding failure)
  // must not escape as an unhandled rejection — it is converted to a Result error.
  it('returns CAPTURE_FAILED (and logs) when the capture rejects', async () => {
    registerSceneScreenshot(() => {
      throw fakeError;
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await captureSceneScreenshot(400);

    expect(result).toEqual({ ok: false, error: 'CAPTURE_FAILED' });
    expect(errorSpy).toHaveBeenCalled();
  });
});
