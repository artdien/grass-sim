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

## UI design system

All UI uses a **light, green-based Tailwind theme — simple and clean, since the 3D render output is the focus** (no custom CSS tokens yet; styling lives in component class lists). Reference implementations: `src/Navbar.tsx` (app chrome) and `src/LoadPage.tsx` (card/notice). Keep new UI consistent with these choices:

- **Backgrounds:** app base `bg-green-50`; navbar/chrome `bg-white` with `border-stone-200` separators; cards `rounded-xl border border-stone-200 bg-white shadow-sm`; the 3D scene background stays black (`#000000`) so the render remains the focal point.
- **Text:** primary `text-stone-900`; secondary/inactive `text-stone-500` (links get `hover:text-stone-900`); body copy `text-stone-600`.
- **Accent — green only:** active nav links `text-green-700`; icons `text-green-600`; focus state `focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white`. Do not introduce other accent hues.
- **Typography:** system font stack (no web fonts); chrome/nav titles `text-base leading-tight font-semibold`; page headings `text-xl font-semibold`; body and links `text-sm`.
- **Layout shell:** `App.tsx` is a flex column — `Navbar` on top, page content in `<main className="relative min-h-0 flex-1 overflow-hidden">` below it. UI placed over the canvas follows the layering rules in the `tailwind-3d-ui` skill.

## TypeScript

- `verbatimModuleSyntax`: use `import type` for type-only imports.
- `erasableSyntaxOnly`: no enums, namespaces, or parameter properties.
- `noUnusedLocals`/`noUnusedParameters` are on.
- **`@/` path alias, extension-less imports:** all in-project imports use the `@/` alias (mapped to `src/` in both tsconfig `paths` and Vite `resolve.alias`) with **no** file extension — e.g. `import { Renderer } from '@/Renderer'`. Do not use relative `./`/`../` paths or `.tsx`/`.ts` extensions. Enforced by ESLint `no-restricted-imports` (lint fails) and by `allowImportingTsExtensions` being off (build fails).

## Components

- **Named exports with arrow functions, always:** `export const Component = () => { ... };` — no default exports, no function declarations.
- **One React component per file**, named after the component.

## Architecture notes

- Entry flow: `index.html` → `src/main.tsx` (React Router 7 is set up **here**: `App` is the layout route — `Navbar` + `<Outlet />`; children: `ConfigurationPage` at `/configuration`, `LoadPage` at `/load`; `/` and the catch-all redirect to `/configuration`) → `src/ConfigurationPage.tsx` → `src/Renderer.tsx`.
- `Renderer.tsx` does all Three.js setup (scene, camera, renderer, rAF loop) inside a `useEffect` with full teardown (dispose, rAF cancel, DOM removal). **StrictMode is on**, so in dev this effect runs mount → cleanup → mount; the cleanup is what keeps it from leaking/crashing. Preserve this pattern when extending the renderer.
- The scene is sized from the container div (`clientWidth/Height`), not the window — the renderer div must keep its full-size classes.
