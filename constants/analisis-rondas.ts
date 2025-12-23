/**
 * 📊 CONSTANTES PARA ANÁLISIS DE RONDAS LITPER
 * Configuración del sistema de control de rondas
 */

import { UsuarioOperador } from '../types/analisis-rondas';

// ===== USUARIOS DEL SISTEMA =====
export const USUARIOS_OPERADORES: UsuarioOperador[] = [
  { id: 'angie', nombre: 'ANGIE' },
  { id: 'catalina', nombre: 'CATALINA' },
  { id: 'felipe', nombre: 'FELIPE' },
  { id: 'evan', nombre: 'EVAN' },
  { id: 'norman', nombre: 'NORMAN' },
  { id: 'alejandra', nombre: 'ALEJANDRA' },
  { id: 'karen', nombre: 'KAREN' },
  { id: 'jimmy', nombre: 'JIMMY' },
  { id: 'carolina', nombre: 'CAROLINA' },
];

export const ADMIN_CONFIG = {
  username: 'ADMIN',
  password: 'LITPERTUPAPA',
};

// ===== UMBRALES Y METAS =====
export const UMBRALES = {
  META_EXITO_EQUIPO: 85, // % meta de tasa de éxito
  EXCELENTE: 85,         // >= 85% = Excelente
  BUENO: 70,             // >= 70% = Bueno
  REGULAR: 50,           // >= 50% = Regular
  BAJO: 0,               // < 50% = Bajo

  // Alertas
  ALERTA_NOVEDADES: 5,      // % máximo de novedades
  ALERTA_PENDIENTES: 20,    // % máximo de pendientes
  ALERTA_RENDIMIENTO: 70,   // % mínimo de rendimiento personal

  // Anomalías
  TIEMPO_MINIMO_RONDA: 1,   // minutos mínimos válidos
};

// ===== COLORES POR ESTADO =====
export const COLORES_ESTADO = {
  excelente: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500',
    badge: 'bg-emerald-500',
    icon: '🟢',
  },
  bueno: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500',
    badge: 'bg-blue-500',
    icon: '🔵',
  },
  regular: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500',
    badge: 'bg-amber-500',
    icon: '🟡',
  },
  bajo: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    badge: 'bg-red-500',
    icon: '🔴',
  },
};

// ===== COLORES ALERTAS =====
export const COLORES_ALERTA = {
  critico: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    icon: '🔴',
  },
  urgente: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500',
    icon: '🟠',
  },
  atencion: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500',
    icon: '🟡',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500',
    icon: '🔵',
  },
};

// ===== PRIORIDAD RECOMENDACIONES =====
export const COLORES_PRIORIDAD = {
  alta: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    badge: 'bg-red-500 text-white',
  },
  media: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500',
    badge: 'bg-amber-500 text-white',
  },
  baja: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500',
    badge: 'bg-blue-500 text-white',
  },
};

// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  SESION: 'litper_analisis_rondas_sesion',
  HISTORICO: 'litper_analisis_rondas_historico',
  ULTIMO_REPORTE: 'litper_analisis_rondas_ultimo',
  CONFIG: 'litper_analisis_rondas_config',
};

// ===== HEADERS CSV ESPERADOS =====
// Headers del formato LITPER TRACKER - Soporta variaciones
export const CSV_HEADERS = {
  USUARIO: ['usuario', 'operador', 'nombre', 'user', 'name'],
  FECHA: ['fecha', 'date', 'dia'],
  HORA_INICIO: ['hora_inicio', 'hora inicio', 'horainicio', 'inicio', 'start'],
  HORA_FIN: ['hora_fin', 'hora fin', 'horafin', 'fin', 'end'],
  RONDA: ['ronda', 'numero_ronda', 'round', 'num', '#'],
  GUIAS_INICIALES: ['iniciales', 'guias_iniciales', 'guiasiniciales', 'initial', 'total_guias', 'totalguias'],
  GUIAS_REALIZADAS: ['realizadas', 'guias_realizadas', 'guiasrealizadas', 'completed', 'realizado'],
  CANCELADAS: ['canceladas', 'cancelado', 'cancelled', 'canceled'],
  AGENDADAS: ['agendadas', 'agendado', 'scheduled'],
  PENDIENTES: ['pendientes', 'pendiente', 'pending'],
  TIEMPO: ['tiempo', 'tiempo(min)', 'tiempomin', 'tiempo_registro', 'minutos', 'time', 'duration', 'min'],
  NOVEDADES: ['novedades', 'novedad', 'issues', 'problems', 'dificiles', 'dificil'],
  // Campos adicionales de LITPER TRACKER
  DIFICILES: ['dificiles', 'dificil', 'difficult', 'hard'],
  REVISADAS: ['revisadas', 'revisado', 'reviewed'],
  SOLUCIONADAS: ['solucionadas', 'solucionado', 'solved', 'resueltas'],
  DEVOLUCION: ['devolucion', 'devoluciones', 'returned', 'return'],
};

// ===== MENSAJES DE RECOMENDACIÓN =====
export const MENSAJES_RECOMENDACION = {
  TASA_BAJA: {
    titulo: 'Tasa de éxito crítica',
    descripcion: 'El equipo está muy por debajo del objetivo del 85%',
    accion: 'Revisar asignación de rutas y considerar capacitación adicional',
  },
  NOVEDADES_ALTAS: {
    titulo: 'Alto ratio de novedades',
    descripcion: 'El porcentaje de novedades supera el umbral del 5%',
    accion: 'Identificar patrones de novedades y mejorar comunicación con transportadoras',
  },
  PENDIENTES_ALTOS: {
    titulo: 'Muchas guías pendientes',
    descripcion: 'El ratio de pendientes supera el 20%',
    accion: 'Redistribuir carga de trabajo y verificar disponibilidad de recursos',
  },
  USUARIOS_BAJOS: {
    titulo: 'Usuarios con bajo rendimiento',
    descripcion: 'Hay operadores que necesitan atención',
    accion: 'Evaluar necesidades de capacitación individual',
  },
  TIEMPO_CERO: {
    titulo: 'Rondas con tiempo = 0',
    descripcion: 'Se detectaron rondas sin tiempo de registro',
    accion: 'Investigar posibles errores de registro o problemas técnicos',
  },
  REDISTRIBUIR: {
    titulo: 'Desequilibrio de carga',
    descripcion: 'Algunos operadores tienen mucha más carga que otros',
    accion: 'Redistribuir rutas para equilibrar el trabajo del equipo',
  },
};

// ===== ÍCONOS =====
export const ICONOS = {
  EXCELENTE: '⭐',
  BUENO: '✅',
  REGULAR: '⚠️',
  BAJO: '❌',
  TENDENCIA_SUBIENDO: '📈',
  TENDENCIA_BAJANDO: '📉',
  TENDENCIA_ESTABLE: '➡️',
  MEDALLA_ORO: '🥇',
  MEDALLA_PLATA: '🥈',
  MEDALLA_BRONCE: '🥉',
  ALERTA: '🚨',
  RECOMENDACION: '💡',
  USUARIO: '👤',
  ADMIN: '👑',
  LOGOUT: '🔓',
  UPLOAD: '📤',
  DOWNLOAD: '💾',
  HISTORICO: '📊',
};
