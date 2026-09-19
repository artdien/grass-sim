# grass-sim

React 19 + TypeScript + Vite web app rendering a Three.js (WebGL) scene. Early scaffold: `src/Renderer.tsx` is a placeholder rotating wireframe cube. Single package, no workspaces, no CI.

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

## TypeScript

- `verbatimModuleSyntax`: use `import type` for type-only imports.
- `erasableSyntaxOnly`: no enums, namespaces, or parameter properties.
- `noUnusedLocals`/`noUnusedParameters` are on.
- **`@/` path alias, extension-less imports:** all in-project imports use the `@/` alias (mapped to `src/` in both tsconfig `paths` and Vite `resolve.alias`) with **no** file extension — e.g. `import { Renderer } from '@/Renderer'`. Do not use relative `./`/`../` paths or `.tsx`/`.ts` extensions. Enforced by ESLint `no-restricted-imports` (lint fails) and by `allowImportingTsExtensions` being off (build fails).

## Components

- **Named exports with arrow functions, always:** `export const Component = () => { ... };` — no default exports, no function declarations.
- **One React component per file**, named after the component.

## Architecture notes

- Entry flow: `index.html` → `src/main.tsx` (React Router 7 is set up **here**, single route) → `src/App.tsx` → `src/Renderer.tsx`.
- `Renderer.tsx` does all Three.js setup (scene, camera, renderer, rAF loop) inside a `useEffect` with full teardown (dispose, rAF cancel, DOM removal). **StrictMode is on**, so in dev this effect runs mount → cleanup → mount; the cleanup is what keeps it from leaking/crashing. Preserve this pattern when extending the renderer.
- The scene is sized from the container div (`clientWidth/Height`), not the window — the renderer div must keep its full-size classes.
