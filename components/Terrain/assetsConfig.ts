export interface TileConfig {
    file: string; // Path relative to public/
}

// Mapping logical terrain types to specific Kenney asset files.
// The user can update these paths to point to different images.
export const TILE_MAPPING: Record<string, TileConfig> = {
    // Using landscape pack as default source
    grass: { file: 'assets/tiles/kenney_isometric-landscape/PNG/landscapeTiles_067.png' }, // Green flat tile
    water: { file: 'assets/tiles/kenney_isometric-landscape/PNG/landscapeTiles_066.png' }, // Blue tile
    sand: { file: 'assets/tiles/kenney_isometric-landscape/PNG/landscapeTiles_073.png' },  // Beige tile
    stone: { file: 'assets/tiles/kenney_isometric-landscape/PNG/landscapeTiles_081.png' }, // Grey stone tile
    snow: { file: 'assets/tiles/kenney_isometric-landscape/PNG/landscapeTiles_059.png' },  // White snow tile

    // Player character
    player: { file: 'assets/tiles/kenney_mini-characters/Previews/character-male-a.png' } // Placeholder if exists, otherwise fallback to shape
};
