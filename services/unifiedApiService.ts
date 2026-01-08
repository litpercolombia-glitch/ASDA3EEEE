/**
 * LITPER - Unified API Service
 * Cliente centralizado para comunicación con el backend.
 * Reemplaza la duplicación entre supabaseService y servicios locales.
 */

// ==================== CONFIGURACIÓN ====================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_VERSION = 'v2';

// ==================== TIPOS ====================

export interface Guia {
  id?: number;
  numero_guia: string;
  transportadora?: string;
  ciudad_destino?: string;
  departamento_destino?: string;
  estatus?: string;
  nombre_cliente?: string;
  telefono?: string;
  direccion?: string;
  valor_facturado?: number;
  ganancia?: number;
  tiene_novedad?: boolean;
  tipo_novedad?: string;
  descripcion_novedad?: string;
  fecha_generacion_guia?: string;
  fecha_ultimo_movimiento?: string;
  dias_en_transito?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GuiaCreate extends Omit<Guia, 'id' | 'created_at' | 'updated_at'> {}

export interface GuiaUpdate {
  estatus?: string;
  tiene_novedad?: boolean;
  tipo_novedad?: string;
  descripcion_novedad?: string;
  fue_solucionada?: boolean;
  solucion?: string;
}

export interface Carga {
  id: string;
  nombre: string;
  numero_carga: number;
  fecha: string;
  usuario_id: string;
  usuario_nombre: string;
  estado: 'activa' | 'cerrada' | 'archivada';
  total_guias: number;
  entregadas: number;
  en_transito: number;
  con_novedad: number;
  devueltas: number;
  porcentaje_entrega: number;
  valor_total: number;
  ganancia_total: number;
  guias?: GuiaCreate[];
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface CargaCreate {
  nombre: string;
  usuario_id: string;
  usuario_nombre: string;
  guias?: GuiaCreate[];
}

export interface Finanza {
  id: string;
  tipo: 'ingreso' | 'gasto';
  categoria: string;
  subcategoria?: string;
  descripcion: string;
  monto: number;
  fecha: string;
  mes: string;
  usuario_id: string;
  created_at: string;
}

export interface FinanzaCreate extends Omit<Finanza, 'id' | 'created_at'> {}

export interface ResumenFinanciero {
  mes: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
  margen: number;
}

export interface GuiasStats {
  total: number;
  entregadas: number;
  enTransito: number;
  conNovedad: number;
  devueltas: number;
  tasaEntrega: number;
}

export interface DashboardStats extends GuiasStats {
  guiasHoy: number;
  entregadasHoy: number;
  valorTotal: number;
  gananciaTotal: number;
  cargasActivas: number;
  alertasNoLeidas: number;
}

export interface Alerta {
  id: number;
  tipo: string;
  severidad: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface SyncChange {
  key: string;
  data: unknown;
  timestamp: number;
}

// ==================== UTILIDADES ====================

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

export const getAuthToken = (): string | null => {
  return authToken || localStorage.getItem('auth_token');
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error ${response.status}`);
  }
  return response.json();
};

const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_URL}/api/${API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
};

// ==================== GUÍAS SERVICE ====================

export const guiasApi = {
  /**
   * Obtener todas las guías con filtros opcionales
   */
  async getAll(params?: {
    limit?: number;
    offset?: number;
    estado?: string;
    transportadora?: string;
    ciudad?: string;
    con_novedad?: boolean;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<Guia[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return apiCall<Guia[]>(`/guias${query ? `?${query}` : ''}`);
  },

  /**
   * Obtener una guía por ID
   */
  async getById(id: number): Promise<Guia> {
    return apiCall<Guia>(`/guias/${id}`);
  },

  /**
   * Obtener una guía por número
   */
  async getByNumero(numeroGuia: string): Promise<Guia> {
    return apiCall<Guia>(`/guias/numero/${numeroGuia}`);
  },

  /**
   * Crear una nueva guía
   */
  async create(guia: GuiaCreate): Promise<Guia> {
    return apiCall<Guia>('/guias', {
      method: 'POST',
      body: JSON.stringify(guia),
    });
  },

  /**
   * Crear múltiples guías en batch
   */
  async createBatch(guias: GuiaCreate[]): Promise<Guia[]> {
    return apiCall<Guia[]>('/guias/batch', {
      method: 'POST',
      body: JSON.stringify(guias),
    });
  },

  /**
   * Actualizar una guía
   */
  async update(id: number, updates: GuiaUpdate): Promise<Guia> {
    return apiCall<Guia>(`/guias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Eliminar una guía
   */
  async delete(id: number): Promise<{ success: boolean }> {
    return apiCall<{ success: boolean }>(`/guias/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtener estadísticas de guías
   */
  async getStats(): Promise<GuiasStats> {
    return apiCall<GuiasStats>('/guias/stats/resumen');
  },

  /**
   * Obtener estadísticas del día
   */
  async getStatsHoy(): Promise<{
    guiasHoy: number;
    entregadasHoy: number;
    valorTotal: number;
    gananciaTotal: number;
    fecha: string;
  }> {
    return apiCall('/guias/stats/hoy');
  },
};

// ==================== CARGAS SERVICE ====================

export const cargasApi = {
  /**
   * Obtener todas las cargas
   */
  async getAll(params?: {
    estado?: string;
    usuario_id?: string;
  }): Promise<Carga[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString();
    return apiCall<Carga[]>(`/cargas${query ? `?${query}` : ''}`);
  },

  /**
   * Obtener cargas activas
   */
  async getActivas(): Promise<Carga[]> {
    return apiCall<Carga[]>('/cargas/activas');
  },

  /**
   * Obtener una carga por ID
   */
  async getById(id: string): Promise<Carga> {
    return apiCall<Carga>(`/cargas/${id}`);
  },

  /**
   * Crear una nueva carga
   */
  async create(carga: CargaCreate): Promise<Carga> {
    return apiCall<Carga>('/cargas', {
      method: 'POST',
      body: JSON.stringify(carga),
    });
  },

  /**
   * Actualizar una carga
   */
  async update(id: string, updates: Partial<Carga>): Promise<Carga> {
    return apiCall<Carga>(`/cargas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Cerrar una carga
   */
  async cerrar(id: string): Promise<Carga> {
    return apiCall<Carga>(`/cargas/${id}/cerrar`, {
      method: 'POST',
    });
  },
};

// ==================== FINANZAS SERVICE ====================

export const finanzasApi = {
  /**
   * Obtener registros financieros
   */
  async getAll(params?: {
    mes?: string;
    tipo?: 'ingreso' | 'gasto';
  }): Promise<Finanza[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString();
    return apiCall<Finanza[]>(`/finanzas${query ? `?${query}` : ''}`);
  },

  /**
   * Obtener resumen de un mes
   */
  async getResumenMes(mes: string): Promise<ResumenFinanciero> {
    return apiCall<ResumenFinanciero>(`/finanzas/resumen/${mes}`);
  },

  /**
   * Crear un registro financiero
   */
  async create(finanza: FinanzaCreate): Promise<Finanza> {
    return apiCall<Finanza>('/finanzas', {
      method: 'POST',
      body: JSON.stringify(finanza),
    });
  },
};

// ==================== ALERTAS SERVICE ====================

export const alertasApi = {
  /**
   * Obtener alertas
   */
  async getAll(params?: {
    leida?: boolean;
    limit?: number;
  }): Promise<Alerta[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return apiCall<Alerta[]>(`/alertas${query ? `?${query}` : ''}`);
  },

  /**
   * Obtener alertas no leídas
   */
  async getNoLeidas(): Promise<Alerta[]> {
    return this.getAll({ leida: false });
  },

  /**
   * Marcar alerta como leída
   */
  async marcarLeida(id: number): Promise<{ success: boolean }> {
    return apiCall<{ success: boolean }>(`/alertas/${id}/leer`, {
      method: 'POST',
    });
  },
};

// ==================== DASHBOARD SERVICE ====================

export const dashboardApi = {
  /**
   * Obtener estadísticas del dashboard
   */
  async getStats(): Promise<DashboardStats> {
    return apiCall<DashboardStats>('/dashboard/stats');
  },
};

// ==================== STORAGE SYNC SERVICE ====================

export const storageApi = {
  /**
   * Sincronizar un item con el servidor
   */
  async syncItem(key: string, data: unknown): Promise<{
    success: boolean;
    key: string;
    server_timestamp: number;
  }> {
    return apiCall(`/storage/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Obtener un item del servidor
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      return await apiCall<T>(`/storage/${key}`);
    } catch {
      return null;
    }
  },

  /**
   * Obtener cambios desde una fecha
   */
  async getChangesSince(since?: string): Promise<SyncChange[]> {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiCall<SyncChange[]>(`/storage/changes${query}`);
  },
};

// ==================== HEALTH CHECK ====================

export const healthApi = {
  /**
   * Verificar estado del API
   */
  async check(): Promise<{
    status: string;
    database: string;
    timestamp: string;
    version: string;
  }> {
    return apiCall('/health');
  },

  /**
   * Verificar si el API está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.check();
      return response.status === 'ok';
    } catch {
      return false;
    }
  },
};

// ==================== UNIFIED API EXPORT ====================

export const unifiedApi = {
  guias: guiasApi,
  cargas: cargasApi,
  finanzas: finanzasApi,
  alertas: alertasApi,
  dashboard: dashboardApi,
  storage: storageApi,
  health: healthApi,
  setAuthToken,
  getAuthToken,
};

export default unifiedApi;
