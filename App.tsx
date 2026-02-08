import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ToolType, Message, MemoryGraphData, WorkData, TaskStatus, FileNode, CalendarEvent, Project, Task, Epic, Panel } from './types';
import { TOOLS, INITIAL_MEMORY_NODES, INITIAL_MEMORY_LINKS } from './constants';
import { initialEvents } from './services/mockDataService';
import { generateResponse } from './services/geminiService';
import { db } from './services/db';
import MemoryGraph from './components/MemoryGraph';
import ProjectBoard from './components/ProjectBoard';
import FileExplorer from './components/FileExplorer';
import CalendarView from './components/CalendarView';
import ChatInterface from './components/ChatInterface';
import FileEditorGroup from './components/FileEditorGroup';
import ConsoleTool from './components/ConsoleTool';
import WikipediaExplorer from './components/WikipediaExplorer';
import TerrainExplorer from './components/TerrainExplorer';
import GeoGebraGrapher from './components/Calculator';
import GroupChat from './components/GroupChat';
import { Settings, Command, LayoutGrid, AlertCircle, GripHorizontal, Languages, Sun, Moon, MessageSquare, Users } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';

const App: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  
  // Switch to Panel objects to support multiple instances (like files)
  const [activePanels, setActivePanels] = useState<Panel[]>([
    { id: ToolType.TERRAIN, type: ToolType.TERRAIN }
  ]);

  // Right Panel State
  const [rightPanelTab, setRightPanelTab] = useState<'ai' | 'team'>('ai');

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', content: t.chat.system_welcome, timestamp: new Date() }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  
  // Layout State
  const [chatWidth, setChatWidth] = useState(30);
  const [panelHeights, setPanelHeights] = useState<number[]>([100]);
  
  // Refs for resizing to avoid closure staleness
  const panelHeightsRef = useRef<number[]>([100]);
  const activeDragIndexRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  // App Data States
  const [memoryData, setMemoryData] = useState<MemoryGraphData>({ nodes: INITIAL_MEMORY_NODES, links: INITIAL_MEMORY_LINKS });
  const [workData, setWorkData] = useState<WorkData>({ projects: [], epics: [], tasks: [] });
  const [flatFiles, setFlatFiles] = useState<FileNode[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  // File Editor State
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());

  // Wiki State
  const [wikiQuery, setWikiQuery] = useState<string>('');

  // Load Data
  useEffect(() => {
    const initData = async () => {
      try {
        const { workData: dbWorkData, files: dbFiles, events: dbEvents } = await db.init();
        setWorkData(dbWorkData);
        setFlatFiles(dbFiles);
        setEvents(dbEvents);
      } catch (err) {
        console.error("Failed to initialize database:", err);
      }
    };
    initData();
  }, []);

  // Sync panelHeights with activePanels
  useEffect(() => {
    const count = activePanels.length;
    if (count === 0) {
        setPanelHeights([]);
        panelHeightsRef.current = [];
    } else {
        const newHeight = 100 / count;
        const newHeights = new Array(count).fill(newHeight);
        setPanelHeights(newHeights);
        panelHeightsRef.current = newHeights;
    }
  }, [activePanels]);

  useEffect(() => {
    panelHeightsRef.current = panelHeights;
  }, [panelHeights]);

  // --- Actions ---
  
  // Standard Tools Logic
  const toggleTool = (toolId: ToolType) => {
    if (toolId === ToolType.CHAT) return;
    
    // Check close condition for File Viewer
    if (activePanels.some(p => p.id === toolId) && toolId === ToolType.FILE_VIEWER) {
       if (dirtyFileIds.size > 0) {
         alert(t.files.unsaved_warning);
         return;
       }
    }

    setActivePanels(prev => {
      // Check if this tool is already open (by ID = toolId)
      // Note: FILE_VIEWER panel always has ID = ToolType.FILE_VIEWER
      const exists = prev.some(p => p.id === toolId);
      
      if (exists) {
        // Close it
        return prev.filter(p => p.id !== toolId);
      } else {
        // Open it
        const newPanel: Panel = { id: toolId, type: toolId };
        const next = [...prev, newPanel];
        // Enforce max 3 limit
        return next.length > 3 ? next.slice(1) : next;
      }
    });
  };

  // File Open Logic
  const handleOpenFile = (file: FileNode) => {
    // 1. Add to openFiles if not present
    setOpenFiles(prev => {
        if (prev.some(f => f.id === file.id)) return prev;
        return [...prev, file];
    });
    // 2. Set Active
    setActiveFileId(file.id);

    // 3. Ensure Panel is open
    setActivePanels(prev => {
      const exists = prev.some(p => p.type === ToolType.FILE_VIEWER);
      if (exists) return prev;
      
      const newPanel: Panel = {
        id: ToolType.FILE_VIEWER,
        type: ToolType.FILE_VIEWER,
        title: 'Editor'
      };
      const next = [...prev, newPanel];
      return next.length > 3 ? next.slice(1) : next;
    });
  };

  const handleCloseTab = (fileId: string) => {
    if (dirtyFileIds.has(fileId)) {
      if (!confirm(`File has unsaved changes. Close anyway?`)) return;
    }
    
    setOpenFiles(prev => prev.filter(f => f.id !== fileId));
    setDirtyFileIds(prev => {
      const next = new Set(prev);
      next.delete(fileId);
      return next;
    });

    if (activeFileId === fileId) {
      setOpenFiles(prev => {
         const remaining = prev.filter(f => f.id !== fileId);
         if (remaining.length > 0) {
             setActiveFileId(remaining[remaining.length - 1].id);
         } else {
             setActiveFileId(null);
         }
         return prev; // We don't return modified state here, we just used it to calc activeId
      });
    }
  };

  const closePanel = (panelId: string) => {
     // Check if it's the file editor panel
     if (panelId === ToolType.FILE_VIEWER && dirtyFileIds.size > 0) {
         alert(t.files.unsaved_warning);
         return;
     }
     setActivePanels(prev => prev.filter(p => p.id !== panelId));
  };

  // --- CRUD Handlers (Projects/Tasks/Files) ---

  const handleAddProject = async (project: Project) => {
    await db.addProject(project);
    const defaultEpic: Epic = {
      id: `e-${Date.now()}`,
      projectId: project.id,
      title: 'General',
      description: 'General tasks for ' + project.title
    };
    await db.addEpic(defaultEpic);
    setWorkData(prev => ({ 
      ...prev, 
      projects: [...prev.projects, project],
      epics: [...prev.epics, defaultEpic]
    }));
  };

  const handleUpdateProject = async (project: Project) => {
    await db.updateProject(project);
    setWorkData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === project.id ? project : p)
    }));
  };

  const handleDeleteProject = async (projectId: string) => {
    await db.deleteProject(projectId);
    setWorkData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
    }));
  };

  const handleAddTask = async (task: Task) => {
    await db.addTask(task);
    setWorkData(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  };

  const handleUpdateTask = async (task: Task) => {
    await db.updateTask(task);
    setWorkData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? task : t) }));
  };

  const handleDeleteTask = async (taskId: string) => {
    await db.deleteTask(taskId);
    setWorkData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
  };

  const handleAddFile = async (node: FileNode) => {
    await db.addFile(node);
    setFlatFiles(prev => [...prev, node]);
  };

  const handleUpdateFile = async (node: FileNode) => {
    await db.updateFile(node);
    setFlatFiles(prev => prev.map(f => f.id === node.id ? node : f));
    // Update in openFiles as well so editor reflects changes (like rename)
    setOpenFiles(prev => prev.map(f => f.id === node.id ? node : f));
  };
  
  const handleSaveFileContent = async (file: FileNode, content: string) => {
      const updated = { ...file, content, updatedAt: new Date() };
      await handleUpdateFile(updated);
      setDirtyFileIds(prev => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
      });
  };

  const handleDeleteFile = async (nodeId: string) => {
    const findDescendants = (id: string, allFiles: FileNode[]): string[] => {
        const children = allFiles.filter(f => f.parentId === id);
        let ids = children.map(c => c.id);
        children.forEach(c => {
            ids = [...ids, ...findDescendants(c.id, allFiles)];
        });
        return ids;
    };
    const idsToDelete = [nodeId, ...findDescendants(nodeId, flatFiles)];
    for (const id of idsToDelete) {
        await db.deleteFile(id);
    }
    setFlatFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
    // Close tabs if deleted
    setOpenFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
  };

  const handleDirtyChange = (fileId: string, isDirty: boolean) => {
      setDirtyFileIds(prev => {
          const next = new Set(prev);
          if (isDirty) next.add(fileId);
          else next.delete(fileId);
          return next;
      });
  };

  // --- Calendar CRUD ---
  
  const handleAddEvent = async (event: CalendarEvent) => {
    await db.addEvent(event);
    setEvents(prev => [...prev, event]);
  };

  const handleUpdateEvent = async (event: CalendarEvent) => {
    await db.updateEvent(event);
    setEvents(prev => prev.map(e => e.id === event.id ? event : e));
  };

  const handleDeleteEvent = async (id: string) => {
    await db.deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Tree Construction
  const fileTree = useMemo(() => {
     const buildTree = (parentId: string | undefined): FileNode[] => {
         return flatFiles
            .filter(f => f.parentId === parentId || (!parentId && !f.parentId))
            .map(f => ({ ...f, children: buildTree(f.id) }));
     };
     return buildTree(undefined);
  }, [flatFiles]);

  // --- Resizing ---

  const handleChatResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleChatResizeMove);
    document.addEventListener('mouseup', handleChatResizeEnd);
  };

  const handleChatResizeMove = useCallback((e: MouseEvent) => {
    const sidebarWidth = 64;
    const availableWidth = window.innerWidth - sidebarWidth;
    const mouseXRelativeToContent = e.clientX - sidebarWidth;
    let newPercentage = ((availableWidth - mouseXRelativeToContent) / availableWidth) * 100;
    newPercentage = Math.min(80, Math.max(20, newPercentage));
    setChatWidth(newPercentage);
  }, []);

  const handleChatResizeEnd = useCallback(() => {
    document.removeEventListener('mousemove', handleChatResizeMove);
    document.removeEventListener('mouseup', handleChatResizeEnd);
  }, [handleChatResizeMove]);

  // Vertical Resize Logic
  const handleVerticalResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    activeDragIndexRef.current = index;
    isDraggingRef.current = true;
    setIsDraggingVertical(true);

    document.addEventListener('mousemove', handleVerticalResizeMove);
    document.addEventListener('mouseup', handleVerticalResizeEnd);
  };

  const handleVerticalResizeMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || activeDragIndexRef.current === null || !mainContentRef.current) return;
    
    const containerRect = mainContentRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top;
    const percentageY = (relativeY / containerRect.height) * 100;
    
    const index = activeDragIndexRef.current;
    
    setPanelHeights(prev => {
        const next = [...prev];
        let startPct = 0;
        for (let i = 0; i < index; i++) startPct += next[i];
        
        const combinedHeight = next[index] + next[index + 1];
        const endPct = startPct + combinedHeight;
        
        const minSize = 5; 
        const newSplit = Math.max(startPct + minSize, Math.min(endPct - minSize, percentageY));
        
        const newTopHeight = newSplit - startPct;
        const newBottomHeight = endPct - newSplit;
        
        next[index] = newTopHeight;
        next[index + 1] = newBottomHeight;
        
        return next;
    });
  }, []);

  const handleVerticalResizeEnd = useCallback(() => {
    isDraggingRef.current = false;
    activeDragIndexRef.current = null;
    setIsDraggingVertical(false);
    document.removeEventListener('mousemove', handleVerticalResizeMove);
    document.removeEventListener('mouseup', handleVerticalResizeEnd);
  }, [handleVerticalResizeMove]);

  // --- Chat Logic ---

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsThinking(true);

    try {
      const response = await generateResponse(text, newHistory);
      let botResponseText = response.text;
      const toolOutputs: string[] = [];

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'addMemoryNode') {
            const { label, group, importance } = call.args as any;
            const newNodeId = Date.now().toString();
            setMemoryData(prev => ({
              nodes: [...prev.nodes, { id: newNodeId, label, group: group || 3, val: importance || 10 }],
              links: [...prev.links, { source: prev.nodes[0].id, target: newNodeId, value: 2 }]
            }));
            toolOutputs.push(`Added concept "${label}" to memory.`);
            if (!activePanels.some(p => p.id === ToolType.MEMORY)) toggleTool(ToolType.MEMORY);
          } 
          else if (call.name === 'createProject') {
             const { title, description, goal } = call.args as any;
             const newId = `p-${Date.now()}`;
             const newProject = { id: newId, title, description, goal };
             await handleAddProject(newProject);
             toolOutputs.push(`Created project "${title}".`);
             if (!activePanels.some(p => p.id === ToolType.WORK)) toggleTool(ToolType.WORK);
          }
          else if (call.name === 'createTask') {
            const { title, epicId, status } = call.args as any;
            const newTask = {
              id: `t-${Date.now()}`,
              title,
              description: 'Generated by AI',
              status: (status as TaskStatus) || TaskStatus.TODO,
              epicId: epicId || workData.epics[0]?.id || ''
            };
            await handleAddTask(newTask);
            toolOutputs.push(`Created task "${title}".`);
            if (!activePanels.some(p => p.id === ToolType.WORK)) toggleTool(ToolType.WORK);
          }
          else if (call.name === 'searchWikipedia') {
             const { query } = call.args as any;
             setWikiQuery(query);
             toolOutputs.push(`Searching Wikipedia for "${query}"...`);
             if (!activePanels.some(p => p.id === ToolType.WIKIPEDIA)) toggleTool(ToolType.WIKIPEDIA);
          }
        }
        if (!botResponseText && toolOutputs.length > 0) botResponseText = toolOutputs.join(' ');
        else if (toolOutputs.length > 0) botResponseText += `\n\n[System Update]: ${toolOutputs.join(' ')}`;
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', content: botResponseText || "Processed.", timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "Sorry, I encountered an error processing that request.", timestamp: new Date() }]);
    } finally {
      setIsThinking(false);
    }
  };

  // --- Rendering ---

  const renderPanelContent = (panel: Panel) => {
    switch (panel.type) {
      case ToolType.MEMORY: return <MemoryGraph data={memoryData} />;
      case ToolType.WORK: return (
        <ProjectBoard 
          data={workData} 
          actions={{
            addProject: handleAddProject,
            updateProject: handleUpdateProject,
            deleteProject: handleDeleteProject,
            addTask: handleAddTask,
            updateTask: handleUpdateTask,
            deleteTask: handleDeleteTask
          }}
        />
      );
      case ToolType.FILES: return (
        <FileExplorer 
          files={fileTree} 
          actions={{
            addFile: handleAddFile,
            updateFile: handleUpdateFile,
            deleteFile: handleDeleteFile,
            openFile: handleOpenFile
          }}
        />
      );
      case ToolType.CALENDAR: return (
        <CalendarView 
          events={events} 
          actions={{
            addEvent: handleAddEvent,
            updateEvent: handleUpdateEvent,
            deleteEvent: handleDeleteEvent
          }}
        />
      );
      case ToolType.FILE_VIEWER: return (
        <FileEditorGroup 
          files={openFiles} 
          activeFileId={activeFileId} 
          onSetActiveFile={setActiveFileId} 
          onCloseFile={handleCloseTab} 
          onSaveFile={handleSaveFileContent}
          onDirtyChange={handleDirtyChange}
          dirtyFiles={dirtyFileIds}
        />
      );
      case ToolType.CONSOLE: return <ConsoleTool />;
      case ToolType.WIKIPEDIA: return <WikipediaExplorer initialQuery={wikiQuery} />;
      case ToolType.TERRAIN: return <TerrainExplorer />;
      case ToolType.CALCULATOR: return (
         <GeoGebraGrapher 
          appName="graphing"
          showMenuBar={false}
          showToolBar={false}
         />
      );
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200 ${isDraggingVertical ? 'cursor-row-resize select-none' : ''}`}>
      <aside className="w-16 flex flex-col items-center py-6 border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 z-20 flex-shrink-0 transition-colors duration-200">
        <div className="mb-8 p-2 bg-indigo-600 rounded-lg shadow-md">
          <Command size={24} className="text-white" />
        </div>
        
        <nav className="flex flex-col gap-6 w-full items-center flex-1">
          {TOOLS.filter(t => t.id !== ToolType.CHAT).map((tool) => {
            const isActive = activePanels.some(p => p.id === tool.id);
            const translatedLabel = t.tools[tool.id as keyof typeof t.tools] || tool.label;
            
            return (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool.id as ToolType)}
                className={`p-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/30' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900'
                }`}
              >
                <tool.icon size={22} />
                {isActive && (
                  <div className="absolute right-1 top-1 w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></div>
                )}
                <div className="absolute left-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-gray-200 dark:border-gray-700 shadow-md z-50">
                  {translatedLabel}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4 items-center mb-4">
          <button 
             onClick={toggleLanguage} 
             className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors relative group"
             title={language === 'en' ? 'Switch to Spanish' : 'Switch to English'}
          >
             <Languages size={22} />
             <span className="absolute left-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-gray-200 dark:border-gray-700 shadow-md">
               {language.toUpperCase()}
             </span>
          </button>

          <button 
             onClick={toggleTheme} 
             className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors relative group"
             title="Toggle Theme"
          >
             {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
             <span className="absolute left-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-gray-200 dark:border-gray-700 shadow-md capitalize">
               {theme} Mode
             </span>
          </button>

          <button className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group relative">
            <Settings size={22} />
            <span className="absolute left-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-gray-200 dark:border-gray-700 shadow-md">
               {t.common.settings}
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex overflow-hidden relative">
        <section 
          ref={mainContentRef}
          className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 relative min-w-0 transition-colors duration-200"
        >
          {activePanels.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
              <LayoutGrid size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a tool from the sidebar to begin</p>
            </div>
          ) : (
            <div className="flex flex-col h-full w-full">
              {activePanels.map((panel, index) => (
                <React.Fragment key={panel.id}>
                   <div 
                      style={{ height: `${panelHeights[index]}%` }} 
                      className="relative min-h-0 w-full transition-[height] duration-0 ease-linear"
                   >
                       <div className="absolute inset-0 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
                           {activePanels.length > 1 && (
                             <div className="absolute top-0 right-0 z-20 p-2">
                               <button 
                                onClick={() => closePanel(panel.id)}
                                className="bg-gray-200/80 dark:bg-gray-900/80 hover:bg-red-100 dark:hover:bg-red-900/80 text-gray-500 hover:text-red-500 dark:hover:text-red-200 rounded p-1 transition-colors backdrop-blur-sm"
                               >
                                 <AlertCircle size={12} className="rotate-45" /> 
                               </button>
                             </div>
                           )}
                           {renderPanelContent(panel)}
                       </div>
                   </div>
                   
                   {index < activePanels.length - 1 && (
                     <div 
                       className="h-1.5 w-full bg-gray-100 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800 hover:bg-indigo-500/20 dark:hover:bg-indigo-600/50 hover:border-indigo-500/50 cursor-row-resize z-30 flex items-center justify-center transition-colors flex-shrink-0"
                       onMouseDown={(e) => handleVerticalResizeStart(index, e)}
                     >
                        <GripHorizontal size={12} className="text-gray-400 dark:text-gray-600" />
                     </div>
                   )}
                </React.Fragment>
              ))}
            </div>
          )}
        </section>

        <div 
           className="w-1.5 bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 hover:bg-indigo-500 dark:hover:bg-indigo-600 cursor-col-resize z-50 flex flex-col justify-center items-center transition-colors shadow-xl"
           onMouseDown={handleChatResizeStart}
        >
          <div className="h-12 w-0.5 bg-gray-300 dark:bg-gray-600 rounded-full pointer-events-none" />
        </div>

        <section 
          className="flex-shrink-0 flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl relative z-10 min-w-[300px] transition-colors duration-200"
          style={{ width: `${chatWidth}%` }}
        >
           {/* Tab Header */}
           <div className="flex border-b border-gray-200 dark:border-gray-800">
              <button 
                onClick={() => setRightPanelTab('ai')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  rightPanelTab === 'ai' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <MessageSquare size={16} />
                <span>AI</span>
              </button>
              <button 
                onClick={() => setRightPanelTab('team')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  rightPanelTab === 'team' 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Users size={16} />
                <span>Team</span>
              </button>
           </div>
           
           <div className="flex-1 relative overflow-hidden">
             {rightPanelTab === 'ai' ? (
                <ChatInterface messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} />
             ) : (
                <GroupChat />
             )}
           </div>
        </section>
      </main>
    </div>
  );
};

export default App;