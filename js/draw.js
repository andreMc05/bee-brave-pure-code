// ========================================
// Drawing/Rendering Functions (Optimized)
// ========================================

import {
  ctx,
  w,
  h,
  center,
  HEX_SIZE,
  CELL_MAX_HP,
  honeyPerCell,
  HIVE_PROTECTION_DURATION,
  PARALLAX_CONFIG,
  parallaxLayers,
  initParallaxLayers,
  screenShake,
  // Rendering cache imports
  HEX_ANGLES,
  renderCache,
  initRenderCache,
  isVisible,
  markParallaxDirty
} from './config.js';
import { resourceSpots } from './resources.js';
import { cells, hiveHoney, hexToPixel, cellExplosions } from './cells.js';
import { bees, hunterBees, dropship, hunterExplosions, beeExplosions } from './bees.js';
import { bullets, freezeBombs, electricBlasts } from './combat.js';
import { userIcon, spawnIndicator, userExplosion, userTrail } from './user.js';
import { particles, impactEffects } from './particles.js';

// Threshold for parallax offset change to trigger redraw
const PARALLAX_THRESHOLD = 5;

// Draw parallax background layers (OPTIMIZED with off-screen canvas)
export function drawParallaxBackground(now) {
  // Initialize layers and cache if needed
  if (!parallaxLayers.initialized) {
    initParallaxLayers();
  }
  initRenderCache();
  
  // Calculate parallax offset based on user position
  let offsetX = 0;
  let offsetY = 0;
  if (userIcon) {
    offsetX = (userIcon.x - center.x) / w;
    offsetY = (userIcon.y - center.y) / h;
  }
  
  // Check if we need to redraw parallax (offset changed significantly or marked dirty)
  const offsetChanged = Math.abs(offsetX - renderCache.lastParallaxOffset.x) > 0.01 ||
                        Math.abs(offsetY - renderCache.lastParallaxOffset.y) > 0.01;
  
  if (renderCache.parallaxDirty || offsetChanged) {
    renderParallaxToCache(now, offsetX, offsetY);
    renderCache.lastParallaxOffset.x = offsetX;
    renderCache.lastParallaxOffset.y = offsetY;
    renderCache.parallaxDirty = false;
  }
  
  // Draw cached parallax (fast blit operation)
  ctx.drawImage(renderCache.parallaxCanvas, 0, 0);
}

// Render parallax to off-screen canvas (called only when needed)
function renderParallaxToCache(now, offsetX, offsetY) {
  const pCtx = renderCache.parallaxCtx;
  
  // Clear with dark background
  pCtx.fillStyle = '#0a0a0f';
  pCtx.fillRect(0, 0, w, h);
  
  // === FAR LAYER (Stars) - Batched by alpha range ===
  const farConfig = PARALLAX_CONFIG.farLayer;
  const starsByAlpha = new Map();
  
  parallaxLayers.far.forEach(star => {
    const parallaxX = star.x - offsetX * w * farConfig.speedFactor;
    const parallaxY = star.y - offsetY * h * farConfig.speedFactor;
    const drawX = ((parallaxX % w) + w) % w;
    const drawY = ((parallaxY % h) + h) % h;
    
    // Simplified twinkle (less expensive)
    const twinkle = 0.7 + 0.3 * Math.sin(now * star.twinkleSpeed + star.twinkleOffset);
    const alpha = Math.round(star.alpha * twinkle * 10) / 10; // Round to reduce unique styles
    
    if (!starsByAlpha.has(alpha)) starsByAlpha.set(alpha, []);
    starsByAlpha.get(alpha).push({ x: drawX, y: drawY, size: star.size });
  });
  
  // Draw stars batched by alpha
  starsByAlpha.forEach((stars, alpha) => {
    pCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    pCtx.beginPath();
    stars.forEach(s => {
      pCtx.moveTo(s.x + s.size, s.y);
      pCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    });
    pCtx.fill();
  });
  
  // === MID LAYER (Nebula Clouds) - Reduced gradient creation ===
  const midConfig = PARALLAX_CONFIG.midLayer;
  parallaxLayers.mid.forEach(cloud => {
    const drift = Math.sin(now * cloud.driftSpeed + cloud.driftOffset) * 20;
    const parallaxX = cloud.x - offsetX * w * midConfig.speedFactor + drift;
    const parallaxY = cloud.y - offsetY * h * midConfig.speedFactor;
    const buffer = cloud.size;
    const drawX = ((parallaxX + buffer) % (w + buffer * 2)) - buffer;
    const drawY = ((parallaxY + buffer) % (h + buffer * 2)) - buffer;
    
    // Skip if not visible
    if (drawX < -cloud.size || drawX > w + cloud.size || 
        drawY < -cloud.size || drawY > h + cloud.size) return;
    
    // Use simpler radial fill (less gradient stops)
    const gradient = pCtx.createRadialGradient(drawX, drawY, 0, drawX, drawY, cloud.size);
    gradient.addColorStop(0, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha})`);
    gradient.addColorStop(1, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, 0)`);
    
    pCtx.fillStyle = gradient;
    pCtx.beginPath();
    pCtx.arc(drawX, drawY, cloud.size, 0, Math.PI * 2);
    pCtx.fill();
  });
  
  // === NEAR LAYER (Floating Particles) - Simplified ===
  const nearConfig = PARALLAX_CONFIG.nearLayer;
  parallaxLayers.near.forEach(particle => {
    const bob = Math.sin(now * particle.bobSpeed + particle.bobOffset) * particle.bobAmplitude;
    const parallaxX = particle.x - offsetX * w * nearConfig.speedFactor;
    const parallaxY = particle.y - offsetY * h * nearConfig.speedFactor + bob;
    const drawX = ((parallaxX % w) + w) % w;
    const drawY = ((parallaxY % h) + h) % h;
    
    // Draw simplified particle (single circle instead of gradient)
    pCtx.globalAlpha = particle.alpha;
    pCtx.fillStyle = `rgb(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]})`;
    pCtx.beginPath();
    pCtx.arc(drawX, drawY, particle.size, 0, Math.PI * 2);
    pCtx.fill();
  });
  pCtx.globalAlpha = 1;
}

