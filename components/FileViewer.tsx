import React, { useMemo, useState, useEffect } from 'react';
import { FileNode } from '../types';
import { marked } from 'marked';
import { FileText, Code, Edit2, Eye, Save, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FileViewerProps {
  file: FileNode;
  onSave: (file: FileNode, newContent: string) => void;
  onDirtyChange: (fileId: string, isDirty: boolean) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onSave, onDirtyChange }) => {
  const { t } = useLanguage();
  const isMarkdown = file.name.toLowerCase().endsWith('.md');
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(file.content || '');

  // Sync content if file prop updates externally (e.g. reload from DB), but only if not editing
  useEffect(() => {
    if (!isEditing) {
        setContent(file.content || '');
    }
  }, [file.content, isEditing]);

  // Check dirty state
  useEffect(() => {
    const isDirty = content !== (file.content || '');
    onDirtyChange(file.id, isDirty);
  }, [content, file.content, file.id, onDirtyChange]);

  // Cleanup dirty state on unmount
  useEffect(() => {
      return () => onDirtyChange(file.id, false);
  }, []);

  const parsedContent = useMemo(() => {
    if (isMarkdown && !isEditing) {
      try {
        return marked.parse(content);
      } catch (e) {
        return '<p class="text-red-500">Error parsing markdown</p>';
      }
    }
    return null;
  }, [content, isMarkdown, isEditing]);

  const handleSave = () => {
    onSave(file, content);
    setIsEditing(false);
  };
  
  const formatDate = (d?: Date) => {
      if (!d) return t.common.unknown;
      return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 transition-colors duration-200">
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
        <div className="flex-1 flex items-center gap-4 text-xs">
             <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                {isMarkdown ? <FileText size={14} className="text-blue-500 dark:text-blue-400" /> : <Code size={14} className="text-yellow-600 dark:text-yellow-400" />}
                <span>{isEditing ? t.files.editing : t.files.read_only}</span>
             </div>
             
             {/* Date Info */}
             <div className="flex items-center gap-3 text-gray-500 dark:text-gray-500 border-l border-gray-200 dark:border-gray-800 pl-4">
                <span title={`${t.common.created}: ${file.createdAt?.toLocaleString()}`}>{t.common.created}: {formatDate(file.createdAt)}</span>
                <span title={`${t.common.modified}: ${file.updatedAt?.toLocaleString()}`}>{t.common.modified}: {formatDate(file.updatedAt)}</span>
             </div>
        </div>
        
        <div className="flex items-center gap-1">
           {isEditing ? (
             <>
               <button onClick={() => { setIsEditing(false); setContent(file.content || ''); }} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-800" title={t.common.cancel}>
                  <Eye size={14} />
               </button>
               <button onClick={handleSave} className="p-1.5 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded hover:bg-gray-200 dark:hover:bg-gray-800" title={t.common.save}>
                  <Save size={14} />
               </button>
             </>
           ) : (
             <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-800" title={t.common.edit}>
                <Edit2 size={14} />
             </button>
           )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto relative bg-white dark:bg-gray-950">
        {isEditing ? (
             <textarea 
                className="w-full h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-300 p-4 font-mono text-sm focus:outline-none resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
             />
        ) : (
            <div className="p-6">
                {isMarkdown ? (
                  <div 
                    className="markdown-body text-sm"
                    dangerouslySetInnerHTML={{ __html: parsedContent as string }} 
                  />
                ) : (
                  <pre className="font-mono text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {content || t.files.empty}
                  </pre>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;