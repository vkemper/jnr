class Game {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = {};
        this.entities = [];
        this.lastTime = 0;
        this.gravity = options.gravity || 0.5;
        this.friction = options.friction || 0.8;
        this.isRunning = false;

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    start() {
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
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

        // Basic ground collision
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
        this.jumpForce = -10;
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
        }

        super.update(game);
    }
}

class Platform extends Entity {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
    }

    update() {
        // Platforms usually don't move or have gravity
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}
