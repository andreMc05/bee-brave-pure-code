# Configuration Reference

All game constants are defined in `js/config.js`.

## Canvas & Display

```javascript
let canvas, ctx;           // Canvas element and 2D context
let w, h, center;          // Width, height, center point
// center = { x: w * 0.53, y: h * 0.55 }  // Slightly right and down of true center
```

## Hexagonal Grid

| Constant | Value | Description |
|----------|-------|-------------|
| `HEX_SIZE` | 26 | Radius of each hexagon cell in pixels |
| `CELL_MAX_HP` | 5 | Maximum health of a hive cell |
| `HONEY_DAMAGE_PER_HIT` | 2 | Honey lost when cell is hit |
| `HIVE_FIRE_COOLDOWN` | 2000 | Milliseconds between hive defensive shots |
| `HIVE_FIRE_RANGE` | 500 | Range of hive defensive fire |
| `HIVE_PROTECTION_DURATION` | 10000 | Invincibility duration at game start (10s) |

## Honey System

| Constant | Value | Description |
|----------|-------|-------------|
| `honeyPerCell` | 12 | Maximum honey storage per cell |
| `honeyToBuild` | 15 | Honey required to build new cell |

## Regular Bees

| Constant | Value | Description |
|----------|-------|-------------|
| `BEE_MAX_HP` | 3 | Health points per bee |
| `BEE_ATTACK_RANGE` | 200 | Distance to trigger attack mode (pixels) |
| `BEE_HUNT_SPEED_MULTIPLIER` | 1.8 | Speed boost when in hunt mode |
| `BEE_FLANK_ANGLE` | π/4 | Angle spread for flanking behavior |
| `BEE_ADDITION_COOLDOWN` | 1000 | Minimum ms between spawning new bees |

## Hunter Bees

| Constant | Value | Description |
|----------|-------|-------------|
| `HUNTER_BEE_HP` | 8 | Health points |
| `HUNTER_BEE_SHIELD` | 25 | Shield points (absorbed before HP) |
| `HUNTER_BEE_SPEED` | 2.5 | Movement speed |
| `HUNTER_BEE_SIZE` | 12 | Visual/collision radius |
| `HUNTER_FIRE_COOLDOWN` | 1500 | Milliseconds between laser shots |
| `HUNTER_LASER_SPEED` | 6 | Laser projectile speed |
| `HUNTER_LASER_DAMAGE` | 15 | Damage per laser hit |
| `HUNTER_SPAWN_DISTANCE` | 250 | Distance from player where dropship spawns |
| `IDLE_THRESHOLD` | 5000 | Time before hunter spawning when idle |

## Visual Effects

| Constant | Value | Description |
|----------|-------|-------------|
| `TRAIL_MAX_AGE` | 800 | Player trail particle lifetime (ms) |
| `TRAIL_SPACING` | 3 | Pixels between trail points |

## Screen Shake

```javascript
let screenShake = {
  intensity: 0,      // Current shake strength
  duration: 0,       // Remaining duration (ms)
  maxDuration: 0,    // Initial duration for decay calculation
  offsetX: 0,        // Current X offset applied to canvas
  offsetY: 0         // Current Y offset applied to canvas
};
```

### Shake Functions

```javascript
// Trigger new shake (stronger shakes override weaker ones)
triggerScreenShake(intensity, duration);

// Update shake state (call each frame)
updateScreenShake(dt);
```

### Typical Shake Values

| Event | Intensity | Duration |
|-------|-----------|----------|
| Bee explosion | 2 | 100ms |
| Hunter explosion | 8 | 300ms |
| Player hit | 4 | 150ms |
| Player death | 10 | 400ms |

## Hex Directions

Used for neighbor calculation in axial coordinates:

```javascript
const directions = [
  { q: 1, r: 0 },    // East
  { q: 1, r: -1 },   // Northeast
  { q: 0, r: -1 },   // Northwest
  { q: -1, r: 0 },   // West
  { q: -1, r: 1 },   // Southwest
  { q: 0, r: 1 }     // Southeast
];
```

## Core Functions in config.js

### `initCanvas()`
Initializes canvas element, context, and resize listener.

### `resize()`
Updates `w`, `h`, `center` on window resize. Also clamps player position to stay in bounds.
