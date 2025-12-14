// ============================================
// SERVICIO DE PLANTILLAS Y PRESETS GLOBALES
// Sistema unificado para guardar configuraciones completas
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipo de preset según el módulo
export type PresetModule =
  | 'dashboard'
  | 'seguimiento'
  | 'crm'
  | 'pedidos'
  | 'marketing'
  | 'soporte'
  | 'reportes'
  | 'global';

// Configuración de un preset completo
export interface AppPreset {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  module: PresetModule;

  // Configuraciones específicas
  config: {
    // Vista
    viewMode?: string;
    density?: string;
    colorScheme?: string;

    // Columnas y filtros
    visibleColumns?: string[];
    hiddenColumns?: string[];
    defaultFilters?: Record<string, any>;
    defaultSort?: { field: string; direction: 'asc' | 'desc' };
    groupBy?: string;

    // Datos
    dataSource?: 'seguimiento' | 'dropi' | 'combinado';
    autoRefresh?: boolean;
    refreshInterval?: number; // en segundos

    // Excel
    excelConfigId?: string;

    // UI
    sidebarCollapsed?: boolean;
    showStats?: boolean;
    showTimeline?: boolean;

    // Cualquier configuración adicional
    [key: string]: any;
  };

  // Metadatos
  isDefault: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;
  createdBy?: string;

  // Compartir
  isShared: boolean;
  sharedWith?: string[];
}

// Configuración rápida (acceso rápido)
export interface QuickConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  presetId: string;
  shortcut?: string; // Ej: "Ctrl+1"
  order: number;
}

// Estado del store
interface PresetsState {
  presets: AppPreset[];
  quickConfigs: QuickConfig[];
  activePresetByModule: Record<PresetModule, string | null>;

  // CRUD de presets
  createPreset: (preset: Omit<AppPreset, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
  updatePreset: (id: string, updates: Partial<AppPreset>) => void;
  deletePreset: (id: string) => void;
  duplicatePreset: (id: string) => string;

  // Obtener presets
  getPreset: (id: string) => AppPreset | null;
  getPresetsByModule: (module: PresetModule) => AppPreset[];
  getFavorites: () => AppPreset[];
  getRecent: (limit?: number) => AppPreset[];

  // Aplicar presets
  applyPreset: (id: string) => AppPreset | null;
  setActivePreset: (module: PresetModule, presetId: string | null) => void;
  getActivePreset: (module: PresetModule) => AppPreset | null;

  // Favoritos y pinned
  toggleFavorite: (id: string) => void;
  togglePinned: (id: string) => void;

  // Quick configs
  addQuickConfig: (config: Omit<QuickConfig, 'id' | 'order'>) => void;
  removeQuickConfig: (id: string) => void;
  reorderQuickConfigs: (configs: QuickConfig[]) => void;

  // Import/Export
  exportPresets: (module?: PresetModule) => string;
  importPresets: (json: string) => number;
  exportAll: () => string;
  importAll: (json: string) => boolean;

  // Utilidades
  resetModulePresets: (module: PresetModule) => void;
}

// Presets predefinidos del sistema
const SYSTEM_PRESETS: Omit<AppPreset, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Vista General',
    description: 'Configuración estándar para el día a día',
    icon: '📊',
    module: 'global',
    config: {
      viewMode: 'table',
      density: 'normal',
      colorScheme: 'default',
      showStats: true,
      autoRefresh: false,
    },
    isDefault: true,
    isFavorite: false,
    isPinned: false,
    isShared: false,
  },
  {
    name: 'Modo Gerente',
    description: 'Vista ejecutiva con métricas clave',
    icon: '👔',
    module: 'dashboard',
    config: {
      viewMode: 'cards',
      density: 'comfortable',
      colorScheme: 'colorful',
      showStats: true,
      visibleColumns: ['guia', 'estado', 'ciudad', 'valor'],
      defaultFilters: {},
    },
    isDefault: false,
    isFavorite: true,
    isPinned: true,
    isShared: false,
  },
  {
    name: 'Operador Logístico',
    description: 'Vista compacta para procesar muchos envíos',
    icon: '📦',
    module: 'seguimiento',
    config: {
      viewMode: 'compact',
      density: 'compact',
      colorScheme: 'minimal',
      showStats: false,
      visibleColumns: ['guia', 'estado', 'cliente', 'telefono', 'ciudad'],
      autoRefresh: true,
      refreshInterval: 60,
    },
    isDefault: false,
    isFavorite: false,
    isPinned: true,
    isShared: false,
  },
  {
    name: 'Análisis de Problemas',
    description: 'Enfocado en envíos con novedades',
    icon: '⚠️',
    module: 'seguimiento',
    config: {
      viewMode: 'table',
      density: 'normal',
      colorScheme: 'colorful',
      showStats: true,
      defaultFilters: {
        status: ['DEVOLUCION', 'NOVEDAD', 'EXCEPTION', 'RETURNED'],
      },
      defaultSort: { field: 'date', direction: 'desc' },
    },
    isDefault: false,
    isFavorite: true,
    isPinned: false,
    isShared: false,
  },
  {
    name: 'CRM Activo',
    description: 'Para gestión activa de clientes',
    icon: '👥',
    module: 'crm',
    config: {
      viewMode: 'cards',
      density: 'normal',
      showStats: true,
      groupBy: 'segment',
    },
    isDefault: true,
    isFavorite: false,
    isPinned: false,
    isShared: false,
  },
  {
    name: 'Pipeline de Pedidos',
    description: 'Vista Kanban para seguimiento de pedidos',
    icon: '📋',
    module: 'pedidos',
    config: {
      viewMode: 'kanban',
      density: 'normal',
      groupBy: 'status',
      showTimeline: true,
    },
    isDefault: true,
    isFavorite: false,
    isPinned: false,
    isShared: false,
  },
  {
    name: 'Marketing Dashboard',
    description: 'Vista de campañas y métricas',
    icon: '📢',
    module: 'marketing',
    config: {
      viewMode: 'cards',
      density: 'comfortable',
      showStats: true,
    },
    isDefault: true,
    isFavorite: false,
    isPinned: false,
    isShared: false,
  },
  {
    name: 'Soporte Rápido',
    description: 'Vista optimizada para responder tickets',
    icon: '🎧',
    module: 'soporte',
    config: {
      viewMode: 'list',
      density: 'compact',
      defaultSort: { field: 'priority', direction: 'desc' },
    },
    isDefault: true,
    isFavorite: false,
    isPinned: false,
    isShared: false,
  },
];

