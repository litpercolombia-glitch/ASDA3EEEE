// services/marketingService.ts
// Sistema de Marketing Automatizado para LITPER PRO

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TIPOS
// ============================================

export interface Campaign {
  id: string;
  nombre: string;
  tipo: 'email' | 'whatsapp' | 'sms' | 'push';
  estado: 'borrador' | 'programada' | 'activa' | 'pausada' | 'completada';
  audiencia: AudienceFilter;
  mensaje: MessageContent;
  programacion: CampaignSchedule | null;
  metricas: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceFilter {
  tipo: 'todos' | 'segmento' | 'personalizado';
  segmentos?: string[];
  condiciones?: FilterCondition[];
  cantidadEstimada: number;
}

export interface FilterCondition {
  campo: string;
  operador: string;
  valor: any;
}

export interface MessageContent {
  asunto?: string;
  contenido: string;
  variables: string[];
  imagenes?: string[];
  botones?: MessageButton[];
}

export interface MessageButton {
  texto: string;
  tipo: 'url' | 'respuesta';
  valor: string;
}

export interface CampaignSchedule {
  tipo: 'inmediata' | 'programada' | 'recurrente';
  fechaInicio: string;
  horaEnvio?: string;
  frecuencia?: 'diaria' | 'semanal' | 'mensual';
  diasSemana?: number[];
}

export interface CampaignMetrics {
  enviados: number;
  entregados: number;
  abiertos: number;
  clicks: number;
  conversiones: number;
  rebotados: number;
  tasaApertura: number;
  tasaClick: number;
  tasaConversion: number;
}

export interface MessageTemplate {
  id: string;
  nombre: string;
  categoria: 'promocion' | 'recordatorio' | 'seguimiento' | 'reactivacion' | 'bienvenida' | 'personalizado';
  canal: 'email' | 'whatsapp' | 'sms';
  contenido: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface AutomationFlow {
  id: string;
  nombre: string;
  descripcion: string;
  trigger: FlowTrigger;
  pasos: FlowStep[];
  isActive: boolean;
  ejecutados: number;
  createdAt: string;
}

export interface FlowTrigger {
  tipo: 'evento' | 'fecha' | 'condicion';
  evento?: string;
  condicion?: FilterCondition;
}

export interface FlowStep {
  id: string;
  tipo: 'esperar' | 'enviar_mensaje' | 'condicion' | 'actualizar_cliente';
  config: Record<string, any>;
  siguientePaso?: string;
  pasoSi?: string;
  pasoNo?: string;
}

// ============================================
// PLANTILLAS POR DEFECTO
// ============================================

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-bienvenida',
    nombre: 'Bienvenida Nuevo Cliente',
    categoria: 'bienvenida',
    canal: 'whatsapp',
    contenido: '¡Hola {{nombre}}! 👋\n\nBienvenido/a a nuestra familia. Gracias por tu primera compra.\n\n🎁 Como regalo, aquí tienes un 10% de descuento para tu próxima compra: {{codigo_descuento}}\n\n¿Tienes alguna pregunta? Estamos aquí para ayudarte.',
    variables: ['nombre', 'codigo_descuento'],
    isActive: true,
    usageCount: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-carrito',
    nombre: 'Carrito Abandonado',
    categoria: 'recordatorio',
    canal: 'whatsapp',
    contenido: '¡Hola {{nombre}}! 🛒\n\nVimos que dejaste algo en tu carrito:\n{{productos}}\n\n¿Necesitas ayuda para completar tu compra?\n\n⏰ ¡Date prisa! Tu carrito expira pronto.',
    variables: ['nombre', 'productos'],
    isActive: true,
    usageCount: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-reactivacion',
    nombre: 'Reactivación de Cliente',
    categoria: 'reactivacion',
    canal: 'whatsapp',
    contenido: '¡Hola {{nombre}}! 💫\n\nTe extrañamos... Hace {{dias}} días no nos visitas.\n\n🎉 Tenemos algo especial para ti:\n{{oferta}}\n\n¿Volvemos a vernos?',
    variables: ['nombre', 'dias', 'oferta'],
    isActive: true,
    usageCount: 67,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tpl-promo',
    nombre: 'Promoción General',
    categoria: 'promocion',
    canal: 'whatsapp',
    contenido: '🔥 ¡OFERTA ESPECIAL!\n\n{{titulo_promo}}\n\n{{descripcion}}\n\n💰 {{descuento}}\n⏰ Válido hasta: {{fecha_fin}}\n\n👉 {{link}}',
    variables: ['titulo_promo', 'descripcion', 'descuento', 'fecha_fin', 'link'],
    isActive: true,
    usageCount: 234,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_FLOWS: AutomationFlow[] = [
  {
    id: 'flow-bienvenida',
    nombre: 'Flujo de Bienvenida',
    descripcion: 'Secuencia automática para nuevos clientes',
    trigger: { tipo: 'evento', evento: 'primera_compra' },
    pasos: [
      { id: 'paso-1', tipo: 'enviar_mensaje', config: { plantilla: 'tpl-bienvenida', canal: 'whatsapp' } },
      { id: 'paso-2', tipo: 'esperar', config: { dias: 3 }, siguientePaso: 'paso-3' },
      { id: 'paso-3', tipo: 'enviar_mensaje', config: { mensaje: '¿Recibiste tu pedido? ¿Todo bien?' } },
    ],
    isActive: true,
    ejecutados: 156,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'flow-reactivacion',
    nombre: 'Reactivación Automática',
    descripcion: 'Reactiva clientes inactivos por 30+ días',
    trigger: { tipo: 'condicion', condicion: { campo: 'diasSinComprar', operador: 'mayor', valor: 30 } },
    pasos: [
      { id: 'paso-1', tipo: 'enviar_mensaje', config: { plantilla: 'tpl-reactivacion' } },
      { id: 'paso-2', tipo: 'esperar', config: { dias: 7 }, siguientePaso: 'paso-3' },
      { id: 'paso-3', tipo: 'condicion', config: { campo: 'compro', operador: 'igual', valor: false }, pasoNo: 'fin', pasoSi: 'paso-4' },
      { id: 'paso-4', tipo: 'enviar_mensaje', config: { mensaje: 'Última oportunidad: 20% OFF solo por hoy' } },
    ],
    isActive: true,
    ejecutados: 89,
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// STORE
// ============================================

interface MarketingState {
  campaigns: Campaign[];
  templates: MessageTemplate[];
  flows: AutomationFlow[];

  // Campaigns
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metricas'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  // Templates
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  updateTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Flows
  addFlow: (flow: Omit<AutomationFlow, 'id' | 'createdAt' | 'ejecutados'>) => void;
  updateFlow: (id: string, updates: Partial<AutomationFlow>) => void;
  deleteFlow: (id: string) => void;
  toggleFlow: (id: string) => void;

  // Stats
  getActiveFlows: () => AutomationFlow[];
  getCampaignsByStatus: (status: Campaign['estado']) => Campaign[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      templates: DEFAULT_TEMPLATES,
      flows: DEFAULT_FLOWS,

      addCampaign: (campaign) => {
        const newCampaign: Campaign = {
          ...campaign,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metricas: { enviados: 0, entregados: 0, abiertos: 0, clicks: 0, conversiones: 0, rebotados: 0, tasaApertura: 0, tasaClick: 0, tasaConversion: 0 },
        };
        set((state) => ({ campaigns: [newCampaign, ...state.campaigns] }));
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
        }));
      },

      deleteCampaign: (id) => {
        set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) }));
      },

      addTemplate: (template) => {
        const newTemplate: MessageTemplate = { ...template, id: generateId(), createdAt: new Date().toISOString(), usageCount: 0 };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({ templates: state.templates.map((t) => t.id === id ? { ...t, ...updates } : t) }));
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
      },

      addFlow: (flow) => {
        const newFlow: AutomationFlow = { ...flow, id: generateId(), createdAt: new Date().toISOString(), ejecutados: 0 };
        set((state) => ({ flows: [...state.flows, newFlow] }));
      },

      updateFlow: (id, updates) => {
        set((state) => ({ flows: state.flows.map((f) => f.id === id ? { ...f, ...updates } : f) }));
      },

      deleteFlow: (id) => {
        set((state) => ({ flows: state.flows.filter((f) => f.id !== id) }));
      },

      toggleFlow: (id) => {
        set((state) => ({ flows: state.flows.map((f) => f.id === id ? { ...f, isActive: !f.isActive } : f) }));
      },

      getActiveFlows: () => get().flows.filter((f) => f.isActive),
      getCampaignsByStatus: (status) => get().campaigns.filter((c) => c.estado === status),
    }),
    { name: 'litper-marketing-store' }
  )
);

export function useMarketing() {
  const store = useMarketingStore();
  const activeFlows = store.getActiveFlows();
  const activeCampaigns = store.getCampaignsByStatus('activa');
  return { ...store, activeFlows, activeCampaigns };
}

export default useMarketingStore;
