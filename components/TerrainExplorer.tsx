import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const MAP_SIZE = 30; // 30x30 grid
const Z_SCALE = 24; // Height multiplier for visualization (taller columns)
const BASE_DEPTH = 12; // Base thickness of the "floor" slab

// Physics Constants
const MOVE_SPEED = 0.1; // Tiles per frame
const CAMERA_SMOOTHING = 0.05; // Lower = smoother/slower follow
const HEIGHT_SMOOTHING = 0.15; // Speed of height adjustment

interface Point {
  x: number;
  y: number;
}

interface Point3D extends Point {
  z: number;
}

interface Tile {
  height: number;
  type: 'water' | 'sand' | 'grass' | 'stone' | 'snow';
}

const TerrainExplorer: React.FC = () => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<Tile[][]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Game State
  const [gameState, setGameState] = useState<{
    player: Point3D;
    camera: Point;
  }>({
    player: { x: 15, y: 15, z: 0 },
    camera: { x: 15, y: 15 }
  });

  const keysPressed = useRef<Set<string>>(new Set());

  // Initialize Map
  useEffect(() => {
    const p = new Uint8Array(512);
    const permutation = Array.from({ length: 256 }, () => Math.floor(Math.random() * 256));
    for (let i = 0; i < 512; i++) p[i] = permutation[i % 256];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(t, a, b) { return a + t * (b - a); }

    function noise2D(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;

      x -= Math.floor(x);
      y -= Math.floor(y);

      const u = fade(x);
      const v = fade(y);

      // Hash coordinates of the 4 corners
      const aa = p[p[X] + Y];
      const ab = p[p[X] + Y + 1];
      const ba = p[p[X + 1] + Y];
      const bb = p[p[X + 1] + Y + 1];

      // Interpolate between the corners
      return lerp(v, lerp(u, aa, ba), lerp(u, ab, bb)) / 255;
    }
    const scale = 0.2;
    const newMap: Tile[][] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      const row: Tile[] = [];
      for (let y = 0; y < MAP_SIZE; y++) {
        const rawHeight = (noise2D(x * scale, y * scale) + 1) / 2;
        let height = 0;
        let type: Tile['type'] = 'water';

        if (rawHeight < 0.58) { type = 'water'; height = 0; }
        else if (rawHeight < 0.62) { type = 'sand'; height = 1; }
        else if (rawHeight < 0.9) { type = 'grass'; height = 1 + Math.random() * 0.8; }
        else if (rawHeight < 0.95) { type = 'stone'; height = 2 + Math.random(); }
        else { type = 'snow'; height = 3.5 + Math.random() * 1.5; }
        height = height * 0.4
        row.push({ height, type });
      }
      newMap.push(row);
    }
    setMap(newMap);

    // Set initial Z
    const initialZ = newMap[15]?.[15]?.height || 0;
    setGameState({
      player: { x: 15, y: 15, z: initialZ },
      camera: { x: 15, y: 15 }
    });
  }, []);

  // Resize Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        keysPressed.current.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    if (map.length === 0) return;

    let animationFrameId: number;

    const loop = () => {
      setGameState(prev => {
        let { x, y, z } = prev.player;
        let { x: camX, y: camY } = prev.camera;

        // 1. Calculate Velocity
        let dx = 0;
        let dy = 0;

        if (keysPressed.current.has('ArrowUp')) dy -= 1;
        if (keysPressed.current.has('ArrowDown')) dy += 1;
        if (keysPressed.current.has('ArrowLeft')) dx -= 1;
        if (keysPressed.current.has('ArrowRight')) dx += 1;

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
          dx *= 0.707;
          dy *= 0.707;
        }

        // Apply Movement
        x += dx * MOVE_SPEED;
        y += dy * MOVE_SPEED;

        // Bounds
        x = Math.max(0, Math.min(MAP_SIZE - 1, x));
        y = Math.max(0, Math.min(MAP_SIZE - 1, y));

        // 2. Calculate Height
        const tileX = Math.round(x);
        const tileY = Math.round(y);
        const targetZ = map[tileX]?.[tileY]?.height ?? 0;

        // Lerp Z
        const newZ = z + (targetZ - z) * HEIGHT_SMOOTHING;

        // 3. Update Camera (Lerp towards player)
        const newCamX = camX + (x - camX) * CAMERA_SMOOTHING;
        const newCamY = camY + (y - camY) * CAMERA_SMOOTHING;

        // Stop updates if idle to save resources
        const isIdle = dx === 0 && dy === 0;
        const isStabilized =
          Math.abs(x - camX) < 0.001 &&
          Math.abs(y - camY) < 0.001 &&
          Math.abs(targetZ - z) < 0.001;

        if (isIdle && isStabilized) {
          return prev;
        }

        return {
          player: { x, y, z: newZ },
          camera: { x: newCamX, y: newCamY }
        };
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [map]);

  // Tile Colors
  const getTileColors = (type: Tile['type']) => {
    switch (type) {
      case 'water': return { top: '#3b82f6', side: '#1d4ed8', stroke: '#1e40af' };
      case 'sand': return { top: '#fde047', side: '#eab308', stroke: '#ca8a04' };
      case 'grass': return { top: '#22c55e', side: '#15803d', stroke: '#14532d' };
      case 'stone': return { top: '#94a3b8', side: '#64748b', stroke: '#475569' };
      case 'snow': return { top: '#f8fafc', side: '#cbd5e1', stroke: '#94a3b8' };
      default: return { top: '#666', side: '#444', stroke: '#333' };
    }
  };

  // 1. Memoized Static Terrain
  const staticTerrain = useMemo(() => {
    if (map.length === 0) return null;

    const elements: React.ReactElement[] = [];

    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        const tile = map[x][y];

        // Iso Coordinates (World Space)
        const isoX = (x - y) * TILE_WIDTH / 2;
        const isoY = (x + y) * TILE_HEIGHT / 2;

        // Calculate visual height
        const zOffset = tile.height * Z_SCALE;
        const finalY = isoY - zOffset;

        // Depth logic: Extend sides down to the common base level (plus base thickness)
        // This ensures all columns appear grounded at the same level (z=0 + thickness)
        const depth = zOffset + BASE_DEPTH;

        const colors = getTileColors(tile.type);

        // Coords relative to (isoX, isoY)
        const leftX = isoX - TILE_WIDTH / 2;
        const centerX = isoX;
        const rightX = isoX + TILE_WIDTH / 2;

        const topY = finalY;
        const midY = finalY + TILE_HEIGHT / 2;
        const bottomY = finalY + TILE_HEIGHT;

        elements.push(
          <g key={`${x}-${y}`}>
            {/* Left Face */}
            <path
              d={`M${leftX},${midY} L${centerX},${bottomY} L${centerX},${bottomY + depth} L${leftX},${midY + depth} Z`}
              fill={colors.side}
              stroke={colors.stroke}
              strokeWidth="0.5"
              filter="brightness(0.8)"
            />
            {/* Right Face */}
            <path
              d={`M${centerX},${bottomY} L${rightX},${midY} L${rightX},${midY + depth} L${centerX},${bottomY + depth} Z`}
              fill={colors.side}
              stroke={colors.stroke}
              strokeWidth="0.5"
            />
            {/* Top Face */}
            <path
              d={`M${leftX},${midY} L${centerX},${topY} L${rightX},${midY} L${centerX},${bottomY} Z`}
              fill={colors.top}
              stroke={colors.stroke}
              strokeWidth="0.5"
            />
          </g>
        );
      }
    }
    return <g>{elements}</g>;
  }, [map]);

  // 2. Dynamic View & Player Calculation
  const { viewBox, playerRender } = useMemo(() => {
    if (map.length === 0 || dimensions.width === 0) return { viewBox: '0 0 100 100', playerRender: null };

    // Camera (ViewBox) Calculation
    // We ignore Z for the camera center to prevent vertical jittering when moving over bumps
    const cIsoX = (gameState.camera.x - gameState.camera.y) * TILE_WIDTH / 2;
    const cIsoY = (gameState.camera.x + gameState.camera.y) * TILE_HEIGHT / 2;

    // Add offset for center screen
    const vbX = cIsoX - dimensions.width / 2;
    const vbY = cIsoY - dimensions.height / 2;

    const viewBoxStr = `${vbX} ${vbY} ${dimensions.width} ${dimensions.height}`;

    // Player Graphic Calculation
    const pIsoX = (gameState.player.x - gameState.player.y) * TILE_WIDTH / 2;
    const pIsoY = (gameState.player.x + gameState.player.y) * TILE_HEIGHT / 2;
    const pZ = gameState.player.z * Z_SCALE;

    const playerGraphic = (
      <g transform={`translate(${pIsoX}, ${pIsoY - pZ})`}>
        {/* Shadow (projected on the tile top surface) */}
        <ellipse
          cx="0" cy="0" rx="12" ry="6"
          fill="rgba(0,0,0,0.4)"
          transform={`translate(0, ${TILE_HEIGHT / 2})`}
        />

        {/* Figure */}
        <g transform={`translate(0, ${TILE_HEIGHT / 2})`}>
          <g transform="translate(0, -5)" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            {/* Legs */}
            <path d="M-6,0 L0,-12 M6,0 L0,-12" />
            {/* Torso */}
            <path d="M0,-12 L0,-28" />
            {/* Arms */}
            <path d="M0,-22 L-10,-16 M0,-22 L10,-16" />
            {/* Head */}
            <circle cx="0" cy="-34" r="6" fill="white" stroke="black" />
          </g>
        </g>
      </g>
    );

    return { viewBox: viewBoxStr, playerRender: playerGraphic };

  }, [gameState, dimensions, map]);


  return (
    <div ref={containerRef} className="w-full h-full bg-gray-700 overflow-hidden relative transition-colors duration-200">
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        className="block"
      >
        {staticTerrain}
        {playerRender}
      </svg>

      <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg border border-gray-200 dark:border-gray-800 backdrop-blur pointer-events-none text-xs text-gray-600 dark:text-gray-400 z-10">
        <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Controls</p>
        <p>Arrow Keys to move</p>
        <p>Pos: {gameState.player.x.toFixed(1)}, {gameState.player.y.toFixed(1)}</p>
      </div>
    </div>
  );
};

export default TerrainExplorer;