// ============================================
// SERVICIO DE FUENTES DE DATOS UNIFICADO
// Gestiona múltiples fuentes: Seguimiento Real vs Dropi
// MIGRADO: Usa StatusNormalizer como fuente única de verdad
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StatusNormalizer, detectCarrier } from './StatusNormalizer';
import {
  CanonicalStatus,
  CanonicalStatusLabels,
  ExceptionReason,
} from '../types/canonical.types';

// Tipos de fuente de datos
export type DataSourceType = 'seguimiento' | 'dropi' | 'combinado' | 'timeline';

// Evento en la línea de tiempo
export interface TimelineEvent {
  id: string;
  guia: string;
  timestamp: Date;
  source: 'seguimiento' | 'dropi';
  status: string;
  statusNormalized: string;
  details?: string;
  location?: string;
  carrier?: string;
}

// Registro unificado de guía
export interface UnifiedTrackingRecord {
  guia: string;
  cliente?: string;
  telefono?: string;
  ciudad?: string;
  carrier?: string;

  // Estado según cada fuente
  seguimientoStatus?: string;
  seguimientoDate?: Date;
  seguimientoDetails?: string;

  dropiStatus?: string;
  dropiDate?: Date;
  dropiDetails?: string;

  // Análisis de diferencias
  hasDiscrepancy: boolean;
  discrepancyType?: 'status_mismatch' | 'date_delay' | 'missing_in_source';
  discrepancyDetails?: string;

  // Timeline completo
  timeline: TimelineEvent[];

  // Metadatos
  lastUpdated: Date;
  createdAt: Date;
}

// Configuración de fuente
export interface DataSourceConfig {
  activeSource: DataSourceType;
  autoDetectDiscrepancies: boolean;
  showTimelineByDefault: boolean;
  highlightDifferences: boolean;
  preferredSourceForConflicts: 'seguimiento' | 'dropi' | 'most_recent';
}

// Mapeo de CanonicalStatus a string para compatibilidad con sistema existente
const CANONICAL_TO_STRING: Record<CanonicalStatus, string> = {
  [CanonicalStatus.CREATED]: 'CREATED',
  [CanonicalStatus.PROCESSING]: 'PROCESSING',
  [CanonicalStatus.SHIPPED]: 'SHIPPED',
  [CanonicalStatus.IN_TRANSIT]: 'IN_TRANSIT',
  [CanonicalStatus.OUT_FOR_DELIVERY]: 'OUT_FOR_DELIVERY',
  [CanonicalStatus.IN_OFFICE]: 'IN_OFFICE',
  [CanonicalStatus.DELIVERED]: 'DELIVERED',
  [CanonicalStatus.ISSUE]: 'EXCEPTION',
  [CanonicalStatus.RETURNED]: 'RETURNED',
  [CanonicalStatus.CANCELLED]: 'CANCELLED',
};

/**
 * Normaliza un estado usando StatusNormalizer (fuente única de verdad)
 */
function normalizeStatus(status: string, carrier?: string): string {
  const carrierCode = carrier ? detectCarrier(carrier) : 'UNKNOWN';
  const normalized = StatusNormalizer.normalize(status, carrierCode);
  return CANONICAL_TO_STRING[normalized.status] || status.toUpperCase().replace(/\s+/g, '_');
}

/**
 * Obtiene el estado canónico completo
 */
function getCanonicalStatus(status: string, carrier?: string) {
  const carrierCode = carrier ? detectCarrier(carrier) : 'UNKNOWN';
  return StatusNormalizer.normalize(status, carrierCode);
}

