# Bee Brave - Development TODO

## 🎮 Gameplay Features

- [ ] Add difficulty levels (Easy, Medium, Hard)
- [ ] Implement wave-based enemy spawning
- [ ] Add boss bees with unique abilities
- [ ] Create power-up drops from destroyed bees
- [ ] Add combo system for consecutive kills
- [ ] Implement high score leaderboard (local storage)

## 🐝 Bee Behavior

- [ ] Add different bee types (worker, soldier, queen)
- [ ] Improve bee AI pathfinding
- [ ] Add swarm behavior patterns
- [ ] Implement bee retreat when hive is damaged

## 🏠 Hive Mechanics

- [ ] Add hive upgrades (stronger cells, faster honey production)
- [ ] Implement hive repair mechanics
- [ ] Add special hive abilities (area denial, shields)

## 🔫 Weapons & Combat

- [ ] Add more weapon types
- [ ] Implement weapon upgrades
- [ ] Add ammo/cooldown system refinements
- [x] Create visual effects for weapon impacts

## 🎨 Visual Improvements

- [x] Add particle effects for explosions
- [x] Improve bee animations
- [x] Add background parallax layers
- [ ] Create day/night cycle
- [x] Add screen shake on impact

## 🔊 Audio

- [x] Add background music
- [x] Improve sound effect variety
- [ ] Add volume controls in settings
- [ ] Implement mute toggle

## 📱 UI/UX

- [ ] Add pause menu
- [ ] Create tutorial/instructions screen
- [x] Add mobile touch controls
- [x] Improve settings panel layout
- [ ] Add game statistics screen
- [x] Add high score tracking
- [x] Landing screen /w background image
- [x] Add how to play screen

## 📱 Mobile Support

### Touch Controls
- [x] Virtual joystick for movement (left side)
- [x] Fire button (right side, large tap target)
- [x] Special weapon button
- [x] Cycle weapon button
- [x] Multi-touch support (move + shoot simultaneously)

### Touch Event Handling
- [x] Add touchstart/touchmove/touchend/touchcancel handlers
- [x] Map touch positions to joystick direction
- [x] Prevent default scroll/zoom behaviors
- [x] Add touch-action: none to canvas

### Viewport & CSS
- [x] Update viewport meta (user-scalable=no, maximum-scale=1.0)
- [x] Add user-select: none to prevent text selection
- [x] Add -webkit-touch-callout: none
- [x] Ensure 44px minimum tap targets
- [x] Responsive UI layout for small screens
- [x] Hide/reposition HUD elements for mobile

### Performance (Mobile)
- [ ] Reduce particle counts on mobile devices
- [ ] Lower parallax layer density
- [ ] Handle devicePixelRatio for retina displays
- [ ] Throttle rendering if needed

### Orientation & Focus
- [ ] Lock to landscape or adapt UI for portrait
- [ ] Handle orientation change events
- [ ] Pause game on visibilitychange (app loses focus)
- [ ] Resume gracefully when returning

## 🐛 Bug Fixes

- [ ] Review collision detection accuracy
- [ ] Check memory leaks in game loop
- [ ] Test performance with large bee counts

## 📝 Code Quality

- [ ] Add code comments/documentation
- [x] Refactor into ES6 modules
- [ ] Add unit tests
- [x] Optimize canvas rendering

---

## Completed ✅

- [x] Basic game loop
- [x] User movement and shooting
- [x] Bee spawning and AI
- [x] Hexagonal hive system
- [x] Resource collection mechanics
- [x] Shield and health system
- [x] Special weapons (freeze, electric, warp)
- [x] Start screen with settings
- [x] Game over screen
- [x] Score tracking
- [x] Background parallax layers (3-layer depth system with stars, nebula clouds, floating particles)
- [x] Canvas rendering optimizations:
  - Off-screen canvas caching for parallax background
  - Pre-computed hex angles (avoid trig every frame)
  - Visibility culling for all game objects
  - Reduced ctx.save()/restore() calls
  - Batched draw operations by color/style
  - Simplified gradients and effects
  - Cached background glow gradient
