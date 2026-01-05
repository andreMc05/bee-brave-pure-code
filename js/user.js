// User/Player variables
let userIcon = null;
let spawnIndicator = null; // { x, y, duration, maxDuration }
let userExplosion = null; // { x, y, duration, maxDuration, radius }
let userTrail = []; // Array of { x, y, age, maxAge } for afterburner trail
const TRAIL_MAX_AGE = 800; // Trail points fade out over 800ms
const TRAIL_SPACING = 3; // Add trail point every N pixels of movement
let lastTrailX = null;
let lastTrailY = null;

// Bullets/projectiles
let bullets = [];

// Special weapons system
let weapons = {
  freeze: { count: 3, name: 'Freeze Bomb' },
  electric: { count: 3, name: 'Electric Blast' },
  warp: { count: 2, name: 'Warp' }
};
let currentWeaponIndex = 0;
const weaponTypes = ['freeze', 'electric', 'warp'];
let vKeyPressed = false;
let shiftKeyPressed = false;

// Active weapon effects
let freezeBombs = []; // { x, y, radius, duration, maxDuration }
let electricBlasts = []; // { x, y, radius, duration, maxDuration }

// User input handling
const keys = {};
let spacePressed = false;

window.addEventListener('keydown', (e) => {
  // Initialize audio context on first user interaction
  initAudioContext();
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (e.key === 'ArrowUp') keys['arrowup'] = true;
  if (e.key === 'ArrowDown') keys['arrowdown'] = true;
  if (e.key === 'ArrowLeft') keys['arrowleft'] = true;
  if (e.key === 'ArrowRight') keys['arrowright'] = true;
  if (e.key === ' ') {
    e.preventDefault();
    if (!spacePressed) {
      spacePressed = true;
      shoot();
    }
  }
  if (e.key.toLowerCase() === 'v') {
    e.preventDefault();
    if (!vKeyPressed) {
      vKeyPressed = true;
      useSpecialWeapon();
    }
  }
  if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    if (!shiftKeyPressed) {
      shiftKeyPressed = true;
      cycleWeapon();
    }
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = false;
  if (e.key === 'ArrowUp') keys['arrowup'] = false;
  if (e.key === 'ArrowDown') keys['arrowdown'] = false;
  if (e.key === 'ArrowLeft') keys['arrowleft'] = false;
  if (e.key === 'ArrowRight') keys['arrowright'] = false;
  if (e.key === ' ') {
    spacePressed = false;
  }
  if (e.key.toLowerCase() === 'v') {
    vKeyPressed = false;
  }
  if (e.key === 'Shift' || e.key === 'ShiftLeft' || e.key === 'ShiftRight' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    shiftKeyPressed = false;
  }
});

function placeUserIcon() {
  let x, y, tries = 0;
  do {
    x = Math.random() * w;
    y = Math.random() * h;
    tries++;
  } while (
    (Math.hypot(x - center.x, y - center.y) < 120 ||
     (x < 280 && y < 250)) && tries < 50
  );
  userIcon = {
    x,
    y,
    radius: 7,
    speed: 3.3,  // a bit faster than bees
    angle: 0,    // current facing angle
    lastDx: 0,   // last movement direction x
    lastDy: 0,   // last movement direction y
    shield: 100, // shield HP
    maxShield: 100,
    health: 100,  // user health (when shield is depleted)
    invincibilityTimer: 3000,  // 3 seconds of invincibility at start
    lastX: x,    // last position for movement tracking
    lastY: y,    // last position for movement tracking
    stationaryTime: 0  // time spent stationary (ms) - improves hive cell aim
  };
  // Reset trail
  userTrail = [];
  lastTrailX = null;
  lastTrailY = null;
  // Create spawn indicator
  spawnIndicator = {
    x,
    y,
    duration: 2000, // 2 seconds
    maxDuration: 2000
  };
}

