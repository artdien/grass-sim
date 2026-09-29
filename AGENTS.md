# grass-sim

React 19 + TypeScript + Vite web app rendering a Three.js (WebGL) grass simulation: a noise-displaced heightfield terrain covered in an instanced grass blade field, lit by a shared hemispherical/diffuse/specular + HDR environment model against an HDR panorama background, with a configurable sidebar and a load/save settings page. Single package, no workspaces; CI deploys to GitHub Pages (`.github/workflows/deploy.yaml`).

## src layout

```
src/
├── main.tsx        # entry — mount only (StrictMode + <RouterProvider>)
├── router.tsx      # createBrowserRouter route table
├── App.tsx         # app shell — Navbar + <Outlet />
├── index.css       # the only source CSS (Tailwind v4)
├── types.ts        # shared types (settings model, Result)
├── components/     # app-level / reusable UI — solo components at the top (Navbar, LoadSettingsCard); one subfolder per component family (dialogs/, fields/, layout/) or feature (sidebar/)
├── pages/          # one component per route
├── store/          # Zustand stores for shared app state + supporting pure modules (e.g. parseSimulationSettings)
├── assets/         # static sources — shaders/ (GLSL .vert/.frag and common/ .glsl chunks), envmaps/ (scene HDR), models/ (grassblade.glb), scenes/ (bundled example settings)
├── test/           # test setup (jest-dom matchers)
└── scene/          # all Three.js code — Scene (composition + loop) plus one module per entity: lighting, terrain, grass, environment, movement, screenshot
```

New code goes in these buckets: route-level pages → `pages/`, app-level or reusable UI → `components/` (into a matching family/feature subfolder, or the top level only if it has no family), shared app state → `store/`, anything that touches Three.js → `scene/`.

## Commands

- `npm run dev` — dev server on port **3000** (not Vite's default 5173)
- `npm run build` — `tsc -b && vite build`; typecheck failure blocks the build
- `npm run preview` — serve the production build locally
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, `eslint.config.js`)
- `npm run format` — Prettier over the whole repo
- CI: `deploy.yaml` builds and deploys to GitHub Pages on push to `main` (or manually); it runs `npm ci && npm run build`, so build/typecheck failures block deployment
- `npm run test` — run the Vitest suite once (jsdom environment, React Testing Library); `npx vitest` runs it in watch mode

Tests live next to their code as `src/**/*.test.{ts,tsx}` — jsdom environment with `@testing-library/jest-dom` matchers from `src/test/setup.ts` (both configured in `vite.config.ts` `test`). Import `describe`/`it`/`expect` from `'vitest'` — no globals are enabled. Test files are typechecked by `npm run build` and linted like the rest of `src/`. Test stores, parsing, and React components, plus the scene modules with plain logic — `lighting`, `movement`, and `screenshot` in `scene/`; the renderer itself isn't unit-tested in jsdom.

## Style & toolchain

- Prettier is the source of truth for style (`.prettierrc`): single quotes, semicolons, width 100, trailing commas. `prettier-plugin-tailwindcss` sorts Tailwind classes — run `npm run format` after adding JSX classes.
- ESLint runs Prettier rules via `eslint-plugin-prettier`, so `npm run lint` reports formatting violations. It is also **type-aware** (`recommendedTypeChecked` with `projectService`, plus `react-x`/`react-dom` plugins) — lint failures can include type-level and React-specific rules, and lint is slower than a plain pass.
- Tailwind v4 is configured via the `@tailwindcss/vite` plugin; there is **no `tailwind.config.js`** — configuration lives in CSS (`src/index.css`).

## UI design system

All UI uses a **light, green-based Tailwind theme — simple and clean, since the 3D render output is the focus** (no custom CSS tokens yet; styling lives in component class lists). Reference implementations: `src/components/Navbar.tsx` (app chrome) and `src/pages/LoadSettingsPage.tsx` (card/notice). Keep new UI consistent with these choices:

- **Backgrounds:** app base `bg-green-50`; navbar/chrome `bg-white` with `border-stone-200` separators; cards `rounded-xl border border-stone-200 bg-white shadow-sm`; the 3D scene starts on a black (`#000000`) background until the HDR panorama environment map resolves and replaces it. The UI panels overlaying the canvas are dark-chip (`bg-stone-950/60`) so they read against either.
- **Text:** primary `text-stone-900`; secondary/inactive `text-stone-500` (links get `hover:text-stone-900`); body copy `text-stone-600`.
- **Accent — green only:** active nav links `text-green-700`; icons `text-green-600`; focus state `focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white`. The one documented exception is destructive actions (delete): `text-red-600 hover:text-red-700` with a matching red focus ring. Otherwise do not introduce other accent hues.
- **Typography:** system font stack (no web fonts); chrome/nav titles `text-base leading-tight font-semibold`; page headings `text-xl font-semibold`; body and links `text-sm`.
- **Layout shell:** `App.tsx` is a flex column — `Navbar` on top, page content in `<main className="relative min-h-0 flex-1 overflow-hidden">` below it. UI placed over the canvas follows the layering rules in the `tailwind-3d-ui` skill.

## TypeScript

- `verbatimModuleSyntax`: use `import type` for type-only imports.
- `erasableSyntaxOnly`: no enums, namespaces, or parameter properties.
- `noUnusedLocals`/`noUnusedParameters` are on.
- **`@/` path alias, extension-less imports:** all in-project imports use the `@/` alias (mapped to `src/` in both tsconfig `paths` and Vite `resolve.alias`) with **no** file extension — e.g. `import { Scene } from '@/scene/Scene'`. Do not use relative `./`/`../` paths or `.tsx`/`.ts` extensions. Enforced by ESLint `no-restricted-imports` (lint fails) and by `allowImportingTsExtensions` being off (build fails).

## Components

- **Named exports with arrow functions, always:** `export const Component = () => { ... };` — no default exports, no function declarations.
- **One React component per file**, named after the component.
- **Placement:** route-level pages in `src/pages/`, app-level or reusable UI in `src/components/`, anything that touches Three.js in `src/scene/` (see src layout above).

## Shaders

Shaders are always written in **GLSL** under **`src/assets/shaders`** — `.vert` for vertex shaders, `.frag` for fragment shaders, `.glsl` for shared chunks kept in **`src/assets/shaders/common`** and inlined from shader sources at the top with a relative include, e.g. `#include "./common/lighting.glsl";` — and the `.vert`/`.frag` sources are imported with the `@/` alias as-is, e.g. `import grassVertexShader from '@/assets/shaders/grass.vert';` (`vite-plugin-glsl` in `vite.config.ts` makes shader files importable as JS modules — no `?raw`; `vite-plugin-glsl/ext` in `tsconfig.app.json` provides the types). Never as template strings in TS. Use modern `in`/`out` qualifiers (never the legacy `attribute`/`varying`) and prefix interface variables: `u` for uniforms, `v` for varyings, `a` for attributes. The terrain's and grass's materials both spread the shared `LightingUniforms` bag from `scene/lighting.ts` into their uniforms so one `sync` updates both. Full rules, the Three.js built-in surface, and a worked example: the `threejs-shaders` skill.

## Code documentation

Documentation splits into two kinds with opposite rules. **Contract docs on public surfaces are good style, not noise:** every `export`ed symbol — types, functions, store hooks (including their state shape), components (including their props) — is documented with a leading JSDoc, even where the description is obvious or redundant from the name; in that case keep it short. For public surfaces, **consistency is the key**: every export is documented, none left out.

**Inline comments are the noise risk**, and a liability, not an asset: each is a claim that must be kept true as the code changes, and a stale comment is worse than none. The **default is no inline comment**. An inline comment earns its place only when (1) a reader could reasonably make a specific wrong decision or delete the code without it, (2) the fact is not derivable from this code or from the file that actually owns it, and (3) it describes behavior this file itself introduces — not platform behavior or another component's internals.

