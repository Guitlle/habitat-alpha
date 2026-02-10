
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

interface PhaserGameProps {
    height?: number | string;
    width?: number | string;
    nodes?: any[]; // FileNode[]
    onOpenFile?: (node: any) => void;
    onNavigate?: (folderId: string) => void;
}

// Global variable to hold the single game instance across mounts
let globalGame: Phaser.Game | null = null;

const PhaserGame: React.FC<PhaserGameProps> = ({ height = '100%', width = '100%', nodes = [], onOpenFile, onNavigate }) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const nodesRef = useRef(nodes);
    const onOpenFileRef = useRef(onOpenFile);
    const onNavigateRef = useRef(onNavigate);
    const prevLoadedNodesRef = useRef<any[]>([]);

    // Helper to check if level update is needed
    // We ignore content/metadata updates, only care about structure/names for the map
    const shouldUpdateLevel = (nextNodes: any[]) => {
        const prev = prevLoadedNodesRef.current;
        if (prev === nextNodes) return false; // Same reference
        if (prev.length !== nextNodes.length) return true;

        for(let i = 0; i < prev.length; i++) {
            if (prev[i].id !== nextNodes[i].id) return true;
            if (prev[i].name !== nextNodes[i].name) return true;
            if (prev[i].type !== nextNodes[i].type) return true;
            if (prev[i].children?.length !== nextNodes[i].children?.length) return true;
        }
        return false;
    };

    // Update refs whenever props change
    useEffect(() => {
        nodesRef.current = nodes;
        onOpenFileRef.current = onOpenFile;
        onNavigateRef.current = onNavigate;
    }, [nodes, onOpenFile, onNavigate]);

    // Effect to update level only when nodes meaningfully change
    useEffect(() => {
        if (globalGame && globalGame.scene) {
            const scene = globalGame.scene.getScene('MainScene') as any;
            if (scene && scene.loadLevel) {
                if (shouldUpdateLevel(nodes)) {
                    // console.log("PhaserGame: Updating Level (Nodes changed)");
                    scene.loadLevel(nodes);
                    prevLoadedNodesRef.current = nodes;
                }
            }
        }
    }, [nodes]);

    // Separate effect for callbacks to avoid level reload
    useEffect(() => {
        if (globalGame && globalGame.scene) {
            const scene = globalGame.scene.getScene('MainScene') as any;
            if (scene) {
                scene.onOpenFile = onOpenFile;
                scene.onNavigate = onNavigate;
            }
        }
    }, [onOpenFile, onNavigate]);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        const container = gameContainerRef.current;
        let resizeObserver: ResizeObserver | null = null;

        const initOrResumeGame = () => {
            if (!container) return;
            const { clientWidth, clientHeight } = container;

            // Safety check
            if (clientWidth === 0 || clientHeight === 0) return;

            if (!globalGame) {
                // First load
                const config: Phaser.Types.Core.GameConfig = {
                    type: Phaser.AUTO,
                    parent: container,
                    width: '100%',
                    height: '100%',
                    scene: [MainScene],
                    transparent: true, // often better for UI integration
                    physics: {
                        default: 'arcade',
                        arcade: {
                            gravity: { x: 0, y: 0 } // Fix: gravity object was { x, y } but type check might fail if strict
                        }
                    },
                    scale: {
                        mode: Phaser.Scale.RESIZE,
                        autoCenter: Phaser.Scale.CENTER_BOTH
                    }
                };
                globalGame = new Phaser.Game(config);

                // Initialize registry
                globalGame.registry.set('initialNodes', nodesRef.current);
                globalGame.registry.set('onOpenFile', onOpenFileRef.current);
                globalGame.registry.set('onNavigate', onNavigateRef.current);

                prevLoadedNodesRef.current = nodesRef.current;

            } else {
                // Resume and Reparent
                if (globalGame.canvas && !container.contains(globalGame.canvas)) {
                    container.appendChild(globalGame.canvas);
                }

                (globalGame.scale as any).parent = container;
                globalGame.loop.wake();
                globalGame.scale.resize(clientWidth, clientHeight);

                // Update Scene Data immediately on resume
                const scene = globalGame.scene.getScene('MainScene') as any;
                if (scene) {
                    scene.onOpenFile = onOpenFileRef.current;
                    scene.onNavigate = onNavigateRef.current;

                    // Check if we need to reload level (e.g. navigated away and came back with different folder)
                    if (scene.loadLevel && shouldUpdateLevel(nodesRef.current)) {
                         // console.log("PhaserGame: Reloading Level on Resume");
                         scene.loadLevel(nodesRef.current);
                         prevLoadedNodesRef.current = nodesRef.current;
                    }
                }
            }
        };

        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    initOrResumeGame();
                }
            }
        });

        resizeObserver.observe(container);

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (globalGame) {
                globalGame.loop.sleep();
            }
        };
    }, []);

    return (
        <div
            ref={gameContainerRef}
            style={{ width, height, overflow: 'hidden' }}
            data-testid="phaser-game-container"
        />
    );
};

export default PhaserGame;
