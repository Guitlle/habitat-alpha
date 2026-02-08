import { useState, useCallback } from 'react';
import { CalendarEvent, ScheduleClass } from '../types';
import { db } from '../services/db';
import { initialEvents } from '../services/mockDataService';

export const useCalendarManager = () => {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
    const [schedule, setSchedule] = useState<ScheduleClass[]>([]);

    const handleAddEvent = useCallback(async (event: CalendarEvent) => {
        await db.addEvent(event);
        setEvents(prev => [...prev, event]);
    }, []);

    const handleUpdateEvent = useCallback(async (event: CalendarEvent) => {
        await db.updateEvent(event);
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    }, []);

    const handleDeleteEvent = useCallback(async (id: string) => {
        await db.deleteEvent(id);
        setEvents(prev => prev.filter(e => e.id !== id));
    }, []);

    // Schedule Actions
    const handleAddClass = useCallback(async (item: ScheduleClass) => {
        await db.addScheduleClass(item);
        setSchedule(prev => [...prev, item]);
    }, []);

    const handleUpdateClass = useCallback(async (item: ScheduleClass) => {
        await db.updateScheduleClass(item);
        setSchedule(prev => prev.map(c => c.id === item.id ? item : c));
    }, []);

    const handleDeleteClass = useCallback(async (id: string) => {
        await db.deleteScheduleClass(id);
        setSchedule(prev => prev.filter(c => c.id !== id));
    }, []);

    return {
        events,
        setEvents,
        schedule,
        setSchedule,
        actions: {
            addEvent: handleAddEvent,
            updateEvent: handleUpdateEvent,
            deleteEvent: handleDeleteEvent,
            addClass: handleAddClass,
            updateClass: handleUpdateClass,
            deleteClass: handleDeleteClass
        }
    };
};
