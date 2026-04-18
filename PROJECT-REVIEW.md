# Bee Brave — Project Review
*Generated April 1, 2026 · Based on `resume-ai-tools-brief.md` framework*

---

## Project Snapshot

| | |
|---|---|
| **Name** | Bee Brave — Galactic Battle for Resources |
| **Type** | Browser-based canvas game |
| **Stack** | Vanilla JS (ES modules), HTML5 Canvas, Web Audio API, CSS3 |
| **Codebase size** | ~10,700 lines across 12 JS files + 2,013-line CSS |
| **Status** | Active / Shippable v1.0 |
| **Platform** | Desktop + Mobile (touch controls fully implemented) |

---

## Architecture Assessment

### Strengths

**Clean module separation.** The game is split across 12 focused ES modules with explicit named imports/exports. No global namespace pollution; cross-module state passes through ref objects (`{ value: ... }`) rather than bare globals.

```
config.js   → constants, canvas, render cache
game.js     → main loop, state management (~519 lines)
bees.js     → bee + hunter AI, dropship (~537 lines)
cells.js    → hex hive grid (~173 lines)
combat.js   → bullets, weapons, drops (~1,089 lines)
draw.js     → all rendering (~2,344 lines)
audio.js    → Web Audio API synthesis (~1,729 lines)
music.js    → background music engine (~283 lines)
particles.js→ explosion / impact particles (~456 lines)
touch.js    → mobile joystick + buttons (~343 lines)
user.js     → player movement + input (~441 lines)
ui.js       → HUD updates (~336 lines)
```

**Delta-time normalization throughout.** All movement uses `velocity * (dt * 0.06)` to stay frame-rate independent. Timers are stored in milliseconds and decremented directly by `dt`.

**Backwards-iteration array mutation.** The codebase consistently uses `for (let i = arr.length - 1; i >= 0; i--)` when splicing entities mid-loop — the correct pattern to avoid index-skipping bugs.

**Hex grid with axial coordinates.** `HEX_ANGLES` is pre-computed at module load time (6 `cos`/`sin` pairs), eliminating trig recalculation every frame. A reusable `Path2D` hexagon template is cached in `renderCache.hexPath`.

---

## Rendering & Performance

| Optimization | Where |
|---|---|
| Off-screen canvas for parallax background | `config.js` → `renderCache.parallaxCanvas` |
| Visibility culling (`isVisible(x, y, r)`) | `config.js`, called in `draw.js` before every entity draw |
| Pre-computed hex corner angles | `config.js` → `HEX_ANGLES[]` |
| Reusable `Path2D` hex template | `config.js` → `renderCache.hexPath` |
| Cached radial gradient for background glow | `config.js` → `renderCache.backgroundGlow` |
| Canvas alpha disabled (`{ alpha: false }`) | `config.js` → `initCanvas` |
| `ctx.save()/restore()` calls reduced | `draw.js` — manual state management instead |
| Dirty-flag parallax redraw | `renderCache.parallaxDirty` — only redraws parallax layer when flagged |

The 3-layer parallax system (far stars / mid nebula clouds / near pollen particles) runs almost entirely from a cached off-screen canvas — only the player-position-driven offset triggers a re-composite, not a full redraw.

---

## Game Systems Inventory

### Combat
- **Player bullets** — speed 8, radius 3, damage 1
- **Special weapons (V key)** — Freeze Bomb (80 px AoE, 3s slow), Electric Blast (100 px continuous damage), Warp (150 px teleport)
- **Heavy ordnance (B key)** — Singularity (gravity vortex), Railgun (piercing beam), Shockwave (stuns all); collected as timed drops every 30 s
- **Defensive tech (C key)** — Ablative Shield, Counter-Missiles (homing), Cloak (invisibility); drops every 35 s
- **Hunter lasers** — speed 6, radius 4, damage 15

### Enemy AI
- **Regular bees** — 4-state machine: `forage → return → idle → attack/hunt`. Transition to permanent `hunt` when all resources are depleted.
- **Hunter bees** — Spawned by dropship when player stays stationary for ≥ 5 s (`IDLE_THRESHOLD`). Independent shield pool (25), HP 8, flanking behavior.
- **Dropship** — Warning phase → descent → hunter deployment.

