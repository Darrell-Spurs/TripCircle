const { useState, useEffect, useRef } = React;

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 5;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 30;
const BRICK_ROWS = 3;
const BRICK_COLS = 4;
const BRICK_PADDING = 15;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 50;

// Brick types
const BRICK_TYPES = {
    NORMAL: { hits: 1, color: '#87CEEB', points: 10 }, // Sky blue - 1 health
    STRONG: { hits: 3, color: '#4169E1', points: 30 }, // Royal blue - 3 health
    VERY_STRONG: { hits: 5, color: '#32CD32', points: 50 }, // Lime green - 5 health
    MOVING: { hits: 1, color: '#87CEEB', points: 15, moving: true }, // Sky blue - 1 health
    MOVING_STRONG: { hits: 2, color: '#1E90FF', points: 25, moving: true }, // Dodger blue - 2 health
    UNBREAKABLE: { hits: -1, color: '#808080', points: 0 } // Grey unbreakable
};

// Color progression based on health (red = high health, blue = low health)
const COLOR_PROGRESSION = [
    '#87CEEB', // Sky blue - 1 health left
    '#1E90FF', // Dodger blue - 2 health left
    '#00CED1', // Dark turquoise - 4 health left
    '#4169E1', // Royal blue - 3 health left
    '#32CD32', // Lime green - 5 health left
    '#ADFF2F', // Green-yellow - 6 health left
    '#FFD700', // Gold/Yellow - 7 health left
    '#FFB347', // Orange - 8 health left
    '#FF8E53', // Red-orange - 9 health left
    '#FF6B6B'  // Red - 10 health left
];

// Game states
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete'
};

// Ball class
class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = BALL_RADIUS;
        this.dx = 6;
        this.dy = -8;
        this.speed = 10;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 4;
        this.dy = -4;
    }

    reverseX() {
        this.dx = -this.dx;
    }

    reverseY() {
        this.dy = -this.dy;
    }
}

// Paddle class
class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.speed = 10;
        this.dx = 0;
    }

    update() {
        this.x += this.dx;
        
        // Keep paddle within canvas bounds
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > CANVAS_WIDTH) {
            this.x = CANVAS_WIDTH - this.width;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add gradient effect
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#ee5a24');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    moveLeft() {
        this.dx = -this.speed;
    }

    moveRight() {
        this.dx = this.speed;
    }

    stop() {
        this.dx = 0;
    }
}

// Brick class
class Brick {
    constructor(x, y, type = 'NORMAL') {
        this.x = x;
        this.y = y;
        this.width = BRICK_WIDTH;
        this.height = BRICK_HEIGHT;
        this.type = type;
        this.hits = BRICK_TYPES[type].hits;
        this.maxHits = BRICK_TYPES[type].hits;
        this.initialColor = BRICK_TYPES[type].color;
        this.color = this.initialColor;
        this.targetColor = this.initialColor;
        this.points = BRICK_TYPES[type].points;
        this.moving = BRICK_TYPES[type].moving || false;
        this.dx = this.moving ? 2 : 0;
        this.destroyed = false;
        this.originalX = x; // Store original position for moving bricks
        this.colorTransitionTime = 0;
        this.colorTransitionDuration = 300; // 300ms transition
    }

    update(allBricks, deltaTime = 16) {
        // Handle color transition animation (only if brick is not destroyed)
        if (this.colorTransitionTime > 0 && !this.destroyed) {
            this.colorTransitionTime -= deltaTime;
            const progress = 1 - (this.colorTransitionTime / this.colorTransitionDuration);
            this.color = this.interpolateColor(this.color, this.targetColor, progress);
        }

        if (this.moving && !this.destroyed) {
            const oldX = this.x;
            this.x += this.dx;
            
            // Check for collision with other bricks
            let collision = false;
            for (let brick of allBricks) {
                if (brick !== this && !brick.destroyed && brick.type !== 'MOVING') {
                    if (this.x < brick.x + brick.width &&
                        this.x + this.width > brick.x &&
                        this.y < brick.y + brick.height &&
                        this.y + this.height > brick.y) {
                        collision = true;
                        break;
                    }
                }
            }
            
            // If collision detected, revert position and reverse direction
            if (collision) {
                this.x = oldX;
                this.dx = -this.dx;
            }
            
            // Reverse direction at edges
            if (this.x <= 0 || this.x + this.width >= CANVAS_WIDTH) {
                this.dx = -this.dx;
            }
        }
    }

