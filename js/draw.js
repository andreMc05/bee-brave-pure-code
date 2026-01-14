// ========================================
// Drawing/Rendering Functions
// ========================================

// Draw parallax background layers
function drawParallaxBackground(now) {
  // Initialize layers if needed
  if (!parallaxLayers.initialized) {
    initParallaxLayers();
  }
  
  // Calculate parallax offset based on user position (or center if no user)
  let offsetX = 0;
  let offsetY = 0;
  if (typeof userIcon !== 'undefined' && userIcon) {
    // Offset relative to center - creates subtle movement as user moves
    offsetX = (userIcon.x - center.x) / w;
    offsetY = (userIcon.y - center.y) / h;
  }
  
  // === FAR LAYER (Stars) ===
  const farConfig = PARALLAX_CONFIG.farLayer;
  parallaxLayers.far.forEach(star => {
    // Calculate position with parallax offset
    const parallaxX = star.x - offsetX * w * farConfig.speedFactor;
    const parallaxY = star.y - offsetY * h * farConfig.speedFactor;
    
    // Wrap around screen edges
    let drawX = ((parallaxX % w) + w) % w;
    let drawY = ((parallaxY % h) + h) % h;
    
    // Twinkle effect
    const twinkle = 0.5 + 0.5 * Math.sin(now * star.twinkleSpeed + star.twinkleOffset);
    const currentAlpha = star.alpha * (0.6 + 0.4 * twinkle);
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${farConfig.color[0]}, ${farConfig.color[1]}, ${farConfig.color[2]}, ${currentAlpha})`;
    ctx.fill();
    
    // Add glow to larger stars
    if (star.size > 1.2) {
      ctx.beginPath();
      ctx.arc(drawX, drawY, star.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${farConfig.color[0]}, ${farConfig.color[1]}, ${farConfig.color[2]}, ${currentAlpha * 0.15})`;
      ctx.fill();
    }
  });
  
  // === MID LAYER (Nebula Clouds) ===
  const midConfig = PARALLAX_CONFIG.midLayer;
  parallaxLayers.mid.forEach(cloud => {
    // Calculate position with parallax offset and gentle drift
    const drift = Math.sin(now * cloud.driftSpeed + cloud.driftOffset) * 20;
    const parallaxX = cloud.x - offsetX * w * midConfig.speedFactor + drift;
    const parallaxY = cloud.y - offsetY * h * midConfig.speedFactor;
    
    // Wrap around screen edges (with buffer for large clouds)
    const buffer = cloud.size;
    let drawX = ((parallaxX + buffer) % (w + buffer * 2)) - buffer;
    let drawY = ((parallaxY + buffer) % (h + buffer * 2)) - buffer;
    
    // Draw nebula cloud as radial gradient
    const gradient = ctx.createRadialGradient(
      drawX, drawY, 0,
      drawX, drawY, cloud.size
    );
    gradient.addColorStop(0, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha})`);
    gradient.addColorStop(0.4, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, 0)`);
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, cloud.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  });
  
  // === NEAR LAYER (Floating Particles/Pollen) ===
  const nearConfig = PARALLAX_CONFIG.nearLayer;
  parallaxLayers.near.forEach(particle => {
    // Calculate position with parallax offset and bobbing motion
    const bob = Math.sin(now * particle.bobSpeed + particle.bobOffset) * particle.bobAmplitude;
    const parallaxX = particle.x - offsetX * w * nearConfig.speedFactor;
    const parallaxY = particle.y - offsetY * h * nearConfig.speedFactor + bob;
    
    // Wrap around screen edges
    let drawX = ((parallaxX % w) + w) % w;
    let drawY = ((parallaxY % h) + h) % h;
    
    // Draw particle with soft glow
    const gradient = ctx.createRadialGradient(
      drawX, drawY, 0,
      drawX, drawY, particle.size * 2
    );
    gradient.addColorStop(0, `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha})`);
    gradient.addColorStop(0.5, `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, 0)`);
    
    ctx.beginPath();
    ctx.arc(drawX, drawY, particle.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Bright core
    ctx.beginPath();
    ctx.arc(drawX, drawY, particle.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha * 1.2})`;
    ctx.fill();
  });
}

// Draw hexagon cell
function drawHex(x, y, size, progress, honeyFill, cellHp, cellMaxHp) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i + Math.PI / 6;
    const px = Math.cos(a) * size * progress;
    const py = Math.sin(a) * size * progress;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  
  const hpRatio = cellHp / cellMaxHp;
  const isDamaged = hpRatio < 1;
  
  if (isDamaged) {
    const damageLevel = 1 - hpRatio;
    ctx.strokeStyle = `rgba(${255 - damageLevel * 100},${235 - damageLevel * 150},${179 - damageLevel * 100},${0.8 - damageLevel * 0.3})`;
  } else {
    ctx.strokeStyle = 'rgba(255,235,179,0.8)';
  }
  
  const isCompletelyFilled = honeyFill >= honeyPerCell;
  
  if (isCompletelyFilled) {
    ctx.fillStyle = '#ffb300';
    ctx.fill();
  } else {
    if (isDamaged) {
      const damageLevel = 1 - hpRatio;
      ctx.fillStyle = `rgba(${29 - damageLevel * 10},${25 - damageLevel * 10},${12 - damageLevel * 5},${0.6 + damageLevel * 0.2})`;
    } else {
      ctx.fillStyle = 'rgba(29,25,12,0.6)';
    }
    ctx.fill();
    
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
  
  if (isDamaged) {
    ctx.save();
    ctx.strokeStyle = `rgba(100,50,50,${0.3 + (1 - hpRatio) * 0.4})`;
    ctx.lineWidth = 1;
    const crackCount = Math.floor((1 - hpRatio) * 3) + 1;
    for (let i = 0; i < crackCount; i++) {
      const angle = (Math.PI * 2 * i) / crackCount;
      const startDist = size * 0.3;
      const endDist = size * progress * 0.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * startDist, Math.sin(angle) * startDist);
      ctx.lineTo(Math.cos(angle) * endDist, Math.sin(angle) * endDist);
      ctx.stroke();
    }
    ctx.restore();
  }
  
  ctx.stroke();
  ctx.restore();
}

// Main draw function
function draw() {
  ctx.clearRect(0, 0, w, h);
  
  // Always draw parallax background (even on start/game over screens for ambiance)
  const now = performance.now();
  drawParallaxBackground(now);
  
  if (gameOver || !gameStarted) return;

  // Apply screen shake offset
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);

  // Background glow (hive center glow)
  const grd = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, w*0.6);
  grd.addColorStop(0, 'rgba(255,255,255,0.03)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,w,h);

  // Draw resources
  drawResources();
  
  // Draw hive cells
  drawCells();
  
  // Draw hive protection shield
  drawHiveProtection();
  
  // Draw bees
  drawBees();
  
  // Draw dropship and hunters
  drawDropship();
  drawHunterBees();
  
  // Draw explosions
  drawExplosions();
  
  // Draw bullets
  drawBullets();
  
  // Draw weapon effects
  drawWeaponEffects();
  
  // Draw spawn indicator
  drawSpawnIndicator();
  
  // Draw user explosion
  drawUserExplosion();
  
  // Draw trail
  drawUserTrail();
  
  // Draw user icon
  drawUserIcon();
  
  // Restore canvas from screen shake offset
  ctx.restore();
}

// Draw resources
function drawResources() {
  resourceSpots.forEach(spot => {
    const pct = spot.max > 0 ? spot.amount / spot.max : 0;
    const r = 12 + pct * 30;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(130, 177, 255, ${0.13 + 0.4*pct})`;
    ctx.fill();
    ctx.strokeStyle = pct > 0 ? 'rgba(130,177,255,0.8)' : 'rgba(130,177,255,0.25)';
    ctx.stroke();
  });
}

