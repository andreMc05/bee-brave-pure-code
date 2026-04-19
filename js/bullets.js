// ========================================
// Bullet storage + object pool (shared by combat, cells, bees)
// ========================================

import { ObjectPool } from './object-pool.js';

export let bullets = [];

function createBulletShell() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    maxDistance: 0,
    distanceTraveled: 0,
    radius: 3,
    isHiveBullet: false,
    isHunterLaser: false,
    damage: 0
  };
}

const bulletPool = new ObjectPool(createBulletShell);

const defaultFields = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  angle: 0,
  maxDistance: 0,
  distanceTraveled: 0,
  radius: 3,
  isHiveBullet: false,
  isHunterLaser: false,
  damage: 0
};

export function spawnBullet(overrides) {
  const b = bulletPool.acquire();
  Object.assign(b, defaultFields, overrides);
  bullets.push(b);
}

export function releaseBullet(b) {
  bulletPool.release(b);
}

export function resetBullets() {
  for (let i = 0; i < bullets.length; i++) {
    bulletPool.release(bullets[i]);
  }
  bullets.length = 0;
}

export function setBullets(newBullets) {
  resetBullets();
  for (let i = 0; i < newBullets.length; i++) {
    bullets.push(newBullets[i]);
  }
}
