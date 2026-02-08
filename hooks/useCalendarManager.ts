import { useState, useCallback } from 'react';
import { CalendarEvent, ScheduleClass } from '../types';
import { db } from '../services/db';
import { syncService } from '../services/syncService';
import { initialEvents } from '../services/mockDataService';

export const useCalendarManager = (userId?: string) => {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
    const [schedule, setSchedule] = useState<ScheduleClass[]>([]);

    const handleAddEvent = useCallback(async (event: CalendarEvent) => {
        await db.addEvent(event);
        if (userId) await syncService.push('events', event, userId);
        setEvents(prev => [...prev, event]);
    }, [userId]);

    const handleUpdateEvent = useCallback(async (event: CalendarEvent) => {
        await db.updateEvent(event);
        if (userId) await syncService.push('events', event, userId);
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    }, [userId]);

    const handleDeleteEvent = useCallback(async (id: string) => {
        await db.deleteEvent(id);
        if (userId) await syncService.delete('events', id);
        setEvents(prev => prev.filter(e => e.id !== id));
    }, [userId]);

    // Schedule Actions
    const handleAddClass = useCallback(async (item: ScheduleClass) => {
        await db.addScheduleClass(item);
        if (userId) await syncService.push('schedule', item, userId);
        setSchedule(prev => [...prev, item]);
    }, [userId]);

    const handleUpdateClass = useCallback(async (item: ScheduleClass) => {
        await db.updateScheduleClass(item);
        if (userId) await syncService.push('schedule', item, userId);
        setSchedule(prev => prev.map(c => c.id === item.id ? item : c));
    }, [userId]);

    const handleDeleteClass = useCallback(async (id: string) => {
        await db.deleteScheduleClass(id);
        if (userId) await syncService.delete('schedule', id);
        setSchedule(prev => prev.filter(c => c.id !== id));
    }, [userId]);

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
