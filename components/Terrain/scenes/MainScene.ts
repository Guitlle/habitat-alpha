
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

    // Keep track of full nodes to restore content/metadata on interaction
    private currentNodes: FileNode[] = [];

    // Callbacks provided by React
    public onOpenFile?: (node: FileNode) => void;
    public onNavigate?: (folderId: string) => void;

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
        this.currentNodes = nodes;

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
                    const tileX = (x - y) * this.tileSize / 2;
                    const tileY = (x + y) * this.tileHeight / 2;
                    spawnX = tileX - (this.tileHeight * 0.5);
                    spawnY = tileY + (this.tileHeight * 0.5);
                    foundPattern = true;
                    break;
                }
            }
            if (foundPattern) break;
        }

        if (!foundPattern) {
            spawnX = 0;
            spawnY = 0;
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

            // Get player grid pos
            const halfW = this.tileSize / 2;
            const halfH = this.tileHeight / 2;
            const gridX = Math.round((playerY / halfH + playerX / halfW) / 2);
            const gridY = Math.round((playerY / halfH - playerX / halfW) / 2);

            let bestDist = Infinity;
            let bestTile: any = null;

            // Check neighbors (3x3 area)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const tx = gridX + dx;
                    const ty = gridY + dy;

                    if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
                        const tile = tiles[tx][ty];
                        if (tile.fileId) {
                            const tileX = (tx - ty) * this.tileSize / 2;
                            const tileY = (tx + ty) * this.tileHeight / 2;
                            const centerY = tileY - (this.tileHeight / 2);

                            const dist = Phaser.Math.Distance.Between(playerX, playerY, tileX, centerY);

                            // 120px interaction radius
                            if (dist < 120 && dist < bestDist) {
                                bestDist = dist;
                                bestTile = tile;
                            }
                        }
                    }
                }
            }

            if (bestTile) {
                if (bestTile.isFolder) {
                    if (this.onNavigate && bestTile.fileId) {
                        this.onNavigate(bestTile.fileId);
                    }
                } else {
                    if (this.onOpenFile && bestTile.fileId) {
                        const fullNode = this.currentNodes.find(n => n.id === bestTile.fileId);
                        if (fullNode) {
                            this.onOpenFile(fullNode);
                        } else {
                             this.onOpenFile({
                                 id: bestTile.fileId,
                                 name: bestTile.fileName || 'Unknown',
                                 type: 'file',
                             });
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
        this.player = this.add.container(0, 0);

        if (this.textures.exists('player')) {
            const sprite = this.add.sprite(0, -20, 'player');
            sprite.setOrigin(0.5, 1);
            this.player.add(sprite);
        } else {
            const graphics = this.add.graphics();
            graphics.fillStyle(0xff0000, 1);
            graphics.fillCircle(0, -20, 10);
            graphics.fillStyle(0x0000ff, 1);
            graphics.fillRect(-10, -10, 20, 20);
            this.player.add(graphics);
        }
        this.player.setDepth(0);

        if (this.input.keyboard) {
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

            this.cameras.main.scrollX += (this.player.x - this.cameras.main.scrollX - this.cameras.main.width * 0.5) * 0.1;
            this.cameras.main.scrollY += (this.player.y - this.cameras.main.scrollY - this.cameras.main.height * 0.5) * 0.1;
        }
    }

    private canMoveTo(worldX: number, worldY: number): boolean {
        const halfW = this.tileSize / 2;
        const halfH = this.tileHeight / 2;

        const gridX = Math.round((worldY / halfH + worldX / halfW) / 2);
        const gridY = Math.round((worldY / halfH - worldX / halfW) / 2);

        if (gridX < 0 || gridX >= this.mapData.width || gridY < 0 || gridY >= this.mapData.height) {
            return false;
        }

        const tile = this.mapData.tiles[gridX][gridY];

        if (tile.type.startsWith('house')) return false;
        if (tile.type === 'pathTunnel') return false;
        if (tile.type === 'water') return false;

        return true;
    }
}
