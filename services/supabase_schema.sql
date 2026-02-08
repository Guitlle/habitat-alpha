-- SUPABASE SCHEMA FOR COGNITIVE WORKSPACE
-- Run this in your Supabase SQL Editor

-- 1. Create tables

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    "order" INTEGER DEFAULT 0,
    archived BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    PRIMARY KEY (team_id, user_id),
    CONSTRAINT unique_user_membership UNIQUE (user_id)
);

-- Invites
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '7 days')
);

-- Epics (Updating with team_id)
CREATE TABLE IF NOT EXISTS public.epics (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
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
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
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
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
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
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
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
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    "group" INTEGER DEFAULT 1,
    val INTEGER DEFAULT 10,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Memory Links
CREATE TABLE IF NOT EXISTS public.memory_links (
    id TEXT PRIMARY KEY, -- Composite or random
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    source TEXT NOT NULL REFERENCES public.memory_nodes(id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES public.memory_nodes(id) ON DELETE CASCADE,
    value INTEGER DEFAULT 1
);

-- Chat Messages (AI)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Group Chat Messages (Human team)
CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "userName" TEXT, -- Snapshot or join, let's snapshot for simplicity in this MVP
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
-- ... (other tables already enabled)

-- 3. Simplified RLS (Access if user is owner OR in the team)

CREATE OR REPLACE FUNCTION get_my_team_id() 
RETURNS uuid AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE;

DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('projects', 'epics', 'tasks', 'events', 'schedule', 'group_messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can only access their own %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Team access for %I" ON public.%I FOR ALL USING (auth.uid() = user_id OR team_id = get_my_team_id());', t, t);
  END LOOP;
END $$;

-- Explicit File Policies (Private vs Team)
DROP POLICY IF EXISTS "Team access for files" ON public.files;
CREATE POLICY "Private files access" ON public.files FOR ALL USING (team_id IS NULL AND auth.uid() = user_id);
CREATE POLICY "Team files access" ON public.files FOR ALL USING (team_id IS NOT NULL AND team_id = get_my_team_id());

-- Explicit Memory Policies (Private vs Team)
DROP POLICY IF EXISTS "Team access for memory_nodes" ON public.memory_nodes;
CREATE POLICY "Private memory nodes" ON public.memory_nodes FOR ALL USING (team_id IS NULL AND auth.uid() = user_id);
CREATE POLICY "Team memory nodes" ON public.memory_nodes FOR ALL USING (team_id IS NOT NULL AND team_id = get_my_team_id());

DROP POLICY IF EXISTS "Team access for memory_links" ON public.memory_links;
CREATE POLICY "Private memory links" ON public.memory_links FOR ALL USING (team_id IS NULL AND auth.uid() = user_id);
CREATE POLICY "Team memory links" ON public.memory_links FOR ALL USING (team_id IS NOT NULL AND team_id = get_my_team_id());

-- Team Membership Policies
CREATE POLICY "Users can see their team members" ON public.team_members FOR SELECT USING (team_id = get_my_team_id());
CREATE POLICY "Anyone can use an invite code" ON public.invites FOR SELECT USING (true);
CREATE POLICY "Users can see their team" ON public.teams FOR SELECT USING (id = get_my_team_id());

-- 4. Team Size Limit Trigger
CREATE OR REPLACE FUNCTION check_team_size()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT count(*) FROM public.team_members WHERE team_id = NEW.team_id) >= 20 THEN
        RAISE EXCEPTION 'Team limit reached (max 20 members)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_team_size
BEFORE INSERT ON public.team_members

-- 5. User Profiles & AI Usage (New Additions)

-- User Profiles (Extension of auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier TEXT DEFAULT 'free', check (subscription_tier in ('free', 'pro')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Tracking
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Policies for User Profiles
CREATE POLICY "Users can view receive their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policies for AI Usage (Read-only for users, Backend writes)
CREATE POLICY "Users can view their own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Note: Insert/Update on ai_usage should be done by the backend with service_role key
