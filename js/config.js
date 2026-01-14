// ========================================
// Game Configuration and Constants
// ========================================

// Canvas and display
let canvas, ctx;
let w, h, center;

// ========================================
// Parallax Background Configuration
// ========================================

// Parallax layers configuration
const PARALLAX_CONFIG = {
  // Far layer - distant stars
  farLayer: {
    count: 80,
    speedFactor: 0.02,   // Very slow movement
    minSize: 0.5,
    maxSize: 2,
    minAlpha: 0.2,
    maxAlpha: 0.6,
    color: [255, 255, 255]
  },
  // Mid layer - soft nebula clouds
  midLayer: {
    count: 12,
    speedFactor: 0.05,   // Medium speed
    minSize: 80,
    maxSize: 200,
    minAlpha: 0.02,
    maxAlpha: 0.06,
    colors: [
      [255, 200, 100],   // Warm gold
      [100, 150, 255],   // Cool blue
      [200, 150, 255]    // Soft purple
    ]
  },
  // Near layer - floating particles/pollen
  nearLayer: {
    count: 40,
    speedFactor: 0.12,   // Faster movement
    minSize: 1,
    maxSize: 4,
    minAlpha: 0.15,
    maxAlpha: 0.4,
    colors: [
      [255, 220, 100],   // Golden pollen
      [255, 200, 80],    // Amber
      [200, 180, 255]    // Light purple
    ]
  }
};

// Parallax state
let parallaxLayers = {
  far: [],
  mid: [],
  near: [],
  initialized: false
};

// Initialize parallax layers
function initParallaxLayers() {
  if (parallaxLayers.initialized) return;
  
  // Far layer - stars
  const farConfig = PARALLAX_CONFIG.farLayer;
  for (let i = 0; i < farConfig.count; i++) {
    parallaxLayers.far.push({
      x: Math.random() * (w || 1920),
      y: Math.random() * (h || 1080),
      size: farConfig.minSize + Math.random() * (farConfig.maxSize - farConfig.minSize),
      alpha: farConfig.minAlpha + Math.random() * (farConfig.maxAlpha - farConfig.minAlpha),
      twinkleSpeed: 0.001 + Math.random() * 0.003,
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }
  
  // Mid layer - nebula clouds
  const midConfig = PARALLAX_CONFIG.midLayer;
  for (let i = 0; i < midConfig.count; i++) {
    parallaxLayers.mid.push({
      x: Math.random() * (w || 1920),
      y: Math.random() * (h || 1080),
      size: midConfig.minSize + Math.random() * (midConfig.maxSize - midConfig.minSize),
      alpha: midConfig.minAlpha + Math.random() * (midConfig.maxAlpha - midConfig.minAlpha),
      color: midConfig.colors[Math.floor(Math.random() * midConfig.colors.length)],
      driftSpeed: 0.0002 + Math.random() * 0.0005,
      driftOffset: Math.random() * Math.PI * 2
    });
  }
  
  // Near layer - floating particles
  const nearConfig = PARALLAX_CONFIG.nearLayer;
  for (let i = 0; i < nearConfig.count; i++) {
    parallaxLayers.near.push({
      x: Math.random() * (w || 1920),
      y: Math.random() * (h || 1080),
      size: nearConfig.minSize + Math.random() * (nearConfig.maxSize - nearConfig.minSize),
      alpha: nearConfig.minAlpha + Math.random() * (nearConfig.maxAlpha - nearConfig.minAlpha),
      color: nearConfig.colors[Math.floor(Math.random() * nearConfig.colors.length)],
      bobSpeed: 0.001 + Math.random() * 0.002,
      bobOffset: Math.random() * Math.PI * 2,
      bobAmplitude: 5 + Math.random() * 15
    });
  }
  
  parallaxLayers.initialized = true;
}

// Reset parallax layers (on resize)
function resetParallaxLayers() {
  parallaxLayers.far = [];
  parallaxLayers.mid = [];
  parallaxLayers.near = [];
  parallaxLayers.initialized = false;
  initParallaxLayers();
}

// Hex grid constants
const HEX_SIZE = 26;
const CELL_MAX_HP = 5;
const HONEY_DAMAGE_PER_HIT = 2;
const HIVE_FIRE_COOLDOWN = 2000;
const HIVE_FIRE_RANGE = 500;
const HIVE_PROTECTION_DURATION = 10000;

// Honey constants
const honeyPerCell = 12;
const honeyToBuild = 15;

// Bee constants
const BEE_MAX_HP = 3;
const BEE_ATTACK_RANGE = 200;
const BEE_HUNT_SPEED_MULTIPLIER = 1.8;
const BEE_FLANK_ANGLE = Math.PI / 4;
const BEE_ADDITION_COOLDOWN = 1000;

// Hunter bee constants
const HUNTER_BEE_HP = 8;
const HUNTER_BEE_SHIELD = 25;
const HUNTER_BEE_SPEED = 2.5;
const HUNTER_BEE_SIZE = 12;
const HUNTER_FIRE_COOLDOWN = 1500;
const HUNTER_LASER_SPEED = 6;
const HUNTER_LASER_DAMAGE = 15;
const HUNTER_SPAWN_DISTANCE = 250;
const IDLE_THRESHOLD = 5000;

// Trail constants
const TRAIL_MAX_AGE = 800;
const TRAIL_SPACING = 3;

// Screen shake state
let screenShake = {
  intensity: 0,
  duration: 0,
  maxDuration: 0,
  offsetX: 0,
  offsetY: 0
};

// Trigger screen shake effect
function triggerScreenShake(intensity, duration) {
  // Only override if new shake is stronger or current one is nearly done
  if (intensity > screenShake.intensity || screenShake.duration < 50) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
    screenShake.maxDuration = duration;
  }
}

// Update screen shake state
function updateScreenShake(dt) {
  if (screenShake.duration > 0) {
    screenShake.duration = Math.max(0, screenShake.duration - dt);
    
    // Calculate decay factor (shake decreases as duration runs out)
    const decayFactor = screenShake.duration / screenShake.maxDuration;
    const currentIntensity = screenShake.intensity * decayFactor;
    
    // Random offset within intensity range
    screenShake.offsetX = (Math.random() * 2 - 1) * currentIntensity;
    screenShake.offsetY = (Math.random() * 2 - 1) * currentIntensity;
  } else {
    screenShake.offsetX = 0;
    screenShake.offsetY = 0;
    screenShake.intensity = 0;
  }
}

// Hex directions for neighbor calculation
const directions = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

// Initialize canvas and dimensions
function initCanvas() {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  center = { x: w * 0.53, y: h * 0.55 };
  if (typeof userIcon !== 'undefined' && userIcon) {
    userIcon.x = Math.min(Math.max(userIcon.x, 0), w);
    userIcon.y = Math.min(Math.max(userIcon.y, 0), h);
  }
  // Reset parallax layers on resize
  resetParallaxLayers();
}
