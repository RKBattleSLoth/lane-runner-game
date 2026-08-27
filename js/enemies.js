// Enemy System
class Enemy {
    constructor(x, y, health, cost, type = 'MEDIUM') {
        this.x = x;
        this.y = y;
        this.type = type;
        const typeConfig = ENEMIES.TYPES[type];
        this.width = typeConfig.width;
        this.height = typeConfig.height;
        this.color = typeConfig.color;
        this.shape = typeConfig.shape;
        this.health = health; // Health points (destroyed by bullets)
        this.maxHealth = health;
        this.cost = cost; // How many troops needed to destroy on collision
        this.active = true;

        // Animation state
        this.animationTime = Math.random() * 500; // Random start for variety
        this.animationSpeed = 300; // ms per frame
    }

    update(scrollSpeed, deltaTime) {
        this.y += scrollSpeed;

        // Update animation timer
        this.animationTime += deltaTime || 16;
    }

    draw(ctx, spriteManager) {
        if (!this.active) return;

        // Try to draw zombie sprite with animation, fallback to colored shape
        let drewSprite = false;
        if (spriteManager && spriteManager.loaded) {
            // Determine which animation frame to use
            const frameIndex = Math.floor(this.animationTime / this.animationSpeed) % 2;
            const frameName = frameIndex === 0 ? 'zombie_frame1' : 'zombie_frame2';
            const zombieSprite = spriteManager.getSprite(frameName);

            if (zombieSprite) {
                // Rotate zombie to face down (90 degrees)
                drewSprite = spriteManager.drawSpriteRotated(ctx, zombieSprite, this.x, this.y, this.width, this.height, Math.PI / 2);
            }
        }

        // Fallback to colored shape if sprite not available
        if (!drewSprite) {
            ctx.fillStyle = this.color;

            if (this.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (this.shape === 'square') {
                ctx.fillRect(
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
            } else if (this.shape === 'hexagon') {
                // Draw hexagon
                ctx.beginPath();
                const sides = 6;
                const radius = this.width / 2;
                for (let i = 0; i < sides; i++) {
                    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
                    const x = this.x + radius * Math.cos(angle);
                    const y = this.y + radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }

        // Draw health bar for all enemies
        const healthBarWidth = this.width - 10;
        const healthBarHeight = 6;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#222';
        ctx.fillRect(
            this.x - healthBarWidth / 2,
            this.y - this.height / 2 - 12,
            healthBarWidth,
            healthBarHeight
        );

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(
            this.x - healthBarWidth / 2,
            this.y - this.height / 2 - 12,
            healthBarWidth * healthPercent,
            healthBarHeight
        );

        // Draw health number
        ctx.fillStyle = '#fff';
        ctx.font = this.type === 'BOSS' ? 'bold 20px Arial' : (this.type === 'SMALL' ? 'bold 10px Arial' : 'bold 14px Arial');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(this.health).toString(), this.x, this.y);
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.active = false;
            return true; // Enemy destroyed
        }
        return false;
    }

    isOffScreen() {
        return this.y > GAME.HEIGHT + this.height;
    }

    hasEscaped() {
        // Enemy reached bottom without being destroyed
        return this.y > GAME.HEIGHT && this.active;
    }
}

class EnemyManager {
    constructor(levelConfig = null) {
        this.enemies = [];
        this.lastSpawnY = 0;
        this.levelConfig = levelConfig;
    }

    update(scrollSpeed, scrollDistance, player, game, deltaTime) {
        // Update existing enemies
        this.enemies.forEach(enemy => {
            // Apply zombie speed multiplier from level config
            const speedMultiplier = this.levelConfig?.difficulty?.zombieSpeed || 1.0;
            enemy.update(scrollSpeed * speedMultiplier, deltaTime);

            // Check if enemy escaped (reached bottom)
            if (enemy.hasEscaped()) {
                this.handleEnemyEscape(enemy, player, game);
            }
        });

        // Remove off-screen enemies
        this.enemies = this.enemies.filter(enemy => !enemy.isOffScreen());

        // Constant stream spawning - very frequent, individual enemies
        const progress = Math.min(scrollDistance / GAME.LEVEL_LENGTH, 1);

        // Use level config spawn intervals or default
        const spawnStart = this.levelConfig?.difficulty?.spawnIntervalStart || 45;
        const spawnEnd = this.levelConfig?.difficulty?.spawnIntervalEnd || 18;
        const currentSpawnInterval = spawnStart - (progress * (spawnStart - spawnEnd));

        // Spawn new enemies
        if (scrollDistance - this.lastSpawnY > currentSpawnInterval) {
            this.spawnEnemy(scrollDistance);
            this.lastSpawnY = scrollDistance;
        }
    }

    handleEnemyEscape(enemy, player, game) {
        // Enemy escaped - deal damage proportional to remaining health
        const healthPercent = enemy.health / enemy.maxHealth;
        const damage = enemy.cost * healthPercent;
        const armyDamage = Math.ceil(damage / player.currentTroop.multiplier);
        if (armyDamage > 0 && game) game.damageTaken = true;
        player.modifyArmy(-armyDamage);
        enemy.active = false;
    }

    spawnEnemy(scrollDistance) {
        // Spawn INDIVIDUAL enemies in a constant stream
        // Use level config zombie types or default (90% small, 7% medium, 3% boss)
        const zombieTypes = this.levelConfig?.zombieTypes || { small: 0.90, medium: 0.07, boss: 0.03 };
        const rand = Math.random();
        let enemyType;

        if (rand < zombieTypes.small) {
            enemyType = 'SMALL'; // Peons - the horde
        } else if (rand < zombieTypes.small + zombieTypes.medium) {
            enemyType = 'MEDIUM'; // Tougher enemies
        } else {
            enemyType = 'BOSS'; // Mini-bosses
        }

        // Milestone-based scaling - Use level config scaling start or default (0.40)
        const progress = Math.min(scrollDistance / GAME.LEVEL_LENGTH, 1);
        const scalingStart = this.levelConfig?.difficulty?.scalingStart || 0.40;
        let scalingFactor;

        if (progress < scalingStart) {
            // Early game: ZERO scaling - keep enemies trivial
            scalingFactor = 0;
        } else if (progress < scalingStart + 0.20) {
            // Mid game ramp up: 0 to 0.3
            scalingFactor = ((progress - scalingStart) / 0.20) * 0.3;
        } else if (progress < scalingStart + 0.40) {
            // Late game: 0.3 to 0.7
            scalingFactor = 0.3 + ((progress - (scalingStart + 0.20)) / 0.20) * 0.4;
        } else {
            // End game: 0.7 to 1.0
            scalingFactor = 0.7 + ((progress - (scalingStart + 0.40)) / 0.20) * 0.3;
        }

        // Base health and cost ranges
        const minHealth = ENEMIES.START_MIN_HEALTH +
                         (ENEMIES.END_MIN_HEALTH - ENEMIES.START_MIN_HEALTH) * scalingFactor;
        const maxHealth = ENEMIES.START_MAX_HEALTH +
                         (ENEMIES.END_MAX_HEALTH - ENEMIES.START_MAX_HEALTH) * scalingFactor;
        const minCost = ENEMIES.START_MIN_COST +
                       (ENEMIES.END_MIN_COST - ENEMIES.START_MIN_COST) * scalingFactor;

        // Random X position across the playfield
        const x = PLAYFIELD.MIN_X + 30 + Math.random() * (PLAYFIELD.WIDTH - 60);
        const y = -30;

        let health, cost;

        if (enemyType === 'SMALL') {
            // Peons: ALWAYS 1 HP, 1 cost - never scale, pure fodder
            health = 1;
            cost = 1;
        } else if (enemyType === 'MEDIUM') {
            // Medium: 2-3 HP early, scales moderately
            // Base cost: 5 (much more threatening than peons)
            health = progress < scalingStart ? 2 : Math.max(2, Math.ceil(minHealth * 1.5));
            const baseCost = 5;
            cost = progress < scalingStart ? baseCost : Math.max(baseCost, Math.floor(baseCost + minCost * 0.5));
        } else {
            // Boss mini-zombies: 5-10 HP early, scales more
            // Base cost: 10 (very dangerous)
            health = progress < scalingStart ? (5 + Math.floor(Math.random() * 6)) : Math.max(8, Math.ceil(minHealth * 3));
            const baseCost = 10;
            cost = progress < scalingStart ? baseCost : Math.max(baseCost, Math.floor(baseCost + minCost));
        }

        // Apply level health multiplier if present
        const healthMultiplier = this.levelConfig?.difficulty?.healthMultiplier || 1.0;
        health = Math.max(1, Math.floor(health * healthMultiplier)); // Always at least 1 HP

        this.enemies.push(new Enemy(x, y, health, cost, enemyType));
    }

    draw(ctx, spriteManager) {
        this.enemies.forEach(enemy => enemy.draw(ctx, spriteManager));
    }

    checkCollisions(player, game) {
        const playerBounds = player.getBounds();

        this.enemies.forEach(enemy => {
            if (!enemy.active) return;

            const enemyBounds = enemy.getBounds();

            // Check player collision with enemy
            if (this.checkCollision(playerBounds, enemyBounds)) {
                // Use effective power (army * troop multiplier) to check if player can defeat enemy
                if (player.effectivePower >= enemy.cost) {
                    // Convert enemy cost to army damage based on troop multiplier
                    const armyDamage = Math.ceil(enemy.cost / player.currentTroop.multiplier);
                    if (armyDamage > 0 && game) game.damageTaken = true;
                    player.modifyArmy(-armyDamage);
                    enemy.active = false;
                    if (game) {
                        game.stats.enemiesKilled++;
                        // Enemy death effects (collision) - use blood splatter
                        if (game.particleSystem) {
                            game.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 8, true);
                        }
                        if (game.audioSystem) {
                            game.audioSystem.playEnemyDeath(enemy.type);
                        }
                    }
                } else {
                    // Not enough power, player loses all troops
                    if (game) game.damageTaken = true;
                    player.army = 0;
                }
            }

            // Check projectile collisions
            player.projectiles = player.projectiles.filter(projectile => {
                if (!enemy.active) return true;

                if (this.checkCollision(projectile, enemyBounds)) {
                    const killed = enemy.takeDamage(projectile.damage);
                    if (killed) {
                        if (game) {
                            game.stats.enemiesKilled++;
                            // Enemy death effects (projectile) - use blood splatter
                            if (game.particleSystem) {
                                game.particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 8, true);
                            }
                            if (game.audioSystem) {
                                game.audioSystem.playEnemyDeath(enemy.type);
                            }
                        }
                    }

                    // Handle piercing
                    if (projectile.piercing > 0) {
                        projectile.pierceCount++;
                        if (projectile.pierceCount >= projectile.piercing) {
                            return false; // Remove after piercing max enemies
                        }
                        return true; // Keep projectile if it can still pierce
                    }

                    return false; // Remove non-piercing projectile
                }
                return true;
            });
        });
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    reset() {
        this.enemies = [];
        this.lastSpawnY = 0;
    }
}
