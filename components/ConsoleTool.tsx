import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { Terminal, Play, Trash2, Info, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const HELP_TEXT = `
/**
 * Cognitive Workspace Console
 * ---------------------------
 * Environment:
 *  - db: IndexedDB wrapper (async methods)
 *  - window, document, console: Standard browser globals
 * 
 * Usage Examples:
 *  > 1 + 1                      // Arithmetic -> 2
 *  > window.innerWidth          // Browser API
 *  > await db.getAllData()      // Query Database
 *  > const p = { id: 'test', title: 'Demo' }; await db.addProject(p);
 * 
 * DB API:
 *  - getAllData()
 *  - addProject(p), updateProject(p), deleteProject(id)
 *  - addTask(t), updateTask(t), deleteTask(id)
 *  - addFile(f), updateFile(f), deleteFile(id)
 *  - addEvent(e), updateEvent(e), deleteEvent(id)
 */
`;

interface LogEntry {
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}

const ConsoleTool: React.FC = () => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([{
      type: 'output',
      content: `Console ready. ${t.console.help}.`,
      timestamp: Date.now()
  }]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    // Add input log immediately
    setLogs(prev => [...prev, { type: 'input', content: cmd, timestamp: Date.now() }]);
    
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput(''); // Clear input immediately

    if (cmd.trim() === 'clear') {
        setLogs([]);
        return;
    }

    if (cmd.trim() === 'help') {
        setLogs(prev => [...prev, { type: 'output', content: HELP_TEXT, timestamp: Date.now() }]);
        return;
    }

    try {
      let result;
      // Strategy: Try to execute as an expression (return value). 
      // If that fails with SyntaxError (e.g. user typed "const a = 1"), try executing as a block of statements.
      try {
        // Wrap in parens to resolve object literals like {a:1} as objects, not blocks.
        // Wrap in async IIFE to allow top-level await.
        const func = new Function('db', `return (async () => { return (${cmd.trim()}); })()`);
        result = await func(db);
      } catch (e) {
        if (e instanceof SyntaxError) {
             // Fallback: Execute as statements
             const func = new Function('db', `return (async () => { ${cmd.trim()} })()`);
             result = await func(db);
        } else {
            throw e; // Runtime error in expression
        }
      }
      
      let outputString = '';
      if (result === undefined) {
         outputString = 'undefined';
      } else if (result === null) {
         outputString = 'null';
      } else {
          try {
             if (typeof result === 'object') {
                outputString = JSON.stringify(result, null, 2);
             } else {
                outputString = String(result);
             }
          } catch (e) {
             outputString = String(result);
          }
      }

      setLogs(prev => [...prev, { type: 'output', content: outputString, timestamp: Date.now() }]);
    } catch (err: any) {
      setLogs(prev => [...prev, { type: 'error', content: err.message || String(err), timestamp: Date.now() }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInput('');
        }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-300 font-mono text-sm transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
          <Terminal size={16} />
          <span className="font-bold tracking-wider">{t.console.title}</span>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setLogs([])} className="p-1 hover:text-gray-900 dark:hover:text-white text-gray-500" title={t.console.clear}>
                <Trash2 size={14} />
            </button>
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.map((log, i) => (
          <div key={i} className={`flex flex-col ${log.type === 'error' ? 'text-red-500 dark:text-red-400' : log.type === 'input' ? 'text-gray-500' : 'text-green-700 dark:text-green-300'}`}>
             {log.type === 'input' && (
                 <div className="flex items-center gap-2 mb-1">
                     <ChevronRight size={12} />
                     <span className="font-bold">{log.content}</span>
                 </div>
             )}
             {log.type !== 'input' && (
                 <pre className="whitespace-pre-wrap break-words pl-4 border-l-2 border-gray-200 dark:border-gray-800 ml-1">
                     {log.content}
                 </pre>
             )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-2 items-center relative">
          <ChevronRight size={16} className="text-blue-500 animate-pulse" />
          <input 
            ref={inputRef}
            autoFocus
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white font-mono placeholder-gray-400 dark:placeholder-gray-700"
            placeholder="await db.getAllData()..."
          />
          <button onClick={() => executeCommand(input)} className="text-gray-500 hover:text-green-500">
             <Play size={16} />
          </button>
        </div>
        <div className="mt-2 flex gap-4 text-[10px] text-gray-500 dark:text-gray-600">
            <span>{t.console.help}</span>
            <span>Up/Down for history</span>
        </div>
      </div>
    </div>
  );
};

export default ConsoleTool;