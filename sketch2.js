// Siege Pulse - A Strategic Board Game
// --------------------------------
// A turn-based strategy game where players control units to capture a central tower

// Game Configuration
const GRID_SIZE = 80;      // Size of each grid cell in pixels
const GRID_COLS = 5;       // Number of columns in the grid
const GRID_ROWS = 5;       // Number of rows in the grid
const TOWER_POS = { x: 2, y: 2 }; // Position of the central tower (middle of the board)
const TOWER_TURNS_TO_WIN = 3;     // Number of turns needed to control tower to win (increased from 2)

// Visual Enhancement Variables
let particles = [];        // Array to store particle effects
let gridGlow = 0;          // Grid glow effect intensity
let backgroundHue = 220;   // Background color hue

// Game State Variables
let grid = [];             // 2D array representing the game board
let players = [
  { color: [0, 200, 255], units: [], towerTurns: 0, name: "Player 1" }, // Blue
  { color: [255, 150, 0], units: [], towerTurns: 0, name: "Player 2" }  // Orange
];
let currentPlayer = 0;     // Index of the current player (0 or 1)
let selectedUnit = null;   // Index of the currently selected unit
let gameState = "waiting"; // Game state: "waiting", "playing", "tutorial", "won" or "stalemate"
let gameMode = "two-player"; // Game mode: "two-player" or "single-player"
let aiThinking = false;    // Flag to indicate if AI is currently "thinking"
let aiThinkingTime = 0;    // Counter for AI thinking animation

// Stalemate detection variables
let moveHistory = [];      // Array to store the last few moves
let repeatedMoveCount = 0; // Counter for repeated moves

// Tutorial Variables
let tutorialStep = 0;
let tutorialMessages = [
  "Welcome to Siege Pulse! Click Next to learn how to play.",
  "You control three units: Blaster (circle), Shield (square), and Launcher (triangle).",
  "First, let's move a unit. Click on your Blaster (circle) at the top row.",
  "Now click on an adjacent empty square to move there.",
  "Great! Now let's try attacking. Click on your Launcher (triangle).",
  "Launchers can attack in straight lines. Click on any square in a straight line from your Launcher.",
  "Shield units protect adjacent friendly units from ALL damage. Try moving your Shield unit next to another unit.",
  "Units protected by shields show a shield icon above them. Enemies cannot damage protected units!",
  "The goal is to control the central tower for 3 turns or eliminate all enemy units.",
  "To control the tower, move a unit next to it without enemy units nearby.",
  "Now you know the basics! Click Finish to start playing the real game."
];
let tutorialHighlight = null;

// DOM Elements
let startButton;
let startOverlay;
let tutorialOverlay;
let tutorialMessage;
let tutorialNextButton;
let tutorialFinishButton;

// --------------------------------
// Setup Function - Initializes the game
// --------------------------------
function setup() {
  // Create the canvas for the game
  let canvas = createCanvas(500, 500);
  canvas.parent(document.querySelector('.game-container'));
  textAlign(CENTER, CENTER);
  textSize(18);
  strokeJoin(ROUND);

  // Get DOM elements
  startButton = document.getElementById('startButton');
  startOverlay = document.getElementById('startOverlay');
  
  // Add event listener to start button
  startButton.addEventListener('click', startGame);

  // Create tutorial overlay
  createTutorialOverlay();
  
  // Create game mode selection
  createGameModeSelection();

  // Initialize empty grid
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y] = Array(GRID_COLS).fill(null);
  }

  // Initialize the game but don't start yet
  initializeGame();
}

// --------------------------------
// Create Tutorial Overlay
// --------------------------------
function createTutorialOverlay() {
  // Create tutorial overlay
  tutorialOverlay = document.createElement('div');
  tutorialOverlay.className = 'tutorial-overlay hidden';
  
  // Create tutorial message box
  tutorialMessage = document.createElement('div');
  tutorialMessage.className = 'tutorial-message';
  tutorialMessage.textContent = tutorialMessages[0];
  
  // Create tutorial buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'tutorial-buttons';
  
  // Create Next button
  tutorialNextButton = document.createElement('button');
  tutorialNextButton.className = 'tutorial-button';
  tutorialNextButton.textContent = 'Next';
  tutorialNextButton.addEventListener('click', nextTutorialStep);
  
  // Create Finish button
  tutorialFinishButton = document.createElement('button');
  tutorialFinishButton.className = 'tutorial-button';
  tutorialFinishButton.textContent = 'Finish Tutorial';
  tutorialFinishButton.style.display = 'none';
  tutorialFinishButton.addEventListener('click', finishTutorial);
  
  // Add buttons to container
  buttonContainer.appendChild(tutorialNextButton);
  buttonContainer.appendChild(tutorialFinishButton);
  
  // Add message and buttons to overlay
  tutorialOverlay.appendChild(tutorialMessage);
  tutorialOverlay.appendChild(buttonContainer);
  
  // Add overlay to game container
  document.querySelector('.game-container').appendChild(tutorialOverlay);
  
  // Add tutorial button to start overlay
  const tutorialButton = document.createElement('button');
  tutorialButton.className = 'tutorial-start-button';
  tutorialButton.textContent = 'Tutorial Mode';
  tutorialButton.addEventListener('click', startTutorial);
  
  // Add tutorial button to start overlay
  document.getElementById('startOverlay').appendChild(tutorialButton);
  
  // Add CSS for tutorial elements
  const style = document.createElement('style');
  style.textContent = `
    .tutorial-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      z-index: 20;
      border-top: 2px solid #00c8ff;
    }
    
    .tutorial-message {
      font-size: 18px;
      margin-bottom: 15px;
      text-align: center;
    }
    
    .tutorial-buttons {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    
    .tutorial-button {
      padding: 8px 20px;
      background: linear-gradient(to bottom, #00c8ff, #0066cc);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    }
    
    .tutorial-button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 10px rgba(0, 200, 255, 0.5);
    }
    
    .tutorial-start-button {
      padding: 15px 40px;
      font-size: 24px;
      background: linear-gradient(to bottom right, #00aa00, #006600);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(0, 170, 0, 0.5);
      transition: all 0.3s ease;
      margin-top: 20px;
    }
    
    .tutorial-start-button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(0, 170, 0, 0.8);
    }
    
    .highlight {
      stroke: #ffff00;
      stroke-weight: 4;
    }
  `;
  document.head.appendChild(style);
}

// --------------------------------
// Create Game Mode Selection
// --------------------------------
function createGameModeSelection() {
  // Create game mode selection container
  const gameModeContainer = document.createElement('div');
  gameModeContainer.className = 'game-mode-selection';
  
  // Create heading
  const heading = document.createElement('h3');
  heading.textContent = 'Select Game Mode:';
  gameModeContainer.appendChild(heading);
  
  // Create mode buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'mode-buttons';
  
  // Create Single Player button
  const singlePlayerButton = document.createElement('button');
  singlePlayerButton.className = 'mode-button';
  singlePlayerButton.textContent = 'Single Player';
  singlePlayerButton.addEventListener('click', () => {
    gameMode = "single-player";
    players[1].name = "AI Opponent";
    startGame();
  });
  
  // Create Two Player button
  const twoPlayerButton = document.createElement('button');
  twoPlayerButton.className = 'mode-button';
  twoPlayerButton.textContent = 'Two Players';
  twoPlayerButton.addEventListener('click', () => {
    gameMode = "two-player";
    players[1].name = "Player 2";
    startGame();
  });
  
  // Add buttons to container
  buttonContainer.appendChild(singlePlayerButton);
  buttonContainer.appendChild(twoPlayerButton);
  gameModeContainer.appendChild(buttonContainer);
  
  // Add container to start overlay
  document.getElementById('startOverlay').appendChild(gameModeContainer);
  
  // Add CSS for game mode selection
  const style = document.createElement('style');
  style.textContent = `
    .game-mode-selection {
      margin-top: 20px;
      text-align: center;
    }
    
    .game-mode-selection h3 {
      color: #00c8ff;
      margin-bottom: 15px;
    }
    
    .mode-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
    }
    
    .mode-button {
      padding: 15px 30px;
      font-size: 20px;
      background: linear-gradient(to bottom, #00c8ff, #0066cc);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(0, 200, 255, 0.5);
      transition: all 0.3s ease;
    }
    
    .mode-button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(0, 200, 255, 0.8);
    }
  `;
  document.head.appendChild(style);
}

// --------------------------------
// Tutorial Functions
// --------------------------------
function startTutorial() {
  // Hide start overlay
  startOverlay.classList.add('hidden');
  
  // Show tutorial overlay
  tutorialOverlay.classList.remove('hidden');
  
  // Set game state to tutorial
  gameState = "tutorial";
  
  // Reset tutorial step
  tutorialStep = 0;
  
  // Update tutorial message
  tutorialMessage.textContent = tutorialMessages[tutorialStep];
  
  // Reset the game
  initializeGame();
}

function nextTutorialStep() {
  tutorialStep++;
  
  // Update tutorial message
  if (tutorialStep < tutorialMessages.length) {
    tutorialMessage.textContent = tutorialMessages[tutorialStep];
    
    // Show finish button on last step
    if (tutorialStep === tutorialMessages.length - 1) {
      tutorialNextButton.style.display = 'none';
      tutorialFinishButton.style.display = 'inline-block';
    }
    
    // Set tutorial highlight based on current step
    setTutorialHighlight();
  }
}

function finishTutorial() {
  // Hide tutorial overlay
  tutorialOverlay.classList.add('hidden');
  
  // Set game state to playing
  gameState = "playing";
  
  // Reset tutorial highlight
  tutorialHighlight = null;
  
  // Reset the game
  initializeGame();
}

function setTutorialHighlight() {
  // Set highlight based on current tutorial step
  switch(tutorialStep) {
    case 2: // Highlight Blaster
      tutorialHighlight = { x: 1, y: 0, type: "Blaster" };
      break;
    case 4: // Highlight Launcher
      tutorialHighlight = { x: 3, y: 0, type: "Launcher" };
      break;
    case 6: // Highlight Shield
      tutorialHighlight = { x: 2, y: 0, type: "Shield" };
      break;
    case 8: // Highlight Tower
      tutorialHighlight = { x: TOWER_POS.x, y: TOWER_POS.y, type: "Tower" };
      break;
    default:
      tutorialHighlight = null;
  }
}

// --------------------------------
// Initialize Game Function - Sets up the game board
// --------------------------------
function initializeGame() {
  // Reset game state
  currentPlayer = 0;
  selectedUnit = null;
  players[0].units = [];
  players[1].units = [];
  players[0].towerTurns = 0;
  players[1].towerTurns = 0;
  
  // Create Player 1 units (top row)
  // Increased HP for all units from 1 to 2 to make the game less punishing
  players[0].units.push({ x: 1, y: 0, type: "Blaster", hp: 2, maxHp: 2, anim: 0 });
  players[0].units.push({ x: 2, y: 0, type: "Shield", hp: 3, maxHp: 3, anim: 0 });  // Shield has more HP
  players[0].units.push({ x: 3, y: 0, type: "Launcher", hp: 2, maxHp: 2, anim: 0 });

  // Create Player 2 units (bottom row)
  players[1].units.push({ x: 1, y: 4, type: "Blaster", hp: 2, maxHp: 2, anim: 0 });
  players[1].units.push({ x: 2, y: 4, type: "Shield", hp: 3, maxHp: 3, anim: 0 });  // Shield has more HP
  players[1].units.push({ x: 3, y: 4, type: "Launcher", hp: 2, maxHp: 2, anim: 0 });

  // Update the grid with initial unit positions
  updateGrid();
}

// --------------------------------
// Start Game Function - Triggered by start button
// --------------------------------
function startGame() {
  // Hide the start overlay
  startOverlay.classList.add('hidden');
  
  // Set game state to playing
  gameState = "playing";
  
  // Reset the game if it was previously played
  if (players[0].units.length === 0 || players[1].units.length === 0) {
    initializeGame();
  }
}

// --------------------------------
// Draw Function - Renders the game each frame
// --------------------------------
function draw() {
  // Update background hue for subtle color shifts
  backgroundHue = (backgroundHue + 0.1) % 360;
  
  // Create background gradient colors
  let bgColor1 = color(backgroundHue, 70, 15);
  let bgColor2 = color((backgroundHue + 40) % 360, 80, 25);
  
  // Draw background gradient
  setGradient(0, 0, width, height, bgColor1, bgColor2, "Y");
  
  // Draw background elements (stars, grid lines)
  drawBackgroundElements();
  
  // Update grid glow effect
  gridGlow = 5 + sin(frameCount * 0.05) * 3;
  
  // Draw the game grid
  drawGrid();
  
  // Draw the central tower
  drawTower();
  
  // Draw all units
  drawUnits();
  
  // Update and draw particles
  updateParticles();
  
  // Draw UI elements (always on top)
  drawUI();
  
  // Update animation values for units
  for (let p = 0; p < 2; p++) {
    for (let u of players[p].units) {
      if (u.anim > 0) {
        u.anim -= 0.05;
      }
    }
  }
  
  // Occasionally emit particles from the tower
  if (frameCount % 30 === 0) {
    let towerCenterX = TOWER_POS.x * GRID_SIZE + 90;
    let towerCenterY = TOWER_POS.y * GRID_SIZE + 90;
    
    // Determine tower particle color based on control
    let particleColor;
    if (players[0].towerTurns > 0) {
      particleColor = players[0].color; // Player 1 color
    } else if (players[1].towerTurns > 0) {
      particleColor = players[1].color; // Player 2 color
    } else {
      particleColor = [0, 100, 255]; // Neutral color
    }
    
    createParticles(towerCenterX, towerCenterY, particleColor, "tower", 3);
  }
  
  // Handle AI turn in single-player mode
  if (gameState === "playing" && gameMode === "single-player" && currentPlayer === 1) {
    // Add a small delay before AI makes a move (for better UX)
    if (!aiThinking) {
      aiThinking = true;
      aiThinkingTime = frameCount + 60; // Wait about 1 second (60 frames)
    } else if (frameCount >= aiThinkingTime) {
      makeAIMove();
      aiThinking = false;
    }
  }
}

