import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import envMapUrl from '@/assets/envmaps/map.hdr?url';

/**
 * The equirectangular HDR scene background. `createEnvironment` loads
 * `map.hdr` and, once done, uses it as `scene.background`, replacing the
 * solid placeholder the scene starts with.
 */
export interface Environment {
  /** Frees the loaded texture (a no-op if it is still loading or failed). */
  dispose: () => void;
}

/**
 * Loads the scene's HDR environment map with an `HDRLoader` and uses it as
 * `scene.background`, configured as a 2:1 spherical panorama
 * (`EquirectangularReflectionMapping`).
 *
 * The load is asynchronous, so the scene keeps rendering its placeholder
 * background until the texture resolves. `dispose` releases the texture whether
 * the load is still pending or already attached, keeping the StrictMode
 * mount → cleanup → remount cycle free of leaked textures.
 */
export const createEnvironment = (scene: THREE.Scene): Environment => {
  const loader = new HDRLoader();
  let texture: THREE.Texture | null = null;
  let disposed = false;

  loader
    .loadAsync(envMapUrl)
    .then((envMap) => {
      if (disposed) {
        // The effect cleaned up before the load resolved, so there is nothing to attach it to.
        envMap.dispose();
        return;
      }
      texture = envMap;
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = envMap;
    })
    .catch((error: unknown) => {
      console.error('Failed to load the environment map:', error);
    });

  const dispose = () => {
    disposed = true;
    texture?.dispose();
    texture = null;
  };

  return { dispose };
};
