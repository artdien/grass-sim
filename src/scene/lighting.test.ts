import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLighting } from '@/scene/lighting';
import type { LightingSettings } from '@/types';

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * A fixture with a unique value per field so "only that uniform changed" is
 * unambiguous.
 */
const baseSettings: LightingSettings = {
  hemisphere: { skyColor: '#111111', groundColor: '#222222' },
  diffuse: { color: '#333333', direction: { x: -1, y: 0, z: 0.5 } },
  specular: { shininess: 17, intensity: 0.25 },
  environment: { strength: 0.4 },
};

describe('createLighting', () => {
  it('seeds the uniforms from the initial settings', () => {
    const { uniforms } = createLighting(baseSettings);

    expect(uniforms.uSkyColor.value.getHexString()).toBe('111111');
    expect(uniforms.uGroundColor.value.getHexString()).toBe('222222');
    expect(uniforms.uLightColor.value.getHexString()).toBe('333333');
    expect(uniforms.uLightDirection.value).toMatchObject({ x: -1, y: 0, z: 0.5 });
    expect(uniforms.uShininess.value).toBe(17);
    expect(uniforms.uSpecularIntensity.value).toBe(0.25);
    expect(uniforms.uEnvironmentStrength.value).toBe(0.4);
  });

  it('is a no-op when the settings are unchanged', () => {
    const { uniforms, sync } = createLighting(baseSettings);
    const skySet = vi.spyOn(uniforms.uSkyColor.value, 'set');
    const groundSet = vi.spyOn(uniforms.uGroundColor.value, 'set');
    const lightSet = vi.spyOn(uniforms.uLightColor.value, 'set');
    const dirSet = vi.spyOn(uniforms.uLightDirection.value, 'set');

    sync(baseSettings);

    expect(skySet).not.toHaveBeenCalled();
    expect(groundSet).not.toHaveBeenCalled();
    expect(lightSet).not.toHaveBeenCalled();
    expect(dirSet).not.toHaveBeenCalled();
  });

  it('updates only the uniform whose field changed', () => {
    const { uniforms, sync } = createLighting(baseSettings);
    const skySet = vi.spyOn(uniforms.uSkyColor.value, 'set');
    const groundSet = vi.spyOn(uniforms.uGroundColor.value, 'set');
    const lightSet = vi.spyOn(uniforms.uLightColor.value, 'set');
    const dirSet = vi.spyOn(uniforms.uLightDirection.value, 'set');
    const shininess = uniforms.uShininess;

    const changed: LightingSettings = {
      ...baseSettings,
      hemisphere: { ...baseSettings.hemisphere, skyColor: '#999999' },
    };
    const before = shininess.value;

    sync(changed);

    expect(skySet).toHaveBeenCalledTimes(1);
    expect(uniforms.uSkyColor.value.getHexString()).toBe('999999');
    expect(groundSet).not.toHaveBeenCalled();
    expect(lightSet).not.toHaveBeenCalled();
    expect(dirSet).not.toHaveBeenCalled();
    expect(shininess.value).toBe(before);
  });

  it('updates the direction uniform when any component changes', () => {
    const { uniforms, sync } = createLighting(baseSettings);
    const dirSet = vi.spyOn(uniforms.uLightDirection.value, 'set');
    const skySet = vi.spyOn(uniforms.uSkyColor.value, 'set');

    const changed: LightingSettings = {
      ...baseSettings,
      diffuse: { ...baseSettings.diffuse, direction: { x: -0.2, y: -0.8, z: 0.3 } },
    };

    sync(changed);

    expect(dirSet).toHaveBeenCalledTimes(1);
    expect(uniforms.uLightDirection.value).toMatchObject({
      x: -0.2,
      y: -0.8,
      z: 0.3,
    });
    expect(skySet).not.toHaveBeenCalled();
  });

  it('leaves the seeded color untouched when a non-color field changes', () => {
    // Guards against the sync path accidentally calling `Color.set` with a
    // non-hex value (which would log a warning and produce NaN channels).
    const { uniforms, sync } = createLighting(baseSettings);
    const skySet = vi.spyOn(uniforms.uSkyColor.value, 'set');

    sync({
      ...baseSettings,
      specular: { ...baseSettings.specular, shininess: 8 },
    });

    expect(skySet).not.toHaveBeenCalled();
    expect(uniforms.uSkyColor.value.getHexString()).toBe('111111');
  });
});