// --------------------------------
// Background Elements Function
// --------------------------------
function drawBackgroundElements() {
  // Draw distant stars
  for (let i = 0; i < 50; i++) {
    let x = random(width);
    let y = random(height);
    let size = random(1, 3);
    let brightness = random(150, 255);
    
    // Star twinkle effect
    let twinkle = sin(frameCount * 0.05 + i) * 50 + 200;
    
    fill(brightness, brightness, twinkle, random(100, 200));
    noStroke();
    circle(x, y, size);
    
    // Occasional glow for larger stars
    if (size > 2) {
      drawingContext.shadowBlur = 5;
      drawingContext.shadowColor = `rgba(${brightness}, ${brightness}, 255, 0.5)`;
      circle(x, y, size);
      drawingContext.shadowBlur = 0;
    }
  }
  
  // Draw subtle grid lines in background
  stroke(100, 100, 200, 20);
  strokeWeight(1);
  
  // Horizontal lines
  for (let y = 0; y < height; y += 50) {
    line(0, y, width, y);
  }
  
  // Vertical lines
  for (let x = 0; x < width; x += 50) {
    line(x, 0, x, height);
  }
}

// --------------------------------
// Gradient Background Function
// --------------------------------
function setGradient(x, y, w, h, c1, c2, axis) {
  noFill();
  
  if (axis === "Y") {
    // Top to bottom gradient
    for (let i = y; i <= y + h; i++) {
      let inter = map(i, y, y + h, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(x, i, x + w, i);
    }
  } else if (axis === "X") {
    // Left to right gradient
    for (let i = x; i <= x + w; i++) {
      let inter = map(i, x, x + w, 0, 1);
      let c = lerpColor(c1, c2, inter);
      stroke(c);
      line(i, y, i, y + h);
    }
  }
}

// --------------------------------
// Particle System Functions
// --------------------------------
function createParticles(x, y, color, type, count) {
  for (let i = 0; i < count; i++) {
    let particle = {
      x: x,
      y: y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(3, 8),
      alpha: 255,
      color: color,
      type: type,
      life: random(20, 40)
    };
    
    // Adjust velocity based on particle type
    if (type === "attack") {
      particle.vx = random(-3, 3);
      particle.vy = random(-3, 3);
      particle.size = random(4, 10);
    } else if (type === "shield") {
      particle.vx = random(-1, 1);
      particle.vy = random(-1, 1);
      particle.size = random(5, 12);
    } else if (type === "move") {
      particle.vx = random(-0.5, 0.5);
      particle.vy = random(-0.5, 0.5);
      particle.size = random(2, 6);
    } else if (type === "tower") {
      particle.vx = random(-1, 1) * 0.5;
      particle.vy = random(-2, -0.5);
      particle.size = random(3, 8);
      particle.life = random(30, 60);
    }
    
    particles.push(particle);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    
    // Apply gravity or other effects based on type
    if (p.type === "tower") {
      p.vy -= 0.05; // Particles float upward
    } else {
      p.vy += 0.05; // Slight gravity
    }
    
    // Fade out
    p.alpha -= 255 / p.life;
    p.life--;
    
    // Remove dead particles
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    
    // Draw particle
    noStroke();
    
    if (p.type === "shield") {
      // Shield particles are hexagons with glow
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.alpha/255 * 0.5})`;
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      beginShape();
      for (let j = 0; j < 6; j++) {
        let angle = TWO_PI / 6 * j;
        let px = p.x + cos(angle) * p.size;
        let py = p.y + sin(angle) * p.size;
        vertex(px, py);
      }
      endShape(CLOSE);
      drawingContext.shadowBlur = 0;
    } else if (p.type === "attack") {
      // Attack particles are stars with glow
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = `rgba(255, 100, 50, ${p.alpha/255 * 0.7})`;
      fill(255, 100 + random(-20, 20), 50 + random(-20, 20), p.alpha);
      
      push();
      translate(p.x, p.y);
      rotate(frameCount * 0.01 + p.life * 0.1);
      beginShape();
      for (let j = 0; j < 5; j++) {
        let angle = TWO_PI / 5 * j;
        let px = cos(angle) * p.size;
        let py = sin(angle) * p.size;
        vertex(px, py);
        
        angle += TWO_PI / 10;
        px = cos(angle) * (p.size * 0.4);
        py = sin(angle) * (p.size * 0.4);
        vertex(px, py);
      }
      endShape(CLOSE);
      pop();
      
      drawingContext.shadowBlur = 0;
    } else if (p.type === "move") {
      // Movement particles are simple circles with trail effect
      fill(p.color[0], p.color[1], p.color[2], p.alpha * 0.7);
      circle(p.x, p.y, p.size);
      
      // Add a smaller, brighter center
      fill(min(p.color[0] + 50, 255), min(p.color[1] + 50, 255), min(p.color[2] + 50, 255), p.alpha);
      circle(p.x, p.y, p.size * 0.5);
    } else if (p.type === "tower") {
      // Tower particles are energy bits
      let glowColor = color(p.color[0], p.color[1], p.color[2], p.alpha * 0.5);
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = glowColor;
      
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      
      // Draw a diamond shape
      push();
      translate(p.x, p.y);
      rotate(p.life * 0.1);
      beginShape();
      vertex(0, -p.size/2);
      vertex(p.size/2, 0);
      vertex(0, p.size/2);
      vertex(-p.size/2, 0);
      endShape(CLOSE);
      pop();
      
      drawingContext.shadowBlur = 0;
    } else {
      // Default particle is a circle
      fill(p.color[0], p.color[1], p.color[2], p.alpha);
      circle(p.x, p.y, p.size);
    }
  }
}

// --------------------------------
// Grid Drawing Function
// --------------------------------
function drawGrid() {
  // Draw board background/border
  push();
  fill(30, 40, 60, 200);
  strokeWeight(3);
  stroke(100, 150, 200, 150 + sin(frameCount * 0.05) * 50);
  rect(45, 45, GRID_SIZE * GRID_COLS + 10, GRID_SIZE * GRID_ROWS + 10, 10);
  pop();
  
  // Draw grid cells
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      // Check if this is a valid move square for the selected unit
      let isValidMoveSquare = false;
      
      if (selectedUnit !== null && gameState !== "won") {
        const unit = players[currentPlayer].units[selectedUnit];
        // For movement: adjacent empty squares
        if (abs(x - unit.x) + abs(y - unit.y) === 1 && grid[y][x] === null) {
          isValidMoveSquare = true;
        }
        
        // For Launcher attacks: squares in straight lines
        if (unit.type === "Launcher") {
          // Check horizontal and vertical lines
          const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
            {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
          ];
          
          for (let dir of directions) {
            for (let i = 1; i <= 3; i++) {
              let tx = unit.x + dir.dx * i;
              let ty = unit.y + dir.dy * i;
              
              // Stop at grid boundaries
              if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) break;
              
              // If this is the target square
              if (tx === x && ty === y) {
                isValidMoveSquare = true;
                break;
              }
              
              // Stop at occupied squares
              if (grid[ty][tx] !== null) break;
            }
          }
        }
        
        // For Blaster attacks: adjacent squares with enemy units
        if (unit.type === "Blaster") {
          if (abs(x - unit.x) + abs(y - unit.y) === 1) {
            // Check if there's an enemy unit here
            if (grid[y][x] !== null) {
              for (let u of players[1 - currentPlayer].units) {
                if (u.x === x && u.y === y) {
                  isValidMoveSquare = true;
                  break;
                }
              }
            }
          }
        }
      }
      
      // Highlight the cell under the mouse
      let hover = dist(mouseX, mouseY, x * GRID_SIZE + 90, y * GRID_SIZE + 90) < GRID_SIZE / 2;
      
      push();
      
      // Cell base style
      strokeWeight(1.5);
      
      // Set fill color based on state
      if (isValidMoveSquare) {
        // Highlight valid move squares with player color and glow effect
        let playerColor = players[currentPlayer].color;
        
        // Create glow effect for valid moves
        if (hover) {
          // Outer glow for hover state
          noFill();
          for (let i = 0; i < 3; i++) {
            let alpha = map(i, 0, 3, 150, 0);
            stroke(playerColor[0], playerColor[1], playerColor[2], alpha);
            strokeWeight(3 - i);
            rect(x * GRID_SIZE + 50 - i, y * GRID_SIZE + 50 - i, 
                 GRID_SIZE + i * 2, GRID_SIZE + i * 2, 8);
          }
        }
        
        // Cell fill
        fill(playerColor[0], playerColor[1], playerColor[2], hover ? 150 : 100);
        stroke(playerColor[0], playerColor[1], playerColor[2], 200);
      } else {
        // Normal grid cell with subtle gradient
        let cellBrightness = 70 + sin(frameCount * 0.05 + x * 0.5 + y * 0.5) * 10;
        fill(50, 60, cellBrightness, hover ? 200 : 150);
        stroke(100, 150, 200, 100);
      }
      
      // Draw the cell with rounded corners
      rect(x * GRID_SIZE + 50, y * GRID_SIZE + 50, GRID_SIZE, GRID_SIZE, 5);
      
      // Add subtle grid patterns inside cells
      if (!isValidMoveSquare) {
        stroke(100, 150, 200, 30);
        strokeWeight(0.5);
        line(x * GRID_SIZE + 60, y * GRID_SIZE + 50, 
             x * GRID_SIZE + 60, y * GRID_SIZE + 50 + GRID_SIZE);
        line(x * GRID_SIZE + 50, y * GRID_SIZE + 60, 
             x * GRID_SIZE + 50 + GRID_SIZE, y * GRID_SIZE + 60);
      }
      
      // Add subtle coordinate markers in corners
      if (!isValidMoveSquare && !hover) {
        fill(150, 180, 255, 40);
  noStroke();
        textSize(8);
        text(`${x},${y}`, x * GRID_SIZE + 60, y * GRID_SIZE + 65);
      }
      
      pop();
    }
  }
}

// --------------------------------
// Tower Drawing Function
// --------------------------------
function drawTower() {
  // Calculate tower position
  let towerX = TOWER_POS.x * GRID_SIZE + 90;
  let towerY = TOWER_POS.y * GRID_SIZE + 90;
  
  // Draw glowing aura around tower
  let auraSize = 80 + sin(frameCount * 0.05) * 5;
  let auraColor;
  
  if (players[0].towerTurns > 0) {
    // Player 1 controlling
    auraColor = color(players[0].color[0], players[0].color[1], players[0].color[2], 50);
  } else if (players[1].towerTurns > 0) {
    // Player 2 controlling
    auraColor = color(players[1].color[0], players[1].color[1], players[1].color[2], 50);
  } else {
    // Neutral
    auraColor = color(100, 150, 255, 30);
  }
  
  // Draw aura
  noStroke();
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = auraColor;
  fill(auraColor);
  circle(towerX, towerY, auraSize);
  drawingContext.shadowBlur = 0;
  
  // Draw energy beams if tower is controlled
  if (players[0].towerTurns > 0 || players[1].towerTurns > 0) {
    let controllingPlayer = players[0].towerTurns > 0 ? 0 : 1;
    let beamColor = players[controllingPlayer].color;
    
    // Draw 3-5 energy beams
    let beamCount = floor(random(3, 6));
    for (let i = 0; i < beamCount; i++) {
      let angle = random(TWO_PI);
      let length = random(100, 200);
      
      // Draw beam
      stroke(beamColor[0], beamColor[1], beamColor[2], 150);
      strokeWeight(random(1, 3));
      
      // Wavy beam effect
      beginShape();
      for (let j = 0; j < length; j += 5) {
        let waveFactor = sin(j * 0.1 + frameCount * 0.1) * 5;
        let x = towerX + cos(angle) * j + cos(angle + HALF_PI) * waveFactor;
        let y = towerY + sin(angle) * j + sin(angle + HALF_PI) * waveFactor;
        vertex(x, y);
      }
      endShape();
      
      // Add particles at the end of the beam
      let endX = towerX + cos(angle) * length;
      let endY = towerY + sin(angle) * length;
      if (frameCount % 5 === 0) {
        createParticles(endX, endY, beamColor, "tower", 1);
      }
    }
  }
  
  // Draw base outer circle
  strokeWeight(3);
  if (players[0].towerTurns > 0) {
    // Player 1 controlling
    stroke(players[0].color[0], players[0].color[1], players[0].color[2]);
    fill(players[0].color[0], players[0].color[1], players[0].color[2], 100);
  } else if (players[1].towerTurns > 0) {
    // Player 2 controlling
    stroke(players[1].color[0], players[1].color[1], players[1].color[2]);
    fill(players[1].color[0], players[1].color[1], players[1].color[2], 100);
  } else {
    // Neutral
    stroke(200, 200, 255);
    fill(100, 100, 200, 50);
  }
  
  // Draw outer circle with glow
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = stroke;
  circle(towerX, towerY, 60);
  drawingContext.shadowBlur = 0;
  
  // Draw inner circle that indicates control
  noStroke();
  if (players[0].towerTurns > 0) {
    // Player 1 controlling
    fill(players[0].color[0], players[0].color[1], players[0].color[2]);
  } else if (players[1].towerTurns > 0) {
    // Player 2 controlling
    fill(players[1].color[0], players[1].color[1], players[1].color[2]);
  } else {
    // Neutral - pulsing effect
    let pulse = 150 + sin(frameCount * 0.1) * 50;
    fill(100, 150, pulse);
  }
  circle(towerX, towerY, 40);
  
  // Draw concentric rings
  noFill();
  strokeWeight(1);
  stroke(255, 255, 255, 150);
  circle(towerX, towerY, 50);
  circle(towerX, towerY, 30);
  
  // Draw star/crystal shape in center
  push();
  translate(towerX, towerY);
  rotate(frameCount * 0.01);
  
  fill(255, 255, 255, 200);
  beginShape();
  for (let i = 0; i < 8; i++) {
    let angle = TWO_PI / 8 * i;
    let r1 = 10;
    let r2 = 5;
    vertex(cos(angle) * r1, sin(angle) * r1);
    
    angle += TWO_PI / 16;
    vertex(cos(angle) * r2, sin(angle) * r2);
  }
  endShape(CLOSE);
  pop();
  
  // Highlight tower for tutorial
  if (gameState === "tutorial" && tutorialStep === 8) {
    noFill();
    stroke(255, 255, 100, 150 + sin(frameCount * 0.1) * 50);
    strokeWeight(3);
    circle(towerX, towerY, 70);
  }
  
  // Emit particles from tower occasionally
  if (frameCount % 10 === 0) {
    let particleColor;
    if (players[0].towerTurns > 0) {
      particleColor = players[0].color;
    } else if (players[1].towerTurns > 0) {
      particleColor = players[1].color;
    } else {
      particleColor = [100, 150, 255];
    }
    createParticles(towerX, towerY, particleColor, "tower", 2);
  }
}

// --------------------------------
// Units Drawing Function
// --------------------------------
function drawUnits() {
  for (let p of players) {
    for (let u of p.units) {
      let unitX = u.x * GRID_SIZE + 90;
      let unitY = u.y * GRID_SIZE + 90;
      
      push();
      
      // Create unit glow/shadow effect
      if (selectedUnit !== null && 
          u === players[currentPlayer].units[selectedUnit]) {
        // Selected unit has a stronger glow
        for (let i = 0; i < 3; i++) {
          noFill();
          let alpha = map(i, 0, 3, 150, 0);
          stroke(p.color[0], p.color[1], p.color[2], alpha);
          strokeWeight(3 - i);
          ellipse(unitX, unitY, 45 + i * 5);
        }
      } else {
        // Normal units have a subtle shadow
      noStroke();
        fill(0, 0, 0, 30);
        ellipse(unitX + 2, unitY + 2, 35);
      }
      
      // Check if unit is protected by a shield
      let isProtected = isShielded(u);
      
      // Draw shield protection indicator
      if (isProtected) {
        // Draw shield aura
        noFill();
        for (let i = 0; i < 2; i++) {
          let alpha = map(i, 0, 2, 100, 0);
          stroke(255, 255, 255, alpha);
          strokeWeight(2 - i);
          
          // Pulsing shield effect
          let pulseSize = 5 + sin(frameCount * 0.1) * 2;
          ellipse(unitX, unitY, 40 + i * pulseSize);
        }
        
        // Draw shield icon above unit
        noStroke();
        fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 50);
        beginShape();
        for (let i = 0; i < 8; i++) {
          let angle = TWO_PI / 8 * i + frameCount * 0.01;
          let r = 8;
          let x = unitX + cos(angle) * r;
          let y = unitY - 25 + sin(angle) * r;
          vertex(x, y);
        }
        endShape(CLOSE);
        
        // Draw shield symbol
        fill(255);
        textSize(10);
        textAlign(CENTER, CENTER);
        text("🛡️", unitX, unitY - 25);
      }
      
      // Base unit color with pulsing effect
      let pulseIntensity = 55;
      if (selectedUnit !== null && 
          u === players[currentPlayer].units[selectedUnit]) {
        pulseIntensity = 100; // More intense pulse for selected unit
      }
      
      fill(p.color[0], p.color[1], p.color[2], 200 + sin(frameCount * 0.05 + u.anim) * pulseIntensity);
      
      // Check if this unit should be highlighted for tutorial
      if (tutorialHighlight && 
          u.x === tutorialHighlight.x && 
          u.y === tutorialHighlight.y && 
          u.type === tutorialHighlight.type) {
        stroke(255, 255, 0);
        strokeWeight(4);
      } 
      // Highlight selected unit
      else if (selectedUnit !== null && 
               u === players[currentPlayer].units[selectedUnit]) {
        stroke(255);
        strokeWeight(3);
      }
      else {
        // Normal unit border
        stroke(p.color[0] * 0.7, p.color[1] * 0.7, p.color[2] * 0.7);
        strokeWeight(2);
      }
      
      // Draw different shapes based on unit type
      if (u.type === "Blaster") {
        // Blaster units - enhanced weapon appearance
        // Main body (circle with gradient)
        let gradientFill = drawingContext.createRadialGradient(
          unitX, unitY, 0,
          unitX, unitY, 15
        );
        gradientFill.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 1)`);
        gradientFill.addColorStop(1, `rgba(${p.color[0] * 0.7}, ${p.color[1] * 0.7}, ${p.color[2] * 0.7}, 0.9)`);
        
        drawingContext.fillStyle = gradientFill;
        ellipse(unitX, unitY, 30);
        
        // Add barrel/gun extension with metallic look
        stroke(80, 80, 100);
        strokeWeight(2);
        fill(p.color[0] * 0.5, p.color[1] * 0.5, p.color[2] * 0.5);
        
        // Rotate the barrel based on player (P1 down, P2 up)
        if (p === players[0]) {
          // Barrel pointing down
          rect(unitX - 5, unitY, 10, 20, 2);
          
          // Add barrel details
          stroke(150, 150, 170);
          strokeWeight(1);
          line(unitX - 2, unitY + 5, unitX - 2, unitY + 15);
          line(unitX + 2, unitY + 5, unitX + 2, unitY + 15);
        } else {
          // Barrel pointing up
          rect(unitX - 5, unitY - 20, 10, 20, 2);
          
          // Add barrel details
          stroke(150, 150, 170);
          strokeWeight(1);
          line(unitX - 2, unitY - 15, unitX - 2, unitY - 5);
          line(unitX + 2, unitY - 15, unitX + 2, unitY - 5);
        }
        
        // Energy pulse animation
        if (u.anim > 0) {
          noStroke();
          fill(255, 255, 255, u.anim * 200);
          
          // Direction-based energy pulse
          if (p === players[0]) {
            // Downward pulse
            ellipse(unitX, unitY + 25, 15 * u.anim);
          } else {
            // Upward pulse
            ellipse(unitX, unitY - 25, 15 * u.anim);
          }
          
          // Create particles for the energy pulse
          if (frameCount % 3 === 0 && u.anim > 0.5) {
            if (p === players[0]) {
              createParticles(unitX, unitY + 25, p.color, "attack", 1);
            } else {
              createParticles(unitX, unitY - 25, p.color, "attack", 1);
            }
          }
          
          u.anim -= 0.05;
        }
      }
      else if (u.type === "Shield") {
        // Shield units - enhanced shield appearance
        // Main body (rounded rectangle with gradient)
        let gradientFill = drawingContext.createLinearGradient(
          unitX - 20, unitY - 20,
          unitX + 20, unitY + 20
        );
        gradientFill.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 1)`);
        gradientFill.addColorStop(1, `rgba(${p.color[0] * 0.7}, ${p.color[1] * 0.7}, ${p.color[2] * 0.7}, 0.9)`);
        
        drawingContext.fillStyle = gradientFill;
        rect(unitX - 20, unitY - 20, 40, 40, 8);
        
        // Shield emblem with metallic look
        fill(p.color[0] * 0.5, p.color[1] * 0.5, p.color[2] * 0.5);
        noStroke();
        ellipse(unitX, unitY, 25);
        
        // Add shield details
        stroke(255, 255, 255, 150);
        strokeWeight(1.5);
          noFill();
        arc(unitX, unitY, 18, 18, PI * 0.8, PI * 2.2);
        
        // Shield activation animation
        if (u.anim > 0) {
          // Shield barrier effect with multiple rings
          for (let i = 0; i < 3; i++) {
            stroke(p.color[0], p.color[1], p.color[2], u.anim * 150 * (1 - i * 0.2));
            strokeWeight(3 - i);
            noFill();
            arc(unitX, unitY, 60 + i * 10, 60 + i * 10, 0, TWO_PI);
          }
          
          // Create shield particles
          if (frameCount % 5 === 0 && u.anim > 0.5) {
            createParticles(unitX, unitY, p.color, "shield", 1);
          }
          
          u.anim -= 0.05;
        }
        
        // Draw protection radius indicator (subtle)
        noFill();
        stroke(p.color[0], p.color[1], p.color[2], 30 + sin(frameCount * 0.05) * 10);
        strokeWeight(1);
        ellipse(unitX, unitY, 120); // Show protection radius
      }
      else if (u.type === "Launcher") {
        // Launcher units - enhanced missile launcher appearance
        // Base triangle shape with gradient
        let gradientFill = drawingContext.createLinearGradient(
          unitX, unitY - 20,
          unitX, unitY + 20
        );
        gradientFill.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 1)`);
        gradientFill.addColorStop(1, `rgba(${p.color[0] * 0.7}, ${p.color[1] * 0.7}, ${p.color[2] * 0.7}, 0.9)`);
        
        drawingContext.fillStyle = gradientFill;
        
        triangle(
          unitX, unitY - 20,
          unitX - 20, unitY + 20,
          unitX + 20, unitY + 20
        );
        
        // Add missile/rocket details with metallic look
        fill(p.color[0] * 0.4, p.color[1] * 0.4, p.color[2] * 0.4);
        stroke(80, 80, 100);
        strokeWeight(1);
        
        // Missile body
        rect(unitX - 5, unitY - 25, 10, 30, 2);
        
        // Missile tip
        fill(200, 50, 50);
        noStroke();
        triangle(
          unitX, unitY - 30,
          unitX - 5, unitY - 20,
          unitX + 5, unitY - 20
        );
        
        // Add missile details
        stroke(150, 150, 170);
        strokeWeight(1);
        line(unitX, unitY - 25, unitX, unitY - 5);
        
        // Add fins to the missile
        fill(p.color[0] * 0.5, p.color[1] * 0.5, p.color[2] * 0.5);
        noStroke();
        triangle(
          unitX - 5, unitY - 15,
          unitX - 5, unitY - 5,
          unitX - 10, unitY - 10
        );
        triangle(
          unitX + 5, unitY - 15,
          unitX + 5, unitY - 5,
          unitX + 10, unitY - 10
        );
        
        // Launch animation
        if (u.anim > 0) {
          // Rocket exhaust with multiple layers
          noStroke();
          
          // Outer flame
          fill(255, 150, 50, u.anim * 150);
          triangle(
            unitX - 5, unitY - 5,
            unitX + 5, unitY - 5,
            unitX, unitY - 5 - 30 * u.anim
          );
          
          // Inner flame
          fill(255, 255, 200, u.anim * 200);
          triangle(
            unitX - 2, unitY - 5,
            unitX + 2, unitY - 5,
            unitX, unitY - 5 - 20 * u.anim
          );
          
          // Create exhaust particles
          if (frameCount % 3 === 0 && u.anim > 0.5) {
            createParticles(unitX, unitY - 5 - 15 * u.anim, [255, 150, 50], "attack", 1);
          }
          
          u.anim -= 0.05;
        }
      }
      
      // Draw health indicator with improved styling
      if (u.hp < u.maxHp) {
        // Health background
        noStroke();
        fill(0, 0, 0, 100);
        rect(unitX - 15, unitY - 25, 30, 8, 4);
        
        // Health bar
        let healthPercent = u.hp / u.maxHp;
        let healthColor;
        
        if (healthPercent > 0.6) {
          healthColor = color(100, 230, 100); // Green for high health
        } else if (healthPercent > 0.3) {
          healthColor = color(230, 230, 100); // Yellow for medium health
        } else {
          healthColor = color(230, 100, 100); // Red for low health
        }
        
        fill(healthColor);
        rect(unitX - 14, unitY - 24, 28 * healthPercent, 6, 3);
        
        // Health text
  fill(255);
        textSize(10);
        textAlign(CENTER, CENTER);
        text(u.hp, unitX, unitY - 20);
      }
      
      pop();
    }
  }
}

