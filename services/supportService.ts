// services/supportService.ts
// Sistema de Soporte al Cliente para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export type TicketStatus = 'abierto' | 'en_progreso' | 'esperando_cliente' | 'resuelto' | 'cerrado';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketCategory = 'pedido' | 'producto' | 'envio' | 'devolucion' | 'pago' | 'otro';

export interface Ticket {
  id: string;
  numero: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  asunto: string;
  descripcion: string;
  categoria: TicketCategory;
  prioridad: TicketPriority;
  estado: TicketStatus;
  pedidoRelacionado?: string;
  asignadoA?: string;
  mensajes: TicketMessage[];
  tags: string[];
  satisfaccion?: number;
  tiempoRespuesta?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TicketMessage {
  id: string;
  tipo: 'cliente' | 'agente' | 'sistema';
  contenido: string;
  adjuntos?: string[];
  creadoPor: string;
  createdAt: string;
}

export interface QuickResponse {
  id: string;
  nombre: string;
  categoria: TicketCategory;
  contenido: string;
  variables: string[];
  atajos: string[];
  usageCount: number;
  isActive: boolean;
}

export interface ChatbotFlow {
  id: string;
  nombre: string;
  descripcion: string;
  preguntaInicial: string;
  opciones: ChatbotOption[];
  isActive: boolean;
}

export interface ChatbotOption {
  id: string;
  texto: string;
  flujo: string;
  acciones: ChatbotAction[];
}

export interface ChatbotAction {
  tipo: 'responder' | 'buscar_pedido' | 'crear_ticket' | 'transferir_agente';
  config: Record<string, any>;
}

// ============================================
// DATOS POR DEFECTO
// ============================================

const DEFAULT_QUICK_RESPONSES: QuickResponse[] = [
  {
    id: 'qr-estado',
    nombre: 'Estado de Pedido',
    categoria: 'pedido',
    contenido: 'Hola {{nombre}}, tu pedido #{{numero}} está en estado: {{estado}}.\n\n📍 {{ubicacion}}\n📅 Fecha estimada: {{fecha_estimada}}\n\n¿Necesitas algo más?',
    variables: ['nombre', 'numero', 'estado', 'ubicacion', 'fecha_estimada'],
    atajos: ['/estado', '/tracking'],
    usageCount: 234,
    isActive: true,
  },
  {
    id: 'qr-devolucion',
    nombre: 'Proceso de Devolución',
    categoria: 'devolucion',
    contenido: 'Entiendo que deseas hacer una devolución. El proceso es:\n\n1️⃣ Empaca el producto en su empaque original\n2️⃣ Programa la recolección o llévalo a {{punto_envio}}\n3️⃣ El reembolso se procesa en 3-5 días hábiles\n\n¿Te ayudo a iniciar el proceso?',
    variables: ['punto_envio'],
    atajos: ['/devolucion', '/return'],
    usageCount: 89,
    isActive: true,
  },
  {
    id: 'qr-disculpa',
    nombre: 'Disculpa por Inconveniente',
    categoria: 'otro',
    contenido: 'Lamentamos mucho los inconvenientes causados, {{nombre}}. 😔\n\nEntendemos tu frustración y queremos compensarte. {{compensacion}}\n\n¿Hay algo más en lo que pueda ayudarte?',
    variables: ['nombre', 'compensacion'],
    atajos: ['/disculpa', '/sorry'],
    usageCount: 56,
    isActive: true,
  },
];

const DEFAULT_CHATBOT: ChatbotFlow = {
  id: 'chatbot-main',
  nombre: 'Chatbot Principal',
  descripcion: 'Flujo principal de atención automática',
  preguntaInicial: '¡Hola! 👋 Soy el asistente virtual de LITPER PRO.\n\n¿En qué puedo ayudarte hoy?',
  opciones: [
    { id: 'opt-1', texto: '📦 Estado de mi pedido', flujo: 'tracking', acciones: [{ tipo: 'buscar_pedido', config: {} }] },
    { id: 'opt-2', texto: '🔙 Hacer una devolución', flujo: 'devolucion', acciones: [{ tipo: 'crear_ticket', config: { categoria: 'devolucion' } }] },
    { id: 'opt-3', texto: '❓ Tengo una pregunta', flujo: 'pregunta', acciones: [{ tipo: 'responder', config: { mensaje: '¿Cuál es tu pregunta?' } }] },
    { id: 'opt-4', texto: '💬 Hablar con un agente', flujo: 'agente', acciones: [{ tipo: 'transferir_agente', config: {} }] },
  ],
  isActive: true,
};

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'tick-001',
    numero: 'TK-2024-0001',
    customerId: 'cust-001',
    customerName: 'María García',
    customerPhone: '3001234567',
    customerEmail: 'maria@email.com',
    asunto: 'Mi pedido no ha llegado',
    descripcion: 'Hice un pedido hace 5 días y aún no me llega. El tracking dice que está en tránsito.',
    categoria: 'envio',
    prioridad: 'alta',
    estado: 'abierto',
    pedidoRelacionado: 'LIT-2024-0001',
    mensajes: [
      { id: 'msg-1', tipo: 'cliente', contenido: 'Mi pedido no ha llegado', creadoPor: 'María García', createdAt: new Date().toISOString() }
    ],
    tags: ['urgente', 'envio-retrasado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// STORE
// ============================================

interface SupportState {
  tickets: Ticket[];
  quickResponses: QuickResponse[];
  chatbotFlows: ChatbotFlow[];

  // Tickets
  addTicket: (ticket: Omit<Ticket, 'id' | 'numero' | 'createdAt' | 'updatedAt' | 'mensajes'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  addMessage: (ticketId: string, message: Omit<TicketMessage, 'id' | 'createdAt'>) => void;
  changeStatus: (ticketId: string, status: TicketStatus) => void;

  // Quick Responses
  addQuickResponse: (response: Omit<QuickResponse, 'id' | 'usageCount'>) => void;
  updateQuickResponse: (id: string, updates: Partial<QuickResponse>) => void;
  deleteQuickResponse: (id: string) => void;

  // Chatbot
  updateChatbot: (id: string, updates: Partial<ChatbotFlow>) => void;

  // Queries
  getOpenTickets: () => Ticket[];
  getTicketsByCategory: (category: TicketCategory) => Ticket[];
  getTicketsByPriority: (priority: TicketPriority) => Ticket[];
  searchTickets: (query: string) => Ticket[];

  // Stats
  getStats: () => { total: number; abiertos: number; resueltos: number; tiempoPromedioRespuesta: number };
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
let ticketCounter = 1;

export const useSupportStore = create<SupportState>()(
  persist(
    (set, get) => ({
      tickets: SAMPLE_TICKETS,
      quickResponses: DEFAULT_QUICK_RESPONSES,
      chatbotFlows: [DEFAULT_CHATBOT],

      addTicket: (ticket) => {
        const newTicket: Ticket = {
          ...ticket,
          id: generateId(),
          numero: `TK-${new Date().getFullYear()}-${String(ticketCounter++).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mensajes: [],
        };
        set((state) => ({ tickets: [newTicket, ...state.tickets] }));
      },

      updateTicket: (id, updates) => {
        set((state) => ({
          tickets: state.tickets.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
        }));
      },

      addMessage: (ticketId, message) => {
        const newMessage: TicketMessage = { ...message, id: generateId(), createdAt: new Date().toISOString() };
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, mensajes: [...t.mensajes, newMessage], updatedAt: new Date().toISOString() } : t
          )
        }));
      },

      changeStatus: (ticketId, status) => {
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? {
              ...t,
              estado: status,
              updatedAt: new Date().toISOString(),
              ...(status === 'resuelto' ? { resolvedAt: new Date().toISOString() } : {})
            } : t
          )
        }));
      },

      addQuickResponse: (response) => {
        const newResponse: QuickResponse = { ...response, id: generateId(), usageCount: 0 };
        set((state) => ({ quickResponses: [...state.quickResponses, newResponse] }));
      },

      updateQuickResponse: (id, updates) => {
        set((state) => ({ quickResponses: state.quickResponses.map((r) => r.id === id ? { ...r, ...updates } : r) }));
      },

      deleteQuickResponse: (id) => {
        set((state) => ({ quickResponses: state.quickResponses.filter((r) => r.id !== id) }));
      },

      updateChatbot: (id, updates) => {
        set((state) => ({ chatbotFlows: state.chatbotFlows.map((f) => f.id === id ? { ...f, ...updates } : f) }));
      },

      getOpenTickets: () => get().tickets.filter((t) => ['abierto', 'en_progreso'].includes(t.estado)),
      getTicketsByCategory: (category) => get().tickets.filter((t) => t.categoria === category),
      getTicketsByPriority: (priority) => get().tickets.filter((t) => t.prioridad === priority),
      searchTickets: (query) => {
        const q = query.toLowerCase();
        return get().tickets.filter((t) =>
          t.numero.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.asunto.toLowerCase().includes(q)
        );
      },

      getStats: () => {
        const tickets = get().tickets;
        const resueltos = tickets.filter(t => t.estado === 'resuelto' || t.estado === 'cerrado');
        return {
          total: tickets.length,
          abiertos: tickets.filter(t => t.estado === 'abierto').length,
          resueltos: resueltos.length,
          tiempoPromedioRespuesta: 2.5, // horas (simulado)
        };
      },
    }),
    { name: 'litper-support-store' }
  )
);

export function useSupport() {
  const store = useSupportStore();
  const stats = store.getStats();
  const openTickets = store.getOpenTickets();
  return { ...store, stats, openTickets };
}

export default useSupportStore;
