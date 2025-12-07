/**
 * 🎓 SISTEMA DE APRENDIZAJE AUTÓNOMO LITPER
 * Tipos para el sistema que estudia cursos, videos y documentos automáticamente
 */

import { Pais } from './agents';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum TipoContenido {
  VIDEO = 'video',
  CURSO = 'curso',
  PDF = 'pdf',
  DOCUMENTO = 'documento',
  AUDIO = 'audio',
  PODCAST = 'podcast',
  WEBINAR = 'webinar',
  ARTICULO = 'articulo',
  EBOOK = 'ebook',
  PRESENTACION = 'presentacion'
}

export enum PlataformaOrigen {
  UDEMY = 'udemy',
  PLATZI = 'platzi',
  COURSERA = 'coursera',
  YOUTUBE = 'youtube',
  DOMESTIKA = 'domestika',
  LINKEDIN_LEARNING = 'linkedin_learning',
  SKILLSHARE = 'skillshare',
  LOCAL = 'local',
  WEB = 'web',
  OTRO = 'otro'
}

export enum EstadoProcesamiento {
  PENDIENTE = 'pendiente',
  EXPLORANDO = 'explorando',
  DESCARGANDO = 'descargando',
  TRANSCRIBIENDO = 'transcribiendo',
  ANALIZANDO = 'analizando',
  SINTETIZANDO = 'sintetizando',
  COMPLETADO = 'completado',
  ERROR = 'error',
  PAUSADO = 'pausado'
}

export enum CategoriaConocimiento {
  LOGISTICA = 'logistica',
  ATENCION_CLIENTE = 'atencion_cliente',
  TECNOLOGIA = 'tecnologia',
  COMPETENCIA = 'competencia',
  ECOMMERCE = 'ecommerce',
  MARKETING = 'marketing',
  OPERACIONES = 'operaciones',
  FINANZAS = 'finanzas',
  RECURSOS_HUMANOS = 'rh',
  LEGAL = 'legal',
  CASOS_ESTUDIO = 'casos_estudio',
  OTRO = 'otro'
}

export enum NivelPrioridadRecomendacion {
  INMEDIATA = 'inmediata',
  ALTA = 'alta',
  MEDIA = 'media',
  BAJA = 'baja',
  FUTURA = 'futura'
}

export enum EstadoRecomendacion {
  PENDIENTE = 'pendiente',
  EN_REVISION = 'en_revision',
  APROBADA = 'aprobada',
  IMPLEMENTANDO = 'implementando',
  IMPLEMENTADA = 'implementada',
  RECHAZADA = 'rechazada',
  ARCHIVADA = 'archivada'
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - CONTENIDO
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContenidoAprendizaje {
  id: string;
  tipo: TipoContenido;
  plataforma: PlataformaOrigen;

  // Información básica
  titulo: string;
  descripcion?: string;
  url?: string;
  autor?: string;

  // Estructura (para cursos)
  estructura?: EstructuraCurso;

  // Estado
  estado: EstadoProcesamiento;
  progreso: number; // 0-100

  // Métricas
  duracionTotal: number; // minutos
  duracionProcesada: number;
  palabrasTranscritas: number;
  conceptosExtraidos: number;

  // Resultados
  resumenEjecutivo?: string;
  conceptosClave?: ConceptoClave[];
  recomendaciones?: RecomendacionLitper[];

  // Timestamps
  agregadoEn: Date;
  iniciadoEn?: Date;
  completadoEn?: Date;

  // Errores
  errores?: string[];
}

export interface EstructuraCurso {
  modulos: ModuloCurso[];
  totalVideos: number;
  totalRecursos: number;
  duracionEstimada: number; // minutos
}

export interface ModuloCurso {
  id: string;
  numero: number;
  titulo: string;
  duracion: number; // minutos
  videos: VideoCurso[];
  recursos: RecursoCurso[];
  procesado: boolean;
}

export interface VideoCurso {
  id: string;
  numero: number;
  titulo: string;
  duracion: number; // minutos
  url?: string;

  // Procesamiento
  estado: EstadoProcesamiento;
  transcripcion?: string;
  resumen?: string;
  conceptos?: string[];

  // Análisis visual
  slidesDetectados: number;
  screenshotsCapturados: number;

