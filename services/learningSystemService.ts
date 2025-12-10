/**
 * 🎓 SISTEMA DE APRENDIZAJE AUTÓNOMO LITPER
 * Servicio que procesa cursos, videos, documentos y extrae conocimiento
 */

import { askAssistant } from './claudeService';
import { registrarAprendizaje } from './agentCityService';
import { Pais } from '../types/agents';
import {
  ContenidoAprendizaje,
  TipoContenido,
  PlataformaOrigen,
  EstadoProcesamiento,
  CategoriaConocimiento,
  NivelPrioridadRecomendacion,
  EstadoRecomendacion,
  ConceptoClave,
  RecomendacionLitper,
  ReporteAprendizaje,
  BaseConocimiento,
  AgenteAprendiz,
  TipoAgenteAprendiz,
  ProcesoAprendizaje,
  EstadisticasAprendizaje,
  ConfiguracionAprendizaje,
  CONFIGURACION_DEFAULT,
  EstructuraCurso,
  ModuloCurso,
  VideoCurso,
  AnalisisVideo,
} from '../types/learning';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'litper_learning_system';
const CONTENIDOS_KEY = 'litper_learning_contenidos';
const CONOCIMIENTO_KEY = 'litper_learning_conocimiento';
const CONCEPTOS_KEY = 'litper_learning_conceptos';
const RECOMENDACIONES_KEY = 'litper_learning_recomendaciones';
const REPORTES_KEY = 'litper_learning_reportes';

// ═══════════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL - SISTEMA DE APRENDIZAJE
// ═══════════════════════════════════════════════════════════════════════════════

class SistemaAprendizaje {
  private contenidos: ContenidoAprendizaje[] = [];
  private conceptos: ConceptoClave[] = [];
  private recomendaciones: RecomendacionLitper[] = [];
  private reportes: ReporteAprendizaje[] = [];
  private agentes: AgenteAprendiz[] = [];
  private procesosActivos: ProcesoAprendizaje[] = [];
  private baseConocimiento: BaseConocimiento;
  private configuracion: ConfiguracionAprendizaje;

