import React from 'react';
import { FileNode } from '../types';
import FileViewer from './FileViewer';
import { X, FileCode } from 'lucide-react';

interface FileEditorGroupProps {
  files: FileNode[];
  activeFileId: string | null;
  onSetActiveFile: (id: string) => void;
  onCloseFile: (id: string) => void;
  onSaveFile: (file: FileNode, content: string) => void;
  onDirtyChange: (fileId: string, isDirty: boolean) => void;
  dirtyFiles: Set<string>;
}

const FileEditorGroup: React.FC<FileEditorGroupProps> = ({ 
  files, 
  activeFileId, 
  onSetActiveFile, 
  onCloseFile, 
  onSaveFile,
  onDirtyChange,
  dirtyFiles
}) => {
  if (files.length === 0) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
              <FileCode size={48} className="mb-4 opacity-20" />
              <p className="text-sm">No files open</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Tabs */}
      <div className="flex overflow-x-auto bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 no-scrollbar">
        {files.map(file => {
          const isActive = file.id === activeFileId;
          const isDirty = dirtyFiles.has(file.id);
          return (
            <div 
              key={file.id}
              onClick={() => onSetActiveFile(file.id)}
              className={`
                group flex items-center gap-2 px-3 py-2 text-xs border-r border-gray-200 dark:border-gray-800 cursor-pointer select-none min-w-[120px] max-w-[200px]
                ${isActive ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-500' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-300 border-t-2 border-t-transparent'}
              `}
            >
              <span className="truncate flex-1">{file.name}</span>
              {isDirty && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
              <button 
                onClick={(e) => { e.stopPropagation(); onCloseFile(file.id); }}
                className={`p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 ${isDirty ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400'}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {files.map(file => (
           <div 
             key={file.id} 
             className="absolute inset-0 bg-white dark:bg-gray-950"
             style={{ visibility: file.id === activeFileId ? 'visible' : 'hidden' }}
           >
              <FileViewer 
                file={file} 
                onSave={onSaveFile} 
                onDirtyChange={onDirtyChange} 
              />
           </div>
        ))}
      </div>
    </div>
  );
};

export default FileEditorGroup;