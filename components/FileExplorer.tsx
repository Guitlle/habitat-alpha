import React, { useState } from 'react';
import { FileNode } from '../types';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, MoreVertical, Edit2, Trash2, FilePlus, FolderPlus, X, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FileExplorerProps {
  files: FileNode[];
  actions: {
    addFile: (node: FileNode) => void;
    updateFile: (node: FileNode) => void;
    deleteFile: (id: string) => void;
    openFile: (node: FileNode) => void;
  };
}

interface FileSystemItemProps {
  node: FileNode;
  depth: number;
  onAdd: (parentId: string, type: 'file' | 'folder') => void;
  onEdit: (node: FileNode) => void;
  onDelete: (id: string) => void;
  onOpenFile: (node: FileNode) => void;
  t: any;
}

const FileSystemItem: React.FC<FileSystemItemProps> = ({ node, depth, onAdd, onEdit, onDelete, onOpenFile, t }) => {
  const [isOpen, setIsOpen] = useState(depth === 0); // Open root by default
  const [showMenu, setShowMenu] = useState(false);
  const isFolder = node.type === 'folder';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };
  
  const dateTooltip = `${t.common.created}: ${node.createdAt?.toLocaleString() || 'Unknown'}\n${t.common.modified}: ${node.updatedAt?.toLocaleString() || 'Unknown'}`;

  return (
    <div className="select-none relative group" title={dateTooltip}>
      <div 
        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 transition-colors ${showMenu ? 'bg-gray-200 dark:bg-gray-800' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
            if (isFolder) setIsOpen(!isOpen);
            else onOpenFile(node);
        }}
        onContextMenu={handleContextMenu}
      >
        <span className="text-gray-500">
          {isFolder ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : <span className="w-3.5" />}
        </span>
        <span className={`${isFolder ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {isFolder ? <Folder size={16} /> : <FileText size={16} />}
        </span>
        <span className="text-sm truncate flex-1 font-medium">{node.name}</span>
        
        {/* Hover Actions */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded px-1" onClick={e => e.stopPropagation()}>
             {isFolder && (
                 <>
                   <button onClick={() => onAdd(node.id, 'file')} className="p-1 hover:text-gray-900 dark:hover:text-white text-gray-500" title={t.files.new_file}><FilePlus size={12} /></button>
                   <button onClick={() => onAdd(node.id, 'folder')} className="p-1 hover:text-gray-900 dark:hover:text-white text-gray-500" title={t.files.new_folder}><FolderPlus size={12} /></button>
                 </>
             )}
             <button onClick={() => onEdit(node)} className="p-1 hover:text-blue-500 dark:hover:text-blue-400 text-gray-500" title={t.files.rename}><Edit2 size={12} /></button>
             <button onClick={() => { if(confirm(t.common.confirm + '?')) onDelete(node.id) }} className="p-1 hover:text-red-500 dark:hover:text-red-400 text-gray-500" title={t.common.delete}><Trash2 size={12} /></button>
        </div>
      </div>

      {isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <FileSystemItem 
                key={child.id} 
                node={child} 
                depth={depth + 1} 
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenFile={onOpenFile}
                t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ files, actions }) => {
  const { t } = useLanguage();
  // Create/Rename State
  const [modalMode, setModalMode] = useState<'create' | 'rename' | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null); // For create (parent) or rename (target)
  const [targetType, setTargetType] = useState<'file' | 'folder'>('file');
  const [inputName, setInputName] = useState('');
  // Wrapper for rename
  const [targetNodeForRename, setTargetNodeForRename] = useState<FileNode | null>(null);

  // --- Handlers ---

  const handleOpenFile = (node: FileNode) => {
      actions.openFile(node);
  };

  const initCreate = (parentId: string | null, type: 'file' | 'folder') => {
      setModalMode('create');
      setTargetNodeId(parentId);
      setTargetType(type);
      setInputName('');
  };

  const safeInitRename = (node: FileNode) => {
      setModalMode('rename');
      setTargetNodeForRename(node);
      setInputName(node.name);
  };

  const safeHandleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputName.trim()) return;

      if (modalMode === 'create') {
          const now = new Date();
          const newNode: FileNode = {
              id: `${targetType}-${Date.now()}`,
              parentId: targetNodeId || undefined,
              name: inputName,
              type: targetType,
              content: targetType === 'file' ? '' : undefined,
              createdAt: now,
              updatedAt: now
          };
          actions.addFile(newNode);
      } else if (modalMode === 'rename' && targetNodeForRename) {
          actions.updateFile({ ...targetNodeForRename, name: inputName, updatedAt: new Date() });
      }
      setModalMode(null);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col relative transition-colors duration-200">
       {/* Header */}
       <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">{t.files.explorer}</h2>
          <div className="flex gap-2">
              <button onClick={() => initCreate(null, 'file')} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title={t.files.new_file}>
                  <FilePlus size={16}/>
              </button>
              <button onClick={() => initCreate(null, 'folder')} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors" title={t.files.new_folder}>
                  <FolderPlus size={16}/>
              </button>
          </div>
       </div>

       {/* Tree */}
       <div className="flex-1 overflow-y-auto py-2">
         {files.length === 0 && (
             <div className="p-4 text-xs text-gray-500 text-center">{t.files.no_files}</div>
         )}
         {files.map(file => (
           <FileSystemItem 
              key={file.id} 
              node={file} 
              depth={0}
              onAdd={initCreate}
              onEdit={safeInitRename}
              onDelete={actions.deleteFile}
              onOpenFile={handleOpenFile}
              t={t}
           />
         ))}
       </div>

       {/* Create/Rename Input Modal */}
       {modalMode && (
           <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
               <form onSubmit={safeHandleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-64 shadow-xl">
                   <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                       {modalMode === 'create' ? `${t.files.create_modal} ${targetType === 'file' ? 'File' : 'Folder'}` : t.files.rename_modal}
                   </h3>
                   {modalMode === 'create' && !targetNodeId && (
                       <p className="text-[10px] text-gray-500 mb-2">{t.files.root_level}</p>
                   )}
                   <input 
                       autoFocus
                       type="text"
                       value={inputName}
                       onChange={e => setInputName(e.target.value)}
                       className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none mb-3"
                       placeholder="Name..."
                   />
                   <div className="flex justify-end gap-2">
                       <button type="button" onClick={() => setModalMode(null)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t.common.cancel}</button>
                       <button type="submit" className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">
                           {modalMode === 'create' ? t.files.create_modal : t.common.save}
                       </button>
                   </div>
               </form>
           </div>
       )}
    </div>
  );
};

export default FileExplorer;