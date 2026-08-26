// Audio System using Web Audio API with file loading
class AudioFileSystem {
    constructor() {
        this.context = null;
        this.enabled = false;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        this.musicGain = null;

        // Throttling for frequent sounds
        this.lastShootTime = 0;
        this.shootThrottle = 50;
        this.lastEnemyDeathTime = 0;
        this.enemyDeathThrottle = 30;

        // Audio buffers (loaded from files)
        this.buffers = {};
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.enabled = true;

            // Create gain node for music
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.context.destination);

            // Try to load sound files
            await this.loadSounds();

            return true;
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            return false;
        }
    }

    async loadSounds() {
        // Load the base shoot sound (try MP3 first, then WAV)
        try {
            let response = await fetch('sounds/shoot.mp3');
            if (!response.ok) {
                response = await fetch('sounds/shoot.wav');
            }

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                this.buffers.shoot = await this.context.decodeAudioData(arrayBuffer);
                console.log('✓ Loaded shoot sound');
            } else {
                console.warn('shoot.mp3/shoot.wav not found - using procedural sounds');
            }
        } catch (e) {
            console.warn('Could not load shoot sound:', e);
        }
    }

    // Play buffer with variations
    playBuffer(buffer, options = {}) {
        if (!this.enabled || !this.context || !buffer) return;

        try {
            const source = this.context.createBufferSource();
            const gainNode = this.context.createGain();

            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.context.destination);

            // Apply variations
            const pitch = options.pitch || 1.0; // 1.0 = normal, 2.0 = octave up, 0.5 = octave down
            const volume = options.volume !== undefined ? options.volume : this.sfxVolume;
            const delay = options.delay || 0;

            source.playbackRate.value = pitch;
            gainNode.gain.value = volume;

            // Optional filter
            if (options.filter) {
                const filter = this.context.createBiquadFilter();
                filter.type = options.filter.type || 'lowpass';
                filter.frequency.value = options.filter.frequency || 1000;
                source.disconnect();
                source.connect(filter);
                filter.connect(gainNode);
            }

            const startTime = this.context.currentTime + delay;
            source.start(startTime);

            return source;
        } catch (e) {
            console.error('Error playing buffer:', e);
        }
    }

    playShoot(weaponType) {
        if (!this.enabled || !this.context) return;

        // Throttle shooting sounds
        const now = Date.now();
        if (now - this.lastShootTime < this.shootThrottle) return;
        this.lastShootTime = now;

        if (this.buffers.shoot) {
            // Use the loaded sound file with variations per weapon
            const variations = {
                'PISTOL': { pitch: 1.0, volume: this.sfxVolume * 0.15 },
                'RIFLE': { pitch: 0.9, volume: this.sfxVolume * 0.18 },
                'MACHINE_GUN': { pitch: 1.2, volume: this.sfxVolume * 0.12 },
                'SNIPER': { pitch: 0.7, volume: this.sfxVolume * 0.2, filter: { type: 'lowpass', frequency: 800 } }
            };

            const variation = variations[weaponType] || variations['PISTOL'];
            this.playBuffer(this.buffers.shoot, variation);
        } else {
            // Fallback to procedural sound
            this.playShootProcedural(weaponType);
        }
    }

    playEnemyDeath(enemyType) {
        if (!this.enabled || !this.context) return;

        // Throttle enemy death sounds
        const now = Date.now();
        if (now - this.lastEnemyDeathTime < this.enemyDeathThrottle) return;
        this.lastEnemyDeathTime = now;

        if (this.buffers.shoot) {
            // Use shoot sound reversed and pitch-shifted for deaths
            const variations = {
                'SMALL': { pitch: 1.5, volume: this.sfxVolume * 0.1 },
                'MEDIUM': { pitch: 1.2, volume: this.sfxVolume * 0.15 },
                'BOSS': { pitch: 0.6, volume: this.sfxVolume * 0.25 }
            };

            const variation = variations[enemyType] || variations['SMALL'];
            this.playBuffer(this.buffers.shoot, variation);
        } else {
            // Fallback to procedural sound
            this.playEnemyDeathProcedural(enemyType);
        }
    }

    playGatePickup() {
        if (!this.enabled || !this.context) return;

        if (this.buffers.shoot) {
            // Use shoot sound pitched up for pickups
            this.playBuffer(this.buffers.shoot, {
                pitch: 2.0,
                volume: this.sfxVolume * 0.2,
                filter: { type: 'highpass', frequency: 500 }
            });
        } else {
            this.playGatePickupProcedural();
        }
    }

    playBossRoar() {
        if (!this.enabled || !this.context) return;

        if (this.buffers.shoot) {
            // Use shoot sound very low and stretched
            this.playBuffer(this.buffers.shoot, {
                pitch: 0.4,
                volume: this.sfxVolume * 0.3,
                filter: { type: 'lowpass', frequency: 400 }
            });
        } else {
            this.playBossRoarProcedural();
        }
    }

    playBossHit() {
        if (!this.enabled || !this.context) return;

        if (this.buffers.shoot) {
            // Use shoot sound low and punchy
            this.playBuffer(this.buffers.shoot, {
                pitch: 0.5,
                volume: this.sfxVolume * 0.25
            });
        } else {
            this.playBossHitProcedural();
        }
    }

    playVictory() {
        if (!this.enabled || !this.context) return;

        if (this.buffers.shoot) {
            // Play a quick arpeggio using the shoot sound
            const notes = [1.0, 1.25, 1.5, 2.0]; // C, E, G, C intervals
            notes.forEach((pitch, i) => {
                this.playBuffer(this.buffers.shoot, {
                    pitch: pitch,
                    volume: this.sfxVolume * 0.15,
                    delay: i * 0.15
                });
            });
        } else {
            this.playVictoryProcedural();
        }
    }

    playDefeat() {
        if (!this.enabled || !this.context) return;

        if (this.buffers.shoot) {
            // Descending sound
            this.playBuffer(this.buffers.shoot, {
                pitch: 0.5,
                volume: this.sfxVolume * 0.25,
                filter: { type: 'lowpass', frequency: 300 }
            });
        } else {
            this.playDefeatProcedural();
        }
    }

    // Procedural fallbacks (from original audio.js)
    playShootProcedural(weaponType) {
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            const shootVolume = this.sfxVolume * 0.15;

            oscillator.start();

            switch(weaponType) {
                case 'PISTOL':
                    oscillator.frequency.value = 200;
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(shootVolume * 0.8, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                    oscillator.stop(this.context.currentTime + 0.1);
                    break;
                case 'RIFLE':
                    oscillator.frequency.value = 300;
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(shootVolume * 0.9, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
                    oscillator.stop(this.context.currentTime + 0.15);
                    break;
                case 'MACHINE_GUN':
                    oscillator.frequency.value = 150;
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(shootVolume * 0.6, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
                    oscillator.stop(this.context.currentTime + 0.08);
                    break;
                case 'SNIPER':
                    oscillator.frequency.value = 400;
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(shootVolume, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                    oscillator.stop(this.context.currentTime + 0.3);
                    break;
            }
        } catch (e) {
            console.error('Audio playShoot error:', e);
        }
    }

    playEnemyDeathProcedural(enemyType) {
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            const deathVolume = this.sfxVolume * 0.15;

            oscillator.type = 'sawtooth';
            oscillator.start();

            switch(enemyType) {
                case 'SMALL':
                    oscillator.frequency.setValueAtTime(600, this.context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);
                    gainNode.gain.setValueAtTime(deathVolume * 0.7, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                    oscillator.stop(this.context.currentTime + 0.1);
                    break;
                case 'MEDIUM':
                    oscillator.frequency.setValueAtTime(400, this.context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(deathVolume, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                    oscillator.stop(this.context.currentTime + 0.2);
                    break;
                case 'BOSS':
                    oscillator.frequency.setValueAtTime(200, this.context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.4);
                    gainNode.gain.setValueAtTime(deathVolume * 1.5, this.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
                    oscillator.stop(this.context.currentTime + 0.4);
                    break;
            }
        } catch (e) {
            console.error('Audio playEnemyDeath error:', e);
        }
    }

    playGatePickupProcedural() {
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.1);

            gainNode.gain.value = this.sfxVolume * 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);

            oscillator.start();
            oscillator.stop(this.context.currentTime + 0.2);
        } catch (e) {
            console.error('Audio playGatePickup error:', e);
        }
    }

    playBossRoarProcedural() {
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);

            gainNode.gain.value = this.sfxVolume * 0.4;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(this.context.currentTime + 0.5);
        } catch (e) {
            console.error('Audio playBossRoar error:', e);
        }
    }

    playBossHitProcedural() {
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.type = 'square';
            oscillator.frequency.value = 150;

            gainNode.gain.value = this.sfxVolume * 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(this.context.currentTime + 0.1);
        } catch (e) {
            console.error('Audio playBossHit error:', e);
        }
    }

    playVictoryProcedural() {
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const oscillator = this.context.createOscillator();
                const gainNode = this.context.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.context.destination);

                oscillator.type = 'sine';
                oscillator.frequency.value = freq;

                const startTime = this.context.currentTime + (i * 0.15);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);
            });
        } catch (e) {
            console.error('Audio playVictory error:', e);
        }
    }

    playDefeatProcedural() {
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, this.context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 1.0);

            gainNode.gain.value = this.sfxVolume * 0.3;
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1.0);

            oscillator.start();
            oscillator.stop(this.context.currentTime + 1.0);
        } catch (e) {
            console.error('Audio playDefeat error:', e);
        }
    }
}
