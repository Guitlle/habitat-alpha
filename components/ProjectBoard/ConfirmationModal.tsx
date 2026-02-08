import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    actionLabel,
    isDestructive,
    onConfirm,
    onCancel
}) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-96 shadow-2xl transform scale-100 transition-all">
                <div className="flex items-center gap-3 mb-4 text-gray-900 dark:text-gray-100">
                    <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-xs font-bold text-white rounded transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                    >
                        {actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