// --------------------------------
// UI Drawing Function
// --------------------------------
function drawUI() {
  push();
  
  // Create a semi-transparent header bar
  fill(20, 30, 50, 200);
  noStroke();
  rect(0, 0, width, 60, 0, 0, 10, 10);
  
  // Add subtle header decoration
  fill(100, 150, 200, 30);
  rect(0, 58, width, 2);
  
  // Add home button in the top-left corner
  fill(50, 70, 100, 200);
  rect(10, 10, 40, 40, 8);
  
  // Add home icon
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("🏠", 30, 30);
  
  // Show current player's turn with enhanced styling
  let playerColor = players[currentPlayer].color;
  
  // Player turn indicator with glow effect
  fill(playerColor[0], playerColor[1], playerColor[2], 200);
  noStroke();
  
  // Draw player turn pill
  rect(width / 2 - 100, 10, 200, 30, 15);
  
  // Add subtle gradient to the pill
  let gradientFill = drawingContext.createLinearGradient(
    width / 2 - 100, 10,
    width / 2 + 100, 40
  );
  gradientFill.addColorStop(0, `rgba(${playerColor[0]}, ${playerColor[1]}, ${playerColor[2]}, 0.8)`);
  gradientFill.addColorStop(1, `rgba(${playerColor[0] * 0.7}, ${playerColor[1] * 0.7}, ${playerColor[2] * 0.7}, 0.6)`);
  
  drawingContext.fillStyle = gradientFill;
  rect(width / 2 - 100, 10, 200, 30, 15);
  
  // Player turn text with shadow
  fill(0, 0, 0, 50);
  textSize(18);
  textAlign(CENTER, CENTER);
  text(`${players[currentPlayer].name}'s Turn`, width / 2 + 2, 26);
  
  fill(255);
  text(`${players[currentPlayer].name}'s Turn`, width / 2, 24);
  
  // Show AI thinking indicator
  if (gameState === "playing" && gameMode === "single-player" && currentPlayer === 1 && aiThinking) {
    let thinkingDots = ".".repeat(floor((frameCount % 90) / 30) + 1);
    fill(255);
    textSize(14);
    text(`AI thinking${thinkingDots}`, width / 2, 40);
  }
  
  // Show tower control status with visual indicators
  textSize(14);
  textAlign(CENTER, CENTER);
  fill(255);
  text(`Tower Control Progress`, width / 2, 50);
  
  // Draw tower control progress bars
  let barWidth = 80;
  let barHeight = 8;
  let barSpacing = 20;
  let barY = 50;
  
  // Player 1 progress bar
  drawProgressBar(
    width / 2 - barWidth - barSpacing, 
    barY - barHeight / 2, 
    barWidth, 
    barHeight, 
    players[0].towerTurns / TOWER_TURNS_TO_WIN,
    players[0].color
  );
  
  // Player 2 progress bar
  drawProgressBar(
    width / 2 + barSpacing, 
    barY - barHeight / 2, 
    barWidth, 
    barHeight, 
    players[1].towerTurns / TOWER_TURNS_TO_WIN,
    players[1].color
  );
  
  // Show win message if game is over
  if (gameState === "won") {
    // Create a semi-transparent overlay
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    // Create a message box
    fill(30, 40, 60, 230);
    stroke(playerColor[0], playerColor[1], playerColor[2]);
    strokeWeight(3);
    rect(width / 2 - 150, height / 2 - 80, 300, 160, 15);
    
    // Add decoration
    noStroke();
    fill(playerColor[0], playerColor[1], playerColor[2], 100);
    rect(width / 2 - 150, height / 2 - 80, 300, 40, 15, 15, 0, 0);
    
    // Win message
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(`${players[currentPlayer].name} Wins!`, width / 2, height / 2 - 60);
    
    // Trophy icon
    textSize(48);
    text("🏆", width / 2, height / 2);
    
    // Restart instruction
    textSize(16);
    text("Press R to Restart", width / 2, height / 2 + 50);
    
    // Home button
    fill(50, 70, 100, 200);
    rect(width / 2 - 100, height / 2 + 80, 200, 40, 20);
    fill(255);
    textSize(16);
    text("Return to Home", width / 2, height / 2 + 100);
    
    // Create celebratory particles
    if (frameCount % 10 === 0) {
      createParticles(
        width / 2 + random(-100, 100), 
        height / 2 + random(-50, 50), 
        players[currentPlayer].color, 
        "tower", 
        3
      );
    }
  }
  // Show stalemate message if game ends in a draw
  else if (gameState === "stalemate") {
    // Create a semi-transparent overlay
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    // Create a message box
    fill(30, 40, 60, 230);
    stroke(200, 200, 100);
    strokeWeight(3);
    rect(width / 2 - 150, height / 2 - 80, 300, 160, 15);
    
    // Add decoration
    noStroke();
    fill(200, 200, 100, 100);
    rect(width / 2 - 150, height / 2 - 80, 300, 40, 15, 15, 0, 0);
    
    // Stalemate message
    fill(255, 255, 100);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Stalemate!", width / 2, height / 2 - 60);
    
    // Draw icon
    textSize(48);
    text("⚖️", width / 2, height / 2);
    
    // Restart instruction
    fill(255);
    textSize(16);
    text("Press R to Restart", width / 2, height / 2 + 50);
    
    // Home button
    fill(50, 70, 100, 200);
    rect(width / 2 - 100, height / 2 + 80, 200, 40, 20);
    fill(255);
    textSize(16);
    text("Return to Home", width / 2, height / 2 + 100);
  }
  
  // Show help text during gameplay
  if (gameState === "playing") {
    // Create a semi-transparent footer bar
    fill(20, 30, 50, 150);
    noStroke();
    rect(0, height - 40, width, 40, 10, 10, 0, 0);
    
    // Add subtle footer decoration
    fill(100, 150, 200, 30);
    rect(0, height - 40, width, 2);
    
    if (selectedUnit !== null && currentPlayer === 0) {
      const unit = players[currentPlayer].units[selectedUnit];
      let helpText = "";
      let iconText = "";
      
      if (unit.type === "Blaster") {
        helpText = "Click adjacent square to move or attack";
        iconText = "🔫";
      } else if (unit.type === "Shield") {
        helpText = "Protects adjacent units from all damage. Click to move";
        iconText = "🛡️";
      } else if (unit.type === "Launcher") {
        helpText = "Attacks in straight lines up to 3 squares";
        iconText = "🚀";
      }
      
      // Draw unit icon
      textSize(20);
      text(iconText, 30, height - 20);
      
      // Draw unit type with player color
      fill(playerColor[0], playerColor[1], playerColor[2]);
      textSize(16);
      textAlign(LEFT, CENTER);
      text(unit.type, 50, height - 20);
      
      // Draw help text
      fill(255, 255, 200);
      textAlign(CENTER, CENTER);
      text(helpText, width / 2 + 50, height - 20);
    } else if (currentPlayer === 0) {
      // General help when no unit is selected
      fill(255, 255, 200);
      textAlign(CENTER, CENTER);
      text("Select one of your units to move or attack", width / 2, height - 20);
    } else if (gameMode === "single-player" && currentPlayer === 1) {
      // AI turn message
      fill(255, 255, 200);
      textAlign(CENTER, CENTER);
      text("AI is planning its move...", width / 2, height - 20);
    }
  }
  
  pop();
}

