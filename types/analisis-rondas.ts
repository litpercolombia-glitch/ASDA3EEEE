/**
 * 📊 TIPOS PARA ANÁLISIS DE RONDAS LITPER
 * Sistema de control y métricas de rondas logísticas
 */

// ===== AUTENTICACIÓN =====
export interface AuthState {
  usuario: string | null;
  esAdmin: boolean;
  autenticado: boolean;
}

export interface UsuarioOperador {
  id: string;
  nombre: string;
}

// ===== DATOS CSV =====
export interface RondaCSV {
  usuario: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  rondaNumero: number;
  guiasIniciales: number;
  guiasRealizadas: number;
  canceladas: number;
  agendadas: number;
  pendientes: number;
  tiempoRegistro: number; // minutos
  novedades: number;
}

export interface DatosCSVProcesados {
  rondas: RondaCSV[];
  fechaProcesamiento: string;
  archivoNombre: string;
  totalRegistros: number;
  duplicadosEliminados: number;
}

// ===== MÉTRICAS =====
export type EstadoRendimiento = 'excelente' | 'bueno' | 'regular' | 'bajo';
export type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo' | 'gris';
export type NivelRacha = 'fuego' | 'caliente' | 'encendido' | 'inicio' | 'ninguno';

// Métricas avanzadas por usuario
export interface MetricasAvanzadasUsuario {
  // Eficiencia basada en 3 min/guía
  eficiencia: number;           // (Guías × 3) / Tiempo Real × 100
  eficienciaEstado: EstadoRendimiento;

  // Meta diaria
  metaDiaria: {
    guiasHoy: number;
    metaGuias: number;          // 80 por defecto
    progreso: number;           // porcentaje
    horasRestantes: number;     // basado en ritmo actual
  };

  // Racha de días consecutivos
  racha: {
    dias: number;
    nivel: NivelRacha;
    icono: string;
  };

  // Semáforo
  semaforo: EstadoSemaforo;

  // Análisis por horario
  analisisPorHorario: {
    mejorHora: string;
    peorHora: string;
    guiasPorHora: { hora: string; guias: number; eficiencia: number }[];
  };

  // Resumen del día
  resumenDia: {
    numero1: { valor: number; label: string; icono: string };
    numero2: { valor: number; label: string; icono: string };
    numero3: { valor: number; label: string; icono: string };
  };
}

// Anomalías detectadas
export interface Anomalia {
  id: string;
  tipo: 'tiempo_imposible' | 'guias_cero' | 'eficiencia_anormal' | 'datos_faltantes';
  usuario: string;
  descripcion: string;
  valor: number;
  valorEsperado: number;
  severidad: 'alta' | 'media' | 'baja';
  fecha?: string;
  ronda?: number;
}

// Problema detectado
export interface Problema {
  id: string;
  titulo: string;
  descripcion: string;
  usuariosAfectados: string[];
  impacto: number; // 1-100
  categoria: 'rendimiento' | 'tiempo' | 'novedades' | 'anomalias';
  icono: string;
}

export interface MetricasUsuario {
  usuario: string;
  totalRondas: number;
  totalGuiasIniciales: number;
  guiasRealizadas: number;
  canceladas: number;
  agendadas: number;
  pendientes: number;
  novedades: number;
  tasaExito: number; // porcentaje
  guiasPorHora: number;
  tiempoPromedio: number; // minutos
  tiempoTotal: number; // minutos
  estado: EstadoRendimiento;
  alertas: AlertaPersonal[];
  tendencia: 'subiendo' | 'estable' | 'bajando';
  // Nuevas métricas avanzadas
  avanzadas?: MetricasAvanzadasUsuario;
}

export interface MetricasGlobales {
  fecha: string;
  tasaExitoEquipo: number;
  totalGuiasProcesadas: number;
  totalGuiasRealizadas: number;
  totalRondas: number;
  usuariosActivos: number;
  ratioNovedades: number;
  ratioCancelaciones: number;
  duplicadosDetectados: number;
  rondasConTiempoCero: number;
  ranking: MetricasUsuario[];
  distribucionEstados: {
    excelente: number;
    bueno: number;
    regular: number;
    bajo: number;
  };
  metaEquipo: number; // 85% por defecto
  // Nuevas métricas avanzadas
  eficienciaEquipo?: number;       // Eficiencia promedio del equipo
  top3Problemas?: Problema[];      // Top 3 problemas del día
  anomalias?: Anomalia[];          // Anomalías detectadas
  semaforoEquipo?: {               // Distribución semáforo
    verde: number;
    amarillo: number;
    rojo: number;
    gris: number;
  };
}

// ===== ALERTAS =====
export type TipoAlerta = 'critico' | 'urgente' | 'atencion' | 'info';

export interface AlertaPersonal {
  id: string;
  tipo: TipoAlerta;
  mensaje: string;
  accion?: string;
  icono?: string;
}

export interface AlertaGlobal {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  descripcion: string;
  usuariosAfectados?: string[];
  valor?: number;
  umbral?: number;
  icono?: string;
}

// ===== RECOMENDACIONES =====
export type PrioridadRecomendacion = 'alta' | 'media' | 'baja';

export interface Recomendacion {
  id: string;
  prioridad: PrioridadRecomendacion;
  titulo: string;
  descripcion: string;
  accion: string;
  categoria: 'rendimiento' | 'novedades' | 'capacitacion' | 'redistribucion' | 'investigacion';
  icono?: string;
}

// ===== HISTÓRICO =====
export interface ReporteHistorico {
  id: string;
  fecha: string;
  archivoNombre: string;
  metricas: MetricasGlobales;
  alertas: AlertaGlobal[];
  recomendaciones: Recomendacion[];
}

// ===== PROPS DE COMPONENTES =====
export interface LoginSelectorProps {
  onLogin: (auth: AuthState) => void;
}

export interface OperadorDashboardProps {
  usuario: string;
  datos: MetricasGlobales | null;
  onCargarCSV: (file: File) => Promise<void>;
  onLogout: () => void;
}

export interface AdminDashboardProps {
  datos: MetricasGlobales | null;
  historico: ReporteHistorico[];
  onCargarCSV: (file: File) => Promise<void>;
  onLogout: () => void;
  onExportar: (tipo: 'excel' | 'pdf') => void;
}

export interface MetricasCardProps {
  titulo: string;
  valor: string | number;
  icono: React.ReactNode;
  color: string;
  tendencia?: 'subiendo' | 'estable' | 'bajando';
  cambio?: number;
  subtitulo?: string;
}

export interface RankingTableProps {
  ranking: MetricasUsuario[];
  onVerDetalle?: (usuario: string) => void;
}

export interface AlertasPanelProps {
  alertas: AlertaPersonal[] | AlertaGlobal[];
  tipo: 'personal' | 'global';
}

export interface RecomendacionesPanelProps {
  recomendaciones: Recomendacion[];
}
