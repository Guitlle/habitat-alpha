import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface UsageStats {
    user_id: string;
    plan: 'free' | 'pro';
    tokens_used: number;
    tokens_limit: number;
    requests_count: number;
}

export const aiService = {
    /**
     * Streams chat completion from the Python backend
     */
    streamChat: async (
        messages: ChatMessage[],
        onChunk: (chunk: string) => void,
        onError: (error: any) => void,
        onComplete: () => void
    ) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error('Unauthorized: No active session');
            }

            const response = await fetch(`${BACKEND_URL}/api/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model: 'gpt-4', // Default, backend can override based on plan
                    messages,
                    stream: true
                })
            });

            if (!response.ok) {
                if (response.status === 402) {
                    throw new Error('Quota exceeded. Please upgrade your plan.');
                }
                throw new Error(`Backend error: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body received');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            onComplete();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) onChunk(content);
                        } catch (e) {
                            console.warn('Failed to parse SSE chunk', e);
                        }
                    }
                }
            }
            onComplete();

        } catch (error) {
            console.error('AI Service Error:', error);
            onError(error);
        }
    },

    /**
     * Fetches current usage stats
     */
    getUsage: async (): Promise<UsageStats | null> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const response = await fetch(`${BACKEND_URL}/api/user/usage`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch usage:', error);
            return null;
        }
    }
};
