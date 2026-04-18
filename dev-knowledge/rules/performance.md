# Performance rules (Bee Brave)

## Frame budget

- Main loop: **`requestAnimationFrame`**; keep per-frame work predictable.
- **`dt`** can spike after tab backgrounding; systems should tolerate variable `dt` without unstable explosions of state (clamp large `dt` only if you introduce explicit handling and tests).

## Rendering (`draw.js`)

- **Cull** off-screen entities where the codebase already uses visibility helpers (e.g. `isVisible`); follow existing patterns before adding new full-scene passes.
- Avoid allocating **new objects** inside hot draw paths when caching or mutation is already established in that area.
- Large `draw.js` is intentional: **co-locate** related drawing; extract sub-functions if a section grows further, rather than scattering draw logic into game modules.

## DOM / UI (`ui.js`)

- Prefer **updating only when values change** (the project already caches previous shield/score/etc. in places). Extend that pattern for new HUD fields.
- Use **CSS transforms** for bars when that pattern exists, to reduce layout thrash.

## Input

- Keyboard handlers should stay **O(1)** per event: no scans of huge arrays per keypress; use maps/Sets for bindings if complexity grows.

## Mobile / touch

- Touch zones should not force **constant reflow**; read layout once where possible.
- Joystick math already uses dead zones; preserve that behavior when editing `touch.js`.

## Assets

- Images referenced from CSS/HTML: use appropriate **resolution** and **preload** only for critical above-the-fold assets to avoid blocking first paint unnecessarily.

## Measurement

- When optimizing, use **Performance** panel or `console.time` briefly; remove debug timers before merge.
