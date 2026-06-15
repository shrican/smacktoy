// ===========================
// GILLI DANDA - Game Logic
// ===========================

class GilliDandaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameMode = 'classic'; // classic, arcade, campaign
        this.difficulty = 'normal'; // easy, normal, hard, expert
        
        // Game variables
        this.score = 0;
        this.totalDistance = 0;
        this.strikes = 0;
        this.gameStartTime = 0;
        this.gameTime = 0;
        this.arcadeTimeLeft = 60;
        
        // Physics objects
        this.bat = null;
        this.gilli = null;
        this.defenders = [];
        this.particles = [];
        
        // Input handling
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.currentPower = 0;
        this.currentAngle = 45;
        this.maxPower = 100;
        
        // Audio
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.volume = 0.7;
        
        // Setup
        this.setupCanvas();
        this.setupEventListeners();
        this.setupAudio();
        this.initializeGame();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
    
    setupAudio() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.3 * this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio context error:', e);
        }
    }
    
    initializeGame() {
        this.bat = new Bat(this.canvas.width / 2, this.canvas.height - 100);
        this.gilli = new Gilli(this.canvas.width / 2 - 30, this.canvas.height - 120);
        this.setupDefenders();
        this.startGameLoop();
    }
    
    setupDefenders() {
        this.defenders = [];
        const defenderCount = this.difficulty === 'easy' ? 2 : this.difficulty === 'hard' ? 4 : 3;
        
        for (let i = 0; i < defenderCount; i++) {
            const angle = (Math.PI * 2 / defenderCount) * i;
            const distance = 300;
            const x = this.canvas.width / 2 + Math.cos(angle) * distance;
            const y = this.canvas.height / 2 + Math.sin(angle) * distance;
            this.defenders.push(new Defender(x, y, this.difficulty));
        }
    }
    
    onMouseDown(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dx = x - this.bat.x;
        const dy = y - this.bat.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            this.isDragging = true;
            this.dragStartX = x;
            this.dragStartY = y;
            this.playSound(400, 0.1);
        }
    }
    
    onMouseMove(e) {
        if (!this.isDragging || this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dx = x - this.bat.x;
        const dy = y - this.bat.y;
        
        // Calculate angle (0-90 degrees)
        this.currentAngle = Math.max(0, Math.min(90, Math.atan2(dy, dx) * (180 / Math.PI)));
        
        // Calculate power based on distance
        const dragDistance = Math.sqrt(dx * dx + dy * dy);
        this.currentPower = Math.max(0, Math.min(100, (dragDistance / 150) * 100));
        
        updateUI.updatePowerMeter(this.currentPower);
        updateUI.updateAngleIndicator(this.currentAngle);
    }
    
    onMouseUp(e) {
        if (!this.isDragging || this.gameState !== 'playing') return;
        
        this.strikeGilli();
        this.isDragging = false;
        this.currentPower = 0;
        this.currentAngle = 45;
    }
    
    onTouchStart(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const dx = x - this.bat.x;
        const dy = y - this.bat.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            this.isDragging = true;
            this.dragStartX = x;
            this.dragStartY = y;
            this.playSound(400, 0.1);
        }
    }
    
    onTouchMove(e) {
        if (!this.isDragging || this.gameState !== 'playing') return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const dx = x - this.bat.x;
        const dy = y - this.bat.y;
        
        this.currentAngle = Math.max(0, Math.min(90, Math.atan2(dy, dx) * (180 / Math.PI)));
        
        const dragDistance = Math.sqrt(dx * dx + dy * dy);
        this.currentPower = Math.max(0, Math.min(100, (dragDistance / 150) * 100));
        
        updateUI.updatePowerMeter(this.currentPower);
        updateUI.updateAngleIndicator(this.currentAngle);
    }
    
    onTouchEnd(e) {
        if (!this.isDragging || this.gameState !== 'playing') return;
        
        this.strikeGilli();
        this.isDragging = false;
        this.currentPower = 0;
        this.currentAngle = 45;
    }
    
    onKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.gameState === 'playing') {
                pauseGame();
            }
        }
    }
    
    strikeGilli() {
        if (this.gilli.isFlying) return;
        
        // Calculate velocity based on power and angle
        const angleRad = (this.currentAngle * Math.PI / 180);
        const powerMultiplier = 1 + (this.currentPower / 100) * 4; // 1-5x multiplier
        
        const velocityX = Math.cos(angleRad) * 15 * powerMultiplier;
        const velocityY = Math.sin(angleRad) * 15 * powerMultiplier;
        
        this.gilli.launch(velocityX, velocityY);
        this.strikes++;
        
        // Play impact sound
        this.playSound(200 + this.currentPower * 5, 0.2, 'sine');
        this.playSound(300 + this.currentPower * 3, 0.15, 'square');
        
        updateUI.addMessage('Strike!', 'success');
        
        // Create impact particles
        this.createImpactParticles(this.bat.x, this.bat.y);
    }
    
    createImpactParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 4 + Math.random() * 4;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#fdb833'
            ));
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        this.gameTime = (Date.now() - this.gameStartTime) / 1000;
        
        // Update gilli
        if (this.gilli.isFlying) {
            this.gilli.update(deltaTime);
            this.totalDistance = this.gilli.getTotalDistance();
            updateUI.updateDistanceDisplay(this.totalDistance);
            
            // Check if gilli stopped
            if (!this.gilli.isFlying) {
                this.updateScore();
                this.resetStrike();
            }
        }
        
        // Update defenders
        for (let defender of this.defenders) {
            defender.update(deltaTime, this.gilli);
            
            // Check collision with gilli
            if (this.gilli.isFlying && defender.checkCollision(this.gilli)) {
                this.gilli.stop();
                this.playSound(100, 0.3);
                updateUI.addMessage('Caught! Game Over!', 'error');
                this.endGame();
            }
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.update(deltaTime);
            return p.life > 0;
        });
        
        // Update arcade mode timer
        if (this.gameMode === 'arcade') {
            this.arcadeTimeLeft = Math.max(0, 60 - this.gameTime);
            updateUI.updateTimer(Math.ceil(this.arcadeTimeLeft));
            
            if (this.arcadeTimeLeft <= 0) {
                this.endGame();
            }
        }
    }
    
    updateScore() {
        let distanceScore = Math.floor(this.totalDistance * 10);
        let multiplier = 1;
        
        if (this.difficulty === 'easy') multiplier = 0.8;
        else if (this.difficulty === 'hard') multiplier = 1.3;
        else if (this.difficulty === 'expert') multiplier = 1.5;
        
        this.score += Math.floor(distanceScore * multiplier);
    }
    
    resetStrike() {
        this.gilli = new Gilli(this.bat.x - 30, this.bat.y - 20);
        this.totalDistance = 0;
    }
    
    endGame() {
        this.gameState = 'gameOver';
        this.playSound(200, 0.5);
        updateUI.showGameOver(this.totalDistance, this.score, this.difficulty);
    }
    
    startGameLoop() {
        let lastTime = Date.now();
        
        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000;
            lastTime = now;
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    render() {
        // Clear canvas with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f6ff');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8b7355';
        this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
        
        // Draw grid pattern on ground
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.canvas.height - 50);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw game objects
        if (this.gameState === 'playing') {
            this.bat.render(this.ctx, this.currentAngle);
            this.gilli.render(this.ctx);
            
            for (let defender of this.defenders) {
                defender.render(this.ctx);
            }
            
            for (let particle of this.particles) {
                particle.render(this.ctx);
            }
            
            // Draw trajectory prediction line when dragging
            if (this.isDragging && !this.gilli.isFlying) {
                this.drawTrajectoryLine();
            }
        }
    }
    
    drawTrajectoryLine() {
        const angleRad = (this.currentAngle * Math.PI / 180);
        const powerMultiplier = 1 + (this.currentPower / 100) * 4;
        
        const velocityX = Math.cos(angleRad) * 15 * powerMultiplier;
        const velocityY = Math.sin(angleRad) * 15 * powerMultiplier;
        
        this.ctx.strokeStyle = 'rgba(253, 184, 51, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.gilli.x, this.gilli.y);
        
        let x = this.gilli.x;
        let y = this.gilli.y;
        let vx = velocityX;
        let vy = velocityY;
        
        for (let i = 0; i < 100; i++) {
            x += vx;
            y += vy;
            vy += 0.5; // gravity
            
            if (y > this.canvas.height - 50) {
                this.ctx.lineTo(x, this.canvas.height - 50);
                break;
            }
            
            if (i % 5 === 0) {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
}

// ===========================
// Game Objects
// ===========================

class Bat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 12;
        this.color = '#8b4513';
    }
    
    render(ctx, angle) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((angle * Math.PI / 180));
        
        // Bat wood
        ctx.fillStyle = this.color;
        ctx.fillRect(0, -this.height / 2, this.width, this.height);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, -this.height / 2 + 2, this.width, 3);
        
        ctx.restore();
    }
}

