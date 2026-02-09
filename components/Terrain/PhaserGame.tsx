
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

interface PhaserGameProps {
    height?: number | string;
    width?: number | string;
}

const PhaserGame: React.FC<PhaserGameProps> = ({ height = '100%', width = '100%' }) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current) return;

        // Destroy any existing game instance to be safe
        if (gameInstanceRef.current) {
            gameInstanceRef.current.destroy(true);
            gameInstanceRef.current = null;
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
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

        gameInstanceRef.current = new Phaser.Game(config);

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
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
