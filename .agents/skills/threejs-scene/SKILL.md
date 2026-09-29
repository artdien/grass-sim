---
name: threejs-scene
description: Use when creating or modifying the Three.js scene in this app — renderer/camera/scene setup, adding 3D objects or entities, wiring Three.js into React components, or refactoring scene architecture. Covers the StrictMode-safe useEffect pattern, resource disposal, and React↔Three interop.
---

# Three.js scene architecture

## Core rules

- **One component owns the renderer.** Scene, camera, and renderer are created inside a `useEffect` and fully torn down in its cleanup. This app runs React StrictMode, so in dev the effect runs mount → cleanup → mount. A half-cleanup leaks WebGL state and leaves duplicate canvases.
- **Three.js objects live outside React state.** Never put `THREE.*` instances in `useState` — the scene mutates in place and React state is for values that drive re-rendering. Share references via `useRef` or effect-local variables.
- **Shared state (Zustand) flows into the scene imperatively:** `Scene.tsx` reads the store via `useSimulationStore.getState()` inside the rAF loop — never as a React subscription and never in effect dependencies. That is what guarantees a store update only changes what the _next frame_ renders and can never recreate the renderer.
- **State flows one way:** scene output that must reach React goes into the store via event handlers; the scene never triggers re-renders directly.
- The renderer div must keep full-size classes (`h-full w-full` / `inset-0`) — scene sizing is measured from `container.clientWidth/Height`, not the window.
- **Shader code is not scene code.** All GLSL lives in `src/assets/shaders` (`.vert`/`.frag`/`.glsl`, plain `@/` imports via `vite-plugin-glsl`) and is written per the `threejs-shaders` skill.

## Workflow: adding a new scene element

1. Decide the owner: default to the existing scene module (`src/scene/Scene.tsx`); split into a module of its own in `src/scene/` — a `create*` factory + `dispose`, composed by `Scene` (like `terrain` and `grass`) — when the entity has a distinct lifecycle or settings of its own.
2. Create the geometry / material / object in the factory (or the effect when it stays in `Scene`) and add it to the scene graph.
3. Drive it from the rAF loop as needed. Animations must be **frame-rate independent**: use delta time (`THREE.Timer#getDelta`, as `Scene` does), never bare per-frame constants.
4. Register every listener or subscription it needs; remove every one in the cleanup.
5. If its size depends on the layout, update it in the `ResizeObserver` callback (alongside camera aspect / renderer size).
6. Verify: `npm run lint`, `npm run build`, and a visual check on `npm run dev` (port 3000).

## Canonical setup/teardown pattern

Follow the shape in `src/scene/Scene.tsx`:

```tsx
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const timer = new THREE.Timer();
  let animationFrameId: number;
  const render = (frameTime: number) => {
    animationFrameId = requestAnimationFrame(render);

    timer.update(frameTime);
    const delta = timer.getDelta();
    // update scene with delta here

    renderer.render(scene, camera);
  };
  render(performance.now());

  // Track the container, not the window, so the canvas also resizes when the layout reflows.
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
  // Callback runs once on observe(), so the initial size is set up front.
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
```

## Checklist: finish every scene change by checking

- [ ] Cleanup is complete: rAF cancelled, every `addEventListener` has a matching `removeEventListener`, all owned geometries/materials/textures disposed, canvas removed from the container.
- [ ] No `THREE.*` instances in React state or effect dependencies.
- [ ] Any shared (Zustand) state the scene reads is fetched via `useStore.getState()` inside the loop, so the mount effect stays dependency-free and store updates can't recreate the renderer.
- [ ] Animations use delta time, not per-frame constants.
- [ ] The resize callback (a `ResizeObserver` on the container div, not a window listener) updates camera aspect + `updateProjectionMatrix()` + `renderer.setSize()`, and any layout-relative object state.
- [ ] StrictMode-safe: re-running the effect from scratch produces an identical scene (no reliance on globals or previously leaked objects).
- [ ] `npm run lint` and `npm run build` pass, and the change looks correct on the dev server.
