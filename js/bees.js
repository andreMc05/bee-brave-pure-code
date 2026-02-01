// ========================================
// Bees and Hunter Bee Logic
// ========================================

import {
  center,
  w,
  h,
  BEE_MAX_HP,
  BEE_ATTACK_RANGE,
  BEE_HUNT_SPEED_MULTIPLIER,
  BEE_ADDITION_COOLDOWN,
  HUNTER_BEE_HP,
  HUNTER_BEE_SHIELD,
  HUNTER_BEE_SPEED,
  HUNTER_BEE_SIZE,
  HUNTER_FIRE_COOLDOWN,
  HUNTER_LASER_SPEED,
  HUNTER_LASER_DAMAGE,
  HUNTER_SPAWN_DISTANCE,
  honeyPerCell,
  triggerScreenShake
} from './config.js';
import { 
  playBeeExplosionSound, 
  playHunterExplosionSound, 
  playHunterLaserSound,
  playDropshipWarningSound 
} from './audio.js';
import { spawnExplosionParticles } from './particles.js';
import { pickResourceForBee, areAllResourcesDepleted, updateTotalResources } from './resources.js';
import { cells, hiveHoney, addHiveHoney } from './cells.js';
import { isUserCloaked } from './combat.js';


// Bee storage
export let bees = [];
export let hunterBees = [];
export let dropship = null;
export let lastBeeAdditionTime = 0;

// Explosion arrays
export let hunterExplosions = [];
export let beeExplosions = [];

// Destroyed counts
export let destroyedBees = 0;
export let destroyedCells = 0;

// Create a regular bee
export function makeBee() {
  return {
    x: center.x + (Math.random() * 10 - 5),
    y: center.y + (Math.random() * 10 - 5),
    state: 'forage',
    speed: 1.7 + Math.random() * 0.5,
    cargo: 0,
    target: null,
    resourceSpot: null,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 3 + Math.random() * 2,
    hp: BEE_MAX_HP,
    maxHp: BEE_MAX_HP,
    attackCooldown: 0,
    frozen: 0,
    frozenSpeed: 1.0,
    // Animation properties
    wingPhase: Math.random() * Math.PI * 2,
    wingSpeed: 25 + Math.random() * 10, // Wing flap speed
    bobPhase: Math.random() * Math.PI * 2,
    bobSpeed: 2 + Math.random() * 1,
    stripeOffset: Math.random() * 0.2, // Slight variation in stripe pattern
    size: 0.9 + Math.random() * 0.2 // Size variation
  };
}

// Create bees
export function createBees(count) {
  bees = [];
  for (let i = 0; i < count; i++) bees.push(makeBee());
}

// Create hunter bee
export function makeHunterBee(x, y) {
  return {
    x,
    y,
    hp: HUNTER_BEE_HP,
    maxHp: HUNTER_BEE_HP,
    shield: HUNTER_BEE_SHIELD,
    maxShield: HUNTER_BEE_SHIELD,
    speed: HUNTER_BEE_SPEED,
    size: HUNTER_BEE_SIZE,
    fireCooldown: 0,
    angle: 0,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 2 + Math.random(),
    frozen: 0,
    // Animation properties
    wingPhase: Math.random() * Math.PI * 2,
    wingSpeed: 20 + Math.random() * 5,
    thrusterPhase: Math.random() * Math.PI * 2
  };
}

// Create explosion when hunter bee is destroyed
export function createHunterExplosion(x, y) {
  hunterExplosions.push({
    x: x,
    y: y,
    duration: 600,
    maxDuration: 600,
    radius: 5
  });
  // Spawn particles for the explosion
  spawnExplosionParticles(x, y, 'hunter');
  // Trigger screen shake for hunter explosion
  triggerScreenShake(8, 300);
  // Play explosion sound
  playHunterExplosionSound();
}

