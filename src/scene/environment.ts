import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import envMapUrl from '@/assets/envmaps/map.hdr?url';

/**
 * The equirectangular HDR environment map. `createEnvironment` loads
 * `map.hdr` and hands the resolved texture to its `onTextureLoad` callback,
 * where the owner sets it as `scene.background`, replacing the solid
 * placeholder the scene starts with.
 */
export interface Environment {
  /** Frees the loaded texture (a no-op if it is still loading or failed). */
  dispose: () => void;
}

/**
 * Loads the scene's HDR environment map with an `HDRLoader` and, once
 * resolved, hands it to `onTextureLoad` configured as a 2:1 spherical
 * panorama (`EquirectangularReflectionMapping`), so the caller sets it as
 * `scene.background` and other owners can sample it.
 *
 * The load is asynchronous, so the scene keeps rendering its placeholder
 * background until the texture resolves. `dispose` releases the texture
 * whether the load is still pending or already handed out, keeping the
 * StrictMode mount → cleanup → remount cycle free of leaked textures.
 */
export const createEnvironment = (
  onTextureLoad?: (texture: THREE.Texture) => void,
): Environment => {
  const loader = new HDRLoader();
  let texture: THREE.Texture | null = null;
  let disposed = false;

  loader
    .loadAsync(envMapUrl)
    .then((envMap) => {
      if (disposed) {
        // The effect cleaned up before the load resolved, so there is nothing to hand out.
        envMap.dispose();
        return;
      }
      texture = envMap;
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      onTextureLoad?.(envMap);
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
