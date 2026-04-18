# Architecture rules (Bee Brave)

## Stack and entry

- **Pure ES modules** in `js/`. No bundler required; `index.html` loads `js/game.js` as `type="module"`.
- **Single canvas game** with DOM UI layered around it (`#ui`, screens, modals).
- **Entry**: `game.js` owns `requestAnimationFrame` loop, initialization order, and wiring refs into other modules.

## Module roles (do not blur without reason)

| Module | Responsibility |
|--------|----------------|
| `config.js` | Constants, canvas init, shake, shared render-related helpers |
| `game.js` | Loop, top-level flags (`gameStarted`, `gameOver`), orchestration, localStorage for scores |
| `draw.js` | All canvas drawing; keep game logic out |
| `user.js` | Player entity, keyboard input integration, movement |
| `touch.js` | Mobile joystick / buttons; exports `touchInput` for `user.js` |
| `keybinds.js` | Persisted keyboard bindings; consumed by `user.js` / `ui.js` |
| `combat.js` | Weapons, bullets, effects, UI hooks for weapon displays |
| `bees.js` | Bee AI, hunters, dropship, explosions owned by bee systems |
| `cells.js` | Hive hex grid and cell updates |
| `resources.js` | Resource spots |
| `particles.js` | Particle effects |
| `audio.js` / `music.js` | SFX and music |
| `ui.js` | DOM wiring, sliders, keybind UI, HUD text |

## Cross-module state

- Prefer **explicit parameters** or small **ref objects** (e.g. `{ value: boolean }`) passed via setters like `setGameStateRefs`, `setGameFunctions`, rather than new globals.
- **Avoid circular imports**: if two modules need each other, lift shared types/state to a third module or pass callbacks from `game.js`.

## Update / draw separation

- **`update*(dt, …)`** mutates simulation state; **`draw(...)`** reads state only. Do not mutate gameplay state inside `draw.js` except for purely visual scratch (prefer none).
- **Delta time** is in **milliseconds**. Movement and rate-like effects use `* (dt * 0.06)` for 60fps-normalized feel unless a value is explicitly “per ms” (e.g. timers counting down by `dt`).

## Initialization order

- Canvas and config before entities that read dimensions.
- `setGameStateRefs` / touch refs before `initInput` / `initTouchControls`.
- UI init can run early, but anything that assumes game DOM must run after DOM ready (current pattern: `DOMContentLoaded` in `game.js`).

## Adding a new system

1. Decide **one owner module** for the feature’s state.
2. Expose a minimal API (`updateX`, `resetX`, `drawX` or fold into existing draw pass).
3. Hook from **`game.js`** only (update + reset paths), not from random DOM handlers.
