// Audio System using Web Audio API
class AudioSystem {
    constructor() {
        this.context = null;
        this.enabled = false;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        this.musicGain = null;

        // Throttling for frequent sounds
        this.lastShootTime = 0;
        this.shootThrottle = 50; // Only play shooting sound every 50ms max
        this.lastEnemyDeathTime = 0;
        this.enemyDeathThrottle = 30; // Only play enemy death every 30ms max
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.enabled = true;

            // Create gain node for music
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.context.destination);

            return true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            return false;
        }
    }

    // Procedural sound generation
    playShoot(weaponType) {
        if (!this.enabled || !this.context) return;

        // Throttle shooting sounds - too many audio nodes causes issues
        const now = Date.now();
        if (now - this.lastShootTime < this.shootThrottle) return;
        this.lastShootTime = now;

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

        // Different sounds per weapon - reduce volume as shooting is frequent
        const shootVolume = this.sfxVolume * 0.15;
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

        oscillator.start();
        } catch (e) {
            console.error('Audio playShoot error:', e);
        }
    }

    playEnemyDeath(enemyType) {
        if (!this.enabled || !this.context) return;

        // Throttle enemy death sounds - happens very frequently
        const now = Date.now();
        if (now - this.lastEnemyDeathTime < this.enemyDeathThrottle) return;
        this.lastEnemyDeathTime = now;

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Reduce volume for enemy deaths
        const deathVolume = this.sfxVolume * 0.15;

        // Different sounds based on enemy size
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

        oscillator.type = 'sawtooth';
        oscillator.start();
        } catch (e) {
            console.error('Audio playEnemyDeath error:', e);
        }
    }

    playGatePickup() {
        if (!this.enabled || !this.context) return;
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

    playBossRoar() {
        if (!this.enabled || !this.context) return;
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

    playBossHit() {
        if (!this.enabled || !this.context) return;
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

    playVictory() {
        if (!this.enabled || !this.context) return;
        try {
            // Victory arpeggio
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
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

    playDefeat() {
        if (!this.enabled || !this.context) return;
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

    // Simple background music loop
    startMusic(isBossBattle = false) {
        if (!this.enabled || this.currentMusic) return;

        const oscillator = this.context.createOscillator();
        oscillator.connect(this.musicGain);

        if (isBossBattle) {
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 110; // A2 - darker, more intense
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.value = 220; // A3 - lighter combat theme
        }

        oscillator.start();
        this.currentMusic = oscillator;
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
}
