import { WorkData, TaskStatus, FileNode, CalendarEvent } from '../types';

export const initialWorkData: WorkData = {
  projects: [
    { id: 'p1', title: 'Cognitive OS', description: 'Build the ultimate AI workspace', goal: 'Revolutionize personal productivity' },
    { id: 'p2', title: 'Health & Fitness', description: 'Marathon training', goal: 'Run sub-3 hour marathon' },
  ],
  epics: [
    { id: 'e1', projectId: 'p1', title: 'Frontend MVP', description: 'Core UI components' },
    { id: 'e2', projectId: 'p1', title: 'AI Integration', description: 'Gemini API Hookup' },
  ],
  tasks: [
    { id: 't1', epicId: 'e1', title: 'Setup React', description: 'Init CRA and Tailwind', status: TaskStatus.DONE },
    { id: 't2', epicId: 'e1', title: 'Build Chat UI', description: 'Message bubbles and input', status: TaskStatus.IN_PROGRESS },
    { id: 't3', epicId: 'e2', title: 'Connect Gemini', description: 'API Key handling', status: TaskStatus.TODO },
  ]
};

const now = new Date();
export const initialFiles: FileNode[] = [
  {
    id: 'root',
    name: 'root',
    type: 'folder',
    createdAt: now,
    updatedAt: now,
    children: [
      {
        id: 'f1',
        name: 'src',
        type: 'folder',
        parentId: 'root',
        createdAt: now,
        updatedAt: now,
        children: [
          { id: 'file1', name: 'App.tsx', type: 'file', parentId: 'f1', content: '// Main App Component', createdAt: now, updatedAt: now },
          { id: 'file2', name: 'utils.ts', type: 'file', parentId: 'f1', content: 'export const add = (a, b) => a + b;', createdAt: now, updatedAt: now },
        ]
      },
      {
        id: 'f2',
        name: 'docs',
        type: 'folder',
        parentId: 'root',
        createdAt: now,
        updatedAt: now,
        children: [
          { id: 'file3', name: 'README.md', type: 'file', parentId: 'f2', content: '# Project Documentation', createdAt: now, updatedAt: now },
        ]
      }
    ]
  }
];

export const initialEvents: CalendarEvent[] = [
  { id: 'ev1', title: 'Sprint 1 Review', start: new Date(new Date().setDate(new Date().getDate() + 1)), end: new Date(new Date().setDate(new Date().getDate() + 1)), type: 'sprint' },
  { id: 'ev2', title: 'Team Sync', start: new Date(), end: new Date(), type: 'meeting' },
];