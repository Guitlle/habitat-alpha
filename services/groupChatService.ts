import { supabase } from './supabase';
import { GroupMessage } from '../types';

class GroupChatService {
  private listeners: ((messages: GroupMessage[]) => void)[] = [];
  private messages: GroupMessage[] = [];
  private channel: any = null;
  private teamId: string | null = null;

  /**
   * Initializes the service for a specific team
   */
  async setTeam(teamId: string) {
    if (this.teamId === teamId) return;
    this.teamId = teamId;

    // Clean up old subscription
    if (this.channel) {
      this.channel.unsubscribe();
    }

    // 1. Fetch History
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('timestamp', { ascending: true })
      .limit(100);

    if (!error && data) {
      this.messages = data.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      this.notify();
    }

    // 2. Subscribe to new messages
    this.channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `team_id=eq.${teamId}`
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            timestamp: new Date(payload.new.timestamp)
          } as GroupMessage;

          // Add if not already present (optimization/safety)
          if (!this.messages.find(m => m.id === newMessage.id)) {
            this.messages = [...this.messages, newMessage];
            this.notify();
          }
        }
      )
      .subscribe();
  }

  subscribe(listener: (messages: GroupMessage[]) => void) {
    this.listeners.push(listener);
    listener(this.messages);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.messages]));
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.teamId) throw new Error('No team selected');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('group_messages')
      .insert({
        team_id: this.teamId,
        user_id: user.id,
        content: text,
        userName: user.email?.split('@')[0] || 'User' // Default name from email
      });

    if (error) throw error;
  }
}

export const groupChatService = new GroupChatService();