// Draw hexagon cell (OPTIMIZED with pre-computed angles)
export function drawHex(x, y, size, progress, honeyFill, cellHp, cellMaxHp) {
  // Use pre-computed angles instead of calculating trig each time
  const scaledSize = size * progress;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Build hex path using pre-computed angles
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const px = HEX_ANGLES[i].cos * scaledSize;
    const py = HEX_ANGLES[i].sin * scaledSize;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  
  const hpRatio = cellHp / cellMaxHp;
  const isDamaged = hpRatio < 1;
  const damageLevel = isDamaged ? 1 - hpRatio : 0;
  
  // Set stroke style (pre-computed color values)
  ctx.strokeStyle = isDamaged 
    ? `rgba(${255 - damageLevel * 100 | 0},${235 - damageLevel * 150 | 0},${179 - damageLevel * 100 | 0},${0.8 - damageLevel * 0.3})`
    : 'rgba(255,235,179,0.8)';
  
  const isCompletelyFilled = honeyFill >= honeyPerCell;
  
  if (isCompletelyFilled) {
    ctx.fillStyle = '#ffb300';
    ctx.fill();
  } else {
    ctx.fillStyle = isDamaged 
      ? `rgba(${29 - damageLevel * 10 | 0},${25 - damageLevel * 10 | 0},${12 - damageLevel * 5 | 0},${0.6 + damageLevel * 0.2})`
      : 'rgba(29,25,12,0.6)';
    ctx.fill();
    
    // Draw honey fill level
    if (honeyFill > 0) {
      const f = Math.min(1, honeyFill / honeyPerCell);
      ctx.save();
      ctx.clip();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = '#ffb300';
      const fillHeight = size * 1.5 * f;
      ctx.fillRect(-size, size - fillHeight, size * 2, fillHeight + 2);
      ctx.restore();
    }
  }
  
  // Draw damage cracks (optimized - fewer calculations)
  if (isDamaged) {
    ctx.strokeStyle = `rgba(100,50,50,${0.3 + damageLevel * 0.4})`;
    ctx.lineWidth = 1;
    const crackCount = (damageLevel * 3 | 0) + 1;
    const startDist = size * 0.3;
    const endDist = scaledSize * 0.8;
    const angleStep = Math.PI * 2 / crackCount;
    
    for (let i = 0; i < crackCount; i++) {
      const angle = angleStep * i;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(cos * startDist, sin * startDist);
      ctx.lineTo(cos * endDist, sin * endDist);
      ctx.stroke();
    }
  }
  
  ctx.stroke();
  ctx.restore();
}

// Main draw function (OPTIMIZED)
export function draw(gameOver, gameStarted, gameStartTime) {
  // Always draw parallax background (even on start/game over screens for ambiance)
  const now = performance.now();
  drawParallaxBackground(now);
  
  if (gameOver || !gameStarted) return;

  // Apply screen shake offset
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);

  // Background glow - use cached gradient
  if (renderCache.backgroundGlow) {
    ctx.fillStyle = renderCache.backgroundGlow;
    ctx.fillRect(0, 0, w, h);
  }

  // Draw game elements (ordered back to front)
  drawResources();
  drawCells();
  drawHiveProtection(gameStartTime);
  drawBees();
  drawDropship();
  drawHunterBees();
  drawExplosions();
  drawParticles();
  drawImpactEffects();
  drawBullets();
  drawWeaponEffects();
  drawSpawnIndicator();
  drawUserExplosion();
  drawUserTrail();
  drawUserIcon();
  
  // Restore canvas from screen shake offset
  ctx.restore();
}

// Draw resources (OPTIMIZED with culling)
export function drawResources() {
  const TWO_PI = Math.PI * 2;
  
  resourceSpots.forEach(spot => {
    // Visibility culling
    const maxRadius = 42; // 12 + 30
    if (!isVisible(spot.x, spot.y, maxRadius)) return;
    
    const pct = spot.max > 0 ? spot.amount / spot.max : 0;
    const r = 12 + pct * 30;
    
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, r, 0, TWO_PI);
    ctx.fillStyle = `rgba(130, 177, 255, ${0.13 + 0.4 * pct})`;
    ctx.fill();
    ctx.strokeStyle = pct > 0 ? 'rgba(130,177,255,0.8)' : 'rgba(130,177,255,0.25)';
    ctx.stroke();
  });
}

// Draw hive cells (OPTIMIZED with culling)
export function drawCells() {
  for (let c of cells) {
    const p = hexToPixel(c.q, c.r);
    // Visibility culling
    if (!isVisible(p.x, p.y, HEX_SIZE)) continue;
    drawHex(p.x, p.y, HEX_SIZE, c.buildProg, c.honey, c.hp || CELL_MAX_HP, c.maxHp || CELL_MAX_HP);
  }
}

// Draw hive protection shield (OPTIMIZED - cached radius calculation)
let cachedShieldRadius = 0;
let lastCellCount = 0;

