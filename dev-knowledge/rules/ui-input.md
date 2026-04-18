# UI and input rules (Bee Brave)

## Two input channels

- **Keyboard**: `user.js` + **`keybinds.js`** (persisted `KeyboardEvent.code` bindings).
- **Touch**: `touch.js` exports **`touchInput`**; movement and actions mirror keyboard capabilities where designed.

Changes to combat actions should consider **both** paths unless the task is explicitly desktop-only.

## Keybinds

- Bindings are stored by **`code`** (physical key), not `key`, for stable layouts across keyboard languages where appropriate.
- **`assignCodeToAction`** removes duplicate `code` from other actions; keep that invariant if extending the binding model.
- While remapping, **`getRemapListenActionId()`** is set—**`user.js` must ignore** game keyboard handling during capture so keys do not fire weapons or movement.
- **Escape** cancels remap in the UI layer; do not bind gameplay actions to Escape without revisiting that flow.

## Focus and accidental triggers

- When adding new keyboard shortcuts, respect existing guards: **ignore** keys when target is **`input` / `textarea` / `select`** or **`contentEditable`**, so sliders and forms work on menus.

## HUD and hints

- In-game **`<kbd>` hints** for weapons should stay in sync with **`keybinds`** (see `ui.js` refresh patterns) when adding new weapon rows.

## Modals and screens

- Landing / start / game-over flows are **CSS-class driven** (`hidden`, `show`). Follow established patterns for focus trap and scroll if adding new modals.
- **Back** and **close** actions should restore a consistent screen state (music, classes, game flags) matching `game.js` helpers.

## Accessibility (proportionate)

- Buttons should have **visible labels** or `title` where icons alone might confuse.
- Do not rely on **color alone** for critical state; pair with text or icons (existing UI already mixes both in places).

## Touch control visibility

- **`#touchControls`** toggles with viewport / capability logic elsewhere; do not assume touch DOM exists when testing desktop-only paths.
