// Bees
let bees = [];
let lastBeeAdditionTime = 0; // Track when we last added bees (to prevent spam)
const BEE_ADDITION_COOLDOWN = 1000; // Add bees at most once per second
const BEE_MAX_HP = 3;
const BEE_ATTACK_RANGE = 200; // Distance at which bees detect and attack the user

function makeBee() {
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
    attackCooldown: 0, // Cooldown before returning to forage after losing sight
    frozen: 0, // Time remaining frozen (ms)
    frozenSpeed: 1.0 // Speed multiplier when frozen
  };
}

function createBees(count) {
  bees = [];
  for (let i = 0; i < count; i++) bees.push(makeBee());
}

// choose resource: priority % for 90%+ sites
function pickResourceForBee(bee, preferHighPct) {
  const roll = Math.random() * 100;
  let candidates = [];
  if (roll < preferHighPct) {
    candidates = resourceSpots.filter(r => r.amount > 0 && r.amount / r.max >= 0.9);
    if (candidates.length === 0) {
      candidates = resourceSpots.filter(r => r.amount > 0);
    }
  } else {
    candidates = resourceSpots.filter(r => r.amount > 0);
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Bee update logic (called from main update function)
function updateBees(dt, now, preferHighPct) {
  // bees
  bees.forEach(bee => {
    bee.wobble += bee.wobbleSpeed * dt * 0.001;
    
    // Check if user is within attack range
    let userDistance = Infinity;
    if (userIcon) {
      userDistance = Math.hypot(bee.x - userIcon.x, bee.y - userIcon.y);
    }

    // Attack behavior: bees attack if user is nearby
    if (userIcon && userDistance < BEE_ATTACK_RANGE) {
      if (bee.state === 'forage' || bee.state === 'idle') {
        bee.state = 'attack';
        bee.attackCooldown = 2000; // 2 seconds of attack persistence
      }
      if (bee.state === 'attack') {
        bee.target = { x: userIcon.x, y: userIcon.y };
        bee.attackCooldown = Math.max(0, bee.attackCooldown - dt);
      }
    } else {
      // User out of range - return to normal behavior after cooldown
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
    const frozenMultiplier = bee.frozen > 0 ? 0.1 : 1.0; // Almost stopped when frozen
    
    // Attacking bees move faster and more directly
    const speedMultiplier = bee.state === 'attack' ? 1.5 : 1.0;
    const wobbleMultiplier = bee.state === 'attack' ? 0.3 : 1.0; // Less wobble when attacking
    
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
        hiveHoney += bee.cargo;
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

  // Check if hive has 3 full cells and add 2 bees if total doesn't exceed max
  // Only check once per second to avoid adding bees too frequently
  if (now - lastBeeAdditionTime >= BEE_ADDITION_COOLDOWN) {
    const fullCells = cells.filter(c => c.honey >= honeyPerCell);
    const maxColonySize = +maxColonySizeInput.value;
    if (fullCells.length >= 3 && bees.length < maxColonySize) {
      const beesToAdd = Math.min(2, maxColonySize - bees.length);
      for (let i = 0; i < beesToAdd; i++) {
        bees.push(makeBee());
      }
      lastBeeAdditionTime = now;
    }
  }
}

