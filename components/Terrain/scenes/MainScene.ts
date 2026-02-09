
import Phaser from 'phaser';
import { TILE_MAPPING } from '../assetsConfig';
import { MapGenerator, MapData } from '../MapGenerator';
import { FileNode } from '../../../types';

export default class MainScene extends Phaser.Scene {
    private map!: Phaser.GameObjects.Sprite[][];
    private mapData!: MapData; // Store the map data for logic checks
    private textLabels: Phaser.GameObjects.Text[] = []; // Store labels to clear
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private enterKey!: Phaser.Input.Keyboard.Key; // Dedicated Enter key
    private tileSize = 130; // Isometric tile width
    private tileHeight = 64; // Isometric tile height

    // Callbacks provided by React
    public onOpenFile?: (node: FileNode) => void;
    // We add onNavigate too if we want folder navigation
    public onNavigate?: (folderId: string) => void;

    // Track last navigation to prevent rapid re-triggering
    private lastNavTime = 0;

    constructor() {
        super('MainScene');
    }

    preload() {
        // Load assets from config
        Object.entries(TILE_MAPPING).forEach(([key, config]) => {
            if (config.file) {
                this.load.image(key, config.file);
            }
        });
    }

    create() {
        this.cameras.main.zoom = 1;
        this.cameras.main.centerOn(300, 200); // Initial center guess

        // Check if data was passed during init or registry
        const initialNodes = this.registry.get('initialNodes');
        const onOpenFile = this.registry.get('onOpenFile');
        const onNavigate = this.registry.get('onNavigate');

        if (onOpenFile) this.onOpenFile = onOpenFile;
        if (onNavigate) this.onNavigate = onNavigate;

        if (initialNodes) {
            this.loadLevel(initialNodes);
        }

        // Initialize inputs
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        }
    }

    public loadLevel(nodes: FileNode[]) {
        // Clear existing map
        if (this.map) {
            this.map.forEach(row => row.forEach(sprite => sprite.destroy()));
        }
        this.map = [];
        this.textLabels.forEach(label => label.destroy());
        this.textLabels = [];

        // Generate map data
        this.mapData = MapGenerator.generate(nodes);
        const { width, height, tiles } = this.mapData;

        // Create isometric map
        for (let x = 0; x < width; x++) {
            this.map[x] = [];
            for (let y = 0; y < height; y++) {
                const tile = tiles[x][y];
                const tileType = tile.type;
                const zHeight = tile.height;

                const isoX = (x - y) * this.tileSize / 2;
                const isoY = (x + y) * this.tileHeight / 2 - (zHeight * 24);

                let sprite: Phaser.GameObjects.Sprite;

                if (this.textures.exists(tileType)) {
                    sprite = this.add.sprite(isoX, isoY, tileType);
                } else {
                    const fallbackKey = `fallback_${tileType}`;
                    if (!this.textures.exists(fallbackKey)) {
                        const graphics = this.make.graphics({ x: 0, y: 0 });
                        const color = this.getFallbackColor(tileType);
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

                sprite.setOrigin(0.5, 1);
                sprite.setDepth(isoY);
                this.map[x][y] = sprite;

                // Add Label if it's a file or folder
                if (tile.fileName) {
                    const label = this.add.text(isoX, isoY - 40, tile.fileName.substring(0, 15) + (tile.fileName.length > 15 ? '...' : ''), {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#00000080',
                        padding: { x: 4, y: 2 }
                    });
                    label.setOrigin(0.5, 1);
                    label.setDepth(isoY + 100); // Always above tile
                    this.textLabels.push(label);
                }
            }
        }

        // Re-create Player if needed, or reposition
        if (!this.player) {
            this.createPlayer();
        }
        // Reset player position to start of map (padding area)
        this.player.x = 0; // rough start
        this.player.y = 0;

        // Center camera on start
        this.cameras.main.centerOn(0, 0);
    }

    update(time: number, delta: number) {
        this.handleInput();
        this.checkInteractions(time);

        // Update label visibility based on distance to player? Optional optimization.
    }

    private checkInteractions(time: number) {
        if (!this.player || !this.mapData || !this.enterKey) return;

        // Check if Enter key was just pressed
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            console.log('ENTER pressed at Player Pos:', Math.round(this.player.x), Math.round(this.player.y));

            const { width, height, tiles } = this.mapData;
            const playerX = this.player.x;
            const playerY = this.player.y;
            const threshold = 60; // Larger threshold for easier manual activation

            let found = false;

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const tile = tiles[x][y];
                    // Only check interactive tiles
                    if (!tile.fileId) continue;

                    const zHeight = tile.height;
                    const tileX = (x - y) * this.tileSize / 2;
                    const tileY = (x + y) * this.tileHeight / 2 - (zHeight * 24);

                    // Center of the tile logic
                    const centerX = tileX;
                    const centerY = tileY - (this.tileHeight / 2);

                    const dist = Phaser.Math.Distance.Between(playerX, playerY, centerX, centerY);

                    if (dist < threshold) {
                        found = true;
                        console.log('Interaction detected with:', tile.fileName, 'Distance:', Math.round(dist));

                        if (tile.isFolder) {
                            // Navigate!
                            if (this.onNavigate && tile.fileId) {
                                console.log('Navigating to folder:', tile.fileName);
                                this.onNavigate(tile.fileId);
                                return;
                            }
                        } else {
                            // Open File!
                            if (this.onOpenFile && tile.fileName && tile.fileId) {
                                console.log('Opening file:', tile.fileName);
                                this.onOpenFile({
                                    id: tile.fileId,
                                    name: tile.fileName!,
                                    type: 'file',
                                });
                                return;
                            }
                        }
                    }
                }
            }
            if (!found) {
                console.log('No interactive tile found nearby.');
            }
        }
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
            // Draw player graphic
            const graphics = this.add.graphics();
            graphics.fillStyle(0xff0000, 1);
            graphics.fillCircle(0, -20, 10); // Head
            graphics.fillStyle(0x0000ff, 1);
            graphics.fillRect(-10, -10, 20, 20); // Body
            this.player.add(graphics);
        }
        this.player.setDepth(99999);

        // Input
        if (this.input.keyboard) {
            // Cursors are created in create() now, or checked here if needed
            if (!this.cursors) this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private handleInput() {
        if (!this.cursors) return;

        const speed = 2; // User requested speed
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

        this.player.x += dx;
        this.player.y += dy;

        // Camera follow with lerp
        this.cameras.main.scrollX += (this.player.x - this.cameras.main.scrollX - this.cameras.main.width * 0.5) * 0.1;
        this.cameras.main.scrollY += (this.player.y - this.cameras.main.scrollY - this.cameras.main.height * 0.5) * 0.1;
    }
}