// --------------------------------
// Progress Bar Drawing Function
// --------------------------------
function drawProgressBar(x, y, width, height, progress, color) {
  // Background
  noStroke();
  fill(50, 60, 70, 150);
  rect(x, y, width, height, height / 2);
  
  // Progress
  if (progress > 0) {
    fill(color[0], color[1], color[2], 200);
    rect(x, y, width * progress, height, height / 2);
    
    // Add shine effect
    fill(255, 255, 255, 100);
    rect(x, y, width * progress, height / 3, height / 2);
  }
  
  // Border
  noFill();
  stroke(color[0], color[1], color[2], 150);
  strokeWeight(1);
  rect(x, y, width, height, height / 2);
  
  // Show fraction
  fill(255);
  noStroke();
  textSize(10);
  textAlign(CENTER, CENTER);
  text(`${Math.floor(progress * TOWER_TURNS_TO_WIN)}/${TOWER_TURNS_TO_WIN}`, x + width / 2, y + height / 2);
}

// --------------------------------
// Mouse Pressed Function - Handles player input
// --------------------------------
function mousePressed() {
  // Check if home button was clicked
  if (mouseX >= 10 && mouseX <= 50 && mouseY >= 10 && mouseY <= 50) {
    // Navigate to homepage
    window.location.href = "homepage.html";
    return;
  }
  
  // Check for home button in win/stalemate screens
  if ((gameState === "won" || gameState === "stalemate") && 
      mouseX >= width / 2 - 100 && mouseX <= width / 2 + 100 && 
      mouseY >= height / 2 + 80 && mouseY <= height / 2 + 120) {
    // Navigate to homepage
    window.location.href = "homepage.html";
    return;
  }
  
  // Don't process clicks if game is over
  if (gameState === "won" || gameState === "stalemate") return;
  
  // Calculate grid position from mouse coordinates
  let gridX = floor((mouseX - 50) / GRID_SIZE);
  let gridY = floor((mouseY - 50) / GRID_SIZE);
  
  // Check if click is within grid bounds
  if (gridX >= 0 && gridX < GRID_COLS && gridY >= 0 && gridY < GRID_ROWS) {
    console.log(`Clicked grid cell: (${gridX}, ${gridY})`);
    
    // Get current player's units
    let units = players[currentPlayer].units;
    
    // If a unit is already selected
    if (selectedUnit !== null) {
      let unit = units[selectedUnit];
      
      // Check if clicked on the same unit (deselect)
      let clickedOnSameUnit = false;
      for (let i = 0; i < units.length; i++) {
        if (units[i].x === gridX && units[i].y === gridY) {
          if (i === selectedUnit) {
            // Deselect the unit
            selectedUnit = null;
            console.log("Unit deselected");
            return;
          } else {
            // Switch selection to another unit
            selectedUnit = i;
            console.log(`Selected unit ${i} (${units[i].type})`);
            
            // Create selection particles
            let unitX = units[i].x * GRID_SIZE + 90;
            let unitY = units[i].y * GRID_SIZE + 90;
            createParticles(unitX, unitY, players[currentPlayer].color, "move", 5);
            
            return;
          }
        }
      }
      
      // Check if the clicked cell is adjacent to the selected unit for movement
      if (abs(gridX - unit.x) + abs(gridY - unit.y) === 1) {
        // Check if the cell is empty
        if (isCellEmpty(gridX, gridY)) {
          console.log(`Moving unit from (${unit.x}, ${unit.y}) to (${gridX}, ${gridY})`);
          
          // Use the new moveUnit function
          moveUnit(unit, gridX, gridY);
          
          // Reset selection
          selectedUnit = null;
          return;
        }
      }
      
      // Check for attack based on unit type
      if (unit.type === "Blaster") {
        // Blaster can attack adjacent cells
        if (abs(gridX - unit.x) + abs(gridY - unit.y) === 1) {
          if (attack(gridX, gridY)) {
            // Attack was successful, end turn
            selectedUnit = null;
            endTurn();
            return;
          }
        }
      } else if (unit.type === "Launcher") {
        // Launcher can attack in straight lines
        let dx = 0, dy = 0;
        
        // Determine direction
        if (gridX === unit.x) {
          dy = gridY > unit.y ? 1 : -1;
        } else if (gridY === unit.y) {
          dx = gridX > unit.x ? 1 : -1;
        }
        
        // If a valid direction was found
        if (dx !== 0 || dy !== 0) {
          if (attackLine(unit, dx, dy)) {
            // Attack was successful, end turn
            selectedUnit = null;
            endTurn();
            return;
          }
        }
      }
      
      // If we got here, the click wasn't a valid move or attack
      // Keep the unit selected but provide visual feedback
      let unitX = unit.x * GRID_SIZE + 90;
      let unitY = unit.y * GRID_SIZE + 90;
      createParticles(unitX, unitY, [255, 100, 100], "move", 3); // Red particles for invalid action
      
    } else {
      // No unit selected, try to select one
      for (let i = 0; i < units.length; i++) {
        if (units[i].x === gridX && units[i].y === gridY) {
          selectedUnit = i;
          console.log(`Selected unit ${i} (${units[i].type})`);
          
          // Create selection particles
          let unitX = units[i].x * GRID_SIZE + 90;
          let unitY = units[i].y * GRID_SIZE + 90;
          createParticles(unitX, unitY, players[currentPlayer].color, "move", 5);
          
          return;
        }
      }
      
      // Check if clicked on tower
      if (gridX === TOWER_POS.x && gridY === TOWER_POS.y) {
        console.log("Clicked on tower");
        
        // Check if a player unit is adjacent to the tower
        let adjacentUnitIndex = -1;
        for (let i = 0; i < units.length; i++) {
          if (abs(units[i].x - TOWER_POS.x) + abs(units[i].y - TOWER_POS.y) === 1) {
            adjacentUnitIndex = i;
            break;
          }
        }
        
        if (adjacentUnitIndex !== -1) {
          // Select the adjacent unit
          selectedUnit = adjacentUnitIndex;
          console.log(`Selected unit ${adjacentUnitIndex} adjacent to tower`);
          
          // Create selection particles
          let unitX = units[adjacentUnitIndex].x * GRID_SIZE + 90;
          let unitY = units[adjacentUnitIndex].y * GRID_SIZE + 90;
          createParticles(unitX, unitY, players[currentPlayer].color, "move", 5);
          
          // Create tower particles
          let towerCenterX = TOWER_POS.x * GRID_SIZE + 90;
          let towerCenterY = TOWER_POS.y * GRID_SIZE + 90;
          createParticles(towerCenterX, towerCenterY, [200, 200, 255], "tower", 10);
          
          return;
        }
      }
    }
  }
}

