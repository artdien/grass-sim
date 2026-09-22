---
name: Three.js Performance
description: Use when optimizing render performance, diagnosing FPS drops or stutter, hunting memory leaks, profiling the WebGL scene, or choosing instancing and draw-call strategies for the Three.js scene in this app.
---

# Three.js performance & debugging

## Workflow: diagnosing a performance problem

1. **Reproduce first.** Run `npm run dev` (port 3000) and isolate the scenario: idle vs. interacting, how many objects, before/after resize. A performance skill that fixes a symptom you can't reproduce is guessing.
2. **Profile.**
   - Draw calls and triangles: log `renderer.info.render.calls` and `renderer.info.render.triangles` once per frame (or on a throttle) in the rAF loop.
   - Frame time: wrap the rAF body with `performance.now()` to find CPU-side hitches (allocation storms, layout thrash).
   - Memory: watch WebGL / JS-heap growth over time in DevTools; unmount/remount components (StrictMode does this in dev) to smoke out leaks.
   - Frame pacing: look for irregular frame times, not just low average FPS — that points at per-frame allocation or GC churn.
3. **Match symptom to cause** using the common-causes list below.
4. **Fix one suspect at a time and re-measure.** Batch-fixing makes it impossible to attribute the win.
5. **Verify:** `npm run lint` and `npm run build` pass; compare draw calls / FPS / heap against the baseline from step 2.

## Common causes (in order of frequency in early Three.js apps)

- **Per-frame allocation** (`new THREE.Vector3()` etc. inside the rAF loop) → hoist reusable temp objects and mutate them in place.
- **One draw call per object** for repeated geometry → `THREE.InstancedMesh` for repeated units; share one geometry across meshes where possible (never clone per instance).
- **Missing disposal** → growing memory: dispose geometry/material/texture whenever an object is destroyed (see the leak checklist below).
- **Expensive lighting/shadows** → limit light counts and shadow maps; keep shadow map resolution and `shadow.camera` bounds tight; avoid `shadow.needsUpdate` every frame for static geometry.
- **Overdraw** (many stacked transparent fullscreen-sized quads) → reduce layered transparency; prefer DOM/Tailwind HUD elements for 2D UI text instead of in-scene textured quads.
- **Unnecessary high-res textures** → size to what's displayed; check mipmaps where minification shimmer appears.

## Leak checklist (run on any "memory grows" report)

- [ ] `cancelAnimationFrame` in teardown.
- [ ] Every `addEventListener`/`subscribe` has a matching teardown removal.
- [ ] `geometry.dispose()`, `material.dispose()`, `texture.dispose()` on every owned resource — including when objects are swapped or destroyed at runtime, not just on unmount.
- [ ] `renderer.dispose()` and the canvas removed from the DOM container.
- [ ] No timers or closures (e.g., `setTimeout`, global callbacks) holding scene objects alive after unmount.

## Good-enough targets for a WebGL app

- 60 FPS on the target machine; a stable frame _rate_ matters more than peak FPS.
- Draw calls: aim for low hundreds at most; in the high hundreds/thousands, reach for instancing/batched geometry **before** optimizing shaders.
- Heap should plateau, not trend upward, after steady-state interaction.
