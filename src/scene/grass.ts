import * as THREE from 'three';
import type { LightingUniforms } from '@/scene/lighting';
import type { GrassSettings, TerrainNoiseType, TerrainSettings, WindSettings } from '@/types';
import { loadGrassBlade } from '@/scene/grassblade';

// Assets
import grassVertexShader from '@/assets/shaders/grass.vert';
import grassFragmentShader from '@/assets/shaders/grass.frag';

// Blades per tile.
const BLADES_PER_TILE = 4096;

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
  /** The group the tiles are attached to; the owner adds it to the scene. */
  root: THREE.Group;

  /**
   * Applies the wind, grass, and placement (size, noise, height, frequency)
   * settings to the material and tiles, only touching the values that changed;
   * the tile grid is rebuilt when the size or the tile size changes. The wind
   * angle and the blade bending are converted from degrees to radians here, and
   * the time is applied on every call, as it advances every frame.
   */
  sync: (wind: WindSettings, grass: GrassSettings, terrain: TerrainSettings, time: number) => void;

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
 * bounding sphere — with the grass shader. The tiles are attached to `root`, a
 * `THREE.Group` the owner adds to the scene.
 *
 * The material's uniforms merge the grass-owned uniforms (wind, blade shape and
 * palette colors, the blade's normal map taken from the GLB, and the
 * environment map) with the shared `lightingUniforms`, so the same
 * `lighting.sync` that drives the terrain also drives this material.
 *
 * The load is asynchronous, so the scene keeps rendering without the blade
 * until the model arrives; `dispose` frees the blade's resources whether the
 * load is still pending or already attached, keeping the StrictMode
 * mount → cleanup → remount cycle leak-free.
 */
export const createGrass = (
  wind: WindSettings,
  grass: GrassSettings,
  terrain: TerrainSettings,
  lightingUniforms: LightingUniforms,
): Grass => {
  // 1×1 black until the HDR resolves, so an env-map sample contributes nothing.
  const placeholderEnvMap = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  // 1×1 flat neutral normal until the blade's own normal map resolves.
  const placeholderNormalMap = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);

  const grassUniforms: {
    uTime: THREE.IUniform<number>;
    uWindVelocity: THREE.IUniform<number>;
    uWindStrength: THREE.IUniform<number>;
    uWindAngle: THREE.IUniform<number>;
    uGrassTileSize: THREE.IUniform<number>;
    uGrassBladeWidth: THREE.IUniform<number>;
    uGrassBladeHeight: THREE.IUniform<number>;
    uGrassBladeBending: THREE.IUniform<number>;
    uGrassBladeHeightRandomness: THREE.IUniform<number>;
    uGrassBladeColorRandomness: THREE.IUniform<number>;
    uGrassBladeColorDistribution: THREE.IUniform<number>;
    uGrassBladeBaseColor1: THREE.IUniform<THREE.Color>;
    uGrassBladeTipColor1: THREE.IUniform<THREE.Color>;
    uGrassBladeBaseColor2: THREE.IUniform<THREE.Color>;
    uGrassBladeTipColor2: THREE.IUniform<THREE.Color>;
    uGrassBladeSelfShadowing: THREE.IUniform<number>;
    uNoiseType: THREE.IUniform<number>;
    uHeight: THREE.IUniform<number>;
    uFrequency: THREE.IUniform<number>;
    uNormalMap: THREE.IUniform<THREE.Texture>;
    uEnvMap: THREE.IUniform<THREE.Texture>;
  } = {
    uTime: { value: 0.0 },
    uWindVelocity: { value: wind.velocity },
    uWindStrength: { value: wind.strength },
    uWindAngle: { value: THREE.MathUtils.degToRad(wind.angle) },
    uGrassTileSize: { value: grass.tileSize },
    uGrassBladeWidth: { value: grass.bladeWidth },
    uGrassBladeHeight: { value: grass.bladeHeight },
    uGrassBladeBending: { value: THREE.MathUtils.degToRad(grass.bladeBending) },
    uGrassBladeHeightRandomness: { value: grass.heightRandomness },
    uGrassBladeColorRandomness: { value: grass.colorRandomness },
    uGrassBladeColorDistribution: { value: grass.colorDistribution },
    uGrassBladeBaseColor1: { value: new THREE.Color(grass.baseColor1) },
    uGrassBladeTipColor1: { value: new THREE.Color(grass.tipColor1) },
    uGrassBladeBaseColor2: { value: new THREE.Color(grass.baseColor2) },
    uGrassBladeTipColor2: { value: new THREE.Color(grass.tipColor2) },
    uGrassBladeSelfShadowing: { value: grass.selfShadowing },
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
  // tallest blade. All tiles reference this single instance, so resizing it in
  // place below reaches every tile without reassignment.
  const tileBoundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);

  const root = new THREE.Group();

  // Resize the shared bounds for the grid's current tile size and blade height
  // (plus the blade's height variation, which is the tallest blade a tile can grow).
  const updateTileBounds = (grassSettings: GrassSettings) => {
    const maxHeight = grassSettings.bladeHeight * (1 + 0.5 * grassSettings.heightRandomness);
    tileBoundingSphere.center.set(0, 0.5 * maxHeight, 0);
    tileBoundingSphere.radius = Math.SQRT2 * (0.5 * grassSettings.tileSize + maxHeight);
  };
  updateTileBounds(grass);

  /*
   * One InstancedMesh per tile, anchored at the tile center. The blades are placed
   * relative to that center on the GPU side (see grass.vert), so the anchor — and the
   * local-space bounds the culler tests against it — is the only per-tile state.
   */
  const createTileGrid = (size: number, tileSize: number, geometry: THREE.BufferGeometry) => {
    const tilesPerAxis = Math.max(1, Math.ceil(size / tileSize));
    const halfSize = 0.5 * tilesPerAxis * tileSize;

    const grid: THREE.InstancedMesh[] = [];
    for (let x = 0; x < tilesPerAxis; x++) {
      for (let z = 0; z < tilesPerAxis; z++) {
        const tile = new THREE.InstancedMesh(geometry, material, BLADES_PER_TILE);
        tile.position.set(-halfSize + (x + 0.5) * tileSize, 0, -halfSize + (z + 0.5) * tileSize);
        tile.boundingSphere = tileBoundingSphere;
        grid.push(tile);
      }
    }
    root.add(...grid);
    return grid;
  };

  const disposeTiles = () => {
    root.remove(...tiles);
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
    tiles = createTileGrid(syncedSize, syncedTileSize, blade.geometry);
  });

  let syncedWindVelocity = wind.velocity;
  let syncedWindStrength = wind.strength;
  let syncedWindAngle = wind.angle;

  let syncedTileSize = grass.tileSize;
  let syncedBladeWidth = grass.bladeWidth;
  let syncedBladeHeight = grass.bladeHeight;
  let syncedBladeBending = grass.bladeBending;
  let syncedHeightRandomness = grass.heightRandomness;
  let syncedColorRandomness = grass.colorRandomness;
  let syncedColorDistribution = grass.colorDistribution;
  let syncedBaseColor1 = grass.baseColor1;
  let syncedTipColor1 = grass.tipColor1;
  let syncedBaseColor2 = grass.baseColor2;
  let syncedTipColor2 = grass.tipColor2;
  let syncedSelfShadowing = grass.selfShadowing;

  const sync = (
    windSettings: WindSettings,
    grassSettings: GrassSettings,
    terrainSettings: TerrainSettings,
    time: number,
  ) => {
    grassUniforms.uTime.value = time;

    if (windSettings.velocity !== syncedWindVelocity) {
      syncedWindVelocity = windSettings.velocity;
      grassUniforms.uWindVelocity.value = windSettings.velocity;
    }

    if (windSettings.strength !== syncedWindStrength) {
      syncedWindStrength = windSettings.strength;
      grassUniforms.uWindStrength.value = windSettings.strength;
    }

    if (windSettings.angle !== syncedWindAngle) {
      syncedWindAngle = windSettings.angle;
      grassUniforms.uWindAngle.value = THREE.MathUtils.degToRad(windSettings.angle);
    }

    const boundsChanged =
      grassSettings.tileSize !== syncedTileSize ||
      grassSettings.bladeHeight !== syncedBladeHeight ||
      grassSettings.heightRandomness !== syncedHeightRandomness;

    // Tile-size changes while the blade is still loading are picked up here and
    // applied once, when the grid is created from syncedTileSize in the load callback.
    if (grassSettings.tileSize !== syncedTileSize) {
      syncedTileSize = grassSettings.tileSize;
      grassUniforms.uGrassTileSize.value = grassSettings.tileSize;
      if (bladeGeometry !== null) {
        disposeTiles();
        tiles = createTileGrid(syncedSize, syncedTileSize, bladeGeometry);
      }
    }

    if (grassSettings.bladeWidth !== syncedBladeWidth) {
      syncedBladeWidth = grassSettings.bladeWidth;
      grassUniforms.uGrassBladeWidth.value = grassSettings.bladeWidth;
    }

    if (grassSettings.bladeHeight !== syncedBladeHeight) {
      syncedBladeHeight = grassSettings.bladeHeight;
      grassUniforms.uGrassBladeHeight.value = grassSettings.bladeHeight;
    }

    if (grassSettings.bladeBending !== syncedBladeBending) {
      syncedBladeBending = grassSettings.bladeBending;
      grassUniforms.uGrassBladeBending.value = THREE.MathUtils.degToRad(grassSettings.bladeBending);
    }

    if (grassSettings.heightRandomness !== syncedHeightRandomness) {
      syncedHeightRandomness = grassSettings.heightRandomness;
      grassUniforms.uGrassBladeHeightRandomness.value = grassSettings.heightRandomness;
    }

    if (grassSettings.colorRandomness !== syncedColorRandomness) {
      syncedColorRandomness = grassSettings.colorRandomness;
      grassUniforms.uGrassBladeColorRandomness.value = grassSettings.colorRandomness;
    }

    if (grassSettings.colorDistribution !== syncedColorDistribution) {
      syncedColorDistribution = grassSettings.colorDistribution;
      grassUniforms.uGrassBladeColorDistribution.value = grassSettings.colorDistribution;
    }

    if (grassSettings.baseColor1 !== syncedBaseColor1) {
      syncedBaseColor1 = grassSettings.baseColor1;
      grassUniforms.uGrassBladeBaseColor1.value.set(grassSettings.baseColor1);
    }

    if (grassSettings.tipColor1 !== syncedTipColor1) {
      syncedTipColor1 = grassSettings.tipColor1;
      grassUniforms.uGrassBladeTipColor1.value.set(grassSettings.tipColor1);
    }

    if (grassSettings.baseColor2 !== syncedBaseColor2) {
      syncedBaseColor2 = grassSettings.baseColor2;
      grassUniforms.uGrassBladeBaseColor2.value.set(grassSettings.baseColor2);
    }

    if (grassSettings.tipColor2 !== syncedTipColor2) {
      syncedTipColor2 = grassSettings.tipColor2;
      grassUniforms.uGrassBladeTipColor2.value.set(grassSettings.tipColor2);
    }

    if (grassSettings.selfShadowing !== syncedSelfShadowing) {
      syncedSelfShadowing = grassSettings.selfShadowing;
      grassUniforms.uGrassBladeSelfShadowing.value = grassSettings.selfShadowing;
    }

    if (boundsChanged) {
      updateTileBounds(grassSettings);
    }

    // Size changes while the blade is still loading are picked up here and applied
    // once, when the grid is created from syncedSize in the load callback.
    if (terrainSettings.size !== syncedSize) {
      syncedSize = terrainSettings.size;
      if (bladeGeometry !== null) {
        disposeTiles();
        tiles = createTileGrid(syncedSize, syncedTileSize, bladeGeometry);
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
    root,
    sync,
    setEnvironmentMap,
    dispose,
  };
};
