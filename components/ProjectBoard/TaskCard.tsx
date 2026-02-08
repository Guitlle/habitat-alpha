import React from 'react';
import { Task, Epic } from '../../types';
import { Edit, Archive, RefreshCcw, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TaskCardProps {
    task: Task;
    epicTitle: string;
    onEdit: (task: Task) => void;
    onArchive: (task: Task) => void;
    onDelete: (task: Task) => void;
    onRestore: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
    task,
    epicTitle,
    onEdit,
    onArchive,
    onDelete,
    onRestore
}) => {
    const { t } = useLanguage();

    return (
        <div
            className={`bg-white dark:bg-gray-900 border ${task.archived ? 'border-dashed border-gray-300 dark:border-gray-700 opacity-60' : 'border-gray-200 dark:border-gray-800'} rounded-lg p-3 shadow-sm hover:border-gray-400 dark:hover:border-gray-600 transition-all group relative`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                    {epicTitle}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!task.archived ? (
                        <>
                            <button onClick={() => onEdit(task)} className="text-gray-400 hover:text-blue-500 p-0.5" title={t.common.edit}>
                                <Edit size={12} />
                            </button>
                            <button onClick={() => onArchive(task)} className="text-gray-400 hover:text-amber-500 p-0.5" title={t.common.archive}>
                                <Archive size={12} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onRestore(task)} className="text-gray-400 hover:text-green-500 p-0.5" title={t.common.restore}>
                                <RefreshCcw size={12} />
                            </button>
                            <button onClick={() => onDelete(task)} className="text-gray-400 hover:text-red-500 p-0.5" title={t.common.delete}>
                                <Trash2 size={12} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1 flex items-center gap-2">
                {task.title}
                {task.archived && <span className="text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1 rounded">ARCHIVED</span>}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{task.description}</p>

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] text-gray-600 dark:text-gray-300">AI</div>
                {task.dueDate && <span className="text-[10px] text-gray-400 dark:text-gray-500">{task.dueDate}</span>}
            </div>
        </div>
    );
};

export default TaskCard;
