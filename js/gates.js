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
        // Loot gates move toward player at fixed speed
        if (this.isLoot) {
            this.y += this.lootVelocity || scrollSpeed;
        } else {
            this.y += scrollSpeed;
        }
    }

    draw(ctx, spriteManager) {
        if (!this.active) return;

        const gateType = GATES.TYPES[this.type];

        // Map gate types to sprites
        let spriteName = null;
        if (this.type === 'ADD_10') {
            spriteName = 'medkit'; // Med kit for +10 army
        } else if (this.type === 'ADD_20') {
            spriteName = 'crate_3'; // Military crate for +20 army (bigger boost)
        } else if (this.type === 'MULTIPLY_2') {
            spriteName = 'crate_2'; // Special crate for x2 multiply
        } else if (this.type.includes('WEAPON')) {
            spriteName = 'ammo'; // Ammo box for weapons
        } else if (this.type.includes('TROOP')) {
            spriteName = 'crate_3'; // Military crate for troops
        } else {
            spriteName = 'crate_1'; // Default crate
        }

        // Try to draw sprite
        let drewSprite = false;
        if (spriteManager && spriteManager.loaded) {
            const sprite = spriteManager.getSprite(spriteName);
            if (sprite) {
                drewSprite = spriteManager.drawSprite(ctx, sprite, this.x, this.y, this.width, this.height);
            }
        }

        // Fallback to colored rectangle
        if (!drewSprite) {
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
        }

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

        // Draw symbol/text label on top of sprite
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text background for readability
        const textMetrics = ctx.measureText(gateType.symbol);
        const padding = 4;
        ctx.fillRect(
            this.x - textMetrics.width / 2 - padding,
            this.y - 12,
            textMetrics.width + padding * 2,
            24
        );

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.fillText(gateType.symbol, this.x, this.y);
        ctx.restore();
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
    constructor(levelConfig = null) {
        this.gates = [];
        this.lastSpawnY = 0;
        this.sectionStartY = 0;
        this.inRewardSection = false;
        this.rewardSectionCount = 0;
        this.lastUpgradeDistance = 0;
        this.upgradeGiven = false;
        this.weaponUpgradeGiven = false;
        this.troopUpgradeGiven = false;
        this.levelConfig = levelConfig;
    }

    getCurrentSection(scrollDistance) {
        const sectionLength = GATES.COMBAT_SECTION_LENGTH + GATES.REWARD_SECTION_LENGTH;
        const positionInCycle = scrollDistance % sectionLength;

        return positionInCycle >= GATES.COMBAT_SECTION_LENGTH ? 'reward' : 'combat';
    }

    update(scrollSpeed, scrollDistance, player) {
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
            this.spawnGate(section, scrollDistance, player);
            this.lastSpawnY = scrollDistance;
        }
    }

    spawnGate(section, scrollDistance, player) {
        // Spawn 1-2 gates at random X positions
        const numGates = Math.floor(Math.random() * 2) + 1; // 1-2 gates
        const positions = this.generateGatePositions(numGates);

        // Get unique gate types for this row
        const gateTypes = this.selectUniqueGateTypes(section, scrollDistance, numGates, player);

        positions.forEach((x, i) => {
            this.gates.push(new Gate(x, -GATES.HEIGHT, gateTypes[i], scrollDistance));
        });
    }

    selectUniqueGateTypes(section, scrollDistance, count, player) {
        const progress = scrollDistance / GAME.LEVEL_LENGTH;
        const uniqueTypes = [];

        // Helper function to select random army gate
        const selectArmyGate = () => {
            const rand = Math.random();
            if (rand < 0.4) return 'ADD_10';      // 40% - small boost
            if (rand < 0.7) return 'ADD_20';      // 30% - medium boost
            return 'MULTIPLY_2';                   // 30% - multiplier
        };

        if (section === 'reward') {
            // Build separate pools for weapons and troops based on progress tiers
            let weaponUpgrades = [];
            let troopUpgrades = [];

            // Get level weapon restrictions
            const excludedWeapons = this.levelConfig?.weaponRestrictions?.exclude || [];
            const noTroopUpgrades = this.levelConfig?.weaponRestrictions?.noTroopUpgrades || false;
            const noWeaponsAfter = this.levelConfig?.weaponRestrictions?.noWeaponsAfter || 1.0; // Default: no restriction
            const weaponSpawnRate = this.levelConfig?.weaponRestrictions?.weaponSpawnRate || 0.7; // Default 70%

            // Check if we're past the no-weapons threshold
            const weaponsDisabled = progress >= noWeaponsAfter;

            // Only build weapon/troop pools if not disabled
            if (!weaponsDisabled) {
                // Tier 1: Early game (0-35%)
                if (progress < 0.35) {
                    if (!excludedWeapons.includes('WEAPON_RIFLE')) {
                        weaponUpgrades.push('WEAPON_RIFLE');
                    }
                    if (!noTroopUpgrades) {
                        troopUpgrades.push('TROOP_SPEC');
                    }
                }

                // Tier 2: Mid game (25-70%)
                if (progress >= 0.25 && progress < 0.70) {
                    if (!excludedWeapons.includes('WEAPON_MG')) {
                        weaponUpgrades.push('WEAPON_MG');
                    }
                    if (!noTroopUpgrades) {
                        troopUpgrades.push('TROOP_TANK');
                    }
                }

                // Tier 3: Late game (60%+)
                if (progress >= 0.60) {
                    if (!excludedWeapons.includes('WEAPON_SNIPER')) {
                        weaponUpgrades.push('WEAPON_SNIPER');
                    }
                    // WEAPON_MOUNTED_MG is boss-loot only, never spawns from gates
                    // Late game can still get Tank as it's top tier troop
                    if (!noTroopUpgrades) {
                        troopUpgrades.push('TROOP_TANK');
                    }
                }

                // Filter out weapons based on player progression
                if (player && player.unlockedWeapons) {
                    // If player has Mounted MG, no more weapon upgrades
                    if (player.unlockedWeapons.has('MOUNTED_MG')) {
                        weaponUpgrades = [];
                    } else {
                        weaponUpgrades = weaponUpgrades.filter(weaponType => {
                            // Map gate type to weapon name
                            const weaponMap = {
                                'WEAPON_RIFLE': 'RIFLE',
                                'WEAPON_MG': 'MACHINE_GUN',
                                'WEAPON_SNIPER': 'SNIPER',
                                'WEAPON_MOUNTED_MG': 'MOUNTED_MG'
                            };
                            const weaponName = weaponMap[weaponType];

                            // Don't give duplicates
                            if (player.unlockedWeapons.has(weaponName)) {
                                return false;
                            }

                            // MG and Sniper are equivalent tier - if player has one, don't give the other OR Rifle
                            if (player.unlockedWeapons.has('MACHINE_GUN') || player.unlockedWeapons.has('SNIPER')) {
                                if (weaponType === 'WEAPON_RIFLE' || weaponType === 'WEAPON_MG' || weaponType === 'WEAPON_SNIPER') {
                                    return false;
                                }
                            }

                            return true;
                        });
                    }
                }

                // Filter troops to prevent duplicates and enforce progression (except level 5)
                if (player) {
                    troopUpgrades = troopUpgrades.filter(troopType => {
                        // TROOP_SPEC: Only if player is SOLDIER
                        if (troopType === 'TROOP_SPEC') {
                            return player.troopType === 'SOLDIER';
                        }
                        // TROOP_TANK: Only if player is SPECIALIST (level 5 can skip, others must have SPECIALIST first)
                        if (troopType === 'TROOP_TANK') {
                            if (this.levelConfig?.id === 5) {
                                // Level 5: Can get TANK if not already TANK
                                return player.troopType !== 'TANK';
                            } else {
                                // Other levels: Must be SPECIALIST (not SOLDIER, not already TANK)
                                return player.troopType === 'SPECIALIST';
                            }
                        }
                        return true;
                    });
                }
            }

            // If weapons are disabled, only spawn army gates
            if (weaponsDisabled) {
                for (let i = 0; i < count; i++) {
                    uniqueTypes.push(selectArmyGate());
                }
                return uniqueTypes;
            }

            // Determine if we should force specific upgrade types
            const distanceSinceUpgrade = scrollDistance - this.lastUpgradeDistance;
            const forceWeapon = !this.weaponUpgradeGiven && weaponUpgrades.length > 0 && (progress >= 0.15 || this.rewardSectionCount >= 3);
            const forceTroop = !noTroopUpgrades && !this.troopUpgradeGiven && troopUpgrades.length > 0 && (progress >= 0.10 || this.rewardSectionCount >= 2);
            const forceAnyUpgrade =
                this.rewardSectionCount <= 2 || // First 2 reward sections
                distanceSinceUpgrade >= 2000 || // Been too long
                !this.upgradeGiven; // Haven't given one this section

            let selectedUpgrade = null;

            // Build combined pool for selection - weight troops more heavily
            const allUpgrades = noTroopUpgrades
                ? weaponUpgrades
                : [...weaponUpgrades, ...troopUpgrades, ...troopUpgrades]; // Add troops twice for 2:1 ratio

            // Priority: Force weapon/troop if not given yet
            if (forceTroop) {
                // Prioritize troops over weapons - they're more critical for survival
                selectedUpgrade = troopUpgrades[Math.floor(Math.random() * troopUpgrades.length)];
                this.troopUpgradeGiven = true;
            } else if (forceWeapon) {
                selectedUpgrade = weaponUpgrades[Math.floor(Math.random() * weaponUpgrades.length)];
                this.weaponUpgradeGiven = true;
            } else if (allUpgrades.length > 0 && (forceAnyUpgrade || Math.random() < 0.85)) {
                // 85% chance to spawn upgrade when available (up from weaponSpawnRate)
                selectedUpgrade = allUpgrades[Math.floor(Math.random() * allUpgrades.length)];

                // Track which type was given
                if (weaponUpgrades.includes(selectedUpgrade)) {
                    this.weaponUpgradeGiven = true;
                } else {
                    this.troopUpgradeGiven = true;
                }
            }

            // First gate: upgrade or army
            if (selectedUpgrade) {
                uniqueTypes.push(selectedUpgrade);
                this.upgradeGiven = true;
                this.lastUpgradeDistance = scrollDistance;
            } else {
                uniqueTypes.push(selectArmyGate());
            }

            // Second gate (if needed): Always an army gate to prevent double upgrades
            if (count > 1) {
                uniqueTypes.push(selectArmyGate());
            }
        } else {
            // Combat section (shouldn't happen often)
            for (let i = 0; i < count; i++) {
                uniqueTypes.push(selectArmyGate());
            }
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

    draw(ctx, spriteManager) {
        this.gates.forEach(gate => gate.draw(ctx, spriteManager));
    }

    checkCollisions(player, game) {
        const playerBounds = player.getBounds();

        this.gates.forEach(gate => {
            if (!gate.active) return;

            const gateBounds = gate.getBounds();

            // Only apply collision effects for gates that don't require shooting (army gates)
            if (!gate.requiresShooting && this.checkCollision(playerBounds, gateBounds)) {
                gate.applyEffect(player);
                // Gate pickup effects (collision)
                if (game) {
                    const gateType = GATES.TYPES[gate.type];
                    if (game.particleSystem) {
                        game.particleSystem.createGateSparkle(gate.x, gate.y, gateType.color, 15);
                    }
                    if (game.audioSystem) {
                        game.audioSystem.playGatePickup();
                    }
                }
            }

            // Check projectile collisions for gates that require shooting
            if (gate.requiresShooting) {
                player.projectiles = player.projectiles.filter(projectile => {
                    if (this.checkCollision(projectile, gateBounds)) {
                        const destroyed = gate.takeDamage(projectile.damage);
                        if (destroyed) {
                            gate.applyEffect(player);
                            // Gate pickup effects (shooting)
                            if (game) {
                                const gateType = GATES.TYPES[gate.type];
                                if (game.particleSystem) {
                                    game.particleSystem.createGateSparkle(gate.x, gate.y, gateType.color, 15);
                                }
                                if (game.audioSystem) {
                                    game.audioSystem.playGatePickup();
                                }
                            }
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