function moveUserIcon(dt) {
  if (!userIcon || !gameStarted) return;
  const step = userIcon.speed * dt * 0.06;
  let dx = 0, dy = 0;
  
  // up
  if (keys['w'] || keys['arrowup']) {
    userIcon.y -= step;
    dy -= 1;
  }
  // down (s or x or arrowdown)
  if (keys['s'] || keys['x'] || keys['arrowdown']) {
    userIcon.y += step;
    dy += 1;
  }
  // left
  if (keys['a'] || keys['arrowleft']) {
    userIcon.x -= step;
    dx -= 1;
  }
  // right
  if (keys['d'] || keys['arrowright']) {
    userIcon.x += step;
    dx += 1;
  }

  // Track movement for stationary detection
  const MOVEMENT_THRESHOLD = 2; // pixels - if moved less than this, consider stationary
  const distMoved = Math.hypot(userIcon.x - userIcon.lastX, userIcon.y - userIcon.lastY);
  
  if (distMoved < MOVEMENT_THRESHOLD) {
    // User is stationary - increase stationary time
    userIcon.stationaryTime += dt;
  } else {
    // User moved - reset stationary time
    userIcon.stationaryTime = 0;
    userIcon.lastX = userIcon.x;
    userIcon.lastY = userIcon.y;
  }

  // update angle based on movement direction (normalize direction vector)
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    userIcon.lastDx = dx / len;
    userIcon.lastDy = dy / len;
    userIcon.angle = Math.atan2(dy, dx);
    
    // Start engine sound when moving
    if (!isEngineRunning) {
      initAudioContext();
      startEngineSound();
    }
    
    // Add trail point if moved enough distance
    if (lastTrailX === null || lastTrailY === null) {
      lastTrailX = userIcon.x;
      lastTrailY = userIcon.y;
    } else {
      const distMoved = Math.hypot(userIcon.x - lastTrailX, userIcon.y - lastTrailY);
      if (distMoved >= TRAIL_SPACING) {
        // Place trail point behind the user (opposite direction of movement)
        const behindDistance = 15; // Distance behind user
        const trailX = userIcon.x - Math.cos(userIcon.angle) * behindDistance;
        const trailY = userIcon.y - Math.sin(userIcon.angle) * behindDistance;
        
        userTrail.push({
          x: trailX,
          y: trailY,
          age: 0,
          maxAge: TRAIL_MAX_AGE,
          angle: userIcon.angle
        });
        lastTrailX = userIcon.x;
        lastTrailY = userIcon.y;
      }
    }
  } else {
    // Stop engine sound when not moving
    if (isEngineRunning) {
      stopEngineSound();
    }
  }

  // clamp
  userIcon.x = Math.min(Math.max(userIcon.x, 0), w);
  userIcon.y = Math.min(Math.max(userIcon.y, 0), h);
}

function shoot() {
  if (!userIcon || !gameStarted) return;
  const shotDist = +shotDistanceInput.value;
  const angle = userIcon.angle;
  const speed = 8;
  
  // Play firing sound
  playFireSound();
  
  bullets.push({
    x: userIcon.x,
    y: userIcon.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle: angle,
    maxDistance: shotDist,
    distanceTraveled: 0,
    radius: 3,
    isHiveBullet: false
  });
}

function useSpecialWeapon() {
  if (!userIcon || gameOver || !gameStarted) return;
  
  const currentWeapon = weaponTypes[currentWeaponIndex];
  
  // Check if weapon has ammo
  if (weapons[currentWeapon].count <= 0) {
    // Cycle to next weapon
    currentWeaponIndex = (currentWeaponIndex + 1) % weaponTypes.length;
    updateWeaponUI();
    return;
  }
  
  // Use weapon
  weapons[currentWeapon].count--;
  updateWeaponUI();
  
  if (currentWeapon === 'freeze') {
    // Freeze bomb: lay behind user
    const behindDistance = 30;
    const freezeX = userIcon.x - Math.cos(userIcon.angle) * behindDistance;
    const freezeY = userIcon.y - Math.sin(userIcon.angle) * behindDistance;
    freezeBombs.push({
      x: freezeX,
      y: freezeY,
      radius: 80,
      duration: 3000, // 3 seconds
      maxDuration: 3000
    });
  } else if (currentWeapon === 'electric') {
    // Electric blast: centered on user
    electricBlasts.push({
      x: userIcon.x,
      y: userIcon.y,
      radius: 100,
      duration: 500, // 0.5 seconds
      maxDuration: 500
    });
  } else if (currentWeapon === 'warp') {
    // Warp: teleport user forward
    const warpDistance = 150;
    const newX = userIcon.x + Math.cos(userIcon.angle) * warpDistance;
    const newY = userIcon.y + Math.sin(userIcon.angle) * warpDistance;
    userIcon.x = Math.min(Math.max(newX, 0), w);
    userIcon.y = Math.min(Math.max(newY, 0), h);
  }
  
  // Don't auto-cycle weapon - only cycle when Shift is pressed
}

function cycleWeapon() {
  // Cycle to next weapon
  currentWeaponIndex = (currentWeaponIndex + 1) % weaponTypes.length;
  updateWeaponUI();
}

