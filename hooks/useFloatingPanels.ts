import { useState, useCallback, useRef, useEffect } from 'react';
import { Panel, ToolType } from '../types';

export interface PanelState {
    id: string;
    type: ToolType;
    title?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    isCollapsed: boolean;
    data?: any;
}

interface DragState {
    type: 'move' | 'resize';
    panelId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
}

export const useFloatingPanels = () => {
    const [panels, setPanels] = useState<Record<string, PanelState>>({});
    const [activePanelId, setActivePanelId] = useState<string | null>(null); // For z-index management
    const dragState = useRef<DragState | null>(null);

    // Initialize with a default z-index counter
    const zIndexCounter = useRef(100);

    const openPanel = useCallback((id: string, type: ToolType, title?: string, data?: any) => {
        setPanels(prev => {
            if (prev[id]) {
                // Already open, just separate bring to front logic if needed, but here we just return
                // We'll bring to front in a separate effect or call if desired
                return prev;
            }

            const width = 600;
            const height = 400;
            // Center roughly
            const x = window.innerWidth / 2 - width / 2;
            const y = window.innerHeight / 2 - height / 2;

            zIndexCounter.current += 1;

            return {
                ...prev,
                [id]: {
                    id,
                    type,
                    title,
                    x: Math.max(0, x),
                    y: Math.max(0, y),
                    width,
                    height,
                    zIndex: zIndexCounter.current,
                    isCollapsed: false,
                    data
                }
            };
        });
        setActivePanelId(id);
    }, []);

    const closePanel = useCallback((id: string) => {
        setPanels(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        if (activePanelId === id) setActivePanelId(null);
    }, [activePanelId]);

    const toggleCollapse = useCallback((id: string) => {
        setPanels(prev => {
            if (!prev[id]) return prev;
            return {
                ...prev,
                [id]: {
                    ...prev[id],
                    isCollapsed: !prev[id].isCollapsed,
                    // Auto-resize height if expanding? No, keep previous height or default?
                    // We'll keep the stored height but the renderer will ignore it when collapsed
                }
            };
        });
        bringToFront(id);
    }, []);

    const bringToFront = useCallback((id: string) => {
        setPanels(prev => {
            if (!prev[id] || prev[id].zIndex === zIndexCounter.current) return prev;

            zIndexCounter.current += 1;
            return {
                ...prev,
                [id]: {
                    ...prev[id],
                    zIndex: zIndexCounter.current
                }
            };
        });
        setActivePanelId(id);
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent, id: string, type: 'move' | 'resize') => {
        e.preventDefault(); // Prevent text selection
        e.stopPropagation();

        bringToFront(id);

        const panel = panels[id];
        if (!panel) return;

        dragState.current = {
            type,
            panelId: id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: panel.x,
            initialY: panel.y,
            initialWidth: panel.width,
            initialHeight: panel.height
        };

        // Add global listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [panels, bringToFront]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.current) return;

        const { type, panelId, startX, startY, initialX, initialY, initialWidth, initialHeight } = dragState.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        setPanels(prev => {
            const panel = prev[panelId];
            if (!panel) return prev;

            if (type === 'move') {
                return {
                    ...prev,
                    [panelId]: {
                        ...panel,
                        x: initialX + dx,
                        y: initialY + dy
                    }
                };
            } else {
                // Resize
                return {
                    ...prev,
                    [panelId]: {
                        ...panel,
                        width: Math.max(300, initialWidth + dx),
                        height: Math.max(150, initialHeight + dy)
                    }
                };
            }
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        dragState.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    return {
        panels,
        activePanelId,
        openPanel,
        closePanel,
        toggleCollapse,
        bringToFront,
        handleMouseDown
    };
};
