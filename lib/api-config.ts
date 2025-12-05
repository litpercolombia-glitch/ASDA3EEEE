/**
 * Configuración centralizada de la API del Backend ML
 * Este archivo contiene todas las configuraciones y helpers para comunicarse
 * con el backend de Machine Learning de Litper Logística
 */

// URL base del backend ML (configurable por variable de entorno)
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

// ==================== TIPOS DE DATOS ====================

/**
 * Resultado de una predicción de retraso
 */
export interface Prediccion {
  numero_guia: string;
  probabilidad_retraso: number;
  nivel_riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  dias_estimados_entrega: number;
  fecha_estimada_entrega: string;
  factores_riesgo: string[];
  acciones_recomendadas: string[];
  confianza: number;
  modelo_usado: string;
}

/**
 * Datos del dashboard general
 */
export interface DashboardData {
  estadisticas_generales: {
    total_guias: number;
    guias_entregadas: number;
    guias_en_retraso: number;
    guias_con_novedad: number;
    tasa_entrega: number;
    tasa_retraso: number;
  };
  rendimiento_transportadoras: TransportadoraRendimiento[];
  top_ciudades: CiudadTop[];
  modelos_activos: ModeloActivo[];
  alertas_pendientes: number;
}

/**
 * Rendimiento de una transportadora
 */
export interface TransportadoraRendimiento {
  nombre: string;
  total_guias: number;
  entregas_exitosas: number;
  retrasos: number;
  tasa_retraso: number;
  tiempo_promedio_dias: number;
  calificacion: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'MALO';
}

/**
 * Ciudad con más envíos
 */
export interface CiudadTop {
  ciudad: string;
  total_guias: number;
  porcentaje_del_total: number;
}

/**
 * Modelo ML activo
 */
