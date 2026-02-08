import { useState, useCallback } from 'react';
import { MemoryGraphData, MemoryNode, MemoryLink } from '../types';
import { INITIAL_MEMORY_NODES, INITIAL_MEMORY_LINKS } from '../constants';
import { db } from '../services/db';
import { syncService } from '../services/syncService';

export const useMemoryManager = (userId?: string) => {
    const [memoryData, setMemoryData] = useState<MemoryGraphData>({
        nodes: INITIAL_MEMORY_NODES,
        links: INITIAL_MEMORY_LINKS
    });

    const addMemoryNode = useCallback(async (label: string, group?: number, importance?: number) => {
        const newNodeId = Date.now().toString();
        const newNode: MemoryNode = { id: newNodeId, label, group: group || 3, val: importance || 10 };
        const newLink: MemoryLink = { source: memoryData.nodes[0]?.id || 'root', target: newNodeId, value: 2 };

        // Local DB
        await db.addMemoryNode(newNode);
        await db.addMemoryLink(newLink);

        // Sync
        if (userId) {
            await syncService.push('memory_nodes', newNode, userId);
            await syncService.push('memory_links', { ...newLink, id: `${newLink.source}-${newLink.target}` }, userId);
        }

        setMemoryData(prev => ({
            nodes: [...prev.nodes, newNode],
            links: [...prev.links, newLink]
        }));
    }, [userId, memoryData.nodes]);

    return {
        memoryData,
        setMemoryData,
        actions: {
            addMemoryNode
        }
    };
};
