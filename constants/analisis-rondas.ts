/**
 * 📊 CONSTANTES PARA ANÁLISIS DE RONDAS LITPER
 * Configuración del sistema de control de rondas
 */

import {
  UsuarioOperador,
  MetricasGlobales,
  MetricasUsuario,
  MetricasAvanzadasUsuario,
  AlertaGlobal,
  Recomendacion,
  Problema,
  EstadoRendimiento,
  EstadoSemaforo,
  NivelRacha,
} from '../types/analisis-rondas';

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
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  amarillo: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-400 to-amber-600',
  },
  rojo: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    gradient: 'from-rose-400 to-rose-600',
  },
  gris: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    gradient: 'from-slate-400 to-slate-500',
  },
};

// ===== COLORES POR ESTADO =====
export const COLORES_ESTADO = {
  excelente: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-400',
    icon: '🟢',
  },
  bueno: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400',
    icon: '🔵',
  },
  regular: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400',
    icon: '🟡',
  },
  bajo: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-400',
    icon: '🔴',
  },
};

// ===== COLORES ALERTAS =====
export const COLORES_ALERTA = {
  critico: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-l-rose-500',
    icon: '🔴',
  },
  urgente: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-l-orange-500',
    icon: '🟠',
  },
  atencion: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-l-amber-500',
    icon: '🟡',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-l-blue-500',
    icon: '🔵',
  },
};

// ===== PRIORIDAD RECOMENDACIONES =====
export const COLORES_PRIORIDAD = {
  alta: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  },
  media: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  baja: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
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

// ===== GENERADORES DE DATOS DEMO =====

// Datos deterministas por operador (índice → valores fijos)
const DEMO_OPERADOR_DATA: Array<{
  tasaExito: number; totalRondas: number; guiasIniciales: number; guiasRealizadas: number;
  canceladas: number; agendadas: number; pendientes: number; novedades: number;
  tiempoTotal: number; eficiencia: number; rachaDias: number;
}> = [
  { tasaExito: 92, totalRondas: 7, guiasIniciales: 55, guiasRealizadas: 51, canceladas: 2, agendadas: 1, pendientes: 1, novedades: 0, tiempoTotal: 145, eficiencia: 105, rachaDias: 7 },
  { tasaExito: 88, totalRondas: 6, guiasIniciales: 48, guiasRealizadas: 42, canceladas: 3, agendadas: 2, pendientes: 1, novedades: 0, tiempoTotal: 130, eficiencia: 97, rachaDias: 5 },
  { tasaExito: 85, totalRondas: 5, guiasIniciales: 40, guiasRealizadas: 34, canceladas: 2, agendadas: 2, pendientes: 2, novedades: 0, tiempoTotal: 110, eficiencia: 93, rachaDias: 4 },
  { tasaExito: 78, totalRondas: 6, guiasIniciales: 45, guiasRealizadas: 35, canceladas: 4, agendadas: 3, pendientes: 3, novedades: 0, tiempoTotal: 125, eficiencia: 84, rachaDias: 3 },
  { tasaExito: 74, totalRondas: 5, guiasIniciales: 38, guiasRealizadas: 28, canceladas: 3, agendadas: 4, pendientes: 3, novedades: 0, tiempoTotal: 105, eficiencia: 80, rachaDias: 2 },
  { tasaExito: 71, totalRondas: 4, guiasIniciales: 35, guiasRealizadas: 25, canceladas: 4, agendadas: 3, pendientes: 3, novedades: 0, tiempoTotal: 95, eficiencia: 79, rachaDias: 1 },
  { tasaExito: 65, totalRondas: 5, guiasIniciales: 42, guiasRealizadas: 27, canceladas: 6, agendadas: 4, pendientes: 5, novedades: 0, tiempoTotal: 120, eficiencia: 68, rachaDias: 0 },
  { tasaExito: 58, totalRondas: 4, guiasIniciales: 30, guiasRealizadas: 17, canceladas: 5, agendadas: 3, pendientes: 5, novedades: 0, tiempoTotal: 85, eficiencia: 60, rachaDias: 0 },
  { tasaExito: 45, totalRondas: 3, guiasIniciales: 25, guiasRealizadas: 11, canceladas: 6, agendadas: 3, pendientes: 5, novedades: 0, tiempoTotal: 70, eficiencia: 47, rachaDias: 0 },
];

const calcularEstadoDemo = (tasa: number): EstadoRendimiento => {
  if (tasa >= 85) return 'excelente';
  if (tasa >= 70) return 'bueno';
  if (tasa >= 50) return 'regular';
  return 'bajo';
};

const calcularSemaforoDemo = (eficiencia: number, tasa: number): EstadoSemaforo => {
  if (eficiencia <= 0 && tasa <= 0) return 'gris';
  if (eficiencia >= 80 && tasa >= 80) return 'verde';
  if (eficiencia >= 60 && tasa >= 60) return 'amarillo';
  return 'rojo';
};

