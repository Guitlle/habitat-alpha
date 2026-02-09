import { describe, it, expect, vi } from 'vitest';
import { MapGenerator } from '../MapGenerator';
import { FileNode } from '../../../types';

describe('MapGenerator', () => {
    const mockFileNodes: FileNode[] = [
        { id: '1', name: 'file1.txt', type: 'file' },
        { id: '2', name: 'folder1', type: 'folder' },
        { id: '3', name: 'file2.js', type: 'file' }
    ];

    it('should generate a procedural map when no custom map exists', () => {
        const result = MapGenerator.generate(mockFileNodes);

        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
        expect(result.tiles.length).toBe(result.width);

        // Count specific tile types
        let houseCount = 0;
        let pathCount = 0;

        result.tiles.forEach(col => {
            col.forEach(tile => {
                if (tile.type.startsWith('house')) houseCount++;
                if (tile.type.startsWith('path')) pathCount++;
            });
        });

        // We expect 2 files -> 2 houses, 1 folder -> 1 path
        expect(houseCount).toBe(2);
        expect(pathCount).toBe(1);
    });

    it('should correctly assign metadata to tiles', () => {
        const result = MapGenerator.generate(mockFileNodes);

        let foundFile1 = false;

        result.tiles.forEach(col => {
            col.forEach(tile => {
                if (tile.fileId === '1' && tile.fileName === 'file1.txt') {
                    foundFile1 = true;
                }
            });
        });

        expect(foundFile1).toBe(true);
    });

    it('should parse a custom map if .__map__.json exists', () => {
        const customMapContent = JSON.stringify({
            tiles: [
                ['water', 'water', 'water'],
                ['water', 'island', 'water'],
                ['water', 'water', 'water']
            ]
        });

        const nodesWithMap: FileNode[] = [
            ...mockFileNodes,
            { id: 'map', name: '.__map__.json', type: 'file', content: customMapContent }
        ];

        const result = MapGenerator.generate(nodesWithMap);

        // MapGenerator currently transposes or iterates in a specific way. 
        // Our mock logic in MapGenerator was:
        // width = rawTiles[0].length (3)
        // height = rawTiles.length (3)
        // tiles[x][y] = rawTiles[y][x]

        expect(result.width).toBe(3);
        expect(result.height).toBe(3);
        expect(result.tiles[1][1].type).toBe('island');
        expect(result.tiles[0][0].type).toBe('water');
    });

    it('should fallback to procedural if custom map is invalid JSON', () => {
        const nodesWithBadMap: FileNode[] = [
            ...mockFileNodes,
            { id: 'map', name: '.__map__.json', type: 'file', content: '{ invalid json ' }
        ];

        // Should not throw, but log error and return procedural
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const result = MapGenerator.generate(nodesWithBadMap);

        expect(spy).toHaveBeenCalled();
        expect(result.tiles.length).toBeGreaterThan(3); // Procedural size is usually larger than 3x3 for 4 items

        spy.mockRestore();
    });
});
