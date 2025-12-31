// Configuración de los 2 procesos: Guías y Novedad

export type TipoProceso = 'guias' | 'novedad';
export type ViewLayout = 'widget' | 'sidebar' | 'compact';

export interface CampoContador {
  id: string;
  label: string;
  labelCorto: string;
  icono: string;
  color: string;
  atajo: string;
  grupo?: string;
  esCalculado?: boolean;
}

export interface ProcesoConfig {
  id: TipoProceso;
  nombre: string;
  icono: string;
  campos: CampoContador[];
  grupos?: string[];
}

// Proceso: Generación de Guías (6 campos)
export const PROCESO_GUIAS: ProcesoConfig = {
  id: 'guias',
  nombre: 'Generación de Guías',
  icono: '📦',
  campos: [
    { id: 'realizado', label: 'Realizado', labelCorto: 'Real.', icono: '✓', color: '#10B981', atajo: '1' },
    { id: 'cancelados', label: 'Cancelados', labelCorto: 'Canc.', icono: '✗', color: '#EF4444', atajo: '2' },
    { id: 'agendados', label: 'Agendados', labelCorto: 'Agen.', icono: '📅', color: '#3B82F6', atajo: '3' },
    { id: 'dificiles', label: 'Difíciles', labelCorto: 'Dif.', icono: '⚠️', color: '#F97316', atajo: '4' },
    { id: 'pedidoPendiente', label: 'Pedido Pendiente', labelCorto: 'Pend.', icono: '⏳', color: '#F59E0B', atajo: '5' },
    { id: 'revisado', label: 'Revisado', labelCorto: 'Rev.', icono: '👁️', color: '#8B5CF6', atajo: '6' },
  ],
};

// Proceso: Novedad (9 campos, agrupados)
export const PROCESO_NOVEDAD: ProcesoConfig = {
  id: 'novedad',
  nombre: 'Novedad',
  icono: '📋',
  grupos: ['NOVEDADES', 'DEVOLUCIONES'],
  campos: [
    // Grupo: NOVEDADES
    { id: 'novedadesIniciales', label: 'Novedades iniciales', labelCorto: 'Inic.', icono: '📋', color: '#3B82F6', atajo: '1', grupo: 'NOVEDADES' },
    { id: 'novedadesSolucionadas', label: 'Novedades solucionadas', labelCorto: 'Soluc.', icono: '✅', color: '#10B981', atajo: '2', grupo: 'NOVEDADES' },
    { id: 'novedadesRevisadas', label: 'Novedades revisadas', labelCorto: 'Revis.', icono: '👁️', color: '#8B5CF6', atajo: '3', grupo: 'NOVEDADES' },
    { id: 'novedadesFinalePendientes', label: 'Novedades finales pendientes', labelCorto: 'Pend.', icono: '⏳', color: '#F59E0B', atajo: '4', grupo: 'NOVEDADES' },
    // Grupo: DEVOLUCIONES
    { id: 'devolucionLitper', label: 'Devolución x LITPER', labelCorto: 'Dev.LIT', icono: '🔄', color: '#F97316', atajo: '5', grupo: 'DEVOLUCIONES' },
    { id: 'devolucion3Intentos', label: 'Devolución 3 intentos', labelCorto: 'Dev.3Int', icono: '🔁', color: '#EF4444', atajo: '6', grupo: 'DEVOLUCIONES' },
    { id: 'devolucionErrorTransportadora', label: 'Devolución error transportadora', labelCorto: 'Dev.Transp', icono: '🚚', color: '#6B7280', atajo: '7', grupo: 'DEVOLUCIONES' },
    { id: 'devolucionProveedor', label: 'Devolución x proveedor', labelCorto: 'Dev.Prov', icono: '📦', color: '#06B6D4', atajo: '8', grupo: 'DEVOLUCIONES' },
    // TOT Devoluciones - CALCULADO AUTOMÁTICAMENTE
    { id: 'totDevoluciones', label: 'TOT Devoluciones', labelCorto: 'TOT Dev', icono: '📊', color: '#EC4899', atajo: '', grupo: 'DEVOLUCIONES', esCalculado: true },
  ],
};

// Obtener proceso por ID
export const getProceso = (id: TipoProceso): ProcesoConfig => {
  return id === 'guias' ? PROCESO_GUIAS : PROCESO_NOVEDAD;
};

// Tamaños de ventana por layout
export const WINDOW_SIZES: Record<ViewLayout, { width: number; height: number }> = {
  widget: { width: 380, height: 700 },
  sidebar: { width: 900, height: 140 },
  compact: { width: 500, height: 80 },
};

// Tiempos preset para el timer
export const TIEMPOS_PRESET = [15, 20, 25, 30, 45, 60];

// Colores del timer según porcentaje restante
export const TIMER_COLORS = {
  green: { threshold: 50, color: '#10B981', name: 'Verde' },
  yellow: { threshold: 25, color: '#F59E0B', name: 'Amarillo' },
  orange: { threshold: 10, color: '#F97316', name: 'Naranja' },
  red: { threshold: 0, color: '#EF4444', name: 'Rojo' },
};

// Intervalo de auto-guardado en milisegundos
export const AUTO_SAVE_INTERVAL = 30000; // 30 segundos
