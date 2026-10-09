import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Assets
import grassbladeHighUrl from '@/assets/models/grassblade-high.glb?url';
import grassbladeLowUrl from '@/assets/models/grassblade-low.glb?url';

/**
 * The extracted grass blade: the full-poly and low-poly geometries every
 * `InstancedMesh` tile reuses, plus the blade's baked normal map (shared by
 * both poly levels and re-sampled by the grass shader through `uNormalMap`).
 */
export interface GrassBlade {
  /** The full-poly blade geometry, reused by the near tiles. */
  highGeometry: THREE.BufferGeometry;

  /** The low-poly blade geometry, reused by the far tiles. */
  lowGeometry: THREE.BufferGeometry;

  /** The blades' shared baked normal map, or `null` if the model carried none. */
  normalMap: THREE.Texture | null;
}

/** The blade extracted from a single loaded model. */
interface BladeMesh {
  geometry: THREE.BufferGeometry;
  normalMap: THREE.Texture | null;
}

/** Returns the first blade mesh's geometry and its first non-null baked normal map, or `null` if the model carries no blade mesh. */
const extractBlade = (scene: THREE.Object3D): BladeMesh | null => {
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
 * Loads the grass blade with a `GLTFLoader`, extracting the full-poly and
 * low-poly geometries plus the blades' shared baked normal map, and frees the
 * rest of each model. The full-poly geometry drives the near tiles and the
 * low-poly one the far tiles.
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
    b.highGeometry.dispose();
    b.lowGeometry.dispose();
    b.normalMap?.dispose();
  };

  const loadOne = (url: string): Promise<BladeMesh | null> =>
    new GLTFLoader().loadAsync(url).then((gltf) => {
      const extracted = extractBlade(gltf.scene);
      if (extracted === null) {
        // No blade mesh in the model; free its resources.
        disposeBlade(gltf.scene, null, null);
        return null;
      }
      // The baked material is dead weight once the shader material takes over;
      // free it while keeping the geometry and the normal map the shader samples.
      disposeBlade(gltf.scene, extracted.geometry, extracted.normalMap);
      return extracted;
    });

  Promise.all([loadOne(grassbladeHighUrl), loadOne(grassbladeLowUrl)])
    .then(([high, low]) => {
      if (high === null || low === null) {
        // A model carried no blade mesh; free whichever one did arrive.
        high?.geometry.dispose();
        low?.geometry.dispose();
        high?.normalMap?.dispose();
        low?.normalMap?.dispose();
        return;
      }

      // The shader samples a single normal map, so the blade's poly levels share
      // one: keep the full-poly's (falling back to the low-poly's) and free the
      // other.
      const keptNormalMap = high.normalMap ?? low.normalMap;
      if (high.normalMap !== keptNormalMap) {
        high.normalMap?.dispose();
      }
      if (low.normalMap !== keptNormalMap) {
        low.normalMap?.dispose();
      }

      const extractedBlade: GrassBlade = {
        highGeometry: high.geometry,
        lowGeometry: low.geometry,
        normalMap: keptNormalMap,
      };

      if (disposed) {
        // The load resolved after the caller disposed; free the blade and drop it.
        free(extractedBlade);
        return;
      }

      blade = extractedBlade;
      onBlade(extractedBlade);
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