// --------------------------------
// Unit Selection Function - No longer used, logic moved to mousePressed
// --------------------------------
function selectUnit(x, y, player) {
  // This function is kept for reference but its logic has been moved directly to mousePressed
    for (let i = 0; i < player.units.length; i++) {
      let u = player.units[i];
    if (u.x === x && u.y === y) {
        selectedUnit = i;
        break;
      }
    }
}

// --------------------------------
// Unit Movement Function - No longer used, logic moved to mousePressed
// --------------------------------
function moveUnit(unit, x, y) {
  // This function is kept for reference but its logic has been moved directly to mousePressed
  unit.x = x;
  unit.y = y;
      unit.anim = 1; // Trigger move animation
    }

// --------------------------------
// Attack Function - Handles different unit attack types
// --------------------------------
function performAttack(unit, mx, my) {
  let attacked = false;
  
  // Blaster attacks adjacent squares
  if (unit.type === "Blaster" && abs(mx - unit.x) + abs(my - unit.y) === 1) {
    // Trigger blaster animation
    unit.anim = 1; // Start animation
    attacked = attack(mx, my);
  }
  
  // Launcher attacks in straight lines
    if (unit.type === "Launcher") {
      let dx = mx - unit.x, dy = my - unit.y;
    if (abs(dx) + abs(dy) <= 3 && (dx === 0 || dy === 0)) {
      // Trigger launcher animation
      unit.anim = 1; // Start animation
      attacked = attackLine(unit, dx, dy);
    }
  }
  
  // Shield activates its protection
  if (unit.type === "Shield" && abs(mx - unit.x) + abs(my - unit.y) <= 1) {
    unit.anim = 1; // Shield activate animation
  }
  
  return attacked;
}

// --------------------------------
// Game State Update Function - No longer used, logic moved to mousePressed
// --------------------------------
function updateGameState() {
  // This function is kept for reference but its logic has been moved directly to mousePressed
  // Update the grid with new unit positions
    updateGrid();
  
  // Check tower control
    checkTower();
  
  // Only check win conditions in playing mode
  if (gameState === "playing") {
    // Check win conditions
    let player = players[currentPlayer];
    
    // Win condition 1: Opponent has no units left
    if (players[1 - currentPlayer].units.length === 0) {
      gameState = "won";
    } 
    // Win condition 2: Player controls tower for 2 turns
    else if (player.towerTurns >= 2) {
      gameState = "won";
    } 
    // Win condition 3: Current player has no units left (opponent wins)
    else if (player.units.length === 0) {
      gameState = "won";
      currentPlayer = 1 - currentPlayer; // Switch to opponent as winner
    } 
    // No win yet, switch to next player
    else {
      currentPlayer = 1 - currentPlayer;
    }
  }
}

// --------------------------------
// Key Pressed Function - Handles keyboard input
// --------------------------------
function keyPressed() {
  // Restart game when 'R' is pressed after a win or stalemate
  if ((gameState === "won" || gameState === "stalemate") && key === 'r') {
    initializeGame();
    gameState = "playing";
    moveHistory = [];      // Clear move history
    repeatedMoveCount = 0; // Reset repeated move counter
    
    // Make sure the start overlay is hidden
    startOverlay.classList.add('hidden');
  }
}

// --------------------------------
// Attack Functions
// --------------------------------

// Regular attack on a specific grid cell
function attack(x, y) {
  let opponent = players[1 - currentPlayer];
  for (let i = 0; i < opponent.units.length; i++) {
    let u = opponent.units[i];
    if (u.x === x && u.y === y) {
      // Calculate positions for visual effects
      let attackerX = players[currentPlayer].units[selectedUnit].x * GRID_SIZE + 90;
      let attackerY = players[currentPlayer].units[selectedUnit].y * GRID_SIZE + 90;
      let targetX = x * GRID_SIZE + 90;
      let targetY = y * GRID_SIZE + 90;
      
      // Check if the unit is protected by a shield
      if (!isShielded(u)) {
        // Create attack line effect
        stroke(players[currentPlayer].color[0], players[currentPlayer].color[1], players[currentPlayer].color[2], 200);
        strokeWeight(3);
        line(attackerX, attackerY, targetX, targetY);
        
        // Create impact particles at target
        createParticles(targetX, targetY, players[currentPlayer].color, "attack", 15);
        
        u.hp--; // Reduce health if not shielded
        console.log(`Attacked unit at (${x}, ${y}), HP reduced to ${u.hp}`);
        
        // Add hit effect to the target
        u.anim = 1; // Trigger hit animation
        
        // Play attack sound (commented out for now)
        // playSound("attack");
      } else {
        // Create shield block effect
        stroke(255, 255, 255, 150);
        strokeWeight(2);
        line(attackerX, attackerY, targetX, targetY);
        
        // Find the shield unit that's protecting
        for (let p = 0; p < 2; p++) {
          for (let s of players[p].units) {
            if (s.type === "Shield" && abs(s.x - u.x) + abs(s.y - u.y) <= 1) {
              // Create shield particles
              let shieldX = s.x * GRID_SIZE + 90;
              let shieldY = s.y * GRID_SIZE + 90;
              createParticles(shieldX, shieldY, players[p].color, "shield", 10);
              
              // Activate shield animation
              s.anim = 1;
      break;
    }
  }
}

        u.anim = 1; // Shield block animation
        console.log(`Attack blocked by shield`);
        
        // Play shield block sound (commented out for now)
        // playSound("shield");
      }
      
      // Remove unit if health reaches zero
      if (u.hp <= 0) {
        // Create explosion effect
        createParticles(targetX, targetY, [255, 100, 50], "attack", 25);
        
        console.log(`Unit at (${x}, ${y}) destroyed`);
        opponent.units.splice(i, 1);
        
        // Play destruction sound (commented out for now)
        // playSound("destroy");
      }
      return true; // Attack was performed
    }
  }
  return false; // No attack was performed
}

// Line attack (for Launcher units)
function attackLine(unit, dx, dy) {
  let opponent = players[1 - currentPlayer];
  let attacked = false;
  
  // Calculate positions for visual effects
  let launcherX = unit.x * GRID_SIZE + 90;
  let launcherY = unit.y * GRID_SIZE + 90;
  
  // Draw attack line trajectory
  stroke(players[currentPlayer].color[0], players[currentPlayer].color[1], players[currentPlayer].color[2], 150);
  strokeWeight(2);
  
  // Calculate end point of trajectory line
  let endX = launcherX;
  let endY = launcherY;
  let hitTarget = false;
  
  // Check up to 3 cells in the direction
  for (let i = 1; i <= 3; i++) {
    let tx = unit.x + dx * i, ty = unit.y + dy * i;
    
    // Stop at grid boundaries
    if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) break;
    
    // Update end point if no hit yet
    if (!hitTarget) {
      endX = tx * GRID_SIZE + 90;
      endY = ty * GRID_SIZE + 90;
    }
    
    // Check for opponent units
    for (let j = 0; j < opponent.units.length; j++) {
      let u = opponent.units[j];
      if (u.x === tx && u.y === ty) {
        hitTarget = true;
        let targetX = tx * GRID_SIZE + 90;
        let targetY = ty * GRID_SIZE + 90;
        
        // Check if the unit is protected by a shield
        if (!isShielded(u)) {
          // Create impact particles at target
          createParticles(targetX, targetY, players[currentPlayer].color, "attack", 15);
          
          u.hp--; // Reduce health if not shielded
          console.log(`Launcher attacked unit at (${tx}, ${ty}), HP reduced to ${u.hp}`);
          
          // Add hit effect to the target
          u.anim = 1; // Trigger hit animation
          
          // Play attack sound (commented out for now)
          // playSound("launcher");
        } else {
          // Find the shield unit that's protecting
          for (let p = 0; p < 2; p++) {
            for (let s of players[p].units) {
              if (s.type === "Shield" && abs(s.x - u.x) + abs(s.y - u.y) <= 1) {
                // Create shield particles
                let shieldX = s.x * GRID_SIZE + 90;
                let shieldY = s.y * GRID_SIZE + 90;
                createParticles(shieldX, shieldY, players[p].color, "shield", 10);
                
                // Activate shield animation
                s.anim = 1;
                break;
              }
            }
          }
          
          u.anim = 1; // Shield block animation
          console.log(`Launcher attack blocked by shield`);
          
          // Play shield block sound (commented out for now)
          // playSound("shield");
        }
        
        // Remove unit if health reaches zero
        if (u.hp <= 0) {
          // Create explosion effect
          createParticles(targetX, targetY, [255, 100, 50], "attack", 25);
          
          console.log(`Unit at (${tx}, ${ty}) destroyed by launcher`);
          opponent.units.splice(j, 1);
          
          // Play destruction sound (commented out for now)
          // playSound("destroy");
        }
        attacked = true;
        break; // Stop after hitting first unit
      }
    }
    
    // Stop at friendly units too
    if (!hitTarget) {
      for (let j = 0; j < players[currentPlayer].units.length; j++) {
        let u = players[currentPlayer].units[j];
        if (u.x === tx && u.y === ty && u !== unit) {
          hitTarget = true;
          break; // Stop at friendly unit
        }
      }
    }
    
    // If we hit something, stop checking further cells
    if (hitTarget) break;
  }
  
  // Draw the attack line
  if (attacked) {
    // Draw a more prominent attack line
    stroke(players[currentPlayer].color[0], players[currentPlayer].color[1], players[currentPlayer].color[2], 200);
    strokeWeight(3);
  }
  
  // Draw the trajectory line with a slight animation
  let linePhase = (frameCount % 20) / 20;
  drawingContext.setLineDash([5, 5]);
  drawingContext.lineDashOffset = frameCount * 0.5;
  line(launcherX, launcherY, endX, endY);
  drawingContext.setLineDash([]);
  
  // Create small particles along the trajectory
  if (attacked && frameCount % 3 === 0) {
    let midX = launcherX + (endX - launcherX) * 0.5;
    let midY = launcherY + (endY - launcherY) * 0.5;
    createParticles(midX, midY, players[currentPlayer].color, "attack", 2);
  }
  
  return attacked;
}

// Check if a unit is protected by a shield
function isShielded(unit) {
  // Get the player that owns this unit
  let playerIndex = -1;
  for (let p = 0; p < 2; p++) {
    for (let u of players[p].units) {
      if (u === unit) {
        playerIndex = p;
        break;
      }
    }
    if (playerIndex !== -1) break;
  }
  
  if (playerIndex === -1) return false; // Unit not found
  
  // Check if any shield unit from the same player is adjacent
  for (let u of players[playerIndex].units) {
    // Shield units protect adjacent units (including diagonally)
    if (u.type === "Shield" && abs(u.x - unit.x) + abs(u.y - unit.y) <= 1) {
      return true;
    }
  }
  return false;
}

// --------------------------------
// Grid Update Function
// --------------------------------
function updateGrid() {
  // Clear the grid
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      grid[y][x] = null;
    }
  }
  
  // Place units on the grid
  for (let p of players) {
    for (let u of p.units) {
      grid[u.y][u.x] = u;
    }
  }
}

// --------------------------------
// Tower Control Function
// --------------------------------
function checkTower() {
  let player = players[currentPlayer];
  
  // Check if current player has units adjacent to tower
  let controlsTower = false;
  for (let u of player.units) {
    if (abs(u.x - TOWER_POS.x) + abs(u.y - TOWER_POS.y) <= 1) {
      controlsTower = true;
      break;
    }
  }
  
  // Check if opponent has units adjacent to tower
  let opponentNear = false;
  for (let u of players[1 - currentPlayer].units) {
    if (abs(u.x - TOWER_POS.x) + abs(u.y - TOWER_POS.y) <= 1) {
      opponentNear = true;
      break;
    }
  }
  
  // Player controls tower if they have units near and opponent doesn't
  if (controlsTower && !opponentNear) {
    player.towerTurns++;
    console.log(`${player.name} controls tower for ${player.towerTurns} turns`);
    
    // In tutorial mode, advance to next step when controlling tower
    if (gameState === "tutorial" && tutorialStep === 8) {
      nextTutorialStep();
    }
  } else {
    // Only reset tower control if the player doesn't have any units near the tower
    // This makes tower control more stable and less punishing
    if (!controlsTower) {
      player.towerTurns = 0;
    }
  }
}

