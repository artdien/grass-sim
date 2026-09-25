import { useEffect, useRef, memo } from 'react';
import { registerSceneScreenshot, type ScreenshotResult } from '@/scene/screenshot';
import * as THREE from 'three';
import type { LightingSettings } from '@/types';
import { useSimulationStore } from '@/store/simulation';

// Assets
import terrainVertexShader from '@/assets/shaders/terrain.vert';
import terrainFragmentShader from '@/assets/shaders/terrain.frag';

/**
 * The Three.js scene: renders the settings-driven terrain and exposes a render
 * snapshot. Memoized because the renderer is decoupled from React re-renders,
 * which makes any future change forcing one immediately visible.
 */
export const Scene = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    /* Terrain */

    const initialSettings = useSimulationStore.getState().activeSettings;
    const terrainSettings = initialSettings.terrain;
    const lightingSettings = initialSettings.lighting;

    const terrainGeometry = new THREE.PlaneGeometry(
      1,
      1,
      terrainSettings.segments,
      terrainSettings.segments,
    );

    const terrainUniforms = {
      uTerrainColor: { value: new THREE.Color(terrainSettings.color) },
      uSkyColor: { value: new THREE.Color(lightingSettings.hemisphere.skyColor) },
      uGroundColor: { value: new THREE.Color(lightingSettings.hemisphere.groundColor) },
      uDiffuseColor: { value: new THREE.Color(lightingSettings.diffuse.color) },
      uLightDirection: {
        value: new THREE.Vector3(
          lightingSettings.diffuse.direction.x,
          lightingSettings.diffuse.direction.y,
          lightingSettings.diffuse.direction.z,
        ),
      },
      uShininess: { value: lightingSettings.specular.shininess },
      uSpecularIntensity: { value: lightingSettings.specular.intensity },
    };
    const terrainMaterial = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: terrainUniforms,
    });

    const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrainMesh.rotateX(-Math.PI / 2); // rotate to lie in XZ plane
    terrainMesh.scale.setScalar(terrainSettings.size);
    scene.add(terrainMesh);

    // Rebuilding the plane geometry is expensive, so it only happens when the
    // segment count actually changes and the replaced geometry is disposed.
    let syncedSize = terrainSettings.size;
    let syncedSegments = terrainSettings.segments;
    let syncedTerrainColor = terrainSettings.color;
    const applyTerrainSettings = (size: number, segments: number, color: string) => {
      if (size !== syncedSize) {
        syncedSize = size;
        terrainMesh.scale.setScalar(size);
      }

      if (segments !== syncedSegments) {
        syncedSegments = segments;
        const oldGeometry = terrainMesh.geometry;
        terrainMesh.geometry = new THREE.PlaneGeometry(1, 1, segments, segments);
        oldGeometry.dispose();
      }

      if (color !== syncedTerrainColor) {
        syncedTerrainColor = color;
        terrainUniforms.uTerrainColor.value.set(color);
      }
    };

    let syncedSkyColor = lightingSettings.hemisphere.skyColor;
    let syncedGroundColor = lightingSettings.hemisphere.groundColor;
    let syncedLightColor = lightingSettings.diffuse.color;
    let syncedDirection = { ...lightingSettings.diffuse.direction };
    let syncedShininess = lightingSettings.specular.shininess;
    let syncedIntensity = lightingSettings.specular.intensity;
    const applyLightingSettings = (lighting: LightingSettings) => {
      if (lighting.hemisphere.skyColor !== syncedSkyColor) {
        syncedSkyColor = lighting.hemisphere.skyColor;
        terrainUniforms.uSkyColor.value.set(syncedSkyColor);
      }

      if (lighting.hemisphere.groundColor !== syncedGroundColor) {
        syncedGroundColor = lighting.hemisphere.groundColor;
        terrainUniforms.uGroundColor.value.set(syncedGroundColor);
      }

      if (lighting.diffuse.color !== syncedLightColor) {
        syncedLightColor = lighting.diffuse.color;
        terrainUniforms.uDiffuseColor.value.set(syncedLightColor);
      }

      const direction = lighting.diffuse.direction;
      if (
        direction.x !== syncedDirection.x ||
        direction.y !== syncedDirection.y ||
        direction.z !== syncedDirection.z
      ) {
        syncedDirection = { ...direction };
        terrainUniforms.uLightDirection.value.set(direction.x, direction.y, direction.z);
      }

      if (lighting.specular.shininess !== syncedShininess) {
        syncedShininess = lighting.specular.shininess;
        terrainUniforms.uShininess.value = syncedShininess;
      }

      if (lighting.specular.intensity !== syncedIntensity) {
        syncedIntensity = lighting.specular.intensity;
        terrainUniforms.uSpecularIntensity.value = syncedIntensity;
      }
    };

    /* Render loop */

    const timer = new THREE.Timer();
    let animationFrameId: number;
    let hasPreviousFrame = false;

    const animate = (frameTime: number) => {
      timer.update(frameTime);
      animationFrameId = requestAnimationFrame(animate);

      const settings = useSimulationStore.getState().activeSettings;
      applyTerrainSettings(
        settings.terrain.size,
        settings.terrain.segments,
        settings.terrain.color,
      );
      applyLightingSettings(settings.lighting);

      const delta = timer.getDelta();

      renderer.render(scene, camera);

      // Update the counter imperatively.
      // Routing it through React state would force a re-render at display refresh rate.
      if (hasPreviousFrame && delta > 0 && fpsRef.current !== null) {
        fpsRef.current.textContent = `${Math.round(1 / delta)} FPS`;
      }
      hasPreviousFrame = true;
    };
    animate(performance.now());

    // Snapshot the current render to a fixed width so the stored image stays
    // small even when the window is maximized.
    // `image.decode()` rejects when the load fails, so the async function
    // propagates the error instead of needing an onerror callback.
    const captureScreenshot = async (width: number): Promise<ScreenshotResult> => {
      renderer.render(scene, camera);

      const source = renderer.domElement.toDataURL('image/png');
      const image = new Image();
      image.src = source;
      await image.decode();

      // Scale down canvas to provided width
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * width));

      const context = canvas.getContext('2d');
      if (!context) {
        console.warn(
          'Could not obtain a 2D canvas context for screenshot scaling, falling back to full resolution',
        );
        return { ok: true, data: source.split(',')[1] ?? '' };
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return { ok: true, data: canvas.toDataURL('image/png').split(',')[1] ?? '' };
    };
    registerSceneScreenshot(captureScreenshot);

    // Track the container, not the window, so the canvas also resizes
    // when the sidebar collapses and the layout reflows.
    const resizeObserver = new ResizeObserver(() => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) {
        return;
      }

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);

      registerSceneScreenshot(null);

      resizeObserver.disconnect();

      terrainMesh.geometry.dispose();
      terrainMesh.material.dispose();
      terrainMesh.dispose();
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