export function drawHiveProtection(gameStartTime) {
  const protectionTimeRemaining = HIVE_PROTECTION_DURATION - (performance.now() - gameStartTime);
  if (protectionTimeRemaining <= 0) return;
  
  const TWO_PI = Math.PI * 2;
  
  // Only recalculate shield radius if cell count changed
  if (cells.length !== lastCellCount) {
    let maxDist = 0;
    for (let c of cells) {
      const p = hexToPixel(c.q, c.r);
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) maxDist = dist;
    }
    cachedShieldRadius = maxDist + HEX_SIZE * 1.5;
    lastCellCount = cells.length;
  }
  
  const shieldRadius = cachedShieldRadius;
  const now = performance.now();
  const pulsePhase = now * 0.003;
  const pulseIntensity = 0.15 + 0.1 * Math.sin(pulsePhase);
  
  ctx.save();
  
  // Shield gradient (simplified - fewer stops)
  const shieldGradient = ctx.createRadialGradient(
    center.x, center.y, shieldRadius * 0.7,
    center.x, center.y, shieldRadius
  );
  shieldGradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
  shieldGradient.addColorStop(1, `rgba(100, 200, 255, ${pulseIntensity})`);
  
  ctx.fillStyle = shieldGradient;
  ctx.beginPath();
  ctx.arc(center.x, center.y, shieldRadius, 0, TWO_PI);
  ctx.fill();
  
  ctx.strokeStyle = `rgba(150, 220, 255, ${0.4 + 0.2 * Math.sin(pulsePhase)})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Timer text
  const secondsRemaining = Math.ceil(protectionTimeRemaining / 1000);
  ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`HIVE PROTECTED: ${secondsRemaining}s`, center.x, center.y - shieldRadius - 10);
  
  ctx.restore();
}

// Draw bees (OPTIMIZED - reduced save/restore, visibility culling)
export function drawBees() {
  const TWO_PI = Math.PI * 2;
  const now = Date.now();
  
  bees.forEach(bee => {
    // Visibility culling (bee size ~20px radius with effects)
    if (!isVisible(bee.x, bee.y, 25)) return;
    
    const scale = bee.size || 1;
    const tx = (bee.target ? bee.target.x : center.x) - bee.x;
    const ty = (bee.target ? bee.target.y : center.y) - bee.y;
    const angle = Math.atan2(ty, tx);
    const hpRatio = bee.hp / bee.maxHp;
    const bobOffset = Math.sin(bee.bobPhase) * 0.8 * scale;
    const wingFlap = Math.sin(bee.wingPhase) * 0.5 + 0.5;
    
    ctx.save();
    ctx.translate(bee.x, bee.y + bobOffset);
    
    // Draw shadow (simplified - single operation)
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(2, 6, 4 * scale, 1.5 * scale, 0, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.rotate(angle);
    
    // Determine colors based on state (simplified lookups)
    let bodyColor, stripeColor, wingColor, glowColor = null;
    
    if (bee.frozen > 0) {
      bodyColor = hpRatio < 0.33 ? '#8bb8d8' : hpRatio < 0.66 ? '#9ac4e0' : '#a0d0ff';
      stripeColor = '#4080b0';
      wingColor = 'rgba(180, 220, 255, 0.7)';
      glowColor = 'rgba(100, 180, 255, 0.3)';
    } else if (bee.state === 'hunt') {
      bodyColor = hpRatio < 0.33 ? '#e65100' : hpRatio < 0.66 ? '#ff9800' : '#ff4444';
      stripeColor = '#8b0000';
      wingColor = 'rgba(255, 150, 150, 0.5)';
      glowColor = 'rgba(255, 50, 50, 0.4)';
    } else if (bee.state === 'attack') {
      bodyColor = hpRatio < 0.33 ? '#e65100' : hpRatio < 0.66 ? '#ff9800' : '#ff8c00';
      stripeColor = '#4a2500';
      wingColor = 'rgba(255, 200, 150, 0.5)';
      glowColor = 'rgba(255, 100, 50, 0.25)';
    } else {
      bodyColor = hpRatio < 0.33 ? '#e65100' : hpRatio < 0.66 ? '#ff9800' : 
                  bee.state === 'return' ? '#ffd54f' : '#ffc107';
      stripeColor = bee.state === 'return' ? '#5d4037' : '#3d2914';
      wingColor = 'rgba(200, 220, 255, 0.6)';
    }
    
    // Draw glow effect for aggressive states (combined rotation)
    if (glowColor) {
      const pulseIntensity = 0.7 + 0.3 * Math.sin(now * 0.008 + bee.wobble);
      ctx.save();
      ctx.rotate(-angle);
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale * pulseIntensity, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }
    
    // Draw wings (optimized - fewer save/restore)
    const wingAngleTop = -0.3 - wingFlap * 0.8;
    const wingAngleBottom = 0.3 + wingFlap * 0.8;
    
    ctx.fillStyle = wingColor;
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)';
    ctx.lineWidth = 0.5;
    
    // Top wing
    ctx.save();
    ctx.translate(-scale, -2 * scale);
    ctx.rotate(wingAngleTop);
    ctx.beginPath();
    ctx.ellipse(0, -3 * scale, 3 * scale, 5 * scale, -0.2, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Bottom wing
    ctx.save();
    ctx.translate(-scale, 2 * scale);
    ctx.rotate(wingAngleBottom);
    ctx.beginPath();
    ctx.ellipse(0, 3 * scale, 3 * scale, 5 * scale, 0.2, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Wing motion blur (only for fast states)
    if (bee.state === 'hunt' || bee.state === 'attack') {
      ctx.globalAlpha = 0.2;
      ctx.save();
      ctx.translate(-scale, -2 * scale);
      ctx.rotate(wingAngleTop - 0.3);
      ctx.beginPath();
      ctx.ellipse(0, -3 * scale, 2.5 * scale, 4.5 * scale, -0.2, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(-scale, 2 * scale);
      ctx.rotate(wingAngleBottom + 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 3 * scale, 2.5 * scale, 4.5 * scale, 0.2, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    
    // Draw body (abdomen)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(-2 * scale, 0, 4 * scale, 2.8 * scale, 0, 0, TWO_PI);
    ctx.fill();
    
    // Draw stripes on abdomen (batched)
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 1.2 * scale;
    const stripeStart = bee.stripeOffset || 0;
    for (let i = 0; i < 3; i++) {
      const stripeX = -4 * scale + (i + stripeStart) * 2 * scale;
      ctx.beginPath();
      ctx.moveTo(stripeX, -2.5 * scale);
      ctx.quadraticCurveTo(stripeX + 0.5 * scale, 0, stripeX, 2.5 * scale);
      ctx.stroke();
    }
    
    // Draw thorax
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.ellipse(2 * scale, 0, 2.5 * scale, 2 * scale, 0, 0, TWO_PI);
    ctx.fill();
    
    // Fuzzy texture
    ctx.fillStyle = bodyColor;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(1.5 * scale, -0.8 * scale, 0.8 * scale, 0, TWO_PI);
    ctx.arc(2.5 * scale, 0.5 * scale, 0.6 * scale, 0, TWO_PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Draw head
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.ellipse(5 * scale, 0, 1.8 * scale, 1.5 * scale, 0, 0, TWO_PI);
    ctx.fill();
    
    // Draw eyes (batched)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(5.5 * scale, -0.8 * scale, 0.7 * scale, 0.9 * scale, 0.2, 0, TWO_PI);
    ctx.ellipse(5.5 * scale, 0.8 * scale, 0.7 * scale, 0.9 * scale, -0.2, 0, TWO_PI);
    ctx.fill();
    
    // Eye shine (batched)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(5.8 * scale, -0.6 * scale, 0.25 * scale, 0, TWO_PI);
    ctx.arc(5.8 * scale, 1.0 * scale, 0.25 * scale, 0, TWO_PI);
    ctx.fill();
    
    // Draw antennae (batched)
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 0.6 * scale;
    ctx.lineCap = 'round';
    const antennaWave = Math.sin(bee.wobble * 2) * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(6 * scale, -1.2 * scale);
    ctx.quadraticCurveTo(8 * scale, -2 * scale + antennaWave, 9 * scale, -2.5 * scale + antennaWave);
    ctx.moveTo(6 * scale, 1.2 * scale);
    ctx.quadraticCurveTo(8 * scale, 2 * scale - antennaWave, 9 * scale, 2.5 * scale - antennaWave);
    ctx.stroke();
    
    // Draw stinger (for aggressive bees)
    if (bee.state === 'hunt' || bee.state === 'attack') {
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 0);
      ctx.lineTo(-8 * scale, 0);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8 * scale, 0);
      ctx.lineTo(-9 * scale, 0);
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.8 * scale;
      ctx.stroke();
    }
    
    // Draw cargo (pollen)
    if (bee.cargo > 0) {
      ctx.fillStyle = '#ffcc00';
      ctx.strokeStyle = '#cc9900';
      ctx.lineWidth = 0.4 * scale;
      ctx.beginPath();
      ctx.ellipse(-scale, 3.5 * scale, 1.2 * scale, 0.8 * scale, 0.3, 0, TWO_PI);
      ctx.ellipse(-scale, -3.5 * scale, 1.2 * scale, 0.8 * scale, -0.3, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      
      // Pollen dust particles
      ctx.rotate(-angle);
      for (let i = 0; i < 3; i++) {
        const particlePhase = bee.wobble + i * 2;
        const px = (-10 - i * 4 + Math.sin(particlePhase) * 2) * scale;
        const py = Math.cos(particlePhase * 1.3) * 3 * scale;
        ctx.fillStyle = `rgba(255, 200, 50, ${0.6 - i * 0.2})`;
        ctx.beginPath();
        ctx.arc(px, py, (1.2 - i * 0.3) * scale, 0, TWO_PI);
        ctx.fill();
      }
      ctx.rotate(angle);
    }
    
    // Draw health bar if damaged
    if (bee.hp < bee.maxHp) {
      ctx.rotate(-angle);
      const barWidth = 12 * scale;
      const barHeight = 2 * scale;
      const barX = -barWidth / 2;
      const barY = -10 * scale;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    }
    
    ctx.restore();
  });
}

// Draw dropship (OPTIMIZED - visibility culling)
export function drawDropship() {
  if (!dropship) return;
  if (!isVisible(dropship.x, dropship.y, 40)) return;
  
  const TWO_PI = Math.PI * 2;
  
  ctx.save();
  ctx.translate(dropship.x, dropship.y);
  ctx.rotate(dropship.angle);
  
  // Main body
  ctx.fillStyle = '#445566';
  ctx.strokeStyle = '#667788';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(15, 15);
  ctx.lineTo(-25, 12);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-25, -12);
  ctx.lineTo(15, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  
  // Cockpit
  ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(18, 0, 6, 0, TWO_PI);
  ctx.fill();
  
  // Engines (batched)
  ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
  ctx.beginPath();
  ctx.arc(-28, 8, 4, 0, TWO_PI);
  ctx.arc(-28, -8, 4, 0, TWO_PI);
  ctx.fill();
  
  // Deploy effect
  if (dropship.phase === 'deploying') {
    const deployProgress = 1 - (dropship.deployTimer / 1500);
    const alpha = 1 - deployProgress;
    
    ctx.strokeStyle = `rgba(255, 100, 100, ${0.8 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-15, 0, 10 + deployProgress * 10, 0, TWO_PI);
    ctx.stroke();
    
    ctx.strokeStyle = `rgba(255, 200, 100, ${0.6 * alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(-15, 10 + deployProgress * 30);
    ctx.moveTo(-15, -10);
    ctx.lineTo(-15, -10 - deployProgress * 30);
    ctx.stroke();
  }
  
  ctx.restore();
}

// Draw hunter bees (OPTIMIZED - visibility culling)
export function drawHunterBees() {
  const TWO_PI = Math.PI * 2;
  const now = Date.now();
  
  hunterBees.forEach(hunter => {
    // Visibility culling (hunter size ~25px + effects)
    if (!isVisible(hunter.x, hunter.y, hunter.size + 20)) return;
    
    const hpRatio = hunter.hp / hunter.maxHp;
    const wingFlap = Math.sin(hunter.wingPhase) * 0.5 + 0.5;
    const thrusterPulse = Math.sin(hunter.thrusterPhase) * 0.3 + 0.7;
    
    ctx.save();
    ctx.translate(hunter.x, hunter.y);
    
    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(3, 8, hunter.size * 0.8, hunter.size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.rotate(hunter.angle);
    
    // Shield effect
    if (hunter.shield > 0) {
      const shieldRatio = hunter.shield / hunter.maxShield;
      const shieldPulse = Math.sin(Date.now() * 0.005) * 0.15 + 0.85;
      
      // Outer shield glow
      ctx.beginPath();
      ctx.arc(0, 0, (hunter.size + 8) * shieldPulse, 0, Math.PI * 2);
      const shieldGrad = ctx.createRadialGradient(0, 0, hunter.size * 0.5, 0, 0, hunter.size + 8);
      shieldGrad.addColorStop(0, 'rgba(100, 150, 255, 0)');
      shieldGrad.addColorStop(0.7, `rgba(100, 180, 255, ${shieldRatio * 0.15})`);
      shieldGrad.addColorStop(1, `rgba(150, 200, 255, ${shieldRatio * 0.4})`);
      ctx.fillStyle = shieldGrad;
      ctx.fill();
      
      // Shield arc indicator
      ctx.beginPath();
      ctx.arc(0, 0, hunter.size + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
      ctx.strokeStyle = `rgba(100, 200, 255, ${shieldRatio * 0.9})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Determine colors
    let bodyColor = `rgb(${255}, ${Math.floor(50 + hpRatio * 100)}, 50)`;
    let accentColor = 'rgba(255, 200, 100, 0.8)';
    let eyeGlow = '#ff3333';
    
    if (hunter.frozen > 0) {
      bodyColor = 'rgb(150, 180, 255)';
      accentColor = 'rgba(100, 200, 255, 0.8)';
      eyeGlow = '#8080ff';
    }
    
    // Draw mechanical wings
    ctx.save();
    const wingExtend = 0.6 + wingFlap * 0.4;
    
    // Top wing
    ctx.save();
    ctx.translate(-hunter.size * 0.2, -hunter.size * 0.3);
    ctx.rotate(-0.4 - wingFlap * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-hunter.size * 0.3, -hunter.size * wingExtend);
    ctx.lineTo(-hunter.size * 0.6, -hunter.size * wingExtend * 0.9);
    ctx.lineTo(-hunter.size * 0.4, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(80, 80, 100, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 120, 150, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    
    // Bottom wing
    ctx.save();
    ctx.translate(-hunter.size * 0.2, hunter.size * 0.3);
    ctx.rotate(0.4 + wingFlap * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-hunter.size * 0.3, hunter.size * wingExtend);
    ctx.lineTo(-hunter.size * 0.6, hunter.size * wingExtend * 0.9);
    ctx.lineTo(-hunter.size * 0.4, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(80, 80, 100, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 120, 150, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    
    // Draw thrusters (back)
    ctx.save();
    ctx.translate(-hunter.size * 0.5, 0);
    
    // Thruster housings
    ctx.fillStyle = '#334';
    ctx.beginPath();
    ctx.ellipse(0, -hunter.size * 0.35, hunter.size * 0.2, hunter.size * 0.15, 0, 0, Math.PI * 2);
    ctx.ellipse(0, hunter.size * 0.35, hunter.size * 0.2, hunter.size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Thruster flames
    const flameLength = hunter.size * 0.4 * thrusterPulse;
    const flameGrad = ctx.createLinearGradient(-flameLength, 0, 0, 0);
    flameGrad.addColorStop(0, 'rgba(255, 100, 50, 0)');
    flameGrad.addColorStop(0.3, 'rgba(255, 150, 50, 0.6)');
    flameGrad.addColorStop(0.7, 'rgba(255, 200, 100, 0.8)');
    flameGrad.addColorStop(1, 'rgba(255, 255, 200, 0.9)');
    
    ctx.fillStyle = hunter.frozen > 0 ? 'rgba(100, 150, 255, 0.5)' : flameGrad;
    ctx.beginPath();
    ctx.moveTo(0, -hunter.size * 0.35 - hunter.size * 0.1);
    ctx.lineTo(-flameLength, -hunter.size * 0.35);
    ctx.lineTo(0, -hunter.size * 0.35 + hunter.size * 0.1);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, hunter.size * 0.35 - hunter.size * 0.1);
    ctx.lineTo(-flameLength, hunter.size * 0.35);
    ctx.lineTo(0, hunter.size * 0.35 + hunter.size * 0.1);
    ctx.fill();
    ctx.restore();
    
    // Main body
    ctx.beginPath();
    ctx.moveTo(hunter.size, 0);
    ctx.quadraticCurveTo(hunter.size * 0.7, -hunter.size * 0.5, -hunter.size * 0.3, -hunter.size * 0.6);
    ctx.lineTo(-hunter.size * 0.5, -hunter.size * 0.4);
    ctx.lineTo(-hunter.size * 0.4, 0);
    ctx.lineTo(-hunter.size * 0.5, hunter.size * 0.4);
    ctx.lineTo(-hunter.size * 0.3, hunter.size * 0.6);
    ctx.quadraticCurveTo(hunter.size * 0.7, hunter.size * 0.5, hunter.size, 0);
    ctx.closePath();
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Armor plates
    ctx.beginPath();
    ctx.moveTo(hunter.size * 0.3, -hunter.size * 0.35);
    ctx.lineTo(-hunter.size * 0.1, -hunter.size * 0.4);
    ctx.lineTo(-hunter.size * 0.15, 0);
    ctx.lineTo(-hunter.size * 0.1, hunter.size * 0.4);
    ctx.lineTo(hunter.size * 0.3, hunter.size * 0.35);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Cockpit/head
    ctx.beginPath();
    ctx.ellipse(hunter.size * 0.5, 0, hunter.size * 0.35, hunter.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#223';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Eyes (menacing red)
    const eyePulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    
    ctx.beginPath();
    ctx.ellipse(hunter.size * 0.55, -hunter.size * 0.15, 3, 4, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = eyeGlow;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hunter.size * 0.55, hunter.size * 0.15, 3, 4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = eyeGlow;
    ctx.fill();
    
    // Eye glow
    ctx.beginPath();
    ctx.arc(hunter.size * 0.55, -hunter.size * 0.15, 6 * eyePulse, 0, Math.PI * 2);
    ctx.arc(hunter.size * 0.55, hunter.size * 0.15, 6 * eyePulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 50, 50, ${0.2 * eyePulse})`;
    ctx.fill();
    
    // Eye highlights
    ctx.beginPath();
    ctx.arc(hunter.size * 0.6, -hunter.size * 0.12, 1.2, 0, Math.PI * 2);
    ctx.arc(hunter.size * 0.6, hunter.size * 0.18, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    
    // Weapon mount
    ctx.fillStyle = '#445';
    ctx.beginPath();
    ctx.rect(hunter.size * 0.7, -2, hunter.size * 0.4, 4);
    ctx.fill();
    ctx.strokeStyle = '#667';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Health and shield bars
    ctx.rotate(-hunter.angle);
    const barWidth = hunter.size * 2;
    const barHeight = 4;
    
    // Health bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barWidth / 2, -hunter.size - 14, barWidth, barHeight);
    
    // Health bar fill
    ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(-barWidth / 2, -hunter.size - 14, barWidth * hpRatio, barHeight);
    
    // Shield bar
    if (hunter.shield > 0) {
      const shieldRatio = hunter.shield / hunter.maxShield;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-barWidth / 2, -hunter.size - 8, barWidth, 2);
      ctx.fillStyle = '#64c8ff';
      ctx.fillRect(-barWidth / 2, -hunter.size - 8, barWidth * shieldRatio, 2);
    }
    
    ctx.restore();
  });
}

// Draw explosions (OPTIMIZED - visibility culling, simplified gradients)
export function drawExplosions() {
  const TWO_PI = Math.PI * 2;
  
  // Hunter explosions
  hunterExplosions.forEach(exp => {
    if (!isVisible(exp.x, exp.y, exp.radius)) return;
    
    const progress = 1 - (exp.duration / exp.maxDuration);
    const alpha = 1 - progress;
    const radius = exp.radius;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    // Outer glow (simplified - fewer gradient stops)
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    outerGradient.addColorStop(0, `rgba(255, 100, 50, ${alpha * 0.9})`);
    outerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TWO_PI);
    ctx.fill();
    
    // Inner core
    ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, TWO_PI);
    ctx.fill();
    
    // Particles (batched by color)
    const particleColor = `rgba(255, ${200 - progress * 100 | 0}, ${50 + progress * 50 | 0}, ${alpha * 0.9})`;
    ctx.fillStyle = particleColor;
    const particleSize = 2 + (1 - progress) * 2;
    for (let i = 0; i < 8; i++) {
      const angle = TWO_PI * i / 8 + progress * Math.PI;
      const dist = radius * (0.3 + progress * 0.7);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, particleSize, 0, TWO_PI);
      ctx.fill();
    }
    
    ctx.restore();
  });

  // Bee explosions (simplified)
  beeExplosions.forEach(exp => {
    if (!isVisible(exp.x, exp.y, exp.radius)) return;
    
    const progress = 1 - (exp.duration / exp.maxDuration);
    const alpha = 1 - progress;
    const radius = exp.radius;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    // Single gradient
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(255, 220, 100, ${alpha * 0.9})`);
    gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TWO_PI);
    ctx.fill();
    
    // Sparks
    const sparkColor = `rgba(255, ${220 - progress * 70 | 0}, ${100 - progress * 50 | 0}, ${alpha * 0.8})`;
    ctx.fillStyle = sparkColor;
    const sparkSize = 1 + (1 - progress) * 1.5;
    for (let i = 0; i < 5; i++) {
      const angle = TWO_PI * i / 5 + progress * TWO_PI;
      const dist = radius * (0.4 + progress * 0.6);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, sparkSize, 0, TWO_PI);
      ctx.fill();
    }
    
    ctx.restore();
  });

  // Cell explosions (simplified)
  cellExplosions.forEach(exp => {
    if (!isVisible(exp.x, exp.y, exp.radius)) return;
    
    const progress = 1 - (exp.duration / exp.maxDuration);
    const alpha = 1 - progress;
    const radius = exp.radius;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    // Outer glow
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    outerGradient.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.8})`);
    outerGradient.addColorStop(1, 'rgba(150, 100, 30, 0)');
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TWO_PI);
    ctx.fill();
    
    // Debris particles (simplified - circles instead of hexagons for speed)
    const debrisSize = 4 + (1 - progress) * 4;
    ctx.fillStyle = `rgba(200, 160, 50, ${alpha * 0.7})`;
    for (let i = 0; i < 6; i++) {
      const angle = TWO_PI * i / 6 + progress * Math.PI * 0.5;
      const dist = radius * (0.3 + progress * 0.8);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, debrisSize, 0, TWO_PI);
      ctx.fill();
    }
    
    // Shockwave ring
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, TWO_PI);
    ctx.stroke();
    
    ctx.restore();
  });
}

// Draw particles (OPTIMIZED - visibility culling, batched by color)
export function drawParticles() {
  if (particles.length === 0) return;
  
  const TWO_PI = Math.PI * 2;
  
  // Group particles by color for batched rendering
  const particlesByColor = new Map();
  const glowParticles = [];
  const trailParticles = [];
  const debrisParticles = [];
  
  particles.forEach(p => {
    // Visibility culling
    if (!isVisible(p.x, p.y, p.size * 3)) return;
    
    const lifeProgress = p.lifetime / p.maxLifetime;
    
    // Separate special particles
    if (p.trails && p.trail && p.trail.length > 0) {
      trailParticles.push({ p, lifeProgress });
    }
    if (p.glow) {
      glowParticles.push({ p, lifeProgress });
    }
    if (p.debris) {
      debrisParticles.push({ p, lifeProgress });
    }
    
    // Group regular particles by color
    if (!particlesByColor.has(p.color)) {
      particlesByColor.set(p.color, []);
    }
    particlesByColor.get(p.color).push({ p, lifeProgress });
  });
  
  // Draw particle trails first (behind main particles)
  trailParticles.forEach(({ p, lifeProgress }) => {
    if (!p.trail) return;
    
    ctx.beginPath();
    p.trail.forEach((point, idx) => {
      const trailAlpha = point.alpha * lifeProgress * 0.4;
      const trailSize = p.size * (1 - idx / p.trail.length) * 0.6;
      if (trailAlpha > 0.05 && trailSize > 0.5) {
        ctx.fillStyle = p.color.replace(')', `, ${trailAlpha})`).replace('rgb', 'rgba').replace('rgba(', 'rgba(');
        // Handle hex colors
        if (p.color.startsWith('#')) {
          const r = parseInt(p.color.slice(1, 3), 16);
          const g = parseInt(p.color.slice(3, 5), 16);
          const b = parseInt(p.color.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${trailAlpha})`;
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, trailSize, 0, TWO_PI);
        ctx.fill();
      }
    });
  });
  
  // Draw glow effects (behind main particles)
  glowParticles.forEach(({ p, lifeProgress }) => {
    const glowAlpha = lifeProgress * 0.3;
    const glowSize = p.size * 2.5;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // Parse hex color for glow
    let r = 255, g = 200, b = 100;
    if (p.color.startsWith('#')) {
      r = parseInt(p.color.slice(1, 3), 16);
      g = parseInt(p.color.slice(3, 5), 16);
      b = parseInt(p.color.slice(5, 7), 16);
    }
    
    const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
    glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowSize, 0, TWO_PI);
    ctx.fill();
    
    ctx.restore();
  });
  
  // Draw debris particles (chunky rotating pieces)
  debrisParticles.forEach(({ p, lifeProgress }) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    
    const alpha = Math.min(1, lifeProgress * 1.5);
    
    // Parse hex color
    let r = 200, g = 160, b = 50;
    if (p.color.startsWith('#')) {
      r = parseInt(p.color.slice(1, 3), 16);
      g = parseInt(p.color.slice(3, 5), 16);
      b = parseInt(p.color.slice(5, 7), 16);
    }
    
    // Draw chunky hexagonal debris
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (TWO_PI * i / 6) - Math.PI / 6;
      const x = Math.cos(angle) * p.size;
      const y = Math.sin(angle) * p.size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Add highlight edge
    ctx.strokeStyle = `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 30)}, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  });
  
  // Draw main particles batched by color
  particlesByColor.forEach((particleList, color) => {
    // Parse color for alpha modification
    let r = 255, g = 200, b = 100;
    if (color.startsWith('#')) {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }
    
    particleList.forEach(({ p, lifeProgress }) => {
      const alpha = Math.min(1, lifeProgress * 1.5);
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
      ctx.fill();
      
      // Add sparkle effect for sparkling particles
      if (p.sparkle && lifeProgress > 0.3) {
        const sparkleIntensity = Math.sin(Date.now() * 0.02 + p.x + p.y) * 0.5 + 0.5;
        const sparkleAlpha = alpha * sparkleIntensity * 0.8;
        const sparkleSize = p.size * 0.4;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sparkleSize, 0, TWO_PI);
        ctx.fill();
      }
    });
  });
}

// Draw impact effects (flashes, rings, bursts)
export function drawImpactEffects() {
  if (impactEffects.length === 0) return;
  
  const TWO_PI = Math.PI * 2;
  
  impactEffects.forEach(effect => {
    // Visibility culling
    if (!isVisible(effect.x, effect.y, effect.maxRadius)) return;
    
    const progress = 1 - (effect.duration / effect.maxDuration);
    
    // Parse color for RGBA
    let r = 255, g = 255, b = 255;
    if (effect.color.startsWith('#')) {
      r = parseInt(effect.color.slice(1, 3), 16);
      g = parseInt(effect.color.slice(3, 5), 16);
      b = parseInt(effect.color.slice(5, 7), 16);
    }
    
    ctx.save();
    ctx.translate(effect.x, effect.y);
    
    if (effect.type === 'flash') {
      // Simple flash - bright center that fades
      const flashAlpha = effect.alpha * 0.9;
      const innerRadius = effect.radius * 0.3;
      
      // Outer glow
      const gradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, effect.radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${flashAlpha})`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${flashAlpha * 0.5})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, effect.radius, 0, TWO_PI);
      ctx.fill();
      
      // Bright center
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius, 0, TWO_PI);
      ctx.fill();
      
    } else if (effect.type === 'ring') {
      // Expanding ring effect
      const ringAlpha = effect.alpha * 0.8;
      
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
      ctx.lineWidth = effect.lineWidth * (1 + progress);
      ctx.beginPath();
      ctx.arc(0, 0, effect.radius, 0, TWO_PI);
      ctx.stroke();
      
      // Inner glow
      const glowAlpha = effect.alpha * 0.4;
      const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.radius * 0.5);
      innerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
      innerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(0, 0, effect.radius * 0.5, 0, TWO_PI);
      ctx.fill();
      
    } else if (effect.type === 'burst') {
      // Burst effect - multiple rays shooting out
      const burstAlpha = effect.alpha * 0.85;
      const rayCount = 8;
      
      // Central flash
      const flashGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.radius * 0.4);
      flashGradient.addColorStop(0, `rgba(255, 255, 255, ${burstAlpha})`);
      flashGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${burstAlpha * 0.6})`);
      flashGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(0, 0, effect.radius * 0.4, 0, TWO_PI);
      ctx.fill();
      
      // Rays
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${burstAlpha * 0.7})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < rayCount; i++) {
        const angle = (TWO_PI * i / rayCount) + progress * 0.3;
        const innerDist = effect.radius * 0.2;
        const outerDist = effect.radius * (0.5 + progress * 0.5);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * innerDist, Math.sin(angle) * innerDist);
        ctx.lineTo(Math.cos(angle) * outerDist, Math.sin(angle) * outerDist);
        ctx.stroke();
      }
      
      // Outer ring
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${burstAlpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, effect.radius, 0, TWO_PI);
      ctx.stroke();
      
    } else if (effect.type === 'splash') {
      // Splash effect - like liquid droplets
      const splashAlpha = effect.alpha * 0.8;
      const dropletCount = 6;
      
      // Central splash
      const splashGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, effect.radius * 0.5);
      splashGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${splashAlpha})`);
      splashGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = splashGradient;
      ctx.beginPath();
      ctx.arc(0, 0, effect.radius * 0.5, 0, TWO_PI);
      ctx.fill();
      
      // Droplets flying outward
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${splashAlpha * 0.7})`;
      for (let i = 0; i < dropletCount; i++) {
        const angle = (TWO_PI * i / dropletCount) + progress * 0.5;
        const dist = effect.radius * (0.4 + progress * 0.6);
        const dropletSize = 3 * (1 - progress * 0.5);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, dropletSize, 0, TWO_PI);
        ctx.fill();
      }
    }
    
    ctx.restore();
  });
}

// Draw bullets (OPTIMIZED - visibility culling, reduced state changes)
export function drawBullets() {
  const TWO_PI = Math.PI * 2;
  
  bullets.forEach(bullet => {
    // Visibility culling
    if (!isVisible(bullet.x, bullet.y, bullet.radius * 4)) return;
    
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.angle);
    
    if (bullet.isHiveBullet) {
      // Hive bullet - combined drawing
      ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      // Trail
      ctx.strokeStyle = 'rgba(255, 180, 50, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-bullet.radius * 2, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
    } else if (bullet.isHunterLaser) {
      // Hunter laser - combined drawing
      ctx.fillStyle = 'rgba(255, 50, 100, 0.95)';
      ctx.strokeStyle = 'rgba(255, 150, 200, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      // Trail
      ctx.strokeStyle = 'rgba(255, 100, 150, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-bullet.radius * 4, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      // Core
      ctx.fillStyle = 'rgba(255, 200, 220, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius * 0.5, 0, TWO_PI);
      ctx.fill();
    } else {
      // Regular bullet - combined drawing
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.strokeStyle = 'rgba(255, 200, 200, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
      // Trail
      ctx.strokeStyle = 'rgba(255, 150, 150, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-bullet.radius * 2, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

// Draw weapon effects (OPTIMIZED - visibility culling, batched operations)
export function drawWeaponEffects() {
  const TWO_PI = Math.PI * 2;
  
  // Freeze bombs
  freezeBombs.forEach(bomb => {
    if (!isVisible(bomb.x, bomb.y, bomb.radius)) return;
    
    const progress = bomb.duration / bomb.maxDuration;
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    
    // Main circle
    ctx.fillStyle = `rgba(100, 200, 255, ${0.2 * progress})`;
    ctx.strokeStyle = `rgba(150, 220, 255, ${0.6 * progress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, bomb.radius, 0, TWO_PI);
    ctx.fill();
    ctx.stroke();
    
    // Ice particles (batched)
    ctx.fillStyle = `rgba(200, 240, 255, ${0.8 * progress})`;
    const dist = bomb.radius * 0.7;
    for (let i = 0; i < 8; i++) {
      const angle = TWO_PI * i / 8;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 3, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  });

  // Electric blasts
  electricBlasts.forEach(blast => {
    if (!isVisible(blast.x, blast.y, blast.radius)) return;
    
    const progress = blast.duration / blast.maxDuration;
    ctx.save();
    ctx.translate(blast.x, blast.y);
    
    // Outer ring
    ctx.strokeStyle = `rgba(255, 255, 100, ${0.8 * progress})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, blast.radius, 0, TWO_PI);
    ctx.stroke();
    
    // Lightning bolts (batched)
    ctx.strokeStyle = `rgba(255, 255, 150, ${progress})`;
    ctx.lineWidth = 2;
    const startDist = blast.radius * 0.3;
    const endDist = blast.radius * 0.9;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = TWO_PI * i / 6;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.moveTo(cos * startDist, sin * startDist);
      ctx.lineTo(cos * endDist, sin * endDist);
    }
    ctx.stroke();
    
    // Center core
    ctx.fillStyle = `rgba(255, 255, 200, ${progress})`;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  });
}

// Draw spawn indicator (OPTIMIZED)
export function drawSpawnIndicator() {
  if (!spawnIndicator) return;
  if (!isVisible(spawnIndicator.x, spawnIndicator.y, 80)) return;
  
  const TWO_PI = Math.PI * 2;
  const progress = spawnIndicator.duration / spawnIndicator.maxDuration;
  const alpha = progress;
  const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
  const radius = 52 + pulse * 26;
  
  ctx.save();
  ctx.translate(spawnIndicator.x, spawnIndicator.y);
  
  // Outer ring
  ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.stroke();
  
  // Inner ring
  ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.8})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.6, 0, TWO_PI);
  ctx.stroke();
  
  // Center dot
  ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, TWO_PI);
  ctx.fill();
  
  // Glow (simplified gradient)
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.3})`);
  gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.fill();
  
  ctx.restore();
}

