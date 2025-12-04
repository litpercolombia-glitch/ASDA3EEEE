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

// ==================== UTILIDADES ====================

/**
 * Verifica si el backend está disponible
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const health = await mlApi.healthCheck();
    return health.status === 'healthy';
  } catch {
    return false;
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
