// Main Game Class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME.WIDTH;
        this.canvas.height = GAME.HEIGHT;

        // Game state
        this.state = 'playing'; // 'playing', 'boss', 'gameover', 'victory'
        this.scrollDistance = 0;
        this.lastTime = 0;
        this.boss = null;
        this.bossMinionTimer = 0;
        this.boss50Defeated = false;
        this.boss100Defeated = false;

        // Stats tracking
        this.stats = {
            enemiesKilled: 0,
            maxArmy: 30,
            timeElapsed: 0
        };
        this.damageTaken = false;

        // A/V Systems
        this.particleSystem = new ParticleSystem();
        this.audioSystem = new AudioSystem();
        this.screenShake = new ScreenShake();
        this.background = new ScrollingBackground(GAME.WIDTH, GAME.HEIGHT);
        this.projectileTrails = new ProjectileTrail();

        // Game objects
        this.player = new Player();
        this.gateManager = new GateManager();
        this.enemyManager = new EnemyManager();

        // UI elements
        this.armyDisplay = document.getElementById('army-number');
        this.weaponDisplay = document.getElementById('weapon-name');
        this.troopDisplay = document.getElementById('troop-name');
        this.gameOverScreen = document.getElementById('game-over');
        this.gameOverText = document.getElementById('game-over-text');
        this.restartBtn = document.getElementById('restart-btn');

        // Input handling
        this.keys = {};
        this.setupInput();

        // Initialize audio on first user interaction
        this.audioInitialized = false;

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.initAudio(); // Try to init audio on any key press
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse/touch for audio init
        this.canvas.addEventListener('click', () => {
            this.initAudio();
        });

        // Restart button
        this.restartBtn.addEventListener('click', () => {
            this.restart();
            this.initAudio();
        });
    }

    async initAudio() {
        if (!this.audioInitialized) {
            const success = await this.audioSystem.init();
            if (success) {
                this.audioInitialized = true;
                console.log('Audio system initialized');
            }
        }
    }

    gameLoop(currentTime) {
        try {
            // Calculate delta time
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;

            // Update and render
            this.update(deltaTime);
            this.render();

            // Continue loop
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (e) {
            console.error('Game loop error:', e);
            // Continue loop even if there's an error
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    update(deltaTime) {
        if (this.state === 'gameover' || this.state === 'victory') return;

        // Track stats
        this.stats.timeElapsed += deltaTime / 1000; // Convert to seconds
        if (this.player.army > this.stats.maxArmy) {
            this.stats.maxArmy = this.player.army;
        }

        // Update A/V systems with error handling
        try {
            this.particleSystem.update(deltaTime);
            this.screenShake.update(deltaTime);
            this.projectileTrails.update();
        } catch (e) {
            console.error('A/V system error:', e);
        }

        // Update player
        this.player.update(deltaTime, this.keys, this);

        if (this.state === 'playing') {
            // Normal gameplay - scroll and spawn
            this.scrollDistance += GAME.SCROLL_SPEED;
            this.background.update(GAME.SCROLL_SPEED);
            this.gateManager.update(GAME.SCROLL_SPEED, this.scrollDistance);
            this.enemyManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player, this);

            // Check for boss triggers
            if (!this.boss50Defeated && this.scrollDistance >= GAME.LEVEL_LENGTH * 0.5) {
                this.startBossBattle(0.5);
            } else if (!this.boss100Defeated && this.scrollDistance >= GAME.LEVEL_LENGTH) {
                this.startBossBattle(1.0);
            }
        } else if (this.state === 'boss') {
            // Boss battle - no scrolling, update boss
            this.updateBossBattle(deltaTime);
        }

        // Check collisions
        this.gateManager.checkCollisions(this.player, this);
        this.enemyManager.checkCollisions(this.player, this);

        // Update UI
        this.armyDisplay.textContent = this.player.army;
        this.weaponDisplay.textContent = this.player.currentWeapon.name;
        this.troopDisplay.textContent = this.player.currentTroop.name;

        // Check lose condition
        if (this.player.army <= 0) {
            this.gameOver(false);
        }
    }

    render() {
        try {
            // Apply screen shake
            this.ctx.save();
            this.screenShake.apply(this.ctx);

            // Draw scrolling background
            this.background.draw(this.ctx);

            // Draw playfield boundaries
            this.drawPlayfieldBoundaries();

            // Draw progress bar
            this.drawProgressBar();

            // Draw projectile trails (behind projectiles)
            this.projectileTrails.draw(this.ctx);

            // Draw game objects
            this.gateManager.draw(this.ctx);
            this.enemyManager.draw(this.ctx);
            this.player.draw(this.ctx);

            // Draw boss if active
            if (this.state === 'boss' && this.boss && this.boss.active) {
                this.drawBoss();
            }

            // Draw particles on top
            this.particleSystem.draw(this.ctx);

            // Restore context (remove screen shake)
            this.ctx.restore();
        } catch (e) {
            console.error('Render error:', e);
            // Make sure to restore context even if there's an error
            this.ctx.restore();
        }
    }

    drawBoss() {
        if (!this.boss || !this.boss.active) return;

        const healthPercent = this.boss.health / this.boss.maxHealth;
        const isEnraged = healthPercent < 0.30;

        // Boss body - massive hexagon (darker when enraged)
        let bossColor;
        if (isEnraged) {
            bossColor = '#660000'; // Darker red when enraged
        } else {
            bossColor = this.boss.isFinalBoss ? '#8B0000' : '#cc0000';
        }
        this.ctx.fillStyle = bossColor;
        this.ctx.beginPath();
        const sides = 6;
        const radius = this.boss.width / 2;
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
            const x = this.boss.x + radius * Math.cos(angle);
            const y = this.boss.y + radius * Math.sin(angle);
            if (i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Boss border (pulsing when enraged)
        this.ctx.strokeStyle = isEnraged ? '#ff0000' : '#fff';
        this.ctx.lineWidth = isEnraged ? 5 : 4;
        this.ctx.stroke();

        // Boss health bar
        const barWidth = this.boss.width;
        const barHeight = 15;

        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(
            this.boss.x - barWidth / 2,
            this.boss.y - this.boss.height / 2 - 25,
            barWidth,
            barHeight
        );

        this.ctx.fillStyle = isEnraged ? '#ff0000' : '#ff6666';
        this.ctx.fillRect(
            this.boss.x - barWidth / 2,
            this.boss.y - this.boss.height / 2 - 25,
            barWidth * healthPercent,
            barHeight
        );

        // Boss label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        const label = this.boss.isFinalBoss ? 'FINAL BOSS' : 'BOSS';
        const enragedLabel = isEnraged ? label + ' [ENRAGED]' : label;
        this.ctx.fillText(enragedLabel, this.boss.x, this.boss.y - this.boss.height / 2 - 35);

        // Boss HP number
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(Math.ceil(this.boss.health).toString(), this.boss.x, this.boss.y);
    }

    drawPlayfieldBoundaries() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;

        // Left boundary
        this.ctx.beginPath();
        this.ctx.moveTo(PLAYFIELD.MIN_X, 0);
        this.ctx.lineTo(PLAYFIELD.MIN_X, GAME.HEIGHT);
        this.ctx.stroke();

        // Right boundary
        this.ctx.beginPath();
        this.ctx.moveTo(PLAYFIELD.MAX_X, 0);
        this.ctx.lineTo(PLAYFIELD.MAX_X, GAME.HEIGHT);
        this.ctx.stroke();
    }

    drawProgressBar() {
        const progress = this.scrollDistance / GAME.LEVEL_LENGTH;
        const barWidth = 200;
        const barHeight = 20;
        const x = GAME.WIDTH - barWidth - 20;
        const y = 20;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Progress
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);

        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        // Text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.floor(progress * 100)}%`, x + barWidth / 2, y + barHeight / 2 + 4);
    }

    startBossBattle(progress) {
        this.state = 'boss';
        this.bossMinionTimer = 0;

        // Calculate boss HP based on player power
        const playerDPS = this.player.currentWeapon.damage * this.player.currentTroop.multiplier * this.player.getArmyMultiplier();
        const targetKillTime = 30; // seconds to kill boss
        const bossHP = Math.floor(playerDPS * targetKillTime * (1000 / this.player.currentWeapon.fireRate));

        this.boss = {
            x: GAME.WIDTH / 2,
            y: 150,
            width: 150,
            height: 150,
            health: bossHP,
            maxHealth: bossHP,
            active: true,
            isFinalBoss: progress >= 1.0
        };

        // Boss roar sound
        this.audioSystem.playBossRoar();
    }

    updateBossBattle(deltaTime) {
        if (!this.boss || !this.boss.active) {
            // Safety check - if boss is gone, return to playing
            if (this.state === 'boss') {
                this.state = 'playing';
            }
            return;
        }

        // Check if boss is enraged (below 30% HP)
        const healthPercent = this.boss.health / this.boss.maxHealth;
        const isEnraged = healthPercent < 0.30;

        // Spawn minion waves - faster when enraged
        const spawnInterval = isEnraged ? 1200 : 2000; // 1.2s when enraged, 2s normal
        this.bossMinionTimer += deltaTime;
        if (this.bossMinionTimer >= spawnInterval) {
            this.spawnBossMinions(isEnraged);
            this.bossMinionTimer = 0;
        }

        // Update existing enemies (minions still scroll during boss battle)
        this.enemyManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player, this);

        // Check projectile hits on boss
        this.player.projectiles = this.player.projectiles.filter(projectile => {
            if (!this.boss || !this.boss.active) return true; // Safety check

            const bossBounds = {
                x: this.boss.x - this.boss.width / 2,
                y: this.boss.y - this.boss.height / 2,
                width: this.boss.width,
                height: this.boss.height
            };

            if (this.checkCollision(projectile, bossBounds)) {
                this.boss.health -= projectile.damage;

                // Boss hit effects
                this.particleSystem.createBossHitEffect(projectile.x + projectile.width / 2, projectile.y);
                this.audioSystem.playBossHit();
                this.screenShake.shake(3, 100);

                if (this.boss.health <= 0) {
                    this.defeatBoss();
                    return false; // Remove projectile
                }

                // Piercing doesn't apply to bosses - consume projectile
                return false;
            }
            return true;
        });
    }

    spawnBossMinions(isEnraged = false) {
        if (!this.boss || !this.boss.active) return;

        // When enraged: 50% peons, 50% tanks (more dangerous)
        // Normal: 70% peons, 30% tanks
        const tankChance = isEnraged ? 0.50 : 0.30;
        const rand = Math.random();

        if (rand >= tankChance) {
            // Spawn peon wave (more when enraged)
            const baseCount = 3;
            const extraCount = Math.floor(Math.random() * 3); // 0-2 extra
            const enrageBonus = isEnraged ? 2 : 0; // +2 peons when enraged
            const count = baseCount + extraCount + enrageBonus;

            for (let i = 0; i < count; i++) {
                const offsetX = (i - count / 2) * 40;
                const x = this.boss.x + offsetX;
                const y = this.boss.y + this.boss.height / 2;

                this.enemyManager.enemies.push(new Enemy(x, y, 1, 1, 'SMALL'));
            }
        } else {
            // Spawn tanky unit(s) (more when enraged)
            const baseCount = Math.random() < 0.5 ? 1 : 2;
            const count = isEnraged ? baseCount + 1 : baseCount; // +1 tank when enraged
            const isFinalBoss = this.boss.isFinalBoss;

            for (let i = 0; i < count; i++) {
                const offsetX = (i - count / 2 + 0.5) * 60;
                const x = this.boss.x + offsetX;
                const y = this.boss.y + this.boss.height / 2;

                if (isFinalBoss) {
                    // Final boss: spawn 20-50 HP tanks (higher when enraged)
                    const minHP = isEnraged ? 30 : 20;
                    const maxHP = isEnraged ? 60 : 50;
                    const health = minHP + Math.floor(Math.random() * (maxHP - minHP + 1));
                    const cost = Math.floor(health / 2);
                    this.enemyManager.enemies.push(new Enemy(x, y, health, cost, 'MEDIUM'));
                } else {
                    // Mid boss: spawn 5-15 HP tanks (higher when enraged)
                    const minHP = isEnraged ? 10 : 5;
                    const maxHP = isEnraged ? 20 : 15;
                    const health = minHP + Math.floor(Math.random() * (maxHP - minHP + 1));
                    const cost = Math.floor(health / 2);
                    this.enemyManager.enemies.push(new Enemy(x, y, health, cost, 'MEDIUM'));
                }
            }
        }
    }

    defeatBoss() {
        // Boss death explosion
        this.particleSystem.createExplosion(this.boss.x, this.boss.y, '#ff0000', 30);
        this.audioSystem.playEnemyDeath('BOSS');
        this.screenShake.shake(10, 300);

        this.boss.active = false;
        this.stats.enemiesKilled++; // Count boss as kill

        if (this.boss.isFinalBoss) {
            // Final boss defeated - victory!
            this.boss100Defeated = true;
            this.gameOver(true);
        } else {
            // Mid-boss defeated - clear minions and continue
            this.boss50Defeated = true;
            this.enemyManager.enemies = []; // Clear all boss minions
            this.state = 'playing';
            this.boss = null;
        }
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    gameOver(victory) {
        this.state = victory ? 'victory' : 'gameover';

        if (victory) {
            // Check for flawless victory (no damage taken)
            if (!this.damageTaken) {
                this.gameOverText.textContent = 'Flawless Victory!';
            } else {
                this.gameOverText.textContent = 'Victory!';
            }
            this.gameOverScreen.classList.add('victory');
            this.audioSystem.playVictory();
        } else {
            this.gameOverText.textContent = 'Game Over';
            this.gameOverScreen.classList.remove('victory');
            this.audioSystem.playDefeat();
        }

        // Display stats
        document.getElementById('stat-kills').textContent = this.stats.enemiesKilled;
        document.getElementById('stat-max-army').textContent = this.stats.maxArmy;
        document.getElementById('stat-weapon').textContent = this.player.currentWeapon.name;
        document.getElementById('stat-troop').textContent = this.player.currentTroop.name;
        document.getElementById('stat-time').textContent = Math.floor(this.stats.timeElapsed) + 's';

        this.gameOverScreen.classList.remove('hidden');
    }

    restart() {
        // Reset game state
        this.state = 'playing';
        this.scrollDistance = 0;
        this.boss = null;
        this.bossMinionTimer = 0;
        this.boss50Defeated = false;
        this.boss100Defeated = false;

        // Reset stats
        this.stats = {
            enemiesKilled: 0,
            maxArmy: 30,
            timeElapsed: 0
        };
        this.damageTaken = false;

        // Reset game objects
        this.player = new Player();
        this.gateManager.reset();
        this.enemyManager.reset();

        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});
