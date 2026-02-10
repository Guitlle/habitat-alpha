
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

                const isoX = (x - y) * this.tileSize / 2;
                const isoY = (x + y) * this.tileHeight / 2; // Flat ground assumption

                // Determine if this tile is "flat" (walkable) or "tall" (obstacle)
                const isObstacle = tileType.startsWith('house') || tileType === 'pathTunnel';

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

                sprite.setOrigin(0.5, 1); // Anchor at bottom center

                if (isObstacle) {
                    const depthY = isoY;
                    sprite.setDepth(depthY);
                } else {
                    // Flat tiles lowest depth
                    sprite.setDepth(-9999);
                }

                this.map[x][y] = sprite;

                // Add Label
                if (tile.fileName) {
                    const label = this.add.text(isoX, isoY - 40, tile.fileName.substring(0, 15) + (tile.fileName.length > 15 ? '...' : ''), {
                        fontSize: '12px',
                        color: '#ffffff',
                        backgroundColor: '#00000080',
                        padding: { x: 4, y: 2 }
                    });
                    label.setOrigin(0.5, 1);
                    label.setDepth(999999);
                    this.textLabels.push(label);
                }
            }
        }

        // Re-create Player if needed
        if (!this.player) {
            this.createPlayer();
        }

        // Find Spawn Point
        this.setPlayerSpawn(width, height, tiles);
    }

    private setPlayerSpawn(width: number, height: number, tiles: any[][]) {
        let spawnX = 0;
        let spawnY = 0;
        let foundPattern = false;

        // 1. Look for 'PARENT_DIR' (Up) tile
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (tiles[x][y].fileId === 'PARENT_DIR') {
                    // Found it! Spawn "South" of it (in front).
                    // In isometric grid (x, y), "South" is typically increasing both x and y?
                    // actually if isoX = (x-y), isoY = (x+y). Increasing Y (visually down) means increasing x+y.
                    // Let's place player at grid (x, y+1) or (x+1, y) ?
                    // Actually let's just use world coordinates.
                    const tileX = (x - y) * this.tileSize / 2;
                    const tileY = (x + y) * this.tileHeight / 2;

                    // "In Front" is visually DOWN (+Y).
                    // We want to be slightly offset so we aren't inside it.
                    spawnX = tileX - (this.tileHeight * 0.5);
                    spawnY = tileY + (this.tileHeight * 0.5); // Move down by 1.5 tiles visually
                    foundPattern = true;
                    break;
                }
            }
            if (foundPattern) break;
        }

        if (!foundPattern) {
            // Default to 0,0 or finding first grass
            spawnX = 0;
            spawnY = 0;
            // Try to safe spawn on first walkable
            for (let x = width - 1; x >= 0; x--) {
                for (let y = 0; y < height; y++) {
                    if (!tiles[x][y].type.startsWith('house') && tiles[x][y].type !== 'pathTunnel') {
                        spawnX = (x - y) * this.tileSize / 2;
                        spawnY = (x + y) * this.tileHeight / 2;
                        break;
                    }
                }
            }
        }

        this.player.x = spawnX;
        this.player.y = spawnY;
        this.cameras.main.centerOn(spawnX, spawnY);
    }

    update(time: number, delta: number) {
        this.handleInput();
        this.checkInteractions(time);

        if (this.player) {
            this.player.setDepth(this.player.y);
        }
    }

    private checkInteractions(time: number) {
        if (!this.player || !this.mapData || !this.enterKey) return;

        // Check if Enter key was just pressed
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            const { width, height, tiles } = this.mapData;
            const playerX = this.player.x;
            const playerY = this.player.y;
            // Interaction radius
            const threshold = 120;

            let found = false;

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const tile = tiles[x][y];
                    // Only check interactive tiles
                    if (!tile.fileId) continue;

                    const tileX = (x - y) * this.tileSize / 2;
                    const tileY = (x + y) * this.tileHeight / 2;

                    // Center of the tile logic
                    const centerX = tileX;
                    const centerY = tileY - (this.tileHeight / 2);

                    const dist = Phaser.Math.Distance.Between(playerX, playerY, centerX, centerY);

                    if (dist < threshold) {
                        found = true;

                        if (tile.isFolder) {
                            // Navigate!
                            if (this.onNavigate && tile.fileId) {
                                this.onNavigate(tile.fileId);
                                return;
                            }
                        } else {
                            // Open File!
                            if (this.onOpenFile && tile.fileName && tile.fileId) {
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
        // Depth initialized
        this.player.setDepth(0);

        // Input
        if (this.input.keyboard) {
            // Cursors are created in create() now, or checked here if needed
            if (!this.cursors) this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private handleInput() {
        if (!this.cursors || !this.mapData) return;

        const speed = 2.5;
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

        if (dx === 0 && dy === 0) return;

        const nextX = this.player.x + dx;
        const nextY = this.player.y + dy;

        if (this.canMoveTo(nextX, nextY)) {
            this.player.x = nextX;
            this.player.y = nextY;

            // Camera follow with lerp
            this.cameras.main.scrollX += (this.player.x - this.cameras.main.scrollX - this.cameras.main.width * 0.5) * 0.1;
            this.cameras.main.scrollY += (this.player.y - this.cameras.main.scrollY - this.cameras.main.height * 0.5) * 0.1;
        }
    }

    private canMoveTo(worldX: number, worldY: number): boolean {
        // Inverse isometric transform
        const halfW = this.tileSize / 2;
        const halfH = this.tileHeight / 2;

        const gridX = Math.round((worldY / halfH + worldX / halfW) / 2);
        const gridY = Math.round((worldY / halfH - worldX / halfW) / 2);

        // Bounds Check
        if (gridX < 0 || gridX >= this.mapData.width || gridY < 0 || gridY >= this.mapData.height) {
            return false;
        }

        // Tile Type Check
        const tile = this.mapData.tiles[gridX][gridY];

        // Blocking types
        if (tile.type.startsWith('house')) return false;
        if (tile.type === 'pathTunnel') return false;
        if (tile.type === 'water') return false;

        return true;
    }
}
