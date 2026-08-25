// Audio System using Web Audio API
class AudioSystem {
    constructor() {
        this.context = null;
        this.enabled = false;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.currentMusic = null;
        this.musicGain = null;
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
        if (!this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.value = this.sfxVolume * 0.3;

        // Different sounds per weapon
        switch(weaponType) {
            case 'PISTOL':
                oscillator.frequency.value = 200;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                oscillator.stop(this.context.currentTime + 0.1);
                break;
            case 'RIFLE':
                oscillator.frequency.value = 300;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
                oscillator.stop(this.context.currentTime + 0.15);
                break;
            case 'MACHINE_GUN':
                oscillator.frequency.value = 150;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
                oscillator.stop(this.context.currentTime + 0.08);
                break;
            case 'SNIPER':
                oscillator.frequency.value = 400;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.4, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                oscillator.stop(this.context.currentTime + 0.3);
                break;
        }

        oscillator.start();
    }

    playEnemyDeath(enemyType) {
        if (!this.enabled) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.value = this.sfxVolume * 0.2;

        // Different sounds based on enemy size
        switch(enemyType) {
            case 'SMALL':
                oscillator.frequency.setValueAtTime(600, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                oscillator.stop(this.context.currentTime + 0.1);
                break;
            case 'MEDIUM':
                oscillator.frequency.setValueAtTime(400, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                oscillator.stop(this.context.currentTime + 0.2);
                break;
            case 'BOSS':
                oscillator.frequency.setValueAtTime(200, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
                oscillator.stop(this.context.currentTime + 0.4);
                break;
        }

        oscillator.type = 'sawtooth';
        oscillator.start();
    }

    playGatePickup() {
        if (!this.enabled) return;

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
    }

    playBossRoar() {
        if (!this.enabled) return;

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
    }

    playBossHit() {
        if (!this.enabled) return;

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
    }

    playVictory() {
        if (!this.enabled) return;

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
    }

    playDefeat() {
        if (!this.enabled) return;

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
