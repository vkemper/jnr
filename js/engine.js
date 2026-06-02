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
        this.gameId = options.gameId || 'default';
        this.highScore = parseInt(localStorage.getItem(`jnr_highScore_${this.gameId}`)) || 0;
        this.particles = [];

        // Audio state
        this.musicEnabled = localStorage.getItem('jnr_musicEnabled') !== 'false';
        this.sfxEnabled = localStorage.getItem('jnr_sfxEnabled') !== 'false';

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Escape') window.location.href = '../index.html';
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Resume audio on first interaction
        const resumeAudio = () => {
            this.initAudio();
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            window.removeEventListener('mousedown', resumeAudio);
            window.removeEventListener('keydown', resumeAudio);
        };
        window.addEventListener('mousedown', resumeAudio);
        window.addEventListener('keydown', resumeAudio);

        // Sound System
        this.audioCtx = null;
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(freq, duration, type = 'sine', volume = 0.1) {
        if (!this.audioCtx || !this.sfxEnabled) return;
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

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(`jnr_highScore_${this.gameId}`, this.highScore);
            return true;
        }
        return false;
    }

    startMusic(melody) {
        const playNext = (index) => {
            if (!this.isRunning || this.state !== 'playing' || !this.audioCtx) return;
            const note = melody[index];
            if (this.musicEnabled) {
                this.playSound(note.f, note.d, 'triangle', 0.05);
            }
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

        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.state === 'playing') {
            this.update(deltaTime);
        }
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(this, deltaTime);
            if (entity.markedForDeletion) {
                this.entities.splice(i, 1);
            }
        }
        this.updateParticles(deltaTime);
    }

    // Particle System
    addParticle(x, y, color, options = {}) {
        this.particles.push({
            x, y,
            vx: options.vx || (Math.random() - 0.5) * 4,
            vy: options.vy || (Math.random() - 0.5) * 4,
            life: options.life || 1.0,
            decay: options.decay || 0.02,
            size: options.size || 2 + Math.random() * 3,
            color: color || '#fff'
        });
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;
    }

    // Drawing Helpers
    drawGlow(x, y, radius, color) {
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    draw() {
        this.entities.forEach(entity => {
            entity.draw(this.ctx);
        });
        this.drawParticles();

        if (this.state !== 'playing') {
            this.checkHighScore();
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '40px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.state === 'won' ? 'YOU WIN!' : 'GAME OVER', this.width / 2, this.height / 2 - 20);

            this.ctx.font = '20px Courier New';
            this.ctx.fillStyle = '#ff0';
            this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 30);
            this.ctx.fillStyle = '#0f0';
            this.ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.width / 2, this.height / 2 + 60);

            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('PRESS R TO RESTART', this.width / 2, this.height / 2 + 100);

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