// --------------------------------
// Stalemate Detection Function
// --------------------------------
function checkRepeatedMoves(moveData) {
  // Only track moves in playing mode
  if (gameState !== "playing") return;
  
  // Add the current move to history
  moveHistory.push(moveData);
  
  // Keep only the last 6 moves (3 moves per player)
  if (moveHistory.length > 6) {
    moveHistory.shift();
  }
  
  // Need at least 6 moves to check for a pattern
  if (moveHistory.length < 6) return;
  
  // Check if the last 3 pairs of moves are identical
  let isRepeating = true;
  
  // Compare the last 3 moves of player 0
  for (let i = 0; i < 2; i++) {
    let move1 = moveHistory.find((m, idx) => m.player === 0 && idx % 2 === 0 && idx >= moveHistory.length - 6 && idx < moveHistory.length - 4 + i * 2);
    let move2 = moveHistory.find((m, idx) => m.player === 0 && idx % 2 === 0 && idx >= moveHistory.length - 4 + i * 2);
    
    if (!move1 || !move2 || 
        move1.unitType !== move2.unitType || 
        move1.fromX !== move2.fromX || 
        move1.fromY !== move2.fromY || 
        move1.toX !== move2.toX || 
        move1.toY !== move2.toY || 
        (move1.isAttack !== move2.isAttack)) {
      isRepeating = false;
      break;
    }
  }
  
  // Also compare the last 3 moves of player 1
  if (isRepeating) {
    for (let i = 0; i < 2; i++) {
      let move1 = moveHistory.find((m, idx) => m.player === 1 && idx % 2 === 1 && idx >= moveHistory.length - 6 && idx < moveHistory.length - 4 + i * 2);
      let move2 = moveHistory.find((m, idx) => m.player === 1 && idx % 2 === 1 && idx >= moveHistory.length - 4 + i * 2);
      
      if (!move1 || !move2 || 
          move1.unitType !== move2.unitType || 
          move1.fromX !== move2.fromX || 
          move1.fromY !== move2.fromY || 
          move1.toX !== move2.toX || 
          move1.toY !== move2.toY || 
          (move1.isAttack !== move2.isAttack)) {
        isRepeating = false;
        break;
      }
    }
  }
  
  // If we have a repeating pattern, increment the counter
  if (isRepeating) {
    repeatedMoveCount++;
    console.log(`Repeated move pattern detected! Count: ${repeatedMoveCount}`);
    
    // After 3 repetitions, declare a stalemate
    if (repeatedMoveCount >= 3) {
      gameState = "stalemate";
      console.log("STALEMATE DECLARED - Game ends in a draw");
    }
  } else {
    // Reset the counter if the pattern is broken
    repeatedMoveCount = 0;
  }
}

// Function to move a unit
function moveUnit(unit, x, y) {
  // Create movement particles at the starting position
  let startX = unit.x * GRID_SIZE + 90;
  let startY = unit.y * GRID_SIZE + 90;
  createParticles(startX, startY, players[currentPlayer].color, "move", 10);
  
  // Update unit position
  unit.x = x;
  unit.y = y;
  
  // Create arrival particles at the destination
  let endX = x * GRID_SIZE + 90;
  let endY = y * GRID_SIZE + 90;
  createParticles(endX, endY, players[currentPlayer].color, "move", 10);
  
  // Record the move in history
  recordMove();
  
  // End turn
  endTurn();
}

// --------------------------------
// Helper Functions
// --------------------------------

// Check if a cell is empty
function isCellEmpty(x, y) {
  // Check if coordinates are within grid bounds
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
    return false;
  }
  
  // Check if the cell is empty (no unit)
  return grid[y][x] === null;
}

// Record a move for stalemate detection
function recordMove() {
  // Only track moves in playing mode
  if (gameState !== "playing") return;
  
  let unit = players[currentPlayer].units[selectedUnit];
  
  // Create move data
  let moveData = {
    unitType: unit.type,
    fromX: unit.x,
    fromY: unit.y,
    toX: unit.x, // Same as fromX since we're recording after the move
    toY: unit.y, // Same as fromY since we're recording after the move
    player: currentPlayer,
    isAttack: false
  };
  
  // Check for repeated moves
  checkRepeatedMoves(moveData);
}

// End the current player's turn
function endTurn() {
  // Update the grid with new unit positions
  updateGrid();
  
  // Check tower control
  checkTower();
  
  // Only check win conditions in playing mode
  if (gameState === "playing") {
    // Check win conditions
    let player = players[currentPlayer];
    
    // Win condition 1: Opponent has no units left
    if (players[1 - currentPlayer].units.length === 0) {
      gameState = "won";
    } 
    // Win condition 2: Player controls tower for enough turns
    else if (player.towerTurns >= TOWER_TURNS_TO_WIN) {
      gameState = "won";
    } 
    // Win condition 3: Current player has no units left (opponent wins)
    else if (player.units.length === 0) {
      gameState = "won";
      currentPlayer = 1 - currentPlayer; // Switch to opponent as winner
    } 
    // No win yet, switch to next player
    else {
      currentPlayer = 1 - currentPlayer;
      selectedUnit = null; // Deselect unit when turn ends
    }
  }
}

// --------------------------------
// AI Functions
// --------------------------------

// Main AI move function
function makeAIMove() {
  // Get AI units
  let aiUnits = players[1].units;
  if (aiUnits.length === 0) return;
  
  console.log("AI is planning its move...");
  
  // First, check if we can win by controlling the tower
  if (players[1].towerTurns === TOWER_TURNS_TO_WIN - 1) {
    console.log("AI is one turn away from winning via tower control!");
    // Try to maintain tower control at all costs
    let bestTowerMove = findBestTowerControlMove();
    if (bestTowerMove) {
      executeMove(bestTowerMove);
      return;
    }
  }
  
  // Next, check if we can eliminate a player unit
  let bestAttackMove = findBestAttackMove();
  if (bestAttackMove && bestAttackMove.score > 50) { // Only if it's a good attack
    console.log("AI found a good attack opportunity!");
    executeMove(bestAttackMove);
    return;
  }
  
  // If player is close to winning via tower, prioritize disrupting that
  if (players[0].towerTurns === TOWER_TURNS_TO_WIN - 1) {
    console.log("Player is one turn away from winning! AI must disrupt tower control!");
    let disruptionMove = findTowerDisruptionMove();
    if (disruptionMove) {
      executeMove(disruptionMove);
      return;
    }
  }
  
  // Otherwise, evaluate all possible moves and pick the best one
  let bestScore = -Infinity;
  let bestMove = null;
  
  // Try each unit
  for (let i = 0; i < aiUnits.length; i++) {
    let unit = aiUnits[i];
    
    // Try each possible move direction
    const directions = [
      {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
      {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
    ];
    
    for (let dir of directions) {
      let newX = unit.x + dir.dx;
      let newY = unit.y + dir.dy;
      
      // Check if move is valid
      if (newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS && grid[newY][newX] === null) {
        // Temporarily make the move
        let originalX = unit.x;
        let originalY = unit.y;
        unit.x = newX;
        unit.y = newY;
        
        // Evaluate the board after this move
        let score = evaluateBoard();
        
        // Undo the move
        unit.x = originalX;
        unit.y = originalY;
        
        // Update best move if this is better
        if (score > bestScore) {
          bestScore = score;
          bestMove = {
            unitIndex: i,
            x: newX,
            y: newY,
            type: "move",
            score: score
          };
        }
      }
    }
    
    // For Launcher units, check attack opportunities
    if (unit.type === "Launcher") {
      // Check each direction for attack
      for (let dir of directions) {
        for (let dist = 1; dist <= 3; dist++) {
          let targetX = unit.x + dir.dx * dist;
          let targetY = unit.y + dir.dy * dist;
          
          // Check if target is valid
          if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
            // Check if there's a player unit to attack
            let foundPlayerUnit = false;
            for (let playerUnit of players[0].units) {
              if (playerUnit.x === targetX && playerUnit.y === targetY) {
                foundPlayerUnit = true;
                
                // Check if the unit is protected by a shield
                let isProtected = false;
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    isProtected = true;
                    break;
                  }
                }
                
                if (!isProtected) {
                  // Evaluate attack only if unit is not protected
                  let attackScore = 50; // Base score for attack
                  
                  // Prioritize low health units
                  if (playerUnit.hp === 1) attackScore += 30;
                  
                  // Prioritize Shield units
                  if (playerUnit.type === "Shield") attackScore += 20;
                  
                  // Prioritize units near tower
                  if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
                    attackScore += 40; // Big bonus for attacking units near tower
                  }
                  
                  // Update best move if this attack is better
                  if (attackScore > bestScore) {
                    bestScore = attackScore;
                    bestMove = {
                      unitIndex: i,
                      dx: dir.dx,
                      dy: dir.dy,
                      type: "launcher_attack",
                      score: attackScore
                    };
                  }
                } else {
                  // If unit is protected, consider attacking the shield instead
                  for (let shieldUnit of players[0].units) {
                    if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                      // Check if shield is in line of sight
                      let shieldInSight = false;
                      for (let d = 1; d <= 3; d++) {
                        let sx = unit.x + dir.dx * d;
                        let sy = unit.y + dir.dy * d;
                        if (sx === shieldUnit.x && sy === shieldUnit.y) {
                          shieldInSight = true;
                          
                          // Prioritize attacking shields that are protecting units
                          let attackScore = 60; // Higher base score for shield attack
                          
                          // Update best move if this attack is better
                          if (attackScore > bestScore) {
                            bestScore = attackScore;
                            bestMove = {
                              unitIndex: i,
                              dx: dir.dx,
                              dy: dir.dy,
                              type: "launcher_attack",
                              score: attackScore
                            };
                          }
                          break;
                        }
                      }
                      if (shieldInSight) break;
                    }
                  }
                }
                
                break;
              }
            }
            
            // Stop checking this direction if we hit any unit
            if (foundPlayerUnit || grid[targetY][targetX] !== null) break;
          } else {
            // Stop at grid boundaries
            break;
          }
        }
      }
    }
    
    // For Blaster units, check adjacent attack opportunities
    if (unit.type === "Blaster") {
      for (let dir of directions) {
        let targetX = unit.x + dir.dx;
        let targetY = unit.y + dir.dy;
        
        // Check if target is valid
        if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
          // Check if there's a player unit to attack
          for (let playerUnit of players[0].units) {
            if (playerUnit.x === targetX && playerUnit.y === targetY) {
              // Check if the unit is protected by a shield
              let isProtected = false;
              for (let shieldUnit of players[0].units) {
                if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                  isProtected = true;
                  break;
                }
              }
              
              if (!isProtected) {
                // Evaluate attack only if unit is not protected
                let attackScore = 40; // Base score for attack
                
                // Prioritize low health units
                if (playerUnit.hp === 1) attackScore += 30;
                
                // Prioritize units near tower
                if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
                  attackScore += 40; // Big bonus for attacking units near tower
                }
                
                // Update best move if this attack is better
                if (attackScore > bestScore) {
                  bestScore = attackScore;
                  bestMove = {
                    unitIndex: i,
                    x: targetX,
                    y: targetY,
                    type: "blaster_attack",
                    score: attackScore
                  };
                }
              } else {
                // If unit is protected, consider attacking the shield instead
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    // Check if shield is adjacent
                    if (abs(unit.x - shieldUnit.x) + abs(unit.y - shieldUnit.y) === 1) {
                      // Prioritize attacking shields that are protecting units
                      let attackScore = 50; // Higher base score for shield attack
                      
                      // Update best move if this attack is better
                      if (attackScore > bestScore) {
                        bestScore = attackScore;
                        bestMove = {
                          unitIndex: i,
                          x: shieldUnit.x,
                          y: shieldUnit.y,
                          type: "blaster_attack",
                          score: attackScore
                        };
                      }
                    }
                  }
                }
              }
              
              break;
            }
          }
        }
      }
    }
  }
  
  // Execute the best move
  if (bestMove) {
    console.log(`AI chose a move with score: ${bestMove.score}`);
    executeMove(bestMove);
  } else {
    // If no good move found, just move randomly
    console.log("AI couldn't find a good move, moving randomly");
    makeRandomAIMove();
  }
}

// Helper function to execute a move
function executeMove(move) {
  selectedUnit = move.unitIndex;
  let unit = players[1].units[selectedUnit];
  
  if (move.type === "move") {
    // Execute move
    moveUnit(unit, move.x, move.y);
  } else if (move.type === "launcher_attack") {
    // Execute launcher attack
    attackLine(unit, move.dx, move.dy);
    endTurn();
  } else if (move.type === "blaster_attack") {
    // Execute blaster attack
    attack(move.x, move.y);
    endTurn();
  }
  
  // Reset selection
  selectedUnit = null;
}

