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

