// ========================================
// Particle System for Explosions & Impacts
// ========================================

import { w, h } from './config.js';

// Particle storage
export let particles = [];

// Impact effects storage (short-lived visual flashes/rings)
export let impactEffects = [];

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

// Create a single particle
function createParticle(x, y, preset, angleOverride = null) {
  const config = PARTICLE_PRESETS[preset];
  const angle = angleOverride !== null ? angleOverride : Math.random() * Math.PI * 2;
  const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
  const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
  
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    originalSize: size,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    lifetime: config.lifetime * (0.7 + Math.random() * 0.6),
    maxLifetime: config.lifetime * (0.7 + Math.random() * 0.6),
    gravity: config.gravity,
    friction: config.friction,
    glow: config.glow,
    sparkle: config.sparkle && Math.random() > 0.5,
    trails: config.trails && Math.random() > 0.6,
    debris: config.debris,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    // Trail history for particles with trails
    trail: config.trails ? [] : null
  };
}

// Spawn explosion particles
export function spawnExplosionParticles(x, y, type, count = null) {
  const config = PARTICLE_PRESETS[type];
  if (!config) return;
  
  // Default particle counts based on explosion type
  const defaultCounts = {
    bee: 12,
    hunter: 25,
    cell: 18,
    user: 35
  };
  
  const particleCount = count || defaultCounts[type] || 15;
  
  // Create burst particles (radial)
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i / particleCount) + (Math.random() - 0.5) * 0.5;
    particles.push(createParticle(x, y, type, angle));
  }
  
  // Add some extra random scatter particles
  const scatterCount = Math.floor(particleCount * 0.4);
  for (let i = 0; i < scatterCount; i++) {
    particles.push(createParticle(x, y, type));
  }
  
  // For hunter/user explosions, add some slower "ember" particles
  if (type === 'hunter' || type === 'user') {
    for (let i = 0; i < 8; i++) {
      const ember = createParticle(x, y, type);
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
  
  // For cell explosions, add chunky debris
  if (type === 'cell') {
    for (let i = 0; i < 6; i++) {
      const chunk = createParticle(x, y, type);
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

// Create an impact particle
function createImpactParticle(x, y, preset, angleOverride = null, incomingAngle = null) {
  const config = IMPACT_PRESETS[preset];
  if (!config) return null;
  
  // If incoming angle provided, bias particles away from it (reflection)
  let angle;
  if (incomingAngle !== null && angleOverride === null) {
    // Reflect roughly opposite to incoming direction with spread
    const reflectAngle = incomingAngle + Math.PI;
    angle = reflectAngle + (Math.random() - 0.5) * Math.PI * 0.8;
  } else {
    angle = angleOverride !== null ? angleOverride : Math.random() * Math.PI * 2;
  }
  
  const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
  const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
  
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    originalSize: size,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    lifetime: config.lifetime * (0.6 + Math.random() * 0.8),
    maxLifetime: config.lifetime * (0.6 + Math.random() * 0.8),
    gravity: config.gravity,
    friction: config.friction,
    glow: true,
    sparkle: Math.random() > 0.7,
    trails: false,
    debris: false,
    rotation: 0,
    rotationSpeed: 0,
    trail: null
  };
}

// Spawn impact particles at collision point
export function spawnImpactParticles(x, y, type, incomingAngle = null) {
  const config = IMPACT_PRESETS[type];
  if (!config) return;
  
  const count = config.count || 8;
  
  // Create burst particles
  for (let i = 0; i < count; i++) {
    const particle = createImpactParticle(x, y, type, null, incomingAngle);
    if (particle) particles.push(particle);
  }
  
  // Create impact effect (flash/ring)
  createImpactEffect(x, y, type);
}

// Create visual impact effect (flash, ring, etc.)
function createImpactEffect(x, y, type) {
  const effectConfigs = {
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
  
  const config = effectConfigs[type];
  if (!config) return;
  
  impactEffects.push({
    x,
    y,
    type: config.type,
    color: config.color,
    maxRadius: config.maxRadius,
    radius: 0,
    duration: config.duration,
    maxDuration: config.duration,
    lineWidth: config.lineWidth || 2,
    alpha: 1
  });
}

// Update all particles
export function updateParticles(dt) {
  const dtNorm = dt * 0.06;
  
  // Update impact effects
  for (let i = impactEffects.length - 1; i >= 0; i--) {
    const effect = impactEffects[i];
    effect.duration -= dt;
    
    const progress = 1 - (effect.duration / effect.maxDuration);
    effect.radius = effect.maxRadius * progress;
    effect.alpha = 1 - progress;
    
    if (effect.duration <= 0) {
      impactEffects.splice(i, 1);
    }
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    
    // Update trail history
    if (p.trail) {
      p.trail.unshift({ x: p.x, y: p.y, alpha: 1 });
      if (p.trail.length > 5) p.trail.pop();
      // Fade trail points
      p.trail.forEach((point, idx) => {
        point.alpha = 1 - (idx / p.trail.length);
      });
    }
    
    // Apply physics
    p.vy += p.gravity * dtNorm;
    p.vx *= p.friction;
    p.vy *= p.friction;
    
    p.x += p.vx * dtNorm;
    p.y += p.vy * dtNorm;
    
    // Update rotation for debris
    if (p.debris) {
      p.rotation += p.rotationSpeed * dtNorm;
    }
    
    // Decrease lifetime
    p.lifetime -= dt;
    
    // Calculate life progress for size/alpha
    const lifeProgress = p.lifetime / p.maxLifetime;
    
    // Shrink as particle dies
    p.size = p.originalSize * Math.max(0, lifeProgress);
    
    // Remove dead particles or those off-screen
    if (p.lifetime <= 0 || p.size < 0.5 ||
        p.x < -50 || p.x > w + 50 || 
        p.y < -50 || p.y > h + 50) {
      particles.splice(i, 1);
    }
  }
}

// Reset particles
export function resetParticles() {
  particles = [];
  impactEffects = [];
}

// Get particle count (for debugging/stats)
export function getParticleCount() {
  return particles.length;
}
