// ========================================
// UI Updates and Event Handlers
// ========================================

import { cells, hiveHoney } from './cells.js';
import { bees, destroyedBees, destroyedCells } from './bees.js';
import { userIcon } from './user.js';

// UI element references
let colonySizeInput, colonySizeVal;
let maxColonySizeInput, maxColonySizeVal;
let resourceCountInput, resourceCountVal;
let resourceAmountInput, resourceAmountVal;
let priorityPercentInput, priorityPercentVal;
let shotDistanceInput, shotDistanceVal;

let startColonySizeInput, startColonySizeVal;
let startMaxColonySizeInput, startMaxColonySizeVal;
let startResourceCountInput, startResourceCountVal;
let startResourceAmountInput, startResourceAmountVal;
let startPriorityPercentInput, startPriorityPercentVal;
let startShotDistanceInput, startShotDistanceVal;

let scoreDisplay, colonyDisplay;
let shieldBar, shieldValue, healthBar, healthValue;
let gameOverEl, startScreen, startBtn, restartBtn, settingsBtn;
let finalScoreValue;

// Game functions to be set from game.js
let createBeesFn = null;
let makeResourceSpotsFn = null;
let startGameFn = null;
let restartGameFn = null;
let returnToSettingsFn = null;
let gameStartedRef = { value: false };

// Set game functions
export function setGameFunctions(createBees, makeResourceSpots, startGame, restartGame, returnToSettings, gameStarted) {
  createBeesFn = createBees;
  makeResourceSpotsFn = makeResourceSpots;
  startGameFn = startGame;
  restartGameFn = restartGame;
  returnToSettingsFn = returnToSettings;
  gameStartedRef = gameStarted;
}

// Initialize UI element references
export function initUI() {
  // Game control elements
  colonySizeInput = document.getElementById('colonySize');
  colonySizeVal = document.getElementById('colonySizeVal');
  maxColonySizeInput = document.getElementById('maxColonySize');
  maxColonySizeVal = document.getElementById('maxColonySizeVal');
  resourceCountInput = document.getElementById('resourceCount');
  resourceCountVal = document.getElementById('resourceCountVal');
  resourceAmountInput = document.getElementById('resourceAmount');
  resourceAmountVal = document.getElementById('resourceAmountVal');
  priorityPercentInput = document.getElementById('priorityPercent');
  priorityPercentVal = document.getElementById('priorityPercentVal');
  shotDistanceInput = document.getElementById('shotDistance');
  shotDistanceVal = document.getElementById('shotDistanceVal');

  // Start screen elements
  startColonySizeInput = document.getElementById('startColonySize');
  startColonySizeVal = document.getElementById('startColonySizeVal');
  startMaxColonySizeInput = document.getElementById('startMaxColonySize');
  startMaxColonySizeVal = document.getElementById('startMaxColonySizeVal');
  startResourceCountInput = document.getElementById('startResourceCount');
  startResourceCountVal = document.getElementById('startResourceCountVal');
  startResourceAmountInput = document.getElementById('startResourceAmount');
  startResourceAmountVal = document.getElementById('startResourceAmountVal');
  startPriorityPercentInput = document.getElementById('startPriorityPercent');
  startPriorityPercentVal = document.getElementById('startPriorityPercentVal');
  startShotDistanceInput = document.getElementById('startShotDistance');
  startShotDistanceVal = document.getElementById('startShotDistanceVal');

  // Display elements
  scoreDisplay = document.getElementById('scoreDisplay');
  colonyDisplay = document.getElementById('colonyDisplay');
  shieldBar = document.getElementById('shieldBar');
  shieldValue = document.getElementById('shieldValue');
  healthBar = document.getElementById('healthBar');
  healthValue = document.getElementById('healthValue');

  // Screen elements
  gameOverEl = document.getElementById('gameOver');
  startScreen = document.getElementById('startScreen');
  startBtn = document.getElementById('startBtn');
  restartBtn = document.getElementById('restartBtn');
  settingsBtn = document.getElementById('settingsBtn');
  finalScoreValue = document.getElementById('finalScoreValue');

  // Initialize slider values
  initSliderValues();
  
  // Setup slider handlers
  setupSliderHandlers();
  
  // Setup button handlers
  setupButtonHandlers();
}

