import { WorkData, Project, Epic, Task, FileNode, CalendarEvent, ScheduleClass, MemoryNode, MemoryLink, Message } from '../types';

const DB_NAME = 'CognitiveWorkspaceDB';
const DB_VERSION = 5; // Bumped version for Memory & Chat stores

// Helper to flatten the initial tree structure for DB storage
const flattenFileTree = (nodes: FileNode[], parentId: string = 'root'): FileNode[] => {
    let flatList: FileNode[] = [];
    const now = new Date();
    nodes.forEach(node => {
        const { children, ...fileData } = node;
        // Ensure dates exist on initial seed
        if (!fileData.createdAt) fileData.createdAt = now;
        if (!fileData.updatedAt) fileData.updatedAt = now;

        flatList.push(fileData);
        if (children) {
            flatList = [...flatList, ...flattenFileTree(children, node.id)];
        }
    });
    return flatList;
};

export const db = {
    open: (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                reject("IndexedDB not supported");
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const database = (event.target as IDBOpenDBRequest).result;
                if (!database.objectStoreNames.contains('projects')) database.createObjectStore('projects', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('epics')) database.createObjectStore('epics', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('tasks')) database.createObjectStore('tasks', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('files')) database.createObjectStore('files', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('events')) database.createObjectStore('events', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('schedule')) database.createObjectStore('schedule', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('memory_nodes')) database.createObjectStore('memory_nodes', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('memory_links')) database.createObjectStore('memory_links', { keyPath: 'id' });
                if (!database.objectStoreNames.contains('chat_messages')) database.createObjectStore('chat_messages', { keyPath: 'id' });
            };

            request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
            request.onerror = (event) => reject((event.target as IDBOpenDBRequest).error);
        });
    },

    init: async (): Promise<{ workData: WorkData, files: FileNode[], events: CalendarEvent[], schedule: ScheduleClass[], memoryNodes: MemoryNode[], memoryLinks: MemoryLink[], chatMessages: Message[] }> => {
        const database = await db.open();
        return await db.getAllData(database);
    },

    getAllData: async (existingDb?: IDBDatabase): Promise<{ workData: WorkData, files: FileNode[], events: CalendarEvent[], schedule: ScheduleClass[], memoryNodes: MemoryNode[], memoryLinks: MemoryLink[], chatMessages: Message[] }> => {
        const database = existingDb || await db.open();
        const tx = database.transaction(['projects', 'epics', 'tasks', 'files', 'events', 'schedule', 'memory_nodes', 'memory_links', 'chat_messages'], 'readonly');

        const projects = await new Promise<Project[]>((resolve, reject) => {
            const req = tx.objectStore('projects').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const epics = await new Promise<Epic[]>((resolve, reject) => {
            const req = tx.objectStore('epics').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const tasks = await new Promise<Task[]>((resolve, reject) => {
            const req = tx.objectStore('tasks').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const files = await new Promise<FileNode[]>((resolve, reject) => {
            const req = tx.objectStore('files').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const events = await new Promise<CalendarEvent[]>((resolve, reject) => {
            const req = tx.objectStore('events').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const chatMessages = await new Promise<Message[]>((resolve, reject) => {
            const req = tx.objectStore('chat_messages').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const memoryNodes = await new Promise<MemoryNode[]>((resolve, reject) => {
            const req = tx.objectStore('memory_nodes').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const memoryLinks = await new Promise<MemoryLink[]>((resolve, reject) => {
            const req = tx.objectStore('memory_links').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        const schedule = await new Promise<ScheduleClass[]>((resolve, reject) => {
            const req = tx.objectStore('schedule').getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        return { workData: { projects, epics, tasks }, files, events, schedule, memoryNodes, memoryLinks, chatMessages };
    },

    // --- Project CRUD ---
    addProject: async (project: Project) => {
        const database = await db.open();
        const tx = database.transaction('projects', 'readwrite');
        tx.objectStore('projects').add(project);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    updateProject: async (project: Project) => {
        const database = await db.open();
        const tx = database.transaction('projects', 'readwrite');
        tx.objectStore('projects').put(project);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    deleteProject: async (id: string) => {
        const database = await db.open();
        const tx = database.transaction('projects', 'readwrite');
        tx.objectStore('projects').delete(id);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Task CRUD ---
    addTask: async (task: Task) => {
        const database = await db.open();
        const tx = database.transaction('tasks', 'readwrite');
        tx.objectStore('tasks').add(task);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    updateTask: async (task: Task) => {
        const database = await db.open();
        const tx = database.transaction('tasks', 'readwrite');
        tx.objectStore('tasks').put(task);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    deleteTask: async (id: string) => {
        const database = await db.open();
        const tx = database.transaction('tasks', 'readwrite');
        tx.objectStore('tasks').delete(id);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Epic CRUD ---
    addEpic: async (epic: Epic) => {
        const database = await db.open();
        const tx = database.transaction('epics', 'readwrite');
        tx.objectStore('epics').add(epic);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- File CRUD ---
    addFile: async (file: FileNode) => {
        const database = await db.open();
        const tx = database.transaction('files', 'readwrite');
        // Ensure dates
        if (!file.createdAt) file.createdAt = new Date();
        if (!file.updatedAt) file.updatedAt = new Date();

        tx.objectStore('files').add(file);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    updateFile: async (file: FileNode) => {
        const database = await db.open();
        const tx = database.transaction('files', 'readwrite');
        // Ensure update date
        file.updatedAt = new Date();

        tx.objectStore('files').put(file);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    deleteFile: async (id: string) => {
        const database = await db.open();
        const tx = database.transaction('files', 'readwrite');
        tx.objectStore('files').delete(id);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Event CRUD ---
    addEvent: async (event: CalendarEvent) => {
        const database = await db.open();
        const tx = database.transaction('events', 'readwrite');
        tx.objectStore('events').add(event);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    updateEvent: async (event: CalendarEvent) => {
        const database = await db.open();
        const tx = database.transaction('events', 'readwrite');
        tx.objectStore('events').put(event);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    deleteEvent: async (id: string) => {
        const database = await db.open();
        const tx = database.transaction('events', 'readwrite');
        tx.objectStore('events').delete(id);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Schedule CRUD ---
    addScheduleClass: async (item: ScheduleClass) => {
        const database = await db.open();
        const tx = database.transaction('schedule', 'readwrite');
        tx.objectStore('schedule').add(item);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    updateScheduleClass: async (item: ScheduleClass) => {
        const database = await db.open();
        const tx = database.transaction('schedule', 'readwrite');
        tx.objectStore('schedule').put(item);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    deleteScheduleClass: async (id: string) => {
        const database = await db.open();
        const tx = database.transaction('schedule', 'readwrite');
        tx.objectStore('schedule').delete(id);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Memory CRUD ---
    addMemoryNode: async (node: MemoryNode) => {
        const database = await db.open();
        const tx = database.transaction('memory_nodes', 'readwrite');
        tx.objectStore('memory_nodes').add(node);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    addMemoryLink: async (link: MemoryLink) => {
        const database = await db.open();
        const tx = database.transaction('memory_links', 'readwrite');
        const linkWithId = { ...link, id: `${link.source}-${link.target}` };
        tx.objectStore('memory_links').put(linkWithId);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Chat CRUD ---
    addChatMessage: async (message: Message) => {
        const database = await db.open();
        const tx = database.transaction('chat_messages', 'readwrite');
        tx.objectStore('chat_messages').add(message);
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },
    clearChatHistory: async () => {
        const database = await db.open();
        const tx = database.transaction('chat_messages', 'readwrite');
        tx.objectStore('chat_messages').clear();
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};