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
import { Settings, Command, LayoutGrid, AlertCircle, GripHorizontal, Languages, Sun, Moon, MessageSquare, Users } from 'lucide-react';

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

  // Custom Hooks
  const { workData, setWorkData, actions: projectActions } = useProjectManager();
  const { memoryData, actions: memoryActions } = useMemoryManager();
  const { events, setEvents, schedule, setSchedule, actions: calendarActions } = useCalendarManager();

  const {
    fileTree,
    openFiles,
    activeFileId,
    setActiveFileId,
    dirtyFileIds,
    actions: fileActions,
    setFlatFiles
  } = useFileManager(t, activePanels, setActivePanels);

  const {
    rightPanelTab,
    setRightPanelTab,
    chatWidth,
    panelHeights,
    isDraggingVertical,
    mainContentRef,
    actions: layoutActions
  } = useLayoutManager(t, dirtyFileIds, activePanels, setActivePanels);

  // Wiki State
  const [wikiQuery, setWikiQuery] = useState<string>('');

  const { messages, isThinking, handleSendMessage } = useChatManager(t, workData, {
    addMemoryNode: memoryActions.addMemoryNode,
    handleAddProject: projectActions.addProject,
    handleAddTask: projectActions.addTask,
    setWikiQuery,
    toggleTool: layoutActions.toggleTool,
    activePanels
  });

  // Load Initial Data
  useEffect(() => {
    const initData = async () => {
      try {
        const { workData: dbWorkData, files: dbFiles, events: dbEvents, schedule: dbSchedule } = await db.init();
        setWorkData(dbWorkData);
        setFlatFiles(dbFiles);
        setEvents(dbEvents);
        setSchedule(dbSchedule);
      } catch (err) {
        console.error("Failed to initialize database:", err);
      }
    };
    initData();
  }, [setWorkData, setFlatFiles, setEvents]);

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
            addClass: calendarActions.addClass,
            updateClass: calendarActions.updateClass,
            deleteClass: calendarActions.deleteClass
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

        <nav className="flex flex-col gap-6 w-full items-center flex-1">
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
      </main>
    </div>
  );
};

export default App;