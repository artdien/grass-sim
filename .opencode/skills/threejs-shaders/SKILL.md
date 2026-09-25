---
name: Three.js Shaders
description: Use when writing or modifying shaders for the Three.js scene in this app — authoring GLSL .vert/.frag/.glsl sources in src/assets/shaders, wiring them into materials, or touching their uniforms/varyings/attributes. Covers the repo's GLSL style, the u/v/a naming conventions, the vite-plugin-glsl import and #include chunk workflow, and the Three.js built-in shader surface.
---

# Three.js shaders

## Hard rules

- **GLSL only, one file per shader.** Every shader is written in GLSL as a standalone file — never as a TS/JS template string or inline literal.
- **Location: `src/assets/shaders`.** All shader sources live there — no other directory.
- **File endings:** `.vert` for vertex shaders, `.frag` for fragment shaders, `.glsl` for shared chunks inlined into shader sources (see "Reusable chunks").
- **Import with the `@/` alias, plain — no `?raw` modifier** — `import vertexShader from '@/assets/shaders/shader.vert';`. `vite-plugin-glsl` (registered in `vite.config.ts`) turns shader files into JS modules, and `vite-plugin-glsl/ext` (already in `tsconfig.app.json`) types them as `string`. This is the only way shader code enters the bundle.
- **Modern qualifiers.** Use GLSL ES 3.00 `in`/`out`. The legacy keywords `attribute` and `varying` never appear — vertex: `attribute` becomes `in`, `varying` becomes `out`; fragment: `varying` becomes `in`.
- **Prefix every interface variable a shader pair declares:**
  - `u` — uniforms — `uniform vec3 uColor;`
  - `v` — varyings — `out vec3 vWorldPos;` in the `.vert`, `in vec3 vWorldPos;` in the `.frag`
  - `a` — attributes — `in vec3 aPhase;`
    Locals in `main()` get no prefix — `vec3 worldPos;` is right, `vWorldPos` for a local is wrong.

## The Three.js built-in surface: use it, never redeclare it

With `THREE.ShaderMaterial`, Three.js prepends a prologue that our files must neither redeclare nor shadow:

- **Attributes** bound from `BufferGeometry` by key: `position`, `normal`, `uv`.
- **Uniforms** set by the renderer each frame: `modelMatrix`, `modelViewMatrix`, `projectionMatrix`, `viewMatrix`, `normalMatrix`, `cameraPosition`, `isOrthographic`.
- `#version 300 es` and `precision` — both already provided.

Consequences:

- `a`-prefixed attributes are for **custom** attributes the pair adds to a geometry; the `setAttribute` key must match the shader name — `in vec3 aPhase;` ↔ `geometry.setAttribute('aPhase', ...)`.
- **Built-in geometries (Box/Sphere/Cylinder/…) keep the built-in names** — `position`, `normal`, `uv`. Feed such a geometry by using the canonical names, not `aPosition`, because the geometry's attribute key must match the shader's.
- `u`-prefixed uniforms are **ours** and go in `material.uniforms`; the built-in matrices are referenced directly and are never listed there.
- Redeclaring a built-in — our own `uniform mat4 modelMatrix;`, a second `vec3 position;`, a stray `precision` or `#version` — is a compile error.
- The fragment output is declared explicitly, modern style: `layout(location = 0) out vec4 vFragColor;`. `gl_FragColor` exists only via Three.js's legacy compat macro and is not written.

`THREE.RawShaderMaterial` skips the prologue entirely — the file starts from `#version 300 es` and every interface variable we declare, matrices included, takes its full name. It is the escape hatch for total control, not the default.

## Reusable chunks

Shared GLSL — noise, hashing, vector math — lives in `src/assets/shaders/*.glsl` and is inlined by `vite-plugin-glsl` at build time with the `#include` directive, **relative to the file doing the including**:

```glsl
// terrain.vert
#include "./noise.glsl"

void main() { ... }
```

- Chunks may include chunks — the plugin inlines the whole tree recursively (a `noise.glsl` whose only line is `#include "./hash.glsl"` works).
- A chunk included twice **warns** (default `warnDuplicatedImports: true`) and is not deduplicated by default — keep every chunk idempotent so it can be included from anywhere, guarded with `#ifndef NOISE_GLSL / #define NOISE_GLSL` around its body.
- Repo style for the directive: `#include "./name.glsl";` — with quotes and semicolon.

## Workflow: add a new shader pair

1. Create `src/assets/shaders/<feature>.vert` and `<feature>.frag` — one pair per feature.
2. Import both in the scene file with the `@/` alias — plain, no `?raw` — and reference shared GLSL from the shader source with `#include "./name.glsl";`.
3. Declare the interface top-of-file before the bodies: the shared `v` varyings (same name and type on both sides), the `u` uniforms JS will provide, the `a` attributes the geometry will provide.
4. Vertex body: build `gl_Position` from the built-in matrices, hand state to the fragment via `v` varyings. Fragment body: write the `vFragColor` output.
5. Create the material in the `useEffect` with `uniforms: { uName: { value: ... } }`; in the rAF loop mutate `material.uniforms.uName.value` in place — never recreate the material. Dispose the material in cleanup alongside its geometry.
6. Verify: `npm run lint`, `npm run build`, and a look on `npm run dev` (port 3000). A compile error shows up as a black screen + a console warning that includes the offending line number.

## Example pair

`src/assets/shaders/shader.vert`:

```glsl
in vec3 aPhase; // custom attribute — geometry key: setAttribute('aPhase', ...)

uniform float uTime; // ours — material.uniforms.uTime

out vec3 vViewPos;
out float vPhase;

void main() {
	// position/modelMatrix/viewMatrix/projectionMatrix come from the ShaderMaterial prologue.
	vec4 worldPos = modelMatrix * vec4(position, 1.0);
	vViewPos = (viewMatrix * worldPos).xyz;
	vPhase = aPhase + uTime;
	gl_Position = projectionMatrix * viewMatrix * worldPos;
}
```

`src/assets/shaders/shader.frag`:

```glsl
in vec3 vViewPos;
in float vPhase;

layout(location = 0) out vec4 vFragColor;

void main() {
	vFragColor = vec4(vec3(0.1, 0.4, 0.2) + 0.2 * vPhase, 1.0);
}
```

Wiring in TS:

```tsx
import vertexShader from '@/assets/shaders/shader.vert';
import fragmentShader from '@/assets/shaders/shader.frag';

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
  },
});
// In the rAF loop — mutate, don't rebuild:
// material.uniforms.uTime.value = elapsedTime;
```

## Checklist: finish every shader change by checking

- [ ] All shader code lives in `src/assets/shaders/` as `.vert`/`.frag` files — no shader strings in TS.
- [ ] `in`/`out` only; zero occurrences of `attribute`, `varying`, or `gl_FragColor`.
- [ ] Every interface variable is `u`/`v`/`a`-prefixed; every local is bare.
- [ ] Varying names and types match 1:1 between the pair, `out` in `.vert` ↔ `in` in `.frag`.
- [ ] No redeclaration of built-ins (`position`, `normal`, `uv`, `modelMatrix`, …, `precision`, `#version`).
- [ ] Imports are plain (no `?raw`) through the `@/` alias; every custom geometry attribute key matches its shader declaration.
- [ ] Reusable GLSL lives in `.glsl` chunks, included relatively, and is idempotent (`#ifndef`/`#define` guard).
- [ ] Uniforms initialized with `{ value }` and mutated in place per frame; material disposed in scene cleanup.
- [ ] `npm run lint` + `npm run build` pass and the change looks right on the dev server.
