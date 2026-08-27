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

    draw(ctx, spriteManager) {
        ctx.save();

        // Dark apocalyptic background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw static tiled background (no scrolling)
        if (spriteManager && spriteManager.loaded) {
            const tileSize = this.gridSize;
            const tilesX = Math.ceil(this.width / tileSize);
            const tilesY = Math.ceil(this.height / tileSize);

            for (let tx = 0; tx < tilesX; tx++) {
                for (let ty = 0; ty < tilesY; ty++) {
                    // Static tile pattern
                    const tileIndex = ((tx * 7 + ty * 13) % 10) + 1;
                    const sprite = spriteManager.getSprite(`tile_bg_${tileIndex}`);

                    if (sprite) {
                        const x = tx * tileSize;
                        const y = ty * tileSize;
                        ctx.globalAlpha = 0.6;
                        ctx.drawImage(sprite, x, y, tileSize, tileSize);
                        ctx.globalAlpha = 1.0;
                    }
                }
            }
        } else {
            // Fallback to static grid pattern
            ctx.strokeStyle = 'rgba(139, 115, 85, 0.15)';
            ctx.lineWidth = 1;

            // Vertical lines
            for (let x = 0; x < this.width; x += this.gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.height);
                ctx.stroke();
            }

            // Horizontal lines (static)
            for (let y = 0; y < this.height; y += this.gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(this.width, y);
                ctx.stroke();
            }
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
