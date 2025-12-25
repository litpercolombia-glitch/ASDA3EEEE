// /src/core/chats/index.ts
// Exportaciones del módulo de chats

export {
  CHAT_CONFIGS,
  getOrCreateThread,
  addMessageToThread,
  prepareMessagesForLLM,
  inferChatType,
  generateChatContext,
  cleanupOldThreads,
  getThreadStats,
} from './chatRouter';

export type {
  ChatType,
  ChatMessage,
  ChatThread,
  ChatConfig,
} from './chatRouter';
