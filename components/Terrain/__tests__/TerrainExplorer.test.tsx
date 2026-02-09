
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PhaserGame from '../PhaserGame';
import React from 'react';

// Mock Phaser
vi.mock('phaser', () => {
    const MockGame = vi.fn();
    MockGame.prototype.destroy = vi.fn();
    return {
        default: {
            Game: MockGame,
            Scene: class { },
            AUTO: 'AUTO',
            Scale: {
                RESIZE: 'RESIZE',
                CENTER_BOTH: 'CENTER_BOTH'
            }
        }
    };
});

describe('PhaserGame Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders the game container', () => {
        render(<PhaserGame />);
        const container = screen.getByTestId('phaser-game-container'); // This ID might not exist yet, need to add it in PhaserGame render or assume based on structure
        expect(container).toBeInTheDocument();
    });

    it('initializes Phaser Game on mount', async () => {
        render(<PhaserGame />);
        const Phaser = await import('phaser');
        expect(Phaser.default.Game).toHaveBeenCalled();
    });

    it('destroys Phaser Game on unmount', async () => {
        const { unmount } = render(<PhaserGame />);
        const Phaser = await import('phaser');
        // Get the mock instance
        const mockGameInstance = (Phaser.default.Game as any).mock.results[0].value;

        unmount();

        expect(mockGameInstance.destroy).toHaveBeenCalledWith(true);
    });
});
