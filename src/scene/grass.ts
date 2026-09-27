import * as THREE from 'three';
import type { LightingUniforms } from '@/scene/lighting';
import type { TerrainNoiseType, TerrainSettings } from '@/types';
import { loadGrassBlade } from '@/scene/grassblade';

// Assets
import grassVertexShader from '@/assets/shaders/grass.vert';
import grassFragmentShader from '@/assets/shaders/grass.frag';

// Blades per tile.
const BLADES_PER_TILE = 4096;

// Tile side length in world units; must match GRASS_TILE_SIZE in grass.vert.
const GRASS_TILE_SIZE = 10;

// Upper bound on the blade height (see the constants in grass.vert); keeps wind
// bending inside the tile bounds.
const BLADE_MAX_HEIGHT = 2.0;

// Index into the noise function chosen by the shader (see grass.vert).
const NOISE_TYPE_INDEX: Record<TerrainNoiseType, number> = { perlin: 0, simplex: 1 };

/**
 * The grass: a grid of instanced blades covering the terrain — one
 * `InstancedMesh` per tile, each blade from `grassblade.glb` standing along
 * the +Y axis at the model origin and rendered through the shared grass
 * shader.
 *
 * Owns the grass shader material (grass.vert/grass.frag, modeled on the
 * terrain's, with the blade's normal map applied through a world-space TBN
 * basis), the per-tile bounding spheres that drive the per-tile frustum
 * culling, and disposal; the blade itself is loaded by the `grassblade`
 * module. Like the terrain, it sits at the terrain height of its own position
 * and is lit by the shared lighting uniforms and the HDR environment map.
 */
export interface Grass {
  /** Applies the placement settings (size, noise, height, frequency) to the tiles, only touching the values that changed; the tile grid is rebuilt when the size changes. The time is applied on every call, as it advances every frame. */
  sync: (terrain: TerrainSettings, time: number) => void;

  /** Sets the environment texture the material samples through `uEnvMap`. */
  setEnvironmentMap: (texture: THREE.Texture) => void;

  /**
   * Frees the geometry, the material (textures included), and the tiles'
   * instance attributes (a no-op if still loading or if the load failed).
   */
  dispose: () => void;
}

/**
 * Renders the grass blade (loaded asynchronously by the `grassblade` module)
 * as a grid of `InstancedMesh` tiles over the blade geometry — one instanced
 * mesh per tile, each centered on a tile of its own position and culled by its
 * bounding sphere — with the grass shader, added to `scene`.
 *
 * The material's uniforms merge the grass-owned uniforms (placement, color,
 * the blade's normal map taken from the GLB, and the environment map) with
 * the shared `lightingUniforms`, so the same `lighting.sync` that drives the
 * terrain also drives this material.
 *
 * The load is asynchronous, so the scene keeps rendering without the blade
 * until the model arrives; `dispose` frees the blade's resources whether the
 * load is still pending or already attached, keeping the StrictMode
 * mount → cleanup → remount cycle leak-free.
 */
