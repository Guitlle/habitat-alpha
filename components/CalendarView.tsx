import React, { useState } from 'react';
import { CalendarEvent, ScheduleClass } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, Trash2, List } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ScheduleEditor from './Calendar/ScheduleEditor';

interface CalendarViewProps {
  events: CalendarEvent[];
  schedule: ScheduleClass[];
  actions: {
    addEvent: (e: CalendarEvent) => void;
    updateEvent: (e: CalendarEvent) => void;
    deleteEvent: (id: string) => void;
    addClass: (c: ScheduleClass) => void;
    updateClass: (c: ScheduleClass) => void;
    deleteClass: (id: string) => void;
  };
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, schedule, actions }) => {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'calendar' | 'schedule'>('calendar');
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    start: new Date(),
    end: new Date(),
    type: 'meeting'
  });

  const days = t.calendar.days_short;
  const currentMonth = viewDate.toLocaleString(language, { month: 'long' });
  const currentYear = viewDate.getFullYear();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const totalDays = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  // Navigation Handlers
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    newDate.setHours(9, 0, 0, 0);
    const endDate = new Date(newDate);
    endDate.setHours(10, 0, 0, 0);

    setEditingEvent(null);
    setFormData({ title: '', start: newDate, end: endDate, type: 'meeting' });
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setFormData({ ...event });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start || !formData.end) return;

    const eventToSave: CalendarEvent = {
      id: editingEvent ? editingEvent.id : `ev-${Date.now()}`,
      title: formData.title,
      start: new Date(formData.start),
      end: new Date(formData.end),
      type: formData.type as 'sprint' | 'meeting' | 'deadline' || 'meeting'
    };

    if (editingEvent) actions.updateEvent(eventToSave);
    else actions.addEvent(eventToSave);
    setIsModalOpen(false);
  };

  const toInputString = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const renderDays = () => {
    const dayElements = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      dayElements.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 opacity-50" />);
    }
    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
      const dateEvents = events.filter(e => {
        const evD = new Date(e.start);
        return evD.getDate() === d && evD.getMonth() === viewDate.getMonth() && evD.getFullYear() === viewDate.getFullYear();
      });

      dayElements.push(
        <div
          key={`day-${d}`}
          onClick={() => handleDayClick(d)}
          className={`h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative cursor-pointer group ${isToday ? 'bg-indigo-50 dark:bg-gray-800/60' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs font-semibold ${isToday ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-500 dark:text-gray-400'}`}>{d}</span>
            <Plus size={12} className="text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100" />
          </div>
          <div className="mt-1 flex flex-col gap-1 overflow-y-auto max-h-[calc(100%-24px)]">
            {dateEvents.map(ev => {
              let colorClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900/50';
              if (ev.type === 'sprint') colorClass = 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-900/50';
              if (ev.type === 'deadline') colorClass = 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/50';
              return (
                <div key={ev.id} onClick={(e) => handleEventClick(e, ev)} className={`text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition-all ${colorClass}`}>
                  {ev.title}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return dayElements;
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-950 p-6 flex flex-col relative transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 capitalize">
            {viewMode === 'calendar' ? <CalendarIcon size={20} className="text-indigo-500" /> : <Clock size={20} className="text-indigo-500" />}
            {viewMode === 'calendar' ? `${currentMonth} ${currentYear}` : t.calendar.schedule_title}
          </h2>

          {/* View Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'calendar'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <CalendarIcon size={14} /> {t.calendar.view_month}
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'schedule'
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <List size={14} /> {t.calendar.view_schedule}
            </button>
          </div>
        </div>

        {viewMode === 'calendar' && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800">
            <button onClick={prevMonth} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"><ChevronLeft size={16} /></button>
            <button onClick={() => setViewDate(new Date())} className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">{t.calendar.today}</button>
            <button onClick={nextMonth} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-2xl">
        {viewMode === 'calendar' ? (
          <div className="h-full flex flex-col bg-gray-200 dark:bg-gray-800">
            <div className="grid grid-cols-7 gap-px">
              {days.map(day => (
                <div key={day} className="bg-gray-50 dark:bg-gray-950 py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 gap-px overflow-y-auto">
              {renderDays()}
            </div>
          </div>
        ) : (
          <ScheduleEditor classes={schedule} actions={{ addClass: actions.addClass, updateClass: actions.updateClass, deleteClass: actions.deleteClass }} />
        )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingEvent ? t.calendar.edit_event : t.calendar.new_event}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.title}</label>
                <input autoFocus required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none" placeholder={t.calendar.placeholders.event_title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.start}</label>
                  <input required type="datetime-local" value={toInputString(formData.start)} onChange={e => setFormData({ ...formData, start: new Date(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.end}</label>
                  <input required type="datetime-local" value={toInputString(formData.end)} onChange={e => setFormData({ ...formData, end: new Date(e.target.value) })} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.type}</label>
                <div className="flex gap-2">
                  {['meeting', 'sprint', 'deadline'].map(type => (
                    <button key={type} type="button" onClick={() => setFormData({ ...formData, type: type as any })} className={`flex-1 py-2 text-xs rounded-lg border capitalize transition-all ${formData.type === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500'}`}>{t.calendar.event_types[type as keyof typeof t.calendar.event_types]}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-500">{t.common.cancel}</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg">{t.common.save}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CalendarView;