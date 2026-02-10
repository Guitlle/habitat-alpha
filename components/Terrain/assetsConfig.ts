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
    stone: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/rocks_1.png' }, // Grey stone tile
    stone2: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/rocks_2.png' }, // Grey stone tile
    stone3: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/rocks_3.png' }, // Grey stone tile
    stone4: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/rocks_4.png' }, // Grey stone tile
    stone5: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/rocks_5.png' }, // Grey stone tile
    stone6: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/rocks_6.png' }, // Grey stone tile
    trees1: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/trees_1.png' }, // Trees
    trees2: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/trees_2.png' }, // Trees
    trees3: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/trees_3.png' }, // Trees
    trees4: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/trees_4.png' }, // Trees
    trees5: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/trees_5.png' }, // Trees
    trees6: { file: 'assets/tiles/kenney_tower-defense/PNG/Details/trees_6.png' }, // Trees
    snow: { file: 'assets/tiles/kenney_isometric-landscape/PNG/landscapeTiles_059.png' },  // White snow tile

    pathRightLeft: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_29.png' },
    pathUpDown: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_32.png' },
    pathUpLeft: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_39.png' },
    pathDownLeft: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_35.png' },
    pathDownRight: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_31.png' },
    pathUpRight: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_34.png' },
    pathAllDirections: { file: 'assets/tiles/kenney_tower-defense/PNG/Landscape/landscape_30.png' },
    pathTunnel: { file: 'assets/tiles/kenney_isometric-city/PNG/cityTiles_026.png' },

    // Player character
    player: { file: 'assets/tiles/kenney_mini-characters/Previews/character-male-a.png' }, // Placeholder if exists, otherwise fallback to shape

    house1: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_125.png' },
    house2: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_124.png' },
    house3: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_123.png' },
    house4: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_117.png' },
    house5: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_122.png' },
    house6: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_116.png' },
    house7: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_115.png' },
    house8: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_114.png' },
    house9: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_113.png' },
    house10: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_109.png' },
    house11: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_108.png' },
    house12: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_107.png' },
    house13: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_106.png' },
    house14: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_000.png' },
    house15: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_001.png' },
    house16: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_002.png' },
    house17: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_003.png' },
    house18: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_004.png' },
    house19: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_009.png' },
    house20: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_010.png' },
    house21: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_011.png' },
    house22: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_012.png' },
    house23: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_014.png' },
    house24: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_017.png' },
    house25: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_018.png' },
    house26: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_019.png' },
    house27: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_020.png' },
    house28: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_021.png' },
    house29: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_022.png' },
    house30: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_025.png' },
    house31: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_026.png' },
    house32: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_028.png' },
    house33: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_027.png' },
    house34: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_029.png' },
    house35: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_030.png' },
    house36: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_033.png' },
    house37: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_034.png' },
    house38: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_035.png' },
    house39: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_036.png' },
    house40: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_037.png' },
    house41: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_040.png' },
    house42: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_041.png' },
    house43: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_099.png' },
    house44: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_093.png' },
    house45: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_100.png' },
    house46: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_101.png' },
    house47: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_106.png' },
    house48: { file: 'assets/tiles/kenney_isometric-buildings-1/PNG/buildingTiles_107.png' },
}
