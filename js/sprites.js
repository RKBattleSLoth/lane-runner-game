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

        // Zombie sprite (we'll scale it for different sizes)
        this.loadSprite('zombie', 'sprites/zombies/zombie.png');

        // Projectile sprite
        this.loadSprite('bullet', 'sprites/effects/bullet.png');

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
