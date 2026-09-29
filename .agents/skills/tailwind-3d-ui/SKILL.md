---
name: tailwind-3d-ui
description: Use when adding or restyling UI over the Three.js canvas — HUDs, control panels, inspector UIs, menus, tooltips — or when changing layout/responsive behavior of the renderer and app chrome in this Tailwind v4 app.
---

# Tailwind styling of 3D apps

## Layout model

- The scene and the UI sit in the same flex flow: the scene container is relative full-size (`relative h-full w-full overflow-hidden`, as in `src/scene/Scene.tsx`) and panels such as the FPS chip and control hint are `absolute` overlays at `z-10`; siblings of the scene (the `Sidebar` in `SimulationPage`) stay in normal layout flow.
- The renderer div must remain full-bleed (`h-full w-full` / `inset-0`, overflow hidden): scene sizing is measured from `clientWidth/clientHeight`, so no margins, padding, or borders on the canvas layer.
- **Pointer events:** a UI wrapper covering the canvas needs `pointer-events-none` on the wrapper and `pointer-events-auto` on the interactive children, or it will swallow canvas interaction (drag, hover, picking).

## Workflow: adding UI over the scene

1. Decide the placement: an overlay goes inside the relative scene container (as the FPS chip / control hint in `src/scene/Scene.tsx` do); a panel beside the scene is a flex sibling in the page (as the `Sidebar` in `SimulationPage` is). Overlay panels pin with `absolute` + edge utilities (`top-0 left-0 right-0` or `inset-x-0`), and `z-10`+ so they stay above the canvas.
2. Style with the repo palette (AGENTS.md `## UI design system` is canonical): a **light, green-based theme** — `bg-white`/`bg-green-50` chrome, `border-stone-200` separators, `text-stone-900`/`text-stone-600` text, **green as the only accent** (`text-green-600/700`, `focus-visible:ring-2 focus-visible:ring-green-600`), red reserved for destructive actions. Chips floating directly over the canvas are dark (`bg-stone-950/60` + `text-stone-300`) so they read against both a black start background and the HDR panorama.
3. Responsive: panels should collapse or stack under a reasonable small-viewport breakpoint; verify nothing important is buried under a panel on mobile-sized widths.
4. Responsive: panels should collapse or stack under a reasonable small-viewport breakpoint (the `Sidebar` hides itself in fullscreen and on touch); verify nothing important is buried under a panel on mobile-sized widths.
5. If the panel is a container of many controls, keep `flex`/`grid` structure explicit — Tailwind-only, no inline styles.
6. Finish with `npm run format` (Tailwind class sorting), `npm run lint`, and a visual check on the dev server (port 3000).

## Tailwind v4 specifics (this repo)

- **No `tailwind.config.js`.** Tailwind v4 is configured in CSS: `@import 'tailwindcss'` in `src/index.css`. Custom design tokens go in a `@theme { ... }` block there; custom utilities via `@utility`.
- Prefer utilities; use arbitrary values (`w-[320px]`, `bg-stone-950/60`) and CSS layers deliberately and sparingly.
- The only source CSS is `src/index.css` (just `@import 'tailwindcss'` plus a `color-scheme: light` override); styling lives in Tailwind utilities on components.
- `prettier-plugin-tailwindcss` is active: always run `npm run format` after adding or reordering class lists, or `npm run lint` will report formatting violations.

## Checklist: before shipping UI over the canvas

- [ ] Styling follows the AGENTS.md UI design system (light green/stone palette, green accent, `border-stone-200`).
- [ ] Scene/UI layering is correct: overlays `absolute` + `z-10` over the relative full-size scene container; the renderer div itself stays untouched and full-bleed.
- [ ] `pointer-events` handled: transparent wrappers don't block canvas interaction.
- [ ] Panels readable against the 3D background (contrast, and checked with the scene bright and dark).
- [ ] Keyboard focus visible; interactive elements are real `<button>`s/inputs, not `onClick` divs.
- [ ] Class lists sorted (ran `npm run format`) and `npm run lint` + `npm run build` pass.
- [ ] Visually verified on the dev server at desktop and a narrow viewport.
