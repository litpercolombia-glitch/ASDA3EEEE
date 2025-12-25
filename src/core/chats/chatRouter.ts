// /src/core/chats/chatRouter.ts
// Router para separar threads y formatos de respuesta entre chats

import opsSystemPrompt from './prompts/ops.system.md?raw';
import strategySystemPrompt from './prompts/strategy.system.md?raw';
import mainSystemPrompt from './prompts/main.system.md?raw';

/**
 * Tipos de chat disponibles
 */
export type ChatType = 'ops' | 'strategy' | 'main';

/**
 * Mensaje del chat
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Thread de conversación
 */
export interface ChatThread {
  id: string;
  type: ChatType;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  context?: Record<string, unknown>;
}

/**
 * Configuración de cada tipo de chat
 */
export interface ChatConfig {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  model: string;
  contextWindow: number;
}

/**
 * Configuraciones por tipo de chat
 */
export const CHAT_CONFIGS: Record<ChatType, ChatConfig> = {
  main: {
    systemPrompt: mainSystemPrompt,
    maxTokens: 2048,
    temperature: 0.4, // Balance entre precisión y creatividad
    model: 'claude-sonnet-4-20250514', // Modelo potente para análisis integral
    contextWindow: 15, // Contexto amplio para consultas complejas
  },
  ops: {
    systemPrompt: opsSystemPrompt,
    maxTokens: 1024,
    temperature: 0.3, // Más determinístico para operaciones
    model: 'claude-3-5-haiku-20241022', // Rápido para operaciones
    contextWindow: 10, // Últimos 10 mensajes
  },
  strategy: {
    systemPrompt: strategySystemPrompt,
    maxTokens: 2048,
    temperature: 0.5, // Más creativo para análisis
    model: 'claude-sonnet-4-20250514', // Más potente para análisis
    contextWindow: 20, // Más contexto para análisis
  },
};

/**
 * Store en memoria para threads (TODO: persistir en DB)
 */
const threadStore = new Map<string, ChatThread>();

/**
 * Obtiene o crea un thread de chat
 */
export function getOrCreateThread(
  threadId: string,
  chatType: ChatType
): ChatThread {
  const existing = threadStore.get(threadId);

  if (existing) {
    return existing;
  }

  const newThread: ChatThread = {
    id: threadId,
    type: chatType,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  threadStore.set(threadId, newThread);
  return newThread;
}

/**
 * Agrega un mensaje a un thread
 */
export function addMessageToThread(
  threadId: string,
  message: Omit<ChatMessage, 'timestamp'>
): ChatThread {
  const thread = threadStore.get(threadId);
  if (!thread) {
    throw new Error(`Thread ${threadId} not found`);
  }

  thread.messages.push({
    ...message,
    timestamp: new Date().toISOString(),
  });
  thread.updatedAt = new Date().toISOString();

  return thread;
}

/**
 * Prepara mensajes para enviar al LLM
 * Incluye system prompt y últimos N mensajes del contexto
 */
export function prepareMessagesForLLM(
  thread: ChatThread,
  additionalContext?: string
): ChatMessage[] {
  const config = CHAT_CONFIGS[thread.type];
  const messages: ChatMessage[] = [];

  // 1. System prompt
  let systemContent = config.systemPrompt;
  if (additionalContext) {
    systemContent += `\n\n## Contexto Adicional\n${additionalContext}`;
  }

  messages.push({
    role: 'system',
    content: systemContent,
  });

  // 2. Últimos N mensajes del thread
  const recentMessages = thread.messages.slice(-config.contextWindow);
  messages.push(...recentMessages);

  return messages;
}

/**
 * Determina el tipo de chat basado en la pregunta
 * Útil para routing automático
 */
export function inferChatType(userMessage: string): ChatType {
  const message = userMessage.toLowerCase();

  // Palabras clave operativas
  const opsKeywords = [
    'guía', 'guia', 'envío', 'envio', 'tracking',
    'estado', 'dónde', 'donde', 'novedad', 'problema',
    'cliente', 'llamar', 'contactar', 'urgente',
    'devolución', 'devolucion', 'rechazo', 'rechazado',
    'perdido', 'siniestro', 'transportadora',
  ];

  // Palabras clave estratégicas
  const strategyKeywords = [
    'reporte', 'análisis', 'analisis', 'métricas', 'metricas',
    'kpi', 'tendencia', 'comparar', 'benchmark', 'performance',
    'rendimiento', 'costo', 'optimizar', 'proyección', 'proyeccion',
    'decisión', 'decision', 'estrategia', 'mes', 'semana',
    'promedio', 'tasa', 'porcentaje', '%',
  ];

  const opsScore = opsKeywords.filter(k => message.includes(k)).length;
  const strategyScore = strategyKeywords.filter(k => message.includes(k)).length;

  // Default a OPS si hay empate o ambiguo
  return strategyScore > opsScore ? 'strategy' : 'ops';
}

/**
 * Genera contexto relevante basado en el tipo de chat
 */
export async function generateChatContext(
  chatType: ChatType,
  threadId: string
): Promise<string> {
  // TODO: Implementar generación de contexto real
  // - Para OPS: últimas alertas, órdenes con problemas
  // - Para STRATEGY: métricas del período, tendencias

  const now = new Date();
  const contextParts: string[] = [];

  contextParts.push(`Fecha/Hora: ${now.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
  contextParts.push(`Thread ID: ${threadId}`);

  if (chatType === 'ops') {
    // TODO: Agregar datos operativos reales
    contextParts.push(`Alertas activas: 3`);
    contextParts.push(`Órdenes con novedad: 12`);
  } else {
    // TODO: Agregar datos estratégicos reales
    contextParts.push(`Período: Este mes`);
    contextParts.push(`Total órdenes: 1,247`);
  }

  return contextParts.join('\n');
}

/**
 * Limpia threads antiguos (para evitar memory leaks)
 */
export function cleanupOldThreads(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, thread] of threadStore.entries()) {
    const age = now - new Date(thread.updatedAt).getTime();
    if (age > maxAgeMs) {
      threadStore.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Obtiene estadísticas de threads (para monitoreo)
 */
export function getThreadStats(): {
  total: number;
  byType: Record<ChatType, number>;
  avgMessages: number;
} {
  const stats = {
    total: threadStore.size,
    byType: { main: 0, ops: 0, strategy: 0 } as Record<ChatType, number>,
    avgMessages: 0,
  };

  let totalMessages = 0;
  for (const thread of threadStore.values()) {
    stats.byType[thread.type]++;
    totalMessages += thread.messages.length;
  }

  stats.avgMessages = stats.total > 0 ? totalMessages / stats.total : 0;

  return stats;
}
