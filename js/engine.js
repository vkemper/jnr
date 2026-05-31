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
        this.hasFloor = options.hasFloor !== undefined ? options.hasFloor : true;
        this.isRunning = false;
        this.state = 'playing'; // 'playing', 'won', 'lost'
        this.score = 0;

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') window.location.href = '../index.html';
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Sound System
        this.audioCtx = null;
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(freq, duration, type = 'sine', volume = 0.1) {
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

    playDeathSound() {
        this.playSound(150, 0.3, 'sawtooth');
        this.playSound(100, 0.3, 'sawtooth');
    }

    startMusic(melody) {
        const playNext = (index) => {
            if (!this.isRunning || this.state !== 'playing' || !this.audioCtx) return;
            const note = melody[index];
            this.playSound(note.f, note.d, 'triangle', 0.05);
            setTimeout(() => playNext((index + 1) % melody.length), note.d * 1000);
        };
        this.initAudio();
        playNext(0);
    }

    start() {
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;
        const deltaTime = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;

        if (this.state === 'playing') {
            this.update(deltaTime);
        }
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        this.entities.forEach(entity => {
            entity.update(this, deltaTime);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.entities.forEach(entity => {
            entity.draw(this.ctx);
        });

        if (this.state !== 'playing') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.state === 'won' ? 'YOU WIN!' : 'GAME OVER', this.width / 2, this.height / 2);
            this.ctx.font = '20px Courier New';
            this.ctx.fillText('PRESS R TO RESTART', this.width / 2, this.height / 2 + 40);

            if (this.keys['KeyR']) location.reload();
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
        this.markedForDeletion = false;
    }

    update(game) {
        this.vy += game.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= game.friction;

        if (game.hasFloor && this.y + this.height > game.height) {
            this.y = game.height - this.height;
            this.vy = 0;
            this.onGround = true;
        }
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
