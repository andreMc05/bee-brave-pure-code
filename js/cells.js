// ========================================
// Hive Cells and Hex Grid Logic
// ========================================

import {
  HEX_SIZE,
  CELL_MAX_HP,
  honeyPerCell,
  honeyToBuild,
  HIVE_FIRE_COOLDOWN,
  HIVE_FIRE_RANGE,
  center,
  directions,
  triggerScreenShake
} from './config.js';

// Cell storage
export let cells = [{ q: 0, r: 0, buildProg: 1, honey: 0, hp: CELL_MAX_HP, maxHp: CELL_MAX_HP, fireCooldown: 0 }];
export let hiveHoney = 0;

// Cell explosions array (managed here, used by bees.js and draw.js)
export let cellExplosions = [];

// Hex coordinate to pixel position
export function hexToPixel(q, r) {
  const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
  const y = HEX_SIZE * (3/2 * r);
  return { x: center.x + x, y: center.y + y };
}

// Check if cell exists at coordinates
export function hasCell(q, r) {
  return cells.some(c => c.q === q && c.r === r);
}

// Check if point is inside a hexagon
export function isPointInHex(px, py, hexCenterX, hexCenterY, hexSize) {
  const dx = px - hexCenterX;
  const dy = py - hexCenterY;
  const distFromCenter = Math.hypot(dx, dy);
  return distFromCenter <= hexSize;
}

// Get cell at a specific point
export function getCellAtPoint(px, py) {
  for (let c of cells) {
    const p = hexToPixel(c.q, c.r);
    const effectiveSize = HEX_SIZE * c.buildProg;
    if (isPointInHex(px, py, p.x, p.y, effectiveSize)) {
      return c;
    }
  }
  return null;
}

// Try to build new cells
export function tryBuildNewCell() {
  // Only build if ALL existing cells are completely filled
  const incompleteCells = cells.filter(c => c.buildProg < 1);
  if (incompleteCells.length > 0) return;
  
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

// Reset cells to initial state
export function resetCells() {
  hiveHoney = 0;
  cells.length = 1;
  cells[0] = { q: 0, r: 0, buildProg: 1, honey: 0, hp: CELL_MAX_HP, maxHp: CELL_MAX_HP, fireCooldown: 0 };
  cellExplosions = [];
}

// Update cells (growth and firing)
export function updateCells(dt, now, userIcon, bullets, gameStartTime, HIVE_PROTECTION_DURATION) {
  for (let c of cells) {
    // Grow cells
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
      
      if (distToUser <= HIVE_FIRE_RANGE) {
        const baseAngle = Math.atan2(userIcon.y - cellPos.y, userIcon.x - cellPos.x);
        
        // Improve accuracy if user is stationary
        const MAX_STATIONARY_TIME = 2000;
        const BASE_INACCURACY = 0.3;
        const MIN_INACCURACY = 0.06;
        
        const stationaryProgress = Math.min(1, userIcon.stationaryTime / MAX_STATIONARY_TIME);
        const inaccuracyRange = BASE_INACCURACY - (BASE_INACCURACY - MIN_INACCURACY) * stationaryProgress;
        const inaccuracy = (Math.random() - 0.5) * inaccuracyRange;
        const angle = baseAngle + inaccuracy;
        
        const hiveBulletSpeed = 4;
        const hiveBulletRadius = 5;
        const hiveBulletMaxDistance = 600;
        
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
        
        c.fireCooldown = HIVE_FIRE_COOLDOWN;
      }
    }
  }
  
  // Build new cells
  tryBuildNewCell();
}

// Create explosion when cell is destroyed
export function createCellExplosion(x, y) {
  cellExplosions.push({
    x: x,
    y: y,
    duration: 500,
    maxDuration: 500,
    radius: 10
  });
  // Trigger screen shake for cell destruction
  triggerScreenShake(6, 250);
}

// Setters for module state
export function setHiveHoney(val) { hiveHoney = val; }
export function addHiveHoney(val) { hiveHoney += val; }
export function setCells(newCells) { cells = newCells; }
export function setCellExplosions(newExplosions) { cellExplosions = newExplosions; }
