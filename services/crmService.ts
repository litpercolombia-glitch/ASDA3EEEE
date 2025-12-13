// services/crmService.ts
// Sistema CRM Completo para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Customer {
  id: string;
  // Datos básicos
  nombre: string;
  email: string;
  telefono: string;
  whatsapp: string;
  documento: string;
  // Dirección
  direccion: string;
  ciudad: string;
  departamento: string;
  codigoPostal: string;
  // Segmentación
  segmento: CustomerSegment;
  tags: string[];
  // Métricas
  totalCompras: number;
  cantidadPedidos: number;
  ticketPromedio: number;
  ltv: number; // Lifetime Value
  ultimaCompra: string;
  primeraCompra: string;
  diasSinComprar: number;
  // Comportamiento
  productosComprados: string[];
  categoriasPreferidas: string[];
  canalAdquisicion: string;
  // Comunicación
  ultimoContacto: string;
  preferenciaComunicacion: 'whatsapp' | 'email' | 'sms' | 'llamada';
  horarioPreferido: string;
  // Campos personalizados
  camposPersonalizados: Record<string, any>;
  // Notas
  notas: CustomerNote[];
  // Estado
  estado: 'activo' | 'inactivo' | 'bloqueado';
  riesgoChurn: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export type CustomerSegment = 'vip' | 'frecuente' | 'ocasional' | 'nuevo' | 'en_riesgo' | 'perdido' | 'potencial';

export interface CustomerNote {
  id: string;
  contenido: string;
  tipo: 'general' | 'llamada' | 'whatsapp' | 'email' | 'reclamo' | 'importante';
  creadoPor: string;
  createdAt: string;
}

export interface SegmentRule {
  id: string;
  nombre: string;
  segmento: CustomerSegment;
  condiciones: SegmentCondition[];
  operador: 'AND' | 'OR';
  color: string;
  icono: string;
  descripcion: string;
  isActive: boolean;
  autoAsignar: boolean;
  createdAt: string;
}

export interface SegmentCondition {
  campo: string;
  operador: 'igual' | 'mayor' | 'menor' | 'entre' | 'contiene' | 'no_contiene';
  valor: any;
  valor2?: any; // Para "entre"
}

export interface CustomField {
  id: string;
  nombre: string;
  tipo: 'texto' | 'numero' | 'fecha' | 'select' | 'checkbox' | 'telefono' | 'email';
  opciones?: string[]; // Para tipo select
  requerido: boolean;
  visible: boolean;
  orden: number;
}