const calcularRachaDemo = (dias: number): { dias: number; nivel: NivelRacha; icono: string } => {
  if (dias >= 7) return { dias, nivel: 'fuego', icono: '🔥🔥🔥' };
  if (dias >= 5) return { dias, nivel: 'caliente', icono: '🔥🔥' };
  if (dias >= 3) return { dias, nivel: 'encendido', icono: '🔥' };
  if (dias >= 1) return { dias, nivel: 'inicio', icono: '✨' };
  return { dias: 0, nivel: 'ninguno', icono: '💤' };
};

export const generarDatosDemo = (): MetricasGlobales => {
  const hoy = new Date().toISOString().split('T')[0];

  const ranking: MetricasUsuario[] = USUARIOS_OPERADORES.map((op, i) => {
    const d = DEMO_OPERADOR_DATA[i];
    const estado = calcularEstadoDemo(d.tasaExito);
    const semaforo = calcularSemaforoDemo(d.eficiencia, d.tasaExito);
    const guiasPorHora = d.tiempoTotal > 0 ? (d.guiasRealizadas / (d.tiempoTotal / 60)) : 0;
    const tiempoPromedio = d.totalRondas > 0 ? d.tiempoTotal / d.totalRondas : 0;

    const alertas = d.tasaExito < 60
      ? [{ id: `alerta-${op.id}`, tipo: 'atencion' as const, mensaje: `Tasa de éxito por debajo del 60%`, accion: 'Revisar asignación de rutas' }]
      : [];

    const tendencia: 'subiendo' | 'estable' | 'bajando' = i < 3 ? 'subiendo' : i < 6 ? 'estable' : 'bajando';

    const avanzadas: MetricasAvanzadasUsuario = {
      eficiencia: d.eficiencia,
      eficienciaEstado: calcularEstadoDemo(d.eficiencia >= 100 ? 85 : d.eficiencia >= 80 ? 75 : d.eficiencia >= 60 ? 55 : 40),
      metaDiaria: {
        guiasHoy: d.guiasRealizadas,
        metaGuias: METRICAS_AVANZADAS.META_DIARIA_GUIAS,
        progreso: Math.min((d.guiasRealizadas / METRICAS_AVANZADAS.META_DIARIA_GUIAS) * 100, 100),
        horasRestantes: 0,
      },
      racha: calcularRachaDemo(d.rachaDias),
      semaforo,
      analisisPorHorario: {
        mejorHora: '09:00',
        peorHora: '14:00',
        guiasPorHora: [
          { hora: '08:00', guias: Math.round(d.guiasRealizadas * 0.3), eficiencia: d.eficiencia + 5 },
          { hora: '10:00', guias: Math.round(d.guiasRealizadas * 0.4), eficiencia: d.eficiencia },
          { hora: '14:00', guias: Math.round(d.guiasRealizadas * 0.3), eficiencia: d.eficiencia - 10 },
        ],
      },
      resumenDia: {
        numero1: { valor: d.guiasRealizadas, label: 'Guías hoy', icono: '📦' },
        numero2: { valor: d.eficiencia, label: 'Eficiencia', icono: '⚡' },
        numero3: { valor: d.rachaDias, label: 'Días racha', icono: '🔥' },
      },
    };

    return {
      usuario: op.nombre,
      totalRondas: d.totalRondas,
      totalGuiasIniciales: d.guiasIniciales,
      guiasRealizadas: d.guiasRealizadas,
      canceladas: d.canceladas,
      agendadas: d.agendadas,
      pendientes: d.pendientes,
      novedades: d.novedades,
      tasaExito: d.tasaExito,
      guiasPorHora: parseFloat(guiasPorHora.toFixed(1)),
      tiempoPromedio: parseFloat(tiempoPromedio.toFixed(1)),
      tiempoTotal: d.tiempoTotal,
      estado,
      alertas,
      tendencia,
      avanzadas,
    };
  });

  // Aggregate
  const totalGuiasProcesadas = ranking.reduce((s, u) => s + u.totalGuiasIniciales, 0);
  const totalGuiasRealizadas = ranking.reduce((s, u) => s + u.guiasRealizadas, 0);
  const totalRondas = ranking.reduce((s, u) => s + u.totalRondas, 0);
  const tasaExitoEquipo = totalGuiasProcesadas > 0 ? (totalGuiasRealizadas / totalGuiasProcesadas) * 100 : 0;
  const eficienciaEquipo = ranking.reduce((s, u) => s + (u.avanzadas?.eficiencia || 0), 0) / ranking.length;

  const distribucionEstados = { excelente: 0, bueno: 0, regular: 0, bajo: 0 };
  const semaforoEquipo = { verde: 0, amarillo: 0, rojo: 0, gris: 0 };
  ranking.forEach(u => {
    distribucionEstados[u.estado]++;
    const sem = u.avanzadas?.semaforo || 'gris';
    semaforoEquipo[sem]++;
  });

  const totalNovedades = ranking.reduce((s, u) => s + u.novedades, 0);
  const totalCanceladas = ranking.reduce((s, u) => s + u.canceladas, 0);

  const top3Problemas: Problema[] = [
    {
      id: 'demo-p1',
      titulo: 'Alto ratio de cancelaciones en zona sur',
      descripcion: 'Operadores de la zona sur presentan el doble de cancelaciones vs promedio',
      usuariosAfectados: ['JIMMY', 'CAROLINA'],
      impacto: 65,
      categoria: 'rendimiento',
      icono: '📉',
    },
    {
      id: 'demo-p2',
      titulo: 'Tiempos excesivos en rondas matutinas',
      descripcion: 'Las rondas de 8-10am toman 40% más tiempo del esperado',
      usuariosAfectados: ['KAREN', 'ALEJANDRA', 'NORMAN'],
      impacto: 45,
      categoria: 'tiempo',
      icono: '⏱️',
    },
    {
      id: 'demo-p3',
      titulo: 'Baja tasa de éxito recurrente',
      descripcion: 'Un operador lleva 3 días consecutivos por debajo del 50%',
      usuariosAfectados: ['CAROLINA'],
      impacto: 35,
      categoria: 'rendimiento',
      icono: '⚠️',
    },
  ];

  return {
    fecha: hoy,
    tasaExitoEquipo: parseFloat(tasaExitoEquipo.toFixed(1)),
    totalGuiasProcesadas,
    totalGuiasRealizadas,
    totalRondas,
    usuariosActivos: 9,
    ratioNovedades: totalGuiasProcesadas > 0 ? parseFloat(((totalNovedades / totalGuiasProcesadas) * 100).toFixed(1)) : 0,
    ratioCancelaciones: totalGuiasProcesadas > 0 ? parseFloat(((totalCanceladas / totalGuiasProcesadas) * 100).toFixed(1)) : 0,
    duplicadosDetectados: 3,
    rondasConTiempoCero: 1,
    ranking,
    distribucionEstados,
    metaEquipo: UMBRALES.META_EXITO_EQUIPO,
    eficienciaEquipo: parseFloat(eficienciaEquipo.toFixed(1)),
    top3Problemas,
    anomalias: [],
    semaforoEquipo,
  };
};

