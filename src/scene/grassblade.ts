import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Asset
import grassbladeUrl from '@/assets/models/grassblade.glb?url';

/**
 * The extracted grass blade: the geometry every `InstancedMesh` tile reuses and
 * the blade's baked normal map (re-sampled by the grass shader through
 * `uNormalMap`).
 */
export interface GrassBlade {
  /** The blade geometry, reused by every `InstancedMesh` tile. */
  geometry: THREE.BufferGeometry;

  /** The blade's baked normal map, or `null` if the model carried none. */
  normalMap: THREE.Texture | null;
}

/** Returns the first blade mesh's geometry and its first non-null baked normal map, or `null` if the model carries no blade mesh. */
const extractBlade = (scene: THREE.Object3D): GrassBlade | null => {
  let geometry: THREE.BufferGeometry | null = null;
  let normalMap: THREE.Texture | null = null;

  scene.traverse((child) => {
    if (geometry === null && child instanceof THREE.Mesh) {
      // `instanceof` on the generic `THREE.Mesh` narrows its type arguments to `any`;
      // the cast restores the default instantiation so member access stays typed.
      const mesh = child as THREE.Mesh;
      geometry = mesh.geometry;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        const candidate = (material as THREE.MeshStandardMaterial).normalMap;
        if (candidate !== null) {
          normalMap = candidate;
          break;
        }
      }
    }
  });

  if (geometry === null) {
    return null;
  }
  return { geometry, normalMap };
};

// Frees a baked material's textures (except `keep`, which the grass shader
// samples from now on) and the material itself.
const disposeBakedMaterial = (baked: THREE.Material, keep: THREE.Texture | null) => {
  for (const value of Object.values(baked)) {
    const texture = value as THREE.Texture | null;
    if (texture instanceof THREE.Texture && texture !== keep) {
      texture.dispose();
    }
  }
  baked.dispose();
};

/** Frees every mesh's geometry (except `keepGeometry`) and baked material (except `keepTexture`) in `root`; pass `null` for both to free the whole model. */
const disposeBlade = (
  root: THREE.Object3D,
  keepGeometry: THREE.BufferGeometry | null,
  keepTexture: THREE.Texture | null,
) => {
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry !== keepGeometry) {
        mesh.geometry.dispose();
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((baked) => disposeBakedMaterial(baked, keepTexture));
    }
  });
};

/**
 * Loads the grass blade with a `GLTFLoader`, extracts the first blade mesh's
 * geometry and its baked normal map, frees the rest of the model, and hands the
 * blade to `onBlade`.
 *
 * The load is asynchronous, so `onBlade` may land after the caller has already
 * been disposed. The returned `dispose` drops the load and frees the blade's
 * resources whether the load is still pending, has resolved, or failed — so
 * `onBlade` is never called after it, keeping the StrictMode mount → cleanup →
 * remount cycle leak-free.
 */
export const loadGrassBlade = (onBlade: (blade: GrassBlade) => void): (() => void) => {
  let disposed = false;
  let blade: GrassBlade | null = null;

  const free = (b: GrassBlade) => {
    b.geometry.dispose();
    b.normalMap?.dispose();
  };

  new GLTFLoader()
    .loadAsync(grassbladeUrl)
    .then((gltf) => {
      const extracted = extractBlade(gltf.scene);
      if (extracted === null) {
        // No blade mesh in the model; free its resources and drop the load.
        disposeBlade(gltf.scene, null, null);
        return;
      }

      blade = extracted;
      // The baked material is dead weight once the shader material takes over;
      // free it while keeping the geometry and the normal map the shader samples.
      disposeBlade(gltf.scene, extracted.geometry, extracted.normalMap);

      if (disposed) {
        // The load resolved after the caller disposed; free the blade and drop it.
        free(extracted);
        blade = null;
        return;
      }

      onBlade(extracted);
    })
    .catch((error: unknown) => {
      console.error('Failed to load the grass blade model:', error);
    });

  return () => {
    disposed = true;
    if (blade !== null) {
      free(blade);
      blade = null;
    }
  };
};