// Detectar discrepancias entre fuentes
function detectDiscrepancy(record: Partial<UnifiedTrackingRecord>): {
  hasDiscrepancy: boolean;
  type?: 'status_mismatch' | 'date_delay' | 'missing_in_source';
  details?: string;
} {
  if (!record.seguimientoStatus && !record.dropiStatus) {
    return { hasDiscrepancy: false };
  }

  // Una fuente tiene datos y la otra no
  if (record.seguimientoStatus && !record.dropiStatus) {
    return {
      hasDiscrepancy: true,
      type: 'missing_in_source',
      details: 'Solo existe en Seguimiento Real, no en Dropi',
    };
  }

  if (!record.seguimientoStatus && record.dropiStatus) {
    return {
      hasDiscrepancy: true,
      type: 'missing_in_source',
      details: 'Solo existe en Dropi, no en Seguimiento Real',
    };
  }

  // Ambas fuentes tienen datos - comparar estados usando StatusNormalizer
  const normalizedSeguimiento = normalizeStatus(record.seguimientoStatus!, record.carrier);
  const normalizedDropi = normalizeStatus(record.dropiStatus!, record.carrier);

  if (normalizedSeguimiento !== normalizedDropi) {
    // Casos especiales de discrepancia importantes
    if (normalizedSeguimiento === 'DELIVERED' && normalizedDropi !== 'DELIVERED') {
      return {
        hasDiscrepancy: true,
        type: 'status_mismatch',
        details: `Seguimiento dice ENTREGADO pero Dropi dice "${record.dropiStatus}"`,
      };
    }

    if (normalizedDropi === 'DELIVERED' && normalizedSeguimiento !== 'DELIVERED') {
      return {
        hasDiscrepancy: true,
        type: 'status_mismatch',
        details: `Dropi dice ENTREGADO pero Seguimiento dice "${record.seguimientoStatus}"`,
      };
    }

    return {
      hasDiscrepancy: true,
      type: 'status_mismatch',
      details: `Estados diferentes: Seguimiento="${record.seguimientoStatus}" vs Dropi="${record.dropiStatus}"`,
    };
  }

  // Verificar retraso en fechas (Dropi suele estar retrasado)
  if (record.seguimientoDate && record.dropiDate) {
    const diffHours = (record.seguimientoDate.getTime() - record.dropiDate.getTime()) / (1000 * 60 * 60);
    if (Math.abs(diffHours) > 24) {
      return {
        hasDiscrepancy: true,
        type: 'date_delay',
        details: `Diferencia de ${Math.abs(Math.round(diffHours))} horas entre fuentes`,
      };
    }
  }

  return { hasDiscrepancy: false };
}

interface DataSourceState {
  // Configuración
  config: DataSourceConfig;

  // Datos unificados
  unifiedRecords: Record<string, UnifiedTrackingRecord>;

  // Estadísticas
  stats: {
    totalRecords: number;
    withDiscrepancies: number;
    onlyInSeguimiento: number;
    onlyInDropi: number;
    lastSyncSeguimiento?: Date;
    lastSyncDropi?: Date;
  };

  // Acciones
  setActiveSource: (source: DataSourceType) => void;
  updateConfig: (config: Partial<DataSourceConfig>) => void;

  // Cargar datos desde fuentes
  loadFromSeguimiento: (data: any[]) => void;
  loadFromDropi: (data: any[]) => void;

  // Obtener datos según fuente activa
  getRecords: () => UnifiedTrackingRecord[];
  getRecordByGuia: (guia: string) => UnifiedTrackingRecord | null;
  getDiscrepancies: () => UnifiedTrackingRecord[];

  // Timeline
  getTimelineForGuia: (guia: string) => TimelineEvent[];

  // Utilidades
  clearAllData: () => void;
  recalculateDiscrepancies: () => void;
}

