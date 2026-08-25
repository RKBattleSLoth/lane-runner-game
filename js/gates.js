// Gates System
class Gate {
    constructor(x, y, type, scrollDistance) {
        this.x = x;
        this.y = y;
        this.width = GATES.WIDTH;
        this.height = GATES.HEIGHT;
        this.type = type;
        this.active = true;

        // Health for upgrade gates that require shooting
        const gateConfig = GATES.TYPES[type];
        if (gateConfig.requiresShooting) {
            // VERY gentle HP scaling - gates should be easy to kill
            // Goal: ~5-10 shots with basic weapon throughout the game
            const progress = Math.min(scrollDistance / GAME.LEVEL_LENGTH, 1);
            let damageMultiplier;

            if (progress < 0.40) {
                // Early game: no scaling at all
                damageMultiplier = 1.0;
            } else if (progress < 0.60) {
                // Mid game: gentle scaling (1.0× to 1.5×)
                damageMultiplier = 1.0 + ((progress - 0.40) / 0.20) * 0.5;
            } else if (progress < 0.80) {
                // Late game: moderate scaling (1.5× to 2.5×)
                damageMultiplier = 1.5 + ((progress - 0.60) / 0.20) * 1.0;
            } else {
                // End game: (2.5× to 4.0×)
                damageMultiplier = 2.5 + ((progress - 0.80) / 0.20) * 1.5;
            }

            this.health = Math.floor(gateConfig.health * damageMultiplier);
            this.maxHealth = this.health;
            this.requiresShooting = true;
        } else {
            this.requiresShooting = false;
        }
    }

    update(scrollSpeed) {
        this.y += scrollSpeed;
    }

    draw(ctx) {
        if (!this.active) return;

        const gateType = GATES.TYPES[this.type];

        // Draw gate background
        ctx.fillStyle = gateType.color;
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );

        // Draw gate border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );

        // Draw health bar for gates that require shooting
        if (this.requiresShooting) {
            const healthBarWidth = this.width - 10;
            const healthBarHeight = 8;
            const healthPercent = this.health / this.maxHealth;

            // Health bar background
            ctx.fillStyle = '#222';
            ctx.fillRect(
                this.x - healthBarWidth / 2,
                this.y - this.height / 2 - 15,
                healthBarWidth,
                healthBarHeight
            );

            // Health bar fill
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                this.x - healthBarWidth / 2,
                this.y - this.height / 2 - 15,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
        }

        // Draw symbol
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gateType.symbol, this.x, this.y);
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
        if (!this.requiresShooting) return false;

        this.health -= amount;
        if (this.health <= 0) {
            return true; // Gate destroyed
        }
        return false;
    }

    applyEffect(player) {
        if (!this.active) return;

        const gateType = GATES.TYPES[this.type];
        gateType.apply(player);
        this.active = false;
    }

    isOffScreen() {
        return this.y > GAME.HEIGHT + this.height;
    }
}

class GateManager {
    constructor() {
        this.gates = [];
        this.lastSpawnY = 0;
        this.sectionStartY = 0;
        this.inRewardSection = false;
        this.rewardSectionCount = 0;
        this.lastUpgradeDistance = 0;
        this.upgradeGiven = false;
        this.weaponUpgradeGiven = false;
        this.troopUpgradeGiven = false;
    }

    getCurrentSection(scrollDistance) {
        const sectionLength = GATES.COMBAT_SECTION_LENGTH + GATES.REWARD_SECTION_LENGTH;
        const positionInCycle = scrollDistance % sectionLength;

        return positionInCycle >= GATES.COMBAT_SECTION_LENGTH ? 'reward' : 'combat';
    }

    update(scrollSpeed, scrollDistance) {
        // Update existing gates
        this.gates.forEach(gate => gate.update(scrollSpeed));

        // Remove off-screen gates
        this.gates = this.gates.filter(gate => !gate.isOffScreen());

        // Track reward section transitions
        const section = this.getCurrentSection(scrollDistance);
        if (section === 'reward' && !this.inRewardSection) {
            // Just entered a new reward section
            this.inRewardSection = true;
            this.rewardSectionCount++;
            this.upgradeGiven = false; // Reset for this section
        } else if (section === 'combat') {
            this.inRewardSection = false;
        }

        // Spawn new gates ONLY during reward sections
        if (section === 'reward' && scrollDistance - this.lastSpawnY > GATES.SPAWN_INTERVAL) {
            this.spawnGate(section, scrollDistance);
            this.lastSpawnY = scrollDistance;
        }
    }

    spawnGate(section, scrollDistance) {
        // Spawn 1-2 gates at random X positions
        const numGates = Math.floor(Math.random() * 2) + 1; // 1-2 gates
        const positions = this.generateGatePositions(numGates);

        // Get unique gate types for this row
        const gateTypes = this.selectUniqueGateTypes(section, scrollDistance, numGates);

        positions.forEach((x, i) => {
            this.gates.push(new Gate(x, -GATES.HEIGHT, gateTypes[i], scrollDistance));
        });
    }

