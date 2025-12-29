/**
 * ChatPersistence - Servicio de persistencia de conversaciones
 * Guarda y carga conversaciones en Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'error';
  skillId?: string;
  skillParams?: Record<string, any>;
  artifact?: any;
  suggestedActions?: any[];
  error?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  metadata?: {
    skillsUsed?: string[];
    messageCount?: number;
    lastSkill?: string;
  };
}

export interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  updatedAt: Date;
}

// ============================================
// SUPABASE CONFIG
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient | null => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[ChatPersistence] Supabase no configurado, usando localStorage');
    return null;
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabase;
};

// ============================================
// LOCAL STORAGE FALLBACK
// ============================================

const LOCAL_STORAGE_KEY = 'litper_admin_v2_conversations';

const getLocalConversations = (): ChatConversation[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];

    const conversations = JSON.parse(data);
    return conversations.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch (error) {
    console.error('[ChatPersistence] Error reading localStorage:', error);
    return [];
  }
};

const saveLocalConversations = (conversations: ChatConversation[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('[ChatPersistence] Error saving to localStorage:', error);
  }
};

// ============================================
// CHAT PERSISTENCE SERVICE
// ============================================

class ChatPersistenceService {
  private userId: string = 'default';
  private currentConversationId: string | null = null;

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }

  // ========================================
  // CREATE CONVERSATION
  // ========================================

  async createConversation(title?: string): Promise<ChatConversation> {
    const id = crypto.randomUUID();
    const now = new Date();

    const conversation: ChatConversation = {
      id,
      title: title || 'Nueva conversacion',
      userId: this.userId,
      createdAt: now,
      updatedAt: now,
      messages: [],
      metadata: {
        skillsUsed: [],
        messageCount: 0,
      },
    };

    const client = getSupabase();

    if (client) {
      try {
        const { error } = await client
          .from('admin_conversations')
          .insert({
            id: conversation.id,
            title: conversation.title,
            user_id: conversation.userId,
            messages: [],
            metadata: conversation.metadata,
            created_at: conversation.createdAt.toISOString(),
            updated_at: conversation.updatedAt.toISOString(),
          });

        if (error) {
          console.error('[ChatPersistence] Supabase error:', error);
          // Fall back to localStorage
          const localConvos = getLocalConversations();
          localConvos.unshift(conversation);
          saveLocalConversations(localConvos);
        }
      } catch (err) {
        console.error('[ChatPersistence] Network error:', err);
        const localConvos = getLocalConversations();
        localConvos.unshift(conversation);
        saveLocalConversations(localConvos);
      }
    } else {
      const localConvos = getLocalConversations();
      localConvos.unshift(conversation);
      saveLocalConversations(localConvos);
    }

    this.currentConversationId = id;
    return conversation;
  }

  // ========================================
  // SAVE MESSAGE
  // ========================================

  async saveMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<void> {
    const client = getSupabase();

    if (client) {
      try {
        // Get current conversation
        const { data, error: fetchError } = await client
          .from('admin_conversations')
          .select('messages, metadata')
          .eq('id', conversationId)
          .single();

        if (fetchError) {
          console.error('[ChatPersistence] Fetch error:', fetchError);
          this.saveMessageLocal(conversationId, message);
          return;
        }

        const messages = [...(data.messages || []), {
          ...message,
          timestamp: message.timestamp.toISOString(),
        }];

        const metadata = {
          ...data.metadata,
          messageCount: messages.length,
          lastSkill: message.skillId || data.metadata?.lastSkill,
          skillsUsed: message.skillId
            ? [...new Set([...(data.metadata?.skillsUsed || []), message.skillId])]
            : data.metadata?.skillsUsed,
        };

        // Update conversation
        const { error: updateError } = await client
          .from('admin_conversations')
          .update({
            messages,
            metadata,
            updated_at: new Date().toISOString(),
            title: this.generateTitle(messages),
          })
          .eq('id', conversationId);

        if (updateError) {
          console.error('[ChatPersistence] Update error:', updateError);
          this.saveMessageLocal(conversationId, message);
        }
      } catch (err) {
        console.error('[ChatPersistence] Network error:', err);
        this.saveMessageLocal(conversationId, message);
      }
    } else {
      this.saveMessageLocal(conversationId, message);
    }
  }

  private saveMessageLocal(conversationId: string, message: ChatMessage): void {
    const convos = getLocalConversations();
    const idx = convos.findIndex((c) => c.id === conversationId);

    if (idx >= 0) {
      convos[idx].messages.push(message);
      convos[idx].updatedAt = new Date();
      convos[idx].title = this.generateTitle(convos[idx].messages);

      if (!convos[idx].metadata) {
        convos[idx].metadata = {};
      }
      convos[idx].metadata!.messageCount = convos[idx].messages.length;

      if (message.skillId) {
        convos[idx].metadata!.lastSkill = message.skillId;
        convos[idx].metadata!.skillsUsed = [
          ...new Set([...(convos[idx].metadata!.skillsUsed || []), message.skillId]),
        ];
      }

      saveLocalConversations(convos);
    }
  }

  // ========================================
  // GET CONVERSATIONS
  // ========================================

  async getConversations(limit: number = 20): Promise<ConversationSummary[]> {
    const client = getSupabase();

    if (client) {
      try {
        const { data, error } = await client
          .from('admin_conversations')
          .select('id, title, messages, updated_at')
          .eq('user_id', this.userId)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('[ChatPersistence] Fetch error:', error);
          return this.getLocalSummaries(limit);
        }

        return data.map((c: any) => ({
          id: c.id,
          title: c.title,
          preview: this.getPreview(c.messages),
          messageCount: c.messages?.length || 0,
          updatedAt: new Date(c.updated_at),
        }));
      } catch (err) {
        console.error('[ChatPersistence] Network error:', err);
        return this.getLocalSummaries(limit);
      }
    }

    return this.getLocalSummaries(limit);
  }

  private getLocalSummaries(limit: number): ConversationSummary[] {
    const convos = getLocalConversations();
    return convos
      .filter((c) => c.userId === this.userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title,
        preview: this.getPreview(c.messages),
        messageCount: c.messages.length,
        updatedAt: c.updatedAt,
      }));
  }

  // ========================================
  // GET CONVERSATION BY ID
  // ========================================

  async getConversation(id: string): Promise<ChatConversation | null> {
    const client = getSupabase();

    if (client) {
      try {
        const { data, error } = await client
          .from('admin_conversations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('[ChatPersistence] Fetch error:', error);
          return this.getLocalConversation(id);
        }

        this.currentConversationId = id;

        return {
          id: data.id,
          title: data.title,
          userId: data.user_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          messages: (data.messages || []).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
          metadata: data.metadata,
        };
      } catch (err) {
        console.error('[ChatPersistence] Network error:', err);
        return this.getLocalConversation(id);
      }
    }

    return this.getLocalConversation(id);
  }

  private getLocalConversation(id: string): ChatConversation | null {
    const convos = getLocalConversations();
    const convo = convos.find((c) => c.id === id);

    if (convo) {
      this.currentConversationId = id;
    }

    return convo || null;
  }

  // ========================================
  // DELETE CONVERSATION
  // ========================================

  async deleteConversation(id: string): Promise<boolean> {
    const client = getSupabase();

    if (client) {
      try {
        const { error } = await client
          .from('admin_conversations')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('[ChatPersistence] Delete error:', error);
          return this.deleteLocalConversation(id);
        }

        if (this.currentConversationId === id) {
          this.currentConversationId = null;
        }

        return true;
      } catch (err) {
        console.error('[ChatPersistence] Network error:', err);
        return this.deleteLocalConversation(id);
      }
    }

    return this.deleteLocalConversation(id);
  }

  private deleteLocalConversation(id: string): boolean {
    const convos = getLocalConversations();
    const filtered = convos.filter((c) => c.id !== id);

    if (filtered.length < convos.length) {
      saveLocalConversations(filtered);

      if (this.currentConversationId === id) {
        this.currentConversationId = null;
      }

      return true;
    }

    return false;
  }

  // ========================================
  // UTILITIES
  // ========================================

  private generateTitle(messages: any[]): string {
    if (!messages || messages.length === 0) {
      return 'Nueva conversacion';
    }

    // Find first user message
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      const content = firstUserMsg.content;
      // Truncate and clean
      const title = content.slice(0, 50).trim();
      return title + (content.length > 50 ? '...' : '');
    }

    return 'Conversacion';
  }

  private getPreview(messages: any[]): string {
    if (!messages || messages.length === 0) {
      return 'Sin mensajes';
    }

    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      const content = lastMsg.content;
      return content.slice(0, 80).trim() + (content.length > 80 ? '...' : '');
    }

    return '';
  }

  // ========================================
  // CLEAR ALL (for testing)
  // ========================================

  async clearAll(): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    this.currentConversationId = null;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const chatPersistence = new ChatPersistenceService();

export default chatPersistence;
