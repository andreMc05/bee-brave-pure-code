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
  setGameStateRefs,
  getUserIcon
} from './user.js';
import { draw } from './draw.js';
import { initUI, updateGameUI, setGameFunctions, resetUICache, showFinalScore } from './ui.js';
import { updateParticles, resetParticles } from './particles.js';
import { initTouchControls, setTouchGameRefs, resetTouchInput } from './touch.js';

// Game state
let gameOver = false;
let gameStarted = false;
let gameStartTime = 0;

// Score tracking
let score = 0;
let highScore = 0;

// Local storage key
const HIGH_SCORE_KEY = 'beeBrave_highScore';

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
  
  // Update particles
  updateParticles(dt);
  
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

// Load high score from localStorage
function loadHighScore() {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    highScore = saved ? parseInt(saved, 10) : 0;
  } catch (e) {
    highScore = 0;
  }
  updateHighScoreDisplay();
}

// Save high score to localStorage
function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    try {
      localStorage.setItem(HIGH_SCORE_KEY, highScore.toString());
    } catch (e) {
      console.warn('Could not save high score');
    }
    updateHighScoreDisplay();
  }
}

// Update high score display
function updateHighScoreDisplay() {
  const el = document.getElementById('highScoreValue');
  if (el) el.textContent = highScore.toLocaleString();
}

// Quick play - start with default settings
function quickPlay() {
  initAudioContext();
  
  // Hide landing screen
  document.getElementById('landingScreen').classList.add('hidden');
  
  // Use default values (already set in HTML)
  syncSettingsToGame();
  launchGame();
}

// Custom game - go to settings screen
function showSettings() {
  document.getElementById('landingScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
}

// Back to landing from settings
function backToLanding() {
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('landingScreen').classList.remove('hidden');
}

// Return to main menu from game over
function returnToMainMenu() {
  gameOver = false;
  gameOverRef.value = false;
  gameStarted = false;
  gameStartedRef.value = false;
  document.getElementById('gameOver').classList.remove('show');
  document.getElementById('landingScreen').classList.remove('hidden');
  
  stopEngineSound();
  stopMusic();
  updateAllMusicToggles();
  
  // Clear game state
  resetCombat();
  resetBees();
  resetUser();
  resetParticles();
  resetTouchInput();
  cells.length = 0;
  resetResourceSpots();
  
  // Reset score
  score = 0;
  setDestroyedBees(0);
  setDestroyedCells(0);
  
  // Reset UI cache
  resetUICache();
}

// Sync settings from start screen to hidden game controls
function syncSettingsToGame() {
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
}

// Launch the actual game
function launchGame() {
  // Initialize game
  createBees(+document.getElementById('colonySize').value);
  makeResourceSpots(+document.getElementById('resourceCount').value, +document.getElementById('resourceAmount').value);
  placeUserIcon();
  updateWeaponUI();

  // Reset score
  score = 0;
  setDestroyedBees(0);
  setDestroyedCells(0);

  gameStarted = true;
  gameStartedRef.value = true;
  gameStartTime = performance.now();
  
  // Start background music
  startMusic();
  updateAllMusicToggles();
}

// Start game from settings screen
function startGame() {
  initAudioContext();
  
  // Sync settings
  syncSettingsToGame();

  // Hide start screen
  document.getElementById('startScreen').classList.add('hidden');
  
  launchGame();
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
  
  // Reset particles
  resetParticles();
  
  // Reset touch input
  resetTouchInput();
  
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
  updateAllMusicToggles();
  
  // Clear game state
  resetCombat();
  resetBees();
  resetUser();
  resetParticles();
  resetTouchInput();
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
  // Load high score
  loadHighScore();
  
  // Create a ref object for userIcon (used for resize)
  const userIconRef = { get current() { return userIcon; } };
  
  // Initialize canvas
  initCanvas(userIconRef);
  
  // Set game state refs for user module
  setGameStateRefs(gameStartedRef, gameOverRef, restartGame, handleGameOver);
  
  // Set game functions for UI module
  setGameFunctions(createBees, makeResourceSpots, startGame, restartGame, returnToSettings, gameStartedRef);
  
  // Initialize UI
  initUI();
  
  // Initialize landing screen
  initLandingScreen();
  
  // Initialize music controls
  initMusicControls();
  
  // Initialize input handlers
  initInput();
  
  // Initialize touch controls for mobile
  initTouchControls();
  setTouchGameRefs(gameStartedRef, gameOverRef, getUserIcon);
  
  // Start game loop
  requestAnimationFrame(loop);
}

// Initialize landing screen buttons
function initLandingScreen() {
  // Quick Play button
  document.getElementById('quickPlayBtn')?.addEventListener('click', quickPlay);
  
  // Custom Game button
  document.getElementById('customGameBtn')?.addEventListener('click', showSettings);
  
  // Back to landing button
  const backBtn = document.getElementById('backToLanding');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      backToLanding();
    });
  }
  
  // Main menu button (game over screen)
  document.getElementById('mainMenuBtn')?.addEventListener('click', returnToMainMenu);
  
  // How to Play modal
  const howToPlayBtn = document.getElementById('howToPlayBtn');
  const howToPlayModal = document.getElementById('howToPlayModal');
  const closeHowToPlay = document.getElementById('closeHowToPlay');
  const gotItBtn = document.getElementById('gotItBtn');
  
  howToPlayBtn?.addEventListener('click', () => {
    howToPlayModal?.classList.remove('hidden');
  });
  
  closeHowToPlay?.addEventListener('click', () => {
    howToPlayModal?.classList.add('hidden');
  });
  
  gotItBtn?.addEventListener('click', () => {
    howToPlayModal?.classList.add('hidden');
  });
  
  // Close modal on outside click
  howToPlayModal?.addEventListener('click', (e) => {
    if (e.target === howToPlayModal) {
      howToPlayModal.classList.add('hidden');
    }
  });
  
  // Landing music toggle
  const landingMusicToggle = document.getElementById('landingMusicToggle');
  landingMusicToggle?.addEventListener('click', () => {
    initAudioContext();
    toggleMusic();
    updateAllMusicToggles();
  });
}

// Initialize music controls
function initMusicControls() {
  const musicToggle = document.getElementById('musicToggle');
  const musicVolume = document.getElementById('musicVolume');
  
  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      toggleMusic();
      updateAllMusicToggles();
    });
  }
  
  if (musicVolume) {
    musicVolume.addEventListener('input', (e) => {
      setMusicVolume(e.target.value / 100);
    });
  }
}

// Update all music toggle buttons appearance
function updateAllMusicToggles() {
  const playing = isMusicPlaying();
  
  // Game UI toggle
  const musicToggle = document.getElementById('musicToggle');
  if (musicToggle) {
    if (playing) {
      musicToggle.classList.add('playing');
      musicToggle.textContent = '🎵';
    } else {
      musicToggle.classList.remove('playing');
      musicToggle.textContent = '🔇';
    }
  }
  
  // Landing screen toggle
  const landingToggle = document.getElementById('landingMusicToggle');
  if (landingToggle) {
    if (playing) {
      landingToggle.classList.add('playing');
      landingToggle.textContent = '🎵';
    } else {
      landingToggle.classList.remove('playing');
      landingToggle.textContent = '🔇';
    }
  }
}

// Handle game over - show final score and save high score
function handleGameOver() {
  showFinalScore(score);
  saveHighScore();
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
