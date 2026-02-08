import React from 'react';
import { Task, TaskStatus, Epic } from '../../types';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import TaskCard from './TaskCard';

interface StatusColumnProps {
    status: TaskStatus;
    title: string;
    color: string;
    tasks: Task[];
    epics: Epic[];
    showArchivedTasks: boolean;
    onAddTask: (status: TaskStatus) => void;
    onEditTask: (task: Task) => void;
    onArchiveTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onRestoreTask: (task: Task) => void;
}

const StatusColumn: React.FC<StatusColumnProps> = ({
    status,
    title,
    color,
    tasks,
    epics,
    showArchivedTasks,
    onAddTask,
    onEditTask,
    onArchiveTask,
    onDeleteTask,
    onRestoreTask
}) => {
    const { t } = useLanguage();
    const baseColor = color.replace('bg-', '');

    return (
        <div className="flex flex-col gap-3 min-w-[280px] w-full max-w-xs h-full">
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${color} bg-opacity-10 border border-opacity-20 border-${baseColor}-500 flex-shrink-0`}>
                <span className={`text-sm font-semibold text-${baseColor}-600 dark:text-${baseColor}-400`}>{title}</span>
                <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">{tasks.length}</span>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1 pb-2">
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        epicTitle={epics.find(e => e.id === task.epicId)?.title || 'No Epic'}
                        onEdit={onEditTask}
                        onArchive={onArchiveTask}
                        onDelete={onDeleteTask}
                        onRestore={onRestoreTask}
                    />
                ))}
                {!showArchivedTasks && (
                    <button
                        onClick={() => onAddTask(status)}
                        className="flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 dark:border-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-all text-xs flex-shrink-0"
                    >
                        <Plus size={14} /> {t.work.add_task}
                    </button>
                )}
            </div>
        </div>
    );
};

export default StatusColumn;
