import { useState, useCallback } from 'react';
import { MemoryGraphData } from '../types';
import { INITIAL_MEMORY_NODES, INITIAL_MEMORY_LINKS } from '../constants';

export const useMemoryManager = () => {
    const [memoryData, setMemoryData] = useState<MemoryGraphData>({
        nodes: INITIAL_MEMORY_NODES,
        links: INITIAL_MEMORY_LINKS
    });

    const addMemoryNode = useCallback((label: string, group?: number, importance?: number) => {
        const newNodeId = Date.now().toString();
        setMemoryData(prev => ({
            nodes: [...prev.nodes, { id: newNodeId, label, group: group || 3, val: importance || 10 }],
            links: [...prev.links, { source: prev.nodes[0].id, target: newNodeId, value: 2 }]
        }));
    }, []);

    return {
        memoryData,
        setMemoryData,
        actions: {
            addMemoryNode
        }
    };
};
