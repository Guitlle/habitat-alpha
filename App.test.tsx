import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { supabase } from './services/supabase';

// Mock Supabase
vi.mock('./services/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [] })),
            upsert: vi.fn(() => Promise.resolve({ error: null })),
            delete: vi.fn(() => Promise.resolve({ error: null })),
        })),
    },
}));

// Mock Database Service (indexedDB)
vi.mock('./services/db', () => ({
    db: {
        init: vi.fn(() => Promise.resolve({
            workData: { epics: [] },
            files: [],
            events: [],
            schedule: [],
            memoryNodes: [],
            memoryLinks: [],
            chatMessages: []
        })),
        getAllData: vi.fn(() => Promise.resolve({
            workData: { epics: [] },
            files: [],
            events: [],
            schedule: [],
            memoryNodes: [],
            memoryLinks: [],
            chatMessages: []
        })),
    }
}));

// Mock Team Service
vi.mock('./services/teamService', () => ({
    teamService: {
        getMyTeam: vi.fn(() => Promise.resolve(null))
    }
}));

// Mock Sync Service
vi.mock('./services/syncService', () => ({
    syncService: {
        pullAll: vi.fn(() => Promise.resolve(true))
    }
}));

// Mock Contexts
const mockT = {
    common: { settings: 'Settings' },
    tools: { chat: 'Chat', files: 'Files', projects: 'Projects', calendar: 'Calendar', memory: 'Memory' },
    chat: { system_welcome: 'Welcome' }
};

vi.mock('./contexts/LanguageContext', () => ({
    useLanguage: vi.fn(() => ({
        t: mockT,
        language: 'en',
        toggleLanguage: vi.fn()
    }))
}));

vi.mock('./contexts/ThemeContext', () => ({
    useTheme: vi.fn(() => ({
        theme: 'light',
        toggleTheme: vi.fn()
    }))
}));

// Mock Hooks
vi.mock('./hooks/useProjectManager', () => ({
    useProjectManager: vi.fn(() => ({
        workData: { epics: [] },
        setWorkData: vi.fn(),
        actions: { addProject: vi.fn(), addTask: vi.fn() }
    }))
}));

vi.mock('./hooks/useFileManager', () => ({
    useFileManager: vi.fn(() => ({
        fileTree: [],
        openFiles: [],
        activeFileId: null,
        setActiveFileId: vi.fn(),
        dirtyFileIds: new Set(),
        actions: { addFile: vi.fn(), closeTab: vi.fn() },
        setFlatFiles: vi.fn()
    }))
}));

vi.mock('./hooks/useCalendarManager', () => ({
    useCalendarManager: vi.fn(() => ({
        events: [],
        setEvents: vi.fn(),
        schedule: [],
        setSchedule: vi.fn(),
        actions: { addEvent: vi.fn() }
    }))
}));

vi.mock('./hooks/useLayoutManager', () => ({
    useLayoutManager: vi.fn(() => ({
        rightPanelTab: 'ai',
        setRightPanelTab: vi.fn(),
        chatWidth: 30,
        panelHeights: [],
        isDraggingVertical: false,
        isMobile: false,
        isChatHistoryOpen: false,
        mainContentRef: { current: null },
        actions: { toggleTool: vi.fn(), closePanel: vi.fn(), setChatHistoryOpen: vi.fn() }
    }))
}));

vi.mock('./hooks/useChatManager', () => ({
    useChatManager: vi.fn(() => ({
        messages: [],
        setMessages: vi.fn(),
        isThinking: false,
        handleSendMessage: vi.fn()
    }))
}));

vi.mock('./hooks/useMemoryManager', () => ({
    useMemoryManager: vi.fn(() => ({
        memoryData: { nodes: [], links: [] },
        setMemoryData: vi.fn(),
        actions: { addMemoryNode: vi.fn() }
    }))
}));

describe('App Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Cloud Sync (Login) button when not authenticated', async () => {
        // Mock logged out state
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });

        render(<App />);

        // Wait for init
        await waitFor(() => {
            expect(supabase.auth.getSession).toHaveBeenCalled();
        });

        const loginButton = screen.getByText(/Cloud Sync/i);
        expect(loginButton).toBeInTheDocument();

        // Ensure Logout is NOT present
        expect(screen.queryByText(/Logout/i)).not.toBeInTheDocument();
    });


    it('renders Logout button when authenticated', async () => {
        // Mock logged in state
        const mockUser = { id: 'test-user-id', email: 'test@example.com' };
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser, access_token: 'fake-token' } }
        });

        render(<App />);

        await waitFor(() => {
            expect(supabase.auth.getSession).toHaveBeenCalled();
        });

        // Check for Logout button (it might be hidden in a menu or icon, searching by text 'Logout' which is in the span)
        const logoutText = await screen.findByText(/Logout/i);
        expect(logoutText).toBeInTheDocument();
    });

    it('calls signOut when logout button is clicked', async () => {
        // Mock logged in state
        const mockUser = { id: 'test-user-id', email: 'test@example.com' };
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: mockUser, access_token: 'fake-token' } }
        });

        render(<App />);

        const logoutText = await screen.findByText(/Logout/i);
        // Click the button containing the text
        fireEvent.click(logoutText.closest('button')!);

        await waitFor(() => {
            expect(supabase.auth.signOut).toHaveBeenCalled();
        });
    });
});
