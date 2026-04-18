# Agent / contributor rule files

Short, prescriptive notes meant to steer implementation and reviews. They **complement** (not replace) the deeper docs in `dev-knowledge/` and the project’s `.cursorrules`.

**Session entry point:** start-of-chat navigation, search map, and **token/context strategy** live in the repo root **[`AGENT-INDEX.md`](../../AGENT-INDEX.md)**.

| File | Use when |
|------|----------|
| [architecture.md](./architecture.md) | Changing module boundaries, init order, game loop, or shared state |
| [code-style.md](./code-style.md) | Writing or refactoring JavaScript to match project conventions |
| [security.md](./security.md) | Storage, dependencies, XSS, or anything that touches user data / network |
| [performance.md](./performance.md) | Frame budget, rendering, DOM churn, or mobile behavior |
| [ui-input.md](./ui-input.md) | Keyboard, touch, keybinds, modals, or HUD updates |

If guidance conflicts, prefer **this repo’s actual code** and `.cursorrules`, then update these rule files to match.
