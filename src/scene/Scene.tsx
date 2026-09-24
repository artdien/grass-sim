import { useEffect, useRef } from 'react';
import { useSimulationStore } from '@/store/simulation';
import { registerSceneScreenshot, type ScreenshotResult } from '@/scene/screenshot';
import * as THREE from 'three';

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Rotated cube as an example
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // Read the settings from the store imperatively: the store is never a
    // React subscription here, so store updates can only change what the
    // next frame renders and never recreate the renderer.
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(useSimulationStore.getState().activeSettings.cubeColor),
      wireframe: true,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const timer = new THREE.Timer();
    let animationFrameId: number;

    const animate = () => {
      timer.update();
      animationFrameId = requestAnimationFrame(animate);

      // Pull fresh settings out of the store every frame so sidebar changes
      // take effect on the very next render without re-rendering React.
      const settings = useSimulationStore.getState().activeSettings;

      material.color.set(settings.cubeColor);
      cube.rotation.x += 0.6 * settings.rotationSpeed * timer.getDelta();
      cube.rotation.y += 0.6 * settings.rotationSpeed * timer.getDelta();

      renderer.render(scene, camera);
    };
    animate();

    // Snapshot the current render to a fixed width so the stored image stays
    // small even when the window is maximized. The result is a base64 PNG
    // without the data-URL prefix (stored settings hold the raw base64).
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

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-full min-h-full w-full overflow-hidden" />;
};
