import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/** World units per second while a movement key is held. */
const SPEED = 10;

/** Up vector in world coordinates, corresponds to Y axis */
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/**
 * First-person camera movement: the mouse looks around while the pointer is
 * locked, WASD / arrow keys fly along the camera's line of sight, and E/Q
 * raise and lower it. Clicking `domElement` re-engages the pointer lock,
 * Esc releases it.
 */
export interface Movement {
  /** Moves the camera by the keys currently held, scaled by `delta` seconds. */
  update: (delta: number) => void;

  /** Removes the pointer lock controls and the window key listeners. */
  dispose: () => void;
}

/**
 * Creates a `Movement` for `camera`, using `domElement` as the pointer lock
 * target so mouse input turns the camera instead of orbiting a target.
 * Call `update` once per frame with the frame delta.
 */
export const createMovement = (
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
): Movement => {
  const controls = new PointerLockControls(camera, domElement);

  const pressed = new Set<string>();

  const isHeld = (...codes: string[]) => codes.some((code) => pressed.has(code));

  const onKeyDown = (event: KeyboardEvent) => {
    pressed.add(event.code);
    if (event.code.startsWith('Arrow')) {
      event.preventDefault();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    pressed.delete(event.code);
  };
  const onBlur = () => pressed.clear();
  const onClick = () => {
    if (!controls.isLocked) {
      controls.lock();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
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
    if (isHeld('KeyW', 'ArrowUp')) offset.add(forward);
    if (isHeld('KeyS', 'ArrowDown')) offset.sub(forward);
    if (isHeld('KeyD', 'ArrowRight')) offset.add(right);
    if (isHeld('KeyA', 'ArrowLeft')) offset.sub(right);
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
    domElement.removeEventListener('click', onClick);
  };

  return { update, dispose };
};