export const generarAlertasDemo = (): AlertaGlobal[] => [
  {
    id: 'demo-a1',
    tipo: 'critico',
    titulo: 'Operador con rendimiento crítico',
    descripcion: 'CAROLINA tiene una tasa de éxito del 45%, muy por debajo del mínimo aceptable',
    usuariosAfectados: ['CAROLINA'],
    valor: 45,
    umbral: 50,
    icono: '🚨',
  },
  {
    id: 'demo-a2',
    tipo: 'atencion',
    titulo: 'Operadores por debajo de la meta',
    descripcion: '4 operadores están por debajo de la meta del 85% de tasa de éxito',
    usuariosAfectados: ['NORMAN', 'ALEJANDRA', 'KAREN', 'JIMMY'],
    valor: 4,
    umbral: 0,
    icono: '⚠️',
  },
  {
    id: 'demo-a3',
    tipo: 'info',
    titulo: 'Mejor racha del equipo',
    descripcion: 'ANGIE lleva 7 días consecutivos con rendimiento excelente',
    usuariosAfectados: ['ANGIE'],
    icono: '🏆',
  },
];

export const generarRecomendacionesDemo = (): Recomendacion[] => [
  {
    id: 'demo-r1',
    prioridad: 'alta',
    titulo: 'Intervención urgente con CAROLINA',
    descripcion: 'Tasa de éxito del 45% por 3 días consecutivos. Requiere acompañamiento inmediato.',
    accion: 'Programar sesión de coaching y revisar asignación de rutas',
    categoria: 'capacitacion',
    icono: '🎯',
  },
  {
    id: 'demo-r2',
    prioridad: 'media',
    titulo: 'Redistribuir carga zona sur',
    descripcion: 'JIMMY y CAROLINA manejan las rutas más difíciles con menos recursos.',
    accion: 'Balancear rutas entre operadores con mejor desempeño',
    categoria: 'redistribucion',
    icono: '🔄',
  },
  {
    id: 'demo-r3',
    prioridad: 'media',
    titulo: 'Optimizar horarios matutinos',
    descripcion: 'Las rondas de 8-10am tienen 40% más tiempo del esperado.',
    accion: 'Ajustar inicio de rondas y verificar disponibilidad de guías',
    categoria: 'rendimiento',
    icono: '⏰',
  },
  {
    id: 'demo-r4',
    prioridad: 'baja',
    titulo: 'Reconocimiento a top performers',
    descripcion: 'ANGIE y CATALINA mantienen excelencia sostenida.',
    accion: 'Implementar programa de incentivos por rendimiento',
    categoria: 'rendimiento',
    icono: '🏅',
  },
];
