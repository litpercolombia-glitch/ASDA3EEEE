/**
 * 🌆 CIUDAD DE AGENTES LITPER - SERVICIO PRINCIPAL
 * Orquestador Maestro que coordina todos los distritos
 * Sistema de automatización total con IA para logística multi-país
 */

import { askAssistant } from './claudeService';
import {
  Agente,
  AgenteEstadisticas,
  Tarea,
  TareaResultado,
  Distrito,
  DistritoId,
  DistritoConfig,
  EstadoCiudadAgentes,
  EstadoPais,
  MetricasCiudad,
  AlertaCiudad,
  ComandoMCP,
  PlanEjecucion,
  PasoEjecucion,
  TipoAgente,
  EstadoAgente,
  EstadoTarea,
  Pais,
  NivelPrioridad,
  DISTRITOS_CONFIG,
  Aprendizaje,
  PatronDetectado,
  Optimizacion
} from '../types/agents';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'litper_agent_city';
const METRICAS_KEY = 'litper_agent_metricas';
const APRENDIZAJES_KEY = 'litper_agent_aprendizajes';

// ═══════════════════════════════════════════════════════════════════════════════
// CLASE PRINCIPAL - CIUDAD DE AGENTES
// ═══════════════════════════════════════════════════════════════════════════════

class CiudadDeAgentes {
  private estado: EstadoCiudadAgentes;
  private colaTareas: Tarea[] = [];
  private historialTareas: TareaResultado[] = [];
  private aprendizajes: Aprendizaje[] = [];
  private patronesDetectados: PatronDetectado[] = [];
  private optimizaciones: Optimizacion[] = [];

