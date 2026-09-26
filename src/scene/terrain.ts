import * as THREE from 'three';
import type { LightingUniforms } from '@/scene/lighting';
import type { TerrainNoiseType, TerrainSettings } from '@/types';

// Assets
import terrainVertexShader from '@/assets/shaders/terrain.vert';
import terrainFragmentShader from '@/assets/shaders/terrain.frag';

// Index into the noise function chosen by the shader (see terrain.vert).
const NOISE_TYPE_INDEX: Record<TerrainNoiseType, number> = { perlin: 0, simplex: 1 };

/**
 * The terrain mesh: a noise-displaced heightfield plane driven by its own shader.
 *
 * Owns the geometry, material (its own uniforms merged with the shared lighting
 * uniforms), mesh, the terrain-specific settings sync (size / segments / color /
 * noise / height / frequency), and disposal. Lighting is a separate concern and
 * is supplied in via `lightingUniforms`.
 */
export interface Terrain {
  /** The mesh to add to the scene graph. */
  mesh: THREE.Mesh;

  /**
   * Applies `terrain` to the mesh, only touching the values that changed.
   * Furthermore, the underlying plane mesh is rebuilt only when the segment count changes.
   */
  sync: (terrain: TerrainSettings) => void;

  /** Frees the geometry and material. */
  dispose: () => void;
}

/**
 * Creates a `Terrain` from the initial `terrain` settings and the shared
 * `lightingUniforms` (from `createLighting`). The material's uniforms merge the
 * terrain-owned uniforms with `lightingUniforms`, so a single
 * `createLighting(...).apply` also updates the lighting this material responds to.
 */
export const createTerrain = (
  settings: TerrainSettings,
  lightingUniforms: LightingUniforms,
): Terrain => {
  const terrainUniforms: {
    uNoiseType: THREE.IUniform<number>;
    uHeight: THREE.IUniform<number>;
    uFrequency: THREE.IUniform<number>;
    uTerrainColor: THREE.IUniform<THREE.Color>;
  } = {
    uNoiseType: { value: NOISE_TYPE_INDEX[settings.noiseType] },
    uHeight: { value: settings.height },
    uFrequency: { value: settings.frequency },
    uTerrainColor: { value: new THREE.Color(settings.color) },
  };

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: { ...terrainUniforms, ...lightingUniforms },
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, settings.segments, settings.segments),
    material,
  );
  // Lay the plane flat in the XZ (ground) plane before the shader displaces it upward.
  mesh.rotateX(-Math.PI / 2);
  mesh.scale.setScalar(settings.size);

  let syncedSize = settings.size;
  let syncedSegments = settings.segments;
  let syncedTerrainColor = settings.color;
  let syncedNoiseType = settings.noiseType;
  let syncedHeight = settings.height;
  let syncedFrequency = settings.frequency;

  const sync = (terrain: TerrainSettings) => {
    if (terrain.size !== syncedSize) {
      syncedSize = terrain.size;
      mesh.scale.setScalar(terrain.size);
    }

    // Rebuilding the plane geometry is expensive, so it only happens when the
    // segment count actually changes and the replaced geometry is disposed.
    if (terrain.segments !== syncedSegments) {
      syncedSegments = terrain.segments;
      const oldGeometry = mesh.geometry;
      mesh.geometry = new THREE.PlaneGeometry(1, 1, terrain.segments, terrain.segments);
      oldGeometry.dispose();
    }

    if (terrain.color !== syncedTerrainColor) {
      syncedTerrainColor = terrain.color;
      terrainUniforms.uTerrainColor.value.set(terrain.color);
    }

    if (terrain.noiseType !== syncedNoiseType) {
      syncedNoiseType = terrain.noiseType;
      terrainUniforms.uNoiseType.value = NOISE_TYPE_INDEX[terrain.noiseType];
    }

    if (terrain.height !== syncedHeight) {
      syncedHeight = terrain.height;
      terrainUniforms.uHeight.value = terrain.height;
    }

    if (terrain.frequency !== syncedFrequency) {
      syncedFrequency = terrain.frequency;
      terrainUniforms.uFrequency.value = terrain.frequency;
    }
  };

  const dispose = () => {
    mesh.geometry.dispose();
    material.dispose();
    mesh.dispose();
  };

  return { mesh, sync, dispose };
};