// Create smaller explosion when regular bee is destroyed
export function createBeeExplosion(x, y) {
  beeExplosions.push({
    x: x,
    y: y,
    duration: 300,
    maxDuration: 300,
    radius: 3
  });
  // Spawn particles for the explosion
  spawnExplosionParticles(x, y, 'bee');
  // Trigger small screen shake for bee explosion
  triggerScreenShake(2, 100);
  // Play bee explosion sound
  playBeeExplosionSound();
}

// Spawn dropship at a distance from the user
export function spawnDropship(userIcon) {
  if (dropship || !userIcon) return;
  
  const angle = Math.random() * Math.PI * 2;
  const spawnX = userIcon.x + Math.cos(angle) * HUNTER_SPAWN_DISTANCE;
  const spawnY = userIcon.y + Math.sin(angle) * HUNTER_SPAWN_DISTANCE;
  
  const targetX = Math.min(Math.max(spawnX, 50), w - 50);
  const targetY = Math.min(Math.max(spawnY, 50), h - 50);
  
  dropship = {
    x: targetX - Math.cos(angle) * 150,
    y: targetY - Math.sin(angle) * 150,
    targetX: targetX,
    targetY: targetY,
    phase: 'arriving',
    deployTimer: 0,
    angle: angle + Math.PI
  };
  
  // Play warning sound for incoming dropship
  playDropshipWarningSound();
}

// Update dropship movement and deployment
export function updateDropship(dt) {
  if (!dropship) return;
  
  if (dropship.phase === 'arriving') {
    const dx = dropship.targetX - dropship.x;
    const dy = dropship.targetY - dropship.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 5) {
      dropship.x += (dx / dist) * 3 * (dt * 0.06);
      dropship.y += (dy / dist) * 3 * (dt * 0.06);
    } else {
      dropship.phase = 'deploying';
      dropship.deployTimer = 1500;
    }
  } else if (dropship.phase === 'deploying') {
    dropship.deployTimer -= dt;
    
    if (dropship.deployTimer <= 0) {
      const spawnOffsets = [{ x: -20, y: 15 }, { x: -20, y: -15 }];
      spawnOffsets.forEach(offset => {
        const beeX = dropship.x + Math.cos(dropship.angle) * offset.x - Math.sin(dropship.angle) * offset.y;
        const beeY = dropship.y + Math.sin(dropship.angle) * offset.x + Math.cos(dropship.angle) * offset.y;
        hunterBees.push(makeHunterBee(beeX, beeY));
      });
      
      dropship.phase = 'leaving';
    }
  } else if (dropship.phase === 'leaving') {
    const awayAngle = dropship.angle + Math.PI;
    dropship.x += Math.cos(awayAngle) * 4 * (dt * 0.06);
    dropship.y += Math.sin(awayAngle) * 4 * (dt * 0.06);
    
    if (dropship.x < -100 || dropship.x > w + 100 || dropship.y < -100 || dropship.y > h + 100) {
      dropship = null;
    }
  }
}