export interface ModeloActivo {
  nombre: string;
  version: string;
  accuracy: number;
  fecha_entrenamiento: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

/**
 * Respuesta del chat inteligente
 */
export interface ChatResponse {
  respuesta: string;
  tipo_consulta: string;
  datos_consultados: Record<string, unknown>;
  sugerencias: string[];
  tokens_usados: number;
  tiempo_respuesta_ms: number;
}

/**
 * Resultado de carga de Excel
 */
export interface UploadResult {
  exito: boolean;
  archivo: string;
  total_registros: number;
  registros_procesados: number;
  registros_errores: number;
  tiempo_procesamiento_segundos: number;
  errores_detalle: ErrorDetalle[];
  mensaje: string;
}

/**
 * Detalle de error en procesamiento
 */
export interface ErrorDetalle {
  fila: number;
  columna: string;
  valor: string;
  error: string;
}

/**
 * Métricas de un modelo ML
 */
export interface MetricasModelo {
  nombre_modelo: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  fecha_entrenamiento: string;
  total_registros_entrenamiento: number;
  features_importantes: FeatureImportante[];
}

/**
 * Feature importante en el modelo
 */
export interface FeatureImportante {
  nombre: string;
  importancia: number;
}

/**
 * Estado de salud del backend
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: boolean;
  ml_models_loaded: boolean;
  timestamp: string;
  version: string;
  uptime_seconds: number;
}

/**
 * Archivo cargado en el sistema
 */
export interface ArchivoCargado {
  id: number;
  nombre_archivo: string;
  fecha_carga: string;
  total_registros: number;
  registros_procesados: number;
  estado: 'COMPLETADO' | 'ERROR' | 'PROCESANDO';
  usuario_carga: string;
}

/**
 * Resultado del entrenamiento de modelos
 */
export interface ResultadoEntrenamiento {
  exito: boolean;
  modelos_entrenados: string[];
  metricas: MetricasModelo[];
  tiempo_total_segundos: number;
  mensaje: string;
}

/**
 * Conversación del historial de chat
 */
export interface ConversacionHistorial {
  id: number;
  pregunta: string;
  respuesta: string;
  fecha: string;
  tipo_consulta: string;
}

// ==================== CONFIGURACIÓN DE ENDPOINTS ====================

export const API_CONFIG = {
  baseURL: ML_API_BASE_URL,

  endpoints: {
    // Sistema y Health
    health: '/health',
    config: '/config',

    // Memoria (Excel)
    memoria: {
      cargarExcel: '/memoria/cargar-excel',
      archivos: '/memoria/archivos',
      estadisticas: '/memoria/estadisticas',
    },

    // Machine Learning
    ml: {
      entrenar: '/ml/entrenar',
      predecir: '/ml/predecir',
      metricas: '/ml/metricas',
      estadoEntrenamiento: '/ml/estado-entrenamiento',
      prediccionMasiva: '/ml/prediccion-masiva',
    },

    // Chat Inteligente
    chat: {
      preguntar: '/chat/preguntar',
      historial: '/chat/historial',
      ejecutarAccion: '/chat/ejecutar-accion',
    },

    // Dashboard
    dashboard: {
      resumen: '/dashboard/resumen',
      transportadoras: '/dashboard/transportadoras',
      ciudades: '/dashboard/ciudades',
      tendencias: '/dashboard/tendencias',
    },

    // Reportes
    reportes: {
      generar: '/reportes/generar',
      listar: '/reportes/listar',
      descargar: '/reportes/descargar',
    },

    // Alertas
    alertas: {
      listar: '/alertas/listar',
      crear: '/alertas/crear',
      resolver: '/alertas/resolver',
    },

    // Workflows
    workflows: {
      listar: '/workflows/listar',
      crear: '/workflows/crear',
      ejecutar: '/workflows/ejecutar',
      eliminar: '/workflows/eliminar',
    },
  },

  // Tiempo de timeout por defecto (en milisegundos)
  timeout: 30000,

  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

// ==================== CLIENTE API ====================

/**
 * Cliente principal para comunicación con el backend ML
 */
export const mlApi = {
  /**
   * Realiza una petición genérica al backend
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...API_CONFIG.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Error ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('La petición excedió el tiempo de espera');
        }
        throw error;
      }

      throw new Error('Error desconocido en la petición');
    }
  },

  // ==================== MÉTODOS DE MEMORIA ====================

  /**
   * Sube y procesa un archivo Excel
   */
  async cargarExcel(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('archivo', file);

    return this.request<UploadResult>(API_CONFIG.endpoints.memoria.cargarExcel, {
      method: 'POST',
      headers: {}, // FormData establece su propio Content-Type
      body: formData,
    });
  },

  /**
   * Lista los archivos cargados
   */
  async listarArchivos(): Promise<ArchivoCargado[]> {
    return this.request<ArchivoCargado[]>(API_CONFIG.endpoints.memoria.archivos);
  },

  /**
   * Obtiene estadísticas del sistema de memoria
   */
  async getEstadisticasMemoria(): Promise<{
    total_archivos: number;
    total_registros: number;
    ultimo_archivo: string;
    espacio_usado_mb: number;
  }> {
    return this.request(API_CONFIG.endpoints.memoria.estadisticas);
  },

  // ==================== MÉTODOS DE ML ====================

  /**
   * Entrena todos los modelos ML
   */
  async entrenarModelos(): Promise<ResultadoEntrenamiento> {
    return this.request<ResultadoEntrenamiento>(API_CONFIG.endpoints.ml.entrenar, {
      method: 'POST',
    });
  },

  /**
   * Realiza predicción para una guía específica
   */
  async predecir(numeroGuia: string): Promise<Prediccion> {
    return this.request<Prediccion>(API_CONFIG.endpoints.ml.predecir, {
      method: 'POST',
      body: JSON.stringify({ numero_guia: numeroGuia }),
    });
  },

  /**
   * Realiza predicciones masivas para múltiples guías
   */
  async prediccionMasiva(numerosGuias: string[]): Promise<Prediccion[]> {
    return this.request<Prediccion[]>(API_CONFIG.endpoints.ml.prediccionMasiva, {
      method: 'POST',
      body: JSON.stringify({ numeros_guias: numerosGuias }),
    });
  },

  /**
   * Obtiene métricas de los modelos activos
   */
  async getMetricasModelos(): Promise<MetricasModelo[]> {
    return this.request<MetricasModelo[]>(API_CONFIG.endpoints.ml.metricas);
  },

  /**
   * Verifica si se necesita reentrenamiento
   */
  async getEstadoEntrenamiento(): Promise<{
    necesita_reentrenamiento: boolean;
    dias_desde_ultimo: number;
    accuracy_actual: number;
    registros_nuevos: number;
  }> {
    return this.request(API_CONFIG.endpoints.ml.estadoEntrenamiento);
  },

  // ==================== MÉTODOS DE CHAT ====================

  /**
   * Envía una pregunta al chat inteligente
   */
  async chatPreguntar(
    pregunta: string,
    usarContexto: boolean = true
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>(API_CONFIG.endpoints.chat.preguntar, {
      method: 'POST',
      body: JSON.stringify({
        pregunta,
        usar_contexto: usarContexto,
      }),
    });
  },

  /**
   * Obtiene el historial de conversaciones
   */
  async getChatHistorial(limite: number = 50): Promise<ConversacionHistorial[]> {
    return this.request<ConversacionHistorial[]>(
      `${API_CONFIG.endpoints.chat.historial}?limite=${limite}`
    );
  },

  /**
   * Ejecuta una acción desde el chat
   */
  async ejecutarAccionChat(
    accion: string,
    parametros: Record<string, unknown>
  ): Promise<{ exito: boolean; resultado: unknown; mensaje: string }> {
    return this.request(API_CONFIG.endpoints.chat.ejecutarAccion, {
      method: 'POST',
      body: JSON.stringify({ accion, parametros }),
    });
  },

  // ==================== MÉTODOS DE DASHBOARD ====================

  /**
   * Obtiene el resumen completo del dashboard
   */
  async getDashboard(): Promise<DashboardData> {
    return this.request<DashboardData>(API_CONFIG.endpoints.dashboard.resumen);
  },

  /**
   * Obtiene rendimiento detallado de transportadoras
   */
  async getTransportadoras(): Promise<TransportadoraRendimiento[]> {
    return this.request<TransportadoraRendimiento[]>(
      API_CONFIG.endpoints.dashboard.transportadoras
    );
  },

  /**
   * Obtiene estadísticas por ciudades
   */
  async getCiudades(): Promise<CiudadTop[]> {
    return this.request<CiudadTop[]>(API_CONFIG.endpoints.dashboard.ciudades);
  },

  /**
   * Obtiene tendencias históricas
   */
  async getTendencias(dias: number = 30): Promise<{
    fechas: string[];
    guias_totales: number[];
    retrasos: number[];
    entregas: number[];
  }> {
    return this.request(`${API_CONFIG.endpoints.dashboard.tendencias}?dias=${dias}`);
  },

  // ==================== MÉTODOS DE SISTEMA ====================

  /**
   * Verifica el estado de salud del backend
   */
  async healthCheck(): Promise<HealthStatus> {
    return this.request<HealthStatus>(API_CONFIG.endpoints.health);
  },

  /**
   * Obtiene configuraciones del sistema
   */
  async getConfig(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(API_CONFIG.endpoints.config);
  },

  /**
   * Actualiza una configuración
   */
  async updateConfig(clave: string, valor: unknown): Promise<{ exito: boolean }> {
    return this.request(`${API_CONFIG.endpoints.config}/${clave}`, {
      method: 'PUT',
      body: JSON.stringify({ valor }),
    });
  },

  // ==================== MÉTODOS DE REPORTES ====================

  /**
   * Genera un reporte
   */
  async generarReporte(
    tipo: 'PDF' | 'EXCEL' | 'CSV',
    filtros: Record<string, unknown>
  ): Promise<{ id: string; url_descarga: string }> {
    return this.request(API_CONFIG.endpoints.reportes.generar, {
      method: 'POST',
      body: JSON.stringify({ tipo, filtros }),
    });
  },

  /**
   * Lista reportes generados
   */
  async listarReportes(): Promise<{
    id: string;
    tipo: string;
    fecha: string;
    estado: string;
    url?: string;
  }[]> {
    return this.request(API_CONFIG.endpoints.reportes.listar);
  },

  // ==================== MÉTODOS DE ALERTAS ====================

  /**
   * Lista alertas del sistema
   */
  async listarAlertas(activas: boolean = true): Promise<{
    id: number;
    tipo: string;
    severidad: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    activa: boolean;
  }[]> {
    return this.request(`${API_CONFIG.endpoints.alertas.listar}?activas=${activas}`);
  },

  /**
   * Crea una nueva alerta
   */
  async crearAlerta(alerta: {
    tipo: string;
    severidad: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    titulo: string;
    descripcion: string;
    condicion?: Record<string, unknown>;
  }): Promise<{ id: number; exito: boolean }> {
    return this.request(API_CONFIG.endpoints.alertas.crear, {
      method: 'POST',
      body: JSON.stringify(alerta),
    });
  },

  /**
   * Resuelve una alerta
   */
  async resolverAlerta(
    id: number,
    resolucion: string
  ): Promise<{ exito: boolean }> {
    return this.request(`${API_CONFIG.endpoints.alertas.resolver}/${id}`, {
      method: 'POST',
      body: JSON.stringify({ resolucion }),
    });
  },
};

// ==================== DATOS DE DEMOSTRACIÓN (MODO OFFLINE) ====================

/**
 * Estado global del modo offline
 */
let isOfflineMode = false;

export function setOfflineMode(offline: boolean) {
  isOfflineMode = offline;
}

export function getOfflineMode(): boolean {
  return isOfflineMode;
}

/**
 * Datos de demostración para el dashboard cuando el backend no está disponible
 */
export const DEMO_DASHBOARD_DATA: DashboardData = {
  estadisticas_generales: {
    total_guias: 15847,
    guias_entregadas: 13562,
    guias_en_retraso: 1285,
    guias_con_novedad: 892,
    tasa_entrega: 85.6,
    tasa_retraso: 8.1,
  },
  rendimiento_transportadoras: [
    {
      nombre: 'Servientrega',
      total_guias: 5234,
      entregas_exitosas: 4708,
      retrasos: 312,
      tasa_retraso: 5.96,
      tiempo_promedio_dias: 2.3,
      calificacion: 'EXCELENTE',
    },
    {
      nombre: 'Coordinadora',
      total_guias: 4521,
      entregas_exitosas: 3892,
      retrasos: 425,
      tasa_retraso: 9.4,
      tiempo_promedio_dias: 3.1,
      calificacion: 'BUENO',
    },
    {
      nombre: 'Interrapidísimo',
      total_guias: 3287,
      entregas_exitosas: 2692,
      retrasos: 398,
      tasa_retraso: 12.11,
      tiempo_promedio_dias: 3.5,
      calificacion: 'REGULAR',
    },
    {
      nombre: 'Envia',
      total_guias: 2805,
      entregas_exitosas: 2270,
      retrasos: 350,
      tasa_retraso: 12.48,
      tiempo_promedio_dias: 4.2,
      calificacion: 'REGULAR',
    },
  ],
  top_ciudades: [
    { ciudad: 'Bogotá D.C.', total_guias: 4250, porcentaje_del_total: 26.8 },
    { ciudad: 'Medellín', total_guias: 2890, porcentaje_del_total: 18.2 },
    { ciudad: 'Cali', total_guias: 1985, porcentaje_del_total: 12.5 },
    { ciudad: 'Barranquilla', total_guias: 1420, porcentaje_del_total: 9.0 },
    { ciudad: 'Cartagena', total_guias: 1102, porcentaje_del_total: 7.0 },
  ],
  modelos_activos: [
    {
      nombre: 'Predictor de Retrasos',
      version: '2.1.0',
      accuracy: 0.923,
      fecha_entrenamiento: new Date().toISOString(),
      estado: 'ACTIVO',
    },
    {
      nombre: 'Clasificador de Novedades',
      version: '1.5.2',
      accuracy: 0.891,
      fecha_entrenamiento: new Date().toISOString(),
      estado: 'ACTIVO',
    },
  ],
  alertas_pendientes: 3,
};

/**
 * Datos de demostración para predicción
 */
export const DEMO_PREDICCION: Prediccion = {
  numero_guia: 'DEMO-001',
  probabilidad_retraso: 0.23,
  nivel_riesgo: 'BAJO',
  dias_estimados_entrega: 3,
  fecha_estimada_entrega: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  factores_riesgo: ['Distancia media', 'Temporada alta de envíos'],
  acciones_recomendadas: ['Monitorear seguimiento', 'Verificar dirección de entrega'],
  confianza: 0.89,
  modelo_usado: 'XGBoost v2.1',
};

/**
 * Respuesta de demostración para el chat
 */
export const DEMO_CHAT_RESPONSE: ChatResponse = {
  respuesta: '🔧 **Modo Demo Activo**\n\nEl sistema está funcionando en modo demostración porque el backend no está disponible.\n\nEn modo normal, puedo ayudarte con:\n- 📊 Análisis de estadísticas de envíos\n- 🔍 Búsqueda de guías específicas\n- 📈 Comparación de transportadoras\n- 🚚 Predicción de retrasos\n- 📋 Generación de reportes\n\n**Para activar todas las funcionalidades**, asegúrate de que el servidor FastAPI esté corriendo en el puerto 8000.',
  tipo_consulta: 'informacion_sistema',
  datos_consultados: {},
  sugerencias: [
    'Ver estadísticas del dashboard',
    'Conocer el estado del sistema',
    'Información sobre transportadoras',
  ],
  tokens_usados: 0,
  tiempo_respuesta_ms: 100,
};

// ==================== UTILIDADES ====================

/**
 * Verifica si el backend está disponible
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const health = await mlApi.healthCheck();
    const isHealthy = health.status === 'healthy';
    setOfflineMode(!isHealthy);
    return isHealthy;
  } catch {
    setOfflineMode(true);
    return false;
  }
}

/**
 * Obtiene datos del dashboard (con fallback a modo demo)
 */
export async function getDashboardWithFallback(): Promise<{ data: DashboardData; isDemo: boolean }> {
  try {
    const data = await mlApi.getDashboard();
    setOfflineMode(false);
    return { data, isDemo: false };
  } catch {
    setOfflineMode(true);
    return { data: DEMO_DASHBOARD_DATA, isDemo: true };
  }
}

/**
 * Obtiene predicción (con fallback a modo demo)
 */
export async function getPredictionWithFallback(numeroGuia: string): Promise<{ data: Prediccion; isDemo: boolean }> {
  try {
    const data = await mlApi.predecir(numeroGuia);
    return { data, isDemo: false };
  } catch {
    // Generar predicción demo personalizada
    const demoData: Prediccion = {
      ...DEMO_PREDICCION,
      numero_guia: numeroGuia,
      probabilidad_retraso: Math.random() * 0.5,
      nivel_riesgo: Math.random() > 0.7 ? 'MEDIO' : 'BAJO',
    };
    return { data: demoData, isDemo: true };
  }
}

/**
 * Obtiene respuesta del chat (con fallback a modo demo)
 */
export async function getChatResponseWithFallback(pregunta: string): Promise<{ data: ChatResponse; isDemo: boolean }> {
  try {
    const data = await mlApi.chatPreguntar(pregunta);
    return { data, isDemo: false };
  } catch {
    return { data: DEMO_CHAT_RESPONSE, isDemo: true };
  }
}

/**
 * Formatea el nivel de riesgo con colores
 */
export function getRiskLevelColor(nivel: Prediccion['nivel_riesgo']): string {
  const colors = {
    BAJO: 'text-green-600 bg-green-100',
    MEDIO: 'text-yellow-600 bg-yellow-100',
    ALTO: 'text-orange-600 bg-orange-100',
    CRITICO: 'text-red-600 bg-red-100',
  };
  return colors[nivel];
}

/**
 * Formatea la calificación de transportadora con colores
 */
export function getCalificacionColor(
  calificacion: TransportadoraRendimiento['calificacion']
): string {
  const colors = {
    EXCELENTE: 'text-green-600 bg-green-100',
    BUENO: 'text-blue-600 bg-blue-100',
    REGULAR: 'text-yellow-600 bg-yellow-100',
    MALO: 'text-red-600 bg-red-100',
  };
  return colors[calificacion];
}

/**
 * Formatea porcentaje para mostrar
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Formatea número con separadores de miles
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

export default mlApi;