    draw(ctx) {
        if (this.destroyed) return;

        // Draw brick with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.darkenColor(this.color, 20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // No hit numbers displayed - color progression shows damage level
    }

    hit() {
        if (this.destroyed) return 0;
        
        if (this.hits === -1) return 0; // Unbreakable brick
        
        this.hits--;
        
        // Update color based on remaining health with smooth transition
        if (this.maxHits > 1) {
            // Color index is based on remaining health (hits), not damage taken
            const colorIndex = Math.min(this.hits - 1, COLOR_PROGRESSION.length - 1);
            this.targetColor = COLOR_PROGRESSION[colorIndex];
            this.colorTransitionTime = this.colorTransitionDuration;
        }
        
        if (this.hits <= 0) {
            this.destroyed = true;
            return this.points;
        }
        return 0;
    }

    interpolateColor(color1, color2, progress) {
        // Check if colors are valid
        if (!color1 || !color2 || typeof color1 !== 'string' || typeof color2 !== 'string') {
            return color1 || color2 || '#87CEEB'; // Return first valid color or default
        }
        
        // Convert hex colors to RGB
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // Interpolate RGB values
        const r = Math.round(r1 + (r2 - r1) * progress);
        const g = Math.round(g1 + (g2 - g1) * progress);
        const b = Math.round(b1 + (b2 - b1) * progress);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

// Main Game class
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = GAME_STATES.MENU;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.balls = []; // Array to hold multiple balls
        this.maxBalls = 3; // Maximum balls per life
        this.currentBalls = 3; // Current number of balls
        this.paddle = new Paddle(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, CANVAS_HEIGHT - 30);
        this.bricks = [];
        this.keys = {};
        this.animationId = null;
        this.currentDirection = null; // Store current direction for all balls
        this.ballsToLaunch = []; // Queue of balls waiting to be launched
        this.launchTimer = 0; // Timer for delayed ball launches
        this.launchDirectionIndex = 3; // Index for launch directions (starts at middle)
        this.ballsLaunched = false; // Track if balls have been launched
        this.showHelpGuide = false; // Track if help guide is shown
        
        console.log('Game initialized with state:', this.state);
        this.setupEventListeners();
        this.generateBricks();
        this.initializeBalls();
        this.showOverlay('Brick Breaker', 'Press SPACE to start!');
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === ' ') {
                e.preventDefault();
                if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.GAME_OVER) {
                    this.startGame();
                } else if (this.state === GAME_STATES.PLAYING && !this.ballsLaunched) {
                    this.launchAllBalls();
                } else {
                    this.togglePause();
                }
            }
            
            // Use left/right arrows to switch launch direction before balls are launched
            if (e.key === 'ArrowLeft' && this.state === GAME_STATES.PLAYING && !this.ballsLaunched) {
                this.switchLaunchDirection('left');
            } else if (e.key === 'ArrowRight' && this.state === GAME_STATES.PLAYING && !this.ballsLaunched) {
                this.switchLaunchDirection('right');
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('helpBtn').addEventListener('click', () => this.toggleHelpGuide());
    }

    generateBricks() {
        this.bricks = [];
        
        // Number of bricks: 2x + 3 breakable blocks + 2 unbreakable blocks
        const breakableBricks = 2 * this.level + 3;
        const unbreakableBricks = 2;
        const numBricks = breakableBricks + unbreakableBricks;
        
        // Define possible brick types with weights based on level difficulty
        const maxDifficulty = Math.min(2 * this.level + 1, 10); // Cap at 10
        
        const brickTypes = [];
        
        // Always include basic types
        brickTypes.push({ type: 'NORMAL', weight: 3 });
        brickTypes.push({ type: 'MOVING', weight: 2 });
        
        // Add stronger types based on level
        if (maxDifficulty >= 2) {
            brickTypes.push({ type: 'STRONG', weight: 2 });
            brickTypes.push({ type: 'MOVING_STRONG', weight: 1 });
        }
        
        if (maxDifficulty >= 3) {
            brickTypes.push({ type: 'VERY_STRONG', weight: 1 });
        }
        
        if (maxDifficulty >= 4) {
            brickTypes.push({ type: 'UNBREAKABLE', weight: 1 });
        }
        
        // For higher levels, add more variety
        if (this.level >= 3) {
            brickTypes.push({ type: 'STRONG', weight: 1 }); // Extra strong blocks
        }
        
        if (this.level >= 5) {
            brickTypes.push({ type: 'VERY_STRONG', weight: 1 }); // Extra very strong blocks
        }
        
        // Create weighted array for random selection
        const weightedTypes = [];
        brickTypes.forEach(brickType => {
            for (let i = 0; i < brickType.weight; i++) {
                weightedTypes.push(brickType.type);
            }
        });
        
        // Generate random positions
        const positions = [];
        const minX = 50;
        const maxX = CANVAS_WIDTH - BRICK_WIDTH - 50;
        const minY = BRICK_OFFSET_TOP;
        const maxY = CANVAS_HEIGHT / 2; // Keep bricks in upper half
        
        for (let i = 0; i < numBricks; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            // Try to find a valid position (not overlapping with existing bricks)
            while (!validPosition && attempts < 50) {
                x = minX + Math.random() * (maxX - minX);
                y = minY + Math.random() * (maxY - minY);
                
                validPosition = true;
                
                // Check for overlap with existing bricks
                for (let pos of positions) {
                    const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
                    if (distance < BRICK_WIDTH + BRICK_PADDING) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            // If we couldn't find a valid position, use a fallback grid position
            if (!validPosition) {
                const col = i % BRICK_COLS;
                const row = Math.floor(i / BRICK_COLS);
                x = minX + col * (BRICK_WIDTH + BRICK_PADDING);
                y = minY + row * (BRICK_HEIGHT + BRICK_PADDING);
            }
            
            positions.push({ x, y });
            
            // Determine brick type: first 2 are unbreakable, rest are random breakable
            let randomType;
            if (i < unbreakableBricks) {
                randomType = 'UNBREAKABLE';
            } else {
                randomType = weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
            }
            
            this.bricks.push(new Brick(x, y, randomType));
        }
    }

    initializeBalls() {
        this.balls = [];
        for (let i = 0; i < this.maxBalls; i++) {
            this.balls.push(new Ball(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50));
        }
    }

    getRandomBallDirection() {
        const directions = [
            { dx: 6 * 0.6, dy: -8 * 0.6 },
            { dx: -6 * 0.6, dy: -8 * 0.6 },
            { dx: 8 * 0.6, dy: -6 * 0.6 },
            { dx: -8 * 0.6, dy: -6 * 0.6 },
            { dx: 0, dy: -10 * 0.6 }    
        ];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    switchLaunchDirection(direction) {
        if (direction === 'left' && this.launchDirectionIndex > 0) {
            this.launchDirectionIndex--;
        } else if (direction === 'right' && this.launchDirectionIndex < 6) {
            this.launchDirectionIndex++;
        }
    }

    getCurrentLaunchDirection() {
        const directions = [
            { dx: -8 * 0.6, dy: -6 * 0.6 },  // Far left
            { dx: -6 * 0.6, dy: -8 * 0.6 },  // Left
            { dx: -4 * 0.6, dy: -Math.sqrt(84) * 0.6 },  // Left
            { dx: 0, dy: -10 * 0.6 },        // Middle (straight up)
            { dx: 4 * 0.6 * 0.6, dy: -Math.sqrt(84) * 0.6 },  // Right
            { dx: 6 * 0.6, dy: -8 * 0.6 },  // Right
            { dx: 8 * 0.6, dy: -6 * 0.6 }   // Far right
        ];
        return directions[this.launchDirectionIndex];
    }

    launchAllBalls() {
        // Get the selected direction for all balls
        this.currentDirection = this.getCurrentLaunchDirection();
        
        // Position all balls at the same spot on the paddle
        const launchX = this.paddle.x + this.paddle.width / 2;
        const launchY = this.paddle.y - BALL_RADIUS - 5;
        
        this.balls.forEach((ball) => {
            ball.x = launchX;
            ball.y = launchY;
            ball.dx = 0; // Stop any existing movement
            ball.dy = 0;
        });
        
        // Queue all balls for launching with delays
        this.ballsToLaunch = [...this.balls];
        this.launchTimer = 0;
        this.ballsLaunched = true;
    }

    launchBall(ball) {
        if (this.currentDirection) {
            ball.dx = this.currentDirection.dx;
            ball.dy = this.currentDirection.dy;
        }
    }

    positionBallsOnPaddle() {
        // Position all balls at the same spot on the paddle
        const launchX = this.paddle.x + this.paddle.width / 2;
        const launchY = this.paddle.y - BALL_RADIUS - 5;
        
        this.balls.forEach((ball) => {
            ball.x = launchX;
            ball.y = launchY;
            ball.dx = 0; // Stop any existing movement
            ball.dy = 0;
        });
    }

    startGame() {
        console.log('startGame called, current state:', this.state);
        if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.GAME_OVER) {
            this.state = GAME_STATES.PLAYING;
            console.log('Game started, new state:', this.state);
            this.hideOverlay();
            // Position balls on paddle, don't launch yet
            this.positionBallsOnPaddle();
            this.ballsLaunched = false;
            this.launchDirectionIndex = 3; // Reset to middle direction
            this.gameLoop();
        }
    }

    togglePause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.showOverlay('Game Paused', 'Press SPACE to resume');
        } else if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.hideOverlay();
            this.gameLoop();
        }
    }

    resetGame() {
        this.state = GAME_STATES.MENU;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.currentBalls = 3;
        this.launchDirectionIndex = 3;
        this.ballsLaunched = false;
        this.initializeBalls();
        this.paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
        this.generateBricks();
        this.updateUI();
        this.showOverlay('Brick Breaker', 'Press SPACE to start!');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    update() {
        if (this.state !== GAME_STATES.PLAYING) return;

        // Handle timed ball launching
        if (this.ballsToLaunch.length > 0) {
            this.launchTimer += 16; // 16ms per frame (60fps)
            if (this.launchTimer >= 500) { // Launch every 500ms
                const ballToLaunch = this.ballsToLaunch.shift();
                if (ballToLaunch) {
                    this.launchBall(ballToLaunch);
                }
                this.launchTimer = 0;
            }
        }

        // Handle paddle movement (only after balls are launched)
        if (this.ballsLaunched) {
            if (this.keys['arrowleft'] || this.keys['a']) {
                this.paddle.moveLeft();
            } else if (this.keys['arrowright'] || this.keys['d']) {
                this.paddle.moveRight();
            } else {
                this.paddle.stop();
            }
        }

        // Update game objects
        this.paddle.update();
        
        // Update balls only if they've been launched, otherwise keep them on paddle
        if (this.ballsLaunched) {
            this.balls.forEach(ball => ball.update());
        } else {
            // Keep balls positioned on paddle
            this.positionBallsOnPaddle();
        }
        
        this.bricks.forEach(brick => brick.update(this.bricks, 16)); // 16ms deltaTime for 60fps

        // Ball collision with walls (only if balls are launched)
        if (this.ballsLaunched) {
            this.balls.forEach(ball => {
                if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS_WIDTH) {
                    ball.reverseX();
                }
                if (ball.y - ball.radius <= 0) {
                    ball.reverseY();
                }
            });
        }

        // Ball collision with paddle (only if balls are launched)
        if (this.ballsLaunched) {
            this.balls.forEach(ball => {
                if (ball.y + ball.radius >= this.paddle.y &&
                    ball.x >= this.paddle.x &&
                    ball.x <= this.paddle.x + this.paddle.width &&
                    ball.dy > 0) {
                    ball.reverseY();
                    
                    // Add some spin based on where ball hits paddle
                    const hitPos = (ball.x - this.paddle.x) / this.paddle.width;
                    ball.dx = (hitPos - 0.5) * 8;
                }
            });
        }

        // Ball collision with bricks (only if balls are launched)
        if (this.ballsLaunched) {
            this.balls.forEach(ball => {
                this.bricks.forEach(brick => {
                    if (!brick.destroyed &&
                        ball.x + ball.radius >= brick.x &&
                        ball.x - ball.radius <= brick.x + brick.width &&
                        ball.y + ball.radius >= brick.y &&
                        ball.y - ball.radius <= brick.y + brick.height) {
                        
                        const points = brick.hit();
                        this.score += points;
                        
                        // Calculate collision side more accurately
                        const ballLeft = ball.x - ball.radius;
                        const ballRight = ball.x + ball.radius;
                        const ballTop = ball.y - ball.radius;
                        const ballBottom = ball.y + ball.radius;
                        
                        const brickLeft = brick.x;
                        const brickRight = brick.x + brick.width;
                        const brickTop = brick.y;
                        const brickBottom = brick.y + brick.height;
                        
                        // Calculate overlap distances
                        const overlapLeft = ballRight - brickLeft;
                        const overlapRight = brickRight - ballLeft;
                        const overlapTop = ballBottom - brickTop;
                        const overlapBottom = brickBottom - ballTop;
                        
                        // Find the smallest overlap to determine collision side
                        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                        
                        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                            // Horizontal collision (left or right side)
                            ball.reverseX();
                        } else {
                            // Vertical collision (top or bottom side)
                            ball.reverseY();
                        }
                    }
                });
            });
        }

        // Check if balls fell below paddle
        this.balls = this.balls.filter(ball => {
            if (ball.y > CANVAS_HEIGHT) {
                this.currentBalls--;
                return false; // Remove this ball
            }
            return true; // Keep this ball
        });

        // If no balls left, lose a life and get new balls
        if (this.balls.length === 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = GAME_STATES.GAME_OVER;
                this.showOverlay('Game Over!', `Final Score: ${this.score}\n Press restart to start again!`);
            } else {
                // Reset balls and paddle position
                this.currentBalls = this.maxBalls;
                this.initializeBalls();
                this.paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
                // Position balls on paddle, don't launch yet
                this.positionBallsOnPaddle();
                this.ballsLaunched = false;
                this.launchDirectionIndex = 3; // Reset to middle direction
            }
        }

        // Check level completion
        const remainingBricks = this.bricks.filter(brick => !brick.destroyed && brick.type !== 'UNBREAKABLE');
        if (remainingBricks.length === 0) {
            this.level++;
            this.lives = 3; // Reset to 3 lives instead of adding 3
            this.currentBalls = this.maxBalls; // Reset balls
            this.generateBricks();
            this.initializeBalls();
            this.paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
            this.state = GAME_STATES.LEVEL_COMPLETE;
            this.showOverlay(`Level ${this.level - 1} Complete!`, `Score: ${this.score} - Lives Reset to 3!`);
            setTimeout(() => {
                this.state = GAME_STATES.PLAYING;
                this.hideOverlay();
                // Position balls on paddle, don't launch yet
                this.positionBallsOnPaddle();
                this.ballsLaunched = false;
                this.launchDirectionIndex = 3; // Reset to middle direction
                this.gameLoop();
            }, 2000);
        }

        this.updateUI();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw game objects
        this.paddle.draw(this.ctx);
        this.balls.forEach(ball => ball.draw(this.ctx));
        this.bricks.forEach(brick => brick.draw(this.ctx));

        // Draw launch direction arrow if balls not launched
        if (!this.ballsLaunched) {
            this.drawLaunchArrow();
        }
        
        // Draw particles for destroyed bricks (simple effect)
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arcade, Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, CANVAS_WIDTH / 2, 30);
    }

    drawLaunchArrow() {
        const direction = this.getCurrentLaunchDirection();
        const centerX = this.paddle.x + this.paddle.width / 2;
        const centerY = this.paddle.y - 20;
        
        // Draw arrow based on direction
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.fillStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        
        // Calculate arrow points (smaller arrow)
        const arrowLength = 20;
        const endX = centerX + direction.dx * arrowLength;
        const endY = centerY + direction.dy * arrowLength;
        
        // Draw arrow line
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Draw arrowhead (smaller)
        const headLength = 6;
        const angle = Math.atan2(direction.dy, direction.dx);
        
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        
        // Draw instruction text
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px Arcade, Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Left/Right to change direction', centerX, centerY - 40);
        this.ctx.fillText('Press SPACE to launch', centerX, centerY - 28);
    }

    gameLoop() {
        this.update();
        this.draw();
        
        if (this.state === GAME_STATES.PLAYING) {
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        // Update lives with heart emojis
        const livesElement = document.getElementById('lives');
        let heartsDisplay = '';
        for (let i = 0; i < 3; i++) {
            if (i < this.lives) {
                heartsDisplay += '❤️'; // Red heart for remaining lives
            } else {
                heartsDisplay += '🖤'; // Black heart for lost lives
            }
        }
        livesElement.textContent = heartsDisplay;
        
        // Update balls count
        document.getElementById('balls').textContent = this.currentBalls;
    }

    showOverlay(title, message) {
        const overlay = document.getElementById('gameOverlay');
        const titleEl = document.getElementById('overlayTitle');
        const messageEl = document.getElementById('overlayMessage');
        
        titleEl.textContent = title;
        // Split message by \n and create line breaks
        messageEl.innerHTML = message.split('\n').join('<br>');
        overlay.classList.remove('hidden');
    }

    hideOverlay() {
        const overlay = document.getElementById('gameOverlay');
        overlay.classList.add('hidden');
    }

    toggleHelpGuide() {
        this.showHelpGuide = !this.showHelpGuide;
        const helpGuide = document.getElementById('helpGuide');
        if (this.showHelpGuide) {
            helpGuide.classList.remove('hidden');
        } else {
            helpGuide.classList.add('hidden');
        }
    }
}