    selectUniqueGateTypes(section, scrollDistance, count) {
        const progress = scrollDistance / GAME.LEVEL_LENGTH;
        const uniqueTypes = [];

        if (section === 'reward') {
            // Build separate pools for weapons and troops based on progress tiers
            const weaponUpgrades = [];
            const troopUpgrades = [];

            // Tier 1: Early game (0-35%)
            if (progress < 0.35) {
                weaponUpgrades.push('WEAPON_RIFLE');
                troopUpgrades.push('TROOP_SPEC');
            }

            // Tier 2: Mid game (25-70%)
            if (progress >= 0.25 && progress < 0.70) {
                weaponUpgrades.push('WEAPON_MG');
                troopUpgrades.push('TROOP_TANK');
            }

            // Tier 3: Late game (60%+)
            if (progress >= 0.60) {
                weaponUpgrades.push('WEAPON_SNIPER');
                // Late game can still get Tank as it's top tier troop
                troopUpgrades.push('TROOP_TANK');
            }

            // Determine if we should force specific upgrade types
            const distanceSinceUpgrade = scrollDistance - this.lastUpgradeDistance;
            const forceWeapon = !this.weaponUpgradeGiven && (progress >= 0.15 || this.rewardSectionCount >= 3);
            const forceTroop = !this.troopUpgradeGiven && (progress >= 0.15 || this.rewardSectionCount >= 3);
            const forceAnyUpgrade =
                this.rewardSectionCount <= 2 || // First 2 reward sections
                distanceSinceUpgrade >= 2000 || // Been too long
                !this.upgradeGiven; // Haven't given one this section

            let selectedUpgrade = null;

            // Priority: Force weapon/troop if not given yet
            if (forceWeapon && weaponUpgrades.length > 0) {
                selectedUpgrade = weaponUpgrades[Math.floor(Math.random() * weaponUpgrades.length)];
                this.weaponUpgradeGiven = true;
            } else if (forceTroop && troopUpgrades.length > 0) {
                selectedUpgrade = troopUpgrades[Math.floor(Math.random() * troopUpgrades.length)];
                this.troopUpgradeGiven = true;
            } else if (forceAnyUpgrade || Math.random() < 0.7) {
                // Random upgrade from available pool
                const allUpgrades = [...weaponUpgrades, ...troopUpgrades];
                if (allUpgrades.length > 0) {
                    selectedUpgrade = allUpgrades[Math.floor(Math.random() * allUpgrades.length)];

                    // Track which type was given
                    if (weaponUpgrades.includes(selectedUpgrade)) {
                        this.weaponUpgradeGiven = true;
                    } else {
                        this.troopUpgradeGiven = true;
                    }
                }
            }

            // First gate: upgrade or army
            if (selectedUpgrade) {
                uniqueTypes.push(selectedUpgrade);
                this.upgradeGiven = true;
                this.lastUpgradeDistance = scrollDistance;
            } else {
                uniqueTypes.push(Math.random() < 0.5 ? 'ADD_10' : 'MULTIPLY_2');
            }

            // Second gate (if needed): Always an army gate to prevent double upgrades
            if (count > 1) {
                uniqueTypes.push(Math.random() < 0.5 ? 'ADD_10' : 'MULTIPLY_2');
            }
        } else {
            // Combat section (shouldn't happen often)
            uniqueTypes.push('ADD_10');
            if (count > 1) uniqueTypes.push('MULTIPLY_2');
        }

        return uniqueTypes;
    }

    generateGatePositions(count) {
        const positions = [];
        const minSpacing = GATES.WIDTH + 30; // Minimum space between gates

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let x;

            do {
                x = PLAYFIELD.MIN_X + GATES.WIDTH / 2 +
                    Math.random() * (PLAYFIELD.WIDTH - GATES.WIDTH);
                attempts++;
            } while (attempts < 20 && positions.some(pos => Math.abs(pos - x) < minSpacing));

            if (attempts < 20) {
                positions.push(x);
            }
        }

        return positions;
    }

    draw(ctx) {
        this.gates.forEach(gate => gate.draw(ctx));
    }

    checkCollisions(player) {
        const playerBounds = player.getBounds();

        this.gates.forEach(gate => {
            if (!gate.active) return;

            const gateBounds = gate.getBounds();

            // Only apply collision effects for gates that don't require shooting (army gates)
            if (!gate.requiresShooting && this.checkCollision(playerBounds, gateBounds)) {
                gate.applyEffect(player);
            }

            // Check projectile collisions for gates that require shooting
            if (gate.requiresShooting) {
                player.projectiles = player.projectiles.filter(projectile => {
                    if (this.checkCollision(projectile, gateBounds)) {
                        const destroyed = gate.takeDamage(projectile.damage);
                        if (destroyed) {
                            gate.applyEffect(player);
                        }

                        // Handle piercing (gates don't consume piercing count)
                        if (projectile.piercing > 0) {
                            return true; // Keep piercing projectiles
                        }

                        return false; // Remove non-piercing projectile
                    }
                    return true;
                });
            }
        });
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    reset() {
        this.gates = [];
        this.lastSpawnY = 0;
        this.rewardSectionCount = 0;
        this.lastUpgradeDistance = 0;
        this.upgradeGiven = false;
        this.weaponUpgradeGiven = false;
        this.troopUpgradeGiven = false;
        this.inRewardSection = false;
    }
}
