// Player Class
class Player {
    constructor(levelConfig = null) {
        this.x = GAME.WIDTH / 2; // Start at center
        this.y = GAME.HEIGHT - 100;
        this.width = PLAYER.WIDTH;
        this.height = PLAYER.HEIGHT;

        // Use level-specific starting survivors or default
        const startingSurvivors = levelConfig?.startingSurvivors || PLAYER.INITIAL_ARMY;
        this.army = startingSurvivors;

        this.lastFireTime = 0;
        this.projectiles = [];

        // Movement
        this.velocityX = 0;

        // Weapon and troop systems - use level config if provided
        this.weaponType = levelConfig?.startingWeapon || 'PISTOL';
        this.troopType = levelConfig?.startingTroop || 'SOLDIER';

        // Track unlocked weapons (start with PISTOL + any level-specific weapon)
        this.unlockedWeapons = new Set(['PISTOL']);
        if (levelConfig?.startingWeapon && levelConfig.startingWeapon !== 'PISTOL') {
            this.unlockedWeapons.add(levelConfig.startingWeapon);
        }
    }

    get currentWeapon() {
        return WEAPON_TYPES[this.weaponType];
    }

    get currentTroop() {
        return TROOP_TYPES[this.troopType];
    }

    get effectivePower() {
        return this.army * this.currentTroop.multiplier;
    }

    update(deltaTime, keys, game) {
        // Normalize deltaTime for 60 FPS (16.67ms per frame)
        const normalizedDelta = deltaTime / 16.67;

        // Horizontal movement
        this.velocityX = 0;
        if (keys['a'] || keys['arrowleft']) {
            this.velocityX = -PLAYER.MOVE_SPEED;
        }
        if (keys['d'] || keys['arrowright']) {
            this.velocityX = PLAYER.MOVE_SPEED;
        }

        // Update position with boundaries (frame-rate independent)
        this.x += this.velocityX * normalizedDelta;
        this.x = Math.max(PLAYFIELD.MIN_X + this.width / 2,
                         Math.min(this.x, PLAYFIELD.MAX_X - this.width / 2));

        // Auto-fire with weapon-specific fire rate
        this.lastFireTime += deltaTime;
        if (this.lastFireTime >= this.currentWeapon.fireRate) {
            this.fire(game);
            this.lastFireTime = 0;
        }

        // Update projectiles (add trails if game provided) - frame-rate independent
        this.projectiles = this.projectiles.filter(p => {
            // Check if projectile has custom velocity (multi-directional weapon)
            if (p.velocityX !== undefined && p.velocityY !== undefined) {
                p.x += p.velocityX * normalizedDelta;
                p.y += p.velocityY * normalizedDelta;
            } else {
                // Standard upward movement
                p.y -= PROJECTILES.SPEED * normalizedDelta;
            }

            if (game && game.projectileTrails) {
                game.projectileTrails.addTrail(p);
            }

            // Remove if off-screen (top, left, or right)
            return p.y > -PROJECTILES.HEIGHT && p.x > -50 && p.x < GAME.WIDTH + 50;
        });
    }

    fire(game) {
        // Combine weapon damage with troop multiplier and army multiplier for total damage
        const armyMultiplier = this.getArmyMultiplier();
        const totalDamage = this.currentWeapon.damage * this.currentTroop.multiplier * armyMultiplier;

        // Projectile width depends on troop type
        const projectileWidth = this.currentTroop.projectileWidth;

        // Check if weapon is multi-directional (Mounted MG)
        if (this.currentWeapon.multiDirectional) {
            // Shoot 3 bullets: forward, diagonal left (30°), diagonal right (30°)
            const angles = [
                -Math.PI / 2,           // Forward (up)
                -Math.PI / 2 - Math.PI / 6,  // Diagonal left (30° from forward)
                -Math.PI / 2 + Math.PI / 6   // Diagonal right (30° from forward)
            ];

            angles.forEach(angle => {
                const projectile = {
                    x: this.x - projectileWidth / 2,
                    y: this.y - this.height / 2,
                    width: projectileWidth,
                    height: PROJECTILES.HEIGHT,
                    damage: totalDamage,
                    color: this.currentWeapon.color,
                    piercing: this.currentWeapon.piercing,
                    pierceCount: 0,
                    // Add velocity components for angled shots
                    velocityX: Math.cos(angle) * PROJECTILES.SPEED,
                    velocityY: Math.sin(angle) * PROJECTILES.SPEED
                };

                this.projectiles.push(projectile);
            });
        } else {
            // Single forward projectile
            const projectile = {
                x: this.x - projectileWidth / 2,
                y: this.y - this.height / 2,
                width: projectileWidth,
                height: PROJECTILES.HEIGHT,
                damage: totalDamage,
                color: this.currentWeapon.color,
                piercing: this.currentWeapon.piercing,
                pierceCount: 0 // Track how many enemies this bullet has pierced
            };

            this.projectiles.push(projectile);
        }

        // Muzzle flash and sound effects
        if (game) {
            if (game.particleSystem) {
                game.particleSystem.createMuzzleFlash(this.x, this.y - this.height / 2, this.currentWeapon.color);
            }
            if (game.audioSystem) {
                game.audioSystem.playShoot(this.weaponType);
            }
        }
    }