// Find the best move to maintain or gain tower control
function findBestTowerControlMove() {
  let aiUnits = players[1].units;
  let bestMove = null;
  let bestScore = -Infinity;
  
  // Check if AI has units adjacent to tower
  let unitsNearTower = [];
  for (let i = 0; i < aiUnits.length; i++) {
    let unit = aiUnits[i];
    if (abs(unit.x - TOWER_POS.x) + abs(unit.y - TOWER_POS.y) <= 1) {
      unitsNearTower.push({index: i, unit: unit});
    }
  }
  
  // Check if player has units adjacent to tower
  let playerUnitsNearTower = [];
  for (let playerUnit of players[0].units) {
    if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
      playerUnitsNearTower.push(playerUnit);
    }
  }
  
  // If we have units near tower but player also has units near tower,
  // we need to eliminate player units to gain control
  if (unitsNearTower.length > 0 && playerUnitsNearTower.length > 0) {
    console.log("AI has units near tower but needs to eliminate player units to gain control");
    
    // Try to attack player units near tower
    for (let i = 0; i < aiUnits.length; i++) {
      let unit = aiUnits[i];
      
      // For Launcher units, check if they can attack player units near tower
      if (unit.type === "Launcher") {
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
          {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
        ];
        
        for (let dir of directions) {
          for (let dist = 1; dist <= 3; dist++) {
            let targetX = unit.x + dir.dx * dist;
            let targetY = unit.y + dir.dy * dist;
            
            // Check if target is valid
            if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
              // Check if there's a player unit near tower to attack
              for (let playerUnit of playerUnitsNearTower) {
                if (playerUnit.x === targetX && playerUnit.y === targetY) {
                  // Check if protected by shield
                  let isProtected = false;
                  for (let shieldUnit of players[0].units) {
                    if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                      isProtected = true;
                      break;
                    }
                  }
                  
                  if (!isProtected) {
                    // This is a high priority move
                    console.log(`AI can attack player unit near tower at (${targetX},${targetY})`);
                    return {
                      unitIndex: i,
                      dx: dir.dx,
                      dy: dir.dy,
                      type: "launcher_attack",
                      score: 250 // Very high score for attacking units blocking tower control
                    };
                  }
                  break;
                }
              }
              
              // Stop at any unit
              let occupied = false;
              for (let p = 0; p < 2; p++) {
                for (let u of players[p].units) {
                  if (u.x === targetX && u.y === targetY) {
                    occupied = true;
                    break;
                  }
                }
                if (occupied) break;
              }
              if (occupied) break;
            } else {
              break;
            }
          }
        }
      }
      
      // For Blaster units, check if they can attack player units near tower
      if (unit.type === "Blaster") {
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
          {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
        ];
        
        for (let dir of directions) {
          let targetX = unit.x + dir.dx;
          let targetY = unit.y + dir.dy;
          
          // Check if target is valid
          if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
            // Check if there's a player unit near tower to attack
            for (let playerUnit of playerUnitsNearTower) {
              if (playerUnit.x === targetX && playerUnit.y === targetY) {
                // Check if protected by shield
                let isProtected = false;
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    isProtected = true;
                    break;
                  }
                }
                
                if (!isProtected) {
                  // This is a high priority move
                  console.log(`AI can attack player unit near tower at (${targetX},${targetY})`);
                  return {
                    unitIndex: i,
                    x: targetX,
                    y: targetY,
                    type: "blaster_attack",
                    score: 250 // Very high score for attacking units blocking tower control
                  };
                }
                break;
              }
            }
          }
        }
      }
    }
  }
  
  // If we already have units near tower and no player units are near, maintain position
  if (unitsNearTower.length > 0 && playerUnitsNearTower.length === 0) {
    console.log("AI already controlling tower, maintaining position");
    return null; // No need to move, we're already controlling the tower
  }
  
  // If no one controls tower, try to move a unit adjacent to it
  console.log("AI attempting to gain tower control");
  
  // Sort units by distance to tower (closest first)
  let unitsByDistance = [];
  for (let i = 0; i < aiUnits.length; i++) {
    let unit = aiUnits[i];
    let distanceToTower = abs(unit.x - TOWER_POS.x) + abs(unit.y - TOWER_POS.y);
    unitsByDistance.push({index: i, unit: unit, distance: distanceToTower});
  }
  unitsByDistance.sort((a, b) => a.distance - b.distance);
  
  // Try to move the closest units to the tower first
  for (let unitInfo of unitsByDistance) {
    let unit = unitInfo.unit;
    let i = unitInfo.index;
    let distanceToTower = unitInfo.distance;
    
    // If unit is already adjacent to tower, skip
    if (distanceToTower <= 1) continue;
    
    // If unit can reach tower in one move
    if (distanceToTower === 2) {
      // Try each direction
      const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
        {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
      ];
      
      for (let dir of directions) {
        let newX = unit.x + dir.dx;
        let newY = unit.y + dir.dy;
        
        // Check if this move gets us adjacent to tower
        if (abs(newX - TOWER_POS.x) + abs(newY - TOWER_POS.y) === 1 && 
            newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS && 
            grid[newY][newX] === null) {
          
          console.log(`AI can move unit to gain tower control at (${newX},${newY})`);
          return {
            unitIndex: i,
            x: newX,
            y: newY,
            type: "move",
            score: 220 // Very high score for gaining tower control
          };
        }
      }
    }
    
    // If unit is further away, try to move closer to tower
    if (distanceToTower > 2) {
      // Try each direction
      const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
        {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
      ];
      
      // Sort directions by which gets us closest to tower
      directions.sort((a, b) => {
        let newDistA = abs(unit.x + a.dx - TOWER_POS.x) + abs(unit.y + a.dy - TOWER_POS.y);
        let newDistB = abs(unit.x + b.dx - TOWER_POS.x) + abs(unit.y + b.dy - TOWER_POS.y);
        return newDistA - newDistB;
      });
      
      for (let dir of directions) {
        let newX = unit.x + dir.dx;
        let newY = unit.y + dir.dy;
        let newDistance = abs(newX - TOWER_POS.x) + abs(newY - TOWER_POS.y);
        
        // Only consider moves that get us closer to tower
        if (newDistance < distanceToTower && 
            newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS && 
            grid[newY][newX] === null) {
          
          let moveScore = 150 + (5 - newDistance) * 20; // Higher score for getting closer
          
          if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = {
              unitIndex: i,
              x: newX,
              y: newY,
              type: "move",
              score: moveScore
            };
          }
        }
      }
    }
  }
  
  if (bestMove) {
    console.log(`AI chose to move toward tower with score ${bestMove.score}`);
  }
  
  return bestMove;
}

// Find the best attack move to eliminate player units
function findBestAttackMove() {
  let aiUnits = players[1].units;
  let bestMove = null;
  let bestScore = -Infinity;
  
  // Try each unit
  for (let i = 0; i < aiUnits.length; i++) {
    let unit = aiUnits[i];
    
    // For Launcher units, check attack opportunities
    if (unit.type === "Launcher") {
      const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
        {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
      ];
      
      for (let dir of directions) {
        for (let dist = 1; dist <= 3; dist++) {
          let targetX = unit.x + dir.dx * dist;
          let targetY = unit.y + dir.dy * dist;
          
          // Check if target is valid
          if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
            // Check if there's a player unit to attack
            for (let playerUnit of players[0].units) {
              if (playerUnit.x === targetX && playerUnit.y === targetY) {
                // Check if protected by shield
                let isProtected = false;
                let protectingShield = null;
                
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    isProtected = true;
                    protectingShield = shieldUnit;
                    break;
                  }
                }
                
                if (!isProtected) {
                  // Calculate attack score
                  let attackScore = 100; // Base score for attack (increased from 70)
                  
                  // Prioritize low health units that can be eliminated
                  if (playerUnit.hp === 1) attackScore += 80; // Increased from 50
                  
                  // Prioritize shield units
                  if (playerUnit.type === "Shield") attackScore += 70; // Increased from 40
                  
                  // Prioritize units near tower
                  if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
                    attackScore += 100; // Increased from 60
                  }
                  
                  // NEW: Prioritize attacks that would eliminate a player unit
                  if (playerUnit.hp <= 1) {
                    attackScore += 150; // Huge bonus for eliminating a unit
                  }
                  
                  if (attackScore > bestScore) {
                    bestScore = attackScore;
                    bestMove = {
                      unitIndex: i,
                      dx: dir.dx,
                      dy: dir.dy,
                      type: "launcher_attack",
                      score: attackScore,
                      targetDesc: `${playerUnit.type} at (${targetX},${targetY})`
                    };
                  }
                } else if (protectingShield) {
                  // Check if we can attack the shield instead
                  let shieldInSight = false;
                  let shieldDist = 0;
                  
                  for (let d = 1; d <= 3; d++) {
                    let sx = unit.x + dir.dx * d;
                    let sy = unit.y + dir.dy * d;
                    if (sx === protectingShield.x && sy === protectingShield.y) {
                      shieldInSight = true;
                      shieldDist = d;
                      break;
                    }
                  }
                  
                  if (shieldInSight) {
                    // Calculate attack score for shield
                    let attackScore = 120; // Higher base score for shield attack (increased)
                    
                    // Prioritize shields with low health
                    if (protectingShield.hp === 1) attackScore += 80;
                    
                    // Prioritize shields near tower
                    if (abs(protectingShield.x - TOWER_POS.x) + abs(protectingShield.y - TOWER_POS.y) <= 1) {
                      attackScore += 90;
                    }
                    
                    // NEW: Prioritize shields that are protecting multiple units
                    let protectedCount = 0;
                    for (let otherUnit of players[0].units) {
                      if (otherUnit !== protectingShield && 
                          abs(protectingShield.x - otherUnit.x) + abs(protectingShield.y - otherUnit.y) <= 1) {
                        protectedCount++;
                      }
                    }
                    attackScore += protectedCount * 40;
                    
                    if (attackScore > bestScore) {
                      bestScore = attackScore;
                      bestMove = {
                        unitIndex: i,
                        dx: dir.dx,
                        dy: dir.dy,
                        type: "launcher_attack",
                        score: attackScore,
                        targetDesc: `Shield at (${protectingShield.x},${protectingShield.y})`
                      };
                    }
                  }
                }
                break;
              }
            }
            
            // Stop at any unit
            let occupied = false;
            for (let p = 0; p < 2; p++) {
              for (let u of players[p].units) {
                if (u.x === targetX && u.y === targetY) {
                  occupied = true;
                  break;
                }
              }
              if (occupied) break;
            }
            if (occupied) break;
          } else {
            break; // Out of bounds
          }
        }
      }
    }
    
    // For Blaster units, check adjacent attack opportunities
    if (unit.type === "Blaster") {
      const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
        {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
      ];
      
      for (let dir of directions) {
        let targetX = unit.x + dir.dx;
        let targetY = unit.y + dir.dy;
        
        // Check if target is valid
        if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
          // Check if there's a player unit to attack
          for (let playerUnit of players[0].units) {
            if (playerUnit.x === targetX && playerUnit.y === targetY) {
              // Check if protected by shield
              let isProtected = false;
              let protectingShield = null;
              
              for (let shieldUnit of players[0].units) {
                if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                  isProtected = true;
                  protectingShield = shieldUnit;
                  break;
                }
              }
              
              if (!isProtected) {
                // Calculate attack score
                let attackScore = 90; // Base score for attack (increased from 60)
                
                // Prioritize low health units that can be eliminated
                if (playerUnit.hp === 1) attackScore += 80; // Increased from 50
                
                // Prioritize shield units
                if (playerUnit.type === "Shield") attackScore += 70; // Increased from 40
                
                // Prioritize units near tower
                if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
                  attackScore += 100; // Increased from 60
                }
                
                // NEW: Prioritize attacks that would eliminate a player unit
                if (playerUnit.hp <= 1) {
                  attackScore += 150; // Huge bonus for eliminating a unit
                }
                
                if (attackScore > bestScore) {
                  bestScore = attackScore;
                  bestMove = {
                    unitIndex: i,
                    x: targetX,
                    y: targetY,
                    type: "blaster_attack",
                    score: attackScore,
                    targetDesc: `${playerUnit.type} at (${targetX},${targetY})`
                  };
                }
              } else if (protectingShield && abs(unit.x - protectingShield.x) + abs(unit.y - protectingShield.y) === 1) {
                // We can attack the shield directly
                let attackScore = 110; // Higher base score for shield attack (increased)
                
                // Prioritize shields with low health
                if (protectingShield.hp === 1) attackScore += 80;
                
                // Prioritize shields near tower
                if (abs(protectingShield.x - TOWER_POS.x) + abs(protectingShield.y - TOWER_POS.y) <= 1) {
                  attackScore += 90;
                }
                
                // NEW: Prioritize shields that are protecting multiple units
                let protectedCount = 0;
                for (let otherUnit of players[0].units) {
                  if (otherUnit !== protectingShield && 
                      abs(protectingShield.x - otherUnit.x) + abs(protectingShield.y - otherUnit.y) <= 1) {
                    protectedCount++;
                  }
                }
                attackScore += protectedCount * 40;
                
                if (attackScore > bestScore) {
                  bestScore = attackScore;
                  bestMove = {
                    unitIndex: i,
                    x: protectingShield.x,
                    y: protectingShield.y,
                    type: "blaster_attack",
                    score: attackScore,
                    targetDesc: `Shield at (${protectingShield.x},${protectingShield.y})`
                  };
                }
              }
              break;
            }
          }
        }
      }
    }
  }
  
  // If we found a good attack, log it
  if (bestMove) {
    console.log(`AI found attack opportunity: ${bestMove.targetDesc} with score ${bestMove.score}`);
  }
  
  return bestMove;
}

