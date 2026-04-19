# Performance refactor — Bee Brave

This document describes a focused performance pass on the main game loop and hot paths: lower allocation churn, fewer all-pairs checks, cheaper math where it mattered, and fewer DOM reads during play.

---

## Goals

- Reduce **Minor GC** pressure from short-lived objects created every frame (bullets, particles, explosions).
- Improve **frame stability** during heavy combat by avoiding **O(n²)** bullet–enemy scans where possible.
- Cut **layout-adjacent DOM work** out of the per-frame path (reads and redundant queries).
- Replace **`Math.hypot`** in tight loops with **squared distance** or a single **`Math.sqrt`** when a true length is required (e.g. normalization).

No new runtime dependencies; vanilla ES modules only.

---

## 1. Object pooling

### Generic pool (`js/object-pool.js`)

- **`ObjectPool`**: `acquire()` pops a free object or runs a factory; `release(obj)` returns it to the pool; helpers for bulk release.
- Used anywhere many similar objects are created and discarded in bursts.

### Bullets (`js/bullets.js`)

- Central **`bullets`** array plus **`spawnBullet(overrides)`**, **`releaseBullet`**, **`resetBullets`**, **`setBullets`**.
- Player shots, hive shots, and hunter lasers all go through **`spawnBullet`** so bullet objects are **reused** instead of allocating new literals every shot.
- **`resetCombat`** clears bullets by releasing instances back to the pool (no abandoned pooled objects tied to the old game).

**Why a separate module:** `cells.js` must spawn hive bullets without importing `combat.js` (which already imports `cells.js`). `bullets.js` breaks that cycle.

### Particles (`js/particles.js`)

- **`particlePool`**: explosion-style particles (bee / hunter / cell / user bursts).
- **`impactParticlePool`**: small impact sparks from **`spawnImpactParticles`**.
- **`impactEffectPool`**: short-lived rings / flashes stored in **`impactEffects`**.
- Particles carry **`fromImpact`** so teardown routes each instance to the correct pool.
- **`resetParticles`** releases all live instances to pools, then clears arrays.
- **`IMPACT_EFFECT_CONFIGS`** lives at module scope so **`spawnImpactParticles`** does not allocate a fresh config object on every hit.

### Bee explosions (`js/bees.js`)

- **`beeExplosionPool`** backs **`beeExplosions`** (not hunter or cell explosions in this pass).
- **`createBeeExplosion`** acquires from the pool; **`updateExplosions`** and **`resetBees`** release when an explosion ends or the game resets.

---

## 2. Spatial hash for bullet vs bees / hunters (`js/combat.js`, `js/spatial-hash.js`)

### Grid

- **`SpatialHash`** with fixed **cell size** (72 px for bees/hunters vs player bullets).
- **`forEachNearby(x, y, callback, range)`** visits buckets in a square of cells around the query point. Player bullets use **`range = 2`** (5×5 cells) so interactions up to roughly two cells away are not missed (important for larger hunter hit radii).

### `updateBullets` flow

1. **Clear** the grid, **insert** every live bee and hunter once.
2. For each bullet: move, distance check, hive/laser vs player (unchanged logic, but see math below).
3. For **player** bullets not inside a hive hex: after **`getCellAtPoint`** handling (unchanged), **bee and hunter** hits use **`forEachNearby`** on the bullet position instead of scanning **`bees.length`** and **`hunterBees.length`** every time.

### Removal semantics

- **`bullets = bullets.filter(...)`** was removed (that allocated a **new array every frame**).
- Bullets are removed with **swap-and-pop** plus **`releaseBullet`** so order does not need to be stable for drawing.

**Still O(n) work in some paths:** bullets that hit a **cell** still iterate bees inside that hex for honey/cell rules; that path was not spatialized (different geometry).

---

## 3. Bee update loop (`js/bees.js`, `js/game.js`)

### Hunt coordination (fewer allocations)

- Replaced per-bee **`bees.filter(...)`** used for hunt counts with **`countBeesInState('hunt')`** and **`countHuntBeesUpTo(beeIndex)`** (numeric loops, no temporary arrays).
- Behavior matches the previous “prefix count of hunt bees” logic for **`spreadAngle` / `hunterIndex`**.

### API change

- **`updateBees(dt, now, preferHighPct, maxColonySize, userIcon)`** — **`maxColonySize`** is no longer read from the DOM inside **`bees.js`**; **`game.js`** passes it so bee spawning stays correct without **`document.getElementById`** in the bee module each frame.

### Math

- **Attack range:** compare **`userDistanceSq`** to **`BEE_ATTACK_RANGE * BEE_ATTACK_RANGE`** before entering attack logic; use **`Math.sqrt`** only when a real distance is needed (e.g. hunt flank distance).
- **Hunter fire range:** **`distSq < 90000`** instead of **`dist < 300`** (same threshold, no hypot until movement needs **`dist`**).
- **Movement toward target:** **`Math.sqrt(dx*dx + dy*dy)`** once per hunter/bee step where normalization is required (replacing **`Math.hypot`** in those paths).

### Hunter lasers

- **`spawnBullet({ ..., isHunterLaser: true, damage: ... })`** instead of **`bullets.push({...})`**.

---

## 4. Hive / cells (`js/cells.js`)

- Hive firing uses **squared distance** to the player vs **`HIVE_FIRE_RANGE`** before aiming.
- **`spawnBullet`** for hive projectiles (same pool as combat).
- **`isPointInHex`**: point-in-hex uses **squared distance** vs **`hexSize * hexSize`** (circle bound; same as prior hypot-based test for this check).

---

## 5. DOM and UI (`js/game.js`, `js/ui.js`)

- **`game.js`** caches **`#priorityPercent`** and **`#maxColonySize`** after **`initUI()`** and reads **`.value`** from those references inside **`update()`** instead of calling **`getElementById`** every frame.
- **`updateGameUI`** in **`ui.js`** was already using a **shield / health / score / colony** cache to avoid redundant DOM writes; that behavior is unchanged.

---

## File map

| File | Role |
|------|------|
| `js/object-pool.js` | Generic `ObjectPool` |
| `js/spatial-hash.js` | `SpatialHash` grid + `forEachNearby` |
| `js/bullets.js` | Bullet list + pool + `spawnBullet` / `resetBullets` |
| `js/combat.js` | Spatial bullet hits, swap-remove, re-exports bullet API |
| `js/particles.js` | Pooled particles + impact effects + `fromImpact` |
| `js/bees.js` | Pooled bee explosions, hunt counters, `spawnBullet`, `updateBees` signature |
| `js/cells.js` | `spawnBullet`, range / hex distance tweaks |
| `js/game.js` | Cached DOM refs, passes `maxColonySize` into `updateBees` |

---

## Not in scope (possible follow-ups)

- **`updateWeaponEffects`** (freeze / electric): still iterate bombs × all bees/hunters.
- **Counter-missiles** in **`combat.js`**: still scan bees/hunters for targeting and hits.
- **`draw.js`**: particle batching still builds per-frame structures; separate optimization.
- **Hunter / cell explosions**: not pooled in this pass.

---

## Verification checklist (manual)

- Player shooting, hive bullets, hunter lasers all visible and damaging correctly.
- Bee deaths and **bee** explosion visuals/audio still trigger.
- Restart / main menu / settings exit clears state without leaks or stale bullets on next run.
- Large colony + many hunters: smoother frames under load (profile in Chrome Performance if needed).

---

*Last updated to match the codebase performance pass described above.*
