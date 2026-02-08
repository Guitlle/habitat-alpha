import { useState, useCallback } from 'react';
import { CalendarEvent } from '../types';
import { db } from '../services/db';
import { initialEvents } from '../services/mockDataService';

export const useCalendarManager = () => {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

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

    return {
        events,
        setEvents,
        actions: {
            addEvent: handleAddEvent,
            updateEvent: handleUpdateEvent,
            deleteEvent: handleDeleteEvent
        }
    };
};
