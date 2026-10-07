import * as THREE from 'three';
import { isMobile } from '@/scene/mobile';
import type { LightingUniforms } from '@/scene/lighting';
import type { TerrainSettings } from '@/types';

// Assets
import terrainVertexShader from '@/assets/shaders/terrain.vert';
import terrainFragmentShader from '@/assets/shaders/terrain.frag';

/**
 * Side length of the terrain plane in world units, selected once at load; the
 * grass lays its tile grid over it. The mobile size is smaller to reduce load,
 * since the camera can't move around anyway.
 */
export const TERRAIN_SIZE = isMobile() ? 100 : 200;

/** Grid subdivisions of the terrain plane per edge, hard-coded. */
const TERRAIN_SEGMENTS = 512;

/**
 * The terrain mesh: a noise-displaced heightfield plane driven by its own shader.
 *
 * Owns the geometry, material (its own uniforms merged with the shared lighting
 * uniforms), mesh, the terrain-specific settings sync (color / height /
 * frequency), and disposal. Lighting is a separate concern and
 * is supplied in via `lightingUniforms`.
 */
export interface Terrain {
  /** The mesh to add to the scene graph. */
  mesh: THREE.Mesh;

  /**
   * Applies `terrain` to the mesh, only touching the values that changed.
   */
  sync: (terrain: TerrainSettings) => void;

  /** Sets the panorama texture the material samples through `uEnvMap`. */
  setEnvironmentMap: (texture: THREE.Texture) => void;

  /** Frees the geometry and material. */
  dispose: () => void;
}

/**
 * Creates a `Terrain` from the initial `terrain` settings and the shared
 * `lightingUniforms` (from `createLighting`). The material's uniforms merge the
 * terrain-owned uniforms with `lightingUniforms`, so a single
 * `createLighting(...).sync` also updates the lighting this material responds to.
 */
export const createTerrain = (
  settings: TerrainSettings,
  lightingUniforms: LightingUniforms,
): Terrain => {
  const placeholderEnvMap = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);

  const terrainUniforms: {
    uHeight: THREE.IUniform<number>;
    uFrequency: THREE.IUniform<number>;
    uTerrainColor: THREE.IUniform<THREE.Color>;
    uEnvMap: THREE.IUniform<THREE.Texture>;
  } = {
    uHeight: { value: settings.height },
    uFrequency: { value: settings.frequency },
    uTerrainColor: { value: new THREE.Color(settings.color) },
    // 1×1 black until the HDR resolves, so an env-map sample contributes nothing.
    uEnvMap: { value: placeholderEnvMap },
  };

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: { ...terrainUniforms, ...lightingUniforms },
  });

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS),
    material,
  );
  // Lay the plane flat in the XZ (ground) plane before the shader displaces it upward.
  mesh.rotateX(-Math.PI / 2);
  mesh.scale.setScalar(TERRAIN_SIZE);

  let syncedTerrainColor = settings.color;
  let syncedHeight = settings.height;
  let syncedFrequency = settings.frequency;

  const sync = (terrain: TerrainSettings) => {
    if (terrain.color !== syncedTerrainColor) {
      syncedTerrainColor = terrain.color;
      terrainUniforms.uTerrainColor.value.set(terrain.color);
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

  const setEnvironmentMap = (texture: THREE.Texture) => {
    terrainUniforms.uEnvMap.value = texture;
  };

  const dispose = () => {
    mesh.geometry.dispose();
    // placeholderEnvMap is owned here, the loaded HDR is disposed by the environment.
    placeholderEnvMap.dispose();
    material.dispose();
    mesh.dispose();
  };

  return { mesh, sync, setEnvironmentMap, dispose };
};
