// ========================================
// Combat System - Bullets and Special Weapons
// ========================================

import { w, h, HEX_SIZE, HONEY_DAMAGE_PER_HIT, triggerScreenShake } from './config.js';
import { 
  playFireSound, 
  playFreezeSound, 
  playElectricSound, 
  playWarpSound,
  playShieldHitSound,
  playHealthHitSound,
  playWeaponCycleSound,
  playSingularitySound,
  playRailgunSound,
  playShockwaveSound,
  playAblativeShieldSound,
  playCounterMissilesSound,
  playCloakSound
} from './audio.js';
import { 
  bees, 
  hunterBees, 
  createBeeExplosion, 
  createHunterExplosion, 
  addDestroyedBees,
  addDestroyedCells
} from './bees.js';
import { cells, getCellAtPoint, hexToPixel, isPointInHex, createCellExplosion } from './cells.js';
import { spawnImpactParticles } from './particles.js';

// Bullets array
export let bullets = [];

// Special weapons system
export const weapons = {
  freeze: { count: 3, name: 'Freeze Bomb' },
  electric: { count: 3, name: 'Electric Blast' },
  warp: { count: 2, name: 'Warp' }
};
export let currentWeaponIndex = 0;
export const weaponTypes = ['freeze', 'electric', 'warp'];

// Active weapon effects
export let freezeBombs = [];
export let electricBlasts = [];

// Heavy weapons system - player can only hold ONE at a time
export const heavyWeaponTypes = ['singularity', 'railgun', 'shockwave'];
export const heavyWeaponInfo = {
  singularity: { name: 'Leaf-Blower Singularity', icon: '🌀', description: 'Gravity vortex' },
  railgun: { name: 'Edger-V-Ting Railgun', icon: '⚡', description: 'Piercing beam' },
  shockwave: { name: '"Ask Your Mother" Shockwave', icon: '💥', description: 'Stuns all enemies' }
};
export let currentHeavyWeapon = null; // null = no heavy weapon, or 'singularity', 'railgun', 'shockwave'

// Weapon drops
export let weaponDrops = [];
const WEAPON_DROP_INTERVAL = 30000; // 30 seconds between drops
const WEAPON_DROP_LIFETIME = 15000; // 15 seconds before drop disappears
let lastWeaponDropTime = 0;
let weaponDropSpawnEnabled = true;

// Active heavy weapon effects
export let singularities = [];
export let railgunBeams = [];
export let shockwaves = [];

// Defensive/Utility weapons system - player can only hold ONE at a time
export const defensiveWeaponTypes = ['shield', 'missiles', 'cloak'];
export const defensiveWeaponInfo = {
  shield: { name: 'SPF-5000 Ablative Shield', icon: '🛡️', description: 'Energy barrier' },
  missiles: { name: 'Counter-Missiles', icon: '🚀', description: 'Homing missiles' },
  cloak: { name: 'Thermostat-Lock Cloak', icon: '👻', description: 'Invisibility' }
};
export let currentDefensiveWeapon = null;

// Defensive weapon drops
export let defensiveDrops = [];
const DEFENSIVE_DROP_INTERVAL = 35000; // 35 seconds between drops
const DEFENSIVE_DROP_LIFETIME = 15000;
let lastDefensiveDropTime = 0;

// Active defensive weapon effects
export let activeShields = [];
export let counterMissiles = [];
export let cloakEffect = null;

// Shoot function
export function shoot(userIcon, gameStarted) {
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
export function useSpecialWeapon(userIcon, gameOver, gameStarted) {
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
    playFreezeSound();
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
    playElectricSound();
  } else if (currentWeapon === 'warp') {
    const warpDistance = 150;
    const newX = userIcon.x + Math.cos(userIcon.angle) * warpDistance;
    const newY = userIcon.y + Math.sin(userIcon.angle) * warpDistance;
    userIcon.x = Math.min(Math.max(newX, 0), w);
    userIcon.y = Math.min(Math.max(newY, 0), h);
    playWarpSound();
  }
}

