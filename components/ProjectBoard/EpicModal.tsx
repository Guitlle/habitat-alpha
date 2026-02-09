import React from 'react';
import { X } from 'lucide-react';
import { Epic } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface EpicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingEpic: Epic | null;
    epicForm: Partial<Epic>;
    setEpicForm: (form: Partial<Epic>) => void;
}

const EpicModal: React.FC<EpicModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingEpic,
    epicForm,
    setEpicForm
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm">
            <form onSubmit={onSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 w-96 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingEpic ? t.work.edit_epic : t.work.new_epic}</h3>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">{t.calendar.title}</label>
                        <input
                            autoFocus
                            type="text"
                            value={epicForm.title || ''}
                            onChange={e => setEpicForm({ ...epicForm, title: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                            placeholder="Epic Title"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Description</label>
                        <textarea
                            value={epicForm.description || ''}
                            onChange={e => setEpicForm({ ...epicForm, description: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none h-24 resize-none"
                            placeholder="What is this epic about?"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        {t.common.cancel}
                    </button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium">
                        {t.common.save}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EpicModal;
