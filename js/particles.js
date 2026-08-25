// Particle System
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
        this.alpha = 1;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.age += deltaTime;
        this.alpha = 1 - (this.age / this.lifetime);
        return this.age < this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 3 + Math.random() * 4;
            const lifetime = 300 + Math.random() * 200;

            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    createMuzzleFlash(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            const speed = 3 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 2 + Math.random() * 2;
            const lifetime = 100 + Math.random() * 100;

            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    createGateSparkle(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2; // Upward bias
            const size = 2 + Math.random() * 3;
            const lifetime = 400 + Math.random() * 300;

            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    createBossHitEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = 4 + Math.random() * 4;
            const lifetime = 200 + Math.random() * 150;
            const colors = ['#ff0000', '#ff6600', '#ffff00'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
        }
    }

    update(deltaTime) {
        this.particles = this.particles.filter(particle => particle.update(deltaTime));
    }

    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    clear() {
        this.particles = [];
    }
}