// Find a move to disrupt player's tower control
function findTowerDisruptionMove() {
  let aiUnits = players[1].units;
  let bestMove = null;
  let bestScore = -Infinity;
  
  // Check if player has units adjacent to tower
  let playerUnitsNearTower = [];
  for (let playerUnit of players[0].units) {
    if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
      playerUnitsNearTower.push(playerUnit);
    }
  }
  
  // If player has units near tower, try to attack them
  if (playerUnitsNearTower.length > 0) {
    // Try to attack these units
    for (let i = 0; i < aiUnits.length; i++) {
      let unit = aiUnits[i];
      
      // For Launcher units, check if they can attack player units near tower
      if (unit.type === "Launcher") {
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
          {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
        ];
        
        for (let dir of directions) {
          for (let dist = 1; dist <= 3; dist++) {
            let targetX = unit.x + dir.dx * dist;
            let targetY = unit.y + dir.dy * dist;
            
            // Check if target is valid
            if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
              // Check if there's a player unit near tower to attack
              for (let playerUnit of playerUnitsNearTower) {
                if (playerUnit.x === targetX && playerUnit.y === targetY) {
                  // Check if protected by shield
                  let isProtected = false;
                  for (let shieldUnit of players[0].units) {
                    if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                      isProtected = true;
                      break;
                    }
                  }
                  
                  if (!isProtected) {
                    // This is a high priority move
                    let attackScore = 200; // Very high score for disrupting tower control
                    
                    return {
                      unitIndex: i,
                      dx: dir.dx,
                      dy: dir.dy,
                      type: "launcher_attack",
                      score: attackScore
                    };
                  }
                  break;
                }
              }
              
              // Stop at any unit
              let occupied = false;
              for (let p = 0; p < 2; p++) {
                for (let u of players[p].units) {
                  if (u.x === targetX && u.y === targetY) {
                    occupied = true;
                    break;
                  }
                }
                if (occupied) break;
              }
              if (occupied) break;
            } else {
              break;
            }
          }
        }
      }
      
      // For Blaster units, check if they can attack player units near tower
      if (unit.type === "Blaster") {
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
          {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
        ];
        
        for (let dir of directions) {
          let targetX = unit.x + dir.dx;
          let targetY = unit.y + dir.dy;
          
          // Check if target is valid
          if (targetX >= 0 && targetX < GRID_COLS && targetY >= 0 && targetY < GRID_ROWS) {
            // Check if there's a player unit near tower to attack
            for (let playerUnit of playerUnitsNearTower) {
              if (playerUnit.x === targetX && playerUnit.y === targetY) {
                // Check if protected by shield
                let isProtected = false;
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    isProtected = true;
                    break;
                  }
                }
                
                if (!isProtected) {
                  // This is a high priority move
                  let attackScore = 200; // Very high score for disrupting tower control
                  
                  return {
                    unitIndex: i,
                    x: targetX,
                    y: targetY,
                    type: "blaster_attack",
                    score: attackScore
                  };
                }
                break;
              }
            }
          }
        }
      }
    }
    
    // If we can't attack, try to move a unit adjacent to the tower
    for (let i = 0; i < aiUnits.length; i++) {
      let unit = aiUnits[i];
      let distanceToTower = abs(unit.x - TOWER_POS.x) + abs(unit.y - TOWER_POS.y);
      
      // If unit is 2 steps away from tower, it can reach it in one move
      if (distanceToTower === 2) {
        // Try each direction
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
          {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
        ];
        
        for (let dir of directions) {
          let newX = unit.x + dir.dx;
          let newY = unit.y + dir.dy;
          
          // Check if this move gets us adjacent to tower
          if (abs(newX - TOWER_POS.x) + abs(newY - TOWER_POS.y) === 1 && 
              newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS && 
              grid[newY][newX] === null) {
            
            // This is a high priority move
            return {
              unitIndex: i,
              x: newX,
              y: newY,
              type: "move",
              score: 180 // High score for disrupting tower control
            };
          }
        }
      }
    }
  }
  
  return null;
}

// Fallback random AI move
function makeRandomAIMove() {
  let aiUnits = players[1].units;
  if (aiUnits.length === 0) return;
  
  // Pick a random unit
  let randomUnitIndex = floor(random(aiUnits.length));
  let unit = aiUnits[randomUnitIndex];
  selectedUnit = randomUnitIndex;
  
  // Try to find a valid move
  const directions = [
    {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
    {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
  ];
  
  // Shuffle directions for randomness
  directions.sort(() => random() - 0.5);
  
  for (let dir of directions) {
    let newX = unit.x + dir.dx;
    let newY = unit.y + dir.dy;
    
    // Check if move is valid
    if (newX >= 0 && newX < GRID_COLS && newY >= 0 && newY < GRID_ROWS && grid[newY][newX] === null) {
      // Execute move
      moveUnit(unit, newX, newY);
      return;
    }
  }
  
  // If no valid move found, just end turn
  endTurn();
}

// Evaluate the current board state from AI perspective
function evaluateBoard() {
  let score = 0;
  
  // HIGHEST PRIORITY: Tower control
  // Heavily reward tower control progress
  score += players[1].towerTurns * 150; // Massive bonus for tower control (increased from 100)
  score -= players[0].towerTurns * 180; // Even bigger penalty if player controls tower (increased from 120)
  
  // Check if AI has units adjacent to tower
  let aiControllingTower = false;
  let playerControllingTower = false;
  
  // Count units adjacent to tower for both players
  let aiUnitsNearTower = 0;
  let playerUnitsNearTower = 0;
  
  for (let unit of players[1].units) {
    let distanceToTower = abs(unit.x - TOWER_POS.x) + abs(unit.y - TOWER_POS.y);
    if (distanceToTower <= 1) {
      aiUnitsNearTower++;
      aiControllingTower = true;
    }
  }
  
  for (let unit of players[0].units) {
    let distanceToTower = abs(unit.x - TOWER_POS.x) + abs(unit.y - TOWER_POS.y);
    if (distanceToTower <= 1) {
      playerUnitsNearTower++;
      playerControllingTower = true;
    }
  }
  
  // Reward having more units near tower than opponent
  score += (aiUnitsNearTower - playerUnitsNearTower) * 80; // Increased from 50
  
  // If no one controls tower, heavily reward moving toward it
  if (!aiControllingTower && !playerControllingTower) {
    for (let unit of players[1].units) {
      let distanceToTower = abs(unit.x - TOWER_POS.x) + abs(unit.y - TOWER_POS.y);
      // Closer is better, with exponential scaling
      score += Math.pow(5 - distanceToTower, 3) * 8; // Increased exponential factor and multiplier
    }
  }
  
  // EQUALLY HIGH PRIORITY: Eliminating enemy units
  // Reward having more units and more health
  score += players[1].units.length * 70; // Each AI unit is valuable (increased from 40)
  score -= players[0].units.length * 90; // Player units are a bigger threat (increased from 50)
  
  // Health points are valuable
  for (let unit of players[1].units) {
    score += unit.hp * 25; // Increased from 15
    
    // Extra value for shield units
    if (unit.type === "Shield") {
      score += 30; // Increased from 20
      
      // Check if shield is protecting other units
      for (let allyUnit of players[1].units) {
        if (allyUnit !== unit && abs(unit.x - allyUnit.x) + abs(unit.y - allyUnit.y) <= 1) {
          score += 40; // Big bonus for active protection (increased from 25)
        }
      }
    }
  }
  
  // Player health is a threat
  for (let unit of players[0].units) {
    score -= unit.hp * 30; // Increased from 20
    
    // Extra penalty for player shield units
    if (unit.type === "Shield") {
      score -= 50; // Increased from 30
      
      // Check if shield is protecting other units
      for (let playerUnit of players[0].units) {
        if (playerUnit !== unit && abs(unit.x - playerUnit.x) + abs(unit.y - playerUnit.y) <= 1) {
          score -= 60; // Big penalty for active protection (increased from 35)
        }
      }
    }
  }
  
  // HIGH PRIORITY: Attack opportunities
  // Reward positions that enable attacks on player units
  for (let unit of players[1].units) {
    // For Launcher units, check line of sight to player units
    if (unit.type === "Launcher") {
      const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
        {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
      ];
      
      for (let dir of directions) {
        for (let dist = 1; dist <= 3; dist++) {
          let tx = unit.x + dir.dx * dist;
          let ty = unit.y + dir.dy * dist;
          
          // Check if target is valid
          if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
            // Check if there's a player unit to attack
            for (let playerUnit of players[0].units) {
              if (playerUnit.x === tx && playerUnit.y === ty) {
                // Check if protected by shield
                let isProtected = false;
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    isProtected = true;
                    break;
                  }
                }
                
                if (!isProtected) {
                  // Reward attack opportunity
                  score += 50; // Increased from 30
                  
                  // Extra reward for low health targets
                  if (playerUnit.hp === 1) {
                    score += 80; // Potential kill (increased from 40)
                  }
                  
                  // Extra reward for shield targets
                  if (playerUnit.type === "Shield") {
                    score += 70; // Increased from 35
                  }
                  
                  // Extra reward for units near tower
                  if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
                    score += 90; // New bonus for attacking units near tower
                  }
                } else {
                  // Look for the shield unit
                  for (let shieldUnit of players[0].units) {
                    if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                      // Check if shield is in line of sight
                      for (let d = 1; d <= 3; d++) {
                        let sx = unit.x + dir.dx * d;
                        let sy = unit.y + dir.dy * d;
                        if (sx === shieldUnit.x && sy === shieldUnit.y) {
                          score += 85; // Reward opportunity to take out shield (increased from 45)
                          break;
                        }
                      }
                    }
                  }
                }
                break;
              }
            }
            
            // Stop at any unit
            let occupied = false;
            for (let p = 0; p < 2; p++) {
              for (let u of players[p].units) {
                if (u.x === tx && u.y === ty) {
                  occupied = true;
                  break;
                }
              }
              if (occupied) break;
            }
            if (occupied) break;
          } else {
            break; // Out of bounds
          }
        }
      }
    }
    
    // For Blaster units, check adjacent squares for player units
    if (unit.type === "Blaster") {
      const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, // horizontal
        {dx: 0, dy: 1}, {dx: 0, dy: -1}  // vertical
      ];
      
      for (let dir of directions) {
        let tx = unit.x + dir.dx;
        let ty = unit.y + dir.dy;
        
        // Check if target is valid
        if (tx >= 0 && tx < GRID_COLS && ty >= 0 && ty < GRID_ROWS) {
          // Check if there's a player unit to attack
          for (let playerUnit of players[0].units) {
            if (playerUnit.x === tx && playerUnit.y === ty) {
              // Check if protected by shield
              let isProtected = false;
              for (let shieldUnit of players[0].units) {
                if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                  isProtected = true;
                  break;
                }
              }
              
              if (!isProtected) {
                // Reward attack opportunity
                score += 45; // Increased from 25
                
                // Extra reward for low health targets
                if (playerUnit.hp === 1) {
                  score += 75; // Potential kill (increased from 35)
                }
                
                // Extra reward for shield targets
                if (playerUnit.type === "Shield") {
                  score += 65; // Increased from 30
                }
                
                // Extra reward for units near tower
                if (abs(playerUnit.x - TOWER_POS.x) + abs(playerUnit.y - TOWER_POS.y) <= 1) {
                  score += 85; // New bonus for attacking units near tower
                }
              } else {
                // Check if the shield itself is adjacent
                for (let shieldUnit of players[0].units) {
                  if (shieldUnit.type === "Shield" && abs(shieldUnit.x - playerUnit.x) + abs(shieldUnit.y - playerUnit.y) <= 1) {
                    if (abs(unit.x - shieldUnit.x) + abs(unit.y - shieldUnit.y) === 1) {
                      score += 80; // Reward opportunity to take out shield (increased from 40)
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // MEDIUM PRIORITY: Defensive positioning
  // Reward shield units protecting other units
  for (let unit of players[1].units) {
    if (unit.type === "Shield") {
      for (let allyUnit of players[1].units) {
        if (allyUnit !== unit && abs(unit.x - allyUnit.x) + abs(unit.y - allyUnit.y) <= 1) {
          score += 25; // Bonus for each protected unit (increased from 15)
        }
      }
    }
  }
  
  // NEW: Reward positioning units to block player's path to tower
  if (aiControllingTower) {
    for (let unit of players[1].units) {
      // Check if unit is positioned between player units and tower
      for (let playerUnit of players[0].units) {
        let playerToTowerX = TOWER_POS.x - playerUnit.x;
        let playerToTowerY = TOWER_POS.y - playerUnit.y;
        
        // If unit is in the path between player and tower
        if ((unit.x - playerUnit.x) * playerToTowerX > 0 && 
            (unit.y - playerUnit.y) * playerToTowerY > 0) {
          score += 30; // Reward blocking position
        }
      }
    }
  }
  
  return score;
}