// Initialize slider display values
function initSliderValues() {
  if (startColonySizeVal) startColonySizeVal.textContent = startColonySizeInput.value;
  if (startMaxColonySizeVal) startMaxColonySizeVal.textContent = startMaxColonySizeInput.value;
  if (startResourceCountVal) startResourceCountVal.textContent = startResourceCountInput.value;
  if (startResourceAmountVal) startResourceAmountVal.textContent = startResourceAmountInput.value;
  if (startPriorityPercentVal) startPriorityPercentVal.textContent = startPriorityPercentInput.value + '%';
  if (startShotDistanceVal) startShotDistanceVal.textContent = startShotDistanceInput.value;
  
  if (maxColonySizeVal) maxColonySizeVal.textContent = maxColonySizeInput.value;
  if (priorityPercentVal) priorityPercentVal.textContent = priorityPercentInput.value + '%';
  if (shotDistanceVal) shotDistanceVal.textContent = shotDistanceInput.value;
}

// Setup start screen slider handlers
function setupSliderHandlers() {
  // Start screen sliders
  if (startColonySizeInput) {
    startColonySizeInput.oninput = () => {
      startColonySizeVal.textContent = startColonySizeInput.value;
      colonySizeInput.value = startColonySizeInput.value;
      colonySizeVal.textContent = startColonySizeInput.value;
      if (gameStartedRef.value && createBeesFn) {
        createBeesFn(+startColonySizeInput.value);
      }
    };
  }
  
  if (startMaxColonySizeInput) {
    startMaxColonySizeInput.oninput = () => {
      startMaxColonySizeVal.textContent = startMaxColonySizeInput.value;
      maxColonySizeInput.value = startMaxColonySizeInput.value;
      maxColonySizeVal.textContent = startMaxColonySizeInput.value;
    };
  }
  
  if (startResourceCountInput) {
    startResourceCountInput.oninput = () => {
      startResourceCountVal.textContent = startResourceCountInput.value;
      resourceCountInput.value = startResourceCountInput.value;
      resourceCountVal.textContent = startResourceCountInput.value;
      if (gameStartedRef.value && makeResourceSpotsFn) {
        makeResourceSpotsFn(+startResourceCountInput.value, +startResourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
  }
  
  if (startResourceAmountInput) {
    startResourceAmountInput.oninput = () => {
      startResourceAmountVal.textContent = startResourceAmountInput.value;
      resourceAmountInput.value = startResourceAmountInput.value;
      resourceAmountVal.textContent = startResourceAmountInput.value;
      if (gameStartedRef.value && makeResourceSpotsFn) {
        makeResourceSpotsFn(+startResourceCountInput.value, +startResourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
  }
  
  if (startPriorityPercentInput) {
    startPriorityPercentInput.oninput = () => {
      startPriorityPercentVal.textContent = startPriorityPercentInput.value + '%';
      priorityPercentInput.value = startPriorityPercentInput.value;
      priorityPercentVal.textContent = startPriorityPercentInput.value + '%';
    };
  }
  
  if (startShotDistanceInput) {
    startShotDistanceInput.oninput = () => {
      startShotDistanceVal.textContent = startShotDistanceInput.value;
      shotDistanceInput.value = startShotDistanceInput.value;
      shotDistanceVal.textContent = startShotDistanceInput.value;
    };
  }

  // In-game sliders
  if (colonySizeInput) {
    colonySizeInput.oninput = () => {
      colonySizeVal.textContent = colonySizeInput.value;
      startColonySizeInput.value = colonySizeInput.value;
      startColonySizeVal.textContent = colonySizeInput.value;
      if (createBeesFn) createBeesFn(+colonySizeInput.value);
    };
  }
  
  if (maxColonySizeInput) {
    maxColonySizeInput.oninput = () => {
      maxColonySizeVal.textContent = maxColonySizeInput.value;
      startMaxColonySizeInput.value = maxColonySizeInput.value;
      startMaxColonySizeVal.textContent = maxColonySizeInput.value;
    };
  }
  
  if (resourceCountInput) {
    resourceCountInput.oninput = () => {
      resourceCountVal.textContent = resourceCountInput.value;
      startResourceCountInput.value = resourceCountInput.value;
      startResourceCountVal.textContent = resourceCountInput.value;
      if (makeResourceSpotsFn) {
        makeResourceSpotsFn(+resourceCountInput.value, +resourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
  }
  
  if (resourceAmountInput) {
    resourceAmountInput.oninput = () => {
      resourceAmountVal.textContent = resourceAmountInput.value;
      startResourceAmountInput.value = resourceAmountInput.value;
      startResourceAmountVal.textContent = resourceAmountInput.value;
      if (makeResourceSpotsFn) {
        makeResourceSpotsFn(+resourceCountInput.value, +resourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
  }
  
  if (priorityPercentInput) {
    priorityPercentInput.oninput = () => {
      priorityPercentVal.textContent = priorityPercentInput.value + '%';
      startPriorityPercentInput.value = priorityPercentInput.value;
      startPriorityPercentVal.textContent = priorityPercentInput.value + '%';
    };
  }
  
  if (shotDistanceInput) {
    shotDistanceInput.oninput = () => {
      shotDistanceVal.textContent = shotDistanceInput.value;
      startShotDistanceInput.value = shotDistanceInput.value;
      startShotDistanceVal.textContent = shotDistanceInput.value;
    };
  }
}

// Setup button handlers
function setupButtonHandlers() {
  // Start button
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (startGameFn) startGameFn();
    });
  }
  
  // Restart button
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      if (restartGameFn) restartGameFn();
    });
  }
  
  // Settings button
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (returnToSettingsFn) returnToSettingsFn();
    });
  }
}

// Cache previous values to avoid unnecessary DOM updates
let prevShieldPercent = -1;
let prevHealthPercent = -1;
let prevScore = -1;
let prevColonyCount = -1;
let prevShieldLow = false;
let prevHealthClass = '';

// Update game UI displays (OPTIMIZED - only update DOM when values change)
export function updateGameUI(score) {
  if (!userIcon) return;
  
  // Update shield bar (only if changed)
  const shieldPercent = Math.floor((userIcon.shield / userIcon.maxShield) * 100);
  if (shieldPercent !== prevShieldPercent) {
    prevShieldPercent = shieldPercent;
    if (shieldBar) {
      // Use transform for GPU-accelerated rendering
      shieldBar.style.transform = `scaleX(${shieldPercent / 100})`;
      const isLow = shieldPercent < 30;
      if (isLow !== prevShieldLow) {
        prevShieldLow = isLow;
        shieldBar.classList.toggle('low', isLow);
      }
    }
    if (shieldValue) shieldValue.textContent = shieldPercent + '%';
  }
  
  // Update health bar (only if changed)
  const healthPercent = Math.floor(userIcon.health);
  if (healthPercent !== prevHealthPercent) {
    prevHealthPercent = healthPercent;
    if (healthBar) {
      // Use transform for GPU-accelerated rendering
      healthBar.style.transform = `scaleX(${healthPercent / 100})`;
      // Determine health class
      const newHealthClass = healthPercent < 25 ? 'low' : healthPercent < 50 ? 'medium' : '';
      if (newHealthClass !== prevHealthClass) {
        prevHealthClass = newHealthClass;
        healthBar.className = 'bar-fill health' + (newHealthClass ? ' ' + newHealthClass : '');
      }
    }
    if (healthValue) healthValue.textContent = healthPercent + '%';
  }
  
  // Update score (only if changed)
  if (score !== prevScore) {
    prevScore = score;
    if (scoreDisplay) scoreDisplay.textContent = score.toLocaleString();
  }
  
  // Update colony counter (only if changed)
  const colonyCount = bees.length;
  if (colonyCount !== prevColonyCount) {
    prevColonyCount = colonyCount;
    if (colonyDisplay) colonyDisplay.textContent = colonyCount;
  }
}

// Reset UI cache (call when restarting game)
export function resetUICache() {
  prevShieldPercent = -1;
  prevHealthPercent = -1;
  prevScore = -1;
  prevColonyCount = -1;
  prevShieldLow = false;
  prevHealthClass = '';
}

// Display final score on game over screen
export function showFinalScore(score) {
  if (finalScoreValue) {
    finalScoreValue.textContent = score.toLocaleString();
  }
}
