// ========================================
// Resource Spots Management
// ========================================

import { w, h, center } from './config.js';

export let resourceSpots = [];

// Create resource spots
export function makeResourceSpots(count, baseAmount) {
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
  const siteCountEl = document.getElementById('siteCount');
  if (siteCountEl) siteCountEl.textContent = resourceSpots.length;
}

// Update total resources display
export function updateTotalResources() {
  const total = resourceSpots.reduce((s, r) => s + r.amount, 0);
  const extResEl = document.getElementById('extRes');
  if (extResEl) extResEl.textContent = Math.floor(total);
}

// Check if all resources have been gathered
export function areAllResourcesDepleted() {
  return resourceSpots.every(r => r.amount <= 0);
}

// Pick resource for a bee based on priority
export function pickResourceForBee(bee, preferHighPct) {
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

// Reset resource spots
export function resetResourceSpots() {
  resourceSpots = [];
}
