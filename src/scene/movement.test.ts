import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMovement, isMobile } from '@/scene/movement';

// jsdom has no matchMedia; report the coarse-pointer result the test cares about.
const stubMatchMedia = (matches: boolean) => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isMobile', () => {
  it('returns true when the coarse-pointer query matches', () => {
    stubMatchMedia(true);

    expect(isMobile()).toBe(true);
  });

  it('returns false when the coarse-pointer query does not match', () => {
    stubMatchMedia(false);

    expect(isMobile()).toBe(false);
  });
});

describe('createMovement (first-person)', () => {
  it('flies the camera forward while KeyW is held, and stops once it is released', () => {
    stubMatchMedia(false);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    const movement = createMovement(camera, document.createElement('div'));

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    movement.update(0.1);

    // The camera starts facing down -Z, and SPEED (10) × 0.1 s is one unit.
    expect(camera.position.z).toBeCloseTo(-1);

    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    movement.update(0.1);
    expect(camera.position.z).toBeCloseTo(-1);

    movement.dispose();
  });
});

describe('createMovement (orbit)', () => {
  it('uses orbit controls with pan disabled, and disposes', () => {
    stubMatchMedia(true);
    // Capture the instance created inside createMovement so its settings can
    // be asserted — the `update` call itself does no observable work here.
    const orbited: OrbitControls[] = [];
    vi.spyOn(OrbitControls.prototype, 'update').mockImplementation(function (this: OrbitControls) {
      if (!orbited.includes(this)) {
        orbited.push(this);
      }
      return true;
    });

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    const motion = createMovement(camera, document.createElement('div'));

    expect(orbited).toHaveLength(1);
    // Pan is deliberately unavailable on touch devices (there is no WASD there).
    expect(orbited[0].enablePan).toBe(false);
    // The orbit path repositions the camera above the field, at eye height.
    expect(camera.position.x).toBeCloseTo(0);
    expect(camera.position.y).toBeCloseTo(1.7);
    expect(camera.position.z).toBeCloseTo(5);

    motion.update(0.1);
    motion.dispose();
  });
});
