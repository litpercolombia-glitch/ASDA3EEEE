/**
 * LITPER - Inteligencia Logística Service
 * Servicio compartido para acceder a los datos de Inteligencia Logística
 * desde cualquier componente de chat.
 */

// Constantes
const STORAGE_KEY = 'litper_inteligencia_logistica_sesiones';

// Tipos
export interface GuiaInteligencia {
  guia: string;
  estado: string;
  transportadora: string;
  ciudad?: string;
  dias?: number;
  telefono?: string;
  novedad?: boolean;
  cliente?: string;
  producto?: string;
  valor?: number;
  fecha?: string;
  direccion?: string;
  [key: string]: unknown;
}

export interface SesionInteligencia {
  id: string;
  nombre: string;
  fecha: string;
  guias: GuiaInteligencia[];
  resumen: {
    total: number;
    entregadas: number;
    enReparto: number;
    enOficina: number;
    conNovedad: number;
    devueltas: number;
    otros: number;
  };
}

// Event listeners para cambios
type Listener = (sesion: SesionInteligencia | null) => void;
const listeners: Listener[] = [];

// Estado actual (cache)
let currentSession: SesionInteligencia | null = null;

/**
 * Obtiene todas las sesiones guardadas
 */
export const getSesiones = (): SesionInteligencia[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error cargando sesiones:', error);
  }
  return [];
};

/**
 * Obtiene la sesión activa (la más reciente)
 */
export const getSesionActiva = (): SesionInteligencia | null => {
  if (currentSession) return currentSession;

  const sesiones = getSesiones();
  if (sesiones.length > 0) {
    currentSession = sesiones[sesiones.length - 1];
    return currentSession;
  }
  return null;
};

/**
 * Obtiene una sesión por ID
 */
export const getSesionById = (id: string): SesionInteligencia | null => {
  const sesiones = getSesiones();
  return sesiones.find((s) => s.id === id) || null;
};

/**
 * Obtiene las guías de la sesión activa
 */
export const getGuiasActivas = (): GuiaInteligencia[] => {
  const sesion = getSesionActiva();
  return sesion?.guias || [];
};

/**
 * Busca una guía por número en la sesión activa
 */
export const buscarGuia = (numeroGuia: string): GuiaInteligencia | null => {
  const guias = getGuiasActivas();
  return (
    guias.find(
      (g) =>
        g.guia.toLowerCase().includes(numeroGuia.toLowerCase()) ||
        numeroGuia.toLowerCase().includes(g.guia.toLowerCase())
    ) || null
  );
};

/**
 * Obtiene estadísticas de la sesión activa
 */
export const getEstadisticas = (): {
  total: number;
  entregadas: number;
  enReparto: number;
  conNovedad: number;
  pendientes: number;
  porTransportadora: Record<string, number>;
  porEstado: Record<string, number>;
} => {
  const guias = getGuiasActivas();

  const stats = {
    total: guias.length,
    entregadas: 0,
    enReparto: 0,
    conNovedad: 0,
    pendientes: 0,
    porTransportadora: {} as Record<string, number>,
    porEstado: {} as Record<string, number>,
  };

  guias.forEach((guia) => {
    const estado = (guia.estado || '').toLowerCase();

    // Contar por estado
    if (estado.includes('entregado') || estado.includes('delivered')) {
      stats.entregadas++;
    } else if (estado.includes('reparto') || estado.includes('tránsito')) {
      stats.enReparto++;
    } else if (estado.includes('novedad') || estado.includes('devuelto')) {
      stats.conNovedad++;
    } else {
      stats.pendientes++;
    }

    // Agrupar por transportadora
    const transp = guia.transportadora || 'Sin transportadora';
    stats.porTransportadora[transp] = (stats.porTransportadora[transp] || 0) + 1;

    // Agrupar por estado
    const estadoClean = guia.estado || 'Sin estado';
    stats.porEstado[estadoClean] = (stats.porEstado[estadoClean] || 0) + 1;
  });

  return stats;
};

