// ============================================
// SERVICIO DE CONFIGURACIÓN DE CARGA EXCEL
// Permite personalizar qué columnas y filas cargar
// Protegido con contraseña: LITPERTUPAPA
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Contraseña para acceder a configuración avanzada
export const CONFIG_PASSWORD = 'LITPERTUPAPA';

// Tipos de datos reconocidos
export type ColumnDataType = 'text' | 'number' | 'date' | 'phone' | 'currency' | 'status' | 'auto';

// Mapeo de columna
export interface ColumnMapping {
  excelColumn: string; // A, B, C, etc.
  excelHeader?: string; // Nombre del encabezado detectado
  mappedTo: string; // Campo al que se mapea (guia, telefono, ciudad, etc.)
  dataType: ColumnDataType;
  enabled: boolean;
  transform?: string; // Transformación opcional (uppercase, trim, etc.)
  defaultValue?: string; // Valor por defecto si está vacío
}

// Configuración de carga
export interface ExcelLoadConfig {
  id: string;
  name: string;
  description?: string;

  // Configuración de filas
  startRow: number; // Fila inicial (1-based)
  endRow?: number; // Fila final (opcional, null = hasta el final)
  skipEmptyRows: boolean;
  hasHeaderRow: boolean;
  headerRowIndex: number; // Índice de la fila de encabezados

  // Mapeo de columnas
  columnMappings: ColumnMapping[];

  // Filtros opcionales
  filters?: {
    column: string;
    operator: 'equals' | 'contains' | 'not_empty' | 'greater_than' | 'less_than';
    value: string;
  }[];

  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed?: Date;
}

// Campos disponibles para mapear
export const AVAILABLE_FIELDS = [
  { id: 'guia', label: 'Número de Guía', required: true },
  { id: 'telefono', label: 'Teléfono/Celular', required: false },
  { id: 'cliente', label: 'Nombre del Cliente', required: false },
  { id: 'ciudad', label: 'Ciudad', required: false },
  { id: 'departamento', label: 'Departamento', required: false },
  { id: 'direccion', label: 'Dirección', required: false },
  { id: 'estado', label: 'Estado/Status', required: false },
  { id: 'fecha', label: 'Fecha', required: false },
  { id: 'transportadora', label: 'Transportadora', required: false },
  { id: 'valor', label: 'Valor/Monto', required: false },
  { id: 'producto', label: 'Producto', required: false },
  { id: 'cantidad', label: 'Cantidad', required: false },
  { id: 'observaciones', label: 'Observaciones', required: false },
  { id: 'vendedor', label: 'Vendedor', required: false },
  { id: 'omitir', label: '(Omitir columna)', required: false },
];