// Update hunter bees
export function updateHunterBees(dt, userIcon, bullets) {
  const userCloaked = isUserCloaked();
  
  for (let i = hunterBees.length - 1; i >= 0; i--) {
    const hunter = hunterBees[i];
    
    if (!userIcon) continue;
    
    hunter.wobble += hunter.wobbleSpeed * dt * 0.001;
    
    // Update animation phases
    const frozenMultiplierAnim = hunter.frozen > 0 ? 0.3 : 1.0;
    hunter.wingPhase += hunter.wingSpeed * dt * 0.001 * frozenMultiplierAnim;
    hunter.thrusterPhase += 15 * dt * 0.001 * frozenMultiplierAnim;
    
    // Update frozen state
    if (hunter.frozen > 0) {
      hunter.frozen = Math.max(0, hunter.frozen - dt);
    }
    const frozenMultiplier = hunter.frozen > 0 ? 0.2 : 1.0;
    
    // Move toward user (or wander if cloaked)
    let dx, dy, dist;
    if (userCloaked) {
      // Hunter loses track - wander around last known position
      if (!hunter.lastKnownUserPos) {
        hunter.lastKnownUserPos = { x: userIcon.x, y: userIcon.y };
      }
      // Add some random wandering
      if (!hunter.wanderTarget || Math.random() < 0.01) {
        hunter.wanderTarget = {
          x: hunter.lastKnownUserPos.x + (Math.random() * 150 - 75),
          y: hunter.lastKnownUserPos.y + (Math.random() * 150 - 75)
        };
      }
      dx = hunter.wanderTarget.x - hunter.x;
      dy = hunter.wanderTarget.y - hunter.y;
      dist = Math.hypot(dx, dy);
      if (dist > 0) {
        hunter.angle = Math.atan2(dy, dx);
      }
    } else {
      // Normal targeting
      hunter.lastKnownUserPos = { x: userIcon.x, y: userIcon.y };
      hunter.wanderTarget = null;
      dx = userIcon.x - hunter.x;
      dy = userIcon.y - hunter.y;
      dist = Math.hypot(dx, dy);
      hunter.angle = Math.atan2(dy, dx);
    }
    
    const optimalRange = userCloaked ? 200 : 120; // Hunters stay further when confused
    if (dist > optimalRange) {
      hunter.x += (dx / dist) * hunter.speed * frozenMultiplier * (dt * 0.06);
      hunter.y += (dy / dist) * hunter.speed * frozenMultiplier * (dt * 0.06);
    } else if (dist < optimalRange * 0.6 && !userCloaked) {
      hunter.x -= (dx / dist) * hunter.speed * 0.5 * frozenMultiplier * (dt * 0.06);
      hunter.y -= (dy / dist) * hunter.speed * 0.5 * frozenMultiplier * (dt * 0.06);
    }
    
    // Add wobble
    hunter.x += Math.cos(hunter.wobble) * 0.3 * frozenMultiplier;
    hunter.y += Math.sin(hunter.wobble * 0.7) * 0.3 * frozenMultiplier;
    
    // Keep in bounds
    hunter.x = Math.min(Math.max(hunter.x, hunter.size), w - hunter.size);
    hunter.y = Math.min(Math.max(hunter.y, hunter.size), h - hunter.size);
    
    // Fire laser (only if user is visible)
    hunter.fireCooldown = Math.max(0, hunter.fireCooldown - dt);
    if (hunter.fireCooldown <= 0 && dist < 300 && hunter.frozen <= 0 && !userCloaked) {
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
      // Play laser sound
      playHunterLaserSound();
    }
    
    // Remove if destroyed
    if (hunter.hp <= 0) {
      createHunterExplosion(hunter.x, hunter.y);
      hunterBees.splice(i, 1);
      destroyedBees += 5;
    }
  }
}

