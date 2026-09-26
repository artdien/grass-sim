import * as THREE from 'three';
import type { LightingSettings } from '@/types';

/** The lighting shader uniforms the scene exposes to materials. */
export interface LightingUniforms {
  uSkyColor: THREE.IUniform<THREE.Color>;
  uGroundColor: THREE.IUniform<THREE.Color>;
  uLightColor: THREE.IUniform<THREE.Color>;
  uLightDirection: THREE.IUniform<THREE.Vector3>;
  uShininess: THREE.IUniform<number>;
  uSpecularIntensity: THREE.IUniform<number>;
  uEnvironmentStrength: THREE.IUniform<number>;
}

/**
 * Shared lighting: a bag of shader uniforms plus a change-detecting sync.
 *
 * Lighting is scene-global (hemispherical ambient, diffuse, specular, and
 * environment-map reflection) and currently consumed only by the terrain, but
 * is kept in its own module so a future entity (e.g. grass) can spread the same
 * uniform objects into its own material — `apply` then updates every consumer
 * at once, since they all share these underlying uniform objects.
 */
export interface Lighting {
  /** The lighting uniform objects to spread into a `ShaderMaterial`. */
  uniforms: LightingUniforms;

  /** Applies `lighting` to the uniforms, only touching the values that changed. */
  sync: (lighting: LightingSettings) => void;
}

/**
 * Creates a `Lighting` from the initial `lighting` settings. Owns the seven
 * lighting uniform objects (uSkyColor, uGroundColor, uLightColor,
 * uLightDirection, uShininess, uSpecularIntensity, uEnvironmentStrength) and a
 * `sync`. Pure data + sync: it owns no material and has no disposal to perform,
 * since its uniform values are plain numbers, vectors, and colors.
 */
export const createLighting = (settings: LightingSettings): Lighting => {
  const uniforms: LightingUniforms = {
    uSkyColor: { value: new THREE.Color(settings.hemisphere.skyColor) },
    uGroundColor: { value: new THREE.Color(settings.hemisphere.groundColor) },
    uLightColor: { value: new THREE.Color(settings.diffuse.color) },
    uLightDirection: {
      value: new THREE.Vector3(
        settings.diffuse.direction.x,
        settings.diffuse.direction.y,
        settings.diffuse.direction.z,
      ),
    },
    uShininess: { value: settings.specular.shininess },
    uSpecularIntensity: { value: settings.specular.intensity },
    uEnvironmentStrength: { value: settings.environment.strength },
  };

  let syncedSkyColor = settings.hemisphere.skyColor;
  let syncedGroundColor = settings.hemisphere.groundColor;
  let syncedLightColor = settings.diffuse.color;
  let syncedDirection = { ...settings.diffuse.direction };
  let syncedShininess = settings.specular.shininess;
  let syncedIntensity = settings.specular.intensity;
  let syncedEnvironmentStrength = settings.environment.strength;

  const apply = (lighting: LightingSettings) => {
    if (lighting.hemisphere.skyColor !== syncedSkyColor) {
      syncedSkyColor = lighting.hemisphere.skyColor;
      uniforms.uSkyColor.value.set(syncedSkyColor);
    }

    if (lighting.hemisphere.groundColor !== syncedGroundColor) {
      syncedGroundColor = lighting.hemisphere.groundColor;
      uniforms.uGroundColor.value.set(syncedGroundColor);
    }

    if (lighting.diffuse.color !== syncedLightColor) {
      syncedLightColor = lighting.diffuse.color;
      uniforms.uLightColor.value.set(syncedLightColor);
    }

    const direction = lighting.diffuse.direction;
    if (
      direction.x !== syncedDirection.x ||
      direction.y !== syncedDirection.y ||
      direction.z !== syncedDirection.z
    ) {
      syncedDirection = { ...direction };
      uniforms.uLightDirection.value.set(direction.x, direction.y, direction.z);
    }

    if (lighting.specular.shininess !== syncedShininess) {
      syncedShininess = lighting.specular.shininess;
      uniforms.uShininess.value = syncedShininess;
    }

    if (lighting.specular.intensity !== syncedIntensity) {
      syncedIntensity = lighting.specular.intensity;
      uniforms.uSpecularIntensity.value = syncedIntensity;
    }

    if (lighting.environment.strength !== syncedEnvironmentStrength) {
      syncedEnvironmentStrength = lighting.environment.strength;
      uniforms.uEnvironmentStrength.value = syncedEnvironmentStrength;
    }
  };

  return { uniforms, sync: apply };
};