// Plantillas predefinidas
export const PRESET_TEMPLATES: Omit<ExcelLoadConfig, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
  {
    name: 'Reporte Dropi Estándar',
    description: 'Configuración para reportes exportados de Dropi',
    startRow: 2,
    skipEmptyRows: true,
    hasHeaderRow: true,
    headerRowIndex: 1,
    columnMappings: [
      { excelColumn: 'A', mappedTo: 'guia', dataType: 'text', enabled: true },
      { excelColumn: 'B', mappedTo: 'cliente', dataType: 'text', enabled: true },
      { excelColumn: 'C', mappedTo: 'telefono', dataType: 'phone', enabled: true },
      { excelColumn: 'D', mappedTo: 'ciudad', dataType: 'text', enabled: true },
      { excelColumn: 'E', mappedTo: 'estado', dataType: 'status', enabled: true },
      { excelColumn: 'F', mappedTo: 'fecha', dataType: 'date', enabled: true },
      { excelColumn: 'G', mappedTo: 'transportadora', dataType: 'text', enabled: true },
      { excelColumn: 'H', mappedTo: 'valor', dataType: 'currency', enabled: true },
    ],
  },
  {
    name: 'Lista de Teléfonos Simple',
    description: 'Solo guía y teléfono',
    startRow: 1,
    skipEmptyRows: true,
    hasHeaderRow: false,
    headerRowIndex: 0,
    columnMappings: [
      { excelColumn: 'A', mappedTo: 'guia', dataType: 'text', enabled: true },
      { excelColumn: 'B', mappedTo: 'telefono', dataType: 'phone', enabled: true },
    ],
  },
  {
    name: 'Reporte Coordinadora',
    description: 'Formato de reporte de Coordinadora',
    startRow: 2,
    skipEmptyRows: true,
    hasHeaderRow: true,
    headerRowIndex: 1,
    columnMappings: [
      { excelColumn: 'A', mappedTo: 'guia', dataType: 'text', enabled: true },
      { excelColumn: 'B', mappedTo: 'fecha', dataType: 'date', enabled: true },
      { excelColumn: 'C', mappedTo: 'cliente', dataType: 'text', enabled: true },
      { excelColumn: 'D', mappedTo: 'ciudad', dataType: 'text', enabled: true },
      { excelColumn: 'E', mappedTo: 'estado', dataType: 'status', enabled: true },
    ],
  },
  {
    name: 'Reporte Servientrega',
    description: 'Formato de reporte de Servientrega',
    startRow: 3,
    skipEmptyRows: true,
    hasHeaderRow: true,
    headerRowIndex: 2,
    columnMappings: [
      { excelColumn: 'B', mappedTo: 'guia', dataType: 'text', enabled: true },
      { excelColumn: 'C', mappedTo: 'cliente', dataType: 'text', enabled: true },
      { excelColumn: 'E', mappedTo: 'ciudad', dataType: 'text', enabled: true },
      { excelColumn: 'G', mappedTo: 'estado', dataType: 'status', enabled: true },
      { excelColumn: 'H', mappedTo: 'fecha', dataType: 'date', enabled: true },
    ],
  },
];

interface ExcelConfigState {
  // Autenticación
  isAuthenticated: boolean;
  authenticate: (password: string) => boolean;
  logout: () => void;

  // Configuraciones guardadas
  configs: ExcelLoadConfig[];
  activeConfigId: string | null;

  // Acciones
  createConfig: (config: Omit<ExcelLoadConfig, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
  updateConfig: (id: string, updates: Partial<ExcelLoadConfig>) => void;
  deleteConfig: (id: string) => void;
  duplicateConfig: (id: string) => string;
  setActiveConfig: (id: string | null) => void;

  // Obtener configuraciones
  getConfig: (id: string) => ExcelLoadConfig | null;
  getActiveConfig: () => ExcelLoadConfig | null;

  // Procesar Excel con configuración
  processExcelData: (data: any[][], configId?: string) => any[];

  // Utilidades
  exportConfig: (id: string) => string;
  importConfig: (json: string) => string | null;
  incrementUsage: (id: string) => void;
}

export const useExcelConfigStore = create<ExcelConfigState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      configs: [],
      activeConfigId: null,

