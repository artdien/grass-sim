import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SimulationSettings } from '@/types';

interface Props {
  settings: SimulationSettings;
}

export const Scene = ({ settings }: Props) => {
  // Mirror the latest settings into a ref so the animation loop can read
  // fresh values every frame without recreating the Three.js scene on change.
  const settingsRef = useRef(settings);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

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
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(settingsRef.current.cubeColor),
      wireframe: true,
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const timer = new THREE.Timer();
    let animationFrameId: number;

    const animate = () => {
      timer.update();
      animationFrameId = requestAnimationFrame(animate);

      // Apply the latest settings before issuing the next render call so
      // sidebar changes take effect on the very next frame.
      const { cubeColor, rotationSpeed } = settingsRef.current;

      material.color.set(cubeColor);
      cube.rotation.x += 0.6 * rotationSpeed * timer.getDelta();
      cube.rotation.y += 0.6 * rotationSpeed * timer.getDelta();

      renderer.render(scene, camera);
    };
    animate();

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

      resizeObserver.disconnect();

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="h-full min-h-full w-full overflow-hidden" />;
};