export interface CustomerAlert {
  id: string;
  customerId: string;
  tipo: 'reactivacion' | 'cumpleanos' | 'vip_potencial' | 'riesgo_churn' | 'sin_compra' | 'personalizada';
  mensaje: string;
  prioridad: 'alta' | 'media' | 'baja';
  accionSugerida: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface CommunicationHistory {
  id: string;
  customerId: string;
  tipo: 'whatsapp' | 'email' | 'sms' | 'llamada';
  direccion: 'entrante' | 'saliente';
  contenido: string;
  estado: 'enviado' | 'entregado' | 'leido' | 'respondido' | 'fallido';
  createdAt: string;
}

export interface NoteTemplate {
  id: string;
  nombre: string;
  contenido: string;
  tipo: CustomerNote['tipo'];
  variables: string[];
}

// ============================================
// REGLAS DE SEGMENTACIÓN POR DEFECTO
// ============================================

const DEFAULT_SEGMENT_RULES: SegmentRule[] = [
  {
    id: 'seg-vip',
    nombre: 'Clientes VIP',
    segmento: 'vip',
    condiciones: [
      { campo: 'totalCompras', operador: 'mayor', valor: 500000 },
      { campo: 'cantidadPedidos', operador: 'mayor', valor: 3 }
    ],
    operador: 'AND',
    color: '#FFD700',
    icono: 'Crown',
    descripcion: 'Clientes con alto valor y compras frecuentes',
    isActive: true,
    autoAsignar: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seg-frecuente',
    nombre: 'Compradores Frecuentes',
    segmento: 'frecuente',
    condiciones: [
      { campo: 'cantidadPedidos', operador: 'mayor', valor: 2 },
      { campo: 'diasSinComprar', operador: 'menor', valor: 60 }
    ],
    operador: 'AND',
    color: '#10B981',
    icono: 'Repeat',
    descripcion: 'Compran regularmente',
    isActive: true,
    autoAsignar: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seg-riesgo',
    nombre: 'En Riesgo',
    segmento: 'en_riesgo',
    condiciones: [
      { campo: 'diasSinComprar', operador: 'mayor', valor: 45 },
      { campo: 'cantidadPedidos', operador: 'mayor', valor: 1 }
    ],
    operador: 'AND',
    color: '#F59E0B',
    icono: 'AlertTriangle',
    descripcion: 'Clientes que pueden perderse',
    isActive: true,
    autoAsignar: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seg-perdido',
    nombre: 'Clientes Perdidos',
    segmento: 'perdido',
    condiciones: [
      { campo: 'diasSinComprar', operador: 'mayor', valor: 90 }
    ],
    operador: 'AND',
    color: '#EF4444',
    icono: 'UserX',
    descripcion: 'Sin actividad por más de 90 días',
    isActive: true,
    autoAsignar: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'seg-nuevo',
    nombre: 'Nuevos Clientes',
    segmento: 'nuevo',
    condiciones: [
      { campo: 'cantidadPedidos', operador: 'igual', valor: 1 }
    ],
    operador: 'AND',
    color: '#3B82F6',
    icono: 'UserPlus',
    descripcion: 'Primera compra reciente',
    isActive: true,
    autoAsignar: true,
    createdAt: new Date().toISOString()
  }
];

// ============================================
// PLANTILLAS DE NOTAS
// ============================================

const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'tpl-llamada',
    nombre: 'Registro de Llamada',
    contenido: 'Llamada realizada el {{fecha}}.\nMotivo: {{motivo}}\nResultado: {{resultado}}\nSeguimiento: {{seguimiento}}',
    tipo: 'llamada',
    variables: ['fecha', 'motivo', 'resultado', 'seguimiento']
  },
  {
    id: 'tpl-reclamo',
    nombre: 'Registro de Reclamo',
    contenido: 'RECLAMO #{{numero}}\nPedido: {{pedido}}\nMotivo: {{motivo}}\nEstado: {{estado}}\nSolución: {{solucion}}',
    tipo: 'reclamo',
    variables: ['numero', 'pedido', 'motivo', 'estado', 'solucion']
  },
  {
    id: 'tpl-whatsapp',
    nombre: 'Conversación WhatsApp',
    contenido: 'Conversación por WhatsApp\nTema: {{tema}}\nResumen: {{resumen}}\nAcción requerida: {{accion}}',
    tipo: 'whatsapp',
    variables: ['tema', 'resumen', 'accion']
  }
];

// ============================================
// DATOS DE EJEMPLO
// ============================================

const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    nombre: 'María García López',
    email: 'maria.garcia@email.com',
    telefono: '3001234567',
    whatsapp: '573001234567',
    documento: '1234567890',
    direccion: 'Cra 45 #67-89 Apto 301',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    codigoPostal: '110111',
    segmento: 'vip',
    tags: ['recompra', 'promo-lover', 'referido'],
    totalCompras: 1250000,
    cantidadPedidos: 8,
    ticketPromedio: 156250,
    ltv: 1500000,
    ultimaCompra: '2024-01-10',
    primeraCompra: '2023-06-15',
    diasSinComprar: 5,
    productosComprados: ['Producto A', 'Producto B', 'Kit Premium'],
    categoriasPreferidas: ['Electrónica', 'Accesorios'],
    canalAdquisicion: 'Facebook Ads',
    ultimoContacto: '2024-01-12',
    preferenciaComunicacion: 'whatsapp',
    horarioPreferido: '7pm-9pm',
    camposPersonalizados: { talla: 'M', colorFavorito: 'Azul' },
    notas: [],
    estado: 'activo',
    riesgoChurn: 5,
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2024-01-12T15:30:00Z'
  },
  {
    id: 'cust-002',
    nombre: 'Carlos Rodríguez',
    email: 'carlos.r@email.com',
    telefono: '3109876543',
    whatsapp: '573109876543',
    documento: '9876543210',
    direccion: 'Calle 80 #45-23',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    codigoPostal: '050001',
    segmento: 'en_riesgo',
    tags: ['precio-sensible'],
    totalCompras: 320000,
    cantidadPedidos: 2,
    ticketPromedio: 160000,
    ltv: 400000,
    ultimaCompra: '2023-11-20',
    primeraCompra: '2023-09-10',
    diasSinComprar: 55,
    productosComprados: ['Producto C'],
    categoriasPreferidas: ['Hogar'],
    canalAdquisicion: 'Instagram',
    ultimoContacto: '2023-12-01',
    preferenciaComunicacion: 'email',
    horarioPreferido: '12pm-2pm',
    camposPersonalizados: {},
    notas: [],
    estado: 'activo',
    riesgoChurn: 65,
    createdAt: '2023-09-10T14:00:00Z',
    updatedAt: '2023-12-01T10:00:00Z'
  }
];