  // Resultado
  analisis?: AnalisisVideo;
}

export interface RecursoCurso {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'excel' | 'word' | 'imagen' | 'otro';
  url?: string;
  procesado: boolean;
  contenido?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - ANÁLISIS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnalisisVideo {
  videoId: string;
  duracion: number;

  // Transcripción
  transcripcionCompleta: string;
  palabrasTotales: number;

  // Slides detectados
  slides: SlideDetectado[];

  // Análisis Claude
  tema: string;
  conceptosClave: string[];
  puntosPrincipales: string[];
  citasImportantes: CitaImportante[];

  // Aplicabilidad
  aplicableLitper: boolean;
  relevancia: number; // 1-10
  distritosRelacionados: string[];
  accionesSugeridas: string[];
}

export interface SlideDetectado {
  id: string;
  timestamp: number; // segundos
  imagenUrl?: string;
  textoOCR?: string;
  tieneGrafico: boolean;
  tieneDiagrama: boolean;
  importancia: 'alta' | 'media' | 'baja';
}

export interface CitaImportante {
  texto: string;
  timestamp?: number;
  hablante?: string;
  relevancia: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - CONCEPTOS Y CONOCIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConceptoClave {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaConocimiento;

  // Origen
  fuenteId: string;
  fuenteTitulo: string;
  timestamp?: number;

  // Relaciones
  conceptosRelacionados: string[];
  tagsPalabras: string[];

  // Aplicabilidad
  aplicableLitper: boolean;
  distritosRelacionados: string[];
  procesosAfectados: string[];

  // Métricas
  vecesUsado: number;
  ultimoUso?: Date;

  // Embedding para búsqueda semántica
  embedding?: number[];

  creadoEn: Date;
}

export interface BaseConocimiento {
  id: string;
  nombre: string;

  // Contenido
  categorias: CategoriaConocimiento[];
  fuentesTotales: number;
  conceptosTotales: number;
  recomendacionesTotales: number;

  // Por categoría
  conocimientoPorCategoria: {
    [key in CategoriaConocimiento]?: {
      fuentes: number;
      conceptos: number;
      acciones: number;
    };
  };

  // Métricas
  accionesImplementadas: number;
  impactoEstimado: string;

  ultimaActualizacion: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - RECOMENDACIONES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecomendacionLitper {
  id: string;
  titulo: string;
  descripcion: string;

  // Clasificación
  prioridad: NivelPrioridadRecomendacion;
  estado: EstadoRecomendacion;
  categoria: CategoriaConocimiento;

  // Origen
  fuenteId: string;
  fuenteTitulo: string;
  conceptoBase?: string;
  citaOrigen?: string;

  // Impacto
  impactoDescripcion: string;
  impactoMetrica?: string; // ej: "+25% entregas primer intento"
  impactoValor?: number; // 1-10
  esfuerzoEstimado: 'bajo' | 'medio' | 'alto';

  // Aplicación
  distritosAfectados: string[];
  agentesAfectados: string[];
  procesosAfectados: string[];

  // Implementación
  pasosImplementacion?: string[];
  requiereDesarrollo: boolean;
  tiempoEstimado?: string;

  // Seguimiento
  implementadaEn?: Date;
  resultadoImplementacion?: string;

  creadaEn: Date;
  actualizadaEn: Date;
}

export interface PlanImplementacion {
  id: string;
  recomendacionId: string;

  semanas: SemanaImplementacion[];

  estado: 'draft' | 'activo' | 'completado' | 'cancelado';
  progreso: number;

  creadoEn: Date;
  iniciadoEn?: Date;
  completadoEn?: Date;
}

export interface SemanaImplementacion {
  numero: number;
  tareas: TareaImplementacion[];
  completada: boolean;
}

export interface TareaImplementacion {
  descripcion: string;
  completada: boolean;
  completadaEn?: Date;
  notas?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - REPORTES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ReporteAprendizaje {
  id: string;
  contenidoId: string;
  contenidoTitulo: string;
  tipo: TipoContenido;
  plataforma: PlataformaOrigen;

  // Estadísticas
  estadisticas: {
    duracionTotal: number;
    videosProcesados: number;
    pdfsProcesados: number;
    palabrasTranscritas: number;
    conceptosExtraidos: number;
    recomendacionesGeneradas: number;
    aplicablesLitper: number;
    porcentajeAplicabilidad: number;
  };

  // Resumen
  resumenEjecutivo: string;

  // Top conceptos
  conceptosClave: ConceptoClave[];

  // Recomendaciones por prioridad
  recomendacionesInmediatas: RecomendacionLitper[];
  recomendacionesAlta: RecomendacionLitper[];
  recomendacionesMedia: RecomendacionLitper[];
  recomendacionesFutura: RecomendacionLitper[];

  // Análisis GAP
  analisisGap?: AnalisisGap[];

  // Plan sugerido
  planSugerido?: PlanImplementacion;

  // Archivos generados
  archivosGenerados: ArchivoGenerado[];

  generadoEn: Date;
}

export interface AnalisisGap {
  area: string;
  estadoActualLitper: number; // porcentaje
  mejorPractica: number;
  gap: number;
  criticidad: 'alta' | 'media' | 'baja';
  recomendacion: string;
}

export interface ArchivoGenerado {
  nombre: string;
  tipo: 'pdf' | 'json' | 'xlsx' | 'md';
  url?: string;
  tamaño?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - AGENTES DE APRENDIZAJE
// ═══════════════════════════════════════════════════════════════════════════════

export interface AgenteAprendiz {
  id: string;
  nombre: string;
  tipo: TipoAgenteAprendiz;

