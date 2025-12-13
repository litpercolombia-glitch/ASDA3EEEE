// services/ordersService.ts
// Sistema de Gestión de Pedidos para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'enviado'
  | 'en_transito'
  | 'en_ciudad_destino'
  | 'en_reparto'
  | 'entregado'
  | 'devolucion'
  | 'cancelado'
  | 'reembolsado';

export interface Order {
  id: string;
  numeroOrden: string;
  // Cliente
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  // Dirección
  direccion: string;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  instrucciones: string;
  // Productos
  productos: OrderProduct[];
  // Valores
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  metodoPago: 'contraentrega' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata';
  // Estado
  estado: OrderStatus;
  estadoAnterior: OrderStatus | null;
  // Tracking
  guia: string;
  transportadora: string;
  // Tiempos
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  // Metadata
  canalVenta: string;
  campana: string;
  notas: OrderNote[];
  timeline: OrderTimelineEvent[];
  // Flags
  isPriority: boolean;
  hasIssue: boolean;
  issueType: string | null;
}

export interface OrderProduct {
  id: string;
  nombre: string;
  sku: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  imagen: string;
}

export interface OrderNote {
  id: string;
  contenido: string;
  tipo: 'interna' | 'cliente' | 'transportadora';
  creadoPor: string;
  createdAt: string;
}

export interface OrderTimelineEvent {
  id: string;
  estado: OrderStatus;
  descripcion: string;
  fecha: string;
  ubicacion?: string;
  automatico: boolean;
}

export interface OrderStatusConfig {
  id: OrderStatus;
  nombre: string;
  color: string;
  icono: string;
  orden: number;
  notificarCliente: boolean;
  mensajeCliente: string;
  siguientesEstados: OrderStatus[];
  tiempoMaximo: number | null; // horas
}

export interface OrderAutomation {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: {
    tipo: 'estado_cambia' | 'tiempo_en_estado' | 'condicion';
    valor: any;
  };
  condiciones: AutomationCondition[];
  acciones: AutomationAction[];
  isActive: boolean;
  createdAt: string;
}

export interface AutomationCondition {
  campo: string;
  operador: 'igual' | 'diferente' | 'mayor' | 'menor' | 'contiene';
  valor: any;
}

export interface AutomationAction {
  tipo: 'cambiar_estado' | 'enviar_mensaje' | 'agregar_nota' | 'notificar_admin' | 'crear_alerta';
  config: Record<string, any>;
}

export interface MessageTemplate {
  id: string;
  nombre: string;
  estado: OrderStatus;
  canal: 'whatsapp' | 'email' | 'sms';
  mensaje: string;
  variables: string[];
  isActive: boolean;
}

// ============================================
// CONFIGURACIÓN DE ESTADOS
// ============================================

