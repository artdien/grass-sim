import * as THREE from 'three';
import { useEffect, useRef, memo } from 'react';
import { useSimulationStore } from '@/store/simulation';
import { createLighting } from '@/scene/lighting';
import { createTerrain } from '@/scene/terrain';
import { registerSceneScreenshot, createSceneCapture } from '@/scene/screenshot';

/**
 * The Three.js scene: renders the settings-driven terrain and exposes a render
 * snapshot. Owns the renderer/scene/camera, the render loop, and sizing, and is
 * the glue that composes the `Lighting` and `Terrain` entities. Memoized because
 * the renderer is decoupled from React re-renders, so any change forcing one is
 * immediately visible.
 */
export const Scene = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(renderer.domElement);

    // Build the entities from the current settings, then sync them imperatively
    // each frame below. Lighting comes from the shared module and is passed to
    // the terrain so both share the same uniform objects.
    const initialSettings = useSimulationStore.getState().activeSettings;
    const lighting = createLighting(initialSettings.lighting);
    const terrain = createTerrain(initialSettings.terrain, lighting.uniforms);
    scene.add(terrain.mesh);

    const timer = new THREE.Timer();
    let animationFrameId: number;
    let hasPreviousFrame = false;

    const render = (frameTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      timer.update(frameTime);
      const delta = timer.getDelta();

      const settings = useSimulationStore.getState().activeSettings;
      terrain.sync(settings.terrain);
      lighting.sync(settings.lighting);

      renderer.render(scene, camera);

      // Update the counter imperatively.
      // Routing it through React state would force a re-render at display refresh rate.
      if (hasPreviousFrame && delta > 0 && fpsRef.current !== null) {
        fpsRef.current.textContent = `${Math.round(1 / delta)} FPS`;
      }
      hasPreviousFrame = true;
    };
    render(performance.now());

    registerSceneScreenshot(createSceneCapture(renderer, scene, camera));

    // Track the container, not the window, so the canvas also resizes
    // when the sidebar collapses and the layout reflows.
    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) {
        return;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    });
    // Callback is executed once on calling observe(),
    // so initial scene is resized appropriately.
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);

      registerSceneScreenshot(null);
      resizeObserver.disconnect();

      terrain.dispose();
      renderer.dispose();

      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full min-h-full w-full overflow-hidden">
      <span
        ref={fpsRef}
        className="pointer-events-none absolute top-3 right-3 z-10 rounded-md bg-stone-950/60 px-2 py-0.5 font-mono text-xs text-stone-300 tabular-nums select-none"
      >
        -- FPS
      </span>
    </div>
  );
});
