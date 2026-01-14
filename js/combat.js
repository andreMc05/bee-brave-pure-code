// ========================================
// Combat System - Bullets and Special Weapons
// ========================================

// Bullets array
let bullets = [];

// Special weapons system
let weapons = {
  freeze: { count: 3, name: 'Freeze Bomb' },
  electric: { count: 3, name: 'Electric Blast' },
  warp: { count: 2, name: 'Warp' }
};
let currentWeaponIndex = 0;
const weaponTypes = ['freeze', 'electric', 'warp'];

// Active weapon effects
let freezeBombs = [];
let electricBlasts = [];

// Shoot function
function shoot() {
  if (!userIcon || !gameStarted) return;
  const shotDist = +document.getElementById('shotDistance').value;
  const angle = userIcon.angle;
  const speed = 8;
  
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

// Use special weapon
function useSpecialWeapon() {
  if (!userIcon || gameOver || !gameStarted) return;
  
  const currentWeapon = weaponTypes[currentWeaponIndex];
  
  if (weapons[currentWeapon].count <= 0) {
    currentWeaponIndex = (currentWeaponIndex + 1) % weaponTypes.length;
    updateWeaponUI();
    return;
  }
  
  weapons[currentWeapon].count--;
  updateWeaponUI();
  
  if (currentWeapon === 'freeze') {
    const behindDistance = 30;
    const freezeX = userIcon.x - Math.cos(userIcon.angle) * behindDistance;
    const freezeY = userIcon.y - Math.sin(userIcon.angle) * behindDistance;
    freezeBombs.push({
      x: freezeX,
      y: freezeY,
      radius: 80,
      duration: 3000,
      maxDuration: 3000
    });
  } else if (currentWeapon === 'electric') {
    electricBlasts.push({
      x: userIcon.x,
      y: userIcon.y,
      radius: 100,
      duration: 500,
      maxDuration: 500
    });
    // Screen shake for electric blast
    triggerScreenShake(6, 200);
  } else if (currentWeapon === 'warp') {
    const warpDistance = 150;
    const newX = userIcon.x + Math.cos(userIcon.angle) * warpDistance;
    const newY = userIcon.y + Math.sin(userIcon.angle) * warpDistance;
    userIcon.x = Math.min(Math.max(newX, 0), w);
    userIcon.y = Math.min(Math.max(newY, 0), h);
  }
}

// Cycle weapon
function cycleWeapon() {
  currentWeaponIndex = (currentWeaponIndex + 1) % weaponTypes.length;
  updateWeaponUI();
}

// Update weapon UI
function updateWeaponUI() {
  const freezeCountEl = document.getElementById('freezeCount');
  const electricCountEl = document.getElementById('electricCount');
  const warpCountEl = document.getElementById('warpCount');
  const weaponFreeze = document.getElementById('weaponFreeze');
  const weaponElectric = document.getElementById('weaponElectric');
  const weaponWarp = document.getElementById('weaponWarp');
  
  if (freezeCountEl) freezeCountEl.textContent = weapons.freeze.count;
  if (electricCountEl) electricCountEl.textContent = weapons.electric.count;
  if (warpCountEl) warpCountEl.textContent = weapons.warp.count;
  
  if (weaponFreeze) {
    weaponFreeze.classList.toggle('selected', currentWeaponIndex === 0);
    weaponFreeze.classList.toggle('empty', weapons.freeze.count === 0);
  }
  if (weaponElectric) {
    weaponElectric.classList.toggle('selected', currentWeaponIndex === 1);
    weaponElectric.classList.toggle('empty', weapons.electric.count === 0);
  }
  if (weaponWarp) {
    weaponWarp.classList.toggle('selected', currentWeaponIndex === 2);
    weaponWarp.classList.toggle('empty', weapons.warp.count === 0);
  }
}

// Update bullets
function updateBullets(dt, now) {
  bullets = bullets.filter(bullet => {
    bullet.x += bullet.vx * (dt * 0.06);
    bullet.y += bullet.vy * (dt * 0.06);
    bullet.distanceTraveled += Math.hypot(bullet.vx * (dt * 0.06), bullet.vy * (dt * 0.06));
    
    // Remove if exceeds distance or off screen
    if (bullet.distanceTraveled >= bullet.maxDistance ||
        bullet.x < 0 || bullet.x > w || bullet.y < 0 || bullet.y > h) {
      return false;
    }
    
    // Check collision with user for hive bullets
    if (bullet.isHiveBullet && userIcon) {
      const distToUser = Math.hypot(bullet.x - userIcon.x, bullet.y - userIcon.y);
      if (distToUser < bullet.radius + userIcon.radius) {
        const isInvincible = userIcon.invincibilityTimer > 0;
        if (!isInvincible) {
          const hiveBulletDamage = 40;
          if (userIcon.shield > 0) {
            userIcon.shield = Math.max(0, userIcon.shield - hiveBulletDamage);
            triggerScreenShake(4, 150);
          } else {
            userIcon.health = Math.max(0, userIcon.health - hiveBulletDamage);
            triggerScreenShake(8, 200);
          }
        }
        return false;
      }
    }
    
    // Check collision with user for hunter lasers
    if (bullet.isHunterLaser && userIcon) {
      const distToUser = Math.hypot(bullet.x - userIcon.x, bullet.y - userIcon.y);
      if (distToUser < bullet.radius + userIcon.radius) {
        const isInvincible = userIcon.invincibilityTimer > 0;
        if (!isInvincible) {
          if (userIcon.shield > 0) {
            userIcon.shield = Math.max(0, userIcon.shield - bullet.damage);
            triggerScreenShake(5, 150);
          } else {
            userIcon.health = Math.max(0, userIcon.health - bullet.damage);
            triggerScreenShake(10, 250);
          }
        }
        return false;
      }
    }
    
    // User bullets collision with cells and bees
    if (!bullet.isHiveBullet && !bullet.isHunterLaser) {
      const hiveProtected = (now - gameStartTime) < HIVE_PROTECTION_DURATION;
      
      const hitCell = getCellAtPoint(bullet.x, bullet.y);
      if (hitCell) {
        const cellCenter = hexToPixel(hitCell.q, hitCell.r);
        const cellSize = HEX_SIZE * hitCell.buildProg;
        
        // Hit bees in cell
        let beesHit = false;
        for (let i = bees.length - 1; i >= 0; i--) {
          const bee = bees[i];
          if (isPointInHex(bee.x, bee.y, cellCenter.x, cellCenter.y, cellSize)) {
            beesHit = true;
            bee.hp -= 1;
            if (bee.hp <= 0) {
              createBeeExplosion(bee.x, bee.y);
              bees.splice(i, 1);
              destroyedBees++;
            }
          }
        }
        
        // Damage cell if not protected
        if (!hiveProtected) {
          if (hitCell.honey > 0) {
            hitCell.honey = Math.max(0, hitCell.honey - HONEY_DAMAGE_PER_HIT);
          } else {
            hitCell.hp -= 1;
            if (hitCell.hp <= 0) {
              const cellIndex = cells.indexOf(hitCell);
              if (cellIndex !== -1) {
                createCellExplosion(cellCenter.x, cellCenter.y);
                cells.splice(cellIndex, 1);
                destroyedCells++;
              }
            }
          }
        }
        
        return false;
      }
      
      // Check collision with bees
      for (let i = bees.length - 1; i >= 0; i--) {
        const bee = bees[i];
        const dist = Math.hypot(bullet.x - bee.x, bullet.y - bee.y);
        if (dist < bullet.radius + 4) {
          bee.hp -= 1;
          if (bee.hp <= 0) {
            createBeeExplosion(bee.x, bee.y);
            bees.splice(i, 1);
            destroyedBees++;
          }
          return false;
        }
      }
      
      // Check collision with hunter bees
      for (let i = hunterBees.length - 1; i >= 0; i--) {
        const hunter = hunterBees[i];
        const dist = Math.hypot(bullet.x - hunter.x, bullet.y - hunter.y);
        if (dist < bullet.radius + hunter.size) {
          if (hunter.shield > 0) {
            hunter.shield = Math.max(0, hunter.shield - 15);
          } else {
            hunter.hp -= 1;
            if (hunter.hp <= 0) {
              createHunterExplosion(hunter.x, hunter.y);
              hunterBees.splice(i, 1);
              destroyedBees += 5;
            }
          }
          return false;
        }
      }
    }
    
    return true;
  });
}

// Update weapon effects
function updateWeaponEffects(dt) {
  // Freeze bombs
  freezeBombs = freezeBombs.filter(bomb => {
    bomb.duration -= dt;
    if (bomb.duration <= 0) return false;
    
    bees.forEach(bee => {
      const dist = Math.hypot(bee.x - bomb.x, bee.y - bomb.y);
      if (dist < bomb.radius) {
        bee.frozen = Math.max(bee.frozen, bomb.duration);
      }
    });
    
    hunterBees.forEach(hunter => {
      const dist = Math.hypot(hunter.x - bomb.x, hunter.y - bomb.y);
      if (dist < bomb.radius) {
        if (!hunter.frozen) hunter.frozen = 0;
        hunter.frozen = Math.max(hunter.frozen, bomb.duration * 0.5);
      }
    });
    
    return true;
  });
  
  // Electric blasts
  electricBlasts = electricBlasts.filter(blast => {
    blast.duration -= dt;
    if (blast.duration <= 0) return false;
    
    for (let i = bees.length - 1; i >= 0; i--) {
      const bee = bees[i];
      const dist = Math.hypot(bee.x - blast.x, bee.y - blast.y);
      if (dist < blast.radius) {
        bee.hp -= 0.5 * (dt / blast.maxDuration);
        if (bee.hp <= 0) {
          createBeeExplosion(bee.x, bee.y);
          bees.splice(i, 1);
          destroyedBees++;
        }
      }
    }
    
    for (let i = hunterBees.length - 1; i >= 0; i--) {
      const hunter = hunterBees[i];
      const dist = Math.hypot(hunter.x - blast.x, hunter.y - blast.y);
      if (dist < blast.radius) {
        const damage = 0.3 * (dt / blast.maxDuration);
        if (hunter.shield > 0) {
          hunter.shield = Math.max(0, hunter.shield - damage * 10);
        } else {
          hunter.hp -= damage;
          if (hunter.hp <= 0) {
            createHunterExplosion(hunter.x, hunter.y);
            hunterBees.splice(i, 1);
            destroyedBees += 5;
          }
        }
      }
    }
    
    return true;
  });
}

// Reset combat state
function resetCombat() {
  bullets = [];
  freezeBombs = [];
  electricBlasts = [];
  weapons.freeze.count = 3;
  weapons.electric.count = 3;
  weapons.warp.count = 2;
  currentWeaponIndex = 0;
}
