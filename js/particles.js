// ========================================
// Particle System for Explosions & Impacts
// ========================================

import { w, h } from './config.js';
import { ObjectPool } from './object-pool.js';

// Particle storage
export let particles = [];

// Impact effects storage (short-lived visual flashes/rings)
export let impactEffects = [];

const IMPACT_EFFECT_CONFIGS = {
  bulletBee: {
    type: 'flash',
    color: '#FFD700',
    maxRadius: 12,
    duration: 100
  },
  bulletShield: {
    type: 'ring',
    color: '#00FFFF',
    maxRadius: 20,
    duration: 150,
    lineWidth: 2
  },
  bulletArmor: {
    type: 'flash',
    color: '#FF6600',
    maxRadius: 15,
    duration: 120
  },
  bulletCell: {
    type: 'splash',
    color: '#FFD700',
    maxRadius: 18,
    duration: 180
  },
  hiveShield: {
    type: 'ring',
    color: '#00BFFF',
    maxRadius: 25,
    duration: 200,
    lineWidth: 3
  },
  hiveHealth: {
    type: 'burst',
    color: '#FF0000',
    maxRadius: 30,
    duration: 250
  },
  laserShield: {
    type: 'ring',
    color: '#FF00FF',
    maxRadius: 22,
    duration: 150,
    lineWidth: 2
  },
  laserHealth: {
    type: 'burst',
    color: '#FF1493',
    maxRadius: 28,
    duration: 200
  }
};

function createParticleShell() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 0,
    originalSize: 0,
    color: '#ffffff',
    lifetime: 0,
    maxLifetime: 0,
    gravity: 0,
    friction: 1,
    glow: false,
    sparkle: false,
    trails: false,
    debris: false,
    rotation: 0,
    rotationSpeed: 0,
    trail: null,
    fromImpact: false
  };
}

function createImpactParticleShell() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    size: 0,
    originalSize: 0,
    color: '#ffffff',
    lifetime: 0,
    maxLifetime: 0,
    gravity: 0,
    friction: 1,
    glow: true,
    sparkle: false,
    trails: false,
    debris: false,
    rotation: 0,
    rotationSpeed: 0,
    trail: null,
    fromImpact: true
  };
}

function createImpactEffectShell() {
  return {
    x: 0,
    y: 0,
    type: 'flash',
    color: '#ffffff',
    maxRadius: 0,
    radius: 0,
    duration: 0,
    maxDuration: 0,
    lineWidth: 2,
    alpha: 1
  };
}

const particlePool = new ObjectPool(createParticleShell);
const impactParticlePool = new ObjectPool(createImpactParticleShell);
const impactEffectPool = new ObjectPool(createImpactEffectShell);

function releaseParticle(p) {
  if (p.trail) {
    p.trail.length = 0;
  }
  particlePool.release(p);
}

function releaseImpactParticle(p) {
  impactParticlePool.release(p);
}

function retireParticleAt(idx) {
  const p = particles[idx];
  if (p.fromImpact) {
    impactParticlePool.release(p);
  } else {
    releaseParticle(p);
  }
  particles[idx] = particles[particles.length - 1];
  particles.pop();
}

function swapRemoveImpactEffect(idx) {
  impactEffectPool.release(impactEffects[idx]);
  impactEffects[idx] = impactEffects[impactEffects.length - 1];
  impactEffects.pop();
}

// Particle types with different visual properties
const PARTICLE_PRESETS = {
  bee: {
    colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFEC8B', '#FFD27F'],
    minSize: 2,
    maxSize: 5,
    minSpeed: 1.5,
    maxSpeed: 4,
    lifetime: 400,
    gravity: 0.03,
    friction: 0.98,
    glow: true,
    sparkle: true
  },
  hunter: {
    colors: ['#FF4500', '#FF6347', '#FF7F50', '#FFD700', '#FFFFFF'],
    minSize: 3,
    maxSize: 8,
    minSpeed: 2.5,
    maxSpeed: 6,
    lifetime: 600,
    gravity: 0.02,
    friction: 0.97,
    glow: true,
    sparkle: true,
    trails: true
  },
  cell: {
    colors: ['#DAA520', '#CD853F', '#B8860B', '#FFD700', '#D2691E'],
    minSize: 4,
    maxSize: 10,
    minSpeed: 1,
    maxSpeed: 3.5,
    lifetime: 500,
    gravity: 0.08,
    friction: 0.95,
    glow: false,
    sparkle: false,
    debris: true
  },
  user: {
    colors: ['#00FFFF', '#00BFFF', '#1E90FF', '#FFFFFF', '#87CEEB'],
    minSize: 3,
    maxSize: 7,
    minSpeed: 3,
    maxSpeed: 7,
    lifetime: 700,
    gravity: 0.015,
    friction: 0.96,
    glow: true,
    sparkle: true,
    trails: true
  }
};

