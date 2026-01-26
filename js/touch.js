// ========================================
// Touch Controls - Mobile Input System
// ========================================

import { initAudioContext } from './audio.js';
import { shoot, useSpecialWeapon, cycleWeapon } from './combat.js';

// Touch state
let joystickActive = false;
let joystickTouchId = null;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickDeltaX = 0;
let joystickDeltaY = 0;

// Joystick configuration
const JOYSTICK_MAX_RADIUS = 35; // Max distance thumb can move from center

// Touch input state (exported for user.js to read)
export const touchInput = {
  moveX: 0,  // -1 to 1 (left/right)
  moveY: 0,  // -1 to 1 (up/down)
  fire: false,
  special: false,
  cycle: false
};

// Game state refs (set by game.js)
let gameStartedRef = { value: false };
let gameOverRef = { value: false };
let userIconRef = null;

// DOM elements
let touchControlsEl = null;
let joystickZoneEl = null;
let joystickBaseEl = null;
let joystickThumbEl = null;
let fireBtn = null;
let specialBtn = null;
let cycleBtn = null;

// Check if device supports touch
export function isTouchDevice() {
  return ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0) || 
         (navigator.msMaxTouchPoints > 0);
}

// Initialize touch controls
export function initTouchControls() {
  // Get DOM elements
  touchControlsEl = document.getElementById('touchControls');
  joystickZoneEl = document.getElementById('joystickZone');
  joystickBaseEl = document.getElementById('joystickBase');
  joystickThumbEl = document.getElementById('joystickThumb');
  fireBtn = document.getElementById('touchFire');
  specialBtn = document.getElementById('touchSpecial');
  cycleBtn = document.getElementById('touchCycle');
  
  if (!touchControlsEl) return;
  
  // Show touch controls on touch devices
  if (isTouchDevice()) {
    enableTouchControls();
  }
  
  // Set up joystick events
  if (joystickZoneEl) {
    joystickZoneEl.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickZoneEl.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickZoneEl.addEventListener('touchend', handleJoystickEnd, { passive: false });
    joystickZoneEl.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
  }
  
  // Set up button events
  if (fireBtn) {
    fireBtn.addEventListener('touchstart', handleFireStart, { passive: false });
    fireBtn.addEventListener('touchend', handleFireEnd, { passive: false });
    fireBtn.addEventListener('touchcancel', handleFireEnd, { passive: false });
  }
  
  if (specialBtn) {
    specialBtn.addEventListener('touchstart', handleSpecialStart, { passive: false });
    specialBtn.addEventListener('touchend', handleSpecialEnd, { passive: false });
    specialBtn.addEventListener('touchcancel', handleSpecialEnd, { passive: false });
  }
  
  if (cycleBtn) {
    cycleBtn.addEventListener('touchstart', handleCycleStart, { passive: false });
    cycleBtn.addEventListener('touchend', handleCycleEnd, { passive: false });
    cycleBtn.addEventListener('touchcancel', handleCycleEnd, { passive: false });
  }
  
  // Prevent default touch behaviors on canvas
  const canvas = document.getElementById('c');
  if (canvas) {
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }
}

// Enable touch controls (show UI)
export function enableTouchControls() {
  if (touchControlsEl) {
    touchControlsEl.classList.remove('hidden');
    touchControlsEl.classList.add('mobile-enabled');
  }
}

// Disable touch controls (hide UI)
export function disableTouchControls() {
  if (touchControlsEl) {
    touchControlsEl.classList.add('hidden');
    touchControlsEl.classList.remove('mobile-enabled');
  }
}

// Set game state refs
export function setTouchGameRefs(started, over, getUserIcon) {
  gameStartedRef = started;
  gameOverRef = over;
  userIconRef = getUserIcon;
}

// ========================================
// Joystick Handlers
// ========================================

function handleJoystickStart(e) {
  e.preventDefault();
  initAudioContext();
  
  if (joystickActive) return; // Already tracking a touch
  
  const touch = e.changedTouches[0];
  joystickActive = true;
  joystickTouchId = touch.identifier;
  
  // Get joystick base center position
  const baseRect = joystickBaseEl.getBoundingClientRect();
  joystickStartX = baseRect.left + baseRect.width / 2;
  joystickStartY = baseRect.top + baseRect.height / 2;
  
  // Calculate initial delta from center
  joystickDeltaX = touch.clientX - joystickStartX;
  joystickDeltaY = touch.clientY - joystickStartY;
  
  updateJoystick();
  joystickThumbEl.classList.add('active');
}

