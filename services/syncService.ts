import { supabase } from './supabase';
import { db } from './db';
import { Project, Epic, Task, FileNode, CalendarEvent, ScheduleClass, MemoryNode, MemoryLink, Message } from '../types';

const TABLES = {
    projects: 'projects',
    epics: 'epics',
    tasks: 'tasks',
    files: 'files',
    events: 'events',
    schedule: 'schedule',
    memory_nodes: 'memory_nodes',
    memory_links: 'memory_links',
    chat_messages: 'chat_messages'
};

export const syncService = {
    /**
     * Pulls everything from Supabase and populates IndexedDB
     */
    pullAll: async (userId: string) => {
        try {
            console.log('Sync: Pulling all data for user', userId);

            // 1. Fetch everything from Supabase
            const [
                { data: projects },
                { data: epics },
                { data: tasks },
                { data: files },
                { data: events },
                { data: schedule },
                { data: memoryNodes },
                { data: memoryLinks },
                { data: chatMessages }
            ] = await Promise.all([
                supabase.from(TABLES.projects).select('*'),
                supabase.from(TABLES.epics).select('*'),
                supabase.from(TABLES.tasks).select('*'),
                supabase.from(TABLES.files).select('*'),
                supabase.from(TABLES.events).select('*'),
                supabase.from(TABLES.schedule).select('*'),
                supabase.from(TABLES.memory_nodes).select('*'),
                supabase.from(TABLES.memory_links).select('*'),
                supabase.from(TABLES.chat_messages).select('*')
            ]);

            // 2. Update local DB
            const database = await db.open();

            if (projects) for (const item of projects) await db.updateProject(item as Project);
            if (epics) for (const item of epics) await db.addEpic(item as Epic);
            if (tasks) for (const item of tasks) await db.updateTask(item as Task);
            if (files) for (const item of files) await db.updateFile(item as FileNode);
            if (events) for (const item of events) await db.updateEvent(item as CalendarEvent);
            if (schedule) for (const item of schedule) await db.updateScheduleClass(item as ScheduleClass);
            if (memoryNodes) for (const item of memoryNodes) await db.addMemoryNode(item as MemoryNode);
            if (memoryLinks) for (const item of memoryLinks) await db.addMemoryLink(item as MemoryLink);
            if (chatMessages) for (const item of chatMessages) await db.addChatMessage(item as Message);

            console.log('Sync: Pull complete');
            return true;
        } catch (err) {
            console.error('Sync: Pull failed', err);
            return false;
        }
    },

    /**
     * Pushes a single record update to Supabase
     */
    push: async (table: keyof typeof TABLES, data: any, userId: string) => {
        try {
            const record = { ...data, user_id: userId };
            const { error } = await supabase.from(TABLES[table]).upsert(record);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error(`Sync: Push to ${table} failed`, err);
            return false;
        }
    },

    /**
     * Deletes a record from Supabase
     */
    delete: async (table: keyof typeof TABLES, id: string) => {
        try {
            const { error } = await supabase.from(TABLES[table]).delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (err) {
            console.error(`Sync: Delete from ${table} failed`, err);
            return false;
        }
    }
};