// Draw hive cells
function drawCells() {
  for (let c of cells) {
    const p = hexToPixel(c.q, c.r);
    drawHex(p.x, p.y, HEX_SIZE, c.buildProg, c.honey, c.hp || CELL_MAX_HP, c.maxHp || CELL_MAX_HP);
  }
}

// Draw hive protection shield
function drawHiveProtection() {
  const protectionTimeRemaining = HIVE_PROTECTION_DURATION - (performance.now() - gameStartTime);
  if (protectionTimeRemaining > 0) {
    ctx.save();
    
    let maxDist = 0;
    cells.forEach(c => {
      const p = hexToPixel(c.q, c.r);
      const dist = Math.hypot(p.x - center.x, p.y - center.y);
      maxDist = Math.max(maxDist, dist);
    });
    const shieldRadius = maxDist + HEX_SIZE * 1.5;
    
    const pulsePhase = performance.now() * 0.003;
    const pulseIntensity = 0.15 + 0.1 * Math.sin(pulsePhase);
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, shieldRadius, 0, Math.PI * 2);
    const shieldGradient = ctx.createRadialGradient(
      center.x, center.y, shieldRadius * 0.5,
      center.x, center.y, shieldRadius
    );
    shieldGradient.addColorStop(0, `rgba(100, 200, 255, 0)`);
    shieldGradient.addColorStop(0.7, `rgba(100, 200, 255, ${pulseIntensity * 0.3})`);
    shieldGradient.addColorStop(1, `rgba(100, 200, 255, ${pulseIntensity})`);
    ctx.fillStyle = shieldGradient;
    ctx.fill();
    
    ctx.strokeStyle = `rgba(150, 220, 255, ${0.4 + 0.2 * Math.sin(pulsePhase)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const secondsRemaining = Math.ceil(protectionTimeRemaining / 1000);
    ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`HIVE PROTECTED: ${secondsRemaining}s`, center.x, center.y - shieldRadius - 10);
    
    ctx.restore();
  }
}

// Draw bees
function drawBees() {
  bees.forEach(bee => {
    const scale = bee.size || 1;
    const tx = (bee.target ? bee.target.x : center.x) - bee.x;
    const ty = (bee.target ? bee.target.y : center.y) - bee.y;
    const angle = Math.atan2(ty, tx);
    const hpRatio = bee.hp / bee.maxHp;
    
    // Calculate bobbing offset
    const bobOffset = Math.sin(bee.bobPhase) * 0.8 * scale;
    
    // Wing flap animation (0 to 1)
    const wingFlap = Math.sin(bee.wingPhase) * 0.5 + 0.5;
    
    ctx.save();
    ctx.translate(bee.x, bee.y + bobOffset);
    
    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(2, 6, 4 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.rotate(angle);
    
    // Determine colors based on state
    let bodyColor = '#ffc107'; // Golden yellow
    let stripeColor = '#3d2914'; // Dark brown
    let wingColor = 'rgba(200, 220, 255, 0.6)';
    let glowColor = null;
    
    if (bee.state === 'hunt') {
      bodyColor = '#ff4444';
      stripeColor = '#8b0000';
      wingColor = 'rgba(255, 150, 150, 0.5)';
      glowColor = 'rgba(255, 50, 50, 0.4)';
    } else if (bee.state === 'attack') {
      bodyColor = '#ff8c00';
      stripeColor = '#4a2500';
      wingColor = 'rgba(255, 200, 150, 0.5)';
      glowColor = 'rgba(255, 100, 50, 0.25)';
    } else if (bee.state === 'return') {
      bodyColor = '#ffd54f';
      stripeColor = '#5d4037';
    }
    
    if (bee.frozen > 0) {
      bodyColor = '#a0d0ff';
      stripeColor = '#4080b0';
      wingColor = 'rgba(180, 220, 255, 0.7)';
      glowColor = 'rgba(100, 180, 255, 0.3)';
    }
    
    // Adjust colors based on health
    if (hpRatio < 0.33) {
      bodyColor = bee.frozen > 0 ? '#8bb8d8' : '#e65100';
    } else if (hpRatio < 0.66) {
      bodyColor = bee.frozen > 0 ? '#9ac4e0' : '#ff9800';
    }
    
    // Draw glow effect for aggressive states
    if (glowColor) {
      ctx.save();
      ctx.rotate(-angle);
      const pulseIntensity = 0.7 + 0.3 * Math.sin(Date.now() * 0.008 + bee.wobble);
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale * pulseIntensity, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
      ctx.restore();
    }
    
    // Draw wings (behind body)
    ctx.save();
    // Wing animation - they angle up and down
    const wingAngleTop = -0.3 - wingFlap * 0.8;
    const wingAngleBottom = 0.3 + wingFlap * 0.8;
    
    // Top wing
    ctx.save();
    ctx.translate(-1 * scale, -2 * scale);
    ctx.rotate(wingAngleTop);
    ctx.beginPath();
    ctx.ellipse(0, -3 * scale, 3 * scale, 5 * scale, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = wingColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
    
    // Bottom wing
    ctx.save();
    ctx.translate(-1 * scale, 2 * scale);
    ctx.rotate(wingAngleBottom);
    ctx.beginPath();
    ctx.ellipse(0, 3 * scale, 3 * scale, 5 * scale, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = wingColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
    
    // Wing motion blur effect (when moving fast)
    if (bee.state === 'hunt' || bee.state === 'attack') {
      ctx.globalAlpha = 0.2;
      // Blur top
      ctx.save();
      ctx.translate(-1 * scale, -2 * scale);
      ctx.rotate(wingAngleTop - 0.3);
      ctx.beginPath();
      ctx.ellipse(0, -3 * scale, 2.5 * scale, 4.5 * scale, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = wingColor;
      ctx.fill();
      ctx.restore();
      // Blur bottom
      ctx.save();
      ctx.translate(-1 * scale, 2 * scale);
      ctx.rotate(wingAngleBottom + 0.3);
      ctx.beginPath();
      ctx.ellipse(0, 3 * scale, 2.5 * scale, 4.5 * scale, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = wingColor;
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
    
    // Draw body (abdomen - back part with stripes)
    ctx.beginPath();
    ctx.ellipse(-2 * scale, 0, 4 * scale, 2.8 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    
    // Draw stripes on abdomen
    const stripeStart = bee.stripeOffset || 0;
    for (let i = 0; i < 3; i++) {
      const stripeX = -4 * scale + (i + stripeStart) * 2 * scale;
      ctx.beginPath();
      ctx.moveTo(stripeX, -2.5 * scale);
      ctx.quadraticCurveTo(stripeX + 0.5 * scale, 0, stripeX, 2.5 * scale);
      ctx.lineWidth = 1.2 * scale;
      ctx.strokeStyle = stripeColor;
      ctx.stroke();
    }
    
    // Draw thorax (middle part)
    ctx.beginPath();
    ctx.ellipse(2 * scale, 0, 2.5 * scale, 2 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = stripeColor;
    ctx.fill();
    
    // Fuzzy texture on thorax
    ctx.beginPath();
    ctx.arc(1.5 * scale, -0.8 * scale, 0.8 * scale, 0, Math.PI * 2);
    ctx.arc(2.5 * scale, 0.5 * scale, 0.6 * scale, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Draw head
    ctx.beginPath();
    ctx.ellipse(5 * scale, 0, 1.8 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = stripeColor;
    ctx.fill();
    
    // Draw eyes
    ctx.beginPath();
    ctx.ellipse(5.5 * scale, -0.8 * scale, 0.7 * scale, 0.9 * scale, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5.5 * scale, 0.8 * scale, 0.7 * scale, 0.9 * scale, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    
    // Eye shine
    ctx.beginPath();
    ctx.arc(5.8 * scale, -0.6 * scale, 0.25 * scale, 0, Math.PI * 2);
    ctx.arc(5.8 * scale, 1.0 * scale, 0.25 * scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();
    
    // Draw antennae
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 0.6 * scale;
    ctx.lineCap = 'round';
    
    // Top antenna
    ctx.beginPath();
    ctx.moveTo(6 * scale, -1.2 * scale);
    const antennaWave = Math.sin(bee.wobble * 2) * 0.3;
    ctx.quadraticCurveTo(8 * scale, -2 * scale + antennaWave, 9 * scale, -2.5 * scale + antennaWave);
    ctx.stroke();
    
    // Bottom antenna
    ctx.beginPath();
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
    
    // Draw cargo (pollen) with particles
    if (bee.cargo > 0) {
      // Pollen baskets on legs
      ctx.beginPath();
      ctx.ellipse(-1 * scale, 3.5 * scale, 1.2 * scale, 0.8 * scale, 0.3, 0, Math.PI * 2);
      ctx.ellipse(-1 * scale, -3.5 * scale, 1.2 * scale, 0.8 * scale, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcc00';
      ctx.fill();
      ctx.strokeStyle = '#cc9900';
      ctx.lineWidth = 0.4 * scale;
      ctx.stroke();
      
      // Pollen dust particles trailing
      ctx.rotate(-angle);
      const particleCount = 3;
      for (let i = 0; i < particleCount; i++) {
        const particlePhase = bee.wobble + i * 2;
        const px = -10 - i * 4 + Math.sin(particlePhase) * 2;
        const py = Math.cos(particlePhase * 1.3) * 3;
        const particleAlpha = 0.6 - i * 0.2;
        ctx.beginPath();
        ctx.arc(px * scale, py * scale, (1.2 - i * 0.3) * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${particleAlpha})`;
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

// Draw dropship
function drawDropship() {
  if (!dropship) return;
  
  ctx.save();
  ctx.translate(dropship.x, dropship.y);
  ctx.rotate(dropship.angle);
  
  ctx.beginPath();
  ctx.moveTo(30, 0);
  ctx.lineTo(15, 15);
  ctx.lineTo(-25, 12);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-25, -12);
  ctx.lineTo(15, -15);
  ctx.closePath();
  ctx.fillStyle = '#445566';
  ctx.fill();
  ctx.strokeStyle = '#667788';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(18, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(-28, 8, 4, 0, Math.PI * 2);
  ctx.arc(-28, -8, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
  ctx.fill();
  
  if (dropship.phase === 'deploying') {
    const deployProgress = 1 - (dropship.deployTimer / 1500);
    ctx.beginPath();
    ctx.arc(-15, 0, 10 + deployProgress * 10, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 100, 100, ${0.8 * (1 - deployProgress)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-15, 10);
    ctx.lineTo(-15, 10 + deployProgress * 30);
    ctx.moveTo(-15, -10);
    ctx.lineTo(-15, -10 - deployProgress * 30);
    ctx.strokeStyle = `rgba(255, 200, 100, ${0.6 * (1 - deployProgress)})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  
  ctx.restore();
}

// Draw hunter bees
function drawHunterBees() {
  hunterBees.forEach(hunter => {
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

// Draw explosions
function drawExplosions() {
  // Hunter explosions
  hunterExplosions.forEach(exp => {
    const progress = 1 - (exp.duration / exp.maxDuration);
    const alpha = 1 - progress;
    const radius = exp.radius;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    outerGradient.addColorStop(0, `rgba(255, 100, 50, ${alpha * 0.9})`);
    outerGradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.5})`);
    outerGradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
    ctx.fillStyle = outerGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.5);
    innerGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
    innerGradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.7})`);
    innerGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + progress * Math.PI;
      const particleDist = radius * (0.3 + progress * 0.7);
      const particleX = Math.cos(angle) * particleDist;
      const particleY = Math.sin(angle) * particleDist;
      const particleSize = 2 + (1 - progress) * 2;
      
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${200 - progress * 100}, ${50 + progress * 50}, ${alpha * 0.9})`;
      ctx.fill();
    }
    
    ctx.restore();
  });

  // Bee explosions
  beeExplosions.forEach(exp => {
    const progress = 1 - (exp.duration / exp.maxDuration);
    const alpha = 1 - progress;
    const radius = exp.radius;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(255, 220, 100, ${alpha * 0.9})`);
    gradient.addColorStop(0.5, `rgba(255, 180, 50, ${alpha * 0.6})`);
    gradient.addColorStop(1, `rgba(255, 150, 0, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    const sparkCount = 5;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + progress * Math.PI * 2;
      const sparkDist = radius * (0.4 + progress * 0.6);
      const sparkX = Math.cos(angle) * sparkDist;
      const sparkY = Math.sin(angle) * sparkDist;
      const sparkSize = 1 + (1 - progress) * 1.5;
      
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${220 - progress * 70}, ${100 - progress * 50}, ${alpha * 0.8})`;
      ctx.fill();
    }
    
    ctx.restore();
  });

  // Cell explosions
  cellExplosions.forEach(exp => {
    const progress = 1 - (exp.duration / exp.maxDuration);
    const alpha = 1 - progress;
    const radius = exp.radius;
    
    ctx.save();
    ctx.translate(exp.x, exp.y);
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    outerGradient.addColorStop(0, `rgba(255, 200, 50, ${alpha * 0.8})`);
    outerGradient.addColorStop(0.4, `rgba(200, 150, 50, ${alpha * 0.5})`);
    outerGradient.addColorStop(1, `rgba(150, 100, 30, 0)`);
    ctx.fillStyle = outerGradient;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.4);
    innerGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
    innerGradient.addColorStop(0.5, `rgba(255, 220, 100, ${alpha * 0.7})`);
    innerGradient.addColorStop(1, `rgba(255, 180, 50, 0)`);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    const debrisCount = 6;
    for (let i = 0; i < debrisCount; i++) {
      const angle = (Math.PI * 2 * i) / debrisCount + progress * Math.PI * 0.5;
      const debrisDist = radius * (0.3 + progress * 0.8);
      const debrisX = Math.cos(angle) * debrisDist;
      const debrisY = Math.sin(angle) * debrisDist;
      const debrisSize = 4 + (1 - progress) * 4;
      
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const hexAngle = (Math.PI * 2 * j) / 6 + progress * Math.PI;
        const hx = debrisX + Math.cos(hexAngle) * debrisSize;
        const hy = debrisY + Math.sin(hexAngle) * debrisSize;
        if (j === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(200, 160, 50, ${alpha * 0.7})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(150, 120, 30, ${alpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.6})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  });
}

// Draw bullets
function drawBullets() {
  bullets.forEach(bullet => {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.angle);
    ctx.beginPath();
    ctx.arc(0, 0, bullet.radius, 0, Math.PI*2);
    
    if (bullet.isHiveBullet) {
      ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-bullet.radius * 2, 0);
      ctx.lineTo(0, 0);
      ctx.strokeStyle = 'rgba(255, 180, 50, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (bullet.isHunterLaser) {
      ctx.fillStyle = 'rgba(255, 50, 100, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 150, 200, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-bullet.radius * 4, 0);
      ctx.lineTo(0, 0);
      ctx.strokeStyle = 'rgba(255, 100, 150, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, bullet.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 200, 220, 0.9)';
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 200, 200, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-bullet.radius * 2, 0);
      ctx.lineTo(0, 0);
      ctx.strokeStyle = 'rgba(255, 150, 150, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  });
}

// Draw weapon effects
function drawWeaponEffects() {
  // Freeze bombs
  freezeBombs.forEach(bomb => {
    const progress = bomb.duration / bomb.maxDuration;
    ctx.save();
    ctx.translate(bomb.x, bomb.y);
    ctx.beginPath();
    ctx.arc(0, 0, bomb.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 200, 255, ${0.2 * progress})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(150, 220, 255, ${0.6 * progress})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const dist = bomb.radius * 0.7;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 240, 255, ${0.8 * progress})`;
      ctx.fill();
    }
    ctx.restore();
  });

  // Electric blasts
  electricBlasts.forEach(blast => {
    const progress = blast.duration / blast.maxDuration;
    ctx.save();
    ctx.translate(blast.x, blast.y);
    
    ctx.beginPath();
    ctx.arc(0, 0, blast.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 100, ${0.8 * progress})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const startDist = blast.radius * 0.3;
      const endDist = blast.radius * 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * startDist, Math.sin(angle) * startDist);
      ctx.lineTo(Math.cos(angle) * endDist, Math.sin(angle) * endDist);
      ctx.strokeStyle = `rgba(255, 255, 150, ${progress})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 200, ${progress})`;
    ctx.fill();
    ctx.restore();
  });
}

