---
name: Tailwind 3D UI
description: Use when adding or restyling UI over the Three.js canvas — HUDs, control panels, inspector UIs, menus, tooltips — or when changing layout/responsive behavior of the renderer and app chrome in this Tailwind v4 app.
---

# Tailwind styling of 3D apps

## Layout model

- The scene and the UI are **sibling layers**, as in `src/App.tsx`: canvas wrapper `absolute inset-0 z-0`, UI elements `relative`/`absolute` with a higher z-index.
- The renderer div must remain full-bleed (`h-full w-full` / `inset-0`, overflow hidden): scene sizing is measured from `clientWidth/clientHeight`, so no margins, padding, or borders on the canvas layer.
- **Pointer events:** a UI wrapper covering the canvas needs `pointer-events-none` on the wrapper and `pointer-events-auto` on the interactive children, or it will swallow canvas interaction (drag, hover, picking).

## Workflow: adding UI over the scene

1. Add it as a sibling of the canvas wrapper inside the relative root (`<main className="relative h-screen ...">` pattern in `App.tsx`).
2. Choose a slot: top bar, bottom HUD, left/right inspector panel. Pin with `absolute` + edge utilities (`top-0 left-0 right-0` or `inset-x-0`), and `z-10`+ so it stays above the canvas.
3. Style for a dark 3D backdrop using the repo palette (AGENTS.md `## UI design system` is canonical): slate-900/950 backgrounds, `border-slate-800`, light text (`text-slate-100`), and **sky-400 as the only accent** (active states, focus rings — `focus-visible:ring-2 focus-visible:ring-sky-400 ...`). Solid cards (`bg-slate-950/60`) or translucent panels over the canvas (`bg-slate-900/80` + `backdrop-blur`).
4. Responsive: panels should collapse or stack under a reasonable small-viewport breakpoint; verify nothing important is buried under a panel on mobile-sized widths.
5. If the panel is a container of many controls, keep `flex`/`grid` structure explicit — Tailwind-only, no inline styles.
6. Finish with `npm run format` (Tailwind class sorting), `npm run lint`, and a visual check on the dev server (port 3000).

## Tailwind v4 specifics (this repo)

- **No `tailwind.config.js`.** Tailwind v4 is configured in CSS: `@import 'tailwindcss'` in `src/index.css`. Custom design tokens go in a `@theme { ... }` block there; custom utilities via `@utility`.
- Prefer utilities; use arbitrary values (`w-[320px]`, `bg-slate-900/70`) and CSS layers deliberately and sparingly.
- The only source CSS is `src/index.css` (currently just `@import 'tailwindcss'`); styling lives in Tailwind utilities on components.
- `prettier-plugin-tailwindcss` is active: always run `npm run format` after adding or reordering class lists, or `npm run lint` will report formatting violations.

## Checklist: before shipping UI over the canvas

- [ ] Styling follows the AGENTS.md UI design system (slate palette, sky-400 accent, `border-slate-800`).
- [ ] Sibling layering with canvas at `z-0`, UI above; renderer div untouched and full-bleed.
- [ ] `pointer-events` handled: transparent wrappers don't block canvas interaction.
- [ ] Panels readable against the 3D background (contrast, and checked with the scene bright and dark).
- [ ] Keyboard focus visible; interactive elements are real `<button>`s/inputs, not `onClick` divs.
- [ ] Class lists sorted (ran `npm run format`) and `npm run lint` + `npm run build` pass.
- [ ] Visually verified on the dev server at desktop and a narrow viewport.