  estado: 'activo' | 'procesando' | 'esperando' | 'pausado' | 'error';
  tareaActual?: string;

  // Métricas
  contenidosProcesados: number;
  conceptosExtraidos: number;
  recomendacionesGeneradas: number;
  horasProcesadas: number;

  // Última actividad
  ultimaActividad: Date;
}

export enum TipoAgenteAprendiz {
  NAVEGADOR_CURSOS = 'navegador_cursos',
  VIDEO_PROCESSOR = 'video_processor',
  TEXT_PROCESSOR = 'text_processor',
  AUDIO_PROCESSOR = 'audio_processor',
  KNOWLEDGE_PROCESSOR = 'knowledge_processor',
  REPORT_GENERATOR = 'report_generator',
  MEMORY_MANAGER = 'memory_manager',
  PROFESSOR = 'professor'
}

export interface ProcesoAprendizaje {
  id: string;
  contenidoId: string;

  // Estado general
  estado: EstadoProcesamiento;
  etapaActual: string;
  progreso: number;

  // Etapas
  etapas: EtapaProceso[];

  // Tiempos
  tiempoTranscurrido: number; // segundos
  tiempoEstimadoRestante: number;

  // Errores
  errores: ErrorProceso[];

  iniciadoEn: Date;
  actualizadoEn: Date;
}

export interface EtapaProceso {
  nombre: string;
  orden: number;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'error';
  progreso: number;
  detalles?: string;
  iniciadaEn?: Date;
  completadaEn?: Date;
}

export interface ErrorProceso {
  etapa: string;
  mensaje: string;
  timestamp: Date;
  recuperable: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - ESTADÍSTICAS Y MÉTRICAS
// ═══════════════════════════════════════════════════════════════════════════════

export interface EstadisticasAprendizaje {
  // General
  contenidosTotales: number;
  contenidosCompletados: number;
  contenidosEnProceso: number;
  contenidosPendientes: number;

  // Por tipo
  cursosProcesados: number;
  videosProcesados: number;
  documentosProcesados: number;
  audiosProcesados: number;

  // Tiempo
  horasTotalesProcesadas: number;
  palabrasTotalesTranscritas: number;

  // Conocimiento
  conceptosTotales: number;
  conceptosAplicables: number;
  porcentajeAplicabilidad: number;

  // Recomendaciones
  recomendacionesTotales: number;
  recomendacionesImplementadas: number;
  impactoEstimado: string;

  // Por mes
  ultimoMes: {
    contenidosProcesados: number;
    horasProcesadas: number;
    conceptosNuevos: number;
    recomendacionesImplementadas: number;
    impactoMedido: string;
  };
}

export interface MetricasImpacto {
  eficienciaAntes: number;
  eficienciaDespues: number;
  mejoraPorcentaje: number;

  tiempoRespuestaAntes: number;
  tiempoRespuestaDespues: number;

  tasaExitoAntes: number;
  tasaExitoDespues: number;

  costoOperacionAntes: number;
  costoOperacionDespues: number;

  satisfaccionClienteAntes: number;
  satisfaccionClienteDespues: number;

  periodoMedicion: {
    inicio: Date;
    fin: Date;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL SISTEMA
// ═══════════════════════════════════════════════════════════════════════════════

export interface ConfiguracionAprendizaje {
  // Procesamiento
  procesarAutomaticamente: boolean;
  notificarAlCompletar: boolean;
  guardarTranscripciones: boolean;

  // Calidad
  calidadTranscripcion: 'rapida' | 'normal' | 'alta';
  intervaloScreenshots: number; // segundos

  // Filtros
  aplicarSoloLitper: boolean;
  relevanciaMinima: number; // 1-10

  // Límites
  maxContenidosSimultaneos: number;
  maxHorasDiarias: number;

  // Integración
  actualizarAgentesAutomaticamente: boolean;
  implementarBajaComplejidadAuto: boolean;
}

export const CONFIGURACION_DEFAULT: ConfiguracionAprendizaje = {
  procesarAutomaticamente: true,
  notificarAlCompletar: true,
  guardarTranscripciones: true,
  calidadTranscripcion: 'normal',
  intervaloScreenshots: 30,
  aplicarSoloLitper: true,
  relevanciaMinima: 5,
  maxContenidosSimultaneos: 3,
  maxHorasDiarias: 24,
  actualizarAgentesAutomaticamente: true,
  implementarBajaComplejidadAuto: false
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS DE TABS
// ═══════════════════════════════════════════════════════════════════════════════

export type MainTabAprendizaje = 'aprendizaje-ia';
export type MainTabCiudadAgentes = 'ciudad-agentes';
