import * as THREE from 'three';
import type { LightingUniforms } from '@/scene/lighting';
import type { GrassSettings, TerrainSettings, WindSettings } from '@/types';
import { loadGrassBlade } from '@/scene/grassblade';
import { TERRAIN_SIZE } from '@/scene/terrain';
import { isMobile } from '@/scene/mobile';

// Assets
import grassVertexShader from '@/assets/shaders/grass.vert';
import grassFragmentShader from '@/assets/shaders/grass.frag';

// Blades per tile.
const GRASS_BLADES_PER_TILE = 5000;

// Side length of a grass tile in world units, hard-coded.
const GRASS_TILE_SIZE = 10;

/**
 * Tiles thin their blades with the camera distance: full density within the
 * near distance, easing down to this fraction of the blades by the far
 * distance where they stay. Nothing is exposed by the thinning, as the terrain
 * beneath the blades is opaque.
 */
const GRASS_DENSITY_FLOOR = 0.1;

const GRASS_DENSITY_NEAR_DISTANCE = isMobile() ? 25 : 50;
const GRASS_DENSITY_FAR_DISTANCE = isMobile() ? 50 : 100;

/**
 * The grass: a grid of instanced blades covering the terrain — one
 * `InstancedMesh` per tile, each blade standing along
 * the +Y axis at the model origin and rendered through the shared grass
 * shader.
 *
 * Owns the grass shader material (grass.vert/grass.frag, modeled on the
 * terrain's, with the blade's normal map applied through a world-space TBN
 * basis), the per-tile bounding spheres that drive the per-tile frustum
 * culling, and disposal; the blades themselves (full-poly for the near tiles,
 * low-poly for the far) are loaded by the `grassblade` module. Like the
 * terrain, it sits at the terrain height of its own position and is lit by the
 * shared lighting uniforms and the HDR environment map.
 */
export interface Grass {
  /** The group the tiles are attached to; the owner adds it to the scene. */
  root: THREE.Group;

  /**
   * Applies the wind, grass, and placement (height, frequency)
   * settings to the material and tiles, only touching the values that changed;
   * the tile grid is created once, when the blade arrives. The wind
   * angle and the blade bending are converted from degrees to radians here, and
   * the time is applied on every call, as it advances every frame.
   */
  sync: (wind: WindSettings, grass: GrassSettings, terrain: TerrainSettings, time: number) => void;

  /** Sets the environment texture the material samples through `uEnvMap`. */
  setEnvironmentMap: (texture: THREE.Texture) => void;

  /**
   * Thins the blades each tile draws in proportion to the camera's distance,
   * from full density near the camera down to a floor, and switches each tile
   * from the full-poly to the low-poly blade as it thins; a no-op before the
   * blade arrives.
   */
  updateDensity: (cameraPosition: THREE.Vector3) => void;

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
    uWindRandomness: THREE.IUniform<number>;
    uWindAngle: THREE.IUniform<number>;
    uGrassTileSize: THREE.IUniform<number>;
    uGrassBladeWidth: THREE.IUniform<number>;
    uGrassBladeHeight: THREE.IUniform<number>;
    uGrassBladeBending: THREE.IUniform<number>;
    uGrassBladeHeightRandomness: THREE.IUniform<number>;
    uGrassBladeColorMix: THREE.IUniform<number>;
    uGrassBladeColorDistribution: THREE.IUniform<number>;
    uGrassBladeBaseColor1: THREE.IUniform<THREE.Color>;
    uGrassBladeTipColor1: THREE.IUniform<THREE.Color>;
    uGrassBladeBaseColor2: THREE.IUniform<THREE.Color>;
    uGrassBladeTipColor2: THREE.IUniform<THREE.Color>;
    uGrassBladeThickening: THREE.IUniform<number>;
    uGrassBladeShadowing: THREE.IUniform<number>;
    uDiffuseSoftness: THREE.IUniform<number>;
    uHeight: THREE.IUniform<number>;
    uFrequency: THREE.IUniform<number>;
    uNormalMap: THREE.IUniform<THREE.Texture>;
    uEnvMap: THREE.IUniform<THREE.Texture>;
  } = {
    uTime: { value: 0.0 },
    uWindVelocity: { value: wind.velocity },
    uWindRandomness: { value: wind.randomness },
    uWindAngle: { value: THREE.MathUtils.degToRad(wind.angle) },
    uGrassTileSize: { value: GRASS_TILE_SIZE },
    uGrassBladeWidth: { value: grass.bladeWidth },
    uGrassBladeHeight: { value: grass.bladeHeight },
    uGrassBladeBending: { value: THREE.MathUtils.degToRad(grass.bladeBending) },
    uGrassBladeHeightRandomness: { value: grass.bladeHeightRandomness },
    uGrassBladeColorMix: { value: grass.colorMix },
    uGrassBladeColorDistribution: { value: grass.colorDistribution },
    uGrassBladeBaseColor1: { value: new THREE.Color(grass.baseColor1) },
    uGrassBladeTipColor1: { value: new THREE.Color(grass.tipColor1) },
    uGrassBladeBaseColor2: { value: new THREE.Color(grass.baseColor2) },
    uGrassBladeTipColor2: { value: new THREE.Color(grass.tipColor2) },
    uGrassBladeThickening: { value: grass.bladeThickening },
    uGrassBladeShadowing: { value: grass.shadowing },
    uDiffuseSoftness: { value: grass.softness },
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

  let tiles: THREE.InstancedMesh[] = [];
  // The blades' two poly levels; both are loaded together, so once either is
  // set the other is too. The tiles start on the full-poly geometry and are
  // reassigned in `updateDensity` as they distance from the camera.
  let highGeometry: THREE.BufferGeometry | null = null;
  let lowGeometry: THREE.BufferGeometry | null = null;

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
    const maxHeight = grassSettings.bladeHeight * (1 + 0.5 * grassSettings.bladeHeightRandomness);
    tileBoundingSphere.center.set(0, 0.5 * maxHeight, 0);
    tileBoundingSphere.radius = Math.SQRT2 * (0.5 * GRASS_TILE_SIZE + maxHeight);
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
        // Tiles default to the full-poly blade; `updateDensity` reassigns the far
        // ones to the low-poly geometry as the camera moves.
        const tile = new THREE.InstancedMesh(geometry, material, GRASS_BLADES_PER_TILE);
        tile.position.set(-halfSize + (x + 0.5) * tileSize, 0, -halfSize + (z + 0.5) * tileSize);
        tile.boundingSphere = tileBoundingSphere;
        grid.push(tile);
      }
    }
    root.add(...grid);
    return grid;
  };

  // Blades within a tile are uniformly random (the blade's position is a pure
  // PCG function of its instance ID), so drawing a prefix of the instances
  // thins the blade field uniformly rather than clustering it in a corner.
  //
  // The same near→far cutoff that drives the density also drives the poly level:
  // a tile is "far" once its density has begun dropping (past the near distance),
  // so it switches to the low-poly blade — the blades there are already thinned
  // and seen from farther away, so the lower triangle count suffices.
  const updateDensity = (cameraPosition: THREE.Vector3) => {
    for (const tile of tiles) {
      const distance = cameraPosition.distanceTo(tile.position);
      const falloff =
        1.0 -
        THREE.MathUtils.smoothstep(
          distance,
          GRASS_DENSITY_NEAR_DISTANCE,
          GRASS_DENSITY_FAR_DISTANCE,
        );
      const density = GRASS_DENSITY_FLOOR + (1.0 - GRASS_DENSITY_FLOOR) * falloff;
      tile.count = Math.round(GRASS_BLADES_PER_TILE * density);

      const chosen = distance > GRASS_DENSITY_NEAR_DISTANCE ? lowGeometry : highGeometry;
      if (chosen !== null && tile.geometry !== chosen) {
        tile.geometry = chosen;
      }
    }
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
    if (blade.normalMap !== null) {
      grassUniforms.uNormalMap.value = blade.normalMap;
    }
    highGeometry = blade.highGeometry;
    lowGeometry = blade.lowGeometry;
    tiles = createTileGrid(TERRAIN_SIZE, GRASS_TILE_SIZE, blade.highGeometry);
  });

  let syncedWindVelocity = wind.velocity;
  let syncedWindRandomness = wind.randomness;
  let syncedWindAngle = wind.angle;

  let syncedBladeWidth = grass.bladeWidth;
  let syncedBladeHeight = grass.bladeHeight;
  let syncedBladeBending = grass.bladeBending;
  let syncedBladeHeightRandomness = grass.bladeHeightRandomness;
  let syncedColorMix = grass.colorMix;
  let syncedColorDistribution = grass.colorDistribution;
  let syncedBaseColor1 = grass.baseColor1;
  let syncedTipColor1 = grass.tipColor1;
  let syncedBaseColor2 = grass.baseColor2;
  let syncedTipColor2 = grass.tipColor2;
  let syncedBladeThickening = grass.bladeThickening;
  let syncedShadowing = grass.shadowing;
  let syncedSoftness = grass.softness;

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

    if (windSettings.randomness !== syncedWindRandomness) {
      syncedWindRandomness = windSettings.randomness;
      grassUniforms.uWindRandomness.value = windSettings.randomness;
    }

    if (windSettings.angle !== syncedWindAngle) {
      syncedWindAngle = windSettings.angle;
      grassUniforms.uWindAngle.value = THREE.MathUtils.degToRad(windSettings.angle);
    }

    const boundsChanged =
      grassSettings.bladeHeight !== syncedBladeHeight ||
      grassSettings.bladeHeightRandomness !== syncedBladeHeightRandomness;

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

    if (grassSettings.bladeHeightRandomness !== syncedBladeHeightRandomness) {
      syncedBladeHeightRandomness = grassSettings.bladeHeightRandomness;
      grassUniforms.uGrassBladeHeightRandomness.value = grassSettings.bladeHeightRandomness;
    }

    if (grassSettings.colorMix !== syncedColorMix) {
      syncedColorMix = grassSettings.colorMix;
      grassUniforms.uGrassBladeColorMix.value = grassSettings.colorMix;
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

    if (grassSettings.bladeThickening !== syncedBladeThickening) {
      syncedBladeThickening = grassSettings.bladeThickening;
      grassUniforms.uGrassBladeThickening.value = grassSettings.bladeThickening;
    }

    if (grassSettings.shadowing !== syncedShadowing) {
      syncedShadowing = grassSettings.shadowing;
      grassUniforms.uGrassBladeShadowing.value = grassSettings.shadowing;
    }

    if (grassSettings.softness !== syncedSoftness) {
      syncedSoftness = grassSettings.softness;
      grassUniforms.uDiffuseSoftness.value = grassSettings.softness;
    }

    if (boundsChanged) {
      updateTileBounds(grassSettings);
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
    updateDensity,
    dispose,
  };
};
