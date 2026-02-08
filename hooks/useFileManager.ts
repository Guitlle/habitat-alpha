import React, { useState, useCallback, useMemo } from 'react';
import { FileNode, ToolType, Panel } from '../types';
import { db } from '../services/db';

export const useFileManager = (
    t: any,
    activePanels: Panel[],
    setActivePanels: React.Dispatch<React.SetStateAction<Panel[]>>
) => {
    const [flatFiles, setFlatFiles] = useState<FileNode[]>([]);
    const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());

    const handleOpenFile = useCallback((file: FileNode) => {
        setOpenFiles(prev => {
            if (prev.some(f => f.id === file.id)) return prev;
            return [...prev, file];
        });
        setActiveFileId(file.id);

        setActivePanels(prev => {
            const exists = prev.some(p => p.type === ToolType.FILE_VIEWER);
            if (exists) return prev;

            const newPanel: Panel = {
                id: ToolType.FILE_VIEWER,
                type: ToolType.FILE_VIEWER,
                title: 'Editor'
            };
            const next = [...prev, newPanel];
            return next.length > 3 ? next.slice(1) : next;
        });
    }, [setActivePanels]);

    const handleCloseTab = useCallback((fileId: string) => {
        if (dirtyFileIds.has(fileId)) {
            if (!confirm(`File has unsaved changes. Close anyway?`)) return;
        }

        setOpenFiles(prev => prev.filter(f => f.id !== fileId));
        setDirtyFileIds(prev => {
            const next = new Set(prev);
            next.delete(fileId);
            return next;
        });

        if (activeFileId === fileId) {
            setOpenFiles(prev => {
                const remaining = prev.filter(f => f.id !== fileId);
                if (remaining.length > 0) {
                    setActiveFileId(remaining[remaining.length - 1].id);
                } else {
                    setActiveFileId(null);
                }
                return prev;
            });
        }
    }, [activeFileId, dirtyFileIds]);

    const handleAddFile = useCallback(async (node: FileNode) => {
        await db.addFile(node);
        setFlatFiles(prev => [...prev, node]);
    }, []);

    const handleUpdateFile = useCallback(async (node: FileNode) => {
        await db.updateFile(node);
        setFlatFiles(prev => prev.map(f => f.id === node.id ? node : f));
        setOpenFiles(prev => prev.map(f => f.id === node.id ? node : f));
    }, []);

    const handleSaveFileContent = useCallback(async (file: FileNode, content: string) => {
        const updated = { ...file, content, updatedAt: new Date() };
        await handleUpdateFile(updated);
        setDirtyFileIds(prev => {
            const next = new Set(prev);
            next.delete(file.id);
            return next;
        });
    }, [handleUpdateFile]);

    const handleDeleteFile = useCallback(async (nodeId: string) => {
        const findDescendants = (id: string, allFiles: FileNode[]): string[] => {
            const children = allFiles.filter(f => f.parentId === id);
            let ids = children.map(c => c.id);
            children.forEach(c => {
                ids = [...ids, ...findDescendants(c.id, allFiles)];
            });
            return ids;
        };
        const idsToDelete = [nodeId, ...findDescendants(nodeId, flatFiles)];
        for (const id of idsToDelete) {
            await db.deleteFile(id);
        }
        setFlatFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
        setOpenFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
    }, [flatFiles]);

    const handleDirtyChange = useCallback((fileId: string, isDirty: boolean) => {
        setDirtyFileIds(prev => {
            const next = new Set(prev);
            if (isDirty) next.add(fileId);
            else next.delete(fileId);
            return next;
        });
    }, []);

    const fileTree = useMemo(() => {
        const buildTree = (parentId: string | undefined): FileNode[] => {
            return flatFiles
                .filter(f => f.parentId === parentId || (!parentId && !f.parentId))
                .map(f => ({ ...f, children: buildTree(f.id) }));
        };
        return buildTree(undefined);
    }, [flatFiles]);

    return {
        flatFiles,
        setFlatFiles,
        openFiles,
        activeFileId,
        setActiveFileId,
        dirtyFileIds,
        fileTree,
        actions: {
            openFile: handleOpenFile,
            closeTab: handleCloseTab,
            addFile: handleAddFile,
            updateFile: handleUpdateFile,
            saveFileContent: handleSaveFileContent,
            deleteFile: handleDeleteFile,
            dirtyChange: handleDirtyChange
        }
    };
};