export const ORDER_STATUS_CONFIG: OrderStatusConfig[] = [
  {
    id: 'pendiente',
    nombre: 'Pendiente',
    color: '#6B7280',
    icono: 'Clock',
    orden: 1,
    notificarCliente: false,
    mensajeCliente: '',
    siguientesEstados: ['confirmado', 'cancelado'],
    tiempoMaximo: 24,
  },
  {
    id: 'confirmado',
    nombre: 'Confirmado',
    color: '#3B82F6',
    icono: 'CheckCircle',
    orden: 2,
    notificarCliente: true,
    mensajeCliente: '¡Hola {{nombre}}! Tu pedido #{{numero}} ha sido confirmado ✅',
    siguientesEstados: ['en_preparacion', 'cancelado'],
    tiempoMaximo: 12,
  },
  {
    id: 'en_preparacion',
    nombre: 'En Preparación',
    color: '#8B5CF6',
    icono: 'Package',
    orden: 3,
    notificarCliente: false,
    mensajeCliente: '',
    siguientesEstados: ['enviado', 'cancelado'],
    tiempoMaximo: 24,
  },
  {
    id: 'enviado',
    nombre: 'Enviado',
    color: '#F59E0B',
    icono: 'Truck',
    orden: 4,
    notificarCliente: true,
    mensajeCliente: '🚚 ¡Tu pedido #{{numero}} ya va en camino!\n\nGuía: {{guia}}\nTransportadora: {{transportadora}}',
    siguientesEstados: ['en_transito', 'devolucion'],
    tiempoMaximo: null,
  },
  {
    id: 'en_transito',
    nombre: 'En Tránsito',
    color: '#F97316',
    icono: 'Navigation',
    orden: 5,
    notificarCliente: false,
    mensajeCliente: '',
    siguientesEstados: ['en_ciudad_destino', 'devolucion'],
    tiempoMaximo: null,
  },
  {
    id: 'en_ciudad_destino',
    nombre: 'En Ciudad Destino',
    color: '#06B6D4',
    icono: 'MapPin',
    orden: 6,
    notificarCliente: true,
    mensajeCliente: '📍 Tu pedido #{{numero}} ya está en {{ciudad}}. Pronto lo recibirás.',
    siguientesEstados: ['en_reparto', 'devolucion'],
    tiempoMaximo: 24,
  },
  {
    id: 'en_reparto',
    nombre: 'En Reparto',
    color: '#10B981',
    icono: 'Bike',
    orden: 7,
    notificarCliente: true,
    mensajeCliente: '🏃 ¡Tu pedido #{{numero}} está en reparto! Recíbelo hoy.',
    siguientesEstados: ['entregado', 'devolucion'],
    tiempoMaximo: 8,
  },
  {
    id: 'entregado',
    nombre: 'Entregado',
    color: '#22C55E',
    icono: 'CheckCircle2',
    orden: 8,
    notificarCliente: true,
    mensajeCliente: '🎉 ¡Pedido #{{numero}} entregado!\n\nGracias por tu compra {{nombre}}. ¿Cómo fue tu experiencia?',
    siguientesEstados: ['devolucion'],
    tiempoMaximo: null,
  },
  {
    id: 'devolucion',
    nombre: 'Devolución',
    color: '#EF4444',
    icono: 'RotateCcw',
    orden: 9,
    notificarCliente: true,
    mensajeCliente: '📦 Tu pedido #{{numero}} está en proceso de devolución.',
    siguientesEstados: ['reembolsado'],
    tiempoMaximo: null,
  },
  {
    id: 'cancelado',
    nombre: 'Cancelado',
    color: '#6B7280',
    icono: 'XCircle',
    orden: 10,
    notificarCliente: true,
    mensajeCliente: 'Tu pedido #{{numero}} ha sido cancelado.',
    siguientesEstados: [],
    tiempoMaximo: null,
  },
  {
    id: 'reembolsado',
    nombre: 'Reembolsado',
    color: '#A855F7',
    icono: 'DollarSign',
    orden: 11,
    notificarCliente: true,
    mensajeCliente: '💰 El reembolso de tu pedido #{{numero}} ha sido procesado.',
    siguientesEstados: [],
    tiempoMaximo: null,
  },
];

// ============================================
// PLANTILLAS DE MENSAJES
// ============================================

const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'msg-confirmado',
    nombre: 'Pedido Confirmado',
    estado: 'confirmado',
    canal: 'whatsapp',
    mensaje: '¡Hola {{nombre}}! 👋\n\nTu pedido #{{numero}} ha sido confirmado ✅\n\n📦 Productos:\n{{productos}}\n\n💰 Total: {{total}}\n\nTe avisaremos cuando lo enviemos. ¡Gracias por tu compra!',
    variables: ['nombre', 'numero', 'productos', 'total'],
    isActive: true,
  },
  {
    id: 'msg-enviado',
    nombre: 'Pedido Enviado',
    estado: 'enviado',
    canal: 'whatsapp',
    mensaje: '🚚 ¡Tu pedido va en camino!\n\nPedido: #{{numero}}\nGuía: {{guia}}\nTransportadora: {{transportadora}}\n\n📍 Rastrea tu envío aquí:\n{{link_tracking}}\n\nTiempo estimado: {{tiempo_estimado}}',
    variables: ['numero', 'guia', 'transportadora', 'link_tracking', 'tiempo_estimado'],
    isActive: true,
  },
  {
    id: 'msg-entregado',
    nombre: 'Pedido Entregado',
    estado: 'entregado',
    canal: 'whatsapp',
    mensaje: '🎉 ¡Pedido entregado!\n\nHola {{nombre}}, tu pedido #{{numero}} fue entregado.\n\n¿Todo llegó bien? Cuéntanos tu experiencia ⭐\n\n¡Gracias por confiar en nosotros!',
    variables: ['nombre', 'numero'],
    isActive: true,
  },
];

// ============================================
// AUTOMATIZACIONES POR DEFECTO
// ============================================

