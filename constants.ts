
import { ToolType } from './types';
import { MessageSquare, Network, Briefcase, FolderOpen, Calendar, Terminal, Globe, Map, Users, Calculator } from 'lucide-react';

export const TOOLS = [
  { id: ToolType.CHAT, label: 'Chat Assistant', icon: MessageSquare },
  // { id: ToolType.MEMORY, label: 'Memory Graph', icon: Network },
  { id: ToolType.WORK, label: 'Work Board', icon: Briefcase },
  // { id: ToolType.FILES, label: 'File Explorer', icon: FolderOpen },
  { id: ToolType.CALENDAR, label: 'Schedule', icon: Calendar },
  // { id: ToolType.CONSOLE, label: 'Dev Console', icon: Terminal },
  { id: ToolType.WIKIPEDIA, label: 'Wikipedia', icon: Globe },
  { id: ToolType.TERRAIN, label: 'Terrain Explorer', icon: Map },
  { id: ToolType.CALCULATOR, label: 'Graphic Calculator', icon: Calculator },
];

export const INITIAL_MEMORY_NODES = [
  { id: '1', label: 'User Core Values', group: 1, val: 20 },
  { id: '2', label: 'Productivity', group: 2, val: 10 },
  { id: '3', label: 'Innovation', group: 2, val: 10 },
  { id: '4', label: 'Project Alpha', group: 3, val: 15 },
  { id: '5', label: 'React App', group: 4, val: 5 },
];

export const INITIAL_MEMORY_LINKS = [
  { source: '1', target: '2', value: 5 },
  { source: '1', target: '3', value: 5 },
  { source: '3', target: '4', value: 3 },
  { source: '4', target: '5', value: 8 },
];