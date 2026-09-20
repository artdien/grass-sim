---
name: Three.js Scene
description: Use when creating or modifying the Three.js scene in this app — renderer/camera/scene setup, adding 3D objects or entities, wiring Three.js into React components, or refactoring scene architecture. Covers the StrictMode-safe useEffect pattern, resource disposal, and React↔Three interop.
---

# Three.js scene architecture

## Core rules

- **One component owns the renderer.** Scene, camera, and renderer are created inside a `useEffect` and fully torn down in its cleanup. This app runs React StrictMode, so in dev the effect runs mount → cleanup → mount. A half-cleanup leaks WebGL state and leaves duplicate canvases.
- **Three.js objects live outside React state.** Never put `THREE.*` instances in `useState` — the scene mutates in place and React state is for values that drive re-rendering. Share references via `useRef` or effect-local variables.
- **React state flows one way:** into the scene via effect dependencies or ref-mirrored values; out of the scene via event handlers that call `setState`. The scene never triggers re-renders directly.
- The renderer div must keep full-size classes (`h-full w-full` / `inset-0`) — scene sizing is measured from `container.clientWidth/Height`, not the window.

## Workflow: adding a new scene element

1. Decide the owner: default to the existing renderer component (`src/Renderer.tsx`); split into a component of its own only when the entity has a distinct lifecycle or props of its own.
2. Create the geometry / material / object in the effect (or a factory function called from it) and add it to the scene graph.
3. Drive it from the rAF loop as needed. Animations must be **frame-rate independent**: use delta time (`clock.getDelta()`), never bare per-frame constants.
4. Register every listener or subscription it needs; remove every one in the cleanup.
5. If its size depends on the viewport, update it in the resize handler (alongside camera aspect / renderer size).
6. Verify: `npm run lint`, `npm run build`, and a visual check on `npm run dev` (port 3000).

## Canonical setup/teardown pattern

Follow the shape in `src/Renderer.tsx`:

```tsx
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  let rafId: number;
  const clock = new THREE.Clock();
  const animate = () => {
    rafId = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    // update scene with dt here
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => { /* camera.aspect, updateProjectionMatrix, renderer.setSize */ };
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('resize', onResize);
    cancelAnimationFrame(rafId);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}, []);
```

## Checklist: finish every scene change by checking

- [ ] Cleanup is complete: rAF cancelled, every `addEventListener` has a matching `removeEventListener`, all owned geometries/materials/textures disposed, canvas removed from the container.
- [ ] No `THREE.*` instances in React state or effect dependencies.
- [ ] Animations use delta time, not per-frame constants.
- [ ] Resize handler updates camera aspect + `updateProjectionMatrix()` + `renderer.setSize()`, and any viewport-relative object state.
- [ ] StrictMode-safe: re-running the effect from scratch produces an identical scene (no reliance on globals or previously leaked objects).
- [ ] `npm run lint` and `npm run build` pass, and the change looks correct on the dev server.