export const useDataSourceStore = create<DataSourceState>()(
  persist(
    (set, get) => ({
      config: {
        activeSource: 'combinado',
        autoDetectDiscrepancies: true,
        showTimelineByDefault: false,
        highlightDifferences: true,
        preferredSourceForConflicts: 'seguimiento',
      },

      unifiedRecords: {},

      stats: {
        totalRecords: 0,
        withDiscrepancies: 0,
        onlyInSeguimiento: 0,
        onlyInDropi: 0,
      },

      setActiveSource: (source) => {
        set((state) => ({
          config: { ...state.config, activeSource: source },
        }));
      },

      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
      },

      loadFromSeguimiento: (data) => {
        set((state) => {
          const records = { ...state.unifiedRecords };

          data.forEach((item) => {
            const guia = item.guia || item.trackingNumber || item.id;
            if (!guia) return;

            const existing = records[guia] || {
              guia,
              timeline: [],
              hasDiscrepancy: false,
              lastUpdated: new Date(),
              createdAt: new Date(),
            };

            // Actualizar datos de seguimiento
            existing.seguimientoStatus = item.status || item.estado;
            existing.seguimientoDate = item.date ? new Date(item.date) : new Date();
            existing.seguimientoDetails = item.details || item.descripcion;
            existing.cliente = item.cliente || item.customer || existing.cliente;
            existing.telefono = item.telefono || item.phone || existing.telefono;
            existing.ciudad = item.ciudad || item.city || existing.ciudad;
            existing.carrier = item.carrier || item.transportadora || existing.carrier;

            // Agregar evento a timeline usando StatusNormalizer
            existing.timeline.push({
              id: `seg-${Date.now()}-${Math.random()}`,
              guia,
              timestamp: existing.seguimientoDate,
              source: 'seguimiento',
              status: existing.seguimientoStatus,
              statusNormalized: normalizeStatus(existing.seguimientoStatus, existing.carrier),
              details: existing.seguimientoDetails,
              location: existing.ciudad,
              carrier: existing.carrier,
            });

            // Detectar discrepancias
            const discrepancy = detectDiscrepancy(existing);
            existing.hasDiscrepancy = discrepancy.hasDiscrepancy;
            existing.discrepancyType = discrepancy.type;
            existing.discrepancyDetails = discrepancy.details;

            existing.lastUpdated = new Date();
            records[guia] = existing;
          });

          // Recalcular estadísticas
          const allRecords = Object.values(records);
          return {
            unifiedRecords: records,
            stats: {
              totalRecords: allRecords.length,
              withDiscrepancies: allRecords.filter(r => r.hasDiscrepancy).length,
              onlyInSeguimiento: allRecords.filter(r => r.seguimientoStatus && !r.dropiStatus).length,
              onlyInDropi: allRecords.filter(r => !r.seguimientoStatus && r.dropiStatus).length,
              lastSyncSeguimiento: new Date(),
              lastSyncDropi: state.stats.lastSyncDropi,
            },
          };
        });
      },

      loadFromDropi: (data) => {
        set((state) => {
          const records = { ...state.unifiedRecords };

          data.forEach((item) => {
            const guia = item.guia || item.trackingNumber || item.numero_guia || item.id;
            if (!guia) return;

            const existing = records[guia] || {
              guia,
              timeline: [],
              hasDiscrepancy: false,
              lastUpdated: new Date(),
              createdAt: new Date(),
            };

            // Actualizar datos de Dropi
            existing.dropiStatus = item.status || item.estado || item.estado_envio;
            existing.dropiDate = item.date ? new Date(item.date) : new Date();
            existing.dropiDetails = item.details || item.descripcion || item.observacion;
            existing.cliente = item.cliente || item.customer || item.nombre_cliente || existing.cliente;
            existing.telefono = item.telefono || item.phone || item.celular || existing.telefono;
            existing.ciudad = item.ciudad || item.city || item.ciudad_destino || existing.ciudad;
            existing.carrier = item.carrier || item.transportadora || existing.carrier;

            // Agregar evento a timeline usando StatusNormalizer
            existing.timeline.push({
              id: `dropi-${Date.now()}-${Math.random()}`,
              guia,
              timestamp: existing.dropiDate,
              source: 'dropi',
              status: existing.dropiStatus,
              statusNormalized: normalizeStatus(existing.dropiStatus, existing.carrier),
              details: existing.dropiDetails,
              location: existing.ciudad,
              carrier: existing.carrier,
            });

            // Detectar discrepancias
            const discrepancy = detectDiscrepancy(existing);
            existing.hasDiscrepancy = discrepancy.hasDiscrepancy;
            existing.discrepancyType = discrepancy.type;
            existing.discrepancyDetails = discrepancy.details;

            existing.lastUpdated = new Date();
            records[guia] = existing;
          });

          // Recalcular estadísticas
          const allRecords = Object.values(records);
          return {
            unifiedRecords: records,
            stats: {
              totalRecords: allRecords.length,
              withDiscrepancies: allRecords.filter(r => r.hasDiscrepancy).length,
              onlyInSeguimiento: allRecords.filter(r => r.seguimientoStatus && !r.dropiStatus).length,
              onlyInDropi: allRecords.filter(r => !r.seguimientoStatus && r.dropiStatus).length,
              lastSyncSeguimiento: state.stats.lastSyncSeguimiento,
              lastSyncDropi: new Date(),
            },
          };
        });
      },

      getRecords: () => {
        const state = get();
        const records = Object.values(state.unifiedRecords);

        switch (state.config.activeSource) {
          case 'seguimiento':
            return records.filter(r => r.seguimientoStatus);
          case 'dropi':
            return records.filter(r => r.dropiStatus);
          case 'timeline':
          case 'combinado':
          default:
            return records;
        }
      },

      getRecordByGuia: (guia) => {
        return get().unifiedRecords[guia] || null;
      },

      getDiscrepancies: () => {
        return Object.values(get().unifiedRecords).filter(r => r.hasDiscrepancy);
      },

      getTimelineForGuia: (guia) => {
        const record = get().unifiedRecords[guia];
        if (!record) return [];

        return record.timeline.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      clearAllData: () => {
        set({
          unifiedRecords: {},
          stats: {
            totalRecords: 0,
            withDiscrepancies: 0,
            onlyInSeguimiento: 0,
            onlyInDropi: 0,
          },
        });
      },

      recalculateDiscrepancies: () => {
        set((state) => {
          const records = { ...state.unifiedRecords };

          Object.keys(records).forEach((guia) => {
            const record = records[guia];
            const discrepancy = detectDiscrepancy(record);
            record.hasDiscrepancy = discrepancy.hasDiscrepancy;
            record.discrepancyType = discrepancy.type;
            record.discrepancyDetails = discrepancy.details;
          });

          const allRecords = Object.values(records);
          return {
            unifiedRecords: records,
            stats: {
              ...state.stats,
              withDiscrepancies: allRecords.filter(r => r.hasDiscrepancy).length,
            },
          };
        });
      },
    }),
    {
      name: 'litper-data-sources',
    }
  )
);

export default useDataSourceStore;
