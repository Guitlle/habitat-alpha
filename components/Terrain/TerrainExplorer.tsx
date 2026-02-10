
import React, { Suspense, lazy, useState, useMemo } from 'react';
import { FileNode } from '../../types';
import { ArrowLeft } from 'lucide-react';

const PhaserGame = lazy(() => import('./PhaserGame'));

interface TerrainExplorerProps {
    fileTree: FileNode[];
    fileActions: {
        openFile: (file: FileNode) => void;
        // add other actions if needed
    };
}

const TerrainExplorer: React.FC<TerrainExplorerProps> = ({ fileTree, fileActions }) => {
    const [currentDirId, setCurrentDirId] = useState<string | null>(null);

    // Helper to find a node by ID recursively
    const findNode = (nodes: FileNode[], id: string): FileNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Helper to find parent of a node
    const findParent = (nodes: FileNode[], targetId: string, parent: FileNode | null = null): FileNode | null => {
        for (const node of nodes) {
            if (node.id === targetId) return parent;
            if (node.children) {
                const found = findParent(node.children, targetId, node);
                if (found !== undefined) return found; // found could be null (root parent) or a node
            }
        }
        return undefined; // Not found in this branch
    };

    const visibleNodes = useMemo(() => {
        if (!currentDirId) {
            // Root level: Filter top-level nodes
            return fileTree;
        }
        const currentDir = findNode(fileTree, currentDirId);
        const children = currentDir && currentDir.children ? [...currentDir.children] : [];

        // Add Parent Link (Tunnel back)
        children.unshift({
            id: 'PARENT_DIR',
            name: '.. (Up)',
            type: 'folder',
            children: []
        });

        return children;
    }, [fileTree, currentDirId]);

    const handleBack = React.useCallback(() => {
        if (!currentDirId) return;
        const parent = findParent(fileTree, currentDirId);
        setCurrentDirId(parent ? parent.id : null);
    }, [currentDirId, fileTree]);

    const handleNavigate = React.useCallback((folderId: string) => {
        if (folderId === 'PARENT_DIR') {
            handleBack();
            return;
        }
        console.log("TerrainExplorer: Navigating to", folderId);
        setCurrentDirId(folderId);
    }, [handleBack]);

    const currentDirName = currentDirId ? findNode(fileTree, currentDirId)?.name : 'Root';

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full w-full text-gray-500">Loading Terrain Engine...</div>}>
            <div className="w-full h-full bg-gray-900 overflow-hidden relative">

                {/* Navigation Header / Back Button */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    {currentDirId && (
                        <button
                            onClick={handleBack}
                            className="bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 p-2 rounded-full shadow-lg transition-all"
                            title="Go Back"
                        >
                            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
                        </button>
                    )}
                    <span className="bg-white/80 dark:bg-gray-900/80 px-3 py-1 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 backdrop-blur">
                        {currentDirName}
                    </span>
                </div>

                <PhaserGame
                    nodes={visibleNodes}
                    onOpenFile={fileActions.openFile}
                    onNavigate={handleNavigate}
                />

                {/* Overlay UI */}
                <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg border border-gray-200 dark:border-gray-800 backdrop-blur pointer-events-none text-xs text-gray-600 dark:text-gray-400 z-10">
                    <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Controls</p>
                    <p>Arrow Keys to move</p>
                    <p>ENTER to Interact</p>
                </div>
            </div>
        </Suspense>
    );
};

export default TerrainExplorer;
