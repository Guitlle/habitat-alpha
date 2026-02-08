import { useState, useCallback, useRef } from 'react';
import { Message, ToolType, TaskStatus, WorkData, Panel } from '../types';
import { aiService } from '../services/aiService';
import { db } from '../services/db';
import { syncService } from '../services/syncService';

export const useChatManager = (
    t: any,
    workData: WorkData,
    actions: {
        addMemoryNode: (label: string, group?: number, importance?: number) => void;
        handleAddProject: (p: any) => Promise<void>;
        handleAddTask: (t: any) => Promise<void>;
        setWikiQuery: (q: string) => void;
        toggleTool: (id: ToolType) => void;
        activePanels: Panel[];
    },
    userId?: string
) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', role: 'model', content: t.chat.system_welcome, timestamp: new Date() }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSendMessage = useCallback(async (text: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        // 1. Optimistic UI Update
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);

        // Prepare placeholder for bot response immediately
        const botMsgId = (Date.now() + 1).toString();
        const initialBotMsg: Message = {
            id: botMsgId,
            role: 'model',
            content: '',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, initialBotMsg]);

        try {
            // 2. Persist User Message (Background)
            // We await local DB to ensure consistency, but remote sync is now fire-and-forget 
            // to avoid blocking the AI response.
            try {
                await db.addChatMessage(userMsg);
                // Fire and forget remote sync
                if (userId) {
                    syncService.push('chat_messages', userMsg, userId)
                        .catch(err => console.error("Failed to sync user message:", err));
                }
            } catch (dbErr) {
                console.error("Failed to save user message locally:", dbErr);
            }

            // 3. Prepare Prompt
            const apiMessages = [
                ...messages.map(m => ({
                    role: (m.role === 'model' ? 'assistant' : m.role) as 'user' | 'assistant' | 'system',
                    content: m.content
                })),
                { role: 'user' as const, content: text }
            ];

            let streamedContent = '';

            // 4. Stream Response
            await aiService.streamChat(
                apiMessages,
                (chunk) => {
                    streamedContent += chunk;
                    setMessages(prev => prev.map(m =>
                        m.id === botMsgId
                            ? { ...m, content: streamedContent }
                            : m
                    ));
                },
                (error) => {
                    console.error("Stream Error details:", error);
                    const errorMessage = error instanceof Error ? error.message : "Connection error";
                    setMessages(prev => prev.map(m =>
                        m.id === botMsgId
                            ? { ...m, content: `[Error: ${errorMessage}]` }
                            : m
                    ));
                    setIsThinking(false);
                },
                async () => {
                    // On Complete
                    setIsThinking(false);
                    const finalMsg = { ...initialBotMsg, content: streamedContent };

                    // Persist Bot Message
                    try {
                        await db.addChatMessage(finalMsg);
                        // Fire and forget remote sync
                        if (userId) {
                            syncService.push('chat_messages', finalMsg, userId)
                                .catch(err => console.error("Failed to sync bot message:", err));
                        }
                    } catch (dbErr) {
                        console.error("Failed to save bot message locally:", dbErr);
                    }
                }
            );

        } catch (err) {
            console.error("Critical Chat Error:", err);
            setIsThinking(false);
            setMessages(prev => prev.map(m =>
                m.id === botMsgId
                    ? { ...m, content: "Error: Failed to initiate chat. Please check your connection." }
                    : m
            ));
        }
    }, [messages, userId]);

    return {
        messages,
        setMessages,
        isThinking,
        handleSendMessage
    };
};