// Cycle weapon
export function cycleWeapon() {
  currentWeaponIndex = (currentWeaponIndex + 1) % weaponTypes.length;
  updateWeaponUI();
  playWeaponCycleSound();
}

// Use heavy weapon
export function useHeavyWeapon(userIcon, gameOver, gameStarted) {
  if (!userIcon || gameOver || !gameStarted) return;
  
  // Check if player has a heavy weapon
  if (!currentHeavyWeapon) {
    return; // No heavy weapon to use
  }
  
  const weaponType = currentHeavyWeapon;
  currentHeavyWeapon = null; // Consume the weapon
  updateHeavyWeaponUI();
  
  if (weaponType === 'singularity') {
    // Leaf-Blower Singularity - gravity well that sucks in bees
    const spawnDist = 150;
    const singularityX = userIcon.x + Math.cos(userIcon.angle) * spawnDist;
    const singularityY = userIcon.y + Math.sin(userIcon.angle) * spawnDist;
    singularities.push({
      x: singularityX,
      y: singularityY,
      radius: 20,
      maxRadius: 200,
      pullStrength: 15,
      duration: 4000,
      maxDuration: 4000,
      damage: 0.5,
      phase: 'grow' // grow, active, collapse
    });
    triggerScreenShake(10, 400);
    playSingularitySound();
  } else if (weaponType === 'railgun') {
    // Edger-V-Ting Railgun - piercing long-range beam
    railgunBeams.push({
      x: userIcon.x,
      y: userIcon.y,
      angle: userIcon.angle,
      length: 0,
      maxLength: 1500,
      width: 8,
      duration: 800,
      maxDuration: 800,
      damage: 5,
      piercing: true
    });
    triggerScreenShake(12, 300);
    playRailgunSound();
  } else if (weaponType === 'shockwave') {
    // "Ask Your Mother" Shockwave - area EMP stun
    shockwaves.push({
      x: userIcon.x,
      y: userIcon.y,
      radius: 0,
      maxRadius: 400,
      duration: 1500,
      maxDuration: 1500,
      stunDuration: 5000,
      phase: 'expand' // expand, linger
    });
    triggerScreenShake(15, 500);
    playShockwaveSound();
  }
}

// Update heavy weapon UI - shows single weapon slot
export function updateHeavyWeaponUI() {
  const heavyWeaponSlot = document.getElementById('heavyWeaponSlot');
  const heavyWeaponIcon = document.getElementById('heavyWeaponIcon');
  const heavyWeaponName = document.getElementById('heavyWeaponName');
  const heavyWeaponEmpty = document.getElementById('heavyWeaponEmpty');
  
  if (currentHeavyWeapon && heavyWeaponInfo[currentHeavyWeapon]) {
    const info = heavyWeaponInfo[currentHeavyWeapon];
    if (heavyWeaponSlot) heavyWeaponSlot.classList.remove('empty');
    if (heavyWeaponIcon) heavyWeaponIcon.textContent = info.icon;
    if (heavyWeaponName) heavyWeaponName.textContent = info.description;
    if (heavyWeaponEmpty) heavyWeaponEmpty.style.display = 'none';
  } else {
    if (heavyWeaponSlot) heavyWeaponSlot.classList.add('empty');
    if (heavyWeaponIcon) heavyWeaponIcon.textContent = '—';
    if (heavyWeaponName) heavyWeaponName.textContent = 'None';
    if (heavyWeaponEmpty) heavyWeaponEmpty.style.display = 'block';
  }
}

// Spawn weapon drop at random location
export function spawnWeaponDrop(gameStartTime) {
  const now = performance.now();
  
  // Don't spawn if disabled or too soon
  if (!weaponDropSpawnEnabled) return;
  if (now - lastWeaponDropTime < WEAPON_DROP_INTERVAL) return;
  if (now - gameStartTime < 15000) return; // Wait 15s before first drop
  
  lastWeaponDropTime = now;
  
  // Pick random weapon type
  const weaponType = heavyWeaponTypes[Math.floor(Math.random() * heavyWeaponTypes.length)];
  const info = heavyWeaponInfo[weaponType];
  
  // Spawn at random position (avoiding center hive area)
  let x, y, tries = 0;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const centerX = w * 0.53;
  const centerY = h * 0.55;
  
  do {
    x = 100 + Math.random() * (w - 200);
    y = 100 + Math.random() * (h - 200);
    tries++;
  } while (Math.hypot(x - centerX, y - centerY) < 200 && tries < 50);
  
  weaponDrops.push({
    x,
    y,
    type: weaponType,
    icon: info.icon,
    name: info.description,
    spawnTime: now,
    lifetime: WEAPON_DROP_LIFETIME,
    pulsePhase: Math.random() * Math.PI * 2,
    collected: false
  });
}

