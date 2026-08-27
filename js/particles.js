// Particle System
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime, sprite = null, rotation = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.age = 0;
        this.alpha = 1;
        this.sprite = sprite;
        this.rotation = rotation;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.age += deltaTime;
        this.alpha = 1 - (this.age / this.lifetime);
        this.rotation += this.rotationSpeed;
        return this.age < this.lifetime;
    }

    draw(ctx, spriteManager) {
        ctx.save();
        ctx.globalAlpha = this.alpha;

        // Try to draw sprite if available
        if (this.sprite && spriteManager && spriteManager.loaded) {
            const sprite = spriteManager.getSprite(this.sprite);
            if (sprite) {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.drawImage(sprite, -this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
                return;
            }
        }

        // Fallback to colored rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color, count = 15, useBloodSprite = false) {
        // Blood splatter for zombie deaths
        if (useBloodSprite) {
            const bloodSprites = ['blood_1', 'blood_2', 'blood_3', 'blood_4', 'blood_5', 'blood_6'];
            const bloodColors = ['#8B0000', '#660000', '#4A0000', '#A00000']; // Various blood reds

            // Create more blood splatters with variety
            for (let i = 0; i < 15; i++) {
                const angle = (Math.PI * 2 * i) / 15 + (Math.random() - 0.5) * 0.5;
                const speed = 1 + Math.random() * 3;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - 1; // Slight upward bias
                const size = 6 + Math.random() * 12; // Bigger splatters
                const lifetime = 500 + Math.random() * 400; // Longer lasting
                const sprite = bloodSprites[Math.floor(Math.random() * bloodSprites.length)];
                const bloodColor = bloodColors[Math.floor(Math.random() * bloodColors.length)];
                const rotation = Math.random() * Math.PI * 2;

                this.particles.push(new Particle(x, y, vx, vy, bloodColor, size, lifetime, sprite, rotation));
            }
        } else {
            // Regular particle explosion
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
    }

    createMuzzleFlash(x, y, color) {
        // Sprite-based muzzle flash
        const flashSprites = ['muzzle_flash_1', 'muzzle_flash_2'];
        const sprite = flashSprites[Math.floor(Math.random() * flashSprites.length)];
        const size = 16 + Math.random() * 8;
        const lifetime = 80 + Math.random() * 40;
        const rotation = Math.random() * Math.PI * 2;

        this.particles.push(new Particle(x, y - 10, 0, -1, color, size, lifetime, sprite, rotation));

        // Add some small particle sparks too
        for (let i = 0; i < 3; i++) {
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

    draw(ctx, spriteManager) {
        this.particles.forEach(particle => particle.draw(ctx, spriteManager));
    }

    clear() {
        this.particles = [];
    }
}