- **Explain the why, never the what.** The code already shows what a line does; an inline comment states the non-obvious reason it exists or the invariant it protects. Never restate mechanics the code already makes visible.
- **One owner per fact.** A behavior is documented in the file that implements it. Consumers and sibling files never restate another file's internals — that duplication is how comments go stale. If a fact is needed by callers, it belongs on the shared type or in a skill, not echoed at the call site.
- **Keep it current or delete it.** A comment is updated in the same change as the code it describes; if it can no longer be kept true, delete it. When torn between keeping and deleting a marginal comment, delete it.

## State management

Shared app state — state used by more than one page or outside a component subtree (e.g. **`SimulationSettings`**, consumed by both `SimulationPage` and `LoadSettingsPage`) — is managed with **Zustand**, not `useState` + prop drilling.

- **Stores live in `src/store/`** — one file per domain (`store/simulation.ts` for the settings model, `store/fullscreen.ts` for the document's fullscreen state), each exporting a `use`-prefixed hook built with `create` from `zustand`. The folder also holds pure supporting modules — `store/parsing.ts` (validates imported settings JSON into a `StoredSimulationSettings`) — which are not stores but serve the settings domain. The shared model from `src/types.ts` is stored as **one section object** (e.g. `activeSettings: SimulationSettings`), not as flat per-field state, and is replaced wholesale through a single setter named `updateActiveSettings` (not `setActiveSettings`, so it doesn't read like a `useState` setter).
- **Components read through selectors:** `useSimulationStore((state) => state.activeSettings)`. Updates provide a **copy** of the model with the changed value(s) replaced — `updateActiveSettings({ ...activeSettings, grass: { ...activeSettings.grass, bladeWidth: parsed } })` — never mutating the stored object, and never passing settings down as props from a page. The store also owns the saved-entries CRUD (`saveSettings`/`importSettings`/`loadSettings`/`deleteSettings`), returning a `Result` on fallible operations rather than throwing.
- **The scene never subscribes to the store in React.** `Scene.tsx` reads it imperatively via `useSimulationStore.getState()` inside the rAF loop and passes the settings into each entity's `sync`. That keeps the Three.js mount effect's deps at `[]` and guarantees store updates only change what the _next frame_ renders — they can never recreate the renderer.

## Architecture notes

- Entry flow: `index.html` → `src/main.tsx` (mount only) → `src/router.tsx` (React Router 7 is set up **there**: `App` is the layout route — `Navbar` + `<Outlet />`; children: `SimulationPage` at `/simulation`, `LoadSettingsPage` at `/load-settings`, `NotFoundPage` at the `*` catch-all; the index `/` redirects to `/simulation`) → `src/pages/SimulationPage.tsx` (scene beside the settings `Sidebar`, sidebar hidden in fullscreen) → `src/scene/Scene.tsx`.
- `src/scene/Scene.tsx` owns the scene/camera/renderer, the rAF loop, sizing, and is the glue that composes the scene entities, each a module with a `create*` factory + `dispose`: `lighting.ts` (shared shader uniform objects spread into the terrain and grass materials), `terrain.ts` (the heightfield mesh), `grass.ts` (instanced blade tiles), `environment.ts` (async HDR panorama load with an `onTextureLoad` callback), `movement.ts` (first-person pointer-lock/WASD on mouse+keyboard, orbit-only on touch per `isMobile`), and `screenshot.ts` (the one module with tests here). **StrictMode is on**, so in dev the mount effect runs mount → cleanup → mount; the teardown (dispose the entities in the effect, cancel the rAF, remove the DOM node) is what keeps it from leaking/crashing. Preserve this pattern when extending the scene.
- UI outside the scene requests a render snapshot imperatively through the `screenshot.ts` registry: `Scene` calls `registerSceneScreenshot(createSceneCapture(...))` on mount and `registerSceneScreenshot(null)` on cleanup, and callers (the `Sidebar`'s save flow) `await captureSceneScreenshot(width)` — no React subscription, no renderer recreation.
- The scene is sized from a `ResizeObserver` on the container div, not the window, so it also resizes when the sidebar collapses — the renderer div must keep its full-size classes.
- The FPS readout and the control hint above the canvas are updated imperatively via refs (textContent/hidden), deliberately never through React state, so per-frame updates can't trigger re-renders of the memoized `Scene`.
