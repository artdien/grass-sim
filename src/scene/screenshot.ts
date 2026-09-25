// The scene registers a capture function here so UI outside the Scene component
// can request a render snapshot imperatively, without any React subscription
// and without recreating the renderer.

import type { Result } from '@/types';

/** Result type for a screenshot: either contains the data as base64 PNG or an error */
export type ScreenshotResult = Result<string, 'NOT_MOUNTED' | 'CAPTURE_FAILED'>;

/** A mounted scene's capture: render once and return a fixed-width base64 PNG. */
export type ScreenshotCapture = (width: number) => Promise<ScreenshotResult>;

let capture: ScreenshotCapture | null = null;

/**
 * Registers the scene's capture function so `captureSceneScreenshot` can call it,
 * or clears it with `null` when the scene unmounts so requests fail with `NOT_MOUNTED`.
 */
export const registerSceneScreenshot = (fn: ScreenshotCapture | null) => {
  capture = fn;
};

/**
 * Returns the current render as a fixed-width base64 PNG (no data-URL prefix),
 * or a Result error: `NOT_MOUNTED` when no scene is mounted, `CAPTURE_FAILED`
 * (with the underlying error logged) when the capture throws.
 */
export const captureSceneScreenshot = async (width: number): Promise<ScreenshotResult> => {
  if (!capture) {
    return { ok: false, error: 'NOT_MOUNTED' };
  }

  try {
    return await capture(width);
  } catch (error) {
    console.error('Scene screenshot capture failed:', error);
    return { ok: false, error: 'CAPTURE_FAILED' };
  }
};
