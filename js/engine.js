class Game {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = {};
        this.entities = [];
        this.lastTime = 0;
        this.gravity = options.gravity !== undefined ? options.gravity : 0.5;
        this.friction = options.friction !== undefined ? options.friction : 0.8;
        this.isRunning = false;
        this.state = 'playing'; // 'playing', 'won', 'lost'
        this.level = 1;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') window.location.href = '../index.html';
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Sound System
        this.audioCtx = null;
        this.musicOsc = null;
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playNote(freq, type, duration, volume = 0.1) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playShootSound() {
        this.playNote(440, 'square', 0.1, 0.05);
        this.playNote(220, 'sawtooth', 0.1, 0.05);
    }

    playJumpSound() {
        this.playNote(330, 'square', 0.15);
        this.playNote(440, 'square', 0.15);
    }

    playCoinSound() {
        this.playNote(880, 'sine', 0.1);
        this.playNote(1760, 'sine', 0.2);
    }

    playDeathSound() {
        this.playNote(110, 'sawtooth', 0.5, 0.2);
    }

    playWinSound() {
        this.playNote(523.25, 'square', 0.1);
        this.playNote(659.25, 'square', 0.1);
        this.playNote(783.99, 'square', 0.3);
    }

    startMusic(melody) {
        if (!this.audioCtx) return;
        let time = this.audioCtx.currentTime;
        melody.forEach(note => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, time);
            gain.gain.setValueAtTime(0.02, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + note.d);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(time);
            osc.stop(time + note.d);
            time += note.d;
        });
        // Loop music
        const totalDuration = melody.reduce((acc, note) => acc + note.d, 0);
        setTimeout(() => {
            if (this.isRunning && this.state === 'playing') this.startMusic(melody);
        }, totalDuration * 1000);
    }

    start() {
        this.isRunning = true;
        document.body.addEventListener('keydown', () => this.initAudio(), { once: true });
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this.update(deltaTime);
        }
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.update) entity.update(this, deltaTime);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(entity => {
            if (entity.draw) entity.draw(this.ctx);
        });

        if (this.state === 'won') {
            this.drawOverlay('YOU WIN!', '#00e436');
        } else if (this.state === 'lost') {
            this.drawOverlay('GAME OVER', '#ff004d');
        }
    }

    drawOverlay(text, color) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = color;
        this.ctx.font = '48px "Courier New"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.width / 2, this.height / 2);
        this.ctx.font = '24px "Courier New"';
        this.ctx.fillText('PRESS R TO RESTART', this.width / 2, this.height / 2 + 60);

        if (this.keys['KeyR']) {
            location.reload();
        }
    }
}

class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
    }

    update(game) {
        this.vy += game.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= game.friction;

        // Basic ground collision (if no platforms)
        if (this.y + this.height > game.height) {
            this.y = game.height - this.height;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > game.width) this.x = game.width - this.width;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Player extends Entity {
    constructor(x, y, color) {
        super(x, y, 32, 32, color);
        this.speed = 5;
        this.jumpForce = -12;
    }

    update(game) {
        if (game.keys['ArrowLeft'] || game.keys['KeyA']) {
            this.vx = -this.speed;
        }
        if (game.keys['ArrowRight'] || game.keys['KeyD']) {
            this.vx = this.speed;
        }
        if ((game.keys['ArrowUp'] || game.keys['Space'] || game.keys['KeyW']) && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            game.playJumpSound();
        }

        super.update(game);
    }
}

class Platform extends Entity {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
    }
    update() {}
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
