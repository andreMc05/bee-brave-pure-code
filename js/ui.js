// ========================================
// UI Updates and Event Handlers
// ========================================

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

// Initialize UI element references
function initUI() {
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
      if (gameStarted) {
        createBees(+startColonySizeInput.value);
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
      if (gameStarted) {
        makeResourceSpots(+startResourceCountInput.value, +startResourceAmountInput.value);
        bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
      }
    };
  }
  
  if (startResourceAmountInput) {
    startResourceAmountInput.oninput = () => {
      startResourceAmountVal.textContent = startResourceAmountInput.value;
      resourceAmountInput.value = startResourceAmountInput.value;
      resourceAmountVal.textContent = startResourceAmountInput.value;
      if (gameStarted) {
        makeResourceSpots(+startResourceCountInput.value, +startResourceAmountInput.value);
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
      createBees(+colonySizeInput.value);
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
      makeResourceSpots(+resourceCountInput.value, +resourceAmountInput.value);
      bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
    };
  }
  
  if (resourceAmountInput) {
    resourceAmountInput.oninput = () => {
      resourceAmountVal.textContent = resourceAmountInput.value;
      startResourceAmountInput.value = resourceAmountInput.value;
      startResourceAmountVal.textContent = resourceAmountInput.value;
      makeResourceSpots(+resourceCountInput.value, +resourceAmountInput.value);
      bees.forEach(b => { b.state = 'forage'; b.resourceSpot = null; b.target = null; });
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
    startBtn.addEventListener('click', startGame);
  }
  
  // Restart button
  if (restartBtn) {
    restartBtn.addEventListener('click', restartGame);
  }
  
  // Settings button
  if (settingsBtn) {
    settingsBtn.addEventListener('click', returnToSettings);
  }
}

// Update game UI displays
function updateGameUI() {
  const cellsEl = document.getElementById('cells');
  const honeyEl = document.getElementById('honey');
  
  if (cellsEl) cellsEl.textContent = cells.length;
  if (honeyEl) honeyEl.textContent = Math.floor(hiveHoney);
  
  if (userIcon) {
    // Update shield bar
    const shieldPercent = (userIcon.shield / userIcon.maxShield) * 100;
    if (shieldBar) {
      shieldBar.style.width = shieldPercent + '%';
      shieldBar.classList.toggle('low', shieldPercent < 30);
    }
    if (shieldValue) shieldValue.textContent = Math.floor(shieldPercent) + '%';
    
    // Update health bar
    const healthPercent = userIcon.health;
    if (healthBar) {
      healthBar.style.width = healthPercent + '%';
      healthBar.className = 'bar-fill health';
      if (healthPercent < 25) {
        healthBar.classList.add('low');
      } else if (healthPercent < 50) {
        healthBar.classList.add('medium');
      }
    }
    if (healthValue) healthValue.textContent = Math.floor(healthPercent) + '%';
    
    // Update score
    if (scoreDisplay) scoreDisplay.textContent = score.toLocaleString();
    
    // Update colony counter
    if (colonyDisplay) colonyDisplay.textContent = bees.length;
  }
}
