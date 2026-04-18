# Agent index — start of chat

## Minimal bootstrap (paste if tokens are tight)

```text
Bee Brave: canvas game, pure ES modules, no bundler. Entry: index.html → js/game.js.
Read .cursorrules for dt (movement * dt * 0.06; ms timers -= dt), render order, bee/combat constants.
Open only files your task needs: loop game.js | draw draw.js | combat combat.js | bees bees.js |
cells cells.js | player/input user.js + keybinds.js | touch touch.js | DOM ui.js + index.html |
tuning config.js. Task rules slice: dev-knowledge/rules/<architecture|code-style|security|performance|ui-input>.md
Search: rg symbols/DOM ids first; semantic “where is X” before reading huge files (esp. draw.js).
If doc vs code conflicts → code + .cursorrules win.
```

For the full router, search map, and norms, keep reading below (or attach this whole file).

---

Attach or `@`-mention this file at **session start** so routing, search, and context use stay predictable.

---

## Context & token strategy

**Goal:** load **high signal, low bulk** first, then open **only the source files** the task needs. Avoid pasting or reading entire large modules (especially `draw.js`) unless the task is rendering.

| Layer | Approx. size | When to load |
|--------|----------------|---------------|
| This file | ~2 KB | Full attach, or paste **Minimal bootstrap** + one row from **§3 Task → read set**. |
| `.cursorrules` | ~4 KB | Any gameplay / pattern / constant work. |
| **One** of `dev-knowledge/rules/*.md` | ~1–2 KB each | Matches your task type (UI, security, perf, etc.). |
| `dev-knowledge/*.md` deep dives | larger | Only after you know *which* system (e.g. `combat.md` for weapon logic). |
| `js/*.js` | varies | Prefer **rg/semantic hit → read a function region**, not whole files. |

**Why this helps tokens:** the index + one rules file replaces blind repo-wide exploration. The search map points to **one primary file** per topic so the model opens 1–2 files instead of guessing across 14 modules.

**Why this helps answer quality:** `.cursorrules` + rules capture **invariants** (dt, render order, input); code supplies **truth**. Less contradictory context than mixing outdated prose with live code.

---

## 1. Read order (thin → deep)

1. **This file** — search map, token notes, norms below.
2. **`.cursorrules`** — authoritative patterns, constants, render order, gotchas.
3. **`dev-knowledge/rules/`** — [README](dev-knowledge/rules/README.md); open **one** of: `architecture` | `code-style` | `security` | `performance` | `ui-input`.
4. **`dev-knowledge/*.md`** — e.g. `bees.md`, `combat.md`, `rendering.md` when changing that subsystem in depth.

If prose and code disagree, **code + `.cursorrules` win**; update docs when you can.

---

## 2. Core agent norms (repo-specific)

- **Execute**: implement and run checks; do not only suggest commands.
- **Scope**: match the ask; no drive-by refactors or extra markdown unless requested.
- **Movement vs timers**: movement uses `* (dt * 0.06)`; countdown-style **ms timers** use `dt` without that factor.
- **Citations**: existing code → `` `start:end:path` `` fenced blocks as required by the project.

---

## 3. Task → smallest read set (quick routes)

| If the user wants… | Start here (often enough) |
|---------------------|----------------------------|
| New feature / loop / game flow | `js/game.js` |
| Balance / tuning numbers | `js/config.js` (+ one system file) |
| Visual / sprite / draw order | `js/draw.js` (search symbols first) |
| Player / keys | `js/user.js` + `js/keybinds.js` |
| Mobile controls | `js/touch.js` + `#touchControls` in `index.html` |
| Guns / specials / bullets | `js/combat.js` |
| Bee behavior | `js/bees.js` |
| Hive / hex | `js/cells.js` |
| HUD / menus / sliders | `js/ui.js` + `index.html` |
| Layout / theme | `css/styles.css` |

---

## 4. File search map (symbols & grep seeds)

| Topic | Primary files | Search hints |
|--------|----------------|--------------|
| Main loop, screens, high score | `js/game.js` | `requestAnimationFrame`, `gameStarted`, `localStorage` |
| Constants, canvas, shake | `js/config.js` | `HEX_SIZE`, `center`, `initCanvas` |
| All canvas drawing | `js/draw.js` | `function draw`, `ctx.`, `isVisible` |
| Player, keyboard | `js/user.js` | `initInput`, `moveUserIcon`, `pressedCodes` |
| Key bindings | `js/keybinds.js` | `DEFAULT_BINDINGS`, `assignCodeToAction` |
| Touch | `js/touch.js`, `index.html` | `touchInput`, `joystick` |
| Combat | `js/combat.js` | `shoot`, `bullets`, `weapon` |
| Bees / hunters | `js/bees.js` | `updateBees`, `hunter`, `forage` |
| Hive | `js/cells.js` | `hexToPixel`, `cells` |
| Resources | `js/resources.js` | `resourceSpots`, `makeResourceSpots` |
| DOM UI | `js/ui.js`, `index.html` | `initUI`, `getElementById` |
| SFX | `js/audio.js` | `AudioContext`, `play` |
| Music | `js/music.js` | `startMusic`, `toggleMusic` |
| Particles | `js/particles.js` | `spawnExplosionParticles`, `updateParticles` |
| Styles | `css/styles.css` | ids/classes from `index.html` |

**Grep**: exact symbols, DOM ids, storage keys. **Semantic search**: “where is X handled?” before opening huge files.

---

## 5. `js/` modules (one screen)

`config` `resources` `bees` `cells` | `game` `user` `keybinds` `touch` | `combat` `draw` `ui` | `audio` `music` `particles`

**Entry:** `index.html` → `type="module"` → `js/game.js`.

**Assets:** `assets/` (images/audio referenced from HTML/CSS/JS).

---

## 6. Cursor

For always-on guidance, add a project rule that points at `.cursorrules` and/or `dev-knowledge/rules/`. This index is the **router**; rules are **slices** by task type.
