// ========================================
// Game State and Main Loop
// ========================================

import { 
  initCanvas, 
  updateScreenShake, 
  IDLE_THRESHOLD, 
  HIVE_PROTECTION_DURATION 
} from './config.js';
import { initAudioContext, stopEngineSound, isEngineRunning } from './audio.js';
import { startMusic, stopMusic, setMusicVolume, isMusicPlaying, toggleMusic } from './music.js';
import { makeResourceSpots, resetResourceSpots } from './resources.js';
import { cells, updateCells, resetCells, cellExplosions } from './cells.js';
import { 
  bees, 
  hunterBees, 
  createBees, 
  updateBees, 
  updateDropship, 
  updateHunterBees, 
  updateExplosions, 
  resetBees,
  spawnDropship,
  destroyedBees,
  destroyedCells,
  setDestroyedBees,
  setDestroyedCells,
  setDropship
} from './bees.js';
import { 
  bullets, 
  updateBullets, 
  updateWeaponEffects, 
  resetCombat, 
  updateWeaponUI 
} from './combat.js';
import { 
  userIcon, 
  updateUser, 
  checkUserDeath, 
  resetUser, 
  placeUserIcon,
  initInput,
  setGameStateRefs
} from './user.js';
import { draw } from './draw.js';
import { initUI, updateGameUI, setGameFunctions, resetUICache } from './ui.js';

// Game state
let gameOver = false;
let gameStarted = false;
let gameStartTime = 0;

// Score tracking
let score = 0;

// Refs for cross-module state
const gameStartedRef = { value: false };
const gameOverRef = { value: false };

// Main update function
function update(now, dt) {
  if (gameOver || !gameStarted) {
    if (isEngineRunning) {
      stopEngineSound();
    }
    return;
  }
  
  // Update user
  updateUser(dt, now);
  
  // Check for idle - spawn dropship
  if (userIcon && userIcon.stationaryTime >= IDLE_THRESHOLD && hunterBees.length === 0) {
    spawnDropship(userIcon);
    userIcon.stationaryTime = 0;
  }
  
  // Update dropship and hunter bees
  updateDropship(dt);
  updateHunterBees(dt, userIcon, bullets);
  
  // Update explosions
  updateExplosions(dt, cellExplosions);
  
  // Update weapon effects
  updateWeaponEffects(dt);
  
  // Update screen shake
  updateScreenShake(dt);
  
  // Update bullets
  updateBullets(dt, now, userIcon, gameStartTime, HIVE_PROTECTION_DURATION);
  
  // Update cells
  updateCells(dt, now, userIcon, bullets, gameStartTime, HIVE_PROTECTION_DURATION);
  
  // Update bees
  const preferHighPct = +document.getElementById('priorityPercent').value;
  updateBees(dt, now, preferHighPct, userIcon);
  
  // Update score
  score = destroyedBees * 5 + destroyedCells * 10;
  
  // Update UI
  updateGameUI(score);
  
  // Check for game over
  checkUserDeath();
}

// Game loop
let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  update(now, dt);
  draw(gameOver, gameStarted, gameStartTime);
  requestAnimationFrame(loop);
}

