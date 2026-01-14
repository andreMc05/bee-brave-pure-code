# Combat System

## Overview

Combat in Bee Brave involves:
- Player shooting at bees
- Bees attacking the player
- Hunter bees firing lasers at player
- Special weapons (freeze, electric, warp)
- Hive defense system

## Bullet System (`js/combat.js`)

### Bullet Types

| Type | Source | Color | Damage | Speed |
|------|--------|-------|--------|-------|
| Player bullet | User shooting | Red | Standard | Fast |
| Hunter laser | Hunter bees | Pink/Red | `HUNTER_LASER_DAMAGE` | `HUNTER_LASER_SPEED` |
| Hive bullet | Hive defense | Yellow/Orange | Hive damage | Medium |

### Bullet Object Structure
```javascript
{
  x, y: number,              // Position
  vx, vy: number,            // Velocity components
  angle: number,             // Direction (radians)
  maxDistance: number,       // Maximum travel range
  distanceTraveled: number,  // Current distance traveled
  radius: number,            // Collision/visual radius
  isHunterLaser: boolean,    // From hunter bee
  isHiveBullet: boolean,     // From hive defense
  damage: number             // Damage dealt on hit
}
```

### Bullet Update Logic
```javascript
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    
    // Move bullet
    bullet.x += bullet.vx * (dt * 0.06);
    bullet.y += bullet.vy * (dt * 0.06);
    bullet.distanceTraveled += Math.hypot(bullet.vx, bullet.vy) * (dt * 0.06);
    
    // Check collision based on bullet type
    if (bullet.isHunterLaser) {
      // Check hit on player
      checkPlayerHit(bullet);
    } else if (!bullet.isHiveBullet) {
      // Player bullet - check hit on bees
      checkBeeHit(bullet);
      checkHunterHit(bullet);
    }
    
    // Remove if traveled max distance or out of bounds
    if (bullet.distanceTraveled >= bullet.maxDistance || isOutOfBounds(bullet)) {
      bullets.splice(i, 1);
    }
  }
}
```

## Player Combat

### Shooting
- Player aims toward mouse cursor
- Click to fire
- Bullets travel in aimed direction
- Can hit regular bees and hunter bees

### Taking Damage
1. Shield absorbs damage first
2. If shield depleted, health takes damage
3. Shield has regen delay after taking hit
4. At 0 health, player explodes and game over

### Invincibility Frames
After respawning or certain events:
```javascript
userIcon.invincibilityTimer = 3000;  // 3 seconds
// During this time, player cannot take damage
```

## Bee Combat

### Regular Bee Attacks
- Bees in `attack` or `hunt` state will chase player
- Contact with player deals damage
- Bees prioritize player when in range (`BEE_ATTACK_RANGE`)

### Hunter Bee Attacks
```javascript
// Hunter fires when:
// - Player is within 300px
// - Fire cooldown is 0
// - Hunter is not frozen

if (hunter.fireCooldown <= 0 && dist < 300 && hunter.frozen <= 0) {
  // Fire laser with slight inaccuracy
  const inaccuracy = (Math.random() - 0.5) * 0.15;
  const fireAngle = hunter.angle + inaccuracy;
  
  bullets.push({
    x: hunter.x + Math.cos(hunter.angle) * hunter.size,
    y: hunter.y + Math.sin(hunter.angle) * hunter.size,
    vx: Math.cos(fireAngle) * HUNTER_LASER_SPEED,
    vy: Math.sin(fireAngle) * HUNTER_LASER_SPEED,
    angle: fireAngle,
    maxDistance: 400,
    distanceTraveled: 0,
    radius: 4,
    isHunterLaser: true,
    damage: HUNTER_LASER_DAMAGE
  });
  hunter.fireCooldown = HUNTER_FIRE_COOLDOWN;
}
```

## Special Weapons

### Freeze Bomb
- Area of effect weapon
- Slows all bees within radius
- Sets `bee.frozen` timer on affected bees
- Frozen bees move at 10-20% speed
- Visual: Blue circle with ice particles

### Electric Blast
- Area of effect damage
- Damages all enemies in radius
- Visual: Yellow ring with lightning bolts

### Warp
- Teleportation ability
- Instantly moves player to target location
- Brief invincibility after warp

## Damage Calculations

### Player Damage to Bees
```javascript
// Standard bullet damage
bee.hp -= bulletDamage;

// If HP <= 0
if (bee.hp <= 0) {
  createBeeExplosion(bee.x, bee.y);
  bees.splice(index, 1);
  destroyedBees++;
  score += BEE_KILL_SCORE;
}
```

### Player Damage to Hunters
```javascript
// Damage goes to shield first
if (hunter.shield > 0) {
  hunter.shield = Math.max(0, hunter.shield - damage);
} else {
  hunter.hp -= damage;
}

// If HP <= 0
if (hunter.hp <= 0) {
  createHunterExplosion(hunter.x, hunter.y);
  hunterBees.splice(index, 1);
  destroyedBees += 5;  // Worth more points
  score += HUNTER_KILL_SCORE;
}
```

### Damage to Player
```javascript
function damagePlayer(amount) {
  if (userIcon.invincibilityTimer > 0) return;
  
  // Shield absorbs first
  if (userIcon.shield > 0) {
    const shieldDamage = Math.min(userIcon.shield, amount);
    userIcon.shield -= shieldDamage;
    amount -= shieldDamage;
    userIcon.shieldRegenDelay = SHIELD_REGEN_DELAY;
  }
  
  // Remaining damage to health
  if (amount > 0) {
    userIcon.health -= amount;
    triggerScreenShake(4, 150);
  }
  
  // Check death
  if (userIcon.health <= 0) {
    createUserExplosion();
    userIcon = null;
    gameOver = true;
  }
}
```

## Collision Detection

Uses distance-based circle collision:
```javascript
function checkCollision(obj1, obj2, radius1, radius2) {
  const dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y);
  return dist < radius1 + radius2;
}
```

## Hive Defense System

When enemies get close to hive:
- Hive can fire defensive bullets (yellow)
- Targets nearest threat
- Limited fire rate
- `isHiveBullet = true` to identify

## Screen Shake on Impacts

Different intensities for different events:
```javascript
triggerScreenShake(2, 100);   // Bee explosion (small)
triggerScreenShake(8, 300);   // Hunter explosion (large)
triggerScreenShake(4, 150);   // Player hit
triggerScreenShake(10, 400);  // Player death
```

## Related Config Constants

```javascript
// Player
const PLAYER_BULLET_SPEED = ?;
const PLAYER_BULLET_DAMAGE = ?;
const SHIELD_REGEN_DELAY = ?;
const SHIELD_REGEN_RATE = ?;

// Hunter
const HUNTER_LASER_SPEED = ?;
const HUNTER_LASER_DAMAGE = ?;
const HUNTER_FIRE_COOLDOWN = ?;

// Scoring
const BEE_KILL_SCORE = ?;
const HUNTER_KILL_SCORE = ?;
```
