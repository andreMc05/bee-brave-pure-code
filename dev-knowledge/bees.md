# Bee System

## Overview

The game has two types of bees:
1. **Regular Bees** - Friendly bees that forage resources and defend the hive
2. **Hunter Bees** - Enemy bees that attack the player

## Regular Bees (`js/bees.js`)

### Bee Object Structure

```javascript
{
  x, y: number,              // Position
  state: string,             // 'forage', 'return', 'idle', 'attack', 'hunt'
  speed: number,             // Base movement speed (1.7-2.2)
  cargo: number,             // Resources being carried
  target: {x, y} | null,     // Current movement target
  resourceSpot: object,      // Assigned resource spot
  wobble: number,            // Wobble animation phase
  wobbleSpeed: number,       // Wobble frequency (3-5)
  hp: number,                // Current health
  maxHp: number,             // Maximum health (BEE_MAX_HP from config)
  attackCooldown: number,    // Cooldown before returning to forage
  frozen: number,            // Freeze duration remaining (ms)
  frozenSpeed: number,       // Speed multiplier when frozen
  
  // Animation properties (added for improved animations)
  wingPhase: number,         // Wing flap animation phase
  wingSpeed: number,         // Wing flap speed (25-35)
  bobPhase: number,          // Vertical bobbing phase
  bobSpeed: number,          // Bobbing speed (2-3)
  stripeOffset: number,      // Visual stripe variation (0-0.2)
  size: number               // Size multiplier (0.9-1.1)
}
```

### Bee States

| State | Description | Behavior |
|-------|-------------|----------|
| `forage` | Looking for or traveling to resources | Moves to assigned resourceSpot |
| `return` | Carrying resources back to hive | Moves to center, deposits cargo |
| `idle` | No resources available | Wanders near hive center |
| `attack` | Player is nearby | Chases player temporarily |
| `hunt` | All resources depleted | Aggressively hunts player |

### State Transitions

```
forage ──(found resource)──> collect ──(has cargo)──> return
   │                                                     │
   │ (resource depleted)                                 │
   ▼                                                     ▼
 idle <─────────────────────────────────────────── (deposit)
   │
   │ (all resources depleted globally)
   ▼
 hunt ──────(attacks player)─────────────────────────────>
```

### Key Functions

- `makeBee()` - Creates a new bee with randomized properties
- `createBees(count)` - Initializes bee array with count bees
- `updateBees(dt, now, preferHighPct)` - Main bee update loop
- `createBeeExplosion(x, y)` - Creates explosion effect when bee dies

### Animation System

Bees have animated features:
- **Wings**: Flap rapidly, speed varies by state (faster when hunting)
- **Body bobbing**: Subtle up/down movement while flying
- **State-based colors**: Yellow (forage), orange (attack), red (hunt), blue (frozen)
- **Pollen particles**: Trail effect when carrying cargo

Animation updates happen in `updateBees()`:
```javascript
bee.wingPhase += bee.wingSpeed * dt * 0.001 * animSpeedMultiplier * frozenMultiplier;
bee.bobPhase += bee.bobSpeed * dt * 0.001 * frozenMultiplier;
```

## Hunter Bees

### Hunter Bee Object Structure

```javascript
{
  x, y: number,              // Position
  hp: number,                // Health (HUNTER_BEE_HP)
  maxHp: number,             // Max health
  shield: number,            // Shield amount (HUNTER_BEE_SHIELD)
  maxShield: number,         // Max shield
  speed: number,             // Movement speed (HUNTER_BEE_SPEED)
  size: number,              // Visual size (HUNTER_BEE_SIZE)
  fireCooldown: number,      // Time until can fire again
  angle: number,             // Facing angle (radians)
  wobble: number,            // Movement wobble phase
  wobbleSpeed: number,       // Wobble frequency
  frozen: number,            // Freeze duration
  
  // Animation properties
  wingPhase: number,         // Mechanical wing animation
  wingSpeed: number,         // Wing animation speed
  thrusterPhase: number      // Thruster flame animation
}
```

### Hunter Behavior

1. Spawned via dropship at distance from player
2. Approaches player to optimal range (~120px)
3. Fires lasers at player with slight inaccuracy
4. Maintains distance - retreats if too close

### Dropship System

```javascript
dropship = {
  x, y: number,              // Current position
  targetX, targetY: number,  // Deployment location
  phase: string,             // 'arriving', 'deploying', 'leaving'
  deployTimer: number,       // Countdown during deploy phase
  angle: number              // Facing angle
}
```

Phases:
1. `arriving` - Moves toward target position
2. `deploying` - Hovers and spawns 2 hunter bees
3. `leaving` - Exits the screen

## Explosion System

Three types of explosions stored in arrays:
- `beeExplosions[]` - Small yellow explosions for regular bees
- `hunterExplosions[]` - Large orange explosions for hunters
- `cellExplosions[]` - Honeycomb-debris explosions for cells

Explosion object:
```javascript
{
  x, y: number,
  duration: number,      // Time remaining (ms)
  maxDuration: number,   // Total duration
  radius: number         // Current visual radius
}
```

## Related Config Constants

From `js/config.js`:
- `BEE_MAX_HP` - Regular bee health
- `BEE_ATTACK_RANGE` - Distance to trigger attack state
- `BEE_HUNT_SPEED_MULTIPLIER` - Speed boost when hunting
- `BEE_ADDITION_COOLDOWN` - Time between spawning new bees
- `HUNTER_BEE_HP`, `HUNTER_BEE_SHIELD`, `HUNTER_BEE_SPEED`, `HUNTER_BEE_SIZE`
- `HUNTER_SPAWN_DISTANCE` - How far from player dropship spawns
- `HUNTER_FIRE_COOLDOWN` - Time between hunter shots
- `HUNTER_LASER_SPEED`, `HUNTER_LASER_DAMAGE`