// ============================================
// STORE
// ============================================

interface CRMState {
  customers: Customer[];
  segmentRules: SegmentRule[];
  customFields: CustomField[];
  alerts: CustomerAlert[];
  communications: CommunicationHistory[];
  noteTemplates: NoteTemplate[];

  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;

  // Segmentation
  addSegmentRule: (rule: Omit<SegmentRule, 'id' | 'createdAt'>) => void;
  updateSegmentRule: (id: string, updates: Partial<SegmentRule>) => void;
  deleteSegmentRule: (id: string) => void;
  runSegmentation: () => void;

  // Custom Fields
  addCustomField: (field: Omit<CustomField, 'id'>) => void;
  updateCustomField: (id: string, updates: Partial<CustomField>) => void;
  deleteCustomField: (id: string) => void;

  // Notes
  addNote: (customerId: string, note: Omit<CustomerNote, 'id' | 'createdAt'>) => void;
  deleteNote: (customerId: string, noteId: string) => void;

  // Templates
  addNoteTemplate: (template: Omit<NoteTemplate, 'id'>) => void;
  updateNoteTemplate: (id: string, updates: Partial<NoteTemplate>) => void;
  deleteNoteTemplate: (id: string) => void;

  // Alerts
  generateAlerts: () => void;
  markAlertRead: (id: string) => void;
  dismissAlert: (id: string) => void;

  // Communications
  addCommunication: (comm: Omit<CommunicationHistory, 'id' | 'createdAt'>) => void;

  // Tags
  addTag: (customerId: string, tag: string) => void;
  removeTag: (customerId: string, tag: string) => void;

