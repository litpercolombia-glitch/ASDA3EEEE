// ============================================
// SERVICIO DE PREFERENCIAS DE VISUALIZACIÓN
// Personaliza cómo se muestra la información en toda la app
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos de vista disponibles
export type ViewMode = 'cards' | 'compact' | 'table' | 'list' | 'grid' | 'kanban';

// Densidad de la información
export type DensityMode = 'comfortable' | 'normal' | 'compact';

// Configuración de columnas para tablas
export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width?: number;
  order: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
}

// Configuración de agrupación
export interface GroupConfig {
  enabled: boolean;
  field: string;
  collapsed: boolean;
}

// Configuración de ordenamiento
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Configuración de filtros rápidos
export interface QuickFilter {
  id: string;
  label: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  active: boolean;
}

// Preset de visualización
export interface ViewPreset {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  viewMode: ViewMode;
  density: DensityMode;
  columns: ColumnConfig[];
  groupBy?: GroupConfig;
  sortBy?: SortConfig;
  filters: QuickFilter[];

  // Estilo visual
  showHeaders: boolean;
  alternateRowColors: boolean;
  showBorders: boolean;
  roundedCorners: boolean;
  showIcons: boolean;
  colorScheme: 'default' | 'minimal' | 'colorful' | 'dark';

  // Para secciones específicas
  section?: string;

  // Metadatos
  isDefault: boolean;
  isFavorite: boolean;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

// Columnas disponibles por defecto
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'guia', label: 'Guía', visible: true, order: 1, sortable: true, filterable: true },
  { id: 'estado', label: 'Estado', visible: true, order: 2, sortable: true, filterable: true },
  { id: 'cliente', label: 'Cliente', visible: true, order: 3, sortable: true, filterable: true },
  { id: 'telefono', label: 'Teléfono', visible: true, order: 4, sortable: false, filterable: true },
  { id: 'ciudad', label: 'Ciudad', visible: true, order: 5, sortable: true, filterable: true },
  { id: 'transportadora', label: 'Transportadora', visible: true, order: 6, sortable: true, filterable: true },
  { id: 'fecha', label: 'Fecha', visible: true, order: 7, sortable: true, filterable: true },
  { id: 'valor', label: 'Valor', visible: false, order: 8, sortable: true, filterable: true, align: 'right' },
  { id: 'producto', label: 'Producto', visible: false, order: 9, sortable: true, filterable: true },
  { id: 'observaciones', label: 'Observaciones', visible: false, order: 10, sortable: false, filterable: false },
  { id: 'diasTransito', label: 'Días en Tránsito', visible: false, order: 11, sortable: true, filterable: true },
  { id: 'fuente', label: 'Fuente', visible: false, order: 12, sortable: true, filterable: true },
];

// Presets predefinidos
export const DEFAULT_PRESETS: Omit<ViewPreset, 'id' | 'createdAt' | 'usageCount'>[] = [
  {
    name: 'Vista Estándar',
    description: 'Tabla completa con todas las columnas principales',
    icon: '📊',
    viewMode: 'table',
    density: 'normal',
    columns: DEFAULT_COLUMNS,
    filters: [],
    showHeaders: true,
    alternateRowColors: true,
    showBorders: true,
    roundedCorners: true,
    showIcons: true,
    colorScheme: 'default',
    isDefault: true,
    isFavorite: false,
  },
  {
    name: 'Vista Compacta',
    description: 'Información condensada para ver más registros',
    icon: '📋',
    viewMode: 'compact',
    density: 'compact',
    columns: DEFAULT_COLUMNS.map((c) => ({
      ...c,
      visible: ['guia', 'estado', 'cliente', 'ciudad'].includes(c.id),
    })),
    filters: [],
    showHeaders: true,
    alternateRowColors: false,
    showBorders: false,
    roundedCorners: false,
    showIcons: false,
    colorScheme: 'minimal',
    isDefault: false,
    isFavorite: false,
  },
  {
    name: 'Tarjetas Grandes',
    description: 'Vista de tarjetas con información detallada',
    icon: '🃏',
    viewMode: 'cards',
    density: 'comfortable',
    columns: DEFAULT_COLUMNS,
    filters: [],
    showHeaders: true,
    alternateRowColors: false,
    showBorders: true,
    roundedCorners: true,
    showIcons: true,
    colorScheme: 'colorful',
    isDefault: false,
    isFavorite: false,
  },
  {
    name: 'Lista Simple',
    description: 'Lista básica con información esencial',
    icon: '📝',
    viewMode: 'list',
    density: 'normal',
    columns: DEFAULT_COLUMNS.map((c) => ({
      ...c,
      visible: ['guia', 'estado', 'cliente'].includes(c.id),
    })),
    filters: [],
    showHeaders: false,
    alternateRowColors: true,
    showBorders: false,
    roundedCorners: true,
    showIcons: true,
    colorScheme: 'default',
    isDefault: false,
    isFavorite: false,
  },
  {
    name: 'Kanban por Estado',
    description: 'Vista de tablero agrupada por estado',
    icon: '📌',
    viewMode: 'kanban',
    density: 'normal',
    columns: DEFAULT_COLUMNS,
    groupBy: { enabled: true, field: 'estado', collapsed: false },
    filters: [],
    showHeaders: true,
    alternateRowColors: false,
    showBorders: true,
    roundedCorners: true,
    showIcons: true,
    colorScheme: 'colorful',
    isDefault: false,
    isFavorite: false,
  },
  {
    name: 'Solo Pendientes',
    description: 'Muestra únicamente envíos pendientes',
    icon: '⏳',
    viewMode: 'table',
    density: 'normal',
    columns: DEFAULT_COLUMNS,
    filters: [
      {
        id: 'pending-filter',
        label: 'Solo Pendientes',
        field: 'estado',
        operator: 'in',
        value: ['PENDIENTE', 'PENDING', 'EN PROCESO'],
        active: true,
      },
    ],
    showHeaders: true,
    alternateRowColors: true,
    showBorders: true,
    roundedCorners: true,
    showIcons: true,
    colorScheme: 'default',
    isDefault: false,
    isFavorite: false,
  },
  {
    name: 'Alertas Críticas',
    description: 'Envíos con problemas que requieren atención',
    icon: '🚨',
    viewMode: 'cards',
    density: 'comfortable',
    columns: DEFAULT_COLUMNS,
    filters: [
      {
        id: 'alert-filter',
        label: 'Con Problemas',
        field: 'estado',
        operator: 'in',
        value: ['DEVOLUCION', 'NOVEDAD', 'EXCEPTION', 'RETURNED'],
        active: true,
      },
    ],
    showHeaders: true,
    alternateRowColors: false,
    showBorders: true,
    roundedCorners: true,
    showIcons: true,
    colorScheme: 'colorful',
    isDefault: false,
    isFavorite: true,
  },
];

