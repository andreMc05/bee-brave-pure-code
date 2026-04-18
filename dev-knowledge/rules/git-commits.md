# Git commits (Bee Brave)

## No tool attribution in commit messages

- **Do not** append lines such as `Made-with: Cursor` to commit bodies.
- **Do not** pass `git commit --trailer "Made-with: Cursor"` (or similar) unless the repository owner explicitly asks for that trailer.

These lines add noise to `git log`, complicate cherry-picks and archaeology, and are not a substitute for real commit context.

## What to do instead

- Use a **clear subject line** (imperative mood, ~72 characters or less).
- Add a **body** when the change needs context: what changed, why, and any follow-ups or exclusions (e.g. intentionally untracked files).

## If a trailer keeps appearing

- **Cursor / IDE:** Check Git-related settings for options that append sign-off, trailers, or “generated with” footers; turn them off for this repo if possible.
- **Global git hooks:** Inspect `~/.git-templates/hooks/` or `core.hooksPath` if unexpected text is injected on every commit.

## Repo hook (strip `Made-with: Cursor`)

This repository includes **`.githooks/commit-msg`**, which removes a trailing `Made-with: Cursor` line after the message is composed (so it still works if the IDE injects that line).

Enable once per clone:

```bash
git config core.hooksPath .githooks
```

If `core.hooksPath` is already set globally, either point it here for this repo only (command above from the repo root) or merge hook logic into your existing hooks.

## Agents

When creating commits for this project, use `git commit -m` / `-F` with only the message the human asked for—**no extra footers** unless requested.