// Update regular bees
export function updateBees(dt, now, preferHighPct, userIcon) {
  const allResourcesDepleted = areAllResourcesDepleted();
  
  bees.forEach((bee, beeIndex) => {
    bee.wobble += bee.wobbleSpeed * dt * 0.001;
    
    // Update animation phases
    const frozenMultiplierAnim = bee.frozen > 0 ? 0.2 : 1.0;
    let animSpeedMultiplier = 1.0;
    if (bee.state === 'hunt') animSpeedMultiplier = 1.5;
    else if (bee.state === 'attack') animSpeedMultiplier = 1.3;
    else if (bee.state === 'idle') animSpeedMultiplier = 0.7;
    
    bee.wingPhase += bee.wingSpeed * dt * 0.001 * animSpeedMultiplier * frozenMultiplierAnim;
    bee.bobPhase += bee.bobSpeed * dt * 0.001 * frozenMultiplierAnim;
    
    // Check distance to user (cloaked users are invisible to bees)
    let userDistance = Infinity;
    const userCloaked = isUserCloaked();
    if (userIcon && !userCloaked) {
      userDistance = Math.hypot(bee.x - userIcon.x, bee.y - userIcon.y);
    }

    // STRATEGIC HUNTING MODE (disabled when user is cloaked)
    if (allResourcesDepleted && userIcon && !userCloaked) {
      if (bee.state !== 'return' && bee.state !== 'hunt') {
        bee.state = 'hunt';
        bee.cargo = 0;
        bee.resourceSpot = null;
      }
      
      if (bee.state === 'hunt') {
        const totalHunters = bees.filter(b => b.state === 'hunt').length;
        const hunterIndex = bees.filter((b, i) => b.state === 'hunt' && i <= beeIndex).length - 1;
        
        const baseAngle = Math.atan2(userIcon.y - center.y, userIcon.x - center.x);
        const spreadAngle = (2 * Math.PI * hunterIndex) / Math.max(1, totalHunters);
        const flankAngle = baseAngle + spreadAngle;
        
        const approachDistance = 30;
        const flankDistance = Math.max(approachDistance, userDistance * 0.5);
        
        if (userDistance > approachDistance + 20) {
          const targetX = userIcon.x + Math.cos(flankAngle + Math.PI) * flankDistance;
          const targetY = userIcon.y + Math.sin(flankAngle + Math.PI) * flankDistance;
          bee.target = { x: targetX, y: targetY };
        } else {
          bee.target = { x: userIcon.x, y: userIcon.y };
        }
        
        if (Math.random() < 0.01) {
          bee.target = { x: userIcon.x + (Math.random() * 40 - 20), y: userIcon.y + (Math.random() * 40 - 20) };
        }
      }
    }
    // When cloaked during hunt mode, bees wander confused
    else if (allResourcesDepleted && userCloaked && bee.state === 'hunt') {
      // Bees lose track and wander
      if (!bee.confusedTarget || Math.random() < 0.02) {
        bee.confusedTarget = {
          x: bee.x + (Math.random() * 200 - 100),
          y: bee.y + (Math.random() * 200 - 100)
        };
      }
      bee.target = bee.confusedTarget;
    }
    // Normal attack behavior (disabled when user is cloaked)
    else if (userIcon && userDistance < BEE_ATTACK_RANGE && !userCloaked) {
      if (bee.state === 'forage' || bee.state === 'idle') {
        bee.state = 'attack';
        bee.attackCooldown = 2000;
      }
      if (bee.state === 'attack') {
        bee.target = { x: userIcon.x, y: userIcon.y };
        bee.attackCooldown = Math.max(0, bee.attackCooldown - dt);
      }
    } else if (userCloaked && bee.state === 'attack') {
      // User cloaked while being attacked - bee loses track
      bee.state = 'forage';
      bee.target = null;
      bee.attackCooldown = 0;
    } else {
      if (bee.state === 'attack') {
        bee.attackCooldown = Math.max(0, bee.attackCooldown - dt);
        if (bee.attackCooldown <= 0) {
          bee.state = 'forage';
          bee.target = null;
          bee.resourceSpot = null;
        }
      }
    }

    if (bee.state === 'forage' && (!bee.resourceSpot || bee.resourceSpot.amount <= 0)) {
      const spot = pickResourceForBee(bee, preferHighPct);
      if (spot) {
        bee.resourceSpot = spot;
        bee.target = { x: spot.x + (Math.random()*10-5), y: spot.y + (Math.random()*10-5) };
      } else {
        bee.state = 'idle';
        bee.target = { x: center.x + (Math.random()*40 - 20), y: center.y + (Math.random()*40 - 20) };
      }
    }

    const target = bee.target || { x: center.x, y: center.y };
    const dx = target.x - bee.x;
    const dy = target.y - bee.y;
    const dist = Math.hypot(dx, dy);
    const dirX = dist ? dx / dist : 0;
    const dirY = dist ? dy / dist : 0;
    const wobX = Math.cos(bee.wobble) * 0.8;
    const wobY = Math.sin(bee.wobble * 0.7) * 0.8;
    
    // Update frozen state
    if (bee.frozen > 0) {
      bee.frozen = Math.max(0, bee.frozen - dt);
    }
    const frozenMultiplier = bee.frozen > 0 ? 0.1 : 1.0;
    
    // Speed multipliers
    let speedMultiplier = 1.0;
    let wobbleMultiplier = 1.0;
    
    if (bee.state === 'hunt') {
      speedMultiplier = BEE_HUNT_SPEED_MULTIPLIER;
      wobbleMultiplier = 0.2;
    } else if (bee.state === 'attack') {
      speedMultiplier = 1.5;
      wobbleMultiplier = 0.3;
    }
    
    bee.x += (dirX * bee.speed * speedMultiplier * frozenMultiplier + wobX * wobbleMultiplier * frozenMultiplier) * (dt * 0.06);
    bee.y += (dirY * bee.speed * speedMultiplier * frozenMultiplier + wobY * wobbleMultiplier * frozenMultiplier) * (dt * 0.06);

    if (dist < 10) {
      if (bee.state === 'forage' && bee.resourceSpot) {
        const spot = bee.resourceSpot;
        const collect = Math.min(5, spot.amount);
        bee.cargo = collect;
        spot.amount -= collect;
        updateTotalResources();
        bee.state = 'return';
        bee.target = { x: center.x + (Math.random()*14-7), y: center.y + (Math.random()*14-7) };
      } else if (bee.state === 'return') {
        addHiveHoney(bee.cargo);
        bee.cargo = 0;
        if (cells.length) {
          const randomCell = cells[Math.floor(Math.random() * cells.length)];
          randomCell.honey = Math.min(honeyPerCell, randomCell.honey + 3);
        }
        bee.state = 'forage';
        bee.resourceSpot = null;
        bee.target = null;
      } else if (bee.state === 'idle') {
        bee.target = { x: center.x + (Math.random()*40 - 20), y: center.y + (Math.random()*40 - 20) };
      }
    }
  });

  // Check if hive has 3 full cells and add bees
  if (now - lastBeeAdditionTime >= BEE_ADDITION_COOLDOWN) {
    const fullCells = cells.filter(c => c.honey >= honeyPerCell);
    const maxColonySize = +document.getElementById('maxColonySize').value;
    if (fullCells.length >= 3 && bees.length < maxColonySize) {
      const beesToAdd = Math.min(2, maxColonySize - bees.length);
      for (let i = 0; i < beesToAdd; i++) {
        bees.push(makeBee());
      }
      lastBeeAdditionTime = now;
    }
  }
}