interface ViewPreferencesState {
  // Configuración global activa
  globalConfig: {
    viewMode: ViewMode;
    density: DensityMode;
    columns: ColumnConfig[];
    groupBy?: GroupConfig;
    sortBy?: SortConfig;
    filters: QuickFilter[];
    showHeaders: boolean;
    alternateRowColors: boolean;
    showBorders: boolean;
    roundedCorners: boolean;
    showIcons: boolean;
    colorScheme: 'default' | 'minimal' | 'colorful' | 'dark';
  };

  // Presets guardados
  presets: ViewPreset[];
  activePresetId: string | null;

  // Configuraciones por sección
  sectionConfigs: Record<string, Partial<ViewPreset>>;

  // Acciones de configuración global
  setViewMode: (mode: ViewMode) => void;
  setDensity: (density: DensityMode) => void;
  setColorScheme: (scheme: 'default' | 'minimal' | 'colorful' | 'dark') => void;
  updateColumn: (columnId: string, updates: Partial<ColumnConfig>) => void;
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  reorderColumns: (columns: ColumnConfig[]) => void;
  setGroupBy: (config: GroupConfig | undefined) => void;
  setSortBy: (config: SortConfig | undefined) => void;
  toggleFilter: (filterId: string) => void;
  addFilter: (filter: QuickFilter) => void;
  removeFilter: (filterId: string) => void;
  toggleOption: (option: keyof Pick<ViewPreset, 'showHeaders' | 'alternateRowColors' | 'showBorders' | 'roundedCorners' | 'showIcons'>) => void;

  // Acciones de presets
  createPreset: (name: string, description?: string) => string;
  applyPreset: (presetId: string) => void;
  updatePreset: (presetId: string, updates: Partial<ViewPreset>) => void;
  deletePreset: (presetId: string) => void;
  toggleFavorite: (presetId: string) => void;
  getPreset: (presetId: string) => ViewPreset | null;

  // Configuración por sección
  getSectionConfig: (section: string) => Partial<ViewPreset>;
  setSectionConfig: (section: string, config: Partial<ViewPreset>) => void;

  // Utilidades
  resetToDefaults: () => void;
  exportPresets: () => string;
  importPresets: (json: string) => boolean;
}