  // Analytics
  getSegmentStats: () => Record<CustomerSegment, number>;
  getCustomersBySegment: (segment: CustomerSegment) => Customer[];
  searchCustomers: (query: string) => Customer[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      customers: SAMPLE_CUSTOMERS,
      segmentRules: DEFAULT_SEGMENT_RULES,
      customFields: [],
      alerts: [],
      communications: [],
      noteTemplates: DEFAULT_NOTE_TEMPLATES,

      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          customers: [...state.customers, newCustomer]
        }));
        get().runSegmentation();
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          )
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id)
        }));
      },

      getCustomer: (id) => {
        return get().customers.find((c) => c.id === id);
      },

      addSegmentRule: (rule) => {
        const newRule: SegmentRule = {
          ...rule,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          segmentRules: [...state.segmentRules, newRule]
        }));
      },

      updateSegmentRule: (id, updates) => {
        set((state) => ({
          segmentRules: state.segmentRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          )
        }));
      },

      deleteSegmentRule: (id) => {
        set((state) => ({
          segmentRules: state.segmentRules.filter((r) => r.id !== id)
        }));
      },

      runSegmentation: () => {
        const { customers, segmentRules } = get();

        const updatedCustomers = customers.map((customer) => {
          for (const rule of segmentRules.filter(r => r.isActive && r.autoAsignar)) {
            const matches = rule.condiciones.every((cond) => {
              const value = customer[cond.campo as keyof Customer];
              switch (cond.operador) {
                case 'igual': return value === cond.valor;
                case 'mayor': return (value as number) > cond.valor;
                case 'menor': return (value as number) < cond.valor;
                case 'entre': return (value as number) >= cond.valor && (value as number) <= cond.valor2;
                case 'contiene': return String(value).includes(cond.valor);
                default: return false;
              }
            });

            if (matches) {
              return { ...customer, segmento: rule.segmento };
            }
          }
          return customer;
        });

        set({ customers: updatedCustomers });
      },

      addCustomField: (field) => {
        const newField: CustomField = {
          ...field,
          id: generateId(),
        };
        set((state) => ({
          customFields: [...state.customFields, newField]
        }));
      },

      updateCustomField: (id, updates) => {
        set((state) => ({
          customFields: state.customFields.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          )
        }));
      },

      deleteCustomField: (id) => {
        set((state) => ({
          customFields: state.customFields.filter((f) => f.id !== id)
        }));
      },

      addNote: (customerId, note) => {
        const newNote: CustomerNote = {
          ...note,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, notas: [...c.notas, newNote] }
              : c
          )
        }));
      },

      deleteNote: (customerId, noteId) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, notas: c.notas.filter((n) => n.id !== noteId) }
              : c
          )
        }));
      },

      addNoteTemplate: (template) => {
        const newTemplate: NoteTemplate = {
          ...template,
          id: generateId(),
        };
        set((state) => ({
          noteTemplates: [...state.noteTemplates, newTemplate]
        }));
      },

      updateNoteTemplate: (id, updates) => {
        set((state) => ({
          noteTemplates: state.noteTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          )
        }));
      },

      deleteNoteTemplate: (id) => {
        set((state) => ({
          noteTemplates: state.noteTemplates.filter((t) => t.id !== id)
        }));
      },

      generateAlerts: () => {
        const { customers } = get();
        const newAlerts: CustomerAlert[] = [];

        customers.forEach((customer) => {
          // Alerta de reactivación
          if (customer.diasSinComprar > 30 && customer.diasSinComprar < 60) {
            newAlerts.push({
              id: generateId(),
              customerId: customer.id,
              tipo: 'reactivacion',
              mensaje: `${customer.nombre} lleva ${customer.diasSinComprar} días sin comprar`,
              prioridad: 'media',
              accionSugerida: 'Enviar mensaje de reactivación con descuento',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString(),
            });
          }

          // Alerta de riesgo churn
          if (customer.riesgoChurn > 60) {
            newAlerts.push({
              id: generateId(),
              customerId: customer.id,
              tipo: 'riesgo_churn',
              mensaje: `${customer.nombre} tiene ${customer.riesgoChurn}% riesgo de perderse`,
              prioridad: 'alta',
              accionSugerida: 'Contactar urgente con oferta especial',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString(),
            });
          }

          // Alerta VIP potencial
          if (customer.segmento !== 'vip' && customer.totalCompras > 400000) {
            newAlerts.push({
              id: generateId(),
              customerId: customer.id,
              tipo: 'vip_potencial',
              mensaje: `${customer.nombre} podría ser VIP (${customer.totalCompras.toLocaleString()})`,
              prioridad: 'baja',
              accionSugerida: 'Invitar al programa VIP',
              isRead: false,
              isDismissed: false,
              createdAt: new Date().toISOString(),
            });
          }
        });

        set({ alerts: newAlerts });
      },

      markAlertRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isRead: true } : a
          )
        }));
      },

      dismissAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isDismissed: true } : a
          )
        }));
      },

      addCommunication: (comm) => {
        const newComm: CommunicationHistory = {
          ...comm,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          communications: [newComm, ...state.communications]
        }));
      },

      addTag: (customerId, tag) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId && !c.tags.includes(tag)
              ? { ...c, tags: [...c.tags, tag] }
              : c
          )
        }));
      },

      removeTag: (customerId, tag) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, tags: c.tags.filter((t) => t !== tag) }
              : c
          )
        }));
      },

      getSegmentStats: () => {
        const { customers } = get();
        const stats: Record<CustomerSegment, number> = {
          vip: 0,
          frecuente: 0,
          ocasional: 0,
          nuevo: 0,
          en_riesgo: 0,
          perdido: 0,
          potencial: 0,
        };
        customers.forEach((c) => {
          stats[c.segmento]++;
        });
        return stats;
      },

      getCustomersBySegment: (segment) => {
        return get().customers.filter((c) => c.segmento === segment);
      },

      searchCustomers: (query) => {
        const q = query.toLowerCase();
        return get().customers.filter((c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.telefono.includes(q) ||
          c.ciudad.toLowerCase().includes(q)
        );
      },
    }),
    {
      name: 'litper-crm-store',
    }
  )
);

// ============================================
// HOOKS
// ============================================

export function useCRM() {
  const store = useCRMStore();

  const activeAlerts = store.alerts.filter(a => !a.isDismissed);
  const unreadAlerts = activeAlerts.filter(a => !a.isRead);
  const segmentStats = store.getSegmentStats();

  return {
    ...store,
    activeAlerts,
    unreadAlerts,
    segmentStats,
  };
}

export default useCRMStore;
