import React from 'react';
import { X } from 'lucide-react';
import { Task, TaskStatus, Epic } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingTask: Task | null;
    taskForm: Partial<Task>;
    setTaskForm: (form: Partial<Task>) => void;
    activeEpics: Epic[];
}

const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingTask,
    taskForm,
    setTaskForm,
    activeEpics
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
            <form onSubmit={onSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-96 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingTask ? t.work.edit_task : t.work.new_task}</h3>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">{t.calendar.title}</label>
                        <input
                            autoFocus
                            type="text"
                            value={taskForm.title || ''}
                            onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            placeholder="Task title"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Description</label>
                        <textarea
                            value={taskForm.description || ''}
                            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none h-20 resize-none"
                            placeholder="Details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Status</label>
                            <select
                                value={taskForm.status || TaskStatus.TODO}
                                onChange={e => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            >
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t.work.status[s] || s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Epic</label>
                            <select
                                value={taskForm.epicId || ''}
                                onChange={e => setTaskForm({ ...taskForm, epicId: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            >
                                {activeEpics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                {activeEpics.length === 0 && <option value="">No Epics Available</option>}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t.common.cancel}</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">{t.common.save}</button>
                </div>
            </form>
        </div>
    );
};

export default TaskModal;
