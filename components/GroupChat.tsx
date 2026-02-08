
import React, { useState, useEffect, useRef } from 'react';
import { groupChatService } from '../services/groupChatService';
import { GroupMessage } from '../types';
import { Send, Clock, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const COOLDOWN_SECONDS = 60;

const GroupChat: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 0 means ready
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = groupChatService.subscribe((msgs) => {
      setMessages(msgs);
    });
    return unsubscribe;
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cooldown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isSending || cooldown > 0) return;

    setIsSending(true);
    try {
      await groupChatService.sendMessage(inputValue);
      setInputValue('');
      setCooldown(COOLDOWN_SECONDS); // Start Cooldown
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 transition-colors duration-200">
      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center items-center gap-2 mb-4">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[10px] text-gray-400 dark:text-gray-600 uppercase tracking-wider font-semibold">Team Online</span>
        </div>
        
        {messages.map((msg) => {
          const isMe = msg.userId === 'current-user';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                 {!isMe && <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{msg.userName}</span>}
                 <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
              </div>
              <div 
                className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 relative">
        {cooldown > 0 ? (
          <div className="absolute inset-0 z-10 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-[2px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-2">
             <div className="relative w-12 h-12 flex items-center justify-center">
                 {/* Simple Circular Progress using SVG */}
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="24" cy="24" r="20" className="stroke-gray-300 dark:stroke-gray-700 fill-none" strokeWidth="4" />
                    <circle 
                      cx="24" cy="24" r="20" 
                      className="stroke-indigo-500 fill-none transition-all duration-1000 ease-linear" 
                      strokeWidth="4"
                      strokeDasharray="125.6"
                      strokeDashoffset={125.6 * (1 - cooldown / COOLDOWN_SECONDS)} 
                      strokeLinecap="round"
                    />
                 </svg>
                 <span className="absolute text-xs font-bold">{cooldown}s</span>
             </div>
             <p className="text-xs font-medium">{t.groupChat.wait}...</p>
          </div>
        ) : null}

        <form onSubmit={handleSend} className="flex gap-2 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isSending || cooldown > 0}
            placeholder={t.groupChat.placeholder}
            className="flex-1 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isSending || cooldown > 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 text-white p-2 rounded-xl transition-colors flex items-center justify-center min-w-[40px]"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
