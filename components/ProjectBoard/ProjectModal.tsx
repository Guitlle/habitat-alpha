import React from 'react';
import { X } from 'lucide-react';
import Modal from '../ui/Modal';
import { Project } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingProject: Project | null;
    projectForm: Partial<Project>;
    setProjectForm: (form: Partial<Project>) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingProject,
    projectForm,
    setProjectForm
}) => {
    const { t } = useLanguage();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingProject ? t.work.edit_project : t.work.new_project}
            className="w-96"
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="text-xs text-gray-500 block mb-1">{t.calendar.title}</label>
                    <input
                        autoFocus
                        type="text"
                        value={projectForm.title || ''}
                        onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                        placeholder="Project Name"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">Description</label>
                    <textarea
                        value={projectForm.description || ''}
                        onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none h-16 resize-none"
                        placeholder="What is this project about?"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-1">{t.work.goal}</label>
                    <input
                        type="text"
                        value={projectForm.goal || ''}
                        onChange={e => setProjectForm({ ...projectForm, goal: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                        placeholder="Primary objective"
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">{t.common.cancel}</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">{t.common.save}</button>
                </div>
            </form>
        </Modal>
    );
};

export default ProjectModal;
