// Visual Effects System

class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    shake(intensity, duration) {
        this.intensity = Math.max(this.intensity, intensity);
        this.duration = Math.max(this.duration, duration);
    }

    update(deltaTime) {
        if (this.duration > 0) {
            this.duration -= deltaTime;
            const currentIntensity = this.intensity * (this.duration / 500);
            this.offsetX = (Math.random() - 0.5) * currentIntensity;
            this.offsetY = (Math.random() - 0.5) * currentIntensity;
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    apply(ctx) {
        ctx.translate(this.offsetX, this.offsetY);
    }
}

class ScrollingBackground {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.offset = 0;
        this.gridSize = 40;
    }

    update(scrollSpeed) {
        this.offset += scrollSpeed;
        if (this.offset >= this.gridSize) {
            this.offset -= this.gridSize;
        }
    }

    draw(ctx) {
        ctx.save();

        // Dark background
        ctx.fillStyle = '#0a1929';
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid pattern
        ctx.strokeStyle = 'rgba(100, 149, 237, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Horizontal lines (scrolling)
        for (let y = -this.gridSize; y < this.height + this.gridSize; y += this.gridSize) {
            const drawY = y + this.offset;
            ctx.beginPath();
            ctx.moveTo(0, drawY);
            ctx.lineTo(this.width, drawY);
            ctx.stroke();
        }

        // Add some stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.width; // Pseudo-random but consistent
            const y = ((i * 137) % this.height + this.offset * 0.3) % this.height;
            const size = 1 + (i % 3);
            ctx.fillRect(x, y, size, size);
        }

        ctx.restore();
    }
}

class ProjectileTrail {
    constructor() {
        this.trails = [];
    }

    addTrail(projectile) {
        this.trails.push({
            x: projectile.x + projectile.width / 2,
            y: projectile.y + projectile.height,
            alpha: 1.0,
            color: projectile.color
        });

        // Limit trails
        if (this.trails.length > 100) {
            this.trails.shift();
        }
    }

    update() {
        this.trails.forEach(trail => {
            trail.alpha -= 0.05;
        });

        this.trails = this.trails.filter(trail => trail.alpha > 0);
    }

    draw(ctx) {
        this.trails.forEach(trail => {
            ctx.save();
            ctx.globalAlpha = trail.alpha;
            ctx.fillStyle = trail.color;
            ctx.fillRect(trail.x - 1, trail.y - 1, 2, 2);
            ctx.restore();
        });
    }
}
