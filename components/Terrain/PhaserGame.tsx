
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

interface PhaserGameProps {
    height?: number | string;
    width?: number | string;
    nodes?: any[]; // FileNode[] - using any to avoid import cycles or strict typing issues for now, or import FileNode
    onOpenFile?: (node: any) => void;
    onNavigate?: (folderId: string) => void;
}

// Global variable to hold the single game instance across mounts
let globalGame: Phaser.Game | null = null;

const PhaserGame: React.FC<PhaserGameProps> = ({ height = '100%', width = '100%', nodes = [], onOpenFile, onNavigate }) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);

    // Effect to update scene when nodes change
    useEffect(() => {
        if (globalGame && globalGame.scene) {
            const scene = globalGame.scene.getScene('MainScene') as any;
            if (scene && scene.loadLevel) {
                scene.loadLevel(nodes);
            }
        }
    }, [nodes]);

    // Effect to update callbacks
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

            // 1. Safety check: Do not init if dimensions are 0 (causes Incomplete Attachment)
            if (clientWidth === 0 || clientHeight === 0) return;

            if (!globalGame) {
                // First load: Create the game instance
                const config: Phaser.Types.Core.GameConfig = {
                    type: Phaser.AUTO,
                    parent: container,
                    width: '100%',
                    height: '100%',
                    scene: [MainScene],
                    physics: {
                        default: 'arcade',
                        arcade: {
                            gravity: { x: 0, y: 0 }
                        }
                    },
                    scale: {
                        mode: Phaser.Scale.RESIZE,
                        autoCenter: Phaser.Scale.CENTER_BOTH
                    }
                };
                globalGame = new Phaser.Game(config);

                // Pass initial data once scene is ready
                // We can't easily pass it in constructor config for AUTO scene start
                // But MainScene can pull from a global or we use an event.
                // Or simplified: just wait for the useEffect [nodes] to fire? 
                // The useEffect [nodes] might fire before game is ready.
                // Let's add a "ready" event listener or just rely on the effect retrying or duplicate call.

                // Actual robust way: Use registry
                globalGame.registry.set('initialNodes', nodes);
                globalGame.registry.set('onOpenFile', onOpenFile);
                globalGame.registry.set('onNavigate', onNavigate);

            } else {
                // Subsequent loads: Resume and Reparent
                if (globalGame.canvas && !container.contains(globalGame.canvas)) {
                    container.appendChild(globalGame.canvas);
                }

                // Update the parent reference in ScaleManager so it measures the correct element
                // We cast to any because the type definition might mark it as readonly, but we need to update it
                (globalGame.scale as any).parent = container;

                // Resume game loop
                globalGame.loop.wake();

                // Force a resize update to match new container
                // We do NOT call refresh() because it relies on the parent's observed size which might lag or be incorrect
                // Instead we explicitly resize to the known client dimensions
                globalGame.scale.resize(clientWidth, clientHeight);

                // Update Scene Data immediately on resume
                const scene = globalGame.scene.getScene('MainScene') as any;
                if (scene) {
                    // Only update callbacks, do not force reload level as it resets state
                    scene.onOpenFile = onOpenFile;
                    scene.onNavigate = onNavigate;
                }
            }
        };

        // Use ResizeObserver to detect when the container has valid size
        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    initOrResumeGame();
                }
            }
        });

        resizeObserver.observe(container);

        return () => {
            // Cleanup: Pause instead of Destroy
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (globalGame) {
                // Sleep the loop to save resources while hidden
                globalGame.loop.sleep();
            }
        };
    }, []); // Empty dependency array for init, but we handle updates in separate effect

    return (
        <div
            ref={gameContainerRef}
            style={{ width, height, overflow: 'hidden' }}
            data-testid="phaser-game-container"
        />
    );
};

export default PhaserGame;
