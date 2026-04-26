# AI workflow review — Bee Brave

**Purpose:** Single reference for how this repo uses coding agents, what concepts apply, how context and tokens are kept efficient, and a candid assessment of that setup.

**Related files:** [`AGENT-INDEX.md`](../AGENT-INDEX.md) (session router; may be gitignored locally), [`.cursorrules`](../.cursorrules) (if present, often gitignored), [`dev-knowledge/rules/`](../dev-knowledge/rules/README.md), [`resume-ai-tools-brief.md`](../resume-ai-tools-brief.md).

---

## 1. AI tools and concepts

### Tools (as reflected in the repo)

- **Cursor** (or similar IDE coding agent): chat, edits, `@` file references, project rules.
- **Git + hooks:** [`.githooks/commit-msg`](../.githooks/commit-msg) and [`dev-knowledge/rules/git-commits.md`](../dev-knowledge/rules/git-commits.md) strip or discourage noisy “Made-with” style footers so agent-assisted commits stay readable.

### Concepts in use

| Concept | Where it shows up |
|--------|-------------------|
| **Session router** | `AGENT-INDEX.md`: bootstrap, read order, task → files, search map, agent norms. |
| **Tiered context** | Index “Context & token strategy”: index → `.cursorrules` → **one** `dev-knowledge/rules/*.md` → deep `dev-knowledge/*.md` → **regions** of `js/*.js`. |
| **Minimal bootstrap** | One pasteable block when tokens are tight: stack, entry, module map, rules path, `rg`/semantic discipline, doc-vs-code rule. |
| **Task → file routing** | Index §3: user intent → smallest read set (often one or two files). |
| **Search-first navigation** | Index §4 + norms: grep symbols and DOM ids; semantic “where is X?” before opening huge files (especially `draw.js`). |
| **Authority ordering** | Code + `.cursorrules` win over stale prose; update docs when practical. |
| **Agent norms** | Execute (run checks), match scope, movement vs timer invariants, required citation style. |
| **Router vs slices** | Index §6: router = this index; slices = `dev-knowledge/rules/` by task type. |
| **Resume / ownership framing** | `resume-ai-tools-brief.md`: where AI helped vs what the human still owns. |

**Note:** In-game “bee AI” (state machine, forage/hunt, etc.) is **gameplay logic**, not LLM tooling. Keep that distinction when describing the project externally.

---

## 2. Efficiency: chats, guidance, token use

### From `AGENT-INDEX.md`

1. **Predictable session start** — Attach or `@` the index so routing stays consistent across chats.
2. **Tight-token path** — Full file *or* “Minimal bootstrap” plus one row from §3.
3. **Anti-patterns called out** — Do not read entire large modules unless the task requires it; prefer search hit → read a function region.
4. **Concrete grep seeds** — e.g. `requestAnimationFrame`, `HEX_SIZE`, `updateBees`, so search is symbol-driven.
5. **Thin → deep read order** — Numbered path avoids loading deep docs before the task slice is known.
6. **One rules slice per task** — Caps how much prescriptive prose loads at once.
7. **Norms on one screen** — Execute, scope, dt/timers, citations; fewer corrective follow-ups.

### From the rest of the repo

- **[`dev-knowledge/rules/`](../dev-knowledge/rules/README.md)** — Split by architecture, code-style, security, performance, ui-input, git-commits.
- **Root [`README.md`](../README.md)** — “For AI / contributors” entry points to rules and deep docs.
- **Optional local `.cursorrules`** — Always-on invariants; index points agents there for gameplay and patterns.

**Summary:** Context is treated as a **budget**: router first, one slice, then targeted code—not whole-repo exploration by default.

---

## 3. Assessment (scoring)

Scores reflect **what the repository (and `AGENT-INDEX.md`) demonstrate**, not private prompting habits or every session.

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Context / workflow design** | **9/10** | Full router: bootstrap tiers, task matrix, search map, authority rules, agent norms in a short doc. Strong agent ergonomics. |
| **Token awareness** | **8.5–9/10** | Explicit layers, minimal paste block, one rules file, region reads, warnings about large files. |
| **Overall AI knowledge & usage (inferred)** | **8–9/10** | Artifacts indicate mature practice. Live verification, prompt quality, and consistency are not fully observable from git alone. |

**Caveat:** If `AGENT-INDEX.md` remains [gitignored](../.gitignore), clones without your local copy do not get the router; consider a tracked excerpt in `dev-knowledge/` if collaborators or cloud agents should inherit the same workflow.

---

## 4. One-line positioning (optional)

*This repo uses coding agents with a deliberate router-and-slices setup—tiered context, search-first navigation, and repo-specific norms—so implementation stays scoped and token-efficient while code remains the source of truth.*

---

*Document generated from an internal workflow review; revise dates or scores as your practice evolves.*
