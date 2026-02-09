
import React, { Suspense, lazy } from 'react';

const PhaserGame = lazy(() => import('./PhaserGame'));

const TerrainExplorer = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full w-full text-gray-500">Loading Terrain Engine...</div>}>
            <div className="w-full h-full bg-gray-900 overflow-hidden relative">
                <PhaserGame />
                {/* Overlay UI if needed */}
                <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-900/80 p-3 rounded-lg border border-gray-200 dark:border-gray-800 backdrop-blur pointer-events-none text-xs text-gray-600 dark:text-gray-400 z-10">
                    <p className="font-bold text-gray-800 dark:text-gray-200 mb-1">Controls</p>
                    <p>Arrow Keys to move</p>
                </div>
            </div>
        </Suspense>
    );
};

export default TerrainExplorer;
