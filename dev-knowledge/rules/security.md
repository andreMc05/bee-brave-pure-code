# Security rules (Bee Brave)

Context: static **HTML + ES modules** game, no server in-repo, no auth. Risks are mostly **client-side abuse**, **XSS if content ever becomes dynamic**, and **supply chain / hosting**.

## Secrets and credentials

- **Never** embed API keys, tokens, or private endpoints in client-side JS or HTML committed to the repo.
- If analytics or backends are added later, load config via **environment-specific build** or **server-side injection**—not hard-coded secrets.

## XSS and DOM

- Prefer **`textContent`** for displaying scores, labels, and dynamic numbers. Avoid **`innerHTML`** with interpolated user or network data.
- If rich HTML is ever required, use a vetted sanitizer or framework escaping; default stance here is **no raw HTML injection**.

## localStorage

- Used for **high scores** and **keybinds** (non-sensitive preferences). Treat as **tamperable**; do not rely on it for anti-cheat or authorization.
- **`JSON.parse`**: wrap in `try/catch` and validate shape before use; reject unknown keys to avoid prototype pollution patterns (only accept plain data shapes you define).
- Avoid storing **PII** in `localStorage` for this product class.

## Network and assets

- Load scripts and assets from **trusted origins** only (same host or known CDN). Subresource Integrity (SRI) is optional but recommended if using third-party CDNs.
- If adding `fetch` to remote APIs later: enforce **HTTPS**, validate responses, and do not pass raw strings into `eval` or `new Function`.

## Dependencies

- Prefer **few dependencies**; each npm package expands supply-chain risk. If adding deps, pin versions and audit periodically.

## Content Security Policy (future)

- If deploying with **CSP**, avoid inline handlers where possible; modules already help. Plan `script-src` and `img-src` for canvas assets.

## Reporting

- If you find a serious vulnerability, fix forward in code and document the threat model change in the PR/commit message briefly.