// Impact particle presets (smaller, faster, shorter-lived)
const IMPACT_PRESETS = {
  // Player bullet hitting a bee
  bulletBee: {
    colors: ['#FFFF00', '#FFD700', '#FFA500', '#FFFFFF'],
    minSize: 1.5,
    maxSize: 3,
    minSpeed: 2,
    maxSpeed: 5,
    lifetime: 150,
    gravity: 0.02,
    friction: 0.92,
    count: 6
  },
  // Player bullet hitting hunter shield
  bulletShield: {
    colors: ['#00FFFF', '#00CED1', '#40E0D0', '#FFFFFF', '#7FFFD4'],
    minSize: 2,
    maxSize: 4,
    minSpeed: 3,
    maxSpeed: 6,
    lifetime: 200,
    gravity: 0.01,
    friction: 0.94,
    count: 10
  },
  // Player bullet hitting hunter armor
  bulletArmor: {
    colors: ['#FF6600', '#FF4500', '#FF8C00', '#FFFF00', '#FFFFFF'],
    minSize: 2,
    maxSize: 5,
    minSpeed: 2.5,
    maxSpeed: 5.5,
    lifetime: 180,
    gravity: 0.025,
    friction: 0.93,
    count: 8
  },
  // Player bullet hitting cell (honey splash)
  bulletCell: {
    colors: ['#FFD700', '#DAA520', '#F0E68C', '#FFFACD', '#FFA500'],
    minSize: 2,
    maxSize: 4,
    minSpeed: 1.5,
    maxSpeed: 4,
    lifetime: 250,
    gravity: 0.06,
    friction: 0.9,
    count: 8
  },
  // Hive bullet hitting player shield
  hiveShield: {
    colors: ['#00BFFF', '#1E90FF', '#87CEEB', '#FFFFFF', '#ADD8E6'],
    minSize: 2,
    maxSize: 5,
    minSpeed: 3,
    maxSpeed: 7,
    lifetime: 250,
    gravity: 0.015,
    friction: 0.93,
    count: 12
  },
  // Hive bullet hitting player health
  hiveHealth: {
    colors: ['#FF0000', '#FF4500', '#FF6347', '#DC143C', '#FFFFFF'],
    minSize: 2,
    maxSize: 5,
    minSpeed: 3,
    maxSpeed: 7,
    lifetime: 300,
    gravity: 0.02,
    friction: 0.92,
    count: 15
  },
  // Hunter laser hitting player shield
  laserShield: {
    colors: ['#FF00FF', '#FF1493', '#00FFFF', '#FFFFFF', '#DA70D6'],
    minSize: 2,
    maxSize: 4,
    minSpeed: 4,
    maxSpeed: 8,
    lifetime: 180,
    gravity: 0.008,
    friction: 0.95,
    count: 10
  },
  // Hunter laser hitting player health
  laserHealth: {
    colors: ['#FF0000', '#FF00FF', '#FF1493', '#FFFFFF', '#FF69B4'],
    minSize: 2,
    maxSize: 5,
    minSpeed: 4,
    maxSpeed: 8,
    lifetime: 220,
    gravity: 0.01,
    friction: 0.94,
    count: 14
  }
};

function initExplosionParticle(p, x, y, preset, angleOverride = null) {
  const config = PARTICLE_PRESETS[preset];
  const angle = angleOverride !== null ? angleOverride : Math.random() * Math.PI * 2;
  const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
  const size = config.minSize + Math.random() * (config.maxSize - config.minSize);

  p.x = x;
  p.y = y;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  p.size = size;
  p.originalSize = size;
  p.color = config.colors[Math.floor(Math.random() * config.colors.length)];
  p.lifetime = config.lifetime * (0.7 + Math.random() * 0.6);
  p.maxLifetime = p.lifetime;
  p.gravity = config.gravity;
  p.friction = config.friction;
  p.glow = config.glow;
  p.sparkle = config.sparkle && Math.random() > 0.5;
  p.trails = config.trails && Math.random() > 0.6;
  p.debris = !!config.debris;
  p.rotation = Math.random() * Math.PI * 2;
  p.rotationSpeed = (Math.random() - 0.5) * 0.3;
  p.fromImpact = false;
  if (config.trails) {
    if (!p.trail) p.trail = [];
    else p.trail.length = 0;
  } else {
    p.trail = null;
  }
}

function initImpactParticle(p, x, y, preset, angleOverride = null, incomingAngle = null) {
  const config = IMPACT_PRESETS[preset];
  if (!config) return false;

  let angle;
  if (incomingAngle !== null && angleOverride === null) {
    const reflectAngle = incomingAngle + Math.PI;
    angle = reflectAngle + (Math.random() - 0.5) * Math.PI * 0.8;
  } else {
    angle = angleOverride !== null ? angleOverride : Math.random() * Math.PI * 2;
  }

  const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
  const size = config.minSize + Math.random() * (config.maxSize - config.minSize);

  p.x = x;
  p.y = y;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  p.size = size;
  p.originalSize = size;
  p.color = config.colors[Math.floor(Math.random() * config.colors.length)];
  p.lifetime = config.lifetime * (0.6 + Math.random() * 0.8);
  p.maxLifetime = p.lifetime;
  p.gravity = config.gravity;
  p.friction = config.friction;
  p.glow = true;
  p.sparkle = Math.random() > 0.7;
  p.trails = false;
  p.debris = false;
  p.rotation = 0;
  p.rotationSpeed = 0;
  p.trail = null;
  p.fromImpact = true;
  return true;
}

