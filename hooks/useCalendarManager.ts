import { useState, useCallback } from 'react';
import { CalendarEvent, ScheduleClass } from '../types';
import { db } from '../services/db';
import { syncService } from '../services/syncService';

export const useCalendarManager = (userId?: string, teamId?: string) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [schedule, setSchedule] = useState<ScheduleClass[]>([]);

    const handleAddEvent = useCallback(async (event: CalendarEvent) => {
        await db.addEvent(event);
        if (userId) await syncService.push('events', event, userId, teamId);
        setEvents(prev => [...prev, event]);
    }, [userId, teamId]);

    const handleUpdateEvent = useCallback(async (event: CalendarEvent) => {
        await db.updateEvent(event);
        if (userId) await syncService.push('events', event, userId, teamId);
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
    }, [userId, teamId]);

    const handleDeleteEvent = useCallback(async (id: string) => {
        await db.deleteEvent(id);
        if (userId) await syncService.delete('events', id);
        setEvents(prev => prev.filter(e => e.id !== id));
    }, [userId]);

    const handleAddScheduleClass = useCallback(async (item: ScheduleClass) => {
        await db.addScheduleClass(item);
        if (userId) await syncService.push('schedule', item, userId, teamId);
        setSchedule(prev => [...prev, item]);
    }, [userId, teamId]);

    const handleUpdateScheduleClass = useCallback(async (item: ScheduleClass) => {
        await db.updateScheduleClass(item);
        if (userId) await syncService.push('schedule', item, userId, teamId);
        setSchedule(prev => prev.map(s => s.id === item.id ? item : s));
    }, [userId, teamId]);

    const handleDeleteScheduleClass = useCallback(async (id: string) => {
        await db.deleteScheduleClass(id);
        if (userId) await syncService.delete('schedule', id);
        setSchedule(prev => prev.filter(s => s.id !== id));
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
            addScheduleClass: handleAddScheduleClass,
            updateScheduleClass: handleUpdateScheduleClass,
            deleteScheduleClass: handleDeleteScheduleClass
        }
    };
};
