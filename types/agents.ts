/**
 * 🌆 CIUDAD DE AGENTES LITPER - SISTEMA DE TIPOS
 * Sistema de automatización total con IA para logística multi-país
 * Colombia, Chile, Ecuador
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS Y CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

export enum TipoAgente {
  PROCESADOR = 'procesador',
  ANALISTA = 'analista',
  CALIDAD = 'calidad',
  OPTIMIZADOR = 'optimizador',
  ENTRENADOR = 'entrenador',
  CREADOR = 'creador',
  COORDINADOR = 'coordinador',
  SOLUCIONADOR = 'solucionador',
  COMUNICADOR = 'comunicador',
  RASTREADOR = 'rastreador'
}

export enum EstadoAgente {
  ACTIVO = 'activo',
  TRABAJANDO = 'trabajando',
  ESPERANDO = 'esperando',
  PAUSADO = 'pausado',
  ERROR = 'error',
  MANTENIMIENTO = 'mantenimiento'
}

export enum EstadoTarea {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
  FALLIDA = 'fallida',
  CANCELADA = 'cancelada',
  ESCALADA = 'escalada'
}

export enum Pais {
  COLOMBIA = 'colombia',
  CHILE = 'chile',
  ECUADOR = 'ecuador'
}

export enum DistritoId {
  TRACKING = 'tracking',
  ORDERS = 'orders',
  CRISIS = 'crisis',
  COMMUNICATIONS = 'communications',
  QUALITY = 'quality',
  INTELLIGENCE = 'intelligence',
  AUTOMATION = 'automation'
}

export enum TipoNovedad {
  CLIENTE_NO_ESTABA = 'cliente_no_estaba',
  DIRECCION_INCORRECTA = 'direccion_incorrecta',
  TELEFONO_NO_CONTESTA = 'telefono_no_contesta',
  REHUSADO = 'rehusado',
  PAQUETE_DANADO = 'paquete_danado',
  RECLAMO_OFICINA = 'reclamo_oficina',
  OTRO = 'otro'
}

export enum NivelPrioridad {
  BAJA = 1,
  NORMAL = 2,
  ALTA = 3,
  URGENTE = 4,
  CRITICA = 5
}

export enum CanalComunicacion {
  WHATSAPP = 'whatsapp',
  EMAIL = 'email',
  LLAMADA = 'llamada',
  SMS = 'sms',
  CHAT_WEB = 'chat_web'
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES CORE - AGENTES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Agente {
  id: string;
  nombre: string;
  tipo: TipoAgente;
  especialidad: string;
  estado: EstadoAgente;
  pais: Pais;
  distritoId: DistritoId;

  // Métricas
  tareasCompletadas: number;
  tareasFallidas: number;
  tiempoPromedioTarea: number; // en segundos
  calificacionPromedio: number; // 1-10

  // Capacidades
  capacidadMaxima: number; // tareas simultáneas
  tareasActuales: number;

  // Timestamps
  creadoEn: Date;
  ultimaActividad: Date;

  // Configuración
  sistemaPrompt: string;
  parametros: Record<string, any>;
}

export interface AgenteEstadisticas {
  nombre: string;
  tipo: TipoAgente;
  especialidad: string;
  tareasCompletadas: number;
  tareasFallidas: number;
  tasaExito: number; // porcentaje
  calificacion: number;
  experiencia: number; // cantidad de aprendizajes
  tiempoPromedioRespuesta: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - TAREAS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Tarea {
  id: string;
  tipo: string;
  descripcion: string;
  estado: EstadoTarea;
  prioridad: NivelPrioridad;

  // Asignación
  agenteAsignado?: string;
  distritoId: DistritoId;
  pais: Pais;

  // Datos
  datosEntrada: Record<string, any>;
  resultado?: TareaResultado;

  // Control
  intentos: number;
  maxIntentos: number;

  // Timestamps
  creadaEn: Date;
  iniciadaEn?: Date;
  completadaEn?: Date;

  // Metadatos
  metadata?: Record<string, any>;
}

export interface TareaResultado {
  estado: 'exitoso' | 'fallido' | 'parcial';
  datos: Record<string, any>;
  mensaje?: string;
  tiempoProcesamiento: number; // segundos
  agenteId: string;
  observaciones?: string[];
  siguienteAccion?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - DISTRITOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Distrito {
  id: DistritoId;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;

  // Agentes
  agentes: Agente[];
  agentesActivos: number;

  // Estado
  estado: 'operativo' | 'degradado' | 'critico' | 'mantenimiento';
  alertasActivas: number;

  // Métricas
  tareasHoy: number;
  tareasCompletadasHoy: number;
  tasaExitoHoy: number;
  tiempoPromedioHoy: number;
}

export interface DistritoConfig {
  id: DistritoId;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  colorBg: string;
  agentesMinimos: number;
  agentesMaximos: number;
  tiposAgente: TipoAgente[];
  caracteristicas?: string[]; // Lista de características del distrito en español
  tareas?: string[]; // Lista de tareas que realizan los agentes del distrito
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - SEGUIMIENTO DE GUÍAS
// ═══════════════════════════════════════════════════════════════════════════════

export interface GuiaRastreada {
  numeroGuia: string;
  transportadora: string;
  pais: Pais;

  // Estados
  estadoAPI: string;
  estadoValidado: string;
  estadoReal: string;
  esConfiable: boolean;

  // Ubicación
  ultimaUbicacion?: string;
  ultimaActualizacion: Date;

  // Cliente
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  direccionEntrega: string;
  ciudad: string;

  // Métricas
  diasEnTransito: number;
  diasEstimados: number;
  riesgoRetraso: number; // 0-100

  // Validación cruzada
  validacionTriple: {
    apiConfirma: boolean;
    gpsConfirma: boolean;
    clienteConfirma: boolean;
  };

  // Historial
  historialEventos: EventoGuia[];

  // Predicción
  prediccionEntrega?: Date;
  probabilidadNovedad: number;
}

export interface EventoGuia {
  timestamp: Date;
  tipo: string;
  descripcion: string;
  ubicacion?: string;
  fuente: 'api' | 'agente' | 'cliente' | 'sistema';
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - NOVEDADES Y CRISIS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Novedad {
  id: string;
  guiaId: string;
  tipo: TipoNovedad;
  descripcion: string;
  pais: Pais;
  ciudad: string;

  // Estado
  estado: 'nueva' | 'en_gestion' | 'resuelta' | 'escalada' | 'perdida';
  prioridad: NivelPrioridad;

  // Reintentos
  intentoActual: number;
  maxIntentos: number;

  // Historial de gestión
  gestiones: GestionNovedad[];

  // Asignación
  agenteAsignado?: string;

  // Cliente
  clienteNombre: string;
  clienteTelefono: string;
  clienteContactado: boolean;
  clienteRespuesta?: string;

  // Solución
  solucionAplicada?: string;
  fechaResolucion?: Date;

  // Timestamps
  creadaEn: Date;
  ultimaActualizacion: Date;
}

export interface GestionNovedad {
  id: string;
  timestamp: Date;
  agenteId: string;
  accion: string;
  canal: CanalComunicacion;
  resultado: 'exitoso' | 'sin_respuesta' | 'rechazado' | 'pendiente';
  notas?: string;
  siguientePaso?: string;
}

export interface EstrategiaSolucion {
  tipo: TipoNovedad;
  prioridad: NivelPrioridad;
  acciones: AccionSolucion[];
  tasaExitoHistorica: number;
}

export interface AccionSolucion {
  orden: number;
  canal: CanalComunicacion;
  mensaje: string;
  esperaMaxima: number; // minutos
  fallback?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - PEDIDOS
// ═══════════════════════════════════════════════════════════════════════════════

export interface Pedido {
  id: string;
  origenPlataforma: 'chatea_pro' | 'shopify' | 'web' | 'manual';
  origenId?: string; // ID en plataforma origen

  // Estado
  estado: 'nuevo' | 'validando' | 'procesando' | 'creado_dropi' | 'con_guia' | 'error';

  // Cliente
  cliente: {
    nombre: string;
    telefono: string;
    email?: string;
    direccion: string;
    ciudad: string;
    pais: Pais;
    notas?: string;
  };

  // Productos
  productos: ProductoPedido[];

  // Valores
  subtotal: number;
  envio: number;
  total: number;
  moneda: string;

  // Validación
  requiereValidacion: boolean;
  datosValidados: boolean;
  validacionNotas?: string;

  // Dropi
  dropiOrderId?: string;
  guiaNumero?: string;
  transportadora?: string;

  // Timestamps
  creadoEn: Date;
  procesadoEn?: Date;

  // Agente
  agenteAsignado?: string;
}

export interface ProductoPedido {
  id: string;
  nombre: string;
  sku?: string;
  cantidad: number;
  precioUnitario: number;
  disponible: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - COMUNICACIONES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Conversacion {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  pais: Pais;

  // Estado
  estado: 'activa' | 'esperando_cliente' | 'resuelta' | 'escalada';
  tipo: 'consulta' | 'reclamo' | 'seguimiento' | 'confirmacion' | 'novedad';

  // Canal
  canal: CanalComunicacion;

  // Agente
  agenteAsignado?: string;

  // Mensajes
  mensajes: Mensaje[];

  // Contexto
  pedidoRelacionado?: string;
  guiaRelacionada?: string;

  // Métricas
  tiempoRespuesta: number; // segundos promedio
  satisfaccionCliente?: number; // 1-5

  // Timestamps
  iniciadaEn: Date;
  ultimoMensaje: Date;
  resueltaEn?: Date;
}

export interface Mensaje {
  id: string;
  tipo: 'entrante' | 'saliente';
  contenido: string;
  timestamp: Date;
  emisor: 'cliente' | 'agente' | 'sistema';
  agenteId?: string;
  leido: boolean;
  metadata?: Record<string, any>;
}

export interface LlamadaProgramada {
  id: string;
  tipo: 'confirmacion' | 'novedad' | 'reclamo' | 'seguimiento';
  clienteNombre: string;
  clienteTelefono: string;
  pais: Pais;

  // Programación
  programadaPara: Date;
  estado: 'pendiente' | 'en_curso' | 'completada' | 'fallida' | 'cancelada';

  // Contexto
  motivo: string;
  guiaRelacionada?: string;
  pedidoRelacionado?: string;

  // Resultado
  resultado?: 'exitosa' | 'no_contesta' | 'ocupado' | 'numero_invalido';
  notas?: string;
  duracion?: number; // segundos

  // Agente
  agenteAsignado?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - APRENDIZAJE E INTELIGENCIA
// ═══════════════════════════════════════════════════════════════════════════════

export interface Aprendizaje {
  id: string;
  tipo: 'experiencia' | 'patron' | 'optimizacion' | 'error' | 'feedback';
  categoria: string;

  // Contenido
  descripcion: string;
  datos: Record<string, any>;

  // Impacto
  impacto: 'bajo' | 'medio' | 'alto' | 'critico';
  aplicaciones: number; // veces usado
  tasaExito: number;

  // Origen
  origenAgente?: string;
  origenPais: Pais;

  // Estado
  validado: boolean;
  activo: boolean;

  // Timestamps
  creadoEn: Date;
  ultimoUso?: Date;
}

export interface PatronDetectado {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'tendencia' | 'anomalia' | 'oportunidad' | 'riesgo';

  // Datos
  datosPatron: Record<string, any>;
  confianza: number; // 0-100

  // Contexto
  paisesAfectados: Pais[];
  transportadorasAfectadas?: string[];
  ciudadesAfectadas?: string[];

  // Recomendaciones
  recomendaciones: string[];
  accionSugerida?: string;
  impactoEstimado?: string;

  // Estado
  validado: boolean;
  implementado: boolean;

  // Timestamps
  detectadoEn: Date;
  implementadoEn?: Date;
}

export interface Optimizacion {
  id: string;
  proceso: string;
  descripcion: string;

  // Métricas antes/después
  metricasAntes: Record<string, number>;
  metricasDespues: Record<string, number>;
  mejoraPorcentaje: number;

  // Estado
  estado: 'propuesta' | 'probando' | 'implementada' | 'rechazada';
  dificultad: 'baja' | 'media' | 'alta';
  prioridad: number; // 1-10

  // ROI
  roiEstimado: string;
  costoImplementacion: number;

  // Timestamps
  propuestaEn: Date;
  implementadaEn?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - MÉTRICAS Y DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export interface MetricasCiudad {
  timestamp: Date;
  pais: Pais;

  // Agentes
  agentesActivos: number;
  agentesTrabajando: number;

  // Tareas
  tareasEnCola: number;
  tareasEnProceso: number;
  tareasCompletadasHoy: number;
  tareasFallidasHoy: number;

  // Guías
  guiasRastreadas: number;
  guiasConNovedad: number;
  guiasCriticas: number;

  // Comunicaciones
  conversacionesActivas: number;
  tiempoRespuestaPromedio: number;

  // Novedades
  novedadesActivas: number;
  novedadesResueltasHoy: number;
  tasaResolucion: number;

  // Pedidos
  pedidosProcesadosHoy: number;
  pedidosPendientes: number;

  // Eficiencia
  tasaAutomatizacion: number;
  satisfaccionCliente: number;
}

export interface AlertaCiudad {
  id: string;
  tipo: 'info' | 'warning' | 'error' | 'critical';
  distrito: DistritoId;
  pais: Pais;

  titulo: string;
  mensaje: string;

  // Estado
  activa: boolean;
  leida: boolean;
  resuelta: boolean;

  // Acción
  accionRequerida?: string;
  accionTomada?: string;

  // Timestamps
  creadaEn: Date;
  resueltaEn?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - MCP (MASTER CONTROL PANEL)
// ═══════════════════════════════════════════════════════════════════════════════

export interface ComandoMCP {
  id: string;
  comando: string;
  parametros: Record<string, any>;

  // Usuario
  usuarioId?: string;

  // Ejecución
  estado: 'recibido' | 'analizando' | 'ejecutando' | 'completado' | 'error';

  // Resultado
  entendimiento?: string;
  plan?: PlanEjecucion;
  resultado?: string;
  error?: string;

  // Timestamps
  recibidoEn: Date;
  completadoEn?: Date;
}

export interface PlanEjecucion {
  resumen: string;
  complejidad: 'simple' | 'media' | 'alta';
  distritoPrincipal: DistritoId;
  distritosSecundarios: DistritoId[];
  requiereValidacion: boolean;
  pasos: PasoEjecucion[];
  tiempoEstimado: number; // segundos
  riesgos: string[];
}

export interface PasoEjecucion {
  orden: number;
  descripcion: string;
  distritoId: DistritoId;
  agenteRequerido?: string;
  tipoAgente: TipoAgente;
  datos: Record<string, any>;
  paralelo: boolean;
  critico: boolean;
  estado?: EstadoTarea;
  resultado?: TareaResultado;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES - ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════

export interface EstadoCiudadAgentes {
  // General
  nombre: string;
  version: string;
  estado: 'operativo' | 'degradado' | 'critico' | 'mantenimiento';

  // Por país
  estadoPorPais: Record<Pais, EstadoPais>;

  // Distritos
  distritos: Distrito[];

  // Métricas globales
  metricas: MetricasCiudad;

  // Alertas
  alertasActivas: AlertaCiudad[];

  // Aprendizaje
  aprendizajesTotales: number;
  ultimoAprendizaje?: Date;

  // Timestamps
  iniciadoEn: Date;
  ultimaActualizacion: Date;
}

export interface EstadoPais {
  pais: Pais;
  estado: 'operativo' | 'degradado' | 'critico';
  agentesActivos: number;
  guiasActivas: number;
  novedadesActivas: number;
  conversacionesActivas: number;
  metricas: MetricasCiudad;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIONES DE DISTRITOS
// ═══════════════════════════════════════════════════════════════════════════════

export const DISTRITOS_CONFIG: DistritoConfig[] = [
  {
    id: DistritoId.TRACKING,
    nombre: '🎯 Distrito de Rastreo',
    descripcion: 'Monitoreo en tiempo real de todas las guías con validación triple de estados',
    icono: '🎯',
    color: 'text-blue-500',
    colorBg: 'bg-blue-500/10',
    agentesMinimos: 10,
    agentesMaximos: 30,
    tiposAgente: [TipoAgente.RASTREADOR, TipoAgente.ANALISTA],
    caracteristicas: [
      '✓ Rastreo automático cada 30 minutos',
      '✓ Validación triple: API + GPS + Confirmación cliente',
      '✓ Alertas instantáneas de retrasos',
      '✓ Historial completo de movimientos'
    ],
    tareas: [
      'Actualizar estados de guías',
      'Detectar guías estancadas',
      'Generar alertas de retraso',
      'Validar entregas exitosas'
    ]
  },
  {
    id: DistritoId.ORDERS,
    nombre: '📦 Distrito de Pedidos',
    descripcion: 'Procesamiento automático de pedidos desde Chatea Pro, Shopify y otras fuentes',
    icono: '📦',
    color: 'text-green-500',
    colorBg: 'bg-green-500/10',
    agentesMinimos: 8,
    agentesMaximos: 25,
    tiposAgente: [TipoAgente.PROCESADOR, TipoAgente.COORDINADOR],
    caracteristicas: [
      '✓ Integración con Chatea Pro y Shopify',
      '✓ Validación automática de direcciones',
      '✓ Asignación inteligente de transportadora',
      '✓ Generación automática de guías'
    ],
    tareas: [
      'Capturar pedidos nuevos',
      'Validar información del cliente',
      'Asignar transportadora óptima',
      'Generar guía y notificar'
    ]
  },
  {
    id: DistritoId.CRISIS,
    nombre: '🚨 Distrito de Crisis',
    descripcion: 'Gestión de novedades, reintentos inteligentes y recuperación de entregas',
    icono: '🚨',
    color: 'text-red-500',
    colorBg: 'bg-red-500/10',
    agentesMinimos: 15,
    agentesMaximos: 40,
    tiposAgente: [TipoAgente.SOLUCIONADOR, TipoAgente.COMUNICADOR],
    caracteristicas: [
      '✓ Hasta 3 reintentos automáticos',
      '✓ Contacto multicanal: WhatsApp, llamada, SMS',
      '✓ Escalamiento inteligente por prioridad',
      '✓ Tasa de resolución del 91%'
    ],
    tareas: [
      'Detectar guías con novedad',
      'Contactar al cliente automáticamente',
      'Coordinar reintentos de entrega',
      'Escalar casos críticos'
    ]
  },
  {
    id: DistritoId.COMMUNICATIONS,
    nombre: '📞 Distrito de Comunicaciones',
    descripcion: 'Centro de atención multicanal: WhatsApp, llamadas, email y chat web',
    icono: '📞',
    color: 'text-purple-500',
    colorBg: 'bg-purple-500/10',
    agentesMinimos: 20,
    agentesMaximos: 50,
    tiposAgente: [TipoAgente.COMUNICADOR, TipoAgente.PROCESADOR],
    caracteristicas: [
      '✓ Respuestas automáticas en WhatsApp',
      '✓ Llamadas salientes programadas',
      '✓ Notificaciones proactivas al cliente',
      '✓ Chat web con IA conversacional'
    ],
    tareas: [
      'Responder consultas de clientes',
      'Enviar actualizaciones de estado',
      'Coordinar entregas por teléfono',
      'Gestionar chat en tiempo real'
    ]
  },
  {
    id: DistritoId.QUALITY,
    nombre: '🔍 Distrito de Calidad',
    descripcion: 'Supervisión continua y control de calidad de todos los procesos',
    icono: '🔍',
    color: 'text-yellow-500',
    colorBg: 'bg-yellow-500/10',
    agentesMinimos: 5,
    agentesMaximos: 15,
    tiposAgente: [TipoAgente.CALIDAD, TipoAgente.ANALISTA],
    caracteristicas: [
      '✓ Auditoría automática de procesos',
      '✓ Detección de anomalías en tiempo real',
      '✓ Métricas de satisfacción del cliente',
      '✓ Reportes de calidad diarios'
    ],
    tareas: [
      'Auditar entregas completadas',
      'Evaluar calidad de atención',
      'Detectar errores en procesos',
      'Generar reportes de mejora'
    ]
  },
  {
    id: DistritoId.INTELLIGENCE,
    nombre: '🧠 Distrito de Inteligencia',
    descripcion: 'Aprendizaje automático, detección de patrones y memoria colectiva de la IA',
    icono: '🧠',
    color: 'text-indigo-500',
    colorBg: 'bg-indigo-500/10',
    agentesMinimos: 8,
    agentesMaximos: 20,
    tiposAgente: [TipoAgente.ANALISTA, TipoAgente.ENTRENADOR],
    caracteristicas: [
      '✓ Detección de patrones de retraso',
      '✓ Predicción de riesgo con ML',
      '✓ Memoria colectiva compartida',
      '✓ Mejora continua de algoritmos'
    ],
    tareas: [
      'Analizar patrones históricos',
      'Entrenar modelos predictivos',
      'Compartir aprendizajes entre agentes',
      'Optimizar estrategias de entrega'
    ]
  },
  {
    id: DistritoId.AUTOMATION,
    nombre: '⚡ Distrito de Automatización',
    descripcion: 'Creación de nuevos agentes, optimización de procesos y mejora continua',
    icono: '⚡',
    color: 'text-orange-500',
    colorBg: 'bg-orange-500/10',
    agentesMinimos: 5,
    agentesMaximos: 15,
    tiposAgente: [TipoAgente.CREADOR, TipoAgente.OPTIMIZADOR],
    caracteristicas: [
      '✓ Creación dinámica de agentes',
      '✓ Optimización de flujos de trabajo',
      '✓ A/B testing de estrategias',
      '✓ Integración con nuevas APIs'
    ],
    tareas: [
      'Crear agentes especializados',
      'Optimizar tiempos de proceso',
      'Probar nuevas estrategias',
      'Automatizar tareas manuales'
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// ESTRATEGIAS DE SOLUCIÓN POR TIPO DE NOVEDAD
// ═══════════════════════════════════════════════════════════════════════════════

export const ESTRATEGIAS_NOVEDAD: Record<TipoNovedad, EstrategiaSolucion> = {
  [TipoNovedad.CLIENTE_NO_ESTABA]: {
    tipo: TipoNovedad.CLIENTE_NO_ESTABA,
    prioridad: NivelPrioridad.ALTA,
    tasaExitoHistorica: 91,
    acciones: [
      { orden: 1, canal: CanalComunicacion.WHATSAPP, mensaje: 'Opciones de reprogramación', esperaMaxima: 30 },
      { orden: 2, canal: CanalComunicacion.LLAMADA, mensaje: 'Llamada para coordinar', esperaMaxima: 60 },
      { orden: 3, canal: CanalComunicacion.SMS, mensaje: 'SMS urgente', esperaMaxima: 120 }
    ]
  },
  [TipoNovedad.DIRECCION_INCORRECTA]: {
    tipo: TipoNovedad.DIRECCION_INCORRECTA,
    prioridad: NivelPrioridad.ALTA,
    tasaExitoHistorica: 85,
    acciones: [
      { orden: 1, canal: CanalComunicacion.WHATSAPP, mensaje: 'Solicitar dirección correcta', esperaMaxima: 60 },
      { orden: 2, canal: CanalComunicacion.LLAMADA, mensaje: 'Llamada para validar', esperaMaxima: 30 }
    ]
  },
  [TipoNovedad.TELEFONO_NO_CONTESTA]: {
    tipo: TipoNovedad.TELEFONO_NO_CONTESTA,
    prioridad: NivelPrioridad.NORMAL,
    tasaExitoHistorica: 78,
    acciones: [
      { orden: 1, canal: CanalComunicacion.WHATSAPP, mensaje: 'Mensaje inicial', esperaMaxima: 60 },
      { orden: 2, canal: CanalComunicacion.EMAIL, mensaje: 'Email de respaldo', esperaMaxima: 120 },
      { orden: 3, canal: CanalComunicacion.SMS, mensaje: 'SMS urgente', esperaMaxima: 180 },
      { orden: 4, canal: CanalComunicacion.LLAMADA, mensaje: 'Llamada en horario diferente', esperaMaxima: 60 }
    ]
  },
  [TipoNovedad.REHUSADO]: {
    tipo: TipoNovedad.REHUSADO,
    prioridad: NivelPrioridad.URGENTE,
    tasaExitoHistorica: 67,
    acciones: [
      { orden: 1, canal: CanalComunicacion.LLAMADA, mensaje: 'Llamada empática inmediata', esperaMaxima: 15 },
      { orden: 2, canal: CanalComunicacion.WHATSAPP, mensaje: 'Ofrecer opciones', esperaMaxima: 30 }
    ]
  },
  [TipoNovedad.PAQUETE_DANADO]: {
    tipo: TipoNovedad.PAQUETE_DANADO,
    prioridad: NivelPrioridad.CRITICA,
    tasaExitoHistorica: 95,
    acciones: [
      { orden: 1, canal: CanalComunicacion.LLAMADA, mensaje: 'Disculpa y solución inmediata', esperaMaxima: 10 },
      { orden: 2, canal: CanalComunicacion.WHATSAPP, mensaje: 'Confirmar reemplazo', esperaMaxima: 30 }
    ]
  },
  [TipoNovedad.RECLAMO_OFICINA]: {
    tipo: TipoNovedad.RECLAMO_OFICINA,
    prioridad: NivelPrioridad.ALTA,
    tasaExitoHistorica: 76,
    acciones: [
      { orden: 1, canal: CanalComunicacion.LLAMADA, mensaje: 'Llamada para recuperar', esperaMaxima: 60 },
      { orden: 2, canal: CanalComunicacion.WHATSAPP, mensaje: 'Info de oficina + alternativas', esperaMaxima: 120 },
      { orden: 3, canal: CanalComunicacion.SMS, mensaje: 'Recordatorio urgente', esperaMaxima: 1440 }
    ]
  },
  [TipoNovedad.OTRO]: {
    tipo: TipoNovedad.OTRO,
    prioridad: NivelPrioridad.NORMAL,
    tasaExitoHistorica: 70,
    acciones: [
      { orden: 1, canal: CanalComunicacion.WHATSAPP, mensaje: 'Contacto inicial', esperaMaxima: 60 },
      { orden: 2, canal: CanalComunicacion.LLAMADA, mensaje: 'Llamada para entender', esperaMaxima: 60 }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAR TODO
// ═══════════════════════════════════════════════════════════════════════════════

export type MainTabProcesos = 'procesos-litper';