// React component for the game
const BrickBreakerGame = () => {
    const canvasRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && !gameRef.current) {
            gameRef.current = new Game(canvasRef.current);
        }
    }, []);

    return (
        <div className="game-container">
            <div className="game-header">
                <h1>Brick Breaker</h1>
                        <div className="game-info">
                            <div className="score">Score: <span id="score">0</span></div>
                            <div className="level">Level: <span id="level">1</span></div>
                            <div className="lives">Lives: <span id="lives">❤️❤️❤️</span></div>
                            <div className="balls">Balls: <span id="balls">3</span></div>
                        </div>
            </div>
            
            <div className="game-area">
                <canvas ref={canvasRef} id="gameCanvas" width={CANVAS_WIDTH} height={CANVAS_HEIGHT}></canvas>
                <div className="game-overlay" id="gameOverlay">
                    <div className="overlay-content">
                        <h2 id="overlayTitle">Brick Breaker</h2>
                        <p id="overlayMessage">Press SPACE to start!</p>
                        <div className="controls">
                            <p>Controls:</p>
                            <p>Left/Right to change launch direction</p>
                            <p>Left/Right or A/D to move paddle in game</p>
                            <p>SPACE to start/launch/pause</p>
                        </div>
                    </div>
                </div>
                
                <div className="help-guide hidden" id="helpGuide">
                    <div className="help-content">
                        <h3>Brick Guide</h3>
                        <div className="brick-guide">
                            <div className="brick-item">
                                <div className="brick-color" style={{backgroundColor: '#87CEEB'}}></div>
                                <span>Normal<br></br>1 hit, 10 pts</span>
                            </div>
                            <div className="brick-item">
                                <div className="brick-color" style={{backgroundColor: '#4169E1'}}></div>
                                <span>Strong<br></br>3 hits, 30 pts</span>
                            </div>
                            <div className="brick-item">
                                <div className="brick-color" style={{backgroundColor: '#32CD32'}}></div>
                                <span>Very Strong<br></br>5 hits, 50 pts</span>
                            </div>
                            <div className="brick-item">
                                <div className="brick-color" style={{backgroundColor: '#87CEEB'}}></div>
                                <span>Moving<br></br>1 hit, moves, 15 pts</span>
                            </div>
                            <div className="brick-item">
                                <div className="brick-color" style={{backgroundColor: '#1E90FF'}}></div>
                                <span>Moving Strong<br></br>2 hits, moves, 25 pts</span>
                            </div>
                            <div className="brick-item">
                                <div className="brick-color" style={{backgroundColor: '#808080'}}></div>
                                <span>Unbreakable<br></br>Cannot be destroyed</span>
                            </div>
                        </div>
                        <p className="color-note">Colors change from red → orange → yellow → green → blue as bricks take damage</p>
                        <button className="close-help-x" onClick={() => {
                            const helpGuide = document.getElementById('helpGuide');
                            helpGuide.classList.add('hidden');
                        }}>×</button>
                    </div>
                </div>
            </div>
            
            <div className="game-footer">
                <button id="startBtn">Start Game</button>
                <button id="pauseBtn">Pause</button>
                <button id="resetBtn">Restart</button>
                <button className="help-button" id="helpBtn">?</button>
            </div>
        </div>
    );
};

// Render the game
ReactDOM.render(<BrickBreakerGame />, document.getElementById('root'));