// Check if user collects a weapon drop
export function checkWeaponDropCollection(userIcon) {
  if (!userIcon) return;
  
  for (let i = weaponDrops.length - 1; i >= 0; i--) {
    const drop = weaponDrops[i];
    if (drop.collected) continue;
    
    const dist = Math.hypot(drop.x - userIcon.x, drop.y - userIcon.y);
    if (dist < 30) { // Collection radius
      // Player picks up the weapon (replaces current if any)
      currentHeavyWeapon = drop.type;
      drop.collected = true;
      weaponDrops.splice(i, 1);
      updateHeavyWeaponUI();
      playWeaponCycleSound(); // Use existing sound for pickup feedback
      return;
    }
  }
}

// Update weapon drops (remove expired ones)
export function updateWeaponDrops(dt) {
  const now = performance.now();
  
  weaponDrops = weaponDrops.filter(drop => {
    const age = now - drop.spawnTime;
    return age < drop.lifetime && !drop.collected;
  });
}

// ========================================
// DEFENSIVE WEAPONS
// ========================================

// Use defensive weapon
export function useDefensiveWeapon(userIcon, gameOver, gameStarted) {
  if (!userIcon || gameOver || !gameStarted) return;
  
  if (!currentDefensiveWeapon) {
    return; // No defensive weapon
  }
  
  const weaponType = currentDefensiveWeapon;
  currentDefensiveWeapon = null;
  updateDefensiveWeaponUI();
  
  if (weaponType === 'shield') {
    // SPF-5000 Ablative Shielding - temporary invincibility bubble
    activeShields.push({
      x: userIcon.x,
      y: userIcon.y,
      radius: 50,
      duration: 5000,
      maxDuration: 5000,
      owner: userIcon,
      absorbedDamage: 0
    });
    triggerScreenShake(5, 200);
    playAblativeShieldSound();
  } else if (weaponType === 'missiles') {
    // Counter-Missiles - spawn homing missiles that target nearby enemies
    const missileCount = 8;
    for (let i = 0; i < missileCount; i++) {
      const angle = (Math.PI * 2 * i / missileCount);
      counterMissiles.push({
        x: userIcon.x,
        y: userIcon.y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        speed: 6,
        turnRate: 0.15,
        target: null,
        damage: 3,
        lifetime: 4000,
        maxLifetime: 4000,
        trail: []
      });
    }
    triggerScreenShake(6, 250);
    playCounterMissilesSound();
  } else if (weaponType === 'cloak') {
    // Thermostat-Lock Cloaking Device - invisibility
    cloakEffect = {
      duration: 6000,
      maxDuration: 6000,
      owner: userIcon
    };
    playCloakSound();
  }
}

// Update defensive weapon UI
export function updateDefensiveWeaponUI() {
  const defensiveWeaponSlot = document.getElementById('defensiveWeaponSlot');
  const defensiveWeaponIcon = document.getElementById('defensiveWeaponIcon');
  const defensiveWeaponName = document.getElementById('defensiveWeaponName');
  const defensiveWeaponEmpty = document.getElementById('defensiveWeaponEmpty');
  
  if (currentDefensiveWeapon && defensiveWeaponInfo[currentDefensiveWeapon]) {
    const info = defensiveWeaponInfo[currentDefensiveWeapon];
    if (defensiveWeaponSlot) defensiveWeaponSlot.classList.remove('empty');
    if (defensiveWeaponIcon) defensiveWeaponIcon.textContent = info.icon;
    if (defensiveWeaponName) defensiveWeaponName.textContent = info.description;
    if (defensiveWeaponEmpty) defensiveWeaponEmpty.style.display = 'none';
  } else {
    if (defensiveWeaponSlot) defensiveWeaponSlot.classList.add('empty');
    if (defensiveWeaponIcon) defensiveWeaponIcon.textContent = '—';
    if (defensiveWeaponName) defensiveWeaponName.textContent = 'None';
    if (defensiveWeaponEmpty) defensiveWeaponEmpty.style.display = 'block';
  }
}

