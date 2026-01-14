// ========================================
// Game Configuration and Constants
// ========================================

// Canvas and display
export let canvas = null;
export let ctx = null;
export let w = 0;
export let h = 0;
export let center = { x: 0, y: 0 };

// ========================================
// Rendering Cache System (Performance)
// ========================================

// Pre-computed hex angles (avoid trig every frame)
export const HEX_ANGLES = [];
for (let i = 0; i < 6; i++) {
  const a = Math.PI / 3 * i + Math.PI / 6;
  HEX_ANGLES.push({ cos: Math.cos(a), sin: Math.sin(a) });
}

// Cached gradients and patterns
export const renderCache = {
  initialized: false,
  backgroundGlow: null,
  // Off-screen canvas for parallax (updated only when needed)
  parallaxCanvas: null,
  parallaxCtx: null,
  parallaxDirty: true,
  lastParallaxOffset: { x: 0, y: 0 },
  // Cached common gradients
  honeyGradient: null,
  // Path2D cache for hexagons
  hexPath: null,
  // Visibility bounds (for culling)
  viewBounds: { left: 0, right: 0, top: 0, bottom: 0, padding: 100 }
};

// Initialize render cache
export function initRenderCache() {
  if (renderCache.initialized && renderCache.parallaxCanvas) return;
  
  // Create off-screen canvas for parallax background
  renderCache.parallaxCanvas = document.createElement('canvas');
  renderCache.parallaxCanvas.width = w || 1920;
  renderCache.parallaxCanvas.height = h || 1080;
  renderCache.parallaxCtx = renderCache.parallaxCanvas.getContext('2d');
  
  // Create reusable hex Path2D
  renderCache.hexPath = new Path2D();
  for (let i = 0; i < 6; i++) {
    const px = HEX_ANGLES[i].cos;
    const py = HEX_ANGLES[i].sin;
    i === 0 ? renderCache.hexPath.moveTo(px, py) : renderCache.hexPath.lineTo(px, py);
  }
  renderCache.hexPath.closePath();
  
  // Update view bounds
  updateViewBounds();
  
  renderCache.initialized = true;
  renderCache.parallaxDirty = true;
}

// Update view bounds for culling
export function updateViewBounds() {
  const pad = renderCache.viewBounds.padding;
  renderCache.viewBounds.left = -pad;
  renderCache.viewBounds.right = w + pad;
  renderCache.viewBounds.top = -pad;
  renderCache.viewBounds.bottom = h + pad;
}

// Check if point is visible (for culling)
export function isVisible(x, y, radius = 0) {
  const bounds = renderCache.viewBounds;
  return x + radius >= bounds.left && 
         x - radius <= bounds.right && 
         y + radius >= bounds.top && 
         y - radius <= bounds.bottom;
}

// Mark parallax as needing redraw
export function markParallaxDirty() {
  renderCache.parallaxDirty = true;
}

// Create cached background glow gradient
export function createBackgroundGlow() {
  if (!ctx) return null;
  const grd = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, w * 0.6);
  grd.addColorStop(0, 'rgba(255,255,255,0.03)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  renderCache.backgroundGlow = grd;
  return grd;
}

// ========================================
// Parallax Background Configuration
// ========================================

// Parallax layers configuration
export const PARALLAX_CONFIG = {
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
export const parallaxLayers = {
  far: [],
  mid: [],
  near: [],
  initialized: false
};

// Initialize parallax layers
export function initParallaxLayers() {
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
export function resetParallaxLayers() {
  parallaxLayers.far = [];
  parallaxLayers.mid = [];
  parallaxLayers.near = [];
  parallaxLayers.initialized = false;
  initParallaxLayers();
}

// Hex grid constants
export const HEX_SIZE = 26;
export const CELL_MAX_HP = 5;
export const HONEY_DAMAGE_PER_HIT = 2;
export const HIVE_FIRE_COOLDOWN = 2000;
export const HIVE_FIRE_RANGE = 500;
export const HIVE_PROTECTION_DURATION = 10000;

// Honey constants
export const honeyPerCell = 12;
export const honeyToBuild = 15;

// Bee constants
export const BEE_MAX_HP = 3;
export const BEE_ATTACK_RANGE = 200;
export const BEE_HUNT_SPEED_MULTIPLIER = 1.8;
export const BEE_FLANK_ANGLE = Math.PI / 4;
export const BEE_ADDITION_COOLDOWN = 1000;

// Hunter bee constants
export const HUNTER_BEE_HP = 8;
export const HUNTER_BEE_SHIELD = 25;
export const HUNTER_BEE_SPEED = 2.5;
export const HUNTER_BEE_SIZE = 12;
export const HUNTER_FIRE_COOLDOWN = 1500;
export const HUNTER_LASER_SPEED = 6;
export const HUNTER_LASER_DAMAGE = 15;
export const HUNTER_SPAWN_DISTANCE = 250;
export const IDLE_THRESHOLD = 5000;

// Trail constants
export const TRAIL_MAX_AGE = 800;
export const TRAIL_SPACING = 3;

// Screen shake state
export const screenShake = {
  intensity: 0,
  duration: 0,
  maxDuration: 0,
  offsetX: 0,
  offsetY: 0
};

// Trigger screen shake effect
export function triggerScreenShake(intensity, duration) {
  // Only override if new shake is stronger or current one is nearly done
  if (intensity > screenShake.intensity || screenShake.duration < 50) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
    screenShake.maxDuration = duration;
  }
}

// Update screen shake state
export function updateScreenShake(dt) {
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
export const directions = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 }
];

// Initialize canvas and dimensions
export function initCanvas(userIconRef) {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for performance
  resize(userIconRef);
  window.addEventListener('resize', () => resize(userIconRef));
}

export function resize(userIconRef) {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  center = { x: w * 0.53, y: h * 0.55 };
  if (userIconRef && userIconRef.current) {
    userIconRef.current.x = Math.min(Math.max(userIconRef.current.x, 0), w);
    userIconRef.current.y = Math.min(Math.max(userIconRef.current.y, 0), h);
  }
  // Reset parallax layers on resize
  resetParallaxLayers();
  
  // Reset render cache on resize
  renderCache.initialized = false;
  renderCache.backgroundGlow = null;
  if (renderCache.parallaxCanvas) {
    renderCache.parallaxCanvas.width = w;
    renderCache.parallaxCanvas.height = h;
  }
  initRenderCache();
  createBackgroundGlow();
}

// Setters for module-level variables
export function setCanvas(c) { canvas = c; }
export function setCtx(c) { ctx = c; }
export function setW(val) { w = val; }
export function setH(val) { h = val; }
export function setCenter(val) { center = val; }