    getArmyMultiplier() {
        // Army power scaling - both penalties for low army and bonuses for massive armies
        if (this.army >= 10000) return 14.0;  // Legendary army
        if (this.army >= 5000) return 10.0;   // Epic army
        if (this.army >= 2000) return 6.5;    // Huge army
        if (this.army >= 1000) return 4.5;    // Large army
        if (this.army >= 500) return 3.0;     // Big army
        if (this.army >= 200) return 2.0;     // Strong army
        if (this.army >= 100) return 1.5;     // Good army
        if (this.army >= 50) return 1.25;     // Reinforced army
        if (this.army >= 30) return 1.0;      // Standard army (starting value)
        if (this.army >= 20) return 0.75;     // Weakened
        if (this.army >= 10) return 0.5;      // Struggling
        return 0.3;                            // Desperate
    }

    modifyArmy(amount) {
        this.army += amount;
        if (this.army < 0) this.army = 0;
    }

    multiplyArmy(multiplier) {
        this.army = Math.floor(this.army * multiplier);
    }

    divideArmy(divisor) {
        this.army = Math.floor(this.army / divisor);
        if (this.army < 0) this.army = 0;
    }

    setWeapon(weaponType) {
        if (WEAPON_TYPES[weaponType]) {
            // Add to unlocked weapons when picked up via gate
            this.unlockedWeapons.add(weaponType);
            this.weaponType = weaponType;
        }
    }

    switchWeapon(weaponType) {
        // Only switch if weapon is unlocked
        if (WEAPON_TYPES[weaponType] && this.unlockedWeapons.has(weaponType)) {
            this.weaponType = weaponType;
            return true;
        }
        return false;
    }

    setTroopType(troopType) {
        if (TROOP_TYPES[troopType]) {
            this.troopType = troopType;
        }
    }

    draw(ctx, spriteManager) {
        // Try to draw sprite, fallback to colored rectangle
        let drewSprite = false;
        if (spriteManager && spriteManager.loaded) {
            const sprite = spriteManager.getPlayerSprite(this.troopType, this.weaponType);
            if (sprite) {
                // Rotate player to face up (-90 degrees)
                drewSprite = spriteManager.drawSpriteRotated(ctx, sprite, this.x, this.y, this.width, this.height, -Math.PI / 2);
            }
        }

        // Fallback to colored rectangle if sprite not available
        if (!drewSprite) {
            ctx.fillStyle = this.currentTroop.color;
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }

        // Draw army count on player
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.army.toString(), this.x, this.y);

        // Draw projectiles
        this.projectiles.forEach(p => {
            let drewBullet = false;
            if (spriteManager && spriteManager.loaded) {
                const bulletSprite = spriteManager.getSprite('bullet');
                if (bulletSprite) {
                    // Draw bullet sprite rotated upward
                    drewBullet = spriteManager.drawSpriteRotated(
                        ctx,
                        bulletSprite,
                        p.x + p.width / 2,
                        p.y + p.height / 2,
                        p.width,
                        p.height,
                        -Math.PI / 2
                    );
                }
            }

            // Fallback to colored rectangle
            if (!drewBullet) {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.width, p.height);
            }
        });
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