// Draw user explosion (OPTIMIZED - simplified effects)
export function drawUserExplosion() {
  if (!userExplosion) return;
  
  const TWO_PI = Math.PI * 2;
  const progress = 1 - (userExplosion.duration / userExplosion.maxDuration);
  const alpha = 1 - progress;
  const radius = userExplosion.radius;
  
  ctx.save();
  ctx.translate(userExplosion.x, userExplosion.y);
  
  // Outer glow (simplified gradient)
  const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  outerGradient.addColorStop(0, `rgba(255, 100, 50, ${alpha * 0.8})`);
  outerGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TWO_PI);
  ctx.fill();
  
  // Middle ring
  ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.9})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.7, 0, TWO_PI);
  ctx.stroke();
  
  // Inner core
  ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.25, 0, TWO_PI);
  ctx.fill();
  
  // Particles (batched by color)
  const particleColor = `rgba(255, ${200 - progress * 100 | 0}, ${50 + progress * 50 | 0}, ${alpha * 0.9})`;
  ctx.fillStyle = particleColor;
  const particleSize = 3 + progress * 2;
  const particleDist = radius * (0.5 + progress * 0.5);
  
  for (let i = 0; i < 16; i++) {
    const angle = TWO_PI * i / 16;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * particleDist, Math.sin(angle) * particleDist, particleSize, 0, TWO_PI);
    ctx.fill();
  }
  
  // Shockwave rings (simplified - just 2)
  ctx.lineWidth = 2;
  for (let ring = 0; ring < 2; ring++) {
    const ringProgress = (progress + ring * 0.3) % 1;
    const ringAlpha = (1 - ringProgress) * alpha * 0.5;
    if (ringAlpha > 0.05) {
      ctx.strokeStyle = `rgba(255, 200, 100, ${ringAlpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, radius * ringProgress, 0, TWO_PI);
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

// Draw user trail (OPTIMIZED - no gradients, simplified rendering)
export function drawUserTrail() {
  if (!userIcon || userTrail.length === 0) return;
  
  const TWO_PI = Math.PI * 2;
  const baseSize = 4;
  
  ctx.save();
  
  // Pre-calculate colors for efficiency (avoid repeated string creation)
  const trailColors = [];
  for (let i = 0; i < userTrail.length; i++) {
    const point = userTrail[i];
    const fadeProgress = point.age / point.maxAge;
    const alpha = 1 - fadeProgress;
    
    if (alpha <= 0) {
      trailColors.push(null);
      continue;
    }
    
    // Simplified color calculation
    let r, g, b;
    if (fadeProgress < 0.5) {
      r = 255;
      g = 200 - fadeProgress * 200 | 0;
      b = 50 - fadeProgress * 60 | 0;
    } else {
      const t = (fadeProgress - 0.5) * 2;
      r = 255 - t * 155 | 0;
      g = 100 - t * 80 | 0;
      b = 20 - t * 10 | 0;
    }
    
    trailColors.push({ r, g, b, alpha, fadeProgress });
  }
  
  // Draw trail connections first (as a single path where possible)
  ctx.lineCap = 'round';
  for (let i = 0; i < userTrail.length - 1; i++) {
    const color = trailColors[i];
    const nextColor = trailColors[i + 1];
    if (!color || !nextColor) continue;
    
    const point = userTrail[i];
    const nextPoint = userTrail[i + 1];
    const size = baseSize * (1 - color.fadeProgress * 0.7);
    const lineAlpha = Math.min(color.alpha, nextColor.alpha) * 0.4;
    
    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.lineWidth = size * 0.8;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
  }
  
  // Draw trail points (simplified - no gradients)
  for (let i = 0; i < userTrail.length; i++) {
    const color = trailColors[i];
    if (!color) continue;
    
    const point = userTrail[i];
    const size = baseSize * (1 - color.fadeProgress * 0.7);
    
    // Outer glow (simplified - just larger circle with lower alpha)
    ctx.globalAlpha = color.alpha * 0.3;
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size * 1.5, 0, TWO_PI);
    ctx.fill();
    
    // Core
    ctx.globalAlpha = color.alpha;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, TWO_PI);
    ctx.fill();
  }
  
  ctx.restore();
}

// Draw user icon (OPTIMIZED - reduced save/restore, combined operations)
export function drawUserIcon() {
  if (!userIcon || userExplosion) return;
  
  const TWO_PI = Math.PI * 2;
  const healthRatio = userIcon.health / 100;
  const now = Date.now();
  
  ctx.save();
  ctx.translate(userIcon.x, userIcon.y);
  
  // Health bar
  const barWidth = 20;
  const barHeight = 3;
  const barX = -barWidth / 2;
  const barY = -userIcon.radius - 8;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  if (userIcon.shield <= 0 || healthRatio < 0.8) {
    ctx.fillStyle = healthRatio > 0.5 ? '#4caf50' : healthRatio > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
  }
  
  // Invincibility indicator (simplified - fewer rings)
  if (userIcon.invincibilityTimer > 0) {
    const invincibilityProgress = userIcon.invincibilityTimer / 3000;
    const pulse = Math.sin(now * 0.01) * 0.3 + 0.7;
    const invincibilityRadius = (userIcon.radius + 8) + pulse * 12;
    
    // Single glow ring
    ctx.strokeStyle = `rgba(255, 215, 0, ${invincibilityProgress * 0.8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, invincibilityRadius, 0, TWO_PI);
    ctx.stroke();
    
    // Inner glow
    ctx.fillStyle = `rgba(255, 235, 100, ${invincibilityProgress * 0.2})`;
    ctx.beginPath();
    ctx.arc(0, 0, invincibilityRadius * 0.8, 0, TWO_PI);
    ctx.fill();
  }
  
  // Shield ring
  if (userIcon.shield > 0) {
    const shieldRatio = userIcon.shield / userIcon.maxShield;
    const shieldRadius = userIcon.radius + 4;
    const shieldColor = shieldRatio > 0.5 ? '100, 200, 255' : '255, 200, 100';
    
    // Full ring (dim)
    ctx.strokeStyle = `rgba(${shieldColor}, ${0.3 + shieldRatio * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, TWO_PI);
    ctx.stroke();
    
    // Partial arc (bright)
    ctx.strokeStyle = `rgba(${shieldColor}, 0.8)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, -Math.PI / 2, -Math.PI / 2 + TWO_PI * shieldRatio);
    ctx.stroke();
  }
  
  // User body
  ctx.rotate(userIcon.angle);
  
  const isFacingFront = Math.cos(userIcon.angle) > 0;
  
  // Determine colors based on health
  let userColor, userColorBack;
  if (userIcon.shield <= 0 && healthRatio < 0.25) {
    userColor = 'rgba(200, 50, 50, 0.95)';
    userColorBack = 'rgba(180, 40, 40, 0.95)';
  } else if (userIcon.shield <= 0 && healthRatio < 0.5) {
    userColor = 'rgba(255, 120, 80, 0.95)';
    userColorBack = 'rgba(255, 100, 60, 0.95)';
  } else {
    userColor = 'rgba(255, 170, 120, 0.95)';
    userColorBack = 'rgba(255, 140, 100, 0.95)';
  }
  
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  
  if (isFacingFront) {
    ctx.fillStyle = userColor;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-2, 4);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-2, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(2, -2, 1.5, 0, TWO_PI);
    ctx.arc(2, 2, 1.5, 0, TWO_PI);
    ctx.fill();
  } else {
    ctx.fillStyle = userColorBack;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(2, 4);
    ctx.lineTo(1, 0);
    ctx.lineTo(2, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, TWO_PI);
    ctx.fill();
  }
  
  ctx.restore();
}