  constructor() {
    this.estado = this.cargarEstado() || this.inicializarEstado();
    this.aprendizajes = this.cargarAprendizajes();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  private inicializarEstado(): EstadoCiudadAgentes {
    const distritos = this.crearDistritosIniciales();

    const estadoInicial: EstadoCiudadAgentes = {
      nombre: 'Ciudad de Agentes Litper',
      version: '1.0.0',
      estado: 'operativo',
      estadoPorPais: {
        [Pais.COLOMBIA]: this.crearEstadoPais(Pais.COLOMBIA),
        [Pais.CHILE]: this.crearEstadoPais(Pais.CHILE),
        [Pais.ECUADOR]: this.crearEstadoPais(Pais.ECUADOR)
      },
      distritos,
      metricas: this.crearMetricasIniciales(Pais.COLOMBIA),
      alertasActivas: [],
      aprendizajesTotales: 0,
      iniciadoEn: new Date(),
      ultimaActualizacion: new Date()
    };

    this.guardarEstado(estadoInicial);
    return estadoInicial;
  }

  private crearDistritosIniciales(): Distrito[] {
    return DISTRITOS_CONFIG.map(config => ({
      id: config.id,
      nombre: config.nombre,
      descripcion: config.descripcion,
      icono: config.icono,
      color: config.color,
      agentes: this.crearAgentesIniciales(config),
      agentesActivos: config.agentesMinimos,
      estado: 'operativo' as const,
      alertasActivas: 0,
      tareasHoy: 0,
      tareasCompletadasHoy: 0,
      tasaExitoHoy: 100,
      tiempoPromedioHoy: 0
    }));
  }

  private crearAgentesIniciales(config: DistritoConfig): Agente[] {
    const agentes: Agente[] = [];
    const paises = [Pais.COLOMBIA, Pais.CHILE, Pais.ECUADOR];

    for (let i = 0; i < config.agentesMinimos; i++) {
      const pais = paises[i % 3];
      const tipoAgente = config.tiposAgente[i % config.tiposAgente.length];

      agentes.push({
        id: `${config.id}_${pais}_${i + 1}`.toUpperCase(),
        nombre: this.generarNombreAgente(config.id, tipoAgente, pais, i + 1),
        tipo: tipoAgente,
        especialidad: this.getEspecialidadPorDistrito(config.id),
        estado: EstadoAgente.ACTIVO,
        pais,
        distritoId: config.id,
        tareasCompletadas: Math.floor(Math.random() * 500) + 100,
        tareasFallidas: Math.floor(Math.random() * 20),
        tiempoPromedioTarea: Math.floor(Math.random() * 60) + 30,
        calificacionPromedio: parseFloat((Math.random() * 2 + 8).toFixed(1)),
        capacidadMaxima: 50,
        tareasActuales: Math.floor(Math.random() * 10),
        creadoEn: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        ultimaActividad: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
        sistemaPrompt: this.getSistemaPromptPorTipo(tipoAgente),
        parametros: {}
      });
    }

    return agentes;
  }

  private generarNombreAgente(distritoId: DistritoId, tipo: TipoAgente, pais: Pais, numero: number): string {
    const prefijos: Record<DistritoId, string> = {
      [DistritoId.TRACKING]: 'Rastreador',
      [DistritoId.ORDERS]: 'Procesador',
      [DistritoId.CRISIS]: 'Solucionador',
      [DistritoId.COMMUNICATIONS]: 'Comunicador',
      [DistritoId.QUALITY]: 'Supervisor',
      [DistritoId.INTELLIGENCE]: 'Analista',
      [DistritoId.AUTOMATION]: 'Optimizador'
    };

    const paisSufijo: Record<Pais, string> = {
      [Pais.COLOMBIA]: 'CO',
      [Pais.CHILE]: 'CL',
      [Pais.ECUADOR]: 'EC'
    };

    return `${prefijos[distritoId]}_${paisSufijo[pais]}_${numero.toString().padStart(2, '0')}`;
  }

  private getEspecialidadPorDistrito(distritoId: DistritoId): string {
    const especialidades: Record<DistritoId, string> = {
      [DistritoId.TRACKING]: 'rastreo_validacion_guias',
      [DistritoId.ORDERS]: 'procesamiento_pedidos',
      [DistritoId.CRISIS]: 'solucion_novedades',
      [DistritoId.COMMUNICATIONS]: 'atencion_multicanal',
      [DistritoId.QUALITY]: 'control_calidad',
      [DistritoId.INTELLIGENCE]: 'analisis_patrones',
      [DistritoId.AUTOMATION]: 'optimizacion_procesos'
    };
    return especialidades[distritoId];
  }

  private getSistemaPromptPorTipo(tipo: TipoAgente): string {
    const prompts: Record<TipoAgente, string> = {
      [TipoAgente.PROCESADOR]: 'Agente procesador experto en ejecución de tareas operativas con precisión y eficiencia.',
      [TipoAgente.ANALISTA]: 'Agente analista experto en análisis de datos, detección de patrones y generación de insights.',
      [TipoAgente.CALIDAD]: 'Agente de calidad riguroso que revisa y valida el trabajo de otros agentes.',
      [TipoAgente.OPTIMIZADOR]: 'Agente optimizador experto en mejora continua y eficiencia de procesos.',
      [TipoAgente.ENTRENADOR]: 'Agente entrenador que documenta procesos y capacita a otros agentes.',
      [TipoAgente.CREADOR]: 'Agente creador que diseña y configura nuevos agentes especializados.',
      [TipoAgente.COORDINADOR]: 'Agente coordinador que orquesta tareas entre múltiples agentes.',
      [TipoAgente.SOLUCIONADOR]: 'Agente solucionador experto en resolver novedades y problemas de entrega.',
      [TipoAgente.COMUNICADOR]: 'Agente comunicador experto en atención al cliente multicanal.',
      [TipoAgente.RASTREADOR]: 'Agente rastreador especializado en seguimiento y validación de guías.'
    };
    return prompts[tipo];
  }

  private crearEstadoPais(pais: Pais): EstadoPais {
    return {
      pais,
      estado: 'operativo',
      agentesActivos: Math.floor(Math.random() * 20) + 30,
      guiasActivas: Math.floor(Math.random() * 1000) + 500,
      novedadesActivas: Math.floor(Math.random() * 20) + 5,
      conversacionesActivas: Math.floor(Math.random() * 30) + 10,
      metricas: this.crearMetricasIniciales(pais)
    };
  }

  private crearMetricasIniciales(pais: Pais): MetricasCiudad {
    return {
      timestamp: new Date(),
      pais,
      agentesActivos: Math.floor(Math.random() * 30) + 40,
      agentesTrabajando: Math.floor(Math.random() * 20) + 20,
      tareasEnCola: Math.floor(Math.random() * 50) + 10,
      tareasEnProceso: Math.floor(Math.random() * 30) + 15,
      tareasCompletadasHoy: Math.floor(Math.random() * 500) + 200,
      tareasFallidasHoy: Math.floor(Math.random() * 15) + 5,
      guiasRastreadas: Math.floor(Math.random() * 2000) + 1000,
      guiasConNovedad: Math.floor(Math.random() * 30) + 10,
      guiasCriticas: Math.floor(Math.random() * 5) + 1,
      conversacionesActivas: Math.floor(Math.random() * 50) + 20,
      tiempoRespuestaPromedio: parseFloat((Math.random() * 10 + 5).toFixed(1)),
      novedadesActivas: Math.floor(Math.random() * 20) + 5,
      novedadesResueltasHoy: Math.floor(Math.random() * 100) + 50,
      tasaResolucion: parseFloat((Math.random() * 10 + 85).toFixed(1)),
      pedidosProcesadosHoy: Math.floor(Math.random() * 300) + 100,
      pedidosPendientes: Math.floor(Math.random() * 30) + 10,
      tasaAutomatizacion: parseFloat((Math.random() * 5 + 92).toFixed(1)),
      satisfaccionCliente: parseFloat((Math.random() * 10 + 85).toFixed(1))
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS Y CONSULTAS
  // ═══════════════════════════════════════════════════════════════════════════

  getEstado(): EstadoCiudadAgentes {
    return this.estado;
  }

  getDistrito(id: DistritoId): Distrito | undefined {
    return this.estado.distritos.find(d => d.id === id);
  }

  getDistritos(): Distrito[] {
    return this.estado.distritos;
  }

  getAgentes(distritoId?: DistritoId, pais?: Pais): Agente[] {
    let agentes: Agente[] = [];

    this.estado.distritos.forEach(distrito => {
      if (!distritoId || distrito.id === distritoId) {
        agentes = [...agentes, ...distrito.agentes];
      }
    });

    if (pais) {
      agentes = agentes.filter(a => a.pais === pais);
    }

    return agentes;
  }

  getAgente(id: string): Agente | undefined {
    for (const distrito of this.estado.distritos) {
      const agente = distrito.agentes.find(a => a.id === id);
      if (agente) return agente;
    }
    return undefined;
  }

  getMetricas(pais?: Pais): MetricasCiudad {
    if (pais && this.estado.estadoPorPais[pais]) {
      return this.estado.estadoPorPais[pais].metricas;
    }
    return this.estado.metricas;
  }

  getEstadoPais(pais: Pais): EstadoPais {
    return this.estado.estadoPorPais[pais];
  }

  getAlertas(pais?: Pais): AlertaCiudad[] {
    if (pais) {
      return this.estado.alertasActivas.filter(a => a.pais === pais);
    }
    return this.estado.alertasActivas;
  }

  getAprendizajes(): Aprendizaje[] {
    return this.aprendizajes;
  }

  getPatrones(): PatronDetectado[] {
    return this.patronesDetectados;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════

  getEstadisticasGenerales() {
    const totalAgentes = this.getAgentes().length;
    const agentesActivos = this.getAgentes().filter(a =>
      a.estado === EstadoAgente.ACTIVO || a.estado === EstadoAgente.TRABAJANDO
    ).length;

    const tareasTotal = this.estado.distritos.reduce((sum, d) => sum + d.tareasHoy, 0);
    const tareasCompletadas = this.estado.distritos.reduce((sum, d) => sum + d.tareasCompletadasHoy, 0);

    return {
      agentesTotales: totalAgentes,
      agentesActivos,
      agentesTrabajando: this.getAgentes().filter(a => a.estado === EstadoAgente.TRABAJANDO).length,
      distritosOperativos: this.estado.distritos.filter(d => d.estado === 'operativo').length,
      distritosTotal: this.estado.distritos.length,
      tareasHoy: tareasTotal,
      tareasCompletadas,
      tasaExito: tareasTotal > 0 ? (tareasCompletadas / tareasTotal * 100).toFixed(1) : '100',
      alertasActivas: this.estado.alertasActivas.filter(a => a.activa).length,
      aprendizajes: this.aprendizajes.length,
      paises: {
        colombia: this.estado.estadoPorPais[Pais.COLOMBIA],
        chile: this.estado.estadoPorPais[Pais.CHILE],
        ecuador: this.estado.estadoPorPais[Pais.ECUADOR]
      }
    };
  }

  getEstadisticasAgente(agenteId: string): AgenteEstadisticas | null {
    const agente = this.getAgente(agenteId);
    if (!agente) return null;

    const total = agente.tareasCompletadas + agente.tareasFallidas;
    const tasaExito = total > 0 ? (agente.tareasCompletadas / total * 100) : 100;

    return {
      nombre: agente.nombre,
      tipo: agente.tipo,
      especialidad: agente.especialidad,
      tareasCompletadas: agente.tareasCompletadas,
      tareasFallidas: agente.tareasFallidas,
      tasaExito,
      calificacion: agente.calificacionPromedio,
      experiencia: Math.floor(agente.tareasCompletadas / 10),
      tiempoPromedioRespuesta: agente.tiempoPromedioTarea
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMANDOS MCP (MASTER CONTROL PANEL)
  // ═══════════════════════════════════════════════════════════════════════════

  async ejecutarComando(comando: string, pais?: Pais): Promise<ComandoMCP> {
    const comandoMCP: ComandoMCP = {
      id: `CMD_${Date.now()}`,
      comando,
      parametros: { pais },
      estado: 'analizando',
      recibidoEn: new Date()
    };

    try {
      // Analizar comando con Claude
      const analisis = await this.analizarComando(comando, pais);
      comandoMCP.entendimiento = analisis.entendimiento;
      comandoMCP.plan = analisis.plan;
      comandoMCP.estado = 'ejecutando';

      // Ejecutar plan
      const resultados = await this.ejecutarPlan(analisis.plan);

      comandoMCP.estado = 'completado';
      comandoMCP.resultado = this.formatearResultados(resultados, analisis.plan);
      comandoMCP.completadoEn = new Date();

    } catch (error) {
      comandoMCP.estado = 'error';
      comandoMCP.error = error instanceof Error ? error.message : 'Error desconocido';
    }

    return comandoMCP;
  }

  private async analizarComando(comando: string, pais?: Pais): Promise<{
    entendimiento: string;
    plan: PlanEjecucion;
  }> {
    const estadoResumen = {
      distritos: this.estado.distritos.map(d => ({
        id: d.id,
        nombre: d.nombre,
        estado: d.estado,
        agentes: d.agentes.length,
        alertas: d.alertasActivas
      })),
      metricas: this.getMetricas(pais)
    };

    const prompt = `
Eres el ALCALDE de la Ciudad de Agentes Litper, un sistema de IA que controla logística en Colombia, Chile y Ecuador.

COMANDO DEL USUARIO: "${comando}"
PAÍS SELECCIONADO: ${pais || 'todos'}

ESTADO ACTUAL:
${JSON.stringify(estadoResumen, null, 2)}

Analiza el comando y genera un plan de ejecución. Responde en JSON con este formato exacto:
{
  "entendimiento": "Lo que entendiste del comando",
  "plan": {
    "resumen": "Descripción de la estrategia",
    "complejidad": "simple|media|alta",
    "distritoPrincipal": "tracking|orders|crisis|communications|quality|intelligence|automation",
    "distritosSecundarios": [],
    "requiereValidacion": false,
    "pasos": [
      {
        "orden": 1,
        "descripcion": "Descripción del paso",
        "distritoId": "distrito",
        "tipoAgente": "rastreador|procesador|solucionador|comunicador|calidad|analista|optimizador",
        "datos": {},
        "paralelo": false,
        "critico": true
      }
    ],
    "tiempoEstimado": 30,
    "riesgos": []
  }
}`;

    try {
      const respuesta = await askAssistant(prompt);
      const jsonMatch = respuesta.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error analizando comando:', error);
    }

    // Fallback: plan básico
    return {
      entendimiento: `Ejecutar: ${comando}`,
      plan: {
        resumen: 'Consulta general del sistema',
        complejidad: 'simple',
        distritoPrincipal: DistritoId.INTELLIGENCE,
        distritosSecundarios: [],
        requiereValidacion: false,
        pasos: [{
          orden: 1,
          descripcion: 'Procesar consulta',
          distritoId: DistritoId.INTELLIGENCE,
          tipoAgente: TipoAgente.ANALISTA,
          datos: { comando },
          paralelo: false,
          critico: false
        }],
        tiempoEstimado: 5,
        riesgos: []
      }
    };
  }

  private async ejecutarPlan(plan: PlanEjecucion): Promise<TareaResultado[]> {
    const resultados: TareaResultado[] = [];

    for (const paso of plan.pasos.sort((a, b) => a.orden - b.orden)) {
      const resultado = await this.ejecutarPaso(paso);
      resultados.push(resultado);

      if (paso.critico && resultado.estado !== 'exitoso') {
        break; // Detener si paso crítico falla
      }
    }

    return resultados;
  }

  private async ejecutarPaso(paso: PasoEjecucion): Promise<TareaResultado> {
    const inicio = Date.now();

    // Simular ejecución del paso
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    return {
      estado: 'exitoso',
      datos: {
        paso: paso.orden,
        descripcion: paso.descripcion,
        distrito: paso.distritoId
      },
      tiempoProcesamiento: (Date.now() - inicio) / 1000,
      agenteId: `AGENT_${paso.distritoId.toUpperCase()}_001`
    };
  }

  private formatearResultados(resultados: TareaResultado[], plan: PlanEjecucion): string {
    const exitosos = resultados.filter(r => r.estado === 'exitoso').length;
    const total = resultados.length;

    return `${plan.resumen}

Resultados: ${exitosos}/${total} pasos completados exitosamente.
Tiempo total: ${resultados.reduce((sum, r) => sum + r.tiempoProcesamiento, 0).toFixed(1)}s`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE TAREAS
  // ═══════════════════════════════════════════════════════════════════════════

  async asignarTarea(tarea: Omit<Tarea, 'id' | 'creadaEn'>): Promise<Tarea> {
    const nuevaTarea: Tarea = {
      ...tarea,
      id: `TASK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creadaEn: new Date()
    };

    this.colaTareas.push(nuevaTarea);
    this.actualizarMetricasDistrito(tarea.distritoId, 'tareas', 1);

    return nuevaTarea;
  }

  async procesarTarea(tareaId: string): Promise<TareaResultado | null> {
    const tarea = this.colaTareas.find(t => t.id === tareaId);
    if (!tarea) return null;

    tarea.estado = EstadoTarea.EN_PROGRESO;
    tarea.iniciadaEn = new Date();

    const inicio = Date.now();

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      const resultado: TareaResultado = {
        estado: 'exitoso',
        datos: { procesoCompletado: true },
        tiempoProcesamiento: (Date.now() - inicio) / 1000,
        agenteId: tarea.agenteAsignado || 'AUTO_ASSIGNED'
      };

      tarea.estado = EstadoTarea.COMPLETADA;
      tarea.completadaEn = new Date();
      tarea.resultado = resultado;

      this.historialTareas.push(resultado);
      this.actualizarMetricasDistrito(tarea.distritoId, 'completadas', 1);

      // Registrar aprendizaje
      this.registrarAprendizaje({
        tipo: 'experiencia',
        categoria: tarea.tipo,
        descripcion: `Tarea completada: ${tarea.descripcion}`,
        datos: resultado.datos,
        impacto: 'bajo',
        origenPais: tarea.pais
      });

      return resultado;
    } catch (error) {
      tarea.estado = EstadoTarea.FALLIDA;
      return {
        estado: 'fallido',
        datos: {},
        mensaje: error instanceof Error ? error.message : 'Error',
        tiempoProcesamiento: (Date.now() - inicio) / 1000,
        agenteId: tarea.agenteAsignado || 'AUTO_ASSIGNED'
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE AGENTES
  // ═══════════════════════════════════════════════════════════════════════════

  async crearAgente(config: {
    distritoId: DistritoId;
    tipo: TipoAgente;
    pais: Pais;
    especialidad: string;
  }): Promise<Agente> {
    const distrito = this.getDistrito(config.distritoId);
    if (!distrito) throw new Error('Distrito no encontrado');

    const numero = distrito.agentes.length + 1;
    const nuevoAgente: Agente = {
      id: `${config.distritoId}_${config.pais}_${numero}`.toUpperCase(),
      nombre: this.generarNombreAgente(config.distritoId, config.tipo, config.pais, numero),
      tipo: config.tipo,
      especialidad: config.especialidad,
      estado: EstadoAgente.ACTIVO,
      pais: config.pais,
      distritoId: config.distritoId,
      tareasCompletadas: 0,
      tareasFallidas: 0,
      tiempoPromedioTarea: 0,
      calificacionPromedio: 10,
      capacidadMaxima: 50,
      tareasActuales: 0,
      creadoEn: new Date(),
      ultimaActividad: new Date(),
      sistemaPrompt: this.getSistemaPromptPorTipo(config.tipo),
      parametros: {}
    };

    distrito.agentes.push(nuevoAgente);
    distrito.agentesActivos++;

    this.guardarEstado(this.estado);

    return nuevoAgente;
  }

  pausarAgente(agenteId: string): boolean {
    const agente = this.getAgente(agenteId);
    if (!agente) return false;

    agente.estado = EstadoAgente.PAUSADO;
    this.guardarEstado(this.estado);
    return true;
  }

  activarAgente(agenteId: string): boolean {
    const agente = this.getAgente(agenteId);
    if (!agente) return false;

    agente.estado = EstadoAgente.ACTIVO;
    this.guardarEstado(this.estado);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APRENDIZAJE
  // ═══════════════════════════════════════════════════════════════════════════

  registrarAprendizaje(datos: Omit<Aprendizaje, 'id' | 'aplicaciones' | 'tasaExito' | 'validado' | 'activo' | 'creadoEn'>): Aprendizaje {
    const aprendizaje: Aprendizaje = {
      ...datos,
      id: `LEARN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      aplicaciones: 0,
      tasaExito: 0,
      validado: false,
      activo: true,
      creadoEn: new Date()
    };

    this.aprendizajes.push(aprendizaje);
    this.estado.aprendizajesTotales++;
    this.estado.ultimoAprendizaje = new Date();

    this.guardarAprendizajes();
    this.guardarEstado(this.estado);

    return aprendizaje;
  }

  detectarPatron(patron: Omit<PatronDetectado, 'id' | 'detectadoEn'>): PatronDetectado {
    const nuevoPatron: PatronDetectado = {
      ...patron,
      id: `PATTERN_${Date.now()}`,
      detectadoEn: new Date()
    };

    this.patronesDetectados.push(nuevoPatron);
    return nuevoPatron;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALERTAS
  // ═══════════════════════════════════════════════════════════════════════════

  crearAlerta(datos: Omit<AlertaCiudad, 'id' | 'creadaEn' | 'activa' | 'leida' | 'resuelta'>): AlertaCiudad {
    const alerta: AlertaCiudad = {
      ...datos,
      id: `ALERT_${Date.now()}`,
      activa: true,
      leida: false,
      resuelta: false,
      creadaEn: new Date()
    };

    this.estado.alertasActivas.push(alerta);
    this.guardarEstado(this.estado);

    return alerta;
  }

  resolverAlerta(alertaId: string): boolean {
    const alerta = this.estado.alertasActivas.find(a => a.id === alertaId);
    if (!alerta) return false;

    alerta.activa = false;
    alerta.resuelta = true;
    alerta.resueltaEn = new Date();

    this.guardarEstado(this.estado);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTRICAS
  // ═══════════════════════════════════════════════════════════════════════════

  private actualizarMetricasDistrito(distritoId: DistritoId, tipo: 'tareas' | 'completadas' | 'fallidas', cantidad: number) {
    const distrito = this.getDistrito(distritoId);
    if (!distrito) return;

    switch (tipo) {
      case 'tareas':
        distrito.tareasHoy += cantidad;
        break;
      case 'completadas':
        distrito.tareasCompletadasHoy += cantidad;
        distrito.tasaExitoHoy = distrito.tareasHoy > 0
          ? (distrito.tareasCompletadasHoy / distrito.tareasHoy * 100)
          : 100;
        break;
      case 'fallidas':
        distrito.tasaExitoHoy = distrito.tareasHoy > 0
          ? (distrito.tareasCompletadasHoy / distrito.tareasHoy * 100)
          : 100;
        break;
    }

    this.guardarEstado(this.estado);
  }

  actualizarMetricas(pais: Pais) {
    const estadoPais = this.estado.estadoPorPais[pais];
    if (!estadoPais) return;

    estadoPais.metricas = {
      ...estadoPais.metricas,
      timestamp: new Date()
    };

    this.estado.metricas = {
      ...this.estado.metricas,
      timestamp: new Date()
    };

    this.estado.ultimaActualizacion = new Date();
    this.guardarEstado(this.estado);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════

  private cargarEstado(): EstadoCiudadAgentes | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const estado = JSON.parse(data);
        // Convertir strings de fecha a objetos Date
        estado.iniciadoEn = new Date(estado.iniciadoEn);
        estado.ultimaActualizacion = new Date(estado.ultimaActualizacion);
        return estado;
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
    return null;
  }

  private guardarEstado(estado: EstadoCiudadAgentes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (error) {
      console.error('Error guardando estado:', error);
    }
  }

  private cargarAprendizajes(): Aprendizaje[] {
    try {
      const data = localStorage.getItem(APRENDIZAJES_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error cargando aprendizajes:', error);
    }
    return [];
  }

  private guardarAprendizajes() {
    try {
      localStorage.setItem(APRENDIZAJES_KEY, JSON.stringify(this.aprendizajes));
    } catch (error) {
      console.error('Error guardando aprendizajes:', error);
    }
  }

  resetear() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(APRENDIZAJES_KEY);
    this.estado = this.inicializarEstado();
    this.aprendizajes = [];
    this.patronesDetectados = [];
    this.colaTareas = [];
    this.historialTareas = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCIA SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const ciudadAgentes = new CiudadDeAgentes();

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES EXPORTADAS
// ═══════════════════════════════════════════════════════════════════════════════

export const getEstadoCiudad = () => ciudadAgentes.getEstado();
export const getDistritos = () => ciudadAgentes.getDistritos();
export const getDistrito = (id: DistritoId) => ciudadAgentes.getDistrito(id);
export const getAgentes = (distritoId?: DistritoId, pais?: Pais) => ciudadAgentes.getAgentes(distritoId, pais);
export const getAgente = (id: string) => ciudadAgentes.getAgente(id);
export const getMetricas = (pais?: Pais) => ciudadAgentes.getMetricas(pais);
export const getEstadoPais = (pais: Pais) => ciudadAgentes.getEstadoPais(pais);
export const getAlertas = (pais?: Pais) => ciudadAgentes.getAlertas(pais);
export const getAprendizajes = () => ciudadAgentes.getAprendizajes();
export const getPatrones = () => ciudadAgentes.getPatrones();
export const getEstadisticasGenerales = () => ciudadAgentes.getEstadisticasGenerales();
export const getEstadisticasAgente = (id: string) => ciudadAgentes.getEstadisticasAgente(id);

export const ejecutarComandoMCP = (comando: string, pais?: Pais) => ciudadAgentes.ejecutarComando(comando, pais);
export const asignarTarea = (tarea: Omit<Tarea, 'id' | 'creadaEn'>) => ciudadAgentes.asignarTarea(tarea);
export const procesarTarea = (id: string) => ciudadAgentes.procesarTarea(id);

export const crearAgente = (config: Parameters<typeof ciudadAgentes.crearAgente>[0]) => ciudadAgentes.crearAgente(config);
export const pausarAgente = (id: string) => ciudadAgentes.pausarAgente(id);
export const activarAgente = (id: string) => ciudadAgentes.activarAgente(id);

export const registrarAprendizaje = (datos: Parameters<typeof ciudadAgentes.registrarAprendizaje>[0]) => ciudadAgentes.registrarAprendizaje(datos);
export const detectarPatron = (patron: Parameters<typeof ciudadAgentes.detectarPatron>[0]) => ciudadAgentes.detectarPatron(patron);

export const crearAlerta = (datos: Parameters<typeof ciudadAgentes.crearAlerta>[0]) => ciudadAgentes.crearAlerta(datos);
export const resolverAlerta = (id: string) => ciudadAgentes.resolverAlerta(id);

export const resetearCiudad = () => ciudadAgentes.resetear();