// Start game
function startGame() {
  initAudioContext();
  
  // Sync settings from start screen
  document.getElementById('colonySize').value = document.getElementById('startColonySize').value;
  document.getElementById('colonySizeVal').textContent = document.getElementById('startColonySize').value;
  document.getElementById('maxColonySize').value = document.getElementById('startMaxColonySize').value;
  document.getElementById('maxColonySizeVal').textContent = document.getElementById('startMaxColonySize').value;
  document.getElementById('resourceCount').value = document.getElementById('startResourceCount').value;
  document.getElementById('resourceCountVal').textContent = document.getElementById('startResourceCount').value;
  document.getElementById('resourceAmount').value = document.getElementById('startResourceAmount').value;
  document.getElementById('resourceAmountVal').textContent = document.getElementById('startResourceAmount').value;
  document.getElementById('priorityPercent').value = document.getElementById('startPriorityPercent').value;
  document.getElementById('priorityPercentVal').textContent = document.getElementById('startPriorityPercent').value + '%';
  document.getElementById('shotDistance').value = document.getElementById('startShotDistance').value;
  document.getElementById('shotDistanceVal').textContent = document.getElementById('startShotDistance').value;

  // Initialize game
  createBees(+document.getElementById('colonySize').value);
  makeResourceSpots(+document.getElementById('resourceCount').value, +document.getElementById('resourceAmount').value);
  placeUserIcon();
  updateWeaponUI();

  // Reset score
  score = 0;
  setDestroyedBees(0);
  setDestroyedCells(0);

  // Hide start screen
  document.getElementById('startScreen').classList.add('hidden');
  gameStarted = true;
  gameStartedRef.value = true;
  gameStartTime = performance.now();
  
  // Start background music
  startMusic();
  updateMusicToggleUI();
}

// Restart game
function restartGame() {
  gameOver = false;
  gameOverRef.value = false;
  document.getElementById('gameOver').classList.remove('show');
  
  stopEngineSound();
  
  // Reset score
  score = 0;
  setDestroyedBees(0);
  setDestroyedCells(0);
  
  // Reset UI cache for fresh updates
  resetUICache();
  
  // Reset game start time
  gameStartTime = performance.now();
  
  // Reset user
  resetUser();
  
  // Reset bees
  resetBees();
  createBees(+document.getElementById('colonySize').value);
  
  // Reset resources
  makeResourceSpots(+document.getElementById('resourceCount').value, +document.getElementById('resourceAmount').value);
  
  // Reset combat
  resetCombat();
  updateWeaponUI();
  
  // Reset hive
  resetCells();
}

// Return to settings
function returnToSettings() {
  gameOver = false;
  gameOverRef.value = false;
  gameStarted = false;
  gameStartedRef.value = false;
  document.getElementById('gameOver').classList.remove('show');
  document.getElementById('startScreen').classList.remove('hidden');
  
  stopEngineSound();
  stopMusic();
  updateMusicToggleUI();
  
  // Clear game state
  resetCombat();
  resetBees();
  resetUser();
  cells.length = 0;
  resetResourceSpots();
  
  // Reset score
  score = 0;
  setDestroyedBees(0);
  setDestroyedCells(0);
  
  // Reset UI cache
  resetUICache();
}

// Initialize game
function initGame() {
  // Create a ref object for userIcon (used for resize)
  const userIconRef = { get current() { return userIcon; } };
  
  // Initialize canvas
  initCanvas(userIconRef);
  
  // Set game state refs for user module
  setGameStateRefs(gameStartedRef, gameOverRef, restartGame);
  
  // Set game functions for UI module
  setGameFunctions(createBees, makeResourceSpots, startGame, restartGame, returnToSettings, gameStartedRef);
  
  // Initialize UI
  initUI();
  
  // Initialize music controls
  initMusicControls();
  
  // Initialize input handlers
  initInput();
  
  // Start game loop
  requestAnimationFrame(loop);
}

// Initialize music controls
function initMusicControls() {
  const musicToggle = document.getElementById('musicToggle');
  const musicVolume = document.getElementById('musicVolume');
  
  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      toggleMusic();
      updateMusicToggleUI();
    });
  }
  
  if (musicVolume) {
    musicVolume.addEventListener('input', (e) => {
      setMusicVolume(e.target.value / 100);
    });
  }
}

// Update music toggle button appearance
function updateMusicToggleUI() {
  const musicToggle = document.getElementById('musicToggle');
  if (musicToggle) {
    if (isMusicPlaying()) {
      musicToggle.classList.add('playing');
      musicToggle.textContent = '🎵';
    } else {
      musicToggle.classList.remove('playing');
      musicToggle.textContent = '🔇';
    }
  }
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
