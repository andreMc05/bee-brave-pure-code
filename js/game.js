// ========================================
// Game State and Main Loop
// ========================================

// Game state
let gameOver = false;
let gameStarted = false;
let gameStartTime = 0;

// Score tracking
let score = 0;
let destroyedBees = 0;
let destroyedCells = 0;

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
  if (userIcon && userIcon.stationaryTime >= IDLE_THRESHOLD && !dropship && hunterBees.length === 0) {
    spawnDropship();
    userIcon.stationaryTime = 0;
  }
  
  // Update dropship and hunter bees
  updateDropship(dt);
  updateHunterBees(dt);
  
  // Update explosions
  updateExplosions(dt);
  
  // Update weapon effects
  updateWeaponEffects(dt);
  
  // Update screen shake
  updateScreenShake(dt);
  
  // Update bullets
  updateBullets(dt, now);
  
  // Update cells
  updateCells(dt, now);
  
  // Update bees
  const preferHighPct = +document.getElementById('priorityPercent').value;
  updateBees(dt, now, preferHighPct);
  
  // Update score
  score = destroyedBees * 5 + destroyedCells * 10;
  
  // Update UI
  updateGameUI();
  
  // Check for game over
  checkUserDeath();
}

// Game loop
let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  update(now, dt);
  draw();
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
  destroyedBees = 0;
  destroyedCells = 0;

  // Hide start screen
  document.getElementById('startScreen').classList.add('hidden');
  gameStarted = true;
  gameStartTime = performance.now();
}

// Restart game
function restartGame() {
  gameOver = false;
  document.getElementById('gameOver').classList.remove('show');
  
  stopEngineSound();
  
  // Reset score
  score = 0;
  destroyedBees = 0;
  destroyedCells = 0;
  
  // Reset game start time
  gameStartTime = performance.now();
  
  // Reset user
  resetUser();
  
  // Reset bees
  createBees(+document.getElementById('colonySize').value);
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
  gameStarted = false;
  document.getElementById('gameOver').classList.remove('show');
  document.getElementById('startScreen').classList.remove('hidden');
  
  stopEngineSound();
  
  // Clear game state
  resetCombat();
  resetBees();
  resetUser();
  cells.length = 0;
  resourceSpots = [];
  
  // Reset score
  score = 0;
  destroyedBees = 0;
  destroyedCells = 0;
}

// Initialize game
function initGame() {
  // Initialize canvas
  initCanvas();
  
  // Initialize UI
  initUI();
  
  // Initialize input handlers
  initInput();
  
  // Start game loop
  requestAnimationFrame(loop);
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