export const createGrass = (
  scene: THREE.Scene,
  terrain: TerrainSettings,
  lightingUniforms: LightingUniforms,
): Grass => {
  // 1×1 black until the HDR resolves, so an env-map sample contributes nothing.
  const placeholderEnvMap = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  // 1×1 flat neutral normal until the blade's own normal map resolves.
  const placeholderNormalMap = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);

  const grassUniforms: {
    uTime: THREE.IUniform<number>;
    uNoiseType: THREE.IUniform<number>;
    uHeight: THREE.IUniform<number>;
    uFrequency: THREE.IUniform<number>;
    uNormalMap: THREE.IUniform<THREE.Texture>;
    uEnvMap: THREE.IUniform<THREE.Texture>;
  } = {
    uTime: { value: 0.0 },
    uNoiseType: { value: NOISE_TYPE_INDEX[terrain.noiseType] },
    uHeight: { value: terrain.height },
    uFrequency: { value: terrain.frequency },
    uNormalMap: { value: placeholderNormalMap },
    uEnvMap: { value: placeholderEnvMap },
  };

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    // The shader reads the tangent attribute, which three's prologue only
    // declares under this define; the GLB carries it on the blade geometry.
    defines: { USE_TANGENT: '' },
    // The blade is a single flat plane with UVs on one face.
    side: THREE.DoubleSide,
    uniforms: { ...grassUniforms, ...lightingUniforms },
  });

  let bladeGeometry: THREE.BufferGeometry | null = null;
  let tiles: THREE.InstancedMesh[] = [];

  let syncedSize = terrain.size;
  let syncedNoiseType = terrain.noiseType;
  let syncedHeight = terrain.height;
  let syncedFrequency = terrain.frequency;

  // The shared local-space bounds of a tile, covering its full extent plus the
  // blade height; identical for all tiles so it is constructed once.
  const tileBoundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, BLADE_MAX_HEIGHT / 2, 0),
    Math.SQRT2 * (GRASS_TILE_SIZE / 2 + BLADE_MAX_HEIGHT),
  );

  /*
   * One InstancedMesh per tile, anchored at the tile center. The blades are placed
   * relative to that center on the GPU side (see grass.vert), so the anchor — and the
   * local-space bounds the culler tests against it — is the only per-tile state.
   */
  const createTileGrid = (size: number, geometry: THREE.BufferGeometry) => {
    const tilesPerAxis = Math.max(1, Math.ceil(size / GRASS_TILE_SIZE));
    const halfSize = 0.5 * tilesPerAxis * GRASS_TILE_SIZE;

    const grid: THREE.InstancedMesh[] = [];
    for (let x = 0; x < tilesPerAxis; x++) {
      for (let z = 0; z < tilesPerAxis; z++) {
        const tile = new THREE.InstancedMesh(geometry, material, BLADES_PER_TILE);
        tile.position.set(
          -halfSize + (x + 0.5) * GRASS_TILE_SIZE,
          0,
          -halfSize + (z + 0.5) * GRASS_TILE_SIZE,
        );
        tile.boundingSphere = tileBoundingSphere;
        grid.push(tile);
      }
    }
    scene.add(...grid);
    return grid;
  };

  const disposeTiles = () => {
    scene.remove(...tiles);
    tiles.forEach((tile) => {
      tile.instanceMatrix.dispose();
      tile.dispose();
    });
    tiles = [];
  };

  const disposeGrassBlade = loadGrassBlade((blade) => {
    bladeGeometry = blade.geometry;
    if (blade.normalMap !== null) {
      grassUniforms.uNormalMap.value = blade.normalMap;
    }
    tiles = createTileGrid(syncedSize, blade.geometry);
  });

  const sync = (terrainSettings: TerrainSettings, time: number) => {
    grassUniforms.uTime.value = time;

    // Size changes while the blade is still loading are picked up here and applied
    // once, when the grid is created from syncedSize in the load callback.
    if (terrainSettings.size !== syncedSize) {
      syncedSize = terrainSettings.size;
      if (bladeGeometry !== null) {
        disposeTiles();
        tiles = createTileGrid(syncedSize, bladeGeometry);
      }
    }

    if (terrainSettings.noiseType !== syncedNoiseType) {
      syncedNoiseType = terrainSettings.noiseType;
      grassUniforms.uNoiseType.value = NOISE_TYPE_INDEX[terrainSettings.noiseType];
    }

    if (terrainSettings.height !== syncedHeight) {
      syncedHeight = terrainSettings.height;
      grassUniforms.uHeight.value = syncedHeight;
    }

    if (terrainSettings.frequency !== syncedFrequency) {
      syncedFrequency = terrainSettings.frequency;
      grassUniforms.uFrequency.value = syncedFrequency;
    }
  };

  const setEnvironmentMap = (texture: THREE.Texture) => {
    grassUniforms.uEnvMap.value = texture;
  };

  const dispose = () => {
    disposeTiles();
    // The blade's geometry and normal map are owned by the loader; free them through it.
    disposeGrassBlade();
    material.dispose();
    // The placeholders are owned here; the loaded HDR is disposed by the environment.
    placeholderEnvMap.dispose();
    placeholderNormalMap.dispose();
  };

  return {
    sync,
    setEnvironmentMap,
    dispose,
  };
};
