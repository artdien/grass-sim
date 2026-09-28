import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/** World units per second while a movement key is held. */
const SPEED = 10;

/** Up vector in world coordinates, corresponds to Y axis */
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * `true` when the primary input is a touch device (phone, tablet) — i.e. WASD
 * and the mouse are unavailable, so the scene must fall back to orbit-only
 * camera control. Deliberately independent of viewport width, so a phone in
 * landscape keeps the same controls as in portrait.
 */
export const isMobile = (): boolean => window.matchMedia('(pointer: coarse)').matches;

/**
 * Camera control: `update` advances the camera by the frame delta and
 * `dispose` releases the controls and their event listeners.
 */
export interface Movement {
  /** Moves the camera by the currently held input, scaled by `delta` seconds. */
  update: (delta: number) => void;

  /** Removes the camera controls and their event listeners. */
  dispose: () => void;
}

/**
 * Creates a `Movement` for `camera` on `domElement`: first-person control
 * (pointer locked mouse look, WASD fly, E/Q up/down) on keyboard and mouse
 * devices, orbit-only control (drag to look around, pinch or wheel to zoom)
 * on `isMobile` touch devices. Call `update` once per frame with the frame
 * delta.
 */
export const createMovement = (
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
): Movement => {
  if (isMobile()) {
    return createOrbitMovement(camera, domElement);
  }

  return createFirstPersonMovement(camera, domElement);
};

/**
 * Orbit-only control for touch-first viewports: rotating and zooming are
 * possible, panning (moving the camera) is deliberately not — there is no
 * equivalent of WASD on a phone, and "looking around" alone is the intended
 * mobile feature set.
 */
const createOrbitMovement = (
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
): Movement => {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  // Never let the camera sink below eye height, i.e. under the grass.
  controls.maxPolarAngle = Math.PI / 2;

  // Orbit around a point at eye height over the field, starting a few meters
  // back so the field fills the view.
  camera.position.set(0, 1.7, 5);
  controls.target.set(0, 1.7, 0);
  controls.update();

  return {
    update: (delta) => controls.update(delta),
    dispose: () => controls.dispose(),
  };
};

/**
 * First-person camera movement: the mouse looks around while the pointer is
 * locked, WASD flies along the camera's line of sight, and E/Q raise and
 * lower it. Clicking `domElement` re-engages the pointer lock, Esc releases it.
 */
const createFirstPersonMovement = (
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
): Movement => {
  const controls = new PointerLockControls(camera, domElement);

  const pressed = new Set<string>();

  const isHeld = (code: string) => pressed.has(code);

  // Keys typed into an editable control (e.g. the save settings dialog) must not
  // also fly the camera.
  const isEditableTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT');

  const onKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }
    pressed.add(event.code);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }
    pressed.delete(event.code);
  };
  const onBlur = () => pressed.clear();
  // A key held before an editable control gained focus otherwise stays "held"
  // forever, since its release lands in the control and is ignored above.
  const onFocusIn = (event: FocusEvent) => {
    if (isEditableTarget(event.target)) {
      pressed.clear();
    }
  };
  const onClick = () => {
    if (!controls.isLocked) {
      controls.lock();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focusin', onFocusIn);
  domElement.addEventListener('click', onClick);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const offset = new THREE.Vector3();

  const update = (delta: number) => {
    if (pressed.size === 0 || delta === 0) {
      return;
    }

    camera.getWorldDirection(forward);
    right.crossVectors(forward, WORLD_UP);
    if (right.lengthSq() === 0) {
      // Looking straight up or down degenerates the cross product.
      right.set(1, 0, 0);
    } else {
      right.normalize();
    }

    offset.set(0, 0, 0);
    if (isHeld('KeyW')) offset.add(forward);
    if (isHeld('KeyS')) offset.sub(forward);
    if (isHeld('KeyD')) offset.add(right);
    if (isHeld('KeyA')) offset.sub(right);
    if (isHeld('KeyE')) offset.add(WORLD_UP);
    if (isHeld('KeyQ')) offset.sub(WORLD_UP);

    if (offset.lengthSq() === 0) {
      return;
    }

    offset.normalize().multiplyScalar(SPEED * delta);
    camera.position.add(offset);
  };

  const dispose = () => {
    controls.dispose();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focusin', onFocusIn);
    domElement.removeEventListener('click', onClick);
  };

  return { update, dispose };
};
