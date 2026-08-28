// Level Definitions and Configuration
const LEVELS = {
    1: {
        id: 1,
        name: "City Streets",
        description: "Survive the initial outbreak in the city",
        length: 6000,
        scrollSpeed: 0.7,
        difficulty: {
            spawnIntervalStart: 45,
            spawnIntervalEnd: 18,
            scalingStart: 0.40, // When enemies start getting stronger
            zombieSpeed: 1.0 // Multiplier for zombie movement
        },
        zombieTypes: {
            small: 0.90,  // 90% basic zombies
            medium: 0.07, // 7% tougher
            boss: 0.03    // 3% mini-bosses
        },
        bosses: [
            { at: 0.5, isFinal: false },
            { at: 1.0, isFinal: true }
        ],
        theme: {
            bgTileRange: [1, 20], // Which background tiles to use
            color: '#1a1a1a'
        },
        unlocked: true
    },

    2: {
        id: 2,
        name: "Highway Evacuation",
        description: "Fast zombies chase fleeing vehicles",
        length: 7000,
        scrollSpeed: 0.9,
        difficulty: {
            spawnIntervalStart: 55, // Much slower spawn rate (was 40)
            spawnIntervalEnd: 25, // Less dense at end (was 15)
            scalingStart: 0.50, // Scale later (was 0.35)
            zombieSpeed: 1.3, // Faster zombies!
            healthMultiplier: 0.7 // 30% less HP to compensate for speed
        },
        zombieTypes: {
            small: 0.92,  // More weak zombies (was 0.85)
            medium: 0.06, // Fewer medium (was 0.10)
            boss: 0.02    // Fewer bosses (was 0.05)
        },
        bosses: [
            { at: 0.5, isFinal: false, dualBoss: true, oscillate: true, dropLoot: 'WEAPON_MG' }, // Twin bosses drop MG
            { at: 1.0, isFinal: true, dualBoss: true, oscillate: true } // Twin oscillating bosses
        ],
        weaponRestrictions: {
            exclude: ['WEAPON_SNIPER', 'WEAPON_MG'] // No sniper in fast level, MG is boss loot
        },
        theme: {
            bgTileRange: [1, 20], // All levels use same tiles for now
            color: '#2a2a2a'
        },
        requiredLevel: 1,
        unlocked: false
    },

    3: {
        id: 3,
        name: "Shopping Mall",
        description: "Dense horde, overwhelming numbers",
        length: 8000,
        scrollSpeed: 0.7,
        difficulty: {
            spawnIntervalStart: 35,
            spawnIntervalEnd: 12,
            scalingStart: 0.30,
            zombieSpeed: 1.1
        },
        zombieTypes: {
            small: 0.80,
            medium: 0.15,
            boss: 0.05
        },
        bosses: [
            { at: 0.5, isFinal: false, dropLoot: 'WEAPON_SNIPER' }, // Drops Sniper
            { at: 1.0, isFinal: true }
        ],
        weaponRestrictions: {
            exclude: ['WEAPON_SNIPER'] // Sniper is boss loot
        },
        theme: {
            bgTileRange: [1, 20],
            color: '#151515'
        },
        requiredLevel: 2,
        unlocked: false
    },

    4: {
        id: 4,
        name: "Hospital Outbreak",
        description: "Tank zombies and hazmat horrors",
        length: 9000,
        scrollSpeed: 0.6,
        startingSurvivors: 100, // More survivors to handle tankier zombies
        difficulty: {
            spawnIntervalStart: 40,
            spawnIntervalEnd: 16,
            scalingStart: 0.25,
            zombieSpeed: 0.9, // Slower but tankier
            healthMultiplier: 2.0 // Zombies have 2x health
        },
        zombieTypes: {
            small: 0.70,  // Fewer weak zombies
            medium: 0.20, // More tanks
            boss: 0.10
        },
        bosses: [
            { at: 0.3, isFinal: false },
            { at: 0.6, isFinal: false },
            { at: 1.0, isFinal: true }
        ],
        theme: {
            bgTileRange: [1, 20],
            color: '#1a1a20'
        },
        requiredLevel: 3,
        unlocked: false
    },

    5: {
        id: 5,
        name: "Military Base - Boss Rush",
        description: "Face the ultimate horde",
        length: 10000,
        scrollSpeed: 0.8,
        startingWeapon: 'RIFLE', // Start with Rifle
        startingTroop: 'TANK', // Start with Military troops
        difficulty: {
            spawnIntervalStart: 30,
            spawnIntervalEnd: 10,
            scalingStart: 0.20,
            zombieSpeed: 1.2,
            healthMultiplier: 1.5
        },
        zombieTypes: {
            small: 0.60,  // All types mixed
            medium: 0.25,
            boss: 0.15    // Way more mini-bosses
        },
        bosses: [
            { at: 0.25, isFinal: false },
            { at: 0.50, isFinal: false, dropLoot: 'WEAPON_MOUNTED_MG' }, // Drops Mounted MG
            { at: 0.75, isFinal: false },
            { at: 1.0, isFinal: true, startEnraged: true, hyperEnrageAt: 0.25 } // Starts enraged, goes RAMPAGE at 25% HP
        ],
        weaponRestrictions: {
            exclude: ['WEAPON_RIFLE', 'WEAPON_MOUNTED_MG'], // Already have rifle, Mounted MG is boss loot
            noTroopUpgrades: true, // No troop upgrades
            noWeaponsAfter: 0.5, // No weapon spawns after 50% - only army buffs
            weaponSpawnRate: 0.25 // 25% weapons (MG/Sniper only), 75% army (before 50%)
        },
        theme: {
            bgTileRange: [1, 20],
            color: '#0a0a0a'
        },
        requiredLevel: 4,
        unlocked: false
    }
};

// Get level by ID
function getLevel(levelId) {
    return LEVELS[levelId] || null;
}

// Get all levels as array
function getAllLevels() {
    return Object.values(LEVELS).sort((a, b) => a.id - b.id);
}

// Check if level is unlocked
function isLevelUnlocked(levelId, saveData) {
    const level = getLevel(levelId);
    if (!level) return false;
    if (level.unlocked) return true; // Level 1 always unlocked

    // Check if required level is completed
    if (level.requiredLevel && saveData) {
        const requiredCompleted = saveData.completedLevels &&
                                  saveData.completedLevels.includes(level.requiredLevel);
        return requiredCompleted;
    }

    return false;
}