function updateWeaponUI() {
  freezeCountEl.textContent = weapons.freeze.count;
  electricCountEl.textContent = weapons.electric.count;
  warpCountEl.textContent = weapons.warp.count;
  
  // Update weapon card states
  weaponFreeze.classList.toggle('selected', currentWeaponIndex === 0);
  weaponFreeze.classList.toggle('empty', weapons.freeze.count === 0);
  weaponElectric.classList.toggle('selected', currentWeaponIndex === 1);
  weaponElectric.classList.toggle('empty', weapons.electric.count === 0);
  weaponWarp.classList.toggle('selected', currentWeaponIndex === 2);
  weaponWarp.classList.toggle('empty', weapons.warp.count === 0);
}

// User update logic (called from main update function)
function updateUser(dt, now) {
  // move user
  moveUserIcon(dt);

  // Update trail ages and remove old points
  userTrail = userTrail.map(point => ({
    ...point,
    age: point.age + dt
  })).filter(point => point.age < point.maxAge);

  // Update invincibility timer
  if (userIcon && userIcon.invincibilityTimer > 0) {
    userIcon.invincibilityTimer = Math.max(0, userIcon.invincibilityTimer - dt);
  }

  // Update spawn indicator
  if (spawnIndicator) {
    spawnIndicator.duration -= dt;
    if (spawnIndicator.duration <= 0) {
      spawnIndicator = null;
    }
  }

  // Update user explosion
  if (userExplosion) {
    userExplosion.duration -= dt;
    // Expand radius over time
    const progress = 1 - (userExplosion.duration / userExplosion.maxDuration);
    userExplosion.radius = 20 + progress * 80; // Start at 20, expand to 100
    
    if (userExplosion.duration <= 0) {
      userExplosion = null;
      // Show game over screen after explosion completes
      if (!gameOver) {
        gameOver = true;
        gameOverEl.classList.add('show');
      }
    }
  }

  // Update weapon effects
  // Freeze bombs
  freezeBombs = freezeBombs.filter(bomb => {
    bomb.duration -= dt;
    if (bomb.duration <= 0) return false;
    
    // Freeze bees in radius
    bees.forEach(bee => {
      const dist = Math.hypot(bee.x - bomb.x, bee.y - bomb.y);
      if (dist < bomb.radius) {
        bee.frozen = Math.max(bee.frozen, bomb.duration);
      }
    });
    
    return true;
  });
  
  // Electric blasts
  electricBlasts = electricBlasts.filter(blast => {
    blast.duration -= dt;
    if (blast.duration <= 0) return false;
    
    // Damage bees in radius
    for (let i = bees.length - 1; i >= 0; i--) {
      const bee = bees[i];
      const dist = Math.hypot(bee.x - blast.x, bee.y - blast.y);
      if (dist < blast.radius) {
        bee.hp -= 0.5 * (dt / blast.maxDuration); // Small damage over time
        if (bee.hp <= 0) {
          bees.splice(i, 1);
          destroyedBees++;
        }
      }
    }
    
    return true;
  });

  // update bullets
  bullets = bullets.filter(bullet => {
    bullet.x += bullet.vx * (dt * 0.06);
    bullet.y += bullet.vy * (dt * 0.06);
    bullet.distanceTraveled += Math.hypot(bullet.vx * (dt * 0.06), bullet.vy * (dt * 0.06));
    
    // Remove bullet if it exceeds max distance or goes off screen
    if (bullet.distanceTraveled >= bullet.maxDistance ||
        bullet.x < 0 || bullet.x > w || bullet.y < 0 || bullet.y > h) {
      return false;
    }
    
    // Check collision with user for hive bullets
    if (bullet.isHiveBullet && userIcon) {
      const distToUser = Math.hypot(bullet.x - userIcon.x, bullet.y - userIcon.y);
      if (distToUser < bullet.radius + userIcon.radius) {
        // Hive bullet hit user - damage shield/health
        const isInvincible = userIcon.invincibilityTimer > 0;
        if (!isInvincible) {
          const hiveBulletDamage = 40; // 70% stronger than base (5 * 1.7)
          if (userIcon.shield > 0) {
            userIcon.shield = Math.max(0, userIcon.shield - hiveBulletDamage);
          } else {
            userIcon.health = Math.max(0, userIcon.health - hiveBulletDamage);
          }
        }
        return false; // Remove bullet
      }
    }
    
    // User bullets check collision with hive cells (skip for hive bullets)
    if (!bullet.isHiveBullet) {
      const hitCell = getCellAtPoint(bullet.x, bullet.y);
      if (hitCell) {
        // Bullet hit a cell - damage any bees in that cell
        const cellCenter = hexToPixel(hitCell.q, hitCell.r);
        const cellSize = HEX_SIZE * hitCell.buildProg;
        
        // Find bees in this cell
        let beesHit = false;
        for (let i = bees.length - 1; i >= 0; i--) {
          const bee = bees[i];
          // Check if bee is in the same cell
          if (isPointInHex(bee.x, bee.y, cellCenter.x, cellCenter.y, cellSize)) {
            beesHit = true;
            // Hit! Reduce bee HP
            bee.hp -= 1;
            if (bee.hp <= 0) {
              bees.splice(i, 1);
              destroyedBees++;
            }
          }
        }
        
        // Damage the cell itself
        if (hitCell.honey > 0) {
          // Cell has honey - deplete honey first
          hitCell.honey = Math.max(0, hitCell.honey - HONEY_DAMAGE_PER_HIT);
        } else {
          // No honey - damage the cell structure
          hitCell.hp -= 1;
          if (hitCell.hp <= 0) {
            // Cell destroyed - remove it
            const cellIndex = cells.indexOf(hitCell);
            if (cellIndex !== -1) {
              cells.splice(cellIndex, 1);
              destroyedCells++;
            }
          }
        }
        
        // Remove bullet after hitting cell (whether or not bees were hit)
        return false;
      }
      
      // Check collision with bees (for bees not in cells) - only for user bullets
      for (let i = bees.length - 1; i >= 0; i--) {
        const bee = bees[i];
        const dist = Math.hypot(bullet.x - bee.x, bullet.y - bee.y);
        if (dist < bullet.radius + 4) {
          // Hit! Reduce bee HP
          bee.hp -= 1;
          if (bee.hp <= 0) {
            bees.splice(i, 1);
            destroyedBees++;
          }
          return false; // Remove bullet
        }
      }
    }
    
    return true;
  });

  // Check bee collisions with user (shield damage)
  if (userIcon) {
    const isInvincible = userIcon.invincibilityTimer > 0;
    let takingDamage = false;
    let attackingBeesCount = 0;
    bees.forEach(bee => {
      const dist = Math.hypot(bee.x - userIcon.x, bee.y - userIcon.y);
      const beeRadius = 4; // approximate bee radius
      if (dist < beeRadius + userIcon.radius + 2) {
        // Only apply damage if not invincible
        if (!isInvincible) {
          takingDamage = true;
          // Attacking bees deal more damage
          const damageMultiplier = bee.state === 'attack' ? 1.5 : 1.0;
          attackingBeesCount += damageMultiplier;
          
          // Collision! Damage shield first
          if (userIcon.shield > 0) {
            userIcon.shield = Math.max(0, userIcon.shield - dt * 0.1 * damageMultiplier);
            
            // Repel bee backward when hitting shield
            const repelDistance = 15; // Distance to push bee back
            const repelDx = bee.x - userIcon.x;
            const repelDy = bee.y - userIcon.y;
            const repelDist = Math.hypot(repelDx, repelDy);
            if (repelDist > 0) {
              // Normalize direction and apply repulsion
              const repelDirX = repelDx / repelDist;
              const repelDirY = repelDy / repelDist;
              bee.x = userIcon.x + repelDirX * (userIcon.radius + beeRadius + repelDistance);
              bee.y = userIcon.y + repelDirY * (userIcon.radius + beeRadius + repelDistance);
            }
          } else {
            // Shield depleted, damage health (more damage when shield is down)
            userIcon.health = Math.max(0, userIcon.health - dt * 0.15 * damageMultiplier);
          }
        } else {
          // Still repel bees when invincible, but don't take damage
          const repelDistance = 15;
          const repelDx = bee.x - userIcon.x;
          const repelDy = bee.y - userIcon.y;
          const repelDist = Math.hypot(repelDx, repelDy);
          if (repelDist > 0) {
            const repelDirX = repelDx / repelDist;
            const repelDirY = repelDy / repelDist;
            bee.x = userIcon.x + repelDirX * (userIcon.radius + beeRadius + repelDistance);
            bee.y = userIcon.y + repelDirY * (userIcon.radius + beeRadius + repelDistance);
          }
        }
      }
    });
    
    // Regenerate shield when not taking damage
    if (!takingDamage && userIcon.shield < userIcon.maxShield) {
      userIcon.shield = Math.min(userIcon.maxShield, userIcon.shield + dt * 0.02);
    }
    
    // Health doesn't regenerate automatically - player needs to avoid damage
  }
}

