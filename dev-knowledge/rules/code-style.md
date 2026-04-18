# Code style rules (Bee Brave)

## Language and modules

- **ES202+** with **`import` / `export`** only; no IIFE globals for game logic.
- Use **named exports** consistently with existing files.
- Prefer **explicit `.js` extensions** in import paths (matches current codebase).

## Movement and timing

- **Position / velocity-style updates**: multiply by `(dt * 0.06)` where `dt` is ms (see `.cursorrules`).
- **Cooldowns / durations in ms**: subtract `dt` directly; do not apply the 0.06 factor unless intentionally normalizing a rate.

## Collections and entities

- When removing from arrays during iteration, loop **backwards** with `splice(i, 1)` or rebuild with `filter` if safe and clearer.
- Keep entity shapes **plain objects** unless a class clearly reduces complexity.

## Canvas and coordinates

- Origin **top-left**; hive center uses **`center`** from `config.js` (not geometric canvas center unless documented).
- Hex logic stays in **`cells.js`** / documented helpers; do not duplicate axial math in unrelated modules.

## Naming and structure

- Match existing **camelCase** for variables and functions.
- **Boolean flags**: `is*`, `has*`, or clear past-tense for events (`gameOver`).
- **Magic numbers**: pull into `config.js` when reused or tuned for balance; a one-off local constant is fine if documented briefly.

## Audio and side effects

- Respect **`initAudioContext()`** patterns before starting audio (browser autoplay policies).
- Do not start music/SFX from module top-level; tie to user gesture or game start paths already used in the project.

## Changeset discipline

- Prefer **small, focused diffs** aligned with the task; avoid drive-by reformatting unrelated files.
- When touching **draw order**, read `dev-knowledge/rendering.md` / `.cursorrules` render order section first.
