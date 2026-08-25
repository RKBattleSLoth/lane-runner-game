// Game Constants
const GAME = {
    WIDTH: 400,
    HEIGHT: 800,
    SCROLL_SPEED: 0.7, // Slowed down to 1/3 of original
    LEVEL_LENGTH: 10000, // pixels until level end
};

const PLAYER = {
    WIDTH: 40,
    HEIGHT: 40,
    COLOR: '#00ff00',
    INITIAL_ARMY: 30,
    MOVE_SPEED: 2.5, // pixels per frame - reduced for better control
    FIRE_RATE: 150, // milliseconds between shots

    // Army damage multipliers (defined in player.js getArmyMultiplier):
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
    }
};

const TROOP_TYPES = {
    SOLDIER: {
        name: 'Soldier',
        color: '#00ff00',
        multiplier: 1,
        projectileWidth: 8,
        symbol: '👤'
    },
    TANK: {
        name: 'Tank',
        color: '#888888',
        multiplier: 5, // 1 tank = 5 soldiers in power
        projectileWidth: 16, // Heavy ordnance - easier to hit
        symbol: '🛡️'
    },
    SPECIALIST: {
        name: 'Specialist',
        color: '#ff00ff',
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
    REWARD_SECTION_LENGTH: 300, // reward gates
    TYPES: {
        // Army gates - collision-based, no HP
        ADD_10: { symbol: '+10', color: '#66BB6A', category: 'army', requiresShooting: false, apply: (player) => player.modifyArmy(10) },
        MULTIPLY_2: { symbol: '×2', color: '#4CAF50', category: 'army', requiresShooting: false, apply: (player) => player.multiplyArmy(2) },

        // Weapon upgrades - require shooting, have HP (reduced for pistol viability)
        WEAPON_RIFLE: { symbol: 'Rifle', color: '#FF9800', category: 'weapon', requiresShooting: true, health: 5, apply: (player) => player.setWeapon('RIFLE') },
        WEAPON_MG: { symbol: 'MG', color: '#F44336', category: 'weapon', requiresShooting: true, health: 8, apply: (player) => player.setWeapon('MACHINE_GUN') },
        WEAPON_SNIPER: { symbol: 'Sniper', color: '#00BCD4', category: 'weapon', requiresShooting: true, health: 10, apply: (player) => player.setWeapon('SNIPER') },

        // Troop type changes - require shooting, have HP (reduced for pistol viability)
        TROOP_TANK: { symbol: 'Tank', color: '#607D8B', category: 'troop', requiresShooting: true, health: 8, apply: (player) => player.setTroopType('TANK') },
        TROOP_SPEC: { symbol: 'Spec', color: '#9C27B0', category: 'troop', requiresShooting: true, health: 5, apply: (player) => player.setTroopType('SPECIALIST') },
        TROOP_SOLDIER: { symbol: 'Soldier', color: '#4CAF50', category: 'troop', requiresShooting: true, health: 5, apply: (player) => player.setTroopType('SOLDIER') }
    }
};

const ENEMIES = {
    // Enemy types with different sizes
    TYPES: {
        SMALL: {
            width: 25,
            height: 25,
            color: '#ff4444',
            shape: 'circle'
        },
        MEDIUM: {
            width: 35,
            height: 35,
            color: '#ff8800',
            shape: 'square'
        },
        BOSS: {
            width: 60,
            height: 60,
            color: '#cc0000',
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
    SPEED: 5, // Slowed down proportionally
};