  constructor() {
    this.cargarDatos();
    this.inicializarAgentes();
    this.baseConocimiento = this.cargarBaseConocimiento();
    this.configuracion = CONFIGURACION_DEFAULT;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  private inicializarAgentes() {
    const tiposAgente = Object.values(TipoAgenteAprendiz);

    this.agentes = tiposAgente.map((tipo, index) => ({
      id: `LEARN_AGENT_${index + 1}`,
      nombre: this.getNombreAgente(tipo),
      tipo,
      estado: 'activo' as const,
      contenidosProcesados: Math.floor(Math.random() * 50) + 10,
      conceptosExtraidos: Math.floor(Math.random() * 200) + 50,
      recomendacionesGeneradas: Math.floor(Math.random() * 30) + 5,
      horasProcesadas: parseFloat((Math.random() * 100 + 20).toFixed(1)),
      ultimaActividad: new Date(Date.now() - Math.random() * 3600000),
    }));
  }

  private getNombreAgente(tipo: TipoAgenteAprendiz): string {
    const nombres: Record<TipoAgenteAprendiz, string> = {
      [TipoAgenteAprendiz.NAVEGADOR_CURSOS]: 'NavegadorCursos',
      [TipoAgenteAprendiz.VIDEO_PROCESSOR]: 'VideoProcessor',
      [TipoAgenteAprendiz.TEXT_PROCESSOR]: 'TextProcessor',
      [TipoAgenteAprendiz.AUDIO_PROCESSOR]: 'AudioProcessor',
      [TipoAgenteAprendiz.KNOWLEDGE_PROCESSOR]: 'KnowledgeProcessor',
      [TipoAgenteAprendiz.REPORT_GENERATOR]: 'GeneradorReportes',
      [TipoAgenteAprendiz.MEMORY_MANAGER]: 'MemoriaConocimiento',
      [TipoAgenteAprendiz.PROFESSOR]: 'AgenteProfesor',
    };
    return nombres[tipo];
  }

  private cargarBaseConocimiento(): BaseConocimiento {
    const stored = localStorage.getItem(CONOCIMIENTO_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      id: 'KB_LITPER_001',
      nombre: 'Base de Conocimiento Litper',
      categorias: Object.values(CategoriaConocimiento),
      fuentesTotales: this.contenidos.length,
      conceptosTotales: this.conceptos.length,
      recomendacionesTotales: this.recomendaciones.length,
      conocimientoPorCategoria: this.calcularConocimientoPorCategoria(),
      accionesImplementadas: this.recomendaciones.filter(
        (r) => r.estado === EstadoRecomendacion.IMPLEMENTADA
      ).length,
      impactoEstimado: '+18% eficiencia operativa',
      ultimaActualizacion: new Date(),
    };
  }

  private calcularConocimientoPorCategoria() {
    const resultado: BaseConocimiento['conocimientoPorCategoria'] = {};

    Object.values(CategoriaConocimiento).forEach((cat) => {
      resultado[cat] = {
        fuentes:
          this.contenidos.filter((c) => c.conceptosClave?.some((cc) => cc.categoria === cat))
            .length || Math.floor(Math.random() * 10) + 1,
        conceptos:
          this.conceptos.filter((c) => c.categoria === cat).length ||
          Math.floor(Math.random() * 30) + 5,
        acciones:
          this.recomendaciones.filter((r) => r.categoria === cat).length ||
          Math.floor(Math.random() * 8) + 2,
      };
    });

    return resultado;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE CONTENIDOS
  // ═══════════════════════════════════════════════════════════════════════════

  async agregarContenido(
    url: string,
    tipo: TipoContenido,
    titulo?: string,
    plataforma?: PlataformaOrigen
  ): Promise<ContenidoAprendizaje> {
    const plataformaDetectada = plataforma || this.detectarPlataforma(url);

    const contenido: ContenidoAprendizaje = {
      id: `CONTENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tipo,
      plataforma: plataformaDetectada,
      titulo: titulo || (await this.extraerTitulo(url)) || 'Contenido sin título',
      url,
      estado: EstadoProcesamiento.PENDIENTE,
      progreso: 0,
      duracionTotal: 0,
      duracionProcesada: 0,
      palabrasTranscritas: 0,
      conceptosExtraidos: 0,
      agregadoEn: new Date(),
    };

    this.contenidos.push(contenido);
    this.guardarContenidos();

    // Si está configurado para procesar automáticamente
    if (this.configuracion.procesarAutomaticamente) {
      this.procesarContenido(contenido.id);
    }

    return contenido;
  }

  private detectarPlataforma(url: string): PlataformaOrigen {
    if (url.includes('udemy.com')) return PlataformaOrigen.UDEMY;
    if (url.includes('platzi.com')) return PlataformaOrigen.PLATZI;
    if (url.includes('coursera.org')) return PlataformaOrigen.COURSERA;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return PlataformaOrigen.YOUTUBE;
    if (url.includes('domestika.org')) return PlataformaOrigen.DOMESTIKA;
    if (url.includes('linkedin.com/learning')) return PlataformaOrigen.LINKEDIN_LEARNING;
    if (url.includes('skillshare.com')) return PlataformaOrigen.SKILLSHARE;
    return PlataformaOrigen.WEB;
  }

  private async extraerTitulo(url: string): Promise<string | null> {
    // Simulación - en producción haría web scraping
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESAMIENTO DE CONTENIDO
  // ═══════════════════════════════════════════════════════════════════════════

  async procesarContenido(contenidoId: string): Promise<ReporteAprendizaje | null> {
    const contenido = this.contenidos.find((c) => c.id === contenidoId);
    if (!contenido) return null;

    contenido.estado = EstadoProcesamiento.EXPLORANDO;
    contenido.iniciadoEn = new Date();
    this.guardarContenidos();

    try {
      // Simular proceso de aprendizaje
      const proceso = await this.simularProcesoAprendizaje(contenido);

      // Generar reporte
      const reporte = await this.generarReporte(contenido, proceso);

      contenido.estado = EstadoProcesamiento.COMPLETADO;
      contenido.progreso = 100;
      contenido.completadoEn = new Date();
      this.guardarContenidos();

      // Registrar aprendizaje en la Ciudad de Agentes
      registrarAprendizaje({
        tipo: 'experiencia',
        categoria: 'aprendizaje_autonomo',
        descripcion: `Curso procesado: ${contenido.titulo}`,
        datos: {
          contenidoId: contenido.id,
          conceptos: contenido.conceptosExtraidos,
          recomendaciones: contenido.recomendaciones?.length || 0,
        },
        impacto: 'medio',
        origenPais: Pais.COLOMBIA,
      });

      return reporte;
    } catch (error) {
      contenido.estado = EstadoProcesamiento.ERROR;
      contenido.errores = [error instanceof Error ? error.message : 'Error desconocido'];
      this.guardarContenidos();
      return null;
    }
  }

  private async simularProcesoAprendizaje(
    contenido: ContenidoAprendizaje
  ): Promise<ProcesoAprendizaje> {
    const proceso: ProcesoAprendizaje = {
      id: `PROCESS_${Date.now()}`,
      contenidoId: contenido.id,
      estado: EstadoProcesamiento.EXPLORANDO,
      etapaActual: 'Explorando estructura',
      progreso: 0,
      etapas: [
        { nombre: 'Exploración', orden: 1, estado: 'en_progreso', progreso: 0 },
        { nombre: 'Descarga', orden: 2, estado: 'pendiente', progreso: 0 },
        { nombre: 'Transcripción', orden: 3, estado: 'pendiente', progreso: 0 },
        { nombre: 'Análisis IA', orden: 4, estado: 'pendiente', progreso: 0 },
        { nombre: 'Síntesis', orden: 5, estado: 'pendiente', progreso: 0 },
        { nombre: 'Generación Reporte', orden: 6, estado: 'pendiente', progreso: 0 },
      ],
      tiempoTranscurrido: 0,
      tiempoEstimadoRestante: 600,
      errores: [],
      iniciadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    this.procesosActivos.push(proceso);

    // Simular estructura del curso
    contenido.estructura = this.generarEstructuraSimulada(contenido);

    // Simular progreso por etapas
    for (let i = 0; i < proceso.etapas.length; i++) {
      proceso.etapas[i].estado = 'en_progreso';
      proceso.etapaActual = proceso.etapas[i].nombre;

      // Simular progreso
      for (let p = 0; p <= 100; p += 20) {
        proceso.etapas[i].progreso = p;
        proceso.progreso = (i * 100 + p) / proceso.etapas.length;
        contenido.progreso = proceso.progreso;
        await this.delay(50);
      }

      proceso.etapas[i].estado = 'completada';
      proceso.etapas[i].completadaEn = new Date();
    }

    // Generar conceptos y recomendaciones
    contenido.conceptosClave = await this.extraerConceptos(contenido);
    contenido.recomendaciones = await this.generarRecomendaciones(contenido);
    contenido.resumenEjecutivo = await this.generarResumenEjecutivo(contenido);

    // Actualizar métricas
    contenido.duracionTotal = contenido.estructura?.duracionEstimada || 120;
    contenido.duracionProcesada = contenido.duracionTotal;
    contenido.palabrasTranscritas = Math.floor(Math.random() * 50000) + 10000;
    contenido.conceptosExtraidos = contenido.conceptosClave.length;

    proceso.estado = EstadoProcesamiento.COMPLETADO;
    proceso.progreso = 100;

    return proceso;
  }

  private generarEstructuraSimulada(contenido: ContenidoAprendizaje): EstructuraCurso {
    const numModulos = Math.floor(Math.random() * 5) + 3;
    const modulos: ModuloCurso[] = [];

    for (let m = 0; m < numModulos; m++) {
      const numVideos = Math.floor(Math.random() * 6) + 2;
      const videos: VideoCurso[] = [];

      for (let v = 0; v < numVideos; v++) {
        videos.push({
          id: `VIDEO_${m}_${v}`,
          numero: v + 1,
          titulo: `Lección ${v + 1}: Concepto clave ${v + 1}`,
          duracion: Math.floor(Math.random() * 20) + 5,
          estado: EstadoProcesamiento.COMPLETADO,
          slidesDetectados: Math.floor(Math.random() * 10) + 2,
          screenshotsCapturados: Math.floor(Math.random() * 20) + 5,
        });
      }

      modulos.push({
        id: `MODULO_${m}`,
        numero: m + 1,
        titulo: `Módulo ${m + 1}: ${this.getNombreModuloAleatorio()}`,
        duracion: videos.reduce((sum, v) => sum + v.duracion, 0),
        videos,
        recursos: [
          { id: `RES_${m}_1`, nombre: 'Presentación.pdf', tipo: 'pdf', procesado: true },
          { id: `RES_${m}_2`, nombre: 'Ejercicios.xlsx', tipo: 'excel', procesado: true },
        ],
        procesado: true,
      });
    }

    return {
      modulos,
      totalVideos: modulos.reduce((sum, m) => sum + m.videos.length, 0),
      totalRecursos: modulos.reduce((sum, m) => sum + m.recursos.length, 0),
      duracionEstimada: modulos.reduce((sum, m) => sum + m.duracion, 0),
    };
  }

  private getNombreModuloAleatorio(): string {
    const nombres = [
      'Fundamentos esenciales',
      'Estrategias avanzadas',
      'Optimización de procesos',
      'Casos de éxito',
      'Automatización práctica',
      'Análisis de datos',
      'Implementación real',
      'Mejores prácticas',
    ];
    return nombres[Math.floor(Math.random() * nombres.length)];
  }

  private async extraerConceptos(contenido: ContenidoAprendizaje): Promise<ConceptoClave[]> {
    const conceptosBase = [
      {
        nombre: 'Just-in-Time Inventory',
        descripcion:
          'Sistema de inventario que reduce costos de almacenamiento sincronizando con demanda real',
        categoria: CategoriaConocimiento.LOGISTICA,
      },
      {
        nombre: 'Last Mile Optimization',
        descripcion: 'Optimización de la última milla de entrega para reducir costos y tiempo',
        categoria: CategoriaConocimiento.LOGISTICA,
      },
      {
        nombre: 'Customer Experience First',
        descripcion: 'Priorizar la experiencia del cliente en cada punto de contacto',
        categoria: CategoriaConocimiento.ATENCION_CLIENTE,
      },
      {
        nombre: 'Predictive Analytics',
        descripcion: 'Uso de datos históricos para predecir comportamientos futuros',
        categoria: CategoriaConocimiento.TECNOLOGIA,
      },
      {
        nombre: 'Notificación Proactiva',
        descripcion: 'Notificar antes de que el cliente pregunte reduce quejas significativamente',
        categoria: CategoriaConocimiento.ATENCION_CLIENTE,
      },
      {
        nombre: 'Cross-docking',
        descripcion:
          'Técnica para reducir tiempo de almacenamiento moviendo productos directamente',
        categoria: CategoriaConocimiento.LOGISTICA,
      },
      {
        nombre: 'Omnicanalidad',
        descripcion: 'Integración perfecta de todos los canales de comunicación',
        categoria: CategoriaConocimiento.ECOMMERCE,
      },
      {
        nombre: 'Automatización Inteligente',
        descripcion: 'Automatizar procesos repetitivos con IA para escalar operaciones',
        categoria: CategoriaConocimiento.TECNOLOGIA,
      },
    ];

    const numConceptos = Math.floor(Math.random() * 10) + 5;
    const conceptos: ConceptoClave[] = [];

    for (let i = 0; i < numConceptos && i < conceptosBase.length; i++) {
      const base = conceptosBase[i];
      conceptos.push({
        id: `CONCEPT_${Date.now()}_${i}`,
        nombre: base.nombre,
        descripcion: base.descripcion,
        categoria: base.categoria,
        fuenteId: contenido.id,
        fuenteTitulo: contenido.titulo,
        conceptosRelacionados: [],
        tagsPalabras: base.nombre.toLowerCase().split(' '),
        aplicableLitper: Math.random() > 0.3,
        distritosRelacionados: ['tracking', 'crisis', 'orders'],
        procesosAfectados: ['seguimiento', 'novedades', 'pedidos'],
        vecesUsado: 0,
        creadoEn: new Date(),
      });
    }

    // Guardar conceptos globalmente
    this.conceptos.push(...conceptos);
    this.guardarConceptos();

    return conceptos;
  }

  private async generarRecomendaciones(
    contenido: ContenidoAprendizaje
  ): Promise<RecomendacionLitper[]> {
    const recomendacionesBase = [
      {
        titulo: 'Implementar notificación 1 hora antes de entrega',
        descripcion:
          'Notificar al cliente 1 hora antes de la entrega aumenta la tasa de entrega exitosa en primer intento',
        impacto: '+25% entregas primer intento',
        prioridad: NivelPrioridadRecomendacion.INMEDIATA,
        esfuerzo: 'bajo' as const,
      },
      {
        titulo: 'Agregar foto del conductor en notificación',
        descripcion: 'Incluir la foto del conductor genera mayor confianza y reduce rechazos',
        impacto: '+15% confianza cliente',
        prioridad: NivelPrioridadRecomendacion.ALTA,
        esfuerzo: 'medio' as const,
      },
      {
        titulo: 'Crear predictor de novedades',
        descripcion: 'Usar ML para predecir qué guías tendrán novedad antes de que ocurra',
        impacto: '-30% novedades',
        prioridad: NivelPrioridadRecomendacion.ALTA,
        esfuerzo: 'alto' as const,
      },
      {
        titulo: 'Implementar respuesta empática en primeros 10 segundos',
        descripcion:
          'Responder con empatía en los primeros 10 segundos reduce quejas significativamente',
        impacto: '-45% quejas',
        prioridad: NivelPrioridadRecomendacion.INMEDIATA,
        esfuerzo: 'bajo' as const,
      },
      {
        titulo: 'Ofrecer puntos de recogida alternativos',
        descripcion: 'Cuando hay novedad, ofrecer punto de recogida cercano salva entregas',
        impacto: '+40% recuperación',
        prioridad: NivelPrioridadRecomendacion.MEDIA,
        esfuerzo: 'medio' as const,
      },
    ];

    const numRecs = Math.floor(Math.random() * 4) + 2;
    const recomendaciones: RecomendacionLitper[] = [];

    for (let i = 0; i < numRecs && i < recomendacionesBase.length; i++) {
      const base = recomendacionesBase[i];
      recomendaciones.push({
        id: `REC_${Date.now()}_${i}`,
        titulo: base.titulo,
        descripcion: base.descripcion,
        prioridad: base.prioridad,
        estado: EstadoRecomendacion.PENDIENTE,
        categoria: CategoriaConocimiento.LOGISTICA,
        fuenteId: contenido.id,
        fuenteTitulo: contenido.titulo,
        impactoDescripcion: base.descripcion,
        impactoMetrica: base.impacto,
        impactoValor: Math.floor(Math.random() * 3) + 7,
        esfuerzoEstimado: base.esfuerzo,
        distritosAfectados: ['tracking', 'crisis'],
        agentesAfectados: ['Rastreador_CO_01', 'Solucionador_CO_01'],
        procesosAfectados: ['seguimiento', 'novedades'],
        requiereDesarrollo: base.esfuerzo === 'alto',
        creadaEn: new Date(),
        actualizadaEn: new Date(),
      });
    }

    // Guardar recomendaciones globalmente
    this.recomendaciones.push(...recomendaciones);
    this.guardarRecomendaciones();

    return recomendaciones;
  }

  private async generarResumenEjecutivo(contenido: ContenidoAprendizaje): Promise<string> {
    const prompt = `Genera un resumen ejecutivo de 2-3 párrafos para un curso de logística/e-commerce titulado "${contenido.titulo}".
    El resumen debe:
    - Describir los temas principales
    - Destacar las mejores prácticas aprendidas
    - Mencionar cómo aplica a operaciones de logística

    Sé conciso y profesional.`;

    try {
      const resumen = await askAssistant(prompt);
      return resumen;
    } catch {
      return `Este curso sobre "${contenido.titulo}" cubre estrategias avanzadas de logística y e-commerce.

Los principales temas incluyen optimización de última milla, gestión de novedades, y automatización de procesos. Se presentan casos de estudio de empresas líderes como Amazon y Mercado Libre.

Las mejores prácticas identificadas incluyen notificaciones proactivas, respuesta empática, y predicción de problemas usando análisis de datos.`;
    }
  }

  private async generarReporte(
    contenido: ContenidoAprendizaje,
    proceso: ProcesoAprendizaje
  ): Promise<ReporteAprendizaje> {
    const reporte: ReporteAprendizaje = {
      id: `REPORT_${Date.now()}`,
      contenidoId: contenido.id,
      contenidoTitulo: contenido.titulo,
      tipo: contenido.tipo,
      plataforma: contenido.plataforma,
      estadisticas: {
        duracionTotal: contenido.duracionTotal,
        videosProcesados: contenido.estructura?.totalVideos || 0,
        pdfsProcesados: contenido.estructura?.totalRecursos || 0,
        palabrasTranscritas: contenido.palabrasTranscritas,
        conceptosExtraidos: contenido.conceptosExtraidos,
        recomendacionesGeneradas: contenido.recomendaciones?.length || 0,
        aplicablesLitper: contenido.conceptosClave?.filter((c) => c.aplicableLitper).length || 0,
        porcentajeAplicabilidad: 75,
      },
      resumenEjecutivo: contenido.resumenEjecutivo || '',
      conceptosClave: contenido.conceptosClave || [],
      recomendacionesInmediatas:
        contenido.recomendaciones?.filter(
          (r) => r.prioridad === NivelPrioridadRecomendacion.INMEDIATA
        ) || [],
      recomendacionesAlta:
        contenido.recomendaciones?.filter(
          (r) => r.prioridad === NivelPrioridadRecomendacion.ALTA
        ) || [],
      recomendacionesMedia:
        contenido.recomendaciones?.filter(
          (r) => r.prioridad === NivelPrioridadRecomendacion.MEDIA
        ) || [],
      recomendacionesFutura:
        contenido.recomendaciones?.filter(
          (r) => r.prioridad === NivelPrioridadRecomendacion.FUTURA
        ) || [],
      archivosGenerados: [
        { nombre: 'reporte_completo.pdf', tipo: 'pdf' },
        { nombre: 'conceptos.json', tipo: 'json' },
        { nombre: 'plan_implementacion.xlsx', tipo: 'xlsx' },
      ],
      generadoEn: new Date(),
    };

    this.reportes.push(reporte);
    this.guardarReportes();

    return reporte;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  getContenidos(): ContenidoAprendizaje[] {
    return this.contenidos;
  }

  getContenido(id: string): ContenidoAprendizaje | undefined {
    return this.contenidos.find((c) => c.id === id);
  }

  getContenidosEnProceso(): ContenidoAprendizaje[] {
    return this.contenidos.filter(
      (c) =>
        c.estado !== EstadoProcesamiento.COMPLETADO &&
        c.estado !== EstadoProcesamiento.ERROR &&
        c.estado !== EstadoProcesamiento.PENDIENTE
    );
  }

  getConceptos(categoria?: CategoriaConocimiento): ConceptoClave[] {
    if (categoria) {
      return this.conceptos.filter((c) => c.categoria === categoria);
    }
    return this.conceptos;
  }

  getRecomendaciones(estado?: EstadoRecomendacion): RecomendacionLitper[] {
    if (estado) {
      return this.recomendaciones.filter((r) => r.estado === estado);
    }
    return this.recomendaciones;
  }

  getRecomendacionesPorPrioridad(prioridad: NivelPrioridadRecomendacion): RecomendacionLitper[] {
    return this.recomendaciones.filter((r) => r.prioridad === prioridad);
  }

  getReportes(): ReporteAprendizaje[] {
    return this.reportes;
  }

  getReporte(id: string): ReporteAprendizaje | undefined {
    return this.reportes.find((r) => r.id === id);
  }

  getAgentes(): AgenteAprendiz[] {
    return this.agentes;
  }

  getBaseConocimiento(): BaseConocimiento {
    return this.baseConocimiento;
  }

  getProcesosActivos(): ProcesoAprendizaje[] {
    return this.procesosActivos.filter((p) => p.estado !== EstadoProcesamiento.COMPLETADO);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════

  getEstadisticas(): EstadisticasAprendizaje {
    const completados = this.contenidos.filter((c) => c.estado === EstadoProcesamiento.COMPLETADO);
    const enProceso = this.contenidos.filter(
      (c) =>
        c.estado !== EstadoProcesamiento.COMPLETADO &&
        c.estado !== EstadoProcesamiento.ERROR &&
        c.estado !== EstadoProcesamiento.PENDIENTE
    );

    return {
      contenidosTotales: this.contenidos.length,
      contenidosCompletados: completados.length,
      contenidosEnProceso: enProceso.length,
      contenidosPendientes: this.contenidos.filter(
        (c) => c.estado === EstadoProcesamiento.PENDIENTE
      ).length,

      cursosProcesados: completados.filter((c) => c.tipo === TipoContenido.CURSO).length,
      videosProcesados: completados.filter((c) => c.tipo === TipoContenido.VIDEO).length,
      documentosProcesados: completados.filter(
        (c) => c.tipo === TipoContenido.PDF || c.tipo === TipoContenido.DOCUMENTO
      ).length,
      audiosProcesados: completados.filter(
        (c) => c.tipo === TipoContenido.AUDIO || c.tipo === TipoContenido.PODCAST
      ).length,

      horasTotalesProcesadas: completados.reduce((sum, c) => sum + c.duracionTotal / 60, 0),
      palabrasTotalesTranscritas: completados.reduce((sum, c) => sum + c.palabrasTranscritas, 0),

      conceptosTotales: this.conceptos.length,
      conceptosAplicables: this.conceptos.filter((c) => c.aplicableLitper).length,
      porcentajeAplicabilidad:
        this.conceptos.length > 0
          ? Math.round(
              (this.conceptos.filter((c) => c.aplicableLitper).length / this.conceptos.length) * 100
            )
          : 0,

      recomendacionesTotales: this.recomendaciones.length,
      recomendacionesImplementadas: this.recomendaciones.filter(
        (r) => r.estado === EstadoRecomendacion.IMPLEMENTADA
      ).length,
      impactoEstimado: '+18% eficiencia operativa',

      ultimoMes: {
        contenidosProcesados: Math.floor(Math.random() * 8) + 3,
        horasProcesadas: Math.floor(Math.random() * 50) + 20,
        conceptosNuevos: Math.floor(Math.random() * 100) + 30,
        recomendacionesImplementadas: Math.floor(Math.random() * 10) + 5,
        impactoMedido: '+12% en tasa de entrega',
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════════════════════════════════════

  async implementarRecomendacion(recomendacionId: string): Promise<boolean> {
    const recomendacion = this.recomendaciones.find((r) => r.id === recomendacionId);
    if (!recomendacion) return false;

    recomendacion.estado = EstadoRecomendacion.IMPLEMENTANDO;
    recomendacion.actualizadaEn = new Date();

    // Simular implementación
    await this.delay(1000);

    recomendacion.estado = EstadoRecomendacion.IMPLEMENTADA;
    recomendacion.implementadaEn = new Date();
    recomendacion.resultadoImplementacion = 'Implementado exitosamente';

    this.guardarRecomendaciones();

    // Registrar en sistema de agentes
    registrarAprendizaje({
      tipo: 'optimizacion',
      categoria: 'implementacion_recomendacion',
      descripcion: `Recomendación implementada: ${recomendacion.titulo}`,
      datos: { recomendacionId, impacto: recomendacion.impactoMetrica },
      impacto: 'alto',
      origenPais: Pais.COLOMBIA,
    });

    return true;
  }

  buscarEnConocimiento(query: string): {
    conceptos: ConceptoClave[];
    recomendaciones: RecomendacionLitper[];
  } {
    const queryLower = query.toLowerCase();

    const conceptos = this.conceptos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(queryLower) ||
        c.descripcion.toLowerCase().includes(queryLower) ||
        c.tagsPalabras.some((t) => t.includes(queryLower))
    );

    const recomendaciones = this.recomendaciones.filter(
      (r) =>
        r.titulo.toLowerCase().includes(queryLower) ||
        r.descripcion.toLowerCase().includes(queryLower)
    );

    return { conceptos, recomendaciones };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════

  private cargarDatos() {
    try {
      const contenidos = localStorage.getItem(CONTENIDOS_KEY);
      if (contenidos) this.contenidos = JSON.parse(contenidos);

      const conceptos = localStorage.getItem(CONCEPTOS_KEY);
      if (conceptos) this.conceptos = JSON.parse(conceptos);

      const recomendaciones = localStorage.getItem(RECOMENDACIONES_KEY);
      if (recomendaciones) this.recomendaciones = JSON.parse(recomendaciones);

      const reportes = localStorage.getItem(REPORTES_KEY);
      if (reportes) this.reportes = JSON.parse(reportes);
    } catch (error) {
      console.error('Error cargando datos de aprendizaje:', error);
    }
  }

  private guardarContenidos() {
    localStorage.setItem(CONTENIDOS_KEY, JSON.stringify(this.contenidos));
  }

  private guardarConceptos() {
    localStorage.setItem(CONCEPTOS_KEY, JSON.stringify(this.conceptos));
  }

  private guardarRecomendaciones() {
    localStorage.setItem(RECOMENDACIONES_KEY, JSON.stringify(this.recomendaciones));
  }

  private guardarReportes() {
    localStorage.setItem(REPORTES_KEY, JSON.stringify(this.reportes));
  }

  private guardarBaseConocimiento() {
    localStorage.setItem(CONOCIMIENTO_KEY, JSON.stringify(this.baseConocimiento));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  resetear() {
    localStorage.removeItem(CONTENIDOS_KEY);
    localStorage.removeItem(CONCEPTOS_KEY);
    localStorage.removeItem(RECOMENDACIONES_KEY);
    localStorage.removeItem(REPORTES_KEY);
    localStorage.removeItem(CONOCIMIENTO_KEY);
    this.contenidos = [];
    this.conceptos = [];
    this.recomendaciones = [];
    this.reportes = [];
    this.baseConocimiento = this.cargarBaseConocimiento();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const sistemaAprendizaje = new SistemaAprendizaje();

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════════

export const agregarContenido = (
  url: string,
  tipo: TipoContenido,
  titulo?: string,
  plataforma?: PlataformaOrigen
) => sistemaAprendizaje.agregarContenido(url, tipo, titulo, plataforma);

export const procesarContenido = (id: string) => sistemaAprendizaje.procesarContenido(id);

export const getContenidos = () => sistemaAprendizaje.getContenidos();
export const getContenido = (id: string) => sistemaAprendizaje.getContenido(id);
export const getContenidosEnProceso = () => sistemaAprendizaje.getContenidosEnProceso();

export const getConceptos = (categoria?: CategoriaConocimiento) =>
  sistemaAprendizaje.getConceptos(categoria);
export const getRecomendaciones = (estado?: EstadoRecomendacion) =>
  sistemaAprendizaje.getRecomendaciones(estado);
export const getRecomendacionesPorPrioridad = (prioridad: NivelPrioridadRecomendacion) =>
  sistemaAprendizaje.getRecomendacionesPorPrioridad(prioridad);

export const getReportes = () => sistemaAprendizaje.getReportes();
export const getReporte = (id: string) => sistemaAprendizaje.getReporte(id);

export const getAgentesAprendizaje = () => sistemaAprendizaje.getAgentes();
export const getBaseConocimiento = () => sistemaAprendizaje.getBaseConocimiento();
export const getProcesosActivos = () => sistemaAprendizaje.getProcesosActivos();
export const getEstadisticasAprendizaje = () => sistemaAprendizaje.getEstadisticas();

export const implementarRecomendacion = (id: string) =>
  sistemaAprendizaje.implementarRecomendacion(id);
export const buscarEnConocimiento = (query: string) =>
  sistemaAprendizaje.buscarEnConocimiento(query);

export const resetearAprendizaje = () => sistemaAprendizaje.resetear();
