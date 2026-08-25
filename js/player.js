// Player Class
class Player {
    constructor() {
        this.x = GAME.WIDTH / 2; // Start at center
        this.y = GAME.HEIGHT - 100;
        this.width = PLAYER.WIDTH;
        this.height = PLAYER.HEIGHT;
        this.army = PLAYER.INITIAL_ARMY;
        this.lastFireTime = 0;
        this.projectiles = [];

        // Movement
        this.velocityX = 0;

        // Weapon and troop systems
        this.weaponType = 'PISTOL';
        this.troopType = 'SOLDIER';
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
        // Horizontal movement
        this.velocityX = 0;
        if (keys['a'] || keys['arrowleft']) {
            this.velocityX = -PLAYER.MOVE_SPEED;
        }
        if (keys['d'] || keys['arrowright']) {
            this.velocityX = PLAYER.MOVE_SPEED;
        }

        // Update position with boundaries
        this.x += this.velocityX;
        this.x = Math.max(PLAYFIELD.MIN_X + this.width / 2,
                         Math.min(this.x, PLAYFIELD.MAX_X - this.width / 2));

        // Auto-fire with weapon-specific fire rate
        this.lastFireTime += deltaTime;
        if (this.lastFireTime >= this.currentWeapon.fireRate) {
            this.fire(game);
            this.lastFireTime = 0;
        }

        // Update projectiles (add trails if game provided)
        this.projectiles = this.projectiles.filter(p => {
            p.y -= PROJECTILES.SPEED;
            if (game && game.projectileTrails) {
                game.projectileTrails.addTrail(p);
            }
            return p.y > -PROJECTILES.HEIGHT;
        });
    }

    fire(game) {
        // Combine weapon damage with troop multiplier and army multiplier for total damage
        const armyMultiplier = this.getArmyMultiplier();
        const totalDamage = this.currentWeapon.damage * this.currentTroop.multiplier * armyMultiplier;

        // Projectile width depends on troop type
        const projectileWidth = this.currentTroop.projectileWidth;

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
            this.weaponType = weaponType;
        }
    }

    setTroopType(troopType) {
        if (TROOP_TYPES[troopType]) {
            this.troopType = troopType;
        }
    }

    draw(ctx) {
        // Draw player with troop-specific color
        ctx.fillStyle = this.currentTroop.color;
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );

        // Draw army count on player
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.army.toString(), this.x, this.y);

        // Draw projectiles with weapon-specific color
        this.projectiles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.width, p.height);
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