// Draw spawn indicator
function drawSpawnIndicator() {
  if (!spawnIndicator) return;
  
  const progress = spawnIndicator.duration / spawnIndicator.maxDuration;
  const alpha = progress;
  const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7;
  const radius = 52 + pulse * 26;
  
  ctx.save();
  ctx.translate(spawnIndicator.x, spawnIndicator.y);
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.8})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
  ctx.fill();
  
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.3})`);
  gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

// Draw user explosion
function drawUserExplosion() {
  if (!userExplosion) return;
  
  const progress = 1 - (userExplosion.duration / userExplosion.maxDuration);
  const alpha = 1 - progress;
  const radius = userExplosion.radius;
  
  ctx.save();
  ctx.translate(userExplosion.x, userExplosion.y);
  
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  outerGradient.addColorStop(0, `rgba(255, 100, 50, ${alpha * 0.8})`);
  outerGradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.4})`);
  outerGradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
  ctx.fillStyle = outerGradient;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.9})`;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
  const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.4);
  innerGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
  innerGradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.6})`);
  innerGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
  ctx.fillStyle = innerGradient;
  ctx.fill();
  
  const particleCount = 16;
  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const particleDist = radius * (0.5 + progress * 0.5);
    const particleX = Math.cos(angle) * particleDist;
    const particleY = Math.sin(angle) * particleDist;
    const particleSize = 3 + progress * 2;
    
    ctx.beginPath();
    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${200 - progress * 100}, ${50 + progress * 50}, ${alpha * 0.9})`;
    ctx.fill();
  }
  
  for (let ring = 0; ring < 3; ring++) {
    const ringProgress = (progress + ring * 0.2) % 1;
    const ringRadius = radius * ringProgress;
    const ringAlpha = (1 - ringProgress) * alpha * 0.5;
    
    if (ringAlpha > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 200, 100, ${ringAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

// Draw user trail
function drawUserTrail() {
  if (!userIcon || userTrail.length === 0) return;
  
  ctx.save();
  
  for (let i = 0; i < userTrail.length; i++) {
    const point = userTrail[i];
    const fadeProgress = point.age / point.maxAge;
    const alpha = 1 - fadeProgress;
    
    if (alpha <= 0) continue;
    
    const baseSize = 4;
    const size = baseSize * (1 - fadeProgress * 0.7);
    
    let r, g, b;
    if (fadeProgress < 0.3) {
      const t = fadeProgress / 0.3;
      r = 255;
      g = 200 - t * 50;
      b = 50 - t * 30;
    } else if (fadeProgress < 0.7) {
      const t = (fadeProgress - 0.3) / 0.4;
      r = 255 - t * 50;
      g = 150 - t * 100;
      b = 20;
    } else {
      const t = (fadeProgress - 0.7) / 0.3;
      r = 205 - t * 105;
      g = 50 - t * 30;
      b = 20 - t * 10;
    }
    
    ctx.globalAlpha = alpha * 0.9;
    
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 2);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();
    
    if (i < userTrail.length - 1) {
      const nextPoint = userTrail[i + 1];
      const nextFadeProgress = nextPoint.age / nextPoint.maxAge;
      const nextAlpha = 1 - nextFadeProgress;
      
      if (nextAlpha > 0) {
        ctx.globalAlpha = Math.min(alpha, nextAlpha) * 0.4;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(alpha, nextAlpha) * 0.4})`;
        ctx.lineWidth = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
      }
    }
  }
  
  ctx.restore();
}

