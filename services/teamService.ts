import { supabase } from './supabase';

export interface Team {
    id: string;
    name: string;
    created_at: string;
}

export interface TeamMember {
    team_id: string;
    user_id: string;
    role: 'admin' | 'member';
    user_email?: string;
}

export const teamService = {
    /**
     * Gets the current user's team membership
     */
    getMyTeam: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('team_members')
            .select('team_id, teams(*)')
            .eq('user_id', user.id)
            .single();

        if (error || !data) return null;
        return data.teams as unknown as Team;
    },

    /**
     * Creates a new team and adds the creator as admin
     */
    createTeam: async (name: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Create Team
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({ name })
            .select()
            .single();

        if (teamError) throw teamError;

        // 2. Add as member
        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: team.id,
                user_id: user.id,
                role: 'admin'
            });

        if (memberError) throw memberError;

        return team as Team;
    },

    /**
     * Generates a unique invitation code for the team
     */
    createInvite: async (teamId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const code = Math.random().toString(36).substring(2, 10).toUpperCase();

        const { data, error } = await supabase
            .from('invites')
            .insert({
                team_id: teamId,
                code,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data.code;
    },

    /**
     * Joins a team using an invite code
     */
    joinWithCode: async (code: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Find invite
        const { data: invite, error: inviteError } = await supabase
            .from('invites')
            .select('team_id')
            .eq('code', code)
            .single();

        if (inviteError || !invite) throw new Error('Invalid or expired invitation link');

        // 2. Add member
        const { error: joinError } = await supabase
            .from('team_members')
            .insert({
                team_id: invite.team_id,
                user_id: user.id,
                role: 'member'
            });

        if (joinError) {
            if (joinError.message.includes('Team limit reached')) {
                throw new Error('This team is full (max 20 members)');
            }
            throw joinError;
        }

        return invite.team_id;
    },

    /**
     * Gets all members of a team
     */
    getTeamMembers: async (teamId: string) => {
        const { data, error } = await supabase
            .from('team_members')
            .select('role, user_id')
            .eq('team_id', teamId);

        if (error) throw error;
        return data as TeamMember[];
    }
};
