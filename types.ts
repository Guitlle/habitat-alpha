export enum ToolType {
    CHAT = 'CHAT',
    MEMORY = 'MEMORY',
    WORK = 'WORK',
    FILES = 'FILES',
    CALENDAR = 'CALENDAR',
    FILE_VIEWER = 'FILE_VIEWER',
    CONSOLE = 'CONSOLE', // New tool for database interaction
    WIKIPEDIA = 'WIKIPEDIA',
    TERRAIN = 'TERRAIN',
    GROUP_CHAT = 'GROUP_CHAT',
    CALCULATOR = 'CALCULATOR',
}

export interface Panel {
    id: string; // Unique ID for the panel (e.g., 'MEMORY' or 'file-123')
    type: ToolType;
    title?: string;
    data?: any; // Extra data like FileNode
}

export interface Message {
    id: string;
    role: 'user' | 'model' | 'system';
    content: string;
    timestamp: Date;
}

export interface GroupMessage {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
}

// Memory Graph Types
export interface MemoryNode {
    id: string;
    label: string;
    group: number;
    val: number; // radius/importance
}

export interface MemoryLink {
    source: string;
    target: string;
    value: number; // strength
}

export interface MemoryGraphData {
    nodes: MemoryNode[];
    links: MemoryLink[];
}

// Work Organization Types
export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
    BLOCKED = 'BLOCKED'
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    assignee?: string;
    dueDate?: string;
    epicId?: string;
    archived?: boolean;
}

export interface Epic {
    id: string;
    title: string;
    description: string;
    projectId: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    goal: string;
    archived?: boolean;
}

export interface WorkData {
    projects: Project[];
    epics: Epic[];
    tasks: Task[];
}

// File System Types
export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    teamId?: string;
    content?: string;
    children?: FileNode[];
    parentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Calendar Event
export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'sprint' | 'meeting' | 'deadline';
}

// School Schedule
export interface ScheduleClass {
    id: string;
    title: string;
    day: number; // 1 (Mon) to 7 (Sun)
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    location?: string;
    teacher?: string;
    color?: string;
}
