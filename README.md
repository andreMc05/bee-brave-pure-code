# Bee Brave (pure code)

Canvas HTML5 game: pure **ES modules**, no framework, no bundler.
<img width="1652" height="727" alt="Screen Shot 2026-04-24 at 9 43 33 AM" src="https://github.com/user-attachments/assets/bf6223cd-34f1-40aa-a592-5012f082408c" />

## Screen Shots
<img width="50%" height="50%" alt="Screen Shot 2026-04-24" src="https://github.com/user-attachments/assets/af82e77f-a743-4e1a-aba1-c00228b0b124" />
<img width="50%" height="50%" alt="Screen Shot 2026-04-24" src="https://github.com/user-attachments/assets/6611a209-9110-448d-a1ab-5b6987f6adec" />
<img width="50%" height="50%" alt="Screen Shot 2026-04-24" src="https://github.com/user-attachments/assets/6aa26a7b-43b8-48ef-a840-e46173e501b9" />
<img width="50%" height="50%" alt="Screen Shot 2026-04-24" src="https://github.com/user-attachments/assets/f8868086-408e-4eea-b487-891dc4f832d6" />


## About the game

Bee Brave is a top-down arcade shooter set in a hexagonal hive world. You pilot a lone defender bee protecting your colony's honeycomb from waves of invading bees and elite hunter bees. Your bees collect honey from scattered resource spots around the map, building new hexagonal cells to grow the hive — but enemy bees are constantly raiding those same resources and attacking your cells. Destroy them all before they strip the hive bare.

The game ends when all of your hive cells are destroyed. Your score is based on enemies eliminated and cells defended. A high score is saved locally.

## How to play

### Goal
Keep your hive alive. Shoot down enemy bees and hunter bees before they drain your resources and demolish your honeycomb cells.

### Movement
| Key | Action |
|-----|--------|
| `W` / `↑` | Move up |
| `S` / `↓` | Move down |
| `A` / `←` | Move left |
| `D` / `→` | Move right |

### Combat
| Key | Action |
|-----|--------|
| `Space` | Fire primary weapon |
| `V` | Fire special weapon (Freeze Bomb, Electric Blast, or Warp) |
| `Shift` | Cycle through special weapons |
| `B` | Deploy heavy ordnance (Singularity, Railgun, or Shockwave — picked up as drops) |
| `C` | Activate defensive tech (picked up as drops) |

- **Special weapons** start with limited charges (Freeze Bomb ×3, Electric Blast ×3, Warp ×2).
- **Heavy ordnance** drops appear every 30 seconds — fly over one to pick it up (you can only carry one at a time).
- **Defensive tech** drops work the same way: pick up and activate when needed.

### Enemy types
- **Worker bees** — swarm the map, harvest resource spots, and chip away at hive cells.
- **Hunter bees** — heavily shielded elites that fire lasers. They require sustained fire to take down.
- **Dropship** — periodically delivers reinforcements; destroy it before it deploys.

### Tips
- Prioritize hunters — their lasers deal serious damage.
- Watch the resource counter; once all spots are depleted, the enemy wave intensifies.
- The hive fires back automatically when enemies enter range, giving you breathing room.
- Key bindings can be remapped in-game.

## For AI / contributors

- **In-repo rules:** [`dev-knowledge/rules/`](dev-knowledge/rules/README.md) (architecture, code style, security, performance, UI/input, Git commits).
- **Deep docs:** [`dev-knowledge/README.md`](dev-knowledge/README.md)
- **Optional local files (gitignored, not on remote):** add your own repo-root `AGENT-INDEX.md` (session router / search map) and `.cursorrules` (Cursor project rules) if you use them; see `.gitignore`.

## Run

Open `index.html` in a browser (local server recommended if the browser blocks modules from `file://`).
