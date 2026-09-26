// The scene registers a capture function here so UI outside the Scene component
// can request a render snapshot imperatively, without any React subscription
// and without recreating the renderer.

import type * as THREE from 'three';
import type { Result } from '@/types';

/** Result type for a screenshot: either contains the data as base64 PNG or an error */
export type ScreenshotResult = Result<string, 'CAPTURE_NOT_REGISTERED' | 'CAPTURE_FAILED'>;

/** A mounted scene's capture: render once and return a fixed-width base64 PNG. */
export type ScreenshotCapture = (width: number) => Promise<ScreenshotResult>;

let capture: ScreenshotCapture | null = null;

/**
 * Registers the scene's capture function so `captureSceneScreenshot` can call it,
 * or clears it with `null` when the scene unmounts so requests fail with `CAPTURE_NOT_REGISTERED`.
 */
export const registerSceneScreenshot = (fn: ScreenshotCapture | null) => {
  capture = fn;
};

/**
 * Returns the current render as a fixed-width base64 PNG (no data-URL prefix),
 * or a Result error: `CAPTURE_NOT_REGISTERED` when no capture is registered,
 * `CAPTURE_FAILED` (with the underlying error logged) when the capture throws.
 */
export const captureSceneScreenshot = async (width: number): Promise<ScreenshotResult> => {
  if (!capture) {
    return { ok: false, error: 'CAPTURE_NOT_REGISTERED' };
  }

  try {
    return await capture(width);
  } catch (error) {
    console.error('Scene screenshot capture failed:', error);
    return { ok: false, error: 'CAPTURE_FAILED' };
  }
};

/**
 * Builds the scene's capture function: render once to the existing renderer,
 * snapshot the canvas, and scale the result down to `width` so the stored image
 * stays small even when the window is maximized.
 *
 * `image.decode()` rejects when the load fails, so the async function
 * propagates the error instead of needing an onerror callback.
 */
export const createSceneCapture = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): ScreenshotCapture => {
  return async (width: number) => {
    renderer.render(scene, camera);

    const source = renderer.domElement.toDataURL('image/png');
    const image = new Image();
    image.src = source;
    await image.decode();

    // Scale down canvas to provided width.
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * width));

    const context = canvas.getContext('2d');
    if (!context) {
      console.warn(
        'Could not obtain a 2D canvas context for screenshot scaling, falling back to full resolution',
      );
      return { ok: true, data: source.split(',')[1] ?? '' };
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { ok: true, data: canvas.toDataURL('image/png').split(',')[1] ?? '' };
  };
};
