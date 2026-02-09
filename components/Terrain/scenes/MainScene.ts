
import Phaser from 'phaser';
import { TILE_MAPPING } from '../assetsConfig';

export default class MainScene extends Phaser.Scene {
    private map!: Phaser.GameObjects.Sprite[][];
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private mapSize = 30;
    private tileSize = 130; // Isometric tile width
    private tileHeight = 64; // Isometric tile height

    constructor() {
        super('MainScene');
    }

    preload() {
        // Load assets from config
        Object.entries(TILE_MAPPING).forEach(([key, config]) => {
            if (config.file) {
                // Phaser load relative to public/
                this.load.image(key, config.file);
            }
        });
    }

    create() {
        this.map = [];

        // Generate map data (similar logic to previous React component)
        const mapData = this.generateMapData();

        // Create isometric map
        for (let x = 0; x < this.mapSize; x++) {
            this.map[x] = [];
            for (let y = 0; y < this.mapSize; y++) {
                const tileType = mapData[x][y].type;
                const zHeight = mapData[x][y].height;

                const isoX = (x - y) * this.tileSize / 2;
                const isoY = (x + y) * this.tileHeight / 2 - (zHeight * 24);

                let sprite: Phaser.GameObjects.Sprite;

                // Check if texture exists, otherwise draw fallback graphic
                if (this.textures.exists(tileType)) {
                    sprite = this.add.sprite(isoX, isoY, tileType);
                } else {
                    // Fallback: Create a texture programmatically if missing
                    const fallbackKey = `fallback_${tileType}`;
                    if (!this.textures.exists(fallbackKey)) {
                        const graphics = this.make.graphics({ x: 0, y: 0 });
                        const color = this.getFallbackColor(tileType);

                        // Draw rombus
                        graphics.fillStyle(color, 1);
                        graphics.beginPath();
                        graphics.moveTo(0, this.tileHeight / 2);
                        graphics.lineTo(this.tileSize / 2, 0);
                        graphics.lineTo(this.tileSize, this.tileHeight / 2);
                        graphics.lineTo(this.tileSize / 2, this.tileHeight);
                        graphics.closePath();
                        graphics.fillPath();

                        graphics.generateTexture(fallbackKey, this.tileSize, this.tileHeight);
                    }
                    sprite = this.add.sprite(isoX, isoY, fallbackKey);
                }

                sprite.setOrigin(0.5, 1); // Anchor at bottom center for easier height handling
                sprite.setDepth(isoY); // Depth sorting
                this.map[x][y] = sprite;
            }
        }

        // Create Player
        this.createPlayer();

        // Camera
        this.cameras.main.zoom = 1;
        this.cameras.main.centerOn(0, 0);
    }

    update() {
        this.handleInput();
    }

    private generateMapData() {
        // Simple noise-like generation for demo purposes
        // In a real app, reuse the Perlin noise logic or import a library
        const data: { type: string, height: number }[][] = [];
        for (let x = 0; x < this.mapSize; x++) {
            data[x] = [];
            for (let y = 0; y < this.mapSize; y++) {
                const raw = Math.sin(x * 0.5) * Math.cos(y * 0.5); // Simple waves
                let type = 'grass';
                let height = 0;

                if (raw < -0.5) { type = 'water'; height = 0; }
                else if (raw < -0.3) { type = 'sand'; height = 0.2; }
                else if (raw < 0.5) { type = 'grass'; height = 0.5 + Math.random() * 0.2; }
                else { type = 'stone'; height = 1.5 + Math.random(); }
                height *= 0.25;
                data[x][y] = { type, height };
            }
        }
        return data;
    }

    private getFallbackColor(type: string) {
        switch (type) {
            case 'water': return 0x009edd;
            case 'sand': return 0xf7eaab;
            case 'grass': return 0x63c587;
            case 'stone': return 0xcfcfcf;
            case 'snow': return 0xffffff;
            default: return 0x888888;
        }
    }

    private createPlayer() {
        // Make a container for the player
        this.player = this.add.container(0, 0);

        if (this.textures.exists('player')) {
            const sprite = this.add.sprite(0, -20, 'player');
            sprite.setOrigin(0.5, 1);
            this.player.add(sprite);
        } else {
            // Draw player graphic (since we likely don't have the asset yet)
            const graphics = this.add.graphics();
            graphics.fillStyle(0xff0000, 1);
            graphics.fillCircle(0, -20, 10); // Head
            graphics.fillStyle(0x0000ff, 1);
            graphics.fillRect(-10, -10, 20, 20); // Body
            this.player.add(graphics);
        }
        this.player.setDepth(99999); // Always on top for now

        // Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private handleInput() {
        if (!this.cursors) return;

        const speed = 0.5;
        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown) {
            dx = -speed;
        } else if (this.cursors.right.isDown) {
            dx = speed;
        }

        if (this.cursors.up.isDown) {
            dy = -speed;
        } else if (this.cursors.down.isDown) {
            dy = speed;
        }

        // Move player logic here (simple screen space movement for now, 
        // ideally should be iso-aware)
        this.player.x += dx;
        this.player.y += dy;

        // Camera follow
        this.cameras.main.scrollX += (this.player.x - this.cameras.main.scrollX - this.cameras.main.width * 0.5) * 0.1;
        this.cameras.main.scrollY += (this.player.y - this.cameras.main.scrollY - this.cameras.main.height * 0.5) * 0.1;
    }
}
