// Sprite Loading and Rendering System
class SpriteManager {
    constructor() {
        this.sprites = {};
        this.loaded = false;
        this.loadingPromises = [];
    }

    // Load a single sprite
    loadSprite(key, path) {
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[key] = img;
                console.log(`✓ Loaded sprite: ${key}`);
                resolve(img);
            };
            img.onerror = () => {
                console.error(`✗ Failed to load sprite: ${key} from ${path}`);
                reject(new Error(`Failed to load ${key}`));
            };
            img.src = path;
        });

        this.loadingPromises.push(promise);
        return promise;
    }

    // Load all game sprites
    async loadAllSprites() {
        console.log('Loading sprites...');

        // Player sprites - all combinations of troop types and weapons
        const troopTypes = ['civilian', 'veteran', 'military'];
        const weapons = ['pistol', 'rifle', 'mg', 'sniper'];

        troopTypes.forEach(troop => {
            weapons.forEach(weapon => {
                const key = `player_${troop}_${weapon}`;
                const path = `sprites/player/${troop}_${weapon}.png`;
                this.loadSprite(key, path);
            });
        });

        // Zombie sprites (animation frames)
        this.loadSprite('zombie', 'sprites/zombies/zombie.png'); // Fallback
        this.loadSprite('zombie_frame1', 'sprites/zombies/zombie_frame1.png');
        this.loadSprite('zombie_frame2', 'sprites/zombies/zombie_frame2.png');

        // Boss zombie sprites (animation frames)
        this.loadSprite('boss_zombie', 'sprites/bosses/boss_zombie.png'); // Fallback
        this.loadSprite('boss_zombie_frame1', 'sprites/bosses/boss_zombie_frame1.png');
        this.loadSprite('boss_zombie_frame2', 'sprites/bosses/boss_zombie_frame2.png');

        // Projectile sprite
        this.loadSprite('bullet', 'sprites/effects/bullet.png');

        // Muzzle flash sprites
        this.loadSprite('muzzle_flash_1', 'sprites/effects/tile_187.png');
        this.loadSprite('muzzle_flash_2', 'sprites/effects/tile_188.png');

        // Blood splatter sprites (6 variations for better variety)
        this.loadSprite('blood_1', 'sprites/effects/tile_368.png');
        this.loadSprite('blood_2', 'sprites/effects/tile_369.png');
        this.loadSprite('blood_3', 'sprites/effects/tile_370.png');
        this.loadSprite('blood_4', 'sprites/effects/tile_371.png');
        this.loadSprite('blood_5', 'sprites/effects/tile_372.png');
        this.loadSprite('blood_6', 'sprites/effects/tile_373.png');

        // Pickup/gate sprites
        this.loadSprite('crate_1', 'sprites/pickups/tile_155.png');
        this.loadSprite('crate_2', 'sprites/pickups/tile_156.png');
        this.loadSprite('crate_3', 'sprites/pickups/tile_293.png');
        this.loadSprite('medkit', 'sprites/pickups/tile_157.png');
        this.loadSprite('ammo', 'sprites/pickups/tile_158.png');

        // Weapon icons for UI
        this.loadSprite('icon_pistol', 'sprites/pickups/weapon_gun.png');
        this.loadSprite('icon_rifle', 'sprites/pickups/weapon_gun.png');
        this.loadSprite('icon_mg', 'sprites/pickups/weapon_machine.png');
        this.loadSprite('icon_sniper', 'sprites/pickups/weapon_silencer.png');

        // Background tiles (using zero-padded numbers for tiles 1-9)
        for (let i = 1; i <= 20; i++) {
            const paddedNum = i.toString().padStart(2, '0');
            this.loadSprite(`tile_bg_${i}`, `sprites/background/tile_${paddedNum}.png`);
        }

        // Wait for all sprites to load
        try {
            await Promise.all(this.loadingPromises);
            this.loaded = true;
            console.log('✅ All sprites loaded successfully!');
            return true;
        } catch (error) {
            console.error('❌ Error loading sprites:', error);
            return false;
        }
    }

    // Get sprite by key
    getSprite(key) {
        return this.sprites[key] || null;
    }

    // Get player sprite based on troop type and weapon
    getPlayerSprite(troopType, weaponType) {
        // Map internal names to sprite names
        const troopMap = {
            'SOLDIER': 'civilian',
            'SPECIALIST': 'veteran',
            'TANK': 'military'
        };

        const weaponMap = {
            'PISTOL': 'pistol',
            'RIFLE': 'rifle',
            'MACHINE_GUN': 'mg',
            'SNIPER': 'sniper'
        };

        const troop = troopMap[troopType] || 'civilian';
        const weapon = weaponMap[weaponType] || 'pistol';

        const key = `player_${troop}_${weapon}`;
        return this.getSprite(key);
    }

    // Draw sprite centered at position
    drawSprite(ctx, sprite, x, y, width, height) {
        if (!sprite) return false;

        try {
            ctx.drawImage(
                sprite,
                x - width / 2,
                y - height / 2,
                width,
                height
            );
            return true;
        } catch (e) {
            console.error('Error drawing sprite:', e);
            return false;
        }
    }

    // Draw sprite with rotation (for directional sprites)
    drawSpriteRotated(ctx, sprite, x, y, width, height, rotation) {
        if (!sprite) return false;

        try {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.drawImage(
                sprite,
                -width / 2,
                -height / 2,
                width,
                height
            );
            ctx.restore();
            return true;
        } catch (e) {
            console.error('Error drawing rotated sprite:', e);
            ctx.restore();
            return false;
        }
    }
}
