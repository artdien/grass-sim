---
name: react-components
description: Use when creating or refactoring React components or hooks, writing TypeScript in this repo, or running the lint / format / build / dev workflow. Covers repo-enforced TypeScript settings and the verification loop (no test suite exists).
---

# React components & TypeScript workflow

## Component style (strict requirements)

- **Named exports with arrow functions, always:** `export const ComponentName = () => { ... };` — never `default` exports, never `function` declarations.
- **One React component per file.** No stacking components in a single file; give each its own file named after the component.

## Component workflow

1. Function components with hooks; placement: route-level pages → `src/pages/`, app-level or reusable UI → `src/components/`, anything that touches Three.js → `src/scene/`; one per file (see above).
2. **Props:** declare a typed prop type next to the component (`interface Props { ... }` or an object type); keep the public surface minimal and group related options instead of passing 8+ flat props.
3. **State:** `useState` for values that should drive re-renders; `useRef` for stable handles to imperative things (DOM nodes, mutable scratch state, Three.js objects); **state shared between pages or component trees → Zustand store in `src/store/`** (one file per domain, e.g. `useSimulationStore` in `store/simulation.ts`) — the model lives as one section object (e.g. `state.activeSettings`), is read through selectors, and updated by passing a **copy** with the changed value(s) replaced (`updateActiveSettings({ ...settings, cubeColor })`); never threaded down as page-level props.
4. **Effects:** only for syncing with the outside world (Three.js, sizing, subscriptions). Always return a complete cleanup — in this app that includes StrictMode survival.
5. **Handlers:** keep them small; pass down deliberately. Wrap in `useCallback` only when a child is memoized or a stable identity genuinely matters.
6. **Composition over configuration:** prefer composing small primitives (panels, rows, buttons) over one component with a dozen modifier props.
7. **Lists:** explicit stable keys — never array index when items can reorder.

## TypeScript rules (repo-enforced — violations fail lint/build)

- `verbatimModuleSyntax`: type-only imports must be `import type { ... } from ...`.
- `erasableSyntaxOnly`: no `enum`, no namespaces, no parameter properties — use string-literal unions and plain interfaces.
- **All in-project imports use the `@/` path alias with no file extension:** `import { Scene } from '@/scene/Scene'` (alias maps to `src/` in both `tsconfig.app.json` `paths` and Vite `resolve.alias`). Do not use relative paths like `./` or `../` for project files, and do not add `.tsx`/`.ts` extensions — this is **enforced**: ESLint `no-restricted-imports` fails lint, and `allowImportingTsExtensions` being off fails the build.
- `noUnusedLocals` / `noUnusedParameters` are on — no dead code or unused args.
- Prefer `unknown` + narrowing over `any`; reach for generics sparingly.

## Verification loop (run this order after every change)

1. `npm run lint` — type-aware ESLint with Prettier rules; formatting violations show up here.
2. `npm run format` — run after touching JSX class lists (prettier-plugin-tailwindcss sorts Tailwind classes).
3. `npm run build` — `tsc -b` runs first; a type error blocks the build.
4. `npm run dev` (port 3000) — check the change in the browser.

**There is no test suite.** Build success + a working dev-server behavior check is the entire safety net, so "looks fine on the dev server" must actually be verified, not assumed.
