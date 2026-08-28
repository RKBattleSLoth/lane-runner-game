// Game Constants
const GAME = {
    WIDTH: 400,
    HEIGHT: 800,
    SCROLL_SPEED: 1.4, // Increased for 60 FPS baseline (was 0.7)
    LEVEL_LENGTH: 10000, // pixels until level end
};

const PLAYER = {
    WIDTH: 40,
    HEIGHT: 40,
    COLOR: '#8B7355', // Survivor - tan/brown human color
    INITIAL_ARMY: 30,
    MOVE_SPEED: 5.0, // Increased for 60 FPS baseline (was 2.5)
    FIRE_RATE: 150, // milliseconds between shots

    // Survivor squad multipliers (defined in player.js getArmyMultiplier):
    // 50+: 1.25×, 100+: 1.5×, 200+: 2×, 500+: 3×, 1000+: 4.5×, 2000+: 6.5×, 5000+: 10×, 10000+: 14×
};

const WEAPON_TYPES = {
    PISTOL: {
        name: 'Pistol',
        damage: 1,
        color: '#ffff00',
        fireRate: 200,
        piercing: 0,
        symbol: '🔫'
    },
    RIFLE: {
        name: 'Rifle',
        damage: 3,
        color: '#ff8800',
        fireRate: 200,
        piercing: 0,
        symbol: '🔫'
    },
    MACHINE_GUN: {
        name: 'MG',
        damage: 2,
        color: '#ff0000',
        fireRate: 100,
        piercing: 0,
        symbol: '💥'
    },
    SNIPER: {
        name: 'Sniper',
        damage: 10,
        color: '#00ffff',
        fireRate: 500,
        piercing: 3, // Can pierce through 3 enemies
        symbol: '🎯'
    },
    MOUNTED_MG: {
        name: 'Mounted MG',
        damage: 3, // 50% more than MG
        color: '#ff4400',
        fireRate: 100, // Same as MG
        piercing: 0,
        multiDirectional: true, // Shoots in 3 directions
        symbol: '💥💥'
    }
};

const TROOP_TYPES = {
    SOLDIER: {
        name: 'Civilian',
        color: '#7B9B7B', // Olive green - basic survivor
        multiplier: 1,
        projectileWidth: 8,
        symbol: '👤'
    },
    TANK: {
        name: 'Military',
        color: '#4A5D4A', // Dark military green
        multiplier: 5, // 1 military = 5 civilians in power
        projectileWidth: 16, // Heavy ordnance - easier to hit
        symbol: '🛡️'
    },
    SPECIALIST: {
        name: 'Veteran',
        color: '#6B4423', // Brown - experienced survivor
        multiplier: 3,
        projectileWidth: 12, // Precision firepower
        symbol: '⭐'
    }
};

const PLAYFIELD = {
    MIN_X: 30, // Left boundary
    MAX_X: 370, // Right boundary (GAME.WIDTH - 30)
    get WIDTH() {
        return this.MAX_X - this.MIN_X;
    }
};

const GATES = {
    WIDTH: 80,
    HEIGHT: 70,
    SPAWN_INTERVAL: 700, // pixels between gate spawns - MUCH less frequent
    COMBAT_SECTION_LENGTH: 1400, // longer combat sections
    REWARD_SECTION_LENGTH: 300, // reward gates (supply crates)
    TYPES: {
        // Survivor crates - collision-based, no HP
        ADD_10: { symbol: '+10', color: '#8B7355', category: 'army', requiresShooting: false, apply: (player) => player.modifyArmy(10) },
        ADD_20: { symbol: '+20', color: '#9B8365', category: 'army', requiresShooting: false, apply: (player) => player.modifyArmy(20) },
        MULTIPLY_2: { symbol: '×2', color: '#6B5545', category: 'army', requiresShooting: false, apply: (player) => player.multiplyArmy(2) },

        // Weapon crates - require shooting, have HP (unlock weapon and auto-switch)
        WEAPON_RIFLE: { symbol: 'Rifle', color: '#8B6914', category: 'weapon', requiresShooting: true, health: 5, apply: (player) => { player.unlockedWeapons.add('RIFLE'); player.weaponType = 'RIFLE'; } },
        WEAPON_MG: { symbol: 'MG', color: '#A0522D', category: 'weapon', requiresShooting: true, health: 8, apply: (player) => { player.unlockedWeapons.add('MACHINE_GUN'); player.weaponType = 'MACHINE_GUN'; } },
        WEAPON_SNIPER: { symbol: 'Sniper', color: '#5F4C3B', category: 'weapon', requiresShooting: true, health: 10, apply: (player) => { player.unlockedWeapons.add('SNIPER'); player.weaponType = 'SNIPER'; } },
        WEAPON_MOUNTED_MG: { symbol: 'Mounted', color: '#8B4513', category: 'weapon', requiresShooting: true, health: 12, apply: (player) => { player.unlockedWeapons.add('MOUNTED_MG'); player.weaponType = 'MOUNTED_MG'; } },

        // Survivor type crates - require shooting, have HP
        TROOP_TANK: { symbol: 'Military', color: '#4A5D4A', category: 'troop', requiresShooting: true, health: 8, apply: (player) => player.setTroopType('TANK') },
        TROOP_SPEC: { symbol: 'Veteran', color: '#6B4423', category: 'troop', requiresShooting: true, health: 5, apply: (player) => player.setTroopType('SPECIALIST') },
        TROOP_SOLDIER: { symbol: 'Civilian', color: '#7B9B7B', category: 'troop', requiresShooting: true, health: 5, apply: (player) => player.setTroopType('SOLDIER') }
    }
};

const ENEMIES = {
    // Zombie types with different sizes
    TYPES: {
        SMALL: {
            width: 25,
            height: 25,
            color: '#4A7C4E', // Shambling zombie - sickly green
            shape: 'circle'
        },
        MEDIUM: {
            width: 35,
            height: 35,
            color: '#6B7B6B', // Tough zombie - gray/decayed
            shape: 'square'
        },
        BOSS: {
            width: 60,
            height: 60,
            color: '#5A3A3A', // Mutant zombie - dark red/purple
            shape: 'hexagon'
        }
    },

    // Spawn rates: 45px → 18px (increased density)
    // Enemy distribution: 90% peons (1 HP), 7% medium, 3% boss

    // Health/cost scaling (used after 40% progress)
    START_MIN_HEALTH: 1,
    START_MAX_HEALTH: 2,
    START_MIN_COST: 1,
    START_MAX_COST: 2,
    END_MIN_HEALTH: 30,
    END_MAX_HEALTH: 80,
    END_MIN_COST: 10,
    END_MAX_COST: 25,
};

const PROJECTILES = {
    // Width is now dynamic based on troop type (Soldier: 8px, Specialist: 12px, Tank: 16px)
    HEIGHT: 16,
    COLOR: '#ffff00',
    SPEED: 10, // Increased for 60 FPS baseline (was 5)
};
