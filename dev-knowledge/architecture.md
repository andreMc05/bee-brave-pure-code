# Game Architecture

## File Structure

```
bee-brave-pure-code/
├── index.html          # Main HTML file with UI and game container
├── css/
│   └── styles.css      # All game styling (376 lines)
├── js/
│   ├── config.js       # Game constants and configuration
│   ├── game.js         # Main game loop, initialization, state management
│   ├── bees.js         # Bee creation, AI, and updates
│   ├── cells.js        # Hexagonal hive cell system
│   ├── combat.js       # Weapons, bullets, damage handling
│   ├── draw.js         # All rendering/drawing functions
│   ├── resources.js    # Resource spot management
│   ├── ui.js           # UI updates and interactions
│   ├── user.js         # Player character logic
│   └── audio.js        # Sound effects management
└── dev-knowledge/      # This documentation folder
```

## Script Load Order (from index.html)

Scripts are loaded in this specific order for dependency resolution:
1. `config.js` - Constants needed by all other files
2. `audio.js` - Sound system
3. `cells.js` - Hive cell system
4. `resources.js` - Resource management
5. `bees.js` - Bee system
6. `user.js` - Player character
7. `combat.js` - Combat mechanics
8. `draw.js` - Rendering
9. `ui.js` - UI handling
10. `game.js` - Main game loop (depends on all above)

## Global Variables Pattern

The game uses global variables extensively (no module system). Key globals include:

### Canvas & Context
- `canvas` - The main canvas element
- `ctx` - 2D rendering context
- `w`, `h` - Canvas width/height
- `center` - Object with x, y for canvas center

### Game State
- `gameStarted` - Boolean, whether game is running
- `gameOver` - Boolean, whether game has ended
- `gameStartTime` - Timestamp when game started
- `score` - Current score
- `destroyedBees` - Count of destroyed bees

### Entity Arrays
- `bees` - Array of regular bee objects
- `hunterBees` - Array of hunter bee objects
- `bullets` - Array of bullet objects
- `cells` - Array of hive cell objects
- `resourceSpots` - Array of resource locations

### Player
- `userIcon` - Player character object (null when dead)

## Game Loop

Located in `js/game.js`, uses `requestAnimationFrame`:

```javascript
function gameLoop(timestamp) {
  const dt = timestamp - lastFrameTime;  // Delta time in ms
  lastFrameTime = timestamp;
  
  // Update all systems
  updateBees(dt, timestamp, preferHighPct);
  updateHunterBees(dt);
  updateDropship(dt);
  updateBullets(dt);
  // ... more updates
  
  // Render
  draw();
  
  requestAnimationFrame(gameLoop);
}
```

## Coordinate System

- Origin (0,0) is top-left of canvas
- X increases rightward
- Y increases downward
- `center` object holds canvas center coordinates
- Hive is positioned at center

## Hexagonal Grid System

Uses axial coordinates (q, r) for hex cells:
- `hexToPixel(q, r)` - Converts hex coords to pixel position
- `HEX_SIZE` - Radius of each hexagon (from config.js)
- Cells arranged in rings around center (0,0)
