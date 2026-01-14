# Rendering System

## Overview

All rendering is done in `js/draw.js` using HTML5 Canvas 2D context. The main `draw()` function is called once per frame from the game loop.

## Draw Order (Back to Front)

```javascript
function draw() {
  ctx.clearRect(0, 0, w, h);
  
  // 0. Parallax background (always drawn, even on menus)
  drawParallaxBackground(now);
  
  // Apply screen shake
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);

  // 1. Background glow (radial gradient from center)
  drawBackgroundGlow();
  
  // 2. Resources (blue circles)
  drawResources();
  
  // 3. Hive cells (hexagons)
  drawCells();
  
  // 4. Hive protection shield (if active)
  drawHiveProtection();
  
  // 5. Bees (regular bees with full animation)
  drawBees();
  
  // 6. Dropship and hunter bees
  drawDropship();
  drawHunterBees();
  
  // 7. Explosions (all types)
  drawExplosions();
  
  // 8. Bullets
  drawBullets();
  
  // 9. Weapon effects (freeze bombs, electric blasts)
  drawWeaponEffects();
  
  // 10. Spawn indicator
  drawSpawnIndicator();
  
  // 11. User explosion (if dead)
  drawUserExplosion();
  
  // 12. User trail
  drawUserTrail();
  
  // 13. User icon (player character)
  drawUserIcon();

  ctx.restore();  // Remove screen shake offset
}
```

## Key Drawing Functions

### `drawHex(x, y, size, progress, honeyFill, cellHp, cellMaxHp)`
Draws a hexagonal cell with:
- Build animation (progress 0-1)
- Honey fill level (golden fill from bottom)
- Damage cracks when HP < max
- Color changes based on damage

### `drawBees()` (Improved Animation System)
Each bee is drawn with:
- **Shadow** - Ellipse below bee for depth
- **Animated wings** - Flap based on `wingPhase`, with motion blur for fast states
- **Detailed body** - Abdomen with stripes, thorax, head
- **Eyes** - Black with white highlights
- **Antennae** - Curved, wave with movement
- **Stinger** - Extended when attacking/hunting
- **Pollen baskets** - Visible when carrying cargo
- **Trailing particles** - When carrying cargo
- **Health bar** - Only shown when damaged
- **State glow** - Red glow for hunt/attack states

### `drawHunterBees()` (Improved Animation System)
Mechanical/robotic appearance with:
- **Shadow** - Ground shadow for depth
- **Shield effect** - Pulsing radial gradient when active
- **Mechanical wings** - Angular, animated extension
- **Thrusters** - Flame animation on back
- **Armored body** - Curved body with plate details
- **Cockpit** - Dark ellipse head section
- **Glowing eyes** - Pulsing red eyes with glow effect
- **Weapon mount** - Rectangle extending from front
- **Health/Shield bars** - Above the hunter

### `drawExplosions()`
Three explosion types with:
- Radial gradients (inner bright, outer fading)
- Particle effects spiraling outward
- Progress-based sizing and alpha

### `drawUserIcon()`
Player character with:
- Health bar (hidden when shields active and health full)
- Invincibility effect (golden rings)
- Shield ring indicator
- Directional body (faces movement direction)
- Color changes based on health

## Screen Shake System

```javascript
screenShake = {
  intensity: number,    // Current shake strength
  duration: number,     // Remaining duration (ms)
  offsetX: number,      // Current X offset
  offsetY: number       // Current Y offset
}

function triggerScreenShake(intensity, duration) {
  screenShake.intensity = intensity;
  screenShake.duration = duration;
}
```

Applied at start of draw, restored at end.

## Color Palette

### Bees (Regular)
- Normal: `#ffc107` (golden yellow)
- Attack: `#ff8c00` (orange)
- Hunt: `#ff4444` (red)
- Frozen: `#a0d0ff` (light blue)
- Stripes: `#3d2914` (dark brown)

### Hunter Bees
- Body: RGB based on health (red when damaged)
- Eyes: `#ff3333` (red glow)
- Frozen: `rgb(150, 180, 255)` (blue tint)

### Hive Cells
- Border: `rgba(255,235,179,0.8)` (light amber)
- Empty: `rgba(29,25,12,0.6)` (dark)
- Honey: `#ffb300` (golden)
- Full: `#ffb300` solid fill

### Resources
- Fill: `rgba(130, 177, 255, alpha)` (blue, alpha by amount)
- Stroke: `rgba(130,177,255,0.8)` or 0.25 if depleted

### User
- Body: `rgba(255, 170, 120, 0.95)` (peach)
- Damaged: Shifts toward red
- Shield: `rgba(100, 200, 255, alpha)` (cyan)

## Parallax Background System

The parallax background creates depth with three layers that move at different speeds based on user position.

### Layer Configuration (in `js/config.js`)

```javascript
PARALLAX_CONFIG = {
  farLayer: {    // Distant stars - slowest movement
    count: 80,
    speedFactor: 0.02,
    // Twinkle effect for stars
  },
  midLayer: {    // Nebula clouds - medium speed
    count: 12,
    speedFactor: 0.05,
    // Gentle drift animation
  },
  nearLayer: {   // Floating particles/pollen - fastest
    count: 40,
    speedFactor: 0.12,
    // Bobbing motion
  }
}
```

### Parallax State

```javascript
parallaxLayers = {
  far: [],       // Star particles
  mid: [],       // Cloud gradients
  near: [],      // Pollen particles
  initialized: false
}
```

### Key Features

- **User-based offset**: Layers shift based on user position relative to center
- **Wrapping**: Particles wrap around screen edges seamlessly
- **Always visible**: Draws even on start/game over screens for ambiance
- **Animated effects**: Stars twinkle, clouds drift, particles bob

## Performance Considerations

- Canvas cleared each frame with `clearRect`
- Gradients recreated each frame (could be cached)
- No sprite sheets - all procedural drawing
- Screen shake uses simple translate (efficient)
- Parallax layers initialized once, positions calculated per-frame
