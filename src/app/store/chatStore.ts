// store/chatStore.ts
import { create } from "zustand";

interface Message {
  id?: number;
  role: "user" | "ai";
  content: string;
  created_at?: string;
}

interface Chat {
  id: number;
  title: string;
  created_at: string;
  last_message?: string;
  last_message_time?: string;
}

interface ChatState {
  messages: Message[];
  chats: Chat[];
  currentChatId: number | null;
  isLoading: boolean;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (role: "user" | "ai", content: string) => void;
  setChats: (chats: Chat[]) => void;
  setCurrentChatId: (chatId: number | null) => void;
  setLoading: (loading: boolean) => void;
  
  // API Actions
  createNewChat: (title?: string) => Promise<number | null>;
  loadMessages: (chatId: number) => Promise<void>;
  loadChats: () => Promise<void>;
  sendMessage: (message: string, chatId: number, educationLevel: string, googleAccessToken?: string | null ) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  chats: [],
  currentChatId: null,
  isLoading: false,

  setMessages: (messages) => set({ messages }),
  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { role, content, created_at: new Date().toISOString() },
      ],
    })),
  setChats: (chats) => set({ chats }),
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
  setLoading: (loading) => set({ isLoading: loading }),

  createNewChat: async (title = 'Chat Baru') => {
    try {
      const res = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      
      const data = await res.json();
      if (res.ok) {
        // Reload chats setelah membuat chat baru
        await get().loadChats();
        return data.chatId;
      }
      return null;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  },

  loadMessages: async (chatId: number) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`);
      const data = await res.json();
      
      if (res.ok) {
        // Transform data dari database ke format yang digunakan di UI
        const messages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
        }));
        set({ messages, currentChatId: chatId });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadChats: async () => {
    try {
      const res = await fetch('/api/chat/list');
      const data = await res.json();
      
      if (res.ok) {
        set({ chats: data.chats });
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  },

  sendMessage: async (message: string, chatId: number, educationLevel: string, googleAccessToken?: string | null) => {
    // Tambahkan pesan user ke UI secara optimistic
    get().addMessage('user', message);
    
    try {
      const res = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, chatId, educationLevel, googleAccessToken}),
      });

      const data = await res.json();
      
      if (res.ok) {
        // Tambahkan response AI ke UI
        get().addMessage('ai', data.reply);
        // Reload chats untuk update last message
        await get().loadChats();
      } else {
        get().addMessage('ai', 'Terjadi kesalahan saat menghubungi AI.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      get().addMessage('ai', 'Terjadi kesalahan saat menghubungi AI.');
    }
  },
}));