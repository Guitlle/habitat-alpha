import React, { useState, useEffect } from 'react';
import { ToolType, Panel } from './types';
import { TOOLS } from './constants';
import { db } from './services/db';

// Components
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
import { supabase } from './services/supabase';
import { syncService } from './services/syncService';
import { teamService, Team } from './services/teamService';
import AuthModal from './components/Modals/AuthModal';
import { User } from '@supabase/supabase-js';
import { Settings, Command, LayoutGrid, AlertCircle, GripHorizontal, Languages, Sun, Moon, MessageSquare, Users, LogIn, LogOut, Loader2 } from 'lucide-react';

// Contexts
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';

// Hooks
import { useProjectManager } from './hooks/useProjectManager';
import { useFileManager } from './hooks/useFileManager';
import { useCalendarManager } from './hooks/useCalendarManager';
import { useLayoutManager } from './hooks/useLayoutManager';
import { useChatManager } from './hooks/useChatManager';
import { useMemoryManager } from './hooks/useMemoryManager';

const App: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Lifted state to resolve dependency loop
  const [activePanels, setActivePanels] = useState<Panel[]>([
    { id: ToolType.TERRAIN, type: ToolType.TERRAIN }
  ]);

  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Custom Hooks
  const { workData, setWorkData, actions: projectActions } = useProjectManager(user?.id, team?.id);
  const { memoryData, setMemoryData, actions: memoryActions } = useMemoryManager(user?.id); // Memory stays personal for now? Or team? Let's keep it personal as per plan unless asked.
  const { events, setEvents, schedule, setSchedule, actions: calendarActions } = useCalendarManager(user?.id, team?.id);

  const {
    fileTree,
    openFiles,
    activeFileId,
    setActiveFileId,
    dirtyFileIds,
    actions: fileActions,
    setFlatFiles
  } = useFileManager(t, activePanels, setActivePanels, user?.id);

  const {
    rightPanelTab,
    setRightPanelTab,
    chatWidth,
    panelHeights,
    isDraggingVertical,
    isMobile,
    isChatHistoryOpen,
    mainContentRef,
    actions: layoutActions
  } = useLayoutManager(t, dirtyFileIds, activePanels, setActivePanels);

  // Wiki State
  const [wikiQuery, setWikiQuery] = useState<string>('');

  const { messages, setMessages, isThinking, handleSendMessage } = useChatManager(t, workData, {
    addMemoryNode: memoryActions.addMemoryNode,
    handleAddProject: projectActions.addProject,
    handleAddTask: projectActions.addTask,
    setWikiQuery,
    toggleTool: layoutActions.toggleTool,
    activePanels
  }, user?.id);

  // Load Initial Data & Auth Sync
  useEffect(() => {
    const initData = async () => {
      try {
        const {
          workData: dbWorkData,
          files: dbFiles,
          events: dbEvents,
          schedule: dbSchedule,
          memoryNodes: dbNodes,
          memoryLinks: dbLinks,
          chatMessages: dbMessages
        } = await db.init();
        setWorkData(dbWorkData);
        setFlatFiles(dbFiles);
        setEvents(dbEvents);
        setSchedule(dbSchedule);
        if (dbNodes.length > 0) setMemoryData({ nodes: dbNodes, links: dbLinks });
        if (dbMessages.length > 0) setMessages(dbMessages);

        // Check Auth
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          setIsSyncing(true);
          try {
            const myTeam = await teamService.getMyTeam();
            setTeam(myTeam);
            await syncService.pullAll(session.user.id);
            // Refresh data from DB after pull
            const updated = await db.getAllData();
            setWorkData(updated.workData);
            setFlatFiles(updated.files);
            setEvents(updated.events);
            setSchedule(updated.schedule);
            setMemoryData({ nodes: updated.memoryNodes, links: updated.memoryLinks });
            if (updated.chatMessages.length > 0) setMessages(updated.chatMessages);
          } catch (syncErr) {
            console.error("Sync failed during initialization:", syncErr);
          } finally {
            setIsSyncing(false);
          }
        }
      } catch (err) {
        console.error("Failed to initialize database:", err);
      }
    };
    initData();

    // Listener for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAuthModalOpen(false); // Close modal on successful login (link or code)
        setIsSyncing(true);
        try {
          const myTeam = await teamService.getMyTeam();
          setTeam(myTeam);
          await syncService.pullAll(session.user.id);
          const updated = await db.getAllData();
          setWorkData(updated.workData);
          setFlatFiles(updated.files);
          setEvents(updated.events);
          setSchedule(updated.schedule);
          setMemoryData({ nodes: updated.memoryNodes, links: updated.memoryLinks });
          if (updated.chatMessages.length > 0) setMessages(updated.chatMessages);
        } catch (syncErr) {
          console.error("Sync failed on auth state change:", syncErr);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setWorkData, setFlatFiles, setEvents, setSchedule, setMemoryData, setMessages]);

  // --- Rendering ---

  const renderPanelContent = (panel: Panel) => {
    switch (panel.type) {
      case ToolType.MEMORY: return <MemoryGraph data={memoryData} />;
      case ToolType.WORK: return (
        <ProjectBoard
          data={workData}
          actions={{
            addProject: projectActions.addProject,
            updateProject: projectActions.updateProject,
            deleteProject: projectActions.deleteProject,
            addTask: projectActions.addTask,
            updateTask: projectActions.updateTask,
            deleteTask: projectActions.deleteTask
          }}
        />
      );
      case ToolType.FILES: return (
        <FileExplorer
          files={fileTree}
          actions={{
            addFile: fileActions.addFile,
            updateFile: fileActions.updateFile,
            deleteFile: fileActions.deleteFile,
            openFile: fileActions.openFile
          }}
        />
      );
      case ToolType.CALENDAR: return (
        <CalendarView
          events={events}
          schedule={schedule}
          actions={{
            addEvent: calendarActions.addEvent,
            updateEvent: calendarActions.updateEvent,
            deleteEvent: calendarActions.deleteEvent,
            addClass: calendarActions.addScheduleClass,
            updateClass: calendarActions.updateScheduleClass,
            deleteClass: calendarActions.deleteScheduleClass
          }}
        />
      );
      case ToolType.FILE_VIEWER: return (
        <FileEditorGroup
          files={openFiles}
          activeFileId={activeFileId}
          onSetActiveFile={setActiveFileId}
          onCloseFile={fileActions.closeTab}
          onSaveFile={fileActions.saveFileContent}
          onDirtyChange={fileActions.dirtyChange}
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

        <nav
          className="flex flex-col gap-6 w-full items-center flex-1 overflow-y-auto scrollbar-hide py-4 overflow-x-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 20px), transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20px, black calc(100% - 20px), transparent)'
          }}
        >
          {TOOLS.filter(t => t.id !== ToolType.CHAT).map((tool) => {
            const isActive = activePanels.some(p => p.id === tool.id);
            const translatedLabel = t.tools[tool.id as keyof typeof t.tools] || tool.label;

            return (
              <button
                key={tool.id}
                onClick={() => layoutActions.toggleTool(tool.id as ToolType)}
                className={`p-3 rounded-xl transition-all duration-200 group relative ${isActive
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

          <div className="w-8 h-px bg-gray-200 dark:bg-gray-800 my-2"></div>

          {user ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all relative group"
            >
              <LogOut size={22} />
              <span className="absolute left-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-gray-200 dark:border-gray-700 shadow-md">
                Logout
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-3 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all relative group"
            >
              <LogIn size={22} />
              <span className="absolute left-14 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-gray-200 dark:border-gray-700 shadow-md whitespace-nowrap">
                Cloud Sync
              </span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex overflow-hidden relative">
        {isMobile ? (
          <div className="flex-1 flex flex-col min-w-0 h-screen relative">
            {/* Mobile Chat Tabs - TOP */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
              <button
                onClick={() => {
                  if (rightPanelTab === 'ai' && isChatHistoryOpen) {
                    layoutActions.setChatHistoryOpen(false);
                  } else {
                    setRightPanelTab('ai');
                    layoutActions.setChatHistoryOpen(true);
                  }
                }}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${rightPanelTab === 'ai'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                  }`}
              >
                <MessageSquare size={14} />
                <span>AI CHAT</span>
              </button>
              <button
                onClick={() => {
                  if (rightPanelTab === 'team' && isChatHistoryOpen) {
                    layoutActions.setChatHistoryOpen(false);
                  } else {
                    setRightPanelTab('team');
                    layoutActions.setChatHistoryOpen(true);
                  }
                }}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${rightPanelTab === 'team'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                  }`}
              >
                <Users size={14} />
                <span>TEAM CHAT</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              <section
                ref={mainContentRef}
                className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 relative min-w-0"
              >
                {activePanels.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                    <LayoutGrid size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Select a tool from the sidebar</p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full w-full">
                    {activePanels.map((panel, index) => (
                      <React.Fragment key={panel.id}>
                        <div
                          style={{ height: `${panelHeights[index]}%` }}
                          className="relative min-h-0 w-full"
                        >
                          <div className="absolute inset-0 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950">
                            {activePanels.length > 1 && (
                              <div className="absolute top-0 right-0 z-20 p-2">
                                <button
                                  onClick={() => layoutActions.closePanel(panel.id)}
                                  className="bg-gray-200/80 dark:bg-gray-900/80 text-gray-500 hover:text-red-500 rounded p-1 backdrop-blur-sm"
                                >
                                  <AlertCircle size={12} className="rotate-45" />
                                </button>
                              </div>
                            )}
                            {renderPanelContent(panel)}
                          </div>
                        </div>
                        {index < activePanels.length - 1 && <div className="h-px bg-gray-200 dark:border-gray-800" />}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </section>

              {/* Mobile Chat Overlay */}
              {isChatHistoryOpen && (
                <div className="absolute inset-0 bg-white dark:bg-gray-950 z-40 flex flex-col animate-in slide-in-from-bottom-2 duration-200">
                  <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {rightPanelTab === 'ai' ? 'AI Assistant' : 'Team Channel'}
                      </span>
                    </div>
                    <button
                      onClick={() => layoutActions.setChatHistoryOpen(false)}
                      className="p-1 px-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    >
                      CLOSE
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {rightPanelTab === 'ai' ? (
                      <ChatInterface historyOnly messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} />
                    ) : (
                      <GroupChat historyOnly />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Input Area - BOTTOM */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
              {rightPanelTab === 'ai' ? (
                <ChatInterface minimal messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} />
              ) : (
                <GroupChat minimal />
              )}
            </div>
          </div>
        ) : (
          /* DESKTOP LAYOUT (Original) */
          <>
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
                                onClick={() => layoutActions.closePanel(panel.id)}
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
                          onMouseDown={(e) => layoutActions.verticalResizeStart(index, e)}
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
              onMouseDown={layoutActions.chatResizeStart}
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
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${rightPanelTab === 'ai'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-500'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <MessageSquare size={16} />
                  <span>AI</span>
                </button>
                <button
                  onClick={() => setRightPanelTab('team')}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${rightPanelTab === 'team'
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
          </>
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {isSyncing && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          Syncing...
        </div>
      )}
    </div>
  );
};

export default App;