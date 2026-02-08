import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarViewProps {
  events: CalendarEvent[];
  actions: {
    addEvent: (e: CalendarEvent) => void;
    updateEvent: (e: CalendarEvent) => void;
    deleteEvent: (id: string) => void;
  };
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, actions }) => {
  const { t, language } = useLanguage();
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

  const days = language === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Using locale for month name
  const currentMonth = viewDate.toLocaleString(language, { month: 'long' });
  const currentYear = viewDate.getFullYear();
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const totalDays = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());

  // Navigation Handlers
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // CRUD Handlers
  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Default to 9 AM
    newDate.setHours(9, 0, 0, 0);
    const endDate = new Date(newDate);
    endDate.setHours(10, 0, 0, 0);

    setEditingEvent(null);
    setFormData({
      title: '',
      start: newDate,
      end: endDate,
      type: 'meeting'
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setFormData({ ...event });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (editingEvent) {
      if (confirm(t.calendar.delete_event)) {
        actions.deleteEvent(editingEvent.id);
        setIsModalOpen(false);
      }
    }
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

    if (editingEvent) {
      actions.updateEvent(eventToSave);
    } else {
      actions.addEvent(eventToSave);
    }
    setIsModalOpen(false);
  };

  // Helper to format date for input 'datetime-local'
  const toInputString = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const renderDays = () => {
    const dayElements = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      dayElements.push(<div key={`empty-${i}`} className="h-24 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 opacity-50"></div>);
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const currentDayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
      const isToday = d === new Date().getDate() && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();

      const dateEvents = events.filter(e => {
        const eventDate = new Date(e.start);
        return eventDate.getDate() === d && 
               eventDate.getMonth() === viewDate.getMonth() && 
               eventDate.getFullYear() === viewDate.getFullYear();
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
                 <div 
                   key={ev.id} 
                   onClick={(e) => handleEventClick(e, ev)}
                   className={`text-[10px] px-1.5 py-0.5 rounded truncate border cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition-all ${colorClass}`}
                   title={`${ev.title} (${new Date(ev.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`}
                 >
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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 capitalize">
            <CalendarIcon size={20} className="text-indigo-500" />
            {currentMonth} <span className="text-gray-400 dark:text-gray-500">{currentYear}</span>
          </h2>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800">
          <button onClick={prevMonth} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"><ChevronLeft size={16}/></button>
          <button onClick={() => setViewDate(new Date())} className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">{t.calendar.today}</button>
          <button onClick={nextMonth} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"><ChevronRight size={16}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex-1 shadow-sm dark:shadow-xl">
        {days.map(day => (
          <div key={day} className="bg-gray-50 dark:bg-gray-950 py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        {renderDays()}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingEvent ? t.calendar.edit_event : t.calendar.new_event}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X size={20}/></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.title}</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Meeting title..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.start}</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={toInputString(formData.start)}
                    onChange={e => setFormData({...formData, start: new Date(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.end}</label>
                  <input 
                    required
                    type="datetime-local" 
                    value={toInputString(formData.end)}
                    onChange={e => setFormData({...formData, end: new Date(e.target.value)})}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1.5 uppercase font-bold tracking-wider">{t.calendar.type}</label>
                <div className="flex gap-2">
                  {['meeting', 'sprint', 'deadline'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, type: type as any})}
                      className={`flex-1 py-2 text-xs rounded-lg border capitalize transition-all ${
                        formData.type === type 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              {editingEvent ? (
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Event"
                >
                  <Trash2 size={16} />
                </button>
              ) : <div></div>}
              
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

export default CalendarView;