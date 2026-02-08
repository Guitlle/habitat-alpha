import React, { useState } from 'react';
import { ScheduleClass } from '../../types';
import { Plus, X, Clock, MapPin, User, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ScheduleEditorProps {
    classes: ScheduleClass[];
    actions: {
        addClass: (c: ScheduleClass) => void;
        updateClass: (c: ScheduleClass) => void;
        deleteClass: (id: string) => void;
    };
}

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 6); // 8 AM to 9 PM

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ classes, actions }) => {
    const { t, language } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ScheduleClass | null>(null);
    const [formData, setFormData] = useState<Partial<ScheduleClass>>({
        title: '',
        day: 1,
        startTime: '06:00',
        endTime: '09:00',
        color: 'indigo'
    });

    const dayNames = t.calendar.days_short_mon;

    const handleSlotClick = (day: number, hour: number) => {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
        setEditingClass(null);
        setFormData({ title: '', day, startTime, endTime, color: 'indigo' });
        setIsModalOpen(true);
    };

    const handleClassClick = (e: React.MouseEvent, c: ScheduleClass) => {
        e.stopPropagation();
        setEditingClass(c);
        setFormData({ ...c });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.day || !formData.startTime || !formData.endTime) return;

        const classToSave: ScheduleClass = {
            id: editingClass ? editingClass.id : `sch-${Date.now()}`,
            title: formData.title,
            day: formData.day,
            startTime: formData.startTime,
            endTime: formData.endTime,
            location: formData.location,
            teacher: formData.teacher,
            color: formData.color || 'indigo'
        };

        if (editingClass) {
            actions.updateClass(classToSave);
        } else {
            actions.addClass(classToSave);
        }
        setIsModalOpen(false);
    };

    const handleDelete = () => {
        if (editingClass && confirm(t.calendar.delete_class_confirm)) {
            actions.deleteClass(editingClass.id);
            setIsModalOpen(false);
        }
    };

    // Helper to calculate position and height
    const getPositionStyle = (startTime: string, endTime: string) => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);

        const top = (startH - 6) * 60 + startM;
        const duration = (endH * 60 + endM) - (startH * 60 + startM);

        return {
            top: `${top}px`,
            height: `${duration}px`,
        };
    };

    const getColorClass = (color: string = 'indigo') => {
        const colors: Record<string, string> = {
            indigo: 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
            blue: 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
            emerald: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
            amber: 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
            rose: 'bg-rose-100 dark:bg-rose-900/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
        };
        return colors[color] || colors.indigo;
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-950">
            {/* Legend / Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={16} className="text-indigo-500" />
                    {t.calendar.weekly_schedule}
                </h3>
                <button
                    onClick={() => {
                        setEditingClass(null);
                        setFormData({ title: '', day: 1, startTime: '08:00', endTime: '09:00', color: 'indigo' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={14} /> {t.calendar.add_class}
                </button>
            </div>

            <div className="flex-1 overflow-auto relative">
                <div className="flex min-w-[800px] h-[840px] relative">
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 sticky left-0 z-20">
                        {HOURS.map(hour => (
                            <div key={hour} className="h-[60px] flex items-start justify-end px-2 py-1 text-[10px] font-medium text-gray-400">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    <div className="flex-1 grid grid-cols-7 relative">
                        {DAYS.map((day, idx) => (
                            <div key={day} className="border-r border-gray-100 dark:border-gray-900 relative">
                                <div className="h-8 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-10">
                                    {dayNames[idx]}
                                </div>

                                {/* Time Slots Background */}
                                {HOURS.map(hour => (
                                    <div
                                        key={hour}
                                        onClick={() => handleSlotClick(day, hour)}
                                        className="h-[60px] border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 cursor-crosshair transition-colors"
                                    />
                                ))}

                                {/* Classes */}
                                {classes.filter(c => c.day === day).map(c => (
                                    <div
                                        key={c.id}
                                        onClick={(e) => handleClassClick(e, c)}
                                        style={getPositionStyle(c.startTime, c.endTime)}
                                        className={`absolute left-1 right-1 rounded-md border p-1.5 text-[10px] shadow-sm cursor-pointer transition-all hover:brightness-95 dark:hover:brightness-125 z-10 overflow-hidden ${getColorClass(c.color)}`}
                                    >
                                        <div className="font-bold truncate">{c.title}</div>
                                        <div className="flex items-center gap-1 mt-0.5 opacity-80">
                                            <Clock size={8} /> {c.startTime} - {c.endTime}
                                        </div>
                                        {c.location && (
                                            <div className="flex items-center gap-1 mt-0.5 opacity-80 truncate">
                                                <MapPin size={8} /> {c.location}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingClass ? t.calendar.edit_class : t.calendar.new_class}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.subject}</label>
                                <input
                                    autoFocus required type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.day}</label>
                                    <select
                                        value={formData.day}
                                        onChange={e => setFormData({ ...formData, day: Number(e.target.value) })}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                                    >
                                        {dayNames.map((name, i) => (
                                            <option key={i + 1} value={i + 1}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.color}</label>
                                    <div className="flex gap-1.5 mt-1">
                                        {['indigo', 'blue', 'emerald', 'amber', 'rose'].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={`w-5 h-5 rounded-full border-2 transition-transform ${formData.color === c ? 'scale-125 border-gray-900 dark:border-white' : 'border-transparent'
                                                    } ${getColorClass(c).split(' ')[0]}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.start_time}</label>
                                    <input
                                        required type="time"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.end_time}</label>
                                    <input
                                        required type="time"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.location}</label>
                                    <div className="relative">
                                        <MapPin size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-8 pr-2 py-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                                            placeholder={t.calendar.placeholders.location}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.teacher}</label>
                                    <div className="relative">
                                        <User size={12} className="absolute left-2.5 top-2.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.teacher || ''}
                                            onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-8 pr-2 py-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                                            placeholder={t.calendar.placeholders.teacher}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            {editingClass ? (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            ) : <div />}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">{t.common.cancel}</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20">
                                    {t.common.save}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;