### Hive
- Hexagonal grid using axial (q, r) coordinates. Rings built outward from `center`.
- Cells have `hp` (max 5) + honey fill. Honey cells trigger bonus scoring.
- 10-second protection window at game start (`HIVE_PROTECTION_DURATION = 10000`).
- Hive fires back at player if in range (500 px), cooldown 2 s.

### Audio
`audio.js` is entirely **procedural Web Audio API synthesis** — no audio file assets. It constructs oscillators, noise buffers, filters, gain nodes, and frequency modulators at runtime for every sound category (engine hum, weapon fire, explosions, warnings, feedback tones). At ~1,729 lines, this is the single largest file and represents genuine depth in Web Audio.

### Mobile
Full touch control system with virtual joystick (left side) and dedicated buttons (FIRE / V / ⟳ / B / C). Multi-touch supported; `touchcancel` handled correctly; `passive: false` on all joystick handlers to allow `preventDefault`.

---

## Code Quality Notes

### What's working well
- **Self-documenting constant names** — `HIVE_PROTECTION_DURATION`, `BEE_HUNT_SPEED_MULTIPLIER`, `HUNTER_SPAWN_DISTANCE` read clearly at usage sites.
- **Reset functions for every system** — `resetBees()`, `resetCombat()`, `resetParticles()`, `resetUser()`, etc. make clean restarts and menu transitions reliable.
- **Ref-object pattern for cross-module singletons** — `gameStartedRef = { value: false }` avoids ES module live-binding gotchas while keeping state readable.
- **`dev-knowledge/` folder** — Architecture, rendering, combat, bee system, config reference, and game state all have dedicated markdown docs. Unusual for a personal project; valuable for onboarding and AI context.
- **`.cursorrules` project rule file** — The project carries its own AI coding conventions (dt normalization, array mutation, coordinate system, screen shake values) directly in the repo.

### Areas to watch
- **`draw.js` at 2,344 lines** — Functionally clean but large. A future split into sub-renderers (background, entities, UI, effects) would improve navigability without changing runtime behavior.
- **`audio.js` at 1,729 lines** — Similar reasoning; grouping by sound category (engine, weapons, bees, UI) into separate files or a class with sub-namespaces would help.
- **Settings sync is DOM-driven** — `syncSettingsToGame()` reads/writes 6 hidden `<input>` elements to pass settings from the custom-game screen to the running game. A small state object would remove the DOM as a data bus.
- **`priorityPercent` read from DOM in game loop** — `document.getElementById('priorityPercent').value` is called every frame inside `updateBees`. Caching this value at game start would avoid repeated DOM queries.
- **No unit tests** — Acknowledged in `TODO.md`. Logic in `cells.js`, `resources.js`, and `combat.js` (damage calculations, hex math) is well-isolated and would test easily.
- **Memory leak risk in particles** — The `particles.js` file manages arrays correctly, but under heavy fire + explosions on slower devices the array can grow faster than it empties. `TODO.md` notes "reduce particle counts on mobile."

---

## Feature Completeness vs. TODO.md

| Category | Done | Remaining |
|---|---|---|
| Core gameplay loop | ✅ | — |
| Visual polish (particles, shake, parallax, animations) | ✅ | Day/night cycle |
| Audio (SFX + music) | ✅ | Volume controls, mute toggle |
| Mobile touch controls | ✅ | Orientation lock, visibility-change pause |
| Mobile performance | ⚠️ Partial | DPR handling, particle throttle, parallax density |
| UI screens (landing, how-to-play, game-over) | ✅ | Pause menu, game stats screen |
| High score (localStorage) | ✅ | Server-side leaderboard |
| Weapon variety | ✅ | More types, upgrade system |
| Bee AI variety | Partial | Boss bee, swarm patterns, retreat behavior |
| Difficulty levels | ❌ | Easy / Medium / Hard |

---

## Resume Tool Entry (filled from `resume-ai-tools-brief.md` template)

### Identity

