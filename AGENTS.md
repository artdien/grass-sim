# grass-sim

React 19 + TypeScript + Vite web app rendering a Three.js (WebGL) scene. The scene currently renders a placeholder rotating wireframe cube; the grass simulation it is named for is not implemented yet. Single package, no workspaces, no CI.

## src layout

```
src/
├── main.tsx        # entry — mount only (StrictMode + <RouterProvider>)
├── router.tsx      # createBrowserRouter route table
├── App.tsx         # app shell — Navbar + <Outlet />
├── index.css       # the only source CSS (Tailwind v4)
├── types.ts        # shared types
├── components/     # app-level / reusable UI (e.g. Navbar, Sidebar)
├── pages/          # one component per route
├── store/          # Zustand stores for shared app state (e.g. SimulationSettings)
└── scene/          # all Three.js code (e.g. Scene, render capture)
```

New code goes in these buckets: route-level pages → `pages/`, app-level or reusable UI → `components/`, shared app state → `store/`, anything that touches Three.js → `scene/`.

## Commands

- `npm run dev` — dev server on port **3000** (not Vite's default 5173)
- `npm run build` — `tsc -b && vite build`; typecheck failure blocks the build
- `npm run preview` — serve the production build locally
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, `eslint.config.js`)
- `npm run format` — Prettier over the whole repo

There is **no test suite** — no test script or test dependencies exist. Verify via `build`/`preview` + the dev server.

## Style & toolchain

- Prettier is the source of truth for style (`.prettierrc`): single quotes, semicolons, width 100, trailing commas. `prettier-plugin-tailwindcss` sorts Tailwind classes — run `npm run format` after adding JSX classes.
- ESLint runs Prettier rules via `eslint-plugin-prettier`, so `npm run lint` reports formatting violations. It is also **type-aware** (`recommendedTypeChecked` with `projectService`, plus `react-x`/`react-dom` plugins) — lint failures can include type-level and React-specific rules, and lint is slower than a plain pass.
- Tailwind v4 is configured via the `@tailwindcss/vite` plugin; there is **no `tailwind.config.js`** — configuration lives in CSS (`src/index.css`).

## UI design system

All UI uses a **light, green-based Tailwind theme — simple and clean, since the 3D render output is the focus** (no custom CSS tokens yet; styling lives in component class lists). Reference implementations: `src/components/Navbar.tsx` (app chrome) and `src/pages/ImportSettingsPage.tsx` (card/notice). Keep new UI consistent with these choices:

- **Backgrounds:** app base `bg-green-50`; navbar/chrome `bg-white` with `border-stone-200` separators; cards `rounded-xl border border-stone-200 bg-white shadow-sm`; the 3D scene background stays black (`#000000`) so the render remains the focal point.
- **Text:** primary `text-stone-900`; secondary/inactive `text-stone-500` (links get `hover:text-stone-900`); body copy `text-stone-600`.
- **Accent — green only:** active nav links `text-green-700`; icons `text-green-600`; focus state `focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white`. Do not introduce other accent hues.
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

## Code documentation

Documentation splits into two kinds with opposite rules. **Contract docs on public surfaces are good style, not noise:** every `export`ed symbol — types, functions, store hooks (including their state shape), components (including their props) — is documented with a leading JSDoc, even where the description is obvious or redundant from the name; in that case keep it short. For public surfaces, **consistency is the key**: every export is documented, none left out.

**Inline comments are the noise risk**, and a liability, not an asset: each is a claim that must be kept true as the code changes, and a stale comment is worse than none. The **default is no inline comment**. An inline comment earns its place only when (1) a reader could reasonably make a specific wrong decision or delete the code without it, (2) the fact is not derivable from this code or from the file that actually owns it, and (3) it describes behavior this file itself introduces — not platform behavior or another component's internals.

- **Explain the why, never the what.** The code already shows what a line does; an inline comment states the non-obvious reason it exists or the invariant it protects. Never restate mechanics the code already makes visible.
- **One owner per fact.** A behavior is documented in the file that implements it. Consumers and sibling files never restate another file's internals — that duplication is how comments go stale. If a fact is needed by callers, it belongs on the shared type or in a skill, not echoed at the call site.
- **Keep it current or delete it.** A comment is updated in the same change as the code it describes; if it can no longer be kept true, delete it. When torn between keeping and deleting a marginal comment, delete it.

## State management

Shared app state — state used by more than one page or outside a component subtree (e.g. **`SimulationSettings`**, consumed by both `SimulationPage` and `ImportSettingsPage`) — is managed with **Zustand**, not `useState` + prop drilling.

- **Stores live in `src/store/`** — one file per domain (e.g. `store/simulation.ts`), each exporting a `use`-prefixed hook built with `create` from `zustand`. The shared model from `src/types.ts` is stored as **one section object** (e.g. `activeSettings: SimulationSettings`), not as flat per-field state, and is replaced wholesale through a single setter named `updateActiveSettings` (not `setActiveSettings`, so it doesn't read like a `useState` setter).
- **Components read through selectors:** `useSimulationStore((state) => state.activeSettings)`. Updates provide a **copy** of the model with the changed value(s) replaced — `updateActiveSettings({ ...settings, cubeColor: event.target.value })` — never mutating the stored object, and never passing settings down as props from a page.
- **The scene never subscribes to the store in React.** `Scene.tsx` reads it imperatively via `useSimulationStore.getState()` inside the rAF loop. That keeps the Three.js mount effect's deps at `[]` and guarantees store updates only change what the _next frame_ renders — they can never recreate the renderer.

## Architecture notes

- Entry flow: `index.html` → `src/main.tsx` (mount only) → `src/router.tsx` (React Router 7 is set up **there**: `App` is the layout route — `Navbar` + `<Outlet />`; children: `SimulationPage` at `/simulation`, `ImportSettingsPage` at `/import-settings`, `NotFoundPage` at the `*` catch-all; the index `/` redirects to `/simulation`) → `src/pages/SimulationPage.tsx` → `src/scene/Scene.tsx`.
- `src/scene/Scene.tsx` does all Three.js setup (scene, camera, renderer, rAF loop) inside a `useEffect` with full teardown (dispose, rAF cancel, DOM removal). **StrictMode is on**, so in dev this effect runs mount → cleanup → mount; the cleanup is what keeps it from leaking/crashing. Preserve this pattern when extending the scene.
- The scene is sized from the container div (`clientWidth/Height`), not the window — the renderer div must keep its full-size classes.