// Spawn defensive weapon drop
export function spawnDefensiveDrop(gameStartTime) {
  const now = performance.now();
  
  if (now - lastDefensiveDropTime < DEFENSIVE_DROP_INTERVAL) return;
  if (now - gameStartTime < 20000) return; // Wait 20s before first drop
  
  lastDefensiveDropTime = now;
  
  const weaponType = defensiveWeaponTypes[Math.floor(Math.random() * defensiveWeaponTypes.length)];
  const info = defensiveWeaponInfo[weaponType];
  
  let x, y, tries = 0;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const centerX = w * 0.53;
  const centerY = h * 0.55;
  
  do {
    x = 100 + Math.random() * (w - 200);
    y = 100 + Math.random() * (h - 200);
    tries++;
  } while (Math.hypot(x - centerX, y - centerY) < 200 && tries < 50);
  
  defensiveDrops.push({
    x,
    y,
    type: weaponType,
    icon: info.icon,
    name: info.description,
    spawnTime: now,
    lifetime: DEFENSIVE_DROP_LIFETIME,
    pulsePhase: Math.random() * Math.PI * 2,
    collected: false
  });
}

// Check if user collects a defensive weapon drop
export function checkDefensiveDropCollection(userIcon) {
  if (!userIcon) return;
  
  for (let i = defensiveDrops.length - 1; i >= 0; i--) {
    const drop = defensiveDrops[i];
    if (drop.collected) continue;
    
    const dist = Math.hypot(drop.x - userIcon.x, drop.y - userIcon.y);
    if (dist < 30) {
      currentDefensiveWeapon = drop.type;
      drop.collected = true;
      defensiveDrops.splice(i, 1);
      updateDefensiveWeaponUI();
      playWeaponCycleSound();
      return;
    }
  }
}

// Update defensive weapon drops
export function updateDefensiveDrops(dt) {
  const now = performance.now();
  
  defensiveDrops = defensiveDrops.filter(drop => {
    const age = now - drop.spawnTime;
    return age < drop.lifetime && !drop.collected;
  });
}

