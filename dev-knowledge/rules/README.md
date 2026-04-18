# Agent / contributor rule files

Short, prescriptive notes meant to steer implementation and reviews. They **complement** (not replace) the deeper docs in `dev-knowledge/` and any **optional local** `.cursorrules` you keep (that file is gitignored in this repo).

**Session router:** optional gitignored root **`AGENT-INDEX.md`** (maintain locally if you want a compact chat bootstrap). In-repo substitute: this **`rules/`** folder + [`../README.md`](../README.md).

| File | Use when |
|------|----------|
| [architecture.md](./architecture.md) | Changing module boundaries, init order, game loop, or shared state |
| [code-style.md](./code-style.md) | Writing or refactoring JavaScript to match project conventions |
| [security.md](./security.md) | Storage, dependencies, XSS, or anything that touches user data / network |
| [performance.md](./performance.md) | Frame budget, rendering, DOM churn, or mobile behavior |
| [ui-input.md](./ui-input.md) | Keyboard, touch, keybinds, modals, or HUD updates |
| [git-commits.md](./git-commits.md) | Commit messages, trailers, and Git hygiene |

If guidance conflicts, prefer **this repo’s actual code**, then update these rule files to match (and your local `.cursorrules` if you use one).