export const useViewPreferencesStore = create<ViewPreferencesState>()(
  persist(
    (set, get) => ({
      globalConfig: {
        viewMode: 'table',
        density: 'normal',
        columns: DEFAULT_COLUMNS,
        filters: [],
        showHeaders: true,
        alternateRowColors: true,
        showBorders: true,
        roundedCorners: true,
        showIcons: true,
        colorScheme: 'default',
      },

      presets: DEFAULT_PRESETS.map((p, idx) => ({
        ...p,
        id: `preset-default-${idx}`,
        createdAt: new Date(),
        usageCount: 0,
      })),

      activePresetId: null,
      sectionConfigs: {},

      setViewMode: (mode) => {
        set((state) => ({
          globalConfig: { ...state.globalConfig, viewMode: mode },
        }));
      },

      setDensity: (density) => {
        set((state) => ({
          globalConfig: { ...state.globalConfig, density },
        }));
      },

      setColorScheme: (scheme) => {
        set((state) => ({
          globalConfig: { ...state.globalConfig, colorScheme: scheme },
        }));
      },

      updateColumn: (columnId, updates) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            columns: state.globalConfig.columns.map((c) =>
              c.id === columnId ? { ...c, ...updates } : c
            ),
          },
        }));
      },

      setColumnVisibility: (columnId, visible) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            columns: state.globalConfig.columns.map((c) =>
              c.id === columnId ? { ...c, visible } : c
            ),
          },
        }));
      },

      reorderColumns: (columns) => {
        set((state) => ({
          globalConfig: { ...state.globalConfig, columns },
        }));
      },

      setGroupBy: (config) => {
        set((state) => ({
          globalConfig: { ...state.globalConfig, groupBy: config },
        }));
      },

      setSortBy: (config) => {
        set((state) => ({
          globalConfig: { ...state.globalConfig, sortBy: config },
        }));
      },

      toggleFilter: (filterId) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            filters: state.globalConfig.filters.map((f) =>
              f.id === filterId ? { ...f, active: !f.active } : f
            ),
          },
        }));
      },

      addFilter: (filter) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            filters: [...state.globalConfig.filters, filter],
          },
        }));
      },

      removeFilter: (filterId) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            filters: state.globalConfig.filters.filter((f) => f.id !== filterId),
          },
        }));
      },

      toggleOption: (option) => {
        set((state) => ({
          globalConfig: {
            ...state.globalConfig,
            [option]: !state.globalConfig[option],
          },
        }));
      },

      createPreset: (name, description) => {
        const id = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { globalConfig } = get();

        const newPreset: ViewPreset = {
          id,
          name,
          description,
          viewMode: globalConfig.viewMode,
          density: globalConfig.density,
          columns: [...globalConfig.columns],
          groupBy: globalConfig.groupBy,
          sortBy: globalConfig.sortBy,
          filters: [...globalConfig.filters],
          showHeaders: globalConfig.showHeaders,
          alternateRowColors: globalConfig.alternateRowColors,
          showBorders: globalConfig.showBorders,
          roundedCorners: globalConfig.roundedCorners,
          showIcons: globalConfig.showIcons,
          colorScheme: globalConfig.colorScheme,
          isDefault: false,
          isFavorite: false,
          createdAt: new Date(),
          usageCount: 0,
        };

        set((state) => ({
          presets: [...state.presets, newPreset],
        }));

        return id;
      },

      applyPreset: (presetId) => {
        const preset = get().presets.find((p) => p.id === presetId);
        if (!preset) return;

        set((state) => ({
          globalConfig: {
            viewMode: preset.viewMode,
            density: preset.density,
            columns: [...preset.columns],
            groupBy: preset.groupBy,
            sortBy: preset.sortBy,
            filters: [...preset.filters],
            showHeaders: preset.showHeaders,
            alternateRowColors: preset.alternateRowColors,
            showBorders: preset.showBorders,
            roundedCorners: preset.roundedCorners,
            showIcons: preset.showIcons,
            colorScheme: preset.colorScheme,
          },
          activePresetId: presetId,
          presets: state.presets.map((p) =>
            p.id === presetId
              ? { ...p, usageCount: p.usageCount + 1, lastUsed: new Date() }
              : p
          ),
        }));
      },

      updatePreset: (presetId, updates) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === presetId ? { ...p, ...updates } : p
          ),
        }));
      },

      deletePreset: (presetId) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== presetId),
          activePresetId: state.activePresetId === presetId ? null : state.activePresetId,
        }));
      },

      toggleFavorite: (presetId) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === presetId ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
      },

      getPreset: (presetId) => {
        return get().presets.find((p) => p.id === presetId) || null;
      },

      getSectionConfig: (section) => {
        return get().sectionConfigs[section] || {};
      },

      setSectionConfig: (section, config) => {
        set((state) => ({
          sectionConfigs: {
            ...state.sectionConfigs,
            [section]: config,
          },
        }));
      },

      resetToDefaults: () => {
        set({
          globalConfig: {
            viewMode: 'table',
            density: 'normal',
            columns: DEFAULT_COLUMNS,
            filters: [],
            showHeaders: true,
            alternateRowColors: true,
            showBorders: true,
            roundedCorners: true,
            showIcons: true,
            colorScheme: 'default',
          },
          activePresetId: null,
        });
      },

      exportPresets: () => {
        const { presets } = get();
        return JSON.stringify(presets.filter((p) => !p.id.includes('default')), null, 2);
      },

      importPresets: (json) => {
        try {
          const imported = JSON.parse(json);
          if (!Array.isArray(imported)) return false;

          const newPresets = imported.map((p: any) => ({
            ...p,
            id: `preset-imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            usageCount: 0,
          }));

          set((state) => ({
            presets: [...state.presets, ...newPresets],
          }));

          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'litper-view-preferences',
    }
  )
);

export default useViewPreferencesStore;
