
import { GroupMessage } from '../types';

export const initialGroupMessages: GroupMessage[] = [
  { id: '1', userId: 'user-2', userName: 'Alice', content: 'Hey team, how is the MVP coming along?', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
  { id: '2', userId: 'user-3', userName: 'Bob', content: 'Just finished the database schema.', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '3', userId: 'user-4', userName: 'Charlie', content: 'Great! I will start the API endpoints.', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
];

class GroupChatService {
  private messages: GroupMessage[] = [...initialGroupMessages];
  private listeners: ((messages: GroupMessage[]) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startSimulation();
  }

  private startSimulation() {
    // Simulate incoming messages every 15-45 seconds
    this.intervalId = setInterval(() => {
      if (Math.random() > 0.6) {
        this.receiveMockMessage();
      }
    }, 15000);
  }

  subscribe(listener: (messages: GroupMessage[]) => void) {
    this.listeners.push(listener);
    listener(this.messages);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    // Return copy to avoid mutation
    const sorted = [...this.messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    this.listeners.forEach(l => l(sorted));
  }

  async sendMessage(text: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newMessage: GroupMessage = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Me',
      content: text,
      timestamp: new Date()
    };
    
    this.messages.push(newMessage);
    this.notify();
  }

  private receiveMockMessage() {
    const users = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'];
    const texts = [
      'Looks good!',
      'Did you push the changes?',
      'I need help with the API.',
      'Deployment is scheduled for Friday.',
      'Coffee break?',
      'Check the new designs.',
      'The server seems slow today.',
      'Code review pending.',
      'Nice work on the terrain view!'
    ];
    
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    
    const msg: GroupMessage = {
      id: Date.now().toString(),
      userId: `user-${randomUser}`,
      userName: randomUser,
      content: randomText,
      timestamp: new Date()
    };
    
    this.messages.push(msg);
    this.notify();
  }
}

export const groupChatService = new GroupChatService();
