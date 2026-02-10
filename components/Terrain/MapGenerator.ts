
import { FileNode } from '../../types';

export interface MapData {
    tiles: { type: string; height: number; fileId?: string; fileName?: string; isFolder?: boolean }[][];
    width: number;
    height: number;
}

export class MapGenerator {
    private static PADDING = 2; // Grass padding around content

    static generate(nodes: FileNode[]): MapData {
        // 1. Check for custom map file
        const mapFile = nodes.find(n => n.name === '.__map__.json');
        if (mapFile && mapFile.content) {
            try {
                const parsed = JSON.parse(mapFile.content);
                if (parsed.tiles && Array.isArray(parsed.tiles)) {
                    return this.parseCustomMap(parsed.tiles, nodes);
                }
            } catch (e) {
                console.error("Failed to parse .__map__.json", e);
            }
        }

        // 2. Fallback: Procedural Generation
        return this.generateProcedural(nodes.filter(n => n.name !== '.__map__.json'));
    }

    private static parseCustomMap(rawTiles: string[][], nodes: FileNode[]): MapData {
        const height = rawTiles.length;
        const width = rawTiles[0]?.length || 0;
        const tiles: MapData['tiles'] = [];

        for (let x = 0; x < width; x++) {
            tiles[x] = [];
            for (let y = 0; y < height; y++) {
                const type = rawTiles[y][x] || 'grass';
                tiles[x][y] = {
                    type,
                    height: 0
                };
            }
        }

        return { tiles, width, height };
    }