const DEFAULT_AUTOMATIONS: OrderAutomation[] = [
  {
    id: 'auto-alerta-tiempo',
    nombre: 'Alerta pedido atrasado',
    descripcion: 'Notifica si un pedido lleva más de 5 días en tránsito',
    trigger: { tipo: 'tiempo_en_estado', valor: { estado: 'en_transito', horas: 120 } },
    condiciones: [],
    acciones: [
      { tipo: 'notificar_admin', config: { mensaje: 'Pedido {{numero}} lleva 5+ días en tránsito' } },
      { tipo: 'agregar_nota', config: { nota: 'ALERTA: Pedido con posible retraso', tipo: 'interna' } }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'auto-mensaje-enviado',
    nombre: 'Mensaje automático al enviar',
    descripcion: 'Envía WhatsApp cuando el pedido se marca como enviado',
    trigger: { tipo: 'estado_cambia', valor: { de: 'en_preparacion', a: 'enviado' } },
    condiciones: [],
    acciones: [
      { tipo: 'enviar_mensaje', config: { plantilla: 'msg-enviado', canal: 'whatsapp' } }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// DATOS DE EJEMPLO
// ============================================

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-001',
    numeroOrden: 'LIT-2024-0001',
    customerId: 'cust-001',
    customerName: 'María García',
    customerPhone: '3001234567',
    customerEmail: 'maria@email.com',
    direccion: 'Cra 45 #67-89 Apto 301',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    codigoPostal: '110111',
    instrucciones: 'Llamar al llegar',
    productos: [
      { id: 'prod-1', nombre: 'Producto Premium', sku: 'SKU001', cantidad: 2, precioUnitario: 75000, precioTotal: 150000, imagen: '' }
    ],
    subtotal: 150000,
    descuento: 0,
    costoEnvio: 12000,
    total: 162000,
    metodoPago: 'contraentrega',
    estado: 'en_transito',
    estadoAnterior: 'enviado',
    guia: 'GU123456789',
    transportadora: 'Coordinadora',
    createdAt: '2024-01-10T10:00:00Z',
    confirmedAt: '2024-01-10T11:00:00Z',
    shippedAt: '2024-01-11T09:00:00Z',
    deliveredAt: null,
    canalVenta: 'Facebook',
    campana: 'Promo Enero',
    notas: [],
    timeline: [
      { id: 'tl-1', estado: 'pendiente', descripcion: 'Pedido creado', fecha: '2024-01-10T10:00:00Z', automatico: true },
      { id: 'tl-2', estado: 'confirmado', descripcion: 'Pedido confirmado', fecha: '2024-01-10T11:00:00Z', automatico: false },
      { id: 'tl-3', estado: 'enviado', descripcion: 'Enviado con Coordinadora', fecha: '2024-01-11T09:00:00Z', automatico: false },
      { id: 'tl-4', estado: 'en_transito', descripcion: 'En tránsito hacia Bogotá', fecha: '2024-01-12T14:00:00Z', automatico: true },
    ],
    isPriority: false,
    hasIssue: false,
    issueType: null,
  },
  {
    id: 'ord-002',
    numeroOrden: 'LIT-2024-0002',
    customerId: 'cust-002',
    customerName: 'Carlos Rodríguez',
    customerPhone: '3109876543',
    customerEmail: 'carlos@email.com',
    direccion: 'Calle 80 #45-23',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    codigoPostal: '050001',
    instrucciones: '',
    productos: [
      { id: 'prod-2', nombre: 'Kit Básico', sku: 'SKU002', cantidad: 1, precioUnitario: 85000, precioTotal: 85000, imagen: '' }
    ],
    subtotal: 85000,
    descuento: 10000,
    costoEnvio: 15000,
    total: 90000,
    metodoPago: 'transferencia',
    estado: 'pendiente',
    estadoAnterior: null,
    guia: '',
    transportadora: '',
    createdAt: '2024-01-15T14:00:00Z',
    confirmedAt: null,
    shippedAt: null,
    deliveredAt: null,
    canalVenta: 'Instagram',
    campana: '',
    notas: [],
    timeline: [
      { id: 'tl-5', estado: 'pendiente', descripcion: 'Pedido creado', fecha: '2024-01-15T14:00:00Z', automatico: true },
    ],
    isPriority: true,
    hasIssue: false,
    issueType: null,
  },
];

// ============================================
// STORE
// ============================================

interface OrdersState {
  orders: Order[];
  statusConfig: OrderStatusConfig[];
  automations: OrderAutomation[];
  messageTemplates: MessageTemplate[];

  // Orders CRUD
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'timeline'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrder: (id: string) => Order | undefined;

  // Status
  changeStatus: (orderId: string, newStatus: OrderStatus, descripcion?: string) => void;
  getStatusConfig: (status: OrderStatus) => OrderStatusConfig | undefined;

  // Notes
  addNote: (orderId: string, note: Omit<OrderNote, 'id' | 'createdAt'>) => void;

  // Automations
  addAutomation: (automation: Omit<OrderAutomation, 'id' | 'createdAt'>) => void;
  updateAutomation: (id: string, updates: Partial<OrderAutomation>) => void;
  deleteAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;

  // Templates
  addMessageTemplate: (template: Omit<MessageTemplate, 'id'>) => void;
  updateMessageTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  deleteMessageTemplate: (id: string) => void;

  // Queries
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getOrdersWithIssues: () => Order[];
  getPendingOrders: () => Order[];
  getRecentOrders: (limit: number) => Order[];
  searchOrders: (query: string) => Order[];

  // Stats
  getStatusStats: () => Record<OrderStatus, number>;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: SAMPLE_ORDERS,
      statusConfig: ORDER_STATUS_CONFIG,
      automations: DEFAULT_AUTOMATIONS,
      messageTemplates: DEFAULT_MESSAGE_TEMPLATES,

      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: generateId(),
          createdAt: new Date().toISOString(),
          timeline: [
            {
              id: generateId(),
              estado: order.estado,
              descripcion: 'Pedido creado',
              fecha: new Date().toISOString(),
              automatico: true,
            }
          ],
        };
        set((state) => ({
          orders: [newOrder, ...state.orders]
        }));
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          )
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id)
        }));
      },

      getOrder: (id) => {
        return get().orders.find((o) => o.id === id);
      },

      changeStatus: (orderId, newStatus, descripcion) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;

        const config = get().statusConfig.find(c => c.id === newStatus);
        const timelineEvent: OrderTimelineEvent = {
          id: generateId(),
          estado: newStatus,
          descripcion: descripcion || config?.nombre || 'Estado actualizado',
          fecha: new Date().toISOString(),
          automatico: false,
        };

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  estadoAnterior: o.estado,
                  estado: newStatus,
                  timeline: [...o.timeline, timelineEvent],
                  ...(newStatus === 'confirmado' ? { confirmedAt: new Date().toISOString() } : {}),
                  ...(newStatus === 'enviado' ? { shippedAt: new Date().toISOString() } : {}),
                  ...(newStatus === 'entregado' ? { deliveredAt: new Date().toISOString() } : {}),
                }
              : o
          )
        }));
      },

      getStatusConfig: (status) => {
        return get().statusConfig.find(c => c.id === status);
      },

      addNote: (orderId, note) => {
        const newNote: OrderNote = {
          ...note,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, notas: [...o.notas, newNote] }
              : o
          )
        }));
      },

      addAutomation: (automation) => {
        const newAutomation: OrderAutomation = {
          ...automation,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          automations: [...state.automations, newAutomation]
        }));
      },

      updateAutomation: (id, updates) => {
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          )
        }));
      },

      deleteAutomation: (id) => {
        set((state) => ({
          automations: state.automations.filter((a) => a.id !== id)
        }));
      },

      toggleAutomation: (id) => {
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          )
        }));
      },

      addMessageTemplate: (template) => {
        const newTemplate: MessageTemplate = {
          ...template,
          id: generateId(),
        };
        set((state) => ({
          messageTemplates: [...state.messageTemplates, newTemplate]
        }));
      },

      updateMessageTemplate: (id, updates) => {
        set((state) => ({
          messageTemplates: state.messageTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          )
        }));
      },

      deleteMessageTemplate: (id) => {
        set((state) => ({
          messageTemplates: state.messageTemplates.filter((t) => t.id !== id)
        }));
      },

      getOrdersByStatus: (status) => {
        return get().orders.filter((o) => o.estado === status);
      },

      getOrdersWithIssues: () => {
        return get().orders.filter((o) => o.hasIssue);
      },

      getPendingOrders: () => {
        return get().orders.filter((o) =>
          ['pendiente', 'confirmado', 'en_preparacion'].includes(o.estado)
        );
      },

      getRecentOrders: (limit) => {
        return get().orders.slice(0, limit);
      },

      searchOrders: (query) => {
        const q = query.toLowerCase();
        return get().orders.filter((o) =>
          o.numeroOrden.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.guia.toLowerCase().includes(q)
        );
      },

      getStatusStats: () => {
        const stats: Record<OrderStatus, number> = {
          pendiente: 0,
          confirmado: 0,
          en_preparacion: 0,
          enviado: 0,
          en_transito: 0,
          en_ciudad_destino: 0,
          en_reparto: 0,
          entregado: 0,
          devolucion: 0,
          cancelado: 0,
          reembolsado: 0,
        };
        get().orders.forEach((o) => {
          stats[o.estado]++;
        });
        return stats;
      },
    }),
    {
      name: 'litper-orders-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useOrders() {
  const store = useOrdersStore();

  const statusStats = store.getStatusStats();
  const pendingOrders = store.getPendingOrders();
  const ordersWithIssues = store.getOrdersWithIssues();
  const activeAutomations = store.automations.filter(a => a.isActive);

  return {
    ...store,
    statusStats,
    pendingOrders,
    ordersWithIssues,
    activeAutomations,
  };
}

export default useOrdersStore;
