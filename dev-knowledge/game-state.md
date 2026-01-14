# Game State Management

## Game Phases

### 1. Start Screen
- `gameStarted = false`
- `gameOver = false`
- Start screen UI visible
- Settings can be adjusted
- Press "Start Game" to begin

### 2. Playing
- `gameStarted = true`
- `gameOver = false`
- Main game loop running
- All systems active

### 3. Game Over
- `gameStarted = true`
- `gameOver = true`
- Game over screen visible
- Can restart or return to menu

## Key State Variables

### Core Game State
```javascript
let gameStarted = false;     // Has game begun
let gameOver = false;        // Has player lost
let gameStartTime = 0;       // Timestamp of game start
let lastFrameTime = 0;       // For delta time calculation
```

### Score & Progress
```javascript
let score = 0;               // Current score
let destroyedBees = 0;       // Bees destroyed count
let hiveHoney = 0;           // Total honey collected
```

### Protection Timer
```javascript
const HIVE_PROTECTION_DURATION = 10000;  // 10 seconds
// Hive is invulnerable for this duration after game start
// Checked via: performance.now() - gameStartTime < HIVE_PROTECTION_DURATION
```

## Entity State

### Player (`userIcon`)
```javascript
userIcon = {
  x, y: number,              // Position
  radius: number,            // Collision radius
  angle: number,             // Facing direction (radians)
  health: number,            // Current health (0-100)
  shield: number,            // Current shield amount
  maxShield: number,         // Maximum shield
  shieldRegenDelay: number,  // Cooldown before shield regen
  invincibilityTimer: number // Remaining invincibility (ms)
}
// Set to null when player dies
```

### Bees Array
```javascript
bees = [
  { /* bee object - see bees.md */ },
  ...
]
```

### Hunter Bees Array
```javascript
hunterBees = [
  { /* hunter bee object - see bees.md */ },
  ...
]
```

### Bullets Array
```javascript
bullets = [
  {
    x, y: number,            // Position
    vx, vy: number,          // Velocity
    angle: number,           // Direction
    maxDistance: number,     // Maximum travel distance
    distanceTraveled: number,// Current distance traveled
    radius: number,          // Size
    isHunterLaser: boolean,  // True if fired by hunter
    isHiveBullet: boolean,   // True if defensive hive shot
    damage: number           // Damage dealt
  },
  ...
]
```

### Cells Array
```javascript
cells = [
  {
    q, r: number,            // Axial hex coordinates
    buildProg: number,       // Build progress (0-1)
    honey: number,           // Honey amount stored
    hp: number,              // Current health
    maxHp: number            // Maximum health (CELL_MAX_HP)
  },
  ...
]
```

### Resource Spots
```javascript
resourceSpots = [
  {
    x, y: number,            // Position
    amount: number,          // Current resource amount
    max: number              // Maximum capacity
  },
  ...
]
```

## Special Weapon State

### Freeze Bombs
```javascript
freezeBombs = [
  {
    x, y: number,
    radius: number,
    duration: number,        // Remaining duration
    maxDuration: number
  },
  ...
]
```

### Electric Blasts
```javascript
electricBlasts = [
  {
    x, y: number,
    radius: number,
    duration: number,
    maxDuration: number
  },
  ...
]
```

## UI State

### Settings (from HTML inputs)
- `#beeCount` - Initial bee count
- `#maxColonySize` - Maximum bees allowed
- `#resourceCount` - Number of resource spots
- `#resourceAmount` - Resources per spot
- `#preferHighPct` - Toggle for resource preference

### Screen Shake
```javascript
screenShake = {
  intensity: number,
  duration: number,
  offsetX: number,
  offsetY: number
}
```

## Initialization Flow

```javascript
function startGame() {
  // Reset state
  gameStarted = true;
  gameOver = false;
  gameStartTime = performance.now();
  score = 0;
  destroyedBees = 0;
  
  // Initialize entities
  createCells();           // Build hive
  createResources();       // Place resource spots
  createBees(beeCount);    // Spawn initial bees
  initUser();              // Create player
  
  // Clear arrays
  bullets = [];
  hunterBees = [];
  dropship = null;
  
  // Start game loop
  requestAnimationFrame(gameLoop);
}
```

## Reset Functions

Each system has a reset function called on game restart:
- `resetBees()` - Clears bees, hunters, dropship, explosions
- `resetCells()` - Clears cell array
- `resetResources()` - Clears resource spots
- `resetUser()` - Resets player state
- `resetCombat()` - Clears bullets, special weapons

## Time Management

Delta time (`dt`) is calculated each frame:
```javascript
function gameLoop(timestamp) {
  const dt = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  // dt is in milliseconds
  // Used for frame-rate independent updates
}
```

All movement/timers multiply by `dt * 0.06` to normalize for ~60fps:
```javascript
// Example: moving at speed units per frame at 60fps
entity.x += velocity * (dt * 0.06);
```
