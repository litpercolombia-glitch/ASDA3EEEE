/**
 * 📊 CONSTANTES PARA ANÁLISIS DE RONDAS LITPER
 * Configuración del sistema de control de rondas
 */

import { UsuarioOperador } from '../types/analisis-rondas';

// ===== USUARIOS DEL SISTEMA =====
export const USUARIOS_OPERADORES: UsuarioOperador[] = [
  { id: 'angie', nombre: 'ANGIE', icono: '👩‍💼', color: '#ec4899' },
  { id: 'catalina', nombre: 'CATALINA', icono: '👩‍🔧', color: '#8b5cf6' },
  { id: 'felipe', nombre: 'FELIPE', icono: '👨‍💻', color: '#3b82f6' },
  { id: 'evan', nombre: 'EVAN', icono: '👨‍🚀', color: '#10b981' },
  { id: 'norman', nombre: 'NORMAN', icono: '👨‍✈️', color: '#f59e0b' },
  { id: 'alejandra', nombre: 'ALEJANDRA', icono: '👩‍🎤', color: '#ef4444' },
  { id: 'karen', nombre: 'KAREN', icono: '👩‍🏫', color: '#06b6d4' },
  { id: 'jimmy', nombre: 'JIMMY', icono: '👨‍🔬', color: '#84cc16' },
  { id: 'carolina', nombre: 'CAROLINA', icono: '👩‍⚕️', color: '#f97316' },
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

// ===== MÉTRICAS AVANZADAS (Base: 3 min/guía) =====
export const METRICAS_AVANZADAS = {
  // Tiempo base por guía
  TIEMPO_POR_GUIA: 3,           // 3 minutos por guía
  GUIAS_POR_HORA_ESPERADAS: 20, // 60/3 = 20 guías por hora

  // Meta diaria
  META_DIARIA_GUIAS: 10,        // 10 guías/día (meta mínima diaria)
  META_DIARIA_HORAS: 2,         // 2 horas de trabajo efectivo

  // Eficiencia = (Guías × 3) / Tiempo Real × 100
  EFICIENCIA_EXCELENTE: 100,    // >= 100% = trabaja más rápido que base
  EFICIENCIA_BUENA: 80,         // >= 80% = bien
  EFICIENCIA_REGULAR: 60,       // >= 60% = regular
  EFICIENCIA_BAJA: 0,           // < 60% = lento

  // Racha de días consecutivos (tasa >= 70%)
  RACHA_MINIMA_TASA: 70,        // Tasa mínima para contar día
  RACHA_DIAS: {
    FUEGO: 7,      // 🔥🔥🔥 7+ días
    CALIENTE: 5,   // 🔥🔥 5-6 días
    ENCENDIDO: 3,  // 🔥 3-4 días
    INICIO: 1,     // ✨ 1-2 días
  },

  // Detector de anomalías
  TIEMPO_MINIMO_GUIA: 0.5,      // Mínimo 30 segundos por guía
  TIEMPO_MAXIMO_GUIA: 10,       // Máximo 10 minutos por guía
  GUIAS_MINIMAS_RONDA: 1,       // Mínimo 1 guía por ronda
};

// ===== SEMÁFORO DE USUARIOS =====
export const SEMAFORO = {
  VERDE: { icon: '🟢', label: 'Excelente', minEficiencia: 80, minTasa: 80 },
  AMARILLO: { icon: '🟡', label: 'Atención', minEficiencia: 60, minTasa: 60 },
  ROJO: { icon: '🔴', label: 'Crítico', minEficiencia: 0, minTasa: 0 },
  GRIS: { icon: '⚪', label: 'Sin datos', minEficiencia: -1, minTasa: -1 },
};

// ===== COLORES SEMÁFORO =====
export const COLORES_SEMAFORO = {
  verde: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  amarillo: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500',
    gradient: 'from-amber-400 to-amber-600',
  },
  rojo: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    gradient: 'from-red-400 to-red-600',
  },
  gris: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-400',
    gradient: 'from-slate-400 to-slate-500',
  },
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