/**
 * Obtiene guías con novedad
 */
export const getGuiasConNovedad = (): GuiaInteligencia[] => {
  const guias = getGuiasActivas();
  return guias.filter((g) => {
    const estado = (g.estado || '').toLowerCase();
    return (
      estado.includes('novedad') ||
      estado.includes('devuelto') ||
      estado.includes('rechaz') ||
      g.novedad === true
    );
  });
};

/**
 * Obtiene guías en reparto
 */
export const getGuiasEnReparto = (): GuiaInteligencia[] => {
  const guias = getGuiasActivas();
  return guias.filter((g) => {
    const estado = (g.estado || '').toLowerCase();
    return estado.includes('reparto') || estado.includes('tránsito') || estado.includes('transito');
  });
};

/**
 * Obtiene resumen para el chat
 */
export const getResumenParaChat = (): string => {
  const sesion = getSesionActiva();
  if (!sesion) {
    return 'No hay sesión de Inteligencia Logística activa. Por favor, carga un archivo Excel en la pestaña de Inteligencia Logística.';
  }

  const stats = getEstadisticas();
  const novedades = getGuiasConNovedad();

  let resumen = `📊 **Sesión activa: ${sesion.nombre}** (${sesion.fecha})\n\n`;
  resumen += `**Total de guías:** ${stats.total}\n`;
  resumen += `- ✅ Entregadas: ${stats.entregadas}\n`;
  resumen += `- 🚚 En reparto: ${stats.enReparto}\n`;
  resumen += `- ⚠️ Con novedad: ${stats.conNovedad}\n`;
  resumen += `- ⏳ Pendientes: ${stats.pendientes}\n\n`;

  if (novedades.length > 0) {
    resumen += `**Guías con novedad (${novedades.length}):**\n`;
    novedades.slice(0, 5).forEach((g) => {
      resumen += `- ${g.guia}: ${g.estado} (${g.transportadora})\n`;
    });
    if (novedades.length > 5) {
      resumen += `... y ${novedades.length - 5} más\n`;
    }
  }

  return resumen;
};

/**
 * Formatea una guía para mostrar en chat
 */
export const formatearGuiaParaChat = (guia: GuiaInteligencia): string => {
  let info = `📦 **Guía: ${guia.guia}**\n`;
  info += `- Estado: ${guia.estado || 'No disponible'}\n`;
  info += `- Transportadora: ${guia.transportadora || 'No disponible'}\n`;
  if (guia.ciudad) info += `- Ciudad: ${guia.ciudad}\n`;
  if (guia.cliente) info += `- Cliente: ${guia.cliente}\n`;
  if (guia.telefono) info += `- Teléfono: ${guia.telefono}\n`;
  if (guia.dias !== undefined) info += `- Días transcurridos: ${guia.dias}\n`;
  if (guia.valor) info += `- Valor: $${guia.valor.toLocaleString()}\n`;
  return info;
};

/**
 * Suscribirse a cambios de sesión
 */
export const suscribirse = (listener: Listener): (() => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

/**
 * Notifica a todos los listeners de un cambio
 */
export const notificarCambio = (sesion: SesionInteligencia | null): void => {
  currentSession = sesion;
  listeners.forEach((listener) => listener(sesion));
};

/**
 * Verifica si hay datos cargados
 */
export const tieneDatos = (): boolean => {
  return getGuiasActivas().length > 0;
};

// Escuchar cambios en localStorage desde otras pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      currentSession = null; // Reset cache
      const sesion = getSesionActiva();
      notificarCambio(sesion);
    }
  });
}

export default {
  getSesiones,
  getSesionActiva,
  getSesionById,
  getGuiasActivas,
  buscarGuia,
  getEstadisticas,
  getGuiasConNovedad,
  getGuiasEnReparto,
  getResumenParaChat,
  formatearGuiaParaChat,
  suscribirse,
  notificarCambio,
  tieneDatos,
};