class Gilli {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.vx = 0;
        this.vy = 0;
        this.isFlying = false;
        this.friction = 0.98;
        this.gravity = 0.5;
        this.color = '#d4a574';
        this.distanceTraveled = 0;
        this.startX = x;
    }
    
    launch(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.isFlying = true;
        this.startX = this.x;
    }
    
    update(deltaTime) {
        if (!this.isFlying) return;
        
        // Apply gravity
        this.vy += this.gravity;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Ground collision
        if (this.y >= window.innerHeight - 50 - this.radius) {
            this.y = window.innerHeight - 50 - this.radius;
            this.vy *= -0.7; // Bounce
            this.vx *= 0.95;
            
            if (Math.abs(this.vy) < 2 && Math.abs(this.vx) < 2) {
                this.stop();
            }
        }
        
        // Wall collision
        if (this.x - this.radius < 0 || this.x + this.radius > window.innerWidth) {
            this.vx *= -0.8;
            this.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.x));
        }
    }
    
    stop() {
        this.isFlying = false;
        this.vx = 0;
        this.vy = 0;
    }
    
    getTotalDistance() {
        return Math.abs(this.x - this.startX) / 10;
    }
    
    render(ctx) {
        // Main gilli
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, this.radius / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, window.innerHeight - 50, this.radius * 2, this.radius / 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Defender {
    constructor(x, y, difficulty) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.radius = 15;
        this.color = '#ff6b35';
        this.difficulty = difficulty;
        this.speed = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 3 : 2;
        this.targetX = x;
        this.targetY = y;
        this.moveTimer = 0;
        this.moveInterval = 60;
    }
    
    update(deltaTime, gilli) {
        this.moveTimer++;
        
        // AI behavior based on difficulty
        if (this.difficulty === 'easy') {
            this.easyBehavior(gilli);
        } else if (this.difficulty === 'hard') {
            this.hardBehavior(gilli);
        } else {
            this.normalBehavior(gilli);
        }
        
        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.speed) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }
    
    easyBehavior(gilli) {
        if (this.moveTimer > this.moveInterval) {
            this.targetX = this.baseX + (Math.random() - 0.5) * 100;
            this.targetY = this.baseY + (Math.random() - 0.5) * 100;
            this.moveTimer = 0;
        }
    }
    
    normalBehavior(gilli) {
        if (gilli.isFlying) {
            // Move towards gilli
            this.targetX = gilli.x;
            this.targetY = gilli.y;
        } else {
            // Patrol
            if (this.moveTimer > this.moveInterval) {
                this.targetX = this.baseX + (Math.random() - 0.5) * 150;
                this.targetY = this.baseY + (Math.random() - 0.5) * 150;
                this.moveTimer = 0;
            }
        }
    }
    
    hardBehavior(gilli) {
        if (gilli.isFlying) {
            // Predict gilli path
            const predictedX = gilli.x + (gilli.vx * 20);
            const predictedY = gilli.y + (gilli.vy * 20);
            this.targetX = predictedX;
            this.targetY = predictedY;
        } else {
            this.normalBehavior(gilli);
        }
    }
    
    checkCollision(gilli) {
        const dx = gilli.x - this.x;
        const dy = gilli.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + gilli.radius);
    }
    
    render(ctx) {
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 1;
        this.gravity = 0.3;
    }
    
    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= 0.02;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ===========================
// Initialize Game
// ===========================

let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new GilliDandaGame();
    
    // Simulate loading complete
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('mainMenu').classList.remove('hidden');
    }, 2000);
});