export const usePresetsStore = create<PresetsState>()(
  persist(
    (set, get) => ({
      presets: SYSTEM_PRESETS.map((p, idx) => ({
        ...p,
        id: `system-preset-${idx}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      })),

      quickConfigs: [
        { id: 'qc-1', name: 'General', icon: '📊', color: '#6366f1', presetId: 'system-preset-0', order: 1 },
        { id: 'qc-2', name: 'Gerente', icon: '👔', color: '#10b981', presetId: 'system-preset-1', order: 2 },
        { id: 'qc-3', name: 'Operador', icon: '📦', color: '#f59e0b', presetId: 'system-preset-2', order: 3 },
      ],

      activePresetByModule: {
        dashboard: null,
        seguimiento: null,
        crm: null,
        pedidos: null,
        marketing: null,
        soporte: null,
        reportes: null,
        global: 'system-preset-0',
      },

      createPreset: (preset) => {
        const id = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newPreset: AppPreset = {
          ...preset,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };

        set((state) => ({
          presets: [...state.presets, newPreset],
        }));

        return id;
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          quickConfigs: state.quickConfigs.filter((qc) => qc.presetId !== id),
        }));
      },

      duplicatePreset: (id) => {
        const original = get().presets.find((p) => p.id === id);
        if (!original) return '';

        const newId = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duplicate: AppPreset = {
          ...original,
          id: newId,
          name: `${original.name} (copia)`,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };

        set((state) => ({
          presets: [...state.presets, duplicate],
        }));

        return newId;
      },

      getPreset: (id) => {
        return get().presets.find((p) => p.id === id) || null;
      },

      getPresetsByModule: (module) => {
        return get().presets.filter((p) => p.module === module || p.module === 'global');
      },

      getFavorites: () => {
        return get().presets.filter((p) => p.isFavorite);
      },

      getRecent: (limit = 5) => {
        return [...get().presets]
          .filter((p) => p.lastUsed)
          .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
          .slice(0, limit);
      },

      applyPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (!preset) return null;

        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id
              ? { ...p, usageCount: p.usageCount + 1, lastUsed: new Date() }
              : p
          ),
          activePresetByModule: {
            ...state.activePresetByModule,
            [preset.module]: id,
          },
        }));

        return preset;
      },

      setActivePreset: (module, presetId) => {
        set((state) => ({
          activePresetByModule: {
            ...state.activePresetByModule,
            [module]: presetId,
          },
        }));
      },

      getActivePreset: (module) => {
        const presetId = get().activePresetByModule[module];
        if (!presetId) return null;
        return get().presets.find((p) => p.id === presetId) || null;
      },

      toggleFavorite: (id) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
      },

      togglePinned: (id) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, isPinned: !p.isPinned } : p
          ),
        }));
      },

      addQuickConfig: (config) => {
        const id = `qc-${Date.now()}`;
        const order = get().quickConfigs.length + 1;

        set((state) => ({
          quickConfigs: [...state.quickConfigs, { ...config, id, order }],
        }));
      },

      removeQuickConfig: (id) => {
        set((state) => ({
          quickConfigs: state.quickConfigs.filter((qc) => qc.id !== id),
        }));
      },

      reorderQuickConfigs: (configs) => {
        set({ quickConfigs: configs });
      },

      exportPresets: (module) => {
        const presets = module
          ? get().presets.filter((p) => p.module === module)
          : get().presets.filter((p) => !p.id.startsWith('system-'));
        return JSON.stringify(presets, null, 2);
      },

      importPresets: (json) => {
        try {
          const imported = JSON.parse(json);
          if (!Array.isArray(imported)) return 0;

          const newPresets = imported.map((p: any) => ({
            ...p,
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isDefault: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          }));

          set((state) => ({
            presets: [...state.presets, ...newPresets],
          }));

          return newPresets.length;
        } catch {
          return 0;
        }
      },

      exportAll: () => {
        const state = get();
        return JSON.stringify({
          presets: state.presets.filter((p) => !p.id.startsWith('system-')),
          quickConfigs: state.quickConfigs,
          activePresetByModule: state.activePresetByModule,
        }, null, 2);
      },

      importAll: (json) => {
        try {
          const data = JSON.parse(json);
          if (data.presets) {
            const imported = data.presets.map((p: any) => ({
              ...p,
              id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
            set((state) => ({
              presets: [...state.presets, ...imported],
            }));
          }
          if (data.quickConfigs) {
            set({ quickConfigs: data.quickConfigs });
          }
          return true;
        } catch {
          return false;
        }
      },

      resetModulePresets: (module) => {
        set((state) => ({
          activePresetByModule: {
            ...state.activePresetByModule,
            [module]: null,
          },
        }));
      },
    }),
    {
      name: 'litper-app-presets',
    }
  )
);

export default usePresetsStore;