// Update defensive weapon effects
export function updateDefensiveWeaponEffects(dt, userIcon) {
  // Update active shields
  activeShields = activeShields.filter(shield => {
    shield.duration -= dt;
    if (shield.duration <= 0) return false;
    
    // Follow user
    if (shield.owner && userIcon) {
      shield.x = userIcon.x;
      shield.y = userIcon.y;
    }
    
    return true;
  });
  
  // Update counter-missiles
  for (let i = counterMissiles.length - 1; i >= 0; i--) {
    const missile = counterMissiles[i];
    missile.lifetime -= dt;
    
    if (missile.lifetime <= 0) {
      counterMissiles.splice(i, 1);
      continue;
    }
    
    // Find nearest target if none
    if (!missile.target || missile.target.hp <= 0) {
      let nearestDist = 300; // Max targeting range
      missile.target = null;
      
      bees.forEach(bee => {
        const dist = Math.hypot(bee.x - missile.x, bee.y - missile.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          missile.target = bee;
        }
      });
      
      if (!missile.target) {
        hunterBees.forEach(hunter => {
          const dist = Math.hypot(hunter.x - missile.x, hunter.y - missile.y);
          if (dist < nearestDist) {
            nearestDist = dist;
            missile.target = hunter;
          }
        });
      }
    }
    
    // Home towards target
    if (missile.target) {
      const dx = missile.target.x - missile.x;
      const dy = missile.target.y - missile.y;
      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(missile.vy, missile.vx);
      
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const turn = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), missile.turnRate);
      const newAngle = currentAngle + turn;
      
      missile.vx = Math.cos(newAngle) * missile.speed;
      missile.vy = Math.sin(newAngle) * missile.speed;
    }
    
    // Move missile
    missile.x += missile.vx * (dt * 0.06);
    missile.y += missile.vy * (dt * 0.06);
    
    // Add trail point
    missile.trail.push({ x: missile.x, y: missile.y, age: 0 });
    if (missile.trail.length > 15) missile.trail.shift();
    missile.trail.forEach(t => t.age += dt);
    
    // Check collision with bees
    for (let j = bees.length - 1; j >= 0; j--) {
      const bee = bees[j];
      const dist = Math.hypot(bee.x - missile.x, bee.y - missile.y);
      if (dist < 10) {
        bee.hp -= missile.damage;
        if (bee.hp <= 0) {
          createBeeExplosion(bee.x, bee.y);
          bees.splice(j, 1);
          addDestroyedBees(1);
        }
        counterMissiles.splice(i, 1);
        spawnImpactParticles(missile.x, missile.y, 'bulletBee', Math.atan2(missile.vy, missile.vx));
        break;
      }
    }
    
    // Check collision with hunter bees
    for (let j = hunterBees.length - 1; j >= 0; j--) {
      const hunter = hunterBees[j];
      const dist = Math.hypot(hunter.x - missile.x, hunter.y - missile.y);
      if (dist < hunter.size + 5) {
        if (hunter.shield > 0) {
          hunter.shield = Math.max(0, hunter.shield - missile.damage * 5);
        } else {
          hunter.hp -= missile.damage * 0.5;
          if (hunter.hp <= 0) {
            createHunterExplosion(hunter.x, hunter.y);
            hunterBees.splice(j, 1);
            addDestroyedBees(5);
          }
        }
        counterMissiles.splice(i, 1);
        spawnImpactParticles(missile.x, missile.y, 'bulletArmor', Math.atan2(missile.vy, missile.vx));
        break;
      }
    }
  }
  
  // Update cloak effect
  if (cloakEffect) {
    cloakEffect.duration -= dt;
    if (cloakEffect.duration <= 0) {
      cloakEffect = null;
    }
  }
}

// Check if user is shielded (for damage reduction)
export function isUserShielded() {
  return activeShields.length > 0;
}

// Check if user is cloaked (for enemy AI)
export function isUserCloaked() {
  return cloakEffect !== null;
}

// Update weapon UI
export function updateWeaponUI() {
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
export function updateBullets(dt, now, userIcon, gameStartTime, HIVE_PROTECTION_DURATION) {
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
            spawnImpactParticles(bullet.x, bullet.y, 'hiveShield', bullet.angle);
            triggerScreenShake(4, 150);
            playShieldHitSound();
          } else {
            userIcon.health = Math.max(0, userIcon.health - hiveBulletDamage);
            spawnImpactParticles(bullet.x, bullet.y, 'hiveHealth', bullet.angle);
            triggerScreenShake(8, 200);
            playHealthHitSound();
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
            spawnImpactParticles(bullet.x, bullet.y, 'laserShield', bullet.angle);
            triggerScreenShake(5, 150);
            playShieldHitSound();
          } else {
            userIcon.health = Math.max(0, userIcon.health - bullet.damage);
            spawnImpactParticles(bullet.x, bullet.y, 'laserHealth', bullet.angle);
            triggerScreenShake(10, 250);
            playHealthHitSound();
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
            // Spawn impact particles at bee location
            spawnImpactParticles(bee.x, bee.y, 'bulletBee', bullet.angle);
            if (bee.hp <= 0) {
              createBeeExplosion(bee.x, bee.y);
              bees.splice(i, 1);
              addDestroyedBees(1);
            }
          }
        }
        
        // Damage cell if not protected
        if (!hiveProtected) {
          // Spawn cell impact particles
          spawnImpactParticles(bullet.x, bullet.y, 'bulletCell', bullet.angle);
          if (hitCell.honey > 0) {
            hitCell.honey = Math.max(0, hitCell.honey - HONEY_DAMAGE_PER_HIT);
          } else {
            hitCell.hp -= 1;
            if (hitCell.hp <= 0) {
              const cellIndex = cells.indexOf(hitCell);
              if (cellIndex !== -1) {
                createCellExplosion(cellCenter.x, cellCenter.y);
                cells.splice(cellIndex, 1);
                addDestroyedCells(1);
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
          // Spawn impact particles
          spawnImpactParticles(bullet.x, bullet.y, 'bulletBee', bullet.angle);
          if (bee.hp <= 0) {
            createBeeExplosion(bee.x, bee.y);
            bees.splice(i, 1);
            addDestroyedBees(1);
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
            // Shield impact
            spawnImpactParticles(bullet.x, bullet.y, 'bulletShield', bullet.angle);
          } else {
            hunter.hp -= 1;
            // Armor impact
            spawnImpactParticles(bullet.x, bullet.y, 'bulletArmor', bullet.angle);
            if (hunter.hp <= 0) {
              createHunterExplosion(hunter.x, hunter.y);
              hunterBees.splice(i, 1);
              addDestroyedBees(5);
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
export function updateWeaponEffects(dt) {
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
          addDestroyedBees(1);
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
            addDestroyedBees(5);
          }
        }
      }
    }
    
    return true;
  });
}