// Update explosions
export function updateExplosions(dt, cellExplosions) {
  // Hunter explosions
  for (let i = hunterExplosions.length - 1; i >= 0; i--) {
    const exp = hunterExplosions[i];
    exp.duration -= dt;
    const progress = 1 - (exp.duration / exp.maxDuration);
    exp.radius = 5 + progress * 35;
    
    if (exp.duration <= 0) {
      hunterExplosions.splice(i, 1);
    }
  }

  // Bee explosions
  for (let i = beeExplosions.length - 1; i >= 0; i--) {
    const exp = beeExplosions[i];
    exp.duration -= dt;
    const progress = 1 - (exp.duration / exp.maxDuration);
    exp.radius = 3 + progress * 15;
    
    if (exp.duration <= 0) {
      beeExplosions.splice(i, 1);
    }
  }

  // Cell explosions
  for (let i = cellExplosions.length - 1; i >= 0; i--) {
    const exp = cellExplosions[i];
    exp.duration -= dt;
    const progress = 1 - (exp.duration / exp.maxDuration);
    exp.radius = 10 + progress * 40;
    
    if (exp.duration <= 0) {
      cellExplosions.splice(i, 1);
    }
  }
}

// Reset bees
export function resetBees() {
  bees = [];
  hunterBees = [];
  dropship = null;
  lastBeeAdditionTime = 0;
  hunterExplosions = [];
  beeExplosions = [];
  destroyedBees = 0;
  destroyedCells = 0;
}

// Setters for module state
export function setDestroyedBees(val) { destroyedBees = val; }
export function addDestroyedBees(val) { destroyedBees += val; }
export function setDestroyedCells(val) { destroyedCells = val; }
export function addDestroyedCells(val) { destroyedCells += val; }
export function setBees(newBees) { bees = newBees; }
export function setHunterBees(newHunterBees) { hunterBees = newHunterBees; }
export function setDropship(newDropship) { dropship = newDropship; }