// Spawn explosion particles
export function spawnExplosionParticles(x, y, type, count = null) {
  const config = PARTICLE_PRESETS[type];
  if (!config) return;

  const defaultCounts = {
    bee: 12,
    hunter: 25,
    cell: 18,
    user: 35
  };

  const particleCount = count || defaultCounts[type] || 15;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const p = particlePool.acquire();
    initExplosionParticle(p, x, y, type, angle);
    particles.push(p);
  }

  const scatterCount = Math.floor(particleCount * 0.4);
  for (let i = 0; i < scatterCount; i++) {
    const p = particlePool.acquire();
    initExplosionParticle(p, x, y, type);
    particles.push(p);
  }

  if (type === 'hunter' || type === 'user') {
    for (let i = 0; i < 8; i++) {
      const ember = particlePool.acquire();
      initExplosionParticle(ember, x, y, type);
      ember.vx *= 0.3;
      ember.vy *= 0.3;
      ember.lifetime *= 1.5;
      ember.maxLifetime = ember.lifetime;
      ember.size *= 0.6;
      ember.originalSize = ember.size;
      ember.glow = true;
      particles.push(ember);
    }
  }

  if (type === 'cell') {
    for (let i = 0; i < 6; i++) {
      const chunk = particlePool.acquire();
      initExplosionParticle(chunk, x, y, type);
      chunk.vx *= 0.5;
      chunk.vy *= 0.5;
      chunk.size *= 1.8;
      chunk.originalSize = chunk.size;
      chunk.gravity *= 2;
      chunk.debris = true;
      particles.push(chunk);
    }
  }
}

// Spawn impact particles at collision point
export function spawnImpactParticles(x, y, type, incomingAngle = null) {
  const config = IMPACT_PRESETS[type];
  if (!config) return;

  const count = config.count || 8;

  for (let i = 0; i < count; i++) {
    const p = impactParticlePool.acquire();
    if (initImpactParticle(p, x, y, type, null, incomingAngle)) {
      particles.push(p);
    } else {
      impactParticlePool.release(p);
    }
  }

  createImpactEffect(x, y, type);
}

function createImpactEffect(x, y, type) {
  const config = IMPACT_EFFECT_CONFIGS[type];
  if (!config) return;

  const e = impactEffectPool.acquire();
  e.x = x;
  e.y = y;
  e.type = config.type;
  e.color = config.color;
  e.maxRadius = config.maxRadius;
  e.radius = 0;
  e.duration = config.duration;
  e.maxDuration = config.duration;
  e.lineWidth = config.lineWidth || 2;
  e.alpha = 1;
  impactEffects.push(e);
}

// Update all particles
export function updateParticles(dt) {
  const dtNorm = dt * 0.06;

  for (let i = impactEffects.length - 1; i >= 0; i--) {
    const effect = impactEffects[i];
    effect.duration -= dt;

    const progress = 1 - effect.duration / effect.maxDuration;
    effect.radius = effect.maxRadius * progress;
    effect.alpha = 1 - progress;

    if (effect.duration <= 0) {
      swapRemoveImpactEffect(i);
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    if (p.trail) {
      p.trail.unshift({ x: p.x, y: p.y, alpha: 1 });
      if (p.trail.length > 5) p.trail.pop();
      const len = p.trail.length;
      for (let t = 0; t < len; t++) {
        p.trail[t].alpha = 1 - t / len;
      }
    }

    p.vy += p.gravity * dtNorm;
    p.vx *= p.friction;
    p.vy *= p.friction;

    p.x += p.vx * dtNorm;
    p.y += p.vy * dtNorm;

    if (p.debris) {
      p.rotation += p.rotationSpeed * dtNorm;
    }

    p.lifetime -= dt;

    const lifeProgress = p.lifetime / p.maxLifetime;
    p.size = p.originalSize * Math.max(0, lifeProgress);

    if (
      p.lifetime <= 0 ||
      p.size < 0.5 ||
      p.x < -50 ||
      p.x > w + 50 ||
      p.y < -50 ||
      p.y > h + 50
    ) {
      retireParticleAt(i);
    }
  }
}

// Reset particles
export function resetParticles() {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.fromImpact) {
      impactParticlePool.release(p);
    } else {
      releaseParticle(p);
    }
  }
  particles.length = 0;

  for (let i = 0; i < impactEffects.length; i++) {
    impactEffectPool.release(impactEffects[i]);
  }
  impactEffects.length = 0;
}

// Get particle count (for debugging/stats)
export function getParticleCount() {
  return particles.length;
}
