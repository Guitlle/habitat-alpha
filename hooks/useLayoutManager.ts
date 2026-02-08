import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ToolType, Panel } from '../types';

export const useLayoutManager = (
    t: any,
    dirtyFileIds: Set<string>,
    activePanels: Panel[],
    setActivePanels: React.Dispatch<React.SetStateAction<Panel[]>>
) => {
    const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'team'>('ai');
    const [chatWidth, setChatWidth] = useState(30);
    const [panelHeights, setPanelHeights] = useState<number[]>([100]);
    const [isDraggingVertical, setIsDraggingVertical] = useState(false);

    const panelHeightsRef = useRef<number[]>([100]);
    const activeDragIndexRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const mainContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const count = activePanels.length;
        if (count === 0) {
            setPanelHeights([]);
            panelHeightsRef.current = [];
        } else {
            const newHeight = 100 / count;
            const newHeights = new Array(count).fill(newHeight);
            setPanelHeights(newHeights);
            panelHeightsRef.current = newHeights;
        }
    }, [activePanels]);

    useEffect(() => {
        panelHeightsRef.current = panelHeights;
    }, [panelHeights]);

    const toggleTool = useCallback((toolId: ToolType) => {
        if (toolId === ToolType.CHAT) return;

        if (activePanels.some(p => p.id === toolId) && toolId === ToolType.FILE_VIEWER) {
            if (dirtyFileIds.size > 0) {
                alert(t.files.unsaved_warning);
                return;
            }
        }

        setActivePanels(prev => {
            const exists = prev.some(p => p.id === toolId);
            if (exists) {
                return prev.filter(p => p.id !== toolId);
            } else {
                const newPanel: Panel = { id: toolId, type: toolId };
                const next = [...prev, newPanel];
                return next.length > 3 ? next.slice(1) : next;
            }
        });
    }, [activePanels, dirtyFileIds, t.files.unsaved_warning, setActivePanels]);

    const closePanel = useCallback((panelId: string) => {
        if (panelId === ToolType.FILE_VIEWER && dirtyFileIds.size > 0) {
            alert(t.files.unsaved_warning);
            return;
        }
        setActivePanels(prev => prev.filter(p => p.id !== panelId));
    }, [dirtyFileIds, t.files.unsaved_warning, setActivePanels]);

    const handleChatResizeMove = useCallback((e: MouseEvent) => {
        const sidebarWidth = 64;
        const availableWidth = window.innerWidth - sidebarWidth;
        const mouseXRelativeToContent = e.clientX - sidebarWidth;
        let newPercentage = ((availableWidth - mouseXRelativeToContent) / availableWidth) * 100;
        newPercentage = Math.min(80, Math.max(20, newPercentage));
        setChatWidth(newPercentage);
    }, []);

    const handleChatResizeEnd = useCallback(() => {
        document.removeEventListener('mousemove', handleChatResizeMove);
        document.removeEventListener('mouseup', handleChatResizeEnd);
    }, [handleChatResizeMove]);

    const handleChatResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleChatResizeMove);
        document.addEventListener('mouseup', handleChatResizeEnd);
    };

    const handleVerticalResizeMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || activeDragIndexRef.current === null || !mainContentRef.current) return;

        const containerRect = mainContentRef.current.getBoundingClientRect();
        const relativeY = e.clientY - containerRect.top;
        const percentageY = (relativeY / containerRect.height) * 100;

        const index = activeDragIndexRef.current;

        setPanelHeights(prev => {
            const next = [...prev];
            let startPct = 0;
            for (let i = 0; i < index; i++) startPct += next[i];

            const combinedHeight = next[index] + next[index + 1];
            const endPct = startPct + combinedHeight;

            const minSize = 5;
            const newSplit = Math.max(startPct + minSize, Math.min(endPct - minSize, percentageY));

            const newTopHeight = newSplit - startPct;
            const newBottomHeight = endPct - newSplit;

            next[index] = newTopHeight;
            next[index + 1] = newBottomHeight;

            return next;
        });
    }, []);

    const handleVerticalResizeEnd = useCallback(() => {
        isDraggingRef.current = false;
        activeDragIndexRef.current = null;
        setIsDraggingVertical(false);
        document.removeEventListener('mousemove', handleVerticalResizeMove);
        document.removeEventListener('mouseup', handleVerticalResizeEnd);
    }, [handleVerticalResizeMove]);

    const handleVerticalResizeStart = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        activeDragIndexRef.current = index;
        isDraggingRef.current = true;
        setIsDraggingVertical(true);

        document.addEventListener('mousemove', handleVerticalResizeMove);
        document.addEventListener('mouseup', handleVerticalResizeEnd);
    };

    return {
        rightPanelTab,
        setRightPanelTab,
        chatWidth,
        panelHeights,
        isDraggingVertical,
        mainContentRef,
        actions: {
            toggleTool,
            closePanel,
            chatResizeStart: handleChatResizeStart,
            verticalResizeStart: handleVerticalResizeStart
        }
    };
};