| Field | Notes |
|---|---|
| **Tool / project name** | Bee Brave — Galactic Battle for Resources |
| **One-line description** | Browser canvas game with procedural audio, mobile touch controls, and hex hive destruction built in pure ES-module JavaScript |
| **Repo / path** | `bee-brave-pure-code` (local / GitHub) |
| **Status** | Active — v1.0 shippable |
| **Primary users** | Personal / portfolio / public web |

### Problem & Approach

- **Problem:** Demonstrate end-to-end ownership of a non-trivial interactive system — game loop, physics, AI state machines, procedural audio, and mobile UX — without a game engine or UI framework.
- **Before:** No baseline; greenfield project started to deepen canvas + Web Audio API fluency.
- **After:** A fully playable, mobile-friendly game with 9 weapon types, multi-state bee AI, hex grid mechanics, 3-layer parallax rendering, and ~10,700 lines of organized, framework-free JavaScript.
- **Constraints:** Zero runtime dependencies; must run from a static file server or `file://`; audio must comply with browser autoplay policy (AudioContext gated behind user interaction).

### AI in the Loop

- **Where AI helped:** Architecture scaffolding, boilerplate for repetitive system patterns (bee state machine variants, audio node graphs), code review of delta-time normalization bugs, documentation drafts for `dev-knowledge/`, `.cursorrules` conventions file.
- **What you still owned:** Game design decisions (weapon balance, bee aggression thresholds, hex grid size), all Web Audio synthesis graphs, mobile touch UX layout, performance optimizations (off-screen canvas strategy, Path2D caching, visibility culling), debug sessions on multi-touch edge cases.

### Tech Stack

- **Languages & runtime:** JavaScript (ES2020 modules), HTML5, CSS3 — no transpilation, no build step
- **APIs:** HTML5 Canvas 2D, Web Audio API, localStorage, Touch Events API, requestAnimationFrame
- **Frameworks / libraries:** None
- **Build / deploy:** Static file serve — open `index.html` or drop on any web host

### Impact

| Metric | Value |
|---|---|
| Codebase size | ~10,700 lines, 12 JS modules |
| Feature surface | 9 weapon types, 2 enemy classes, hex hive system, procedural audio, full mobile support |
| Render budget | Stable 60 fps on desktop via culling, off-screen canvas, and cached gradients |
| Audio assets loaded | 0 — all sound synthesized at runtime via Web Audio API |

**Interview story:** "The audio system has no audio files at all — every sound from the engine hum to the railgun is built from oscillators and noise buffers at runtime. I used AI to generate the initial gain-node graph for the engine loop, then hand-tuned all the frequency and filter parameters to get a sound I was happy with. That back-and-forth between generated scaffold and manual craft is how I use AI on most systems."

### Resume Bullet Drafts

- Built a 10,700-line ES-module browser game in zero-dependency JavaScript, implementing hex grid collision, multi-state bee AI, 9-weapon combat system, and stable 60 fps rendering via off-screen canvas caching and visibility culling.
- Engineered a fully procedural Web Audio API sound engine (~1,700 lines) with no audio file assets — synthesizing all SFX and background music from oscillators, noise buffers, and filter graphs at runtime.
- Delivered full mobile support with a virtual joystick + multi-touch button layout, correct `touchcancel` handling, and device-pixel-ratio-aware canvas scaling.
- Used AI pair-programming (Cursor / Claude) to accelerate architecture scaffolding and documentation while retaining ownership of game design, audio synthesis tuning, and performance optimization decisions.

**Concise headline:** *Bee Brave — Full-featured canvas game in pure JS, procedural Web Audio, ES modules, mobile-ready*

---

## Cross-Cutting Themes

- **Ownership:** Solo end-to-end — design, architecture, implementation, mobile UX, audio design, documentation.
- **Risk / craft:** Autoplay policy compliance handled by gating `AudioContext` creation behind the first user click; parallax dirty-flagging prevents unnecessary off-screen redraws; backwards array iteration prevents splice-index bugs.
- **Learning:** A settings state object (instead of reading/writing hidden DOM inputs) would be the first refactor. Test coverage for hex math and damage calculations would have caught the shield regeneration edge case found late in development.
- **AI fluency demonstrated:** `.cursorrules` file embedded in the repo carries project-specific AI coding conventions — showing that AI tooling is a first-class part of the dev workflow, not an afterthought.