      authenticate: (password) => {
        const isValid = password === CONFIG_PASSWORD;
        if (isValid) {
          set({ isAuthenticated: true });
        }
        return isValid;
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      createConfig: (config) => {
        const id = `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newConfig: ExcelLoadConfig = {
          ...config,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };

        set((state) => ({
          configs: [...state.configs, newConfig],
        }));

        return id;
      },

      updateConfig: (id, updates) => {
        set((state) => ({
          configs: state.configs.map((c) =>
            c.id === id
              ? { ...c, ...updates, updatedAt: new Date() }
              : c
          ),
        }));
      },

      deleteConfig: (id) => {
        set((state) => ({
          configs: state.configs.filter((c) => c.id !== id),
          activeConfigId: state.activeConfigId === id ? null : state.activeConfigId,
        }));
      },

      duplicateConfig: (id) => {
        const original = get().configs.find((c) => c.id === id);
        if (!original) return '';

        const newId = `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duplicate: ExcelLoadConfig = {
          ...original,
          id: newId,
          name: `${original.name} (copia)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
        };

        set((state) => ({
          configs: [...state.configs, duplicate],
        }));

        return newId;
      },

      setActiveConfig: (id) => {
        set({ activeConfigId: id });
      },

      getConfig: (id) => {
        return get().configs.find((c) => c.id === id) || null;
      },

      getActiveConfig: () => {
        const { configs, activeConfigId } = get();
        return configs.find((c) => c.id === activeConfigId) || null;
      },

      processExcelData: (data, configId) => {
        const config = configId ? get().getConfig(configId) : get().getActiveConfig();
        if (!config || data.length === 0) return [];

        const results: any[] = [];
        const startIdx = config.startRow - 1; // Convertir a 0-based
        const endIdx = config.endRow ? config.endRow - 1 : data.length - 1;

        // Función para convertir letra de columna a índice
        const columnToIndex = (col: string): number => {
          let index = 0;
          for (let i = 0; i < col.length; i++) {
            index = index * 26 + (col.charCodeAt(i) - 64);
          }
          return index - 1; // 0-based
        };

        for (let rowIdx = startIdx; rowIdx <= endIdx && rowIdx < data.length; rowIdx++) {
          const row = data[rowIdx];
          if (!row) continue;

          // Verificar si la fila está vacía
          if (config.skipEmptyRows && row.every((cell: any) => !cell || cell === '')) {
            continue;
          }

          const record: Record<string, any> = {};

          config.columnMappings.forEach((mapping) => {
            if (!mapping.enabled || mapping.mappedTo === 'omitir') return;

            const colIndex = columnToIndex(mapping.excelColumn.toUpperCase());
            let value = row[colIndex];

            // Aplicar valor por defecto si está vacío
            if ((value === undefined || value === null || value === '') && mapping.defaultValue) {
              value = mapping.defaultValue;
            }

            // Aplicar transformación según tipo de dato
            if (value !== undefined && value !== null) {
              switch (mapping.dataType) {
                case 'phone':
                  value = String(value).replace(/\D/g, '');
                  if (value.length === 10 && !value.startsWith('57')) {
                    value = '57' + value;
                  }
                  break;
                case 'number':
                  value = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
                  break;
                case 'currency':
                  value = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
                  break;
                case 'date':
                  if (typeof value === 'number') {
                    // Excel date serial number
                    const date = new Date((value - 25569) * 86400 * 1000);
                    value = date.toISOString();
                  } else if (typeof value === 'string') {
                    value = new Date(value).toISOString();
                  }
                  break;
                case 'status':
                  value = String(value).trim().toUpperCase();
                  break;
                default:
                  value = String(value).trim();
              }

              // Aplicar transformación adicional si existe
              if (mapping.transform) {
                switch (mapping.transform) {
                  case 'uppercase':
                    value = String(value).toUpperCase();
                    break;
                  case 'lowercase':
                    value = String(value).toLowerCase();
                    break;
                  case 'trim':
                    value = String(value).trim();
                    break;
                }
              }
            }

            record[mapping.mappedTo] = value;
          });

          // Solo agregar si tiene al menos el campo de guía
          if (record.guia) {
            results.push(record);
          }
        }

        return results;
      },

      exportConfig: (id) => {
        const config = get().configs.find((c) => c.id === id);
        if (!config) return '';
        return JSON.stringify(config, null, 2);
      },

      importConfig: (json) => {
        try {
          const config = JSON.parse(json);
          if (!config.name || !config.columnMappings) {
            return null;
          }

          const id = `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const imported: ExcelLoadConfig = {
            ...config,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
            usageCount: 0,
          };

          set((state) => ({
            configs: [...state.configs, imported],
          }));

          return id;
        } catch {
          return null;
        }
      },

      incrementUsage: (id) => {
        set((state) => ({
          configs: state.configs.map((c) =>
            c.id === id
              ? { ...c, usageCount: c.usageCount + 1, lastUsed: new Date() }
              : c
          ),
        }));
      },
    }),
    {
      name: 'litper-excel-config',
    }
  )
);

export default useExcelConfigStore;