    private static generateProcedural(nodes: FileNode[]): MapData {
        const count = nodes.length;

        // Layout Strategy: Grid with Stride
        // Items placed at (x,y) where x,y are odd
        // This ensures at least 1 tile gap between items for paths

        const sideItems = Math.ceil(Math.sqrt(count));
        const sideTiles = (sideItems * 2) + 1; // *2 for spacing, +1 for fencepost

        // Add padding
        const width = sideTiles + (this.PADDING * 2);
        const height = sideTiles + (this.PADDING * 2);

        const tiles: MapData['tiles'] = [];

        // 1. Initialize with Grass
        for (let x = 0; x < width; x++) {
            tiles[x] = [];
            for (let y = 0; y < height; y++) {
                tiles[x][y] = { type: 'grass', height: 0 };
            }
        }

        // 2. Place Items & Paths
        let currentItemX = 0;
        let currentItemY = 0;

        // Offset to start inside padding
        const startX = this.PADDING + 1;
        const startY = this.PADDING + 1;

        nodes.forEach(node => {
            if (currentItemX >= sideItems) {
                currentItemX = 0;
                currentItemY++;
            }

            // Calculate grid position
            // Items are at 0,0 2,0 4,0 ... in "Item Coordinate Space"
            // Mapped to map tiles: startX + 2*ix, startY + 2*iy
            const tx = startX + (currentItemX * 2);
            const ty = startY + (currentItemY * 2);

            let tileType = 'house1';
            let zHeight = 0.5;

            // Determine Item Visuals
            if (node.type === 'folder') {
                // Randomize folder path directions for variety? Or fixed?
                // User requested 'pathTunnel' for folders
                tileType = 'pathTunnel';
                zHeight = 0; // Flat or whatever looks good
            } else {
                const hash = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                const houseNum = (hash % 48) + 1;
                tileType = `house${houseNum}`;
            }

            tiles[tx][ty] = {
                type: tileType,
                height: 0,
                fileId: node.id,
                fileName: node.name,
                isFolder: node.type === 'folder'
            };

            // 3. Fill immediate connections with placeholder paths
            // We want paths *around* items. The gap is 1 tile.
            // (tx+1, ty), (tx-1, ty), (tx, ty+1), (tx, ty-1)
            // But strict grid layout: items at (1,1), (3,1)...
            // The tile at (2,1) connects Item(1,1) and Item(3,1)

            // Just mark all "gaps" and "intersections" within the bounding box of items as paths
            // or basically connect everything in a grid?

            // Let's fill the "Road Network" for the whole block of items

            currentItemX++;
        });

        // Generate Grid Road Network covering all items
        // Range: startX - 1 to startX + (sideItems * 2)
        // We iterate and place 'path' placeholder wherever there ISN'T an item
        // but is within the "city" bounds.

        const cityMinX = startX - 1;
        const cityMaxX = startX + (sideItems * 2);
        const cityMinY = startY - 1;
        const cityMaxY = startY + (sideItems * 2);

        for (let x = cityMinX; x <= cityMaxX; x++) {
            for (let y = cityMinY; y <= cityMaxY; y++) {
                // Bounds check
                if (x < 0 || x >= width || y < 0 || y >= height) continue;

                const existing = tiles[x][y];
                // If it's empty grass, make it a path candidate
                // BUT only if it effectively connects things.
                // A simple grid pattern:
                // If x is odd OR y is odd? (since items are at odd, odd)
                // Items are at (startX + 2k, startY + 2j)
                // If startX is odd (say 3), items are at 3, 5, 7.
                // So odd/odd contains items.
                // even/odd or odd/even or even/even are paths?

                // Let's simplfy: fill the whole rectangle with paths except where items are.
                if (existing.type === 'grass') {
                    // Check if this is "inside" the active item area roughly?
                    // Actually, user wants "path tiles around".
                    // So yes, a dense grid of paths surrounding items is good.
                    tiles[x][y] = { type: 'path_placeholder', height: 0 };
                }
            }
        }

        // 4. Autotile Paths
        // Convert 'path_placeholder' to specific path types based on neighbors
        // Neighbors: Up(y-1), Down(y+1), Left(x-1), Right(x+1)
        // A neighbor connects if it is a path OR an item (house/folder)
        // Ideally houses have an "entry" point but for now assume they allow connection from all sides

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (tiles[x][y].type === 'path_placeholder' || tiles[x][y].type === 'pathAllDirections') {
                    // Don't overwrite folders if they are pathAllDirections? 
                    // Actually folders are active items, we might want to keep them distinct?
                    // User said "files/folders tiles". So Folder is an item.
                    // If Folder was set to 'pathAllDirections' above, we leave it be or treat it as a hub.
                    if (tiles[x][y].isFolder) continue;

                    const connectUp = this.connects(tiles, x, y - 1);
                    const connectDown = this.connects(tiles, x, y + 1);
                    const connectLeft = this.connects(tiles, x - 1, y);
                    const connectRight = this.connects(tiles, x + 1, y);

                    tiles[x][y].type = this.solvePathTile(connectUp, connectDown, connectLeft, connectRight);
                }
            }
        }

        return { tiles, width, height };
    }

    private static connects(tiles: MapData['tiles'], x: number, y: number): boolean {
        if (x < 0 || y < 0 || x >= tiles.length || y >= tiles[0].length) return false;
        const t = tiles[x][y];
        // Connects if it's not grass/water roughly
        // Assume anything that isn't empty grass/water is part of the "city"
        return t.type !== 'grass' && t.type !== 'water';
    }

    private static solvePathTile(up: boolean, down: boolean, left: boolean, right: boolean): string {
        // Simple logic based on Kenney assets names

        // 4-way
        if (up && down && left && right) return 'pathAllDirections';

        // 3-way (T-intersections not explicitly in config list but might exist? 
        // Checking assetsConfig: pathRightLeft, pathUpDown, pathUpLeft, pathUpRight, pathDownLeft, pathDownRight.
        // It seems we lack T-junctions in the config map? 
        // We'll fallback to 'pathAllDirections' or closest corner.
        if ((up && down && left) || (up && down && right) || (left && right && up) || (left && right && down)) {
            return 'pathAllDirections'; // Best fallback
        }

        // 2-way Straight
        if (left && right) return 'pathRightLeft';
        if (up && down) return 'pathUpDown';

        // 2-way Corners
        if (up && left) return 'pathUpLeft';
        if (up && right) return 'pathUpRight';
        if (down && left) return 'pathDownLeft';
        if (down && right) return 'pathDownRight';

        // Dead ends (1-way) - fallback to straight usually looks okay or a specific end piece
        if (left || right) return 'pathRightLeft';
        if (up || down) return 'pathUpDown';

        // Isolated
        return 'pathAllDirections';
    }
}