// Draw user icon
function drawUserIcon() {
  if (!userIcon || userExplosion) return;
  
  const healthRatio = userIcon.health / 100;
  
  // Health bar
  ctx.save();
  ctx.translate(userIcon.x, userIcon.y);
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
  ctx.restore();
  
  // Invincibility indicator
  if (userIcon.invincibilityTimer > 0) {
    ctx.save();
    ctx.translate(userIcon.x, userIcon.y);
    const invincibilityProgress = userIcon.invincibilityTimer / 3000;
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    const invincibilityRadius = (userIcon.radius + 8) + pulse * 12;
    
    ctx.beginPath();
    ctx.arc(0, 0, invincibilityRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${invincibilityProgress * 0.8})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, invincibilityRadius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 235, 100, ${invincibilityProgress * 0.9})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, invincibilityRadius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 150, ${invincibilityProgress})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, invincibilityRadius);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${invincibilityProgress * 0.4})`);
    gradient.addColorStop(0.5, `rgba(255, 235, 100, ${invincibilityProgress * 0.2})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, invincibilityRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  // Shield ring
  if (userIcon.shield > 0) {
    ctx.save();
    ctx.translate(userIcon.x, userIcon.y);
    const shieldRatio = userIcon.shield / userIcon.maxShield;
    const shieldRadius = userIcon.radius + 4;
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
    ctx.strokeStyle = shieldRatio > 0.5 
      ? `rgba(100, 200, 255, ${0.3 + shieldRatio * 0.4})` 
      : `rgba(255, 200, 100, ${0.3 + shieldRatio * 0.4})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, shieldRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
    ctx.strokeStyle = shieldRatio > 0.5 ? 'rgba(100, 200, 255, 0.8)' : 'rgba(255, 200, 100, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
  
  // User body
  ctx.save();
  ctx.translate(userIcon.x, userIcon.y);
  ctx.rotate(userIcon.angle);
  
  const isFacingFront = Math.cos(userIcon.angle) > 0;
  
  let userColor = 'rgba(255, 170, 120, 0.95)';
  let userColorBack = 'rgba(255, 140, 100, 0.95)';
  if (userIcon.shield <= 0) {
    if (healthRatio < 0.25) {
      userColor = 'rgba(200, 50, 50, 0.95)';
      userColorBack = 'rgba(180, 40, 40, 0.95)';
    } else if (healthRatio < 0.5) {
      userColor = 'rgba(255, 120, 80, 0.95)';
      userColorBack = 'rgba(255, 100, 60, 0.95)';
    }
  }
  
  if (isFacingFront) {
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-2, 4);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-2, -4);
    ctx.closePath();
    ctx.fillStyle = userColor;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(2, -2, 1.5, 0, Math.PI*2);
    ctx.arc(2, 2, 1.5, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(2, 4);
    ctx.lineTo(1, 0);
    ctx.lineTo(2, -4);
    ctx.closePath();
    ctx.fillStyle = userColorBack;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  }
  
  ctx.restore();
}