function handleJoystickMove(e) {
  e.preventDefault();
  
  if (!joystickActive) return;
  
  // Find our tracked touch
  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    if (touch.identifier === joystickTouchId) {
      joystickDeltaX = touch.clientX - joystickStartX;
      joystickDeltaY = touch.clientY - joystickStartY;
      updateJoystick();
      break;
    }
  }
}

function handleJoystickEnd(e) {
  e.preventDefault();
  
  // Check if our tracked touch ended
  for (let i = 0; i < e.changedTouches.length; i++) {
    if (e.changedTouches[i].identifier === joystickTouchId) {
      joystickActive = false;
      joystickTouchId = null;
      joystickDeltaX = 0;
      joystickDeltaY = 0;
      
      // Reset joystick visual
      joystickThumbEl.style.transform = 'translate(0px, 0px)';
      joystickThumbEl.classList.remove('active');
      
      // Reset input
      touchInput.moveX = 0;
      touchInput.moveY = 0;
      break;
    }
  }
}

function updateJoystick() {
  // Calculate distance from center
  const distance = Math.hypot(joystickDeltaX, joystickDeltaY);
  
  // Clamp to max radius
  let clampedX = joystickDeltaX;
  let clampedY = joystickDeltaY;
  
  if (distance > JOYSTICK_MAX_RADIUS) {
    const scale = JOYSTICK_MAX_RADIUS / distance;
    clampedX = joystickDeltaX * scale;
    clampedY = joystickDeltaY * scale;
  }
  
  // Update thumb visual position
  joystickThumbEl.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
  
  // Update input state (-1 to 1 range)
  touchInput.moveX = clampedX / JOYSTICK_MAX_RADIUS;
  touchInput.moveY = clampedY / JOYSTICK_MAX_RADIUS;
}

// ========================================
// Button Handlers
// ========================================

// Fire button - continuous fire while held
let fireInterval = null;

function handleFireStart(e) {
  e.preventDefault();
  initAudioContext();
  
  touchInput.fire = true;
  
  // Fire immediately
  const userIcon = userIconRef ? userIconRef() : null;
  shoot(userIcon, gameStartedRef.value);
  
  // Set up continuous fire (every 150ms)
  fireInterval = setInterval(() => {
    const userIcon = userIconRef ? userIconRef() : null;
    shoot(userIcon, gameStartedRef.value);
  }, 150);
}

function handleFireEnd(e) {
  e.preventDefault();
  touchInput.fire = false;
  
  if (fireInterval) {
    clearInterval(fireInterval);
    fireInterval = null;
  }
}

// Special weapon button
function handleSpecialStart(e) {
  e.preventDefault();
  initAudioContext();
  
  touchInput.special = true;
  const userIcon = userIconRef ? userIconRef() : null;
  useSpecialWeapon(userIcon, gameOverRef.value, gameStartedRef.value);
}

function handleSpecialEnd(e) {
  e.preventDefault();
  touchInput.special = false;
}

// Cycle weapon button
function handleCycleStart(e) {
  e.preventDefault();
  initAudioContext();
  
  touchInput.cycle = true;
  cycleWeapon();
}

function handleCycleEnd(e) {
  e.preventDefault();
  touchInput.cycle = false;
}

// ========================================
// Cleanup
// ========================================

export function resetTouchInput() {
  joystickActive = false;
  joystickTouchId = null;
  joystickDeltaX = 0;
  joystickDeltaY = 0;
  touchInput.moveX = 0;
  touchInput.moveY = 0;
  touchInput.fire = false;
  touchInput.special = false;
  touchInput.cycle = false;
  
  if (joystickThumbEl) {
    joystickThumbEl.style.transform = 'translate(0px, 0px)';
    joystickThumbEl.classList.remove('active');
  }
  
  if (fireInterval) {
    clearInterval(fireInterval);
    fireInterval = null;
  }
}
