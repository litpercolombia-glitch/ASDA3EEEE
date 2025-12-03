// ============================================
// LITPER LOGÍSTICA PRO - TYPE DEFINITIONS
// Sistema Integral de Gestión y Análisis Logístico con IA
// ============================================

import { Shipment, ShipmentStatus, CarrierName } from '../types';

// ============================================
// TAB NAVIGATION TYPES
// ============================================

export type MainTabNew = 'seguimiento' | 'semaforo' | 'predicciones' | 'reporte' | 'asistente';

// ============================================
// GUIA RETRASADA (DELAYED SHIPMENT)
// ============================================

export type AlertLevel = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';

export interface GuiaRetrasada {
  guia: Shipment;
  diasSinMovimiento: number;
  ultimoEstado: string;
  ultimaFecha: Date;
  nivelAlerta: AlertLevel;
  recomendacionIA: string;
}

// ============================================
// SEMAFORO (TRAFFIC LIGHT) TYPES
// ============================================

export type SemaforoColor = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';

export interface CiudadSemaforo {
  ciudad: string;
  transportadora: string;
  entregas: number;
  devoluciones: number;
  total: number;
  tasaExito: number;
  tasaDevolucion: number;
  tiempoPromedio: number;
  semaforo: SemaforoColor;
  recomendacionIA: string;
}

export interface SemaforoExcelData {
  tasaEntregas: TasaEntregaRow[];
  tiempoPromedio: TiempoPromedioRow[];
}

export interface TasaEntregaRow {
  ciudad: string;
  transportadora: string;
  devoluciones: number;
  entregas: number;
  total: number;
}

export interface TiempoPromedioRow {
  ciudad: string;
  transportadora: string;
  dias: number;
}

// ============================================
// PREDICCIONES TYPES
// ============================================

export type Tendencia = 'MEJORANDO' | 'ESTABLE' | 'EMPEORANDO';

export interface AnalisisPrediccion {
  ciudad: string;
  transportadora: string;

  // Datos de guías rastreadas (tiempo real)
  guiasActivas: number;
  guiasRetrasadas: number;
  promedioRetrasoActual: number;

  // Datos históricos (Excel)
  tasaExitoHistorica: number;
  tiempoPromedioHistorico: number;

  // Comparativa
  tendencia: Tendencia;
  variacionVsHistorico: number;

  // Predicción IA
  probabilidadExito: number;
  riesgoDevolucion: number;
  tiempoEstimado: number;
  recomendaciones: string[];
}

// ============================================
// REPORTE IA TYPES
// ============================================

export interface ReporteIA {
  fechaGeneracion: Date;

  // Resumen ejecutivo
  resumenEjecutivo: {
    totalGuias: number;
    tasaExitoGeneral: number;
    guiasRetrasadas: number;
    alertasCriticas: number;
    recomendacionPrincipal: string;
  };

  // Por estado
  distribucionEstados: {
    estado: string;
    cantidad: number;
    porcentaje: number;
    guias: Shipment[];
  }[];

  // Por transportadora
  rendimientoTransportadoras: {
    nombre: string;
    guias: number;
    entregadas: number;
    tasaExito: number;
    tiempoPromedio: number;
    tendencia: 'UP' | 'DOWN' | 'STABLE';
  }[];

  // Patrones identificados
  patronesDetectados: PatronDetectado[];

  // Recomendaciones priorizadas
  recomendaciones: {
    prioridad: 1 | 2 | 3;
    titulo: string;
    descripcion: string;
    guiasAfectadas: Shipment[];
    accion: string;
  }[];
}

// ============================================
// PATTERN DETECTION TYPES
// ============================================

export type PatronTipo = 'RETRASO' | 'DEVOLUCION' | 'ZONA' | 'TRANSPORTADORA' | 'TIEMPO';
export type PatronImpacto = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';

export interface PatronDetectado {
  id: string;
  tipo: PatronTipo;
  titulo: string;
  descripcion: string;
  datosApoyo: {
    cantidad: number;
    porcentaje: number;
    guiasEjemplo: string[];
  };
  impacto: PatronImpacto;
  recomendacion: string;
  accionable: boolean;
  guiasAfectadas: Shipment[];
}

// ============================================
// ASISTENTE IA TYPES
// ============================================

export interface MensajeAsistente {
  id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  timestamp: Date;
  contexto?: {
    guiasReferenciadas?: string[];
    accionSugerida?: string;
  };
}

// ============================================
// APP STATE - INDEPENDENT TAB STATES
// ============================================

export interface SeguimientoState {
  guias: Shipment[];
  guiasRetrasadas: GuiaRetrasada[];
  lastUpdate: Date | null;
  filtros: {
    alertLevel: AlertLevel | 'ALL';
    transportadora: CarrierName | 'ALL';
    searchQuery: string;
  };
}

export interface SemaforoState {
  excelData: SemaforoExcelData | null;
  ciudadesSemaforo: CiudadSemaforo[];
  lastExcelUpload: Date | null;
  excelFileName: string | null;
  filtros: {
    semaforo: SemaforoColor | 'ALL';
    searchQuery: string;
  };
}

export interface PrediccionesState {
  analisis: AnalisisPrediccion[];
  patronesDetectados: PatronDetectado[];
  lastAnalysis: Date | null;
}

export interface ReporteState {
  reporteGenerado: ReporteIA | null;
  fechaGeneracion: Date | null;
  isGenerating: boolean;
}

export interface AsistenteState {
  conversacion: MensajeAsistente[];
  isLoading: boolean;
  contextoActual: string;
}

export interface AppStateNew {
  seguimiento: SeguimientoState;
  semaforo: SemaforoState;
  predicciones: PrediccionesState;
  reporte: ReporteState;
  asistente: AsistenteState;
}

// ============================================
// EXCEL UPLOAD TYPES
// ============================================

export interface ExcelPreviewData {
  fileName: string;
  sheets: string[];
  recordCounts: Record<string, number>;
  data: Record<string, any[]>;
}

export interface ExcelValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  preview?: ExcelPreviewData;
}

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  SEGUIMIENTO: 'litper_seguimiento_data',
  SEMAFORO: 'litper_semaforo_excel',
  PREDICCIONES: 'litper_predicciones_data',
  REPORTE: 'litper_reporte_cache',
  ASISTENTE: 'litper_asistente_history',
  THEME: 'litper_theme',
} as const;
