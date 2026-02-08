-- SUPABASE SCHEMA FOR COGNITIVE WORKSPACE
-- Run this in your Supabase SQL Editor

-- 1. Create tables

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    "order" INTEGER DEFAULT 0,
    archived BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Epics
CREATE TABLE IF NOT EXISTS public.epics (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    "epicId" TEXT REFERENCES public.epics(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    "order" INTEGER DEFAULT 0,
    archived BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Files
CREATE TABLE IF NOT EXISTS public.files (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    "parentId" TEXT DEFAULT 'root',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    type TEXT DEFAULT 'meeting',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule
CREATE TABLE IF NOT EXISTS public.schedule (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    day INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    location TEXT,
    teacher TEXT,
    color TEXT DEFAULT 'indigo',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Nodes
CREATE TABLE IF NOT EXISTS public.memory_nodes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    "group" INTEGER DEFAULT 1,
    val INTEGER DEFAULT 10,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Links
CREATE TABLE IF NOT EXISTS public.memory_links (
    id TEXT PRIMARY KEY, -- Composite or random
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL REFERENCES public.memory_nodes(id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES public.memory_nodes(id) ON DELETE CASCADE,
    value INTEGER DEFAULT 1
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (Owner can do everything)

DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('projects', 'epics', 'tasks', 'files', 'events', 'schedule', 'memory_nodes', 'memory_links', 'chat_messages')
  LOOP
    EXECUTE format('CREATE POLICY "Users can only access their own %I" ON public.%I FOR ALL USING (auth.uid() = user_id);', t, t);
  END LOOP;
END $$;
