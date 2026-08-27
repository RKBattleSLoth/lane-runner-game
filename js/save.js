// Save System using localStorage
class SaveSystem {
    constructor() {
        this.saveKey = 'zombieShooterSave';
        this.defaultSave = {
            completedLevels: [],
            levelScores: {}, // { levelId: { kills, time, flawless } }
            survivorPoints: 0,
            unlocks: {
                loadouts: [],
                passives: []
            },
            settings: {
                sfxVolume: 0.5,
                musicVolume: 0.3
            }
        };
    }

    // Load save data
    load() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                console.log('✓ Loaded save data:', parsed);
                return { ...this.defaultSave, ...parsed };
            }
        } catch (e) {
            console.error('Failed to load save:', e);
        }
        return { ...this.defaultSave };
    }

    // Save data
    save(data) {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            console.log('✓ Saved game data');
            return true;
        } catch (e) {
            console.error('Failed to save:', e);
            return false;
        }
    }

    // Mark level as completed
    completeLevel(levelId, stats) {
        const data = this.load();

        // Add to completed levels if not already there
        if (!data.completedLevels.includes(levelId)) {
            data.completedLevels.push(levelId);
        }

        // Calculate score and points
        const points = this.calculatePoints(stats);

        // Save high score if better than previous
        const prevScore = data.levelScores[levelId];
        if (!prevScore || stats.enemiesKilled > prevScore.kills) {
            data.levelScores[levelId] = {
                kills: stats.enemiesKilled,
                time: stats.timeElapsed,
                flawless: stats.flawless,
                points: points
            };
        }

        // Add survivor points
        data.survivorPoints += points;

        this.save(data);
        return points;
    }

    // Calculate points earned from level completion
    calculatePoints(stats) {
        let points = 0;

        // Base points from kills
        points += stats.enemiesKilled * 10;

        // Time bonus (faster = more points)
        const timeBonus = Math.max(0, 300 - Math.floor(stats.timeElapsed));
        points += timeBonus;

        // Flawless bonus
        if (stats.flawless) {
            points += 500;
        }

        return points;
    }

    // Check if level is completed
    isLevelCompleted(levelId) {
        const data = this.load();
        return data.completedLevels.includes(levelId);
    }

    // Get high score for level
    getLevelScore(levelId) {
        const data = this.load();
        return data.levelScores[levelId] || null;
    }

    // Unlock a loadout or passive
    unlock(type, id, cost) {
        const data = this.load();

        if (data.survivorPoints < cost) {
            return { success: false, message: 'Not enough Survivor Points' };
        }

        const unlockList = type === 'loadout' ? data.unlocks.loadouts : data.unlocks.passives;

        if (unlockList.includes(id)) {
            return { success: false, message: 'Already unlocked' };
        }

        unlockList.push(id);
        data.survivorPoints -= cost;

        this.save(data);
        return { success: true, message: 'Unlocked!' };
    }

    // Check if something is unlocked
    isUnlocked(type, id) {
        const data = this.load();
        const unlockList = type === 'loadout' ? data.unlocks.loadouts : data.unlocks.passives;
        return unlockList.includes(id);
    }

    // Reset save (for testing)
    reset() {
        localStorage.removeItem(this.saveKey);
        console.log('Save data reset');
    }
}

// Global save system instance
const saveSystem = new SaveSystem();
