    // Canvas setup
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    
    // Game state
    let gameOver = false;
    let gameStarted = false;
    const gameOverEl = document.getElementById('gameOver');
    const restartBtn = document.getElementById('restartBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const startScreen = document.getElementById('startScreen');
    const startBtn = document.getElementById('startBtn');

    let w, h, center;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      center = { x: w * 0.53, y: h * 0.55 };
      if (userIcon) {
        userIcon.x = Math.min(Math.max(userIcon.x, 0), w);
        userIcon.y = Math.min(Math.max(userIcon.y, 0), h);
      }
    }
    window.addEventListener('resize', resize);
    resize();

    // UI elements
    const colonySizeInput = document.getElementById('colonySize');
    const colonySizeVal = document.getElementById('colonySizeVal');
    const maxColonySizeInput = document.getElementById('maxColonySize');
    const maxColonySizeVal = document.getElementById('maxColonySizeVal');
    const resourceCountInput = document.getElementById('resourceCount');
    const resourceCountVal = document.getElementById('resourceCountVal');
    const resourceAmountInput = document.getElementById('resourceAmount');
    const resourceAmountVal = document.getElementById('resourceAmountVal');
    const priorityPercentInput = document.getElementById('priorityPercent');
    const priorityPercentVal = document.getElementById('priorityPercentVal');
    const shotDistanceInput = document.getElementById('shotDistance');
    const shotDistanceVal = document.getElementById('shotDistanceVal');

    // Start screen UI elements
    const startColonySizeInput = document.getElementById('startColonySize');
    const startColonySizeVal = document.getElementById('startColonySizeVal');
    const startMaxColonySizeInput = document.getElementById('startMaxColonySize');
    const startMaxColonySizeVal = document.getElementById('startMaxColonySizeVal');
    const startResourceCountInput = document.getElementById('startResourceCount');
    const startResourceCountVal = document.getElementById('startResourceCountVal');
    const startResourceAmountInput = document.getElementById('startResourceAmount');
    const startResourceAmountVal = document.getElementById('startResourceAmountVal');
    const startPriorityPercentInput = document.getElementById('startPriorityPercent');
    const startPriorityPercentVal = document.getElementById('startPriorityPercentVal');
    const startShotDistanceInput = document.getElementById('startShotDistance');
    const startShotDistanceVal = document.getElementById('startShotDistanceVal');

    const cellsEl = document.getElementById('cells');
    const honeyEl = document.getElementById('honey');
    const extResEl = document.getElementById('extRes');
    const siteCountEl = document.getElementById('siteCount');
    
    // New UI elements
    const scoreDisplay = document.getElementById('scoreDisplay');
    const colonyDisplay = document.getElementById('colonyDisplay');
    const shieldBar = document.getElementById('shieldBar');
    const shieldValue = document.getElementById('shieldValue');
    const healthBar = document.getElementById('healthBar');
    const healthValue = document.getElementById('healthValue');
    const freezeCountEl = document.getElementById('freezeCount');
    const electricCountEl = document.getElementById('electricCount');
    const warpCountEl = document.getElementById('warpCount');
    const weaponFreeze = document.getElementById('weaponFreeze');
    const weaponElectric = document.getElementById('weaponElectric');
    const weaponWarp = document.getElementById('weaponWarp');
    
    // Score tracking
    let score = 0;
    let destroyedBees = 0;
    let destroyedCells = 0;

    // Hive
    let hiveHoney = 0;
    const honeyPerCell = 12;
    const honeyToBuild = 15;

    // Hex grid
    const HEX_SIZE = 26;
    const CELL_MAX_HP = 5; // Number of hits needed to destroy an empty cell
    const HONEY_DAMAGE_PER_HIT = 2; // Amount of honey lost per bullet hit
    const HIVE_FIRE_COOLDOWN = 2000; // 2 seconds between shots
    const HIVE_FIRE_RANGE = 500; // Range at which hive cells can fire
    const cells = [{ q: 0, r: 0, buildProg: 1, honey: 0, hp: CELL_MAX_HP, maxHp: CELL_MAX_HP, fireCooldown: 0 }];
    const directions = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 }
    ];
    function hexToPixel(q, r) {
      const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
      const y = HEX_SIZE * (3/2 * r);
      return { x: center.x + x, y: center.y + y };
    }
    function hasCell(q, r) {
      return cells.some(c => c.q === q && c.r === r);
    }
    function isPointInHex(px, py, hexCenterX, hexCenterY, hexSize) {
      // Convert point to hex-relative coordinates
      const dx = px - hexCenterX;
      const dy = py - hexCenterY;
      const distFromCenter = Math.hypot(dx, dy);
      
      // Hexagon inscribed circle radius is hexSize
      // For a regular hexagon, the distance from center to vertex is hexSize
      // The distance from center to edge is hexSize * sqrt(3)/2 ≈ hexSize * 0.866
      // We'll use hexSize as the effective radius (slightly larger than inscribed circle)
      // This makes it easier to hit cells and feels more forgiving
      return distFromCenter <= hexSize;
    }
    function getCellAtPoint(px, py) {
      // Find which cell (if any) contains this point
      for (let c of cells) {
        const p = hexToPixel(c.q, c.r);
        const effectiveSize = HEX_SIZE * c.buildProg; // Account for build progress
        if (isPointInHex(px, py, p.x, p.y, effectiveSize)) {
          return c;
        }
      }
      return null;
    }
    function tryBuildNewCell() {
      // Only build if ALL existing cells are completely filled (buildProg = 1)
      const incompleteCells = cells.filter(c => c.buildProg < 1);
      if (incompleteCells.length > 0) return;
      
      // Build exactly 2 new cells (or as many as possible up to 2)
      let cellsBuilt = 0;
      const maxCellsToBuild = 2;
      
      for (let c of cells) {
        if (cellsBuilt >= maxCellsToBuild) break;
        if (hiveHoney < honeyToBuild) break;
        
        for (let d of directions) {
          if (cellsBuilt >= maxCellsToBuild) break;
          if (hiveHoney < honeyToBuild) break;
          
          const nq = c.q + d.q;
          const nr = c.r + d.r;
          if (!hasCell(nq, nr)) {
            cells.push({ q: nq, r: nr, buildProg: 0, honey: 0, hp: CELL_MAX_HP, maxHp: CELL_MAX_HP, fireCooldown: 0 });
            hiveHoney -= honeyToBuild;
            cellsBuilt++;
          }
        }
      }
    }

    // Resource locations
    let resourceSpots = [];
    function makeResourceSpots(count, baseAmount) {
      resourceSpots = [];
      for (let i = 0; i < count; i++) {
        let x, y, tries = 0;
        do {
          x = Math.random() * w;
          y = Math.random() * h;
          tries++;
        } while (
          (Math.hypot(x - center.x, y - center.y) < 120 ||
           (x < 280 && y < 250)) && tries < 50
        );
        const amount = baseAmount * (0.5 + Math.random() * 0.8);
        resourceSpots.push({ x, y, amount, max: amount });
      }
      updateTotalResources();
      if (siteCountEl) siteCountEl.textContent = resourceSpots.length;
    }
    function updateTotalResources() {
      const total = resourceSpots.reduce((s, r) => s + r.amount, 0);
      if (extResEl) extResEl.textContent = Math.floor(total);
    }

    function update(now, dt) {
      // Don't update if game is over or not started
      if (gameOver || !gameStarted) {
        // Stop engine sound if game is not running
        if (isEngineRunning) {
          stopEngineSound();
        }
        return;
      }
      
      // Update user (movement, bullets, weapons, collisions)
      updateUser(dt, now);

      // grow cells
      for (let c of cells) {
        if (c.buildProg < 1) {
          c.buildProg = Math.min(1, c.buildProg + dt * 0.0015);
        }
        
        // Update fire cooldown
        if (c.fireCooldown > 0) {
          c.fireCooldown = Math.max(0, c.fireCooldown - dt);
        }
        
        // Hive cell firing logic
        if (userIcon && c.buildProg >= 1 && c.honey >= honeyPerCell * 0.5 && c.fireCooldown <= 0) {
          const cellPos = hexToPixel(c.q, c.r);
          const distToUser = Math.hypot(cellPos.x - userIcon.x, cellPos.y - userIcon.y);
          
          // Fire if user is in range
          if (distToUser <= HIVE_FIRE_RANGE) {
            // Calculate angle to user with some inaccuracy
            const baseAngle = Math.atan2(userIcon.y - cellPos.y, userIcon.x - cellPos.x);
            
            // Improve accuracy if user is stationary
            // Base inaccuracy: ±0.15 radians (~±8.6 degrees)
            // Max improvement: reduces to ±0.03 radians (~±1.7 degrees) after 2 seconds
            const MAX_STATIONARY_TIME = 2000; // 2 seconds for maximum accuracy
            const BASE_INACCURACY = 0.3; // ±0.15 radians
            const MIN_INACCURACY = 0.06; // ±0.03 radians (much more accurate)
            
            const stationaryProgress = Math.min(1, userIcon.stationaryTime / MAX_STATIONARY_TIME);
            const inaccuracyRange = BASE_INACCURACY - (BASE_INACCURACY - MIN_INACCURACY) * stationaryProgress;
            const inaccuracy = (Math.random() - 0.5) * inaccuracyRange;
            const angle = baseAngle + inaccuracy;
            
            // Hive bullets are slower and larger
            const hiveBulletSpeed = 4; // Slower than user bullets (8)
            const hiveBulletRadius = 5; // Larger than user bullets (3)
            const hiveBulletMaxDistance = 600; // Max range for hive bullets
            
            bullets.push({
              x: cellPos.x,
              y: cellPos.y,
              vx: Math.cos(angle) * hiveBulletSpeed,
              vy: Math.sin(angle) * hiveBulletSpeed,
              angle: angle,
              maxDistance: hiveBulletMaxDistance,
              distanceTraveled: 0,
              radius: hiveBulletRadius,
              isHiveBullet: true
            });
            
            // Reset cooldown
            c.fireCooldown = HIVE_FIRE_COOLDOWN;
          }
        }
      }

      const preferHighPct = +priorityPercentInput.value;

      // Update bees (movement, behavior, spawning)
      updateBees(dt, now, preferHighPct);

      // build new cells
      tryBuildNewCell();

      // Update score based on destroyed bees and hive cells
      score = destroyedBees * 5 + destroyedCells * 10; // Each bee = 5 point, each cell = 10 points
      
      // UI
      if (cellsEl) cellsEl.textContent = cells.length;
      if (honeyEl) honeyEl.textContent = Math.floor(hiveHoney);
      
      if (userIcon) {
        // Update shield bar
        const shieldPercent = (userIcon.shield / userIcon.maxShield) * 100;
        shieldBar.style.width = shieldPercent + '%';
        shieldValue.textContent = Math.floor(shieldPercent) + '%';
        shieldBar.classList.toggle('low', shieldPercent < 30);
        
        // Update health bar
        const healthPercent = userIcon.health;
        healthBar.style.width = healthPercent + '%';
        healthValue.textContent = Math.floor(healthPercent) + '%';
        healthBar.className = 'bar-fill health';
        if (healthPercent < 25) {
          healthBar.classList.add('low');
        } else if (healthPercent < 50) {
          healthBar.classList.add('medium');
        }
        
        // Update score display
        scoreDisplay.textContent = score.toLocaleString();
        
        // Update colony counter
        colonyDisplay.textContent = bees.length;
        
        // Game over check - trigger explosion instead of immediate game over
        if (userIcon.health <= 0 && !gameOver && !userExplosion) {
          // Stop engine sound
          stopEngineSound();
          
          // Play explosion sound
          playExplosionSound();
          
          // Start explosion animation
          userExplosion = {
            x: userIcon.x,
            y: userIcon.y,
            duration: 2500, // 2.5 second explosion
            maxDuration: 2500,
            radius: 20
          };
          // Hide user icon during explosion
          userIcon = null;
        }
      }
    }

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
      
      // Calculate damage level for visual feedback
      const hpRatio = cellHp / cellMaxHp;
      const isDamaged = hpRatio < 1;
      
      // Adjust stroke color based on damage
      if (isDamaged) {
        const damageLevel = 1 - hpRatio;
        ctx.strokeStyle = `rgba(${255 - damageLevel * 100},${235 - damageLevel * 150},${179 - damageLevel * 100},${0.8 - damageLevel * 0.3})`;
      } else {
        ctx.strokeStyle = 'rgba(255,235,179,0.8)';
      }
      
      // Check if cell is completely filled with honey
      const isCompletelyFilled = honeyFill >= honeyPerCell;
      
      if (isCompletelyFilled) {
        // Completely filled cell: fill entire hexagon with yellow
        ctx.fillStyle = '#ffb300';
        ctx.fill();
      } else {
        // Partially filled or empty: use dark background
        // Make background darker if damaged
        if (isDamaged) {
          const damageLevel = 1 - hpRatio;
          ctx.fillStyle = `rgba(${29 - damageLevel * 10},${25 - damageLevel * 10},${12 - damageLevel * 5},${0.6 + damageLevel * 0.2})`;
        } else {
          ctx.fillStyle = 'rgba(29,25,12,0.6)';
        }
        ctx.fill();
        
        // Draw partial honey fill if any
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
      
      // Draw damage cracks if cell is damaged
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

    function draw() {
      ctx.clearRect(0, 0, w, h);
      
      // Don't draw game elements if game is over or not started
      if (gameOver || !gameStarted) return;

      // background glow
      const grd = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, w*0.6);
      grd.addColorStop(0, 'rgba(255,255,255,0.03)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,w,h);

      // resources
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

      // hive cells
      for (let c of cells) {
        const p = hexToPixel(c.q, c.r);
        drawHex(p.x, p.y, HEX_SIZE, c.buildProg, c.honey, c.hp || CELL_MAX_HP, c.maxHp || CELL_MAX_HP);
      }

      // bees
      bees.forEach(bee => {
        ctx.save();
        ctx.translate(bee.x, bee.y);
        const tx = (bee.target ? bee.target.x : center.x) - bee.x;
        const ty = (bee.target ? bee.target.y : center.y) - bee.y;
        ctx.rotate(Math.atan2(ty, tx));
        
        // Draw bee body with color based on HP and state
        const hpRatio = bee.hp / bee.maxHp;
        let beeColor = hpRatio > 0.66 ? '#ffe082' : hpRatio > 0.33 ? '#ffca28' : '#ff9800';
        
        // Attacking bees are more red/orange
        if (bee.state === 'attack') {
          beeColor = '#ff6b35'; // Aggressive red-orange
        }
        
        // Frozen bees are blue-tinted
        if (bee.frozen > 0) {
          beeColor = '#a0d0ff'; // Light blue when frozen
        }
        
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(-4, 3);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, -3);
        ctx.closePath();
        ctx.fillStyle = (bee.state === 'return') ? '#ffca28' : beeColor;
        ctx.fill();
        
        // Draw HP bar above bee
        if (bee.hp < bee.maxHp) {
          ctx.save();
          ctx.rotate(-Math.atan2(ty, tx));
          const barWidth = 8;
          const barHeight = 2;
          const barX = -barWidth / 2;
          const barY = -8;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
          ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
          ctx.restore();
        }
        
        if (bee.cargo > 0) {
          ctx.beginPath();
          ctx.arc(0, -5, 1.5, 0, Math.PI*2);
          ctx.fillStyle = '#ffb300';
          ctx.fill();
        }
        ctx.restore();
      });

      // bullets
      bullets.forEach(bullet => {
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(bullet.angle);
        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, 0, Math.PI*2);
        
        if (bullet.isHiveBullet) {
          // Hive bullets: larger, yellow/orange color
          ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 150, 0, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Trail effect for hive bullets
          ctx.beginPath();
          ctx.moveTo(-bullet.radius * 2, 0);
          ctx.lineTo(0, 0);
          ctx.strokeStyle = 'rgba(255, 180, 50, 0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          // User bullets: smaller, red color
          ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 200, 200, 0.8)';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Add a small trail effect
          ctx.beginPath();
          ctx.moveTo(-bullet.radius * 2, 0);
          ctx.lineTo(0, 0);
          ctx.strokeStyle = 'rgba(255, 150, 150, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        ctx.restore();
      });

      // Draw freeze bombs
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
        
        // Draw ice particles
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

      // Draw electric blasts
      electricBlasts.forEach(blast => {
        const progress = blast.duration / blast.maxDuration;
        ctx.save();
        ctx.translate(blast.x, blast.y);
        
        // Electric field effect
        ctx.beginPath();
        ctx.arc(0, 0, blast.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 100, ${0.8 * progress})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Lightning bolts
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
        
        // Center flash
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 200, ${progress})`;
        ctx.fill();
        ctx.restore();
      });

      // Draw spawn indicator
      if (spawnIndicator) {
        const progress = spawnIndicator.duration / spawnIndicator.maxDuration;
        const alpha = progress; // Fade out over time
        const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 0.7; // Pulsing effect
        const radius = 52 + pulse * 26; // Pulsing radius (30% larger: 40*1.3 + pulse*20*1.3)
        
        ctx.save();
        ctx.translate(spawnIndicator.x, spawnIndicator.y);
        
        // Outer ring
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.6})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Inner ring
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150, 220, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Center point
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
        ctx.fill();
        
        // Glow effect
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
      if (userExplosion) {
        const progress = 1 - (userExplosion.duration / userExplosion.maxDuration);
        const alpha = 1 - progress; // Fade out over time
        const radius = userExplosion.radius;
        
        ctx.save();
        ctx.translate(userExplosion.x, userExplosion.y);
        
        // Outer explosion ring (orange/red)
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        outerGradient.addColorStop(0, `rgba(255, 100, 50, ${alpha * 0.8})`);
        outerGradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.4})`);
        outerGradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
        ctx.fillStyle = outerGradient;
        ctx.fill();
        
        // Middle ring (yellow)
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.9})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Inner core (bright white/yellow)
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.4);
        innerGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
        innerGradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.6})`);
        innerGradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
        ctx.fillStyle = innerGradient;
        ctx.fill();
        
        // Explosion particles (sparks)
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
        
        // Shockwave rings
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

      // Draw afterburner trail behind user
      if (userIcon && userTrail.length > 0) {
        ctx.save();
        
        // Draw trail segments with fade-out effect
        for (let i = 0; i < userTrail.length; i++) {
          const point = userTrail[i];
          const fadeProgress = point.age / point.maxAge; // 0 = new, 1 = old
          const alpha = 1 - fadeProgress; // Fade from 1 to 0
          
          // Skip if completely faded
          if (alpha <= 0) continue;
          
          // Calculate size based on age (smaller as it fades)
          const baseSize = 4;
          const size = baseSize * (1 - fadeProgress * 0.7); // Shrink to 30% of original size
          
          // Color gradient: bright orange/yellow at front, red/orange in middle, dark red at back
          let r, g, b;
          if (fadeProgress < 0.3) {
            // Front: bright orange/yellow
            const t = fadeProgress / 0.3;
            r = 255;
            g = 200 - t * 50; // 200 to 150
            b = 50 - t * 30; // 50 to 20
          } else if (fadeProgress < 0.7) {
            // Middle: orange to red
            const t = (fadeProgress - 0.3) / 0.4;
            r = 255 - t * 50; // 255 to 205
            g = 150 - t * 100; // 150 to 50
            b = 20;
          } else {
            // Back: dark red
            const t = (fadeProgress - 0.7) / 0.3;
            r = 205 - t * 105; // 205 to 100
            g = 50 - t * 30; // 50 to 20
            b = 20 - t * 10; // 20 to 10
          }
          
          // Draw trail particle with glow
          ctx.globalAlpha = alpha * 0.9;
          
          // Outer glow
          const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 2);
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Core particle
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw connecting line to next point (if exists)
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

      // user icon (user-controlled) - front and back views
      // Don't draw user icon if explosion is happening
      if (userIcon && !userExplosion) {
        const healthRatio = userIcon.health / 100;
        
        // Draw health bar above user icon
        ctx.save();
        ctx.translate(userIcon.x, userIcon.y);
        const barWidth = 20;
        const barHeight = 3;
        const barX = -barWidth / 2;
        const barY = -userIcon.radius - 8;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar (only show when shield is down or health is low)
        if (userIcon.shield <= 0 || healthRatio < 0.8) {
          ctx.fillStyle = healthRatio > 0.5 ? '#4caf50' : healthRatio > 0.25 ? '#ff9800' : '#f44336';
          ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
        }
        ctx.restore();
        
        // Draw invincibility indicator
        if (userIcon.invincibilityTimer > 0) {
          ctx.save();
          ctx.translate(userIcon.x, userIcon.y);
          const invincibilityProgress = userIcon.invincibilityTimer / 3000;
          const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7; // Fast pulsing
          const invincibilityRadius = (userIcon.radius + 8) + pulse * 12;
          
          // Outer golden ring
          ctx.beginPath();
          ctx.arc(0, 0, invincibilityRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 215, 0, ${invincibilityProgress * 0.8})`;
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Middle ring
          ctx.beginPath();
          ctx.arc(0, 0, invincibilityRadius * 0.7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 235, 100, ${invincibilityProgress * 0.9})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Inner ring
          ctx.beginPath();
          ctx.arc(0, 0, invincibilityRadius * 0.4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 150, ${invincibilityProgress})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Glow effect
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
        
        // Draw shield ring if shield is active
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
          
          // Draw shield arc based on remaining shield
          ctx.beginPath();
          ctx.arc(0, 0, shieldRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
          ctx.strokeStyle = shieldRatio > 0.5 ? 'rgba(100, 200, 255, 0.8)' : 'rgba(255, 200, 100, 0.8)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
        
        ctx.save();
        ctx.translate(userIcon.x, userIcon.y);
        ctx.rotate(userIcon.angle);
        
        // Determine if facing front (right) or back (left)
        // Front: angle between -π/2 and π/2 (cos > 0)
        const isFacingFront = Math.cos(userIcon.angle) > 0;
        
        // Color based on health when shield is down
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
          // Front view: arrow pointing right
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
          
          // Front view detail: eyes
          ctx.beginPath();
          ctx.arc(2, -2, 1.5, 0, Math.PI*2);
          ctx.arc(2, 2, 1.5, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fill();
        } else {
          // Back view: arrow pointing left (back)
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
          
          // Back view detail: simple marker
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
        }
        
        ctx.restore();
      }
    }

    let last = performance.now();
    function loop(now) {
      const dt = now - last;
      last = now;
      update(now, dt);
      draw();
      requestAnimationFrame(loop);
    }

    // Start screen slider handlers - sync with game sliders
    startColonySizeInput.oninput = () => {
      startColonySizeVal.textContent = startColonySizeInput.value;
      colonySizeInput.value = startColonySizeInput.value;
      colonySizeVal.textContent = startColonySizeInput.value;
      if (gameStarted) {
        createBees(+startColonySizeInput.value);
      }
    };
    startMaxColonySizeInput.oninput = () => {
      startMaxColonySizeVal.textContent = startMaxColonySizeInput.value;
      maxColonySizeInput.value = startMaxColonySizeInput.value;
      maxColonySizeVal.textContent = startMaxColonySizeInput.value;
    };
    startResourceCountInput.oninput = () => {
      startResourceCountVal.textContent = startResourceCountInput.value;
      resourceCountInput.value = startResourceCountInput.value;
      resourceCountVal.textContent = startResourceCountInput.value;
      if (gameStarted) {
        makeResourceSpots(+startResourceCountInput.value, +startResourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
    startResourceAmountInput.oninput = () => {
      startResourceAmountVal.textContent = startResourceAmountInput.value;
      resourceAmountInput.value = startResourceAmountInput.value;
      resourceAmountVal.textContent = startResourceAmountInput.value;
      if (gameStarted) {
        makeResourceSpots(+startResourceCountInput.value, +startResourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
    startPriorityPercentInput.oninput = () => {
      startPriorityPercentVal.textContent = startPriorityPercentInput.value + '%';
      priorityPercentInput.value = startPriorityPercentInput.value;
      priorityPercentVal.textContent = startPriorityPercentInput.value + '%';
    };
    startShotDistanceInput.oninput = () => {
      startShotDistanceVal.textContent = startShotDistanceInput.value;
      shotDistanceInput.value = startShotDistanceInput.value;
      shotDistanceVal.textContent = startShotDistanceInput.value;
    };

    // Start button handler
    startBtn.addEventListener('click', () => {
      // Initialize audio context
      initAudioContext();
      
      // Sync all values from start screen to game
      colonySizeInput.value = startColonySizeInput.value;
      colonySizeVal.textContent = startColonySizeInput.value;
      maxColonySizeInput.value = startMaxColonySizeInput.value;
      maxColonySizeVal.textContent = startMaxColonySizeInput.value;
      resourceCountInput.value = startResourceCountInput.value;
      resourceCountVal.textContent = startResourceCountInput.value;
      resourceAmountInput.value = startResourceAmountInput.value;
      resourceAmountVal.textContent = startResourceAmountInput.value;
      priorityPercentInput.value = startPriorityPercentInput.value;
      priorityPercentVal.textContent = startPriorityPercentInput.value + '%';
      shotDistanceInput.value = startShotDistanceInput.value;
      shotDistanceVal.textContent = startShotDistanceInput.value;

      // Initialize game with these settings
      createBees(+colonySizeInput.value);
      makeResourceSpots(+resourceCountInput.value, +resourceAmountInput.value);
      placeUserIcon();
      updateWeaponUI();

      // Reset score
      score = 0;
      destroyedBees = 0;
      destroyedCells = 0;

      // Hide start screen and start game
      startScreen.classList.add('hidden');
      gameStarted = true;
    });

    // Slider handlers (for in-game adjustments)
    colonySizeInput.oninput = () => {
      colonySizeVal.textContent = colonySizeInput.value;
      startColonySizeInput.value = colonySizeInput.value;
      startColonySizeVal.textContent = colonySizeInput.value;
      createBees(+colonySizeInput.value);
    };
    maxColonySizeInput.oninput = () => {
      maxColonySizeVal.textContent = maxColonySizeInput.value;
      startMaxColonySizeInput.value = maxColonySizeInput.value;
      startMaxColonySizeVal.textContent = maxColonySizeInput.value;
    };
    resourceCountInput.oninput = () => {
      resourceCountVal.textContent = resourceCountInput.value;
      startResourceCountInput.value = resourceCountInput.value;
      startResourceCountVal.textContent = resourceCountInput.value;
      makeResourceSpots(+resourceCountInput.value, +resourceAmountInput.value);
      bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
    };
    resourceAmountInput.oninput = () => {
      resourceAmountVal.textContent = resourceAmountInput.value;
      startResourceAmountInput.value = resourceAmountInput.value;
      startResourceAmountVal.textContent = resourceAmountInput.value;
      makeResourceSpots(+resourceCountInput.value, +resourceAmountInput.value);
      bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
    };
    priorityPercentInput.oninput = () => {
      priorityPercentVal.textContent = priorityPercentInput.value + '%';
      startPriorityPercentInput.value = priorityPercentInput.value;
      startPriorityPercentVal.textContent = priorityPercentInput.value + '%';
    };
    shotDistanceInput.oninput = () => {
      shotDistanceVal.textContent = shotDistanceInput.value;
      startShotDistanceInput.value = shotDistanceInput.value;
      startShotDistanceVal.textContent = shotDistanceInput.value;
    };

    // Restart function
    function restartGame() {
      gameOver = false;
      gameOverEl.classList.remove('show');
      
      // Stop engine sound
      stopEngineSound();
      
      // Reset score
      score = 0;
      destroyedBees = 0;
      destroyedCells = 0;
      
      // Reset explosion
      userExplosion = null;
      
      // Reset user
      placeUserIcon();
      
      // Reset trail (already done in placeUserIcon, but ensure it's cleared)
      userTrail = [];
      lastTrailX = null;
      lastTrailY = null;
      
      // Reset bees
      createBees(+colonySizeInput.value);
      lastBeeAdditionTime = 0;
      
      // Reset resources
      makeResourceSpots(+resourceCountInput.value, +resourceAmountInput.value);
      
      // Clear bullets
      bullets = [];
      
      // Reset special weapons
      weapons.freeze.count = 3;
      weapons.electric.count = 3;
      weapons.warp.count = 2;
      freezeBombs = [];
      electricBlasts = [];
      currentWeaponIndex = 0;
      updateWeaponUI();
      
      // Reset hive
      hiveHoney = 0;
      cells.length = 1;
      cells[0] = { q: 0, r: 0, buildProg: 1, honey: 0, hp: CELL_MAX_HP, maxHp: CELL_MAX_HP, fireCooldown: 0 };
    }
    
    restartBtn.addEventListener('click', restartGame);
    
    // Return to settings function
    function returnToSettings() {
      gameOver = false;
      gameStarted = false;
      gameOverEl.classList.remove('show');
      startScreen.classList.remove('hidden');
      
      // Stop engine sound
      stopEngineSound();
      
      // Clear game state
      bullets = [];
      freezeBombs = [];
      electricBlasts = [];
      userTrail = [];
      lastTrailX = null;
      lastTrailY = null;
      userExplosion = null;
      spawnIndicator = null;
      userIcon = null;
      bees = [];
      cells.length = 0;
      resourceSpots = [];
      
      // Reset score
      score = 0;
      destroyedBees = 0;
      destroyedCells = 0;
    }
    
    settingsBtn.addEventListener('click', returnToSettings);
    
    // Allow restart with R key
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'r' && gameOver) {
        restartGame();
      }
    });

    // Initialize start screen slider values
    startColonySizeVal.textContent = startColonySizeInput.value;
    startMaxColonySizeVal.textContent = startMaxColonySizeInput.value;
    startResourceCountVal.textContent = startResourceCountInput.value;
    startResourceAmountVal.textContent = startResourceAmountInput.value;
    startPriorityPercentVal.textContent = startPriorityPercentInput.value + '%';
    startShotDistanceVal.textContent = startShotDistanceInput.value;
    
    // Initialize game UI values (but don't start game yet)
    maxColonySizeVal.textContent = maxColonySizeInput.value;
    priorityPercentVal.textContent = priorityPercentInput.value + '%';
    shotDistanceVal.textContent = shotDistanceInput.value;
    
    // Start the game loop (it won't update/draw until gameStarted is true)
    requestAnimationFrame(loop);
