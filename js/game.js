// Main Game Class
class Game {
    constructor(levelConfig = null) {
        // Load level configuration
        this.currentLevel = levelConfig || getLevel(1);

        // Apply level settings to global constants
        GAME.LEVEL_LENGTH = this.currentLevel.length;
        GAME.SCROLL_SPEED = this.currentLevel.scrollSpeed;

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME.WIDTH;
        this.canvas.height = GAME.HEIGHT;

        // Game state
        this.state = 'playing'; // 'playing', 'boss', 'gameover', 'victory'
        this.scrollDistance = 0;
        this.lastTime = 0;
        this.boss = null; // Single boss
        this.boss1 = null; // First boss for dual mode
        this.boss2 = null; // Second boss for dual mode
        this.isDualBoss = false; // Track if current boss is dual
        this.bossEnraged = false; // Track enraged state for dual bosses
        this.bossHyperEnraged = false; // Track hyper-enraged state (critical health)
        this.bossMinionTimer = 0;
        this.boss50Defeated = false;
        this.boss100Defeated = false;

        // Stats tracking (use level-specific starting values)
        const startingSurvivors = this.currentLevel?.startingSurvivors || PLAYER.INITIAL_ARMY;
        this.stats = {
            enemiesKilled: 0,
            maxArmy: startingSurvivors,
            timeElapsed: 0
        };
        this.damageTaken = false;

        // A/V Systems
        this.particleSystem = new ParticleSystem();
        this.audioSystem = new AudioFileSystem(); // Using file-based audio with variations
        this.screenShake = new ScreenShake();
        this.background = new ScrollingBackground(GAME.WIDTH, GAME.HEIGHT);
        this.projectileTrails = new ProjectileTrail();
        this.spriteManager = new SpriteManager();

        // Game objects
        this.player = new Player(this.currentLevel);
        this.gateManager = new GateManager(this.currentLevel);
        this.enemyManager = new EnemyManager(this.currentLevel);

        // UI elements
        this.armyDisplay = document.getElementById('army-number');
        this.weaponDisplay = document.getElementById('weapon-name');
        this.troopDisplay = document.getElementById('troop-name');
        this.weaponIconCanvas = document.getElementById('weapon-icon');
        this.weaponIconCtx = this.weaponIconCanvas ? this.weaponIconCanvas.getContext('2d') : null;
        this.gameOverScreen = document.getElementById('game-over');
        this.gameOverText = document.getElementById('game-over-text');
        this.restartBtn = document.getElementById('restart-btn');

        // Input handling
        this.keys = {};
        this.setupInput();

        // Initialize audio on first user interaction
        this.audioInitialized = false;

        // Load sprites then start game loop
        this.spritesLoaded = false;
        this.spriteManager.loadAllSprites().then(() => {
            this.spritesLoaded = true;
            console.log('✅ Sprites ready, starting game');
        }).catch(err => {
            console.warn('⚠️ Could not load sprites, using fallback graphics:', err);
            this.spritesLoaded = false;
        });

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.initAudio(); // Try to init audio on any key press

            // Weapon switching with number keys (only if unlocked)
            switch(e.key) {
                case '1':
                    this.player.switchWeapon('PISTOL');
                    break;
                case '2':
                    this.player.switchWeapon('RIFLE');
                    break;
                case '3':
                    this.player.switchWeapon('MACHINE_GUN');
                    break;
                case '4':
                    this.player.switchWeapon('SNIPER');
                    break;
                case '5':
                    this.player.switchWeapon('MOUNTED_MG');
                    break;
            }
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
            this.gateManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player);
            this.enemyManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player, this, deltaTime);

            // Check for boss triggers
            if (!this.boss50Defeated && this.scrollDistance >= GAME.LEVEL_LENGTH * 0.5) {
                this.startBossBattle(0.5);
            } else if (!this.boss100Defeated && this.scrollDistance >= GAME.LEVEL_LENGTH) {
                this.startBossBattle(1.0);
            }
        } else if (this.state === 'boss') {
            // Boss battle - no scrolling, update boss
            this.updateBossBattle(deltaTime);
            // Update gates during boss battle (for loot drops)
            this.gateManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player);
        }

        // Check collisions
        this.gateManager.checkCollisions(this.player, this);
        this.enemyManager.checkCollisions(this.player, this);

        // Update UI
        this.armyDisplay.textContent = this.player.army;
        this.weaponDisplay.textContent = this.player.currentWeapon.name;
        this.troopDisplay.textContent = this.player.currentTroop.name;

        // Draw weapon icon
        if (this.weaponIconCtx && this.spriteManager && this.spriteManager.loaded) {
            const iconMap = {
                'PISTOL': 'icon_pistol',
                'RIFLE': 'icon_rifle',
                'MACHINE_GUN': 'icon_mg',
                'SNIPER': 'icon_sniper',
                'MOUNTED_MG': 'icon_mg' // Use MG icon for Mounted MG
            };
            const iconKey = iconMap[this.player.weaponType];
            const iconSprite = this.spriteManager.getSprite(iconKey);

            if (iconSprite) {
                this.weaponIconCtx.clearRect(0, 0, 32, 32);
                this.weaponIconCtx.drawImage(iconSprite, 0, 0, 32, 32);
            }
        }

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
            this.background.draw(this.ctx, this.spriteManager);

            // Draw playfield boundaries
            this.drawPlayfieldBoundaries();

            // Draw progress bar
            this.drawProgressBar();

            // Draw projectile trails (behind projectiles)
            this.projectileTrails.draw(this.ctx);

            // Draw game objects
            this.gateManager.draw(this.ctx, this.spriteManager);
            this.enemyManager.draw(this.ctx, this.spriteManager);
            this.player.draw(this.ctx, this.spriteManager);

            // Draw boss(es) if active
            if (this.state === 'boss') {
                if (this.isDualBoss) {
                    if (this.boss1 && this.boss1.active) this.drawBoss(this.boss1);
                    if (this.boss2 && this.boss2.active) this.drawBoss(this.boss2);
                } else if (this.boss && this.boss.active) {
                    this.drawBoss(this.boss);
                }
            }

            // Draw particles on top
            this.particleSystem.draw(this.ctx, this.spriteManager);

            // Restore context (remove screen shake)
            this.ctx.restore();
        } catch (e) {
            console.error('Render error:', e);
            // Make sure to restore context even if there's an error
            this.ctx.restore();
        }
    }

    drawBoss(boss = null) {
        // Default to single boss if no parameter provided
        const bossToRender = boss || this.boss;
        if (!bossToRender || !bossToRender.active) return;

        const healthPercent = bossToRender.health / bossToRender.maxHealth;
        // For dual bosses, enraged is based on one boss dying
        // For single bosses, check for configured enraged states
        let isEnraged = false;
        let isHyperEnraged = false;

        if (this.isDualBoss) {
            isEnraged = this.bossEnraged;
        } else {
            // Check hyper-enraged first (more critical)
            if (this.bossHyperEnrageThreshold > 0 && healthPercent <= this.bossHyperEnrageThreshold) {
                isHyperEnraged = true;
                isEnraged = true; // Hyper-enraged implies enraged
            } else if (this.bossEnraged || healthPercent < 0.30) {
                isEnraged = true;
            }
        }

        // Try to draw boss zombie sprite with animation
        let drewSprite = false;
        if (this.spriteManager && this.spriteManager.loaded) {
            // Determine which animation frame to use
            const frameIndex = Math.floor(bossToRender.animationTime / bossToRender.animationSpeed) % 2;
            const frameName = frameIndex === 0 ? 'boss_zombie_frame1' : 'boss_zombie_frame2';
            const sprite = this.spriteManager.getSprite(frameName);

            if (sprite) {
                // Rotate boss to face down, apply red tint when enraged
                this.ctx.save();

                // Red tint for enraged/hyper-enraged boss
                if (isHyperEnraged) {
                    // Hyper-enraged: darker, more intense red
                    this.ctx.globalAlpha = 0.9;
                    this.ctx.fillStyle = '#cc0000';
                    this.ctx.beginPath();
                    this.ctx.arc(bossToRender.x, bossToRender.y, bossToRender.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1.0;
                } else if (isEnraged) {
                    // Regular enraged: lighter red
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.beginPath();
                    this.ctx.arc(bossToRender.x, bossToRender.y, bossToRender.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1.0;
                }

                drewSprite = this.spriteManager.drawSpriteRotated(
                    this.ctx,
                    sprite,
                    bossToRender.x,
                    bossToRender.y,
                    bossToRender.width,
                    bossToRender.height,
                    Math.PI / 2
                );
                this.ctx.restore();
            }
        }

        // Fallback to hexagon if sprite not available
        if (!drewSprite) {
            let bossColor;
            if (isHyperEnraged) {
                bossColor = '#330000'; // Very dark red when hyper-enraged
            } else if (isEnraged) {
                bossColor = '#660000'; // Darker red when enraged
            } else {
                bossColor = bossToRender.isFinalBoss ? '#8B0000' : '#cc0000';
            }
            this.ctx.fillStyle = bossColor;
            this.ctx.beginPath();
            const sides = 6;
            const radius = bossToRender.width / 2;
            for (let i = 0; i < sides; i++) {
                const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
                const x = bossToRender.x + radius * Math.cos(angle);
                const y = bossToRender.y + radius * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();

            // Boss border (pulsing when enraged)
            this.ctx.strokeStyle = isEnraged ? '#ff0000' : '#fff';
            this.ctx.lineWidth = isEnraged ? 5 : 4;
            this.ctx.stroke();
        }

        // Boss health bar
        const barWidth = bossToRender.width;
        const barHeight = 15;

        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(
            bossToRender.x - barWidth / 2,
            bossToRender.y - bossToRender.height / 2 - 25,
            barWidth,
            barHeight
        );

        this.ctx.fillStyle = isEnraged ? '#ff0000' : '#ff6666';
        this.ctx.fillRect(
            bossToRender.x - barWidth / 2,
            bossToRender.y - bossToRender.height / 2 - 25,
            barWidth * healthPercent,
            barHeight
        );

        // Boss label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        const label = bossToRender.isFinalBoss ? 'ZOMBIE OVERLORD' : 'HORDE LEADER';
        let enragedLabel = label;
        if (isHyperEnraged) {
            enragedLabel = label + ' [RAMPAGE]';
            this.ctx.fillStyle = '#ff0000'; // Red text for rampage
        } else if (isEnraged) {
            enragedLabel = label + ' [ENRAGED]';
        }
        this.ctx.fillText(enragedLabel, bossToRender.x, bossToRender.y - bossToRender.height / 2 - 35);

        // Boss HP number
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(Math.ceil(bossToRender.health).toString(), bossToRender.x, bossToRender.y);
    }

    drawPlayfieldBoundaries() {
        this.ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)'; // Brown apocalyptic boundaries
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

        // Get boss config from level
        const bossConfig = this.currentLevel.bosses?.find(b => b.at === progress) || { at: progress, isFinal: progress >= 1.0 };
        const isDualBoss = bossConfig.dualBoss || false;
        const oscillate = bossConfig.oscillate || false;
        const startEnraged = bossConfig.startEnraged || false;

        this.isDualBoss = isDualBoss;
        this.bossEnraged = startEnraged; // Start enraged if configured
        this.bossHyperEnraged = false;
        this.bossHyperEnrageThreshold = bossConfig.hyperEnrageAt || 0; // 0 means no hyper-enrage

        // Calculate boss HP based on player power
        const playerDPS = this.player.currentWeapon.damage * this.player.currentTroop.multiplier * this.player.getArmyMultiplier();

        // Scale kill time based on boss type
        // Mid-boss (50%): 15 seconds, Final boss (100%): 25 seconds
        const targetKillTime = progress >= 1.0 ? 25 : 15;

        const calculatedHP = Math.floor(playerDPS * targetKillTime * (1000 / this.player.currentWeapon.fireRate));

        // Set minimum HP based on boss type to prevent trivial bosses
        const minHP = progress >= 1.0 ? 200 : 100;
        const bossHP = Math.max(minHP, calculatedHP);

        const createBossObject = (startX, oscillateDirection = 0) => ({
            x: startX,
            y: 250, // Move boss down so it's not under the UI overlay
            width: 150,
            height: 150,
            health: bossHP,
            maxHealth: bossHP,
            active: true,
            isFinalBoss: progress >= 1.0,
            // Animation state
            animationTime: 0,
            animationSpeed: 400, // Slower animation for intimidating boss
            // Oscillation state
            oscillate: oscillate,
            oscillateSpeed: 2, // pixels per frame
            oscillateDirection: oscillateDirection // 1 = right, -1 = left
        });

        if (isDualBoss) {
            // Create two bosses
            this.boss1 = createBossObject(PLAYFIELD.MIN_X + 100, 1); // Start left, move right
            this.boss2 = createBossObject(PLAYFIELD.MAX_X - 100, -1); // Start right, move left
        } else {
            // Single boss (existing logic)
            this.boss = createBossObject(GAME.WIDTH / 2, 0);
        }

        // Boss roar sound
        this.audioSystem.playBossRoar();
    }

    updateBossBattle(deltaTime) {
        if (this.isDualBoss) {
            this.updateDualBossBattle(deltaTime);
        } else {
            this.updateSingleBossBattle(deltaTime);
        }
    }

    updateSingleBossBattle(deltaTime) {
        if (!this.boss || !this.boss.active) {
            // Safety check - if boss is gone, return to playing
            if (this.state === 'boss') {
                this.state = 'playing';
            }
            return;
        }

        // Update boss animation
        this.boss.animationTime += deltaTime;

        // Check boss enraged states
        const healthPercent = this.boss.health / this.boss.maxHealth;
        let isEnraged = this.bossEnraged || (healthPercent < 0.30);
        let isHyperEnraged = false;

        // Check for hyper-enraged transition
        if (this.bossHyperEnrageThreshold > 0 && healthPercent <= this.bossHyperEnrageThreshold) {
            if (!this.bossHyperEnraged) {
                // Just entered hyper-enraged state
                this.bossHyperEnraged = true;
                this.audioSystem.playBossRoar(); // Dramatic roar for critical phase
                this.screenShake.shake(15, 500); // Big screen shake
            }
            isHyperEnraged = true;
            isEnraged = true;
        }

        // Spawn minion waves - slower for mid-boss, faster for final boss
        const isFinalBoss = this.boss.isFinalBoss;
        const baseInterval = isFinalBoss ? 2000 : 3000; // Mid-boss: 3s, Final: 2s
        let spawnInterval = baseInterval;

        if (isHyperEnraged) {
            spawnInterval = baseInterval * 0.4; // 60% faster when hyper-enraged (was 0.6 for enraged)
        } else if (isEnraged) {
            spawnInterval = baseInterval * 0.6; // 40% faster when enraged
        }

        this.bossMinionTimer += deltaTime;
        if (this.bossMinionTimer >= spawnInterval) {
            this.spawnBossMinions(isEnraged, null, isHyperEnraged);
            this.bossMinionTimer = 0;
        }

        // Update existing enemies (minions still scroll during boss battle)
        this.enemyManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player, this, deltaTime);

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

    updateDualBossBattle(deltaTime) {
        // Check if both bosses are gone
        const boss1Dead = !this.boss1 || !this.boss1.active;
        const boss2Dead = !this.boss2 || !this.boss2.active;

        if (boss1Dead && boss2Dead) {
            // Both bosses defeated
            this.defeatBoss();
            return;
        }

        // Update animation and oscillation for active bosses
        if (this.boss1 && this.boss1.active) {
            this.boss1.animationTime += deltaTime;
            if (this.boss1.oscillate) {
                this.boss1.x += this.boss1.oscillateSpeed * this.boss1.oscillateDirection;
                // Reverse direction at boundaries
                if (this.boss1.x <= PLAYFIELD.MIN_X + this.boss1.width / 2) {
                    this.boss1.oscillateDirection = 1;
                    this.boss1.x = PLAYFIELD.MIN_X + this.boss1.width / 2;
                } else if (this.boss1.x >= PLAYFIELD.MAX_X - this.boss1.width / 2) {
                    this.boss1.oscillateDirection = -1;
                    this.boss1.x = PLAYFIELD.MAX_X - this.boss1.width / 2;
                }
            }
        }

        if (this.boss2 && this.boss2.active) {
            this.boss2.animationTime += deltaTime;
            if (this.boss2.oscillate) {
                this.boss2.x += this.boss2.oscillateSpeed * this.boss2.oscillateDirection;
                // Reverse direction at boundaries
                if (this.boss2.x <= PLAYFIELD.MIN_X + this.boss2.width / 2) {
                    this.boss2.oscillateDirection = 1;
                    this.boss2.x = PLAYFIELD.MIN_X + this.boss2.width / 2;
                } else if (this.boss2.x >= PLAYFIELD.MAX_X - this.boss2.width / 2) {
                    this.boss2.oscillateDirection = -1;
                    this.boss2.x = PLAYFIELD.MAX_X - this.boss2.width / 2;
                }
            }
        }

        // Check for enraged state (one boss dead)
        if ((boss1Dead || boss2Dead) && !this.bossEnraged) {
            this.bossEnraged = true;
            this.audioSystem.playBossRoar(); // Enrage roar
        }

        // Spawn minion waves
        const isFinalBoss = (this.boss1?.isFinalBoss || this.boss2?.isFinalBoss) || false;
        const baseInterval = isFinalBoss ? 2000 : 3000;
        const spawnInterval = this.bossEnraged ? baseInterval * 0.6 : baseInterval;

        this.bossMinionTimer += deltaTime;
        if (this.bossMinionTimer >= spawnInterval) {
            // Spawn minions from both active bosses
            if (this.boss1 && this.boss1.active) {
                this.spawnBossMinions(this.bossEnraged, this.boss1);
            }
            if (this.boss2 && this.boss2.active) {
                this.spawnBossMinions(this.bossEnraged, this.boss2);
            }
            this.bossMinionTimer = 0;
        }

        // Update existing enemies
        this.enemyManager.update(GAME.SCROLL_SPEED, this.scrollDistance, this.player, this, deltaTime);

        // Check projectile hits on both bosses
        this.player.projectiles = this.player.projectiles.filter(projectile => {
            let hitBoss = false;

            // Check boss1
            if (this.boss1 && this.boss1.active) {
                const boss1Bounds = {
                    x: this.boss1.x - this.boss1.width / 2,
                    y: this.boss1.y - this.boss1.height / 2,
                    width: this.boss1.width,
                    height: this.boss1.height
                };

                if (this.checkCollision(projectile, boss1Bounds)) {
                    this.boss1.health -= projectile.damage;

                    // Boss hit effects
                    this.particleSystem.createBossHitEffect(projectile.x + projectile.width / 2, projectile.y);
                    this.audioSystem.playBossHit();
                    this.screenShake.shake(3, 100);

                    if (this.boss1.health <= 0) {
                        this.boss1.active = false;
                        // Boss death explosion
                        this.particleSystem.createExplosion(this.boss1.x, this.boss1.y, '#ff0000', 30);
                        this.audioSystem.playEnemyDeath('BOSS');
                        this.screenShake.shake(10, 300);
                        this.stats.enemiesKilled++;
                    }

                    hitBoss = true;
                }
            }

            // Check boss2
            if (this.boss2 && this.boss2.active) {
                const boss2Bounds = {
                    x: this.boss2.x - this.boss2.width / 2,
                    y: this.boss2.y - this.boss2.height / 2,
                    width: this.boss2.width,
                    height: this.boss2.height
                };

                if (this.checkCollision(projectile, boss2Bounds)) {
                    this.boss2.health -= projectile.damage;

                    // Boss hit effects
                    this.particleSystem.createBossHitEffect(projectile.x + projectile.width / 2, projectile.y);
                    this.audioSystem.playBossHit();
                    this.screenShake.shake(3, 100);

                    if (this.boss2.health <= 0) {
                        this.boss2.active = false;
                        // Boss death explosion
                        this.particleSystem.createExplosion(this.boss2.x, this.boss2.y, '#ff0000', 30);
                        this.audioSystem.playEnemyDeath('BOSS');
                        this.screenShake.shake(10, 300);
                        this.stats.enemiesKilled++;
                    }

                    hitBoss = true;
                }
            }

            // Remove projectile if it hit a boss (no piercing on bosses)
            return !hitBoss;
        });
    }

    spawnBossMinions(isEnraged = false, boss = null, isHyperEnraged = false) {
        // Default to single boss if no boss parameter provided
        const bossToUse = boss || this.boss;
        if (!bossToUse || !bossToUse.active) return;

        const isFinalBoss = bossToUse.isFinalBoss;

        // Hyper-enraged (RAMPAGE): 0% peons, 100% tanks (pure chaos)
        // Enraged: 50% peons, 50% tanks (more dangerous)
        // Normal: 70% peons, 30% tanks
        let tankChance = 0.30;
        if (isHyperEnraged) {
            tankChance = 1.0; // 100% tanks, no peons
        } else if (isEnraged) {
            tankChance = 0.50;
        }
        const rand = Math.random();

        if (rand >= tankChance) {
            // Spawn peon wave (scaled for boss type)
            const baseCount = isFinalBoss ? 3 : 2; // Mid-boss: 2, Final: 3
            const extraCount = Math.floor(Math.random() * (isFinalBoss ? 3 : 2)); // Mid: 0-1, Final: 0-2
            let enrageBonus = 0;
            if (isHyperEnraged && isFinalBoss) {
                enrageBonus = 3; // +3 peons when hyper-enraged (critical phase)
            } else if (isEnraged && isFinalBoss) {
                enrageBonus = 1; // +1 when enraged
            }
            const count = baseCount + extraCount + enrageBonus;

            for (let i = 0; i < count; i++) {
                const offsetX = (i - count / 2) * 40;
                let x = bossToUse.x + offsetX;
                const y = bossToUse.y + bossToUse.height / 2;

                // Clamp to playfield boundaries (with small margin for enemy width)
                x = Math.max(PLAYFIELD.MIN_X + 15, Math.min(x, PLAYFIELD.MAX_X - 15));

                this.enemyManager.enemies.push(new Enemy(x, y, 1, 1, 'SMALL'));
            }
        } else {
            // Spawn tanky unit(s) (more when enraged/hyper-enraged)
            const baseCount = isFinalBoss ? (Math.random() < 0.5 ? 1 : 2) : 1; // Mid-boss: 1, Final: 1-2
            let count = baseCount;
            if (isHyperEnraged) {
                count = baseCount + 2; // +2 tanks when hyper-enraged
            } else if (isEnraged) {
                count = baseCount + 1; // +1 tank when enraged
            }

            for (let i = 0; i < count; i++) {
                const offsetX = (i - count / 2 + 0.5) * 60;
                let x = bossToUse.x + offsetX;
                const y = bossToUse.y + bossToUse.height / 2;

                // Clamp to playfield boundaries (with small margin for enemy width)
                x = Math.max(PLAYFIELD.MIN_X + 20, Math.min(x, PLAYFIELD.MAX_X - 20));

                if (isFinalBoss) {
                    // Final boss: spawn tanks with varying HP based on enraged state
                    let minHP, maxHP;
                    if (isHyperEnraged) {
                        minHP = 30;
                        maxHP = 60; // Hyper-enraged: much tankier minions
                    } else if (isEnraged) {
                        minHP = 20;
                        maxHP = 40; // Enraged
                    } else {
                        minHP = 15;
                        maxHP = 35; // Normal
                    }
                    const health = minHP + Math.floor(Math.random() * (maxHP - minHP + 1));
                    const cost = Math.floor(health / 2);
                    this.enemyManager.enemies.push(new Enemy(x, y, health, cost, 'MEDIUM'));
                } else {
                    // Mid boss: spawn 3-8 HP tanks (lower than before)
                    const minHP = isEnraged ? 5 : 3;
                    const maxHP = isEnraged ? 10 : 8;
                    const health = minHP + Math.floor(Math.random() * (maxHP - minHP + 1));
                    const cost = Math.floor(health / 2);
                    this.enemyManager.enemies.push(new Enemy(x, y, health, cost, 'MEDIUM'));
                }
            }
        }
    }

    defeatBoss() {
        if (this.isDualBoss) {
            // Dual boss mode - both bosses defeated
            const isFinalBoss = (this.boss1?.isFinalBoss || this.boss2?.isFinalBoss) || false;

            if (isFinalBoss) {
                // Final boss defeated - victory!
                this.boss100Defeated = true;
                this.gameOver(true);
            } else {
                // Mid-boss defeated - drop loot if configured
                this.boss50Defeated = true;

                // Check if this level has a boss loot drop configured
                const bossConfig = this.currentLevel.bosses?.find(b => b.at === 0.5);
                if (bossConfig?.dropLoot) {
                    // Spawn loot gate at center of screen (where bosses were)
                    const lootX = GAME.WIDTH / 2;
                    const lootY = 250; // Same Y as boss position
                    const lootGate = new Gate(lootX, lootY, bossConfig.dropLoot, this.scrollDistance);
                    lootGate.isLoot = true; // Mark as loot so it moves toward player
                    lootGate.lootVelocity = 2; // Speed at which it moves down
                    this.gateManager.gates.push(lootGate);
                }

                this.enemyManager.enemies = []; // Clear all boss minions
                this.state = 'playing';
                this.boss1 = null;
                this.boss2 = null;
                this.isDualBoss = false;
                this.bossEnraged = false;
            }
        } else {
            // Single boss mode
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
                // Mid-boss defeated - drop loot if configured
                this.boss50Defeated = true;

                // Check if this level has a boss loot drop configured
                const bossConfig = this.currentLevel.bosses?.find(b => b.at === 0.5);
                if (bossConfig?.dropLoot) {
                    // Spawn loot gate at boss position
                    const lootGate = new Gate(this.boss.x, this.boss.y, bossConfig.dropLoot, this.scrollDistance);
                    lootGate.isLoot = true; // Mark as loot so it moves toward player
                    lootGate.lootVelocity = 2; // Speed at which it moves down
                    this.gateManager.gates.push(lootGate);
                }

                this.enemyManager.enemies = []; // Clear all boss minions
                this.state = 'playing';
                this.boss = null;
            }
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
            // Save level completion
            const levelStats = {
                enemiesKilled: this.stats.enemiesKilled,
                timeElapsed: this.stats.timeElapsed,
                flawless: !this.damageTaken
            };
            const pointsEarned = saveSystem.completeLevel(this.currentLevel.id, levelStats);

            // Check for flawless victory (no damage taken)
            if (!this.damageTaken) {
                this.gameOverText.textContent = `Flawless Victory! +${pointsEarned} Points`;
            } else {
                this.gameOverText.textContent = `Victory! +${pointsEarned} Points`;
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
        this.boss1 = null;
        this.boss2 = null;
        this.isDualBoss = false;
        this.bossEnraged = false;
        this.bossHyperEnraged = false;
        this.bossHyperEnrageThreshold = 0;
        this.bossMinionTimer = 0;
        this.boss50Defeated = false;
        this.boss100Defeated = false;

        // Reset stats
        const startingSurvivors = this.currentLevel?.startingSurvivors || PLAYER.INITIAL_ARMY;
        this.stats = {
            enemiesKilled: 0,
            maxArmy: startingSurvivors,
            timeElapsed: 0
        };
        this.damageTaken = false;

        // Reset game objects
        this.player = new Player(this.currentLevel);
        this.gateManager.reset();
        this.enemyManager.reset();

        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    // Check for selected level from level select screen
    const selectedLevelId = parseInt(sessionStorage.getItem('selectedLevel')) || 1;
    const levelConfig = getLevel(selectedLevelId);

    if (!levelConfig) {
        console.error(`Level ${selectedLevelId} not found, defaulting to Level 1`);
        new Game(getLevel(1));
    } else {
        console.log(`Loading Level ${selectedLevelId}: ${levelConfig.name}`);
        new Game(levelConfig);
    }
});