// Update heavy weapon effects
export function updateHeavyWeaponEffects(dt) {
  // Singularities (gravity wells)
  singularities = singularities.filter(singularity => {
    singularity.duration -= dt;
    if (singularity.duration <= 0) return false;
    
    const progress = 1 - (singularity.duration / singularity.maxDuration);
    
    // Grow phase (first 20% of duration)
    if (progress < 0.2) {
      singularity.radius = singularity.maxRadius * (progress / 0.2);
      singularity.phase = 'grow';
    } 
    // Active phase (20% - 80%)
    else if (progress < 0.8) {
      singularity.radius = singularity.maxRadius;
      singularity.phase = 'active';
    }
    // Collapse phase (last 20%)
    else {
      singularity.radius = singularity.maxRadius * (1 - (progress - 0.8) / 0.2);
      singularity.phase = 'collapse';
    }
    
    // Pull and damage bees
    for (let i = bees.length - 1; i >= 0; i--) {
      const bee = bees[i];
      const dx = singularity.x - bee.x;
      const dy = singularity.y - bee.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < singularity.radius && dist > 0) {
        // Pull towards center
        const pullFactor = singularity.pullStrength * (1 - dist / singularity.radius) * (dt * 0.06);
        bee.x += (dx / dist) * pullFactor;
        bee.y += (dy / dist) * pullFactor;
        
        // Damage bees near the center
        if (dist < 30) {
          bee.hp -= singularity.damage * (dt * 0.06);
          if (bee.hp <= 0) {
            createBeeExplosion(bee.x, bee.y);
            bees.splice(i, 1);
            addDestroyedBees(1);
          }
        }
      }
    }
    
    // Pull and damage hunter bees
    for (let i = hunterBees.length - 1; i >= 0; i--) {
      const hunter = hunterBees[i];
      const dx = singularity.x - hunter.x;
      const dy = singularity.y - hunter.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < singularity.radius && dist > 0) {
        // Pull towards center (hunters resist more)
        const pullFactor = singularity.pullStrength * 0.5 * (1 - dist / singularity.radius) * (dt * 0.06);
        hunter.x += (dx / dist) * pullFactor;
        hunter.y += (dy / dist) * pullFactor;
        
        // Damage hunters near the center
        if (dist < 40) {
          const damage = singularity.damage * 0.3 * (dt * 0.06);
          if (hunter.shield > 0) {
            hunter.shield = Math.max(0, hunter.shield - damage * 5);
          } else {
            hunter.hp -= damage;
            if (hunter.hp <= 0) {
              createHunterExplosion(hunter.x, hunter.y);
              hunterBees.splice(i, 1);
              addDestroyedBees(5);
            }
          }
        }
      }
    }
    
    return true;
  });
  
  // Railgun beams
  railgunBeams = railgunBeams.filter(beam => {
    beam.duration -= dt;
    if (beam.duration <= 0) return false;
    
    const progress = 1 - (beam.duration / beam.maxDuration);
    
    // Beam extends quickly then fades
    if (progress < 0.2) {
      beam.length = beam.maxLength * (progress / 0.2);
    } else {
      beam.length = beam.maxLength;
    }
    
    // Only damage on first 50% of duration
    if (progress < 0.5) {
      // Check collision with bees along the beam
      const beamEndX = beam.x + Math.cos(beam.angle) * beam.length;
      const beamEndY = beam.y + Math.sin(beam.angle) * beam.length;
      
      for (let i = bees.length - 1; i >= 0; i--) {
        const bee = bees[i];
        const dist = pointToLineDistance(bee.x, bee.y, beam.x, beam.y, beamEndX, beamEndY);
        
        if (dist < beam.width + 4) {
          bee.hp -= beam.damage * (dt * 0.06);
          if (bee.hp <= 0) {
            createBeeExplosion(bee.x, bee.y);
            bees.splice(i, 1);
            addDestroyedBees(1);
          }
        }
      }
      
      for (let i = hunterBees.length - 1; i >= 0; i--) {
        const hunter = hunterBees[i];
        const dist = pointToLineDistance(hunter.x, hunter.y, beam.x, beam.y, beamEndX, beamEndY);
        
        if (dist < beam.width + hunter.size) {
          const damage = beam.damage * 0.5 * (dt * 0.06);
          if (hunter.shield > 0) {
            hunter.shield = Math.max(0, hunter.shield - damage * 3);
          } else {
            hunter.hp -= damage;
            if (hunter.hp <= 0) {
              createHunterExplosion(hunter.x, hunter.y);
              hunterBees.splice(i, 1);
              addDestroyedBees(5);
            }
          }
        }
      }
    }
    
    return true;
  });
  
  // Shockwaves
  shockwaves = shockwaves.filter(shockwave => {
    shockwave.duration -= dt;
    if (shockwave.duration <= 0) return false;
    
    const progress = 1 - (shockwave.duration / shockwave.maxDuration);
    
    // Expand phase (first 30%)
    if (progress < 0.3) {
      shockwave.radius = shockwave.maxRadius * (progress / 0.3);
      shockwave.phase = 'expand';
    } else {
      shockwave.radius = shockwave.maxRadius;
      shockwave.phase = 'linger';
    }
    
    // Stun all enemies in radius (only on expansion)
    if (shockwave.phase === 'expand') {
      bees.forEach(bee => {
        const dist = Math.hypot(bee.x - shockwave.x, bee.y - shockwave.y);
        if (dist < shockwave.radius) {
          bee.frozen = Math.max(bee.frozen || 0, shockwave.stunDuration);
          bee.stunned = true;
        }
      });
      
      hunterBees.forEach(hunter => {
        const dist = Math.hypot(hunter.x - shockwave.x, hunter.y - shockwave.y);
        if (dist < shockwave.radius) {
          hunter.frozen = Math.max(hunter.frozen || 0, shockwave.stunDuration * 0.5);
          hunter.stunned = true;
        }
      });
    }
    
    return true;
  });
}

// Helper: Calculate distance from point to line segment
function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// Reset combat state
export function resetCombat() {
  bullets = [];
  freezeBombs = [];
  electricBlasts = [];
  weapons.freeze.count = 3;
  weapons.electric.count = 3;
  weapons.warp.count = 2;
  currentWeaponIndex = 0;
  
  // Reset heavy weapons
  singularities = [];
  railgunBeams = [];
  shockwaves = [];
  currentHeavyWeapon = null;
  weaponDrops = [];
  lastWeaponDropTime = 0;
  weaponDropSpawnEnabled = true;
  
  // Reset defensive weapons
  activeShields = [];
  counterMissiles = [];
  cloakEffect = null;
  currentDefensiveWeapon = null;
  defensiveDrops = [];
  lastDefensiveDropTime = 0;
}

// Setter for bullets
export function setBullets(newBullets) { bullets = newBullets; }
