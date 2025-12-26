// types/carga.types.ts
// Tipos para el sistema de cargas

export interface GuiaCarga {
  id: string;
  numeroGuia: string;
  estado: string;
  estadoReal?: string; // Estado extraído del último movimiento real
  transportadora: string;
  ciudadDestino: string;
  telefono?: string;
  nombreCliente?: string;
  direccion?: string;
  diasTransito: number;
  tieneNovedad: boolean;
  tipoNovedad?: string;
  descripcionNovedad?: string;
  valorDeclarado?: number;
  fechaGeneracion?: Date;
  ultimoMovimiento?: string;
  fechaUltimoMovimiento?: Date;
  historialEventos?: EventoGuia[];
  fuente: 'PHONES' | 'REPORT' | 'SUMMARY' | 'EXCEL' | 'MANUAL';
  datosExtra?: Record<string, unknown>;
  // Campos de revisión
  revisada: boolean;
  fechaRevision?: Date;
  revisadoPor?: string;
  revisadoPorId?: string;
}

export interface EventoGuia {
  fecha: Date;
  descripcion: string;
  ubicacion?: string;
  estado?: string;
}

export interface Carga {
  id: string;
  fecha: string; // YYYY-MM-DD
  numeroCarga: number; // 1, 2, 3... del día
  nombre: string; // "18-Dic-2025 Carga #1"

  // Usuario
  usuarioId: string;
  usuarioNombre: string;
  usuarioEmail?: string;

  // Guías
  guias: GuiaCarga[];
  totalGuias: number;

  // Estadísticas rápidas
  stats: CargaStats;

  // Estado
  estado: 'activa' | 'cerrada' | 'archivada';
  archivedAt?: Date; // Para auto-eliminación a las 24h

  // Timestamps
  creadaEn: Date;
  actualizadaEn: Date;
  cerradaEn?: Date;

  // Metadata
  notas?: string;
  tags?: string[];
  transportadorasUsadas?: string[]; // Lista de transportadoras en esta carga

  // Estadísticas de revisión
  guiasRevisadas: number;
  guiasPendientes: number;
}

export interface CargaStats {
  totalGuias: number;
  entregadas: number;
  enTransito: number;
  conNovedad: number;
  devueltas: number;
  otros: number;
  porcentajeEntrega: number;
  diasPromedioTransito: number;
  transportadoras: Record<string, number>;
  ciudades: Record<string, number>;
}

export interface CargaDia {
  fecha: string; // YYYY-MM-DD
  cargas: CargaResumen[];
  totalGuias: number;
  totalCargas: number;
}

export interface CargaResumen {
  id: string;
  numeroCarga: number;
  nombre: string;
  totalGuias: number;
  usuarioNombre: string;
  estado: 'activa' | 'cerrada' | 'archivada';
  creadaEn: Date;
  stats: {
    entregadas: number;
    conNovedad: number;
  };
}

export interface FiltrosCarga {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: string;
  estado?: 'activa' | 'cerrada' | 'archivada' | 'todas';
  busqueda?: string; // Buscar por número de guía
  transportadora?: string;
  ciudadDestino?: string;
  soloConNovedad?: boolean;
}

export interface CargaHistorial {
  fechas: CargaDia[];
  totalCargas: number;
  totalGuias: number;
  rangoFechas: {
    desde: string;
    hasta: string;
  };
}

// Eventos del sistema de cargas
export type CargaEventType =
  | 'carga.creada'
  | 'carga.actualizada'
  | 'carga.cerrada'
  | 'carga.eliminada'
  | 'guia.agregada'
  | 'guia.actualizada'
  | 'guia.eliminada';

export interface CargaEvent {
  tipo: CargaEventType;
  cargaId: string;
  usuarioId: string;
  timestamp: Date;
  datos?: Record<string, unknown>;
}

// ==================== SISTEMA DE USUARIOS ====================

export interface UsuarioCarga {
  id: string;
  nombre: string;
  creadoEn: Date;
  ultimaActividad: Date;
  totalCargas: number;
  totalGuiasRevisadas: number;
}

// ==================== MAPEO DE ESTATUS ====================

export interface MapeoEstatus {
  descripcionOriginal: string;
  estadoNormalizado: string;
  transportadora: string;
}

// Estados normalizados del sistema
export type EstadoNormalizado =
  | 'Entregado'
  | 'En Tránsito'
  | 'En Reparto'
  | 'En Destino'
  | 'En Oficina'
  | 'Intento Fallido'
  | 'Novedad'
  | 'Devuelto'
  | 'Recibido'
  | 'Creado'
  | 'Desconocido';

// Informe de revisión
export interface InformeRevision {
  totalGuias: number;
  revisadas: number;
  pendientes: number;
  porcentajeRevision: number;
  porTransportadora: Record<string, { revisadas: number; pendientes: number }>;
  guiasRevisadas: GuiaCarga[];
  guiasPendientes: GuiaCarga[];
}
