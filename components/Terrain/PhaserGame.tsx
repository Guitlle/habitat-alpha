
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

interface PhaserGameProps {
    height?: number | string;
    width?: number | string;
}

// Global variable to hold the single game instance across mounts
let globalGame: Phaser.Game | null = null;

const PhaserGame: React.FC<PhaserGameProps> = ({ height = '100%', width = '100%' }) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);

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
            }
        };

        // Use ResizeObserver to detect when the container has valid size
        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    initOrResumeGame();
                    // Once initialized/resumed with valid size, we can disconnect if we only cared about the initial 0-size check,
                    // but keeping it allows responding to dynamic resizing of the panel.
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
