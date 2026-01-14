// ========================================
// User/Player - Movement and Input
// ========================================

// User state
let userIcon = null;
let spawnIndicator = null;
let userExplosion = null;
let userTrail = [];
let lastTrailX = null;
let lastTrailY = null;

// Input state
const keys = {};
let spacePressed = false;
let vKeyPressed = false;
let shiftKeyPressed = false;

// Initialize input handlers
function initInput() {
  window.addEventListener('keydown', (e) => {
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

  // Allow restart with R key
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r' && gameOver) {
      restartGame();
    }
  });
}

// Place user icon at random position
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
    speed: 3.3,
    angle: 0,
    lastDx: 0,
    lastDy: 0,
    shield: 100,
    maxShield: 100,
    health: 100,
    invincibilityTimer: 3000,
    lastX: x,
    lastY: y,
    stationaryTime: 0
  };
  // Reset trail
  userTrail = [];
  lastTrailX = null;
  lastTrailY = null;
  // Create spawn indicator
  spawnIndicator = {
    x,
    y,
    duration: 2000,
    maxDuration: 2000
  };
}

// Move user icon based on input
function moveUserIcon(dt) {
  if (!userIcon || !gameStarted) return;
  const step = userIcon.speed * dt * 0.06;
  let dx = 0, dy = 0;
  
  if (keys['w'] || keys['arrowup']) {
    userIcon.y -= step;
    dy -= 1;
  }
  if (keys['s'] || keys['x'] || keys['arrowdown']) {
    userIcon.y += step;
    dy += 1;
  }
  if (keys['a'] || keys['arrowleft']) {
    userIcon.x -= step;
    dx -= 1;
  }
  if (keys['d'] || keys['arrowright']) {
    userIcon.x += step;
    dx += 1;
  }

  // Track movement for stationary detection
  const MOVEMENT_THRESHOLD = 2;
  const distMoved = Math.hypot(userIcon.x - userIcon.lastX, userIcon.y - userIcon.lastY);
  
  if (distMoved < MOVEMENT_THRESHOLD) {
    userIcon.stationaryTime += dt;
  } else {
    userIcon.stationaryTime = 0;
    userIcon.lastX = userIcon.x;
    userIcon.lastY = userIcon.y;
  }

  // Update angle
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    userIcon.lastDx = dx / len;
    userIcon.lastDy = dy / len;
    userIcon.angle = Math.atan2(dy, dx);
    
    if (!isEngineRunning) {
      initAudioContext();
      startEngineSound();
    }
    
    // Add trail point
    if (lastTrailX === null || lastTrailY === null) {
      lastTrailX = userIcon.x;
      lastTrailY = userIcon.y;
    } else {
      const distMoved = Math.hypot(userIcon.x - lastTrailX, userIcon.y - lastTrailY);
      if (distMoved >= TRAIL_SPACING) {
        const behindDistance = 15;
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
    if (isEngineRunning) {
      stopEngineSound();
    }
  }

  // Clamp position
  userIcon.x = Math.min(Math.max(userIcon.x, 0), w);
  userIcon.y = Math.min(Math.max(userIcon.y, 0), h);
}

// Update user state
function updateUser(dt, now) {
  moveUserIcon(dt);

  // Update trail
  userTrail = userTrail.map(point => ({
    ...point,
    age: point.age + dt
  })).filter(point => point.age < point.maxAge);

  // Update invincibility
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
    const progress = 1 - (userExplosion.duration / userExplosion.maxDuration);
    userExplosion.radius = 20 + progress * 80;
    
    if (userExplosion.duration <= 0) {
      userExplosion = null;
      if (!gameOver) {
        gameOver = true;
        document.getElementById('gameOver').classList.add('show');
      }
    }
  }

  // Check bee collisions with user
  if (userIcon) {
    const isInvincible = userIcon.invincibilityTimer > 0;
    let takingDamage = false;
    
    bees.forEach(bee => {
      const dist = Math.hypot(bee.x - userIcon.x, bee.y - userIcon.y);
      const beeRadius = 4;
      if (dist < beeRadius + userIcon.radius + 2) {
        if (!isInvincible) {
          takingDamage = true;
          let damageMultiplier = 1.0;
          if (bee.state === 'hunt') {
            damageMultiplier = 2.0;
          } else if (bee.state === 'attack') {
            damageMultiplier = 1.5;
          }
          
          if (userIcon.shield > 0) {
            userIcon.shield = Math.max(0, userIcon.shield - dt * 0.1 * damageMultiplier);
            // Subtle shake when shield absorbs damage
            if (Math.random() < 0.1) triggerScreenShake(2, 80);
            
            // Repel bee
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
          } else {
            userIcon.health = Math.max(0, userIcon.health - dt * 0.15 * damageMultiplier);
            // Stronger shake when taking health damage
            if (Math.random() < 0.15) triggerScreenShake(4, 100);
          }
        } else {
          // Repel when invincible
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
    
    // Regenerate shield
    if (!takingDamage && userIcon.shield < userIcon.maxShield) {
      userIcon.shield = Math.min(userIcon.maxShield, userIcon.shield + dt * 0.02);
    }
  }
}

// Check if user should trigger game over
function checkUserDeath() {
  if (userIcon && userIcon.health <= 0 && !gameOver && !userExplosion) {
    stopEngineSound();
    playExplosionSound();
    
    // Big screen shake on death
    triggerScreenShake(15, 500);
    
    userExplosion = {
      x: userIcon.x,
      y: userIcon.y,
      duration: 2500,
      maxDuration: 2500,
      radius: 20
    };
    userIcon = null;
  }
}

// Reset user state
function resetUser() {
  userExplosion = null;
  userTrail = [];
  lastTrailX = null;
  lastTrailY = null;
  spawnIndicator = null;
  placeUserIcon();
}
