/**
 * TIPOS PARA MÓDULO PROCESOS 2.0
 */

// ============================================
// USUARIOS
// ============================================

export interface Usuario {
  id: string;
  nombre: string;
  avatar: string;
  color: string;
  sonido: string;
  metaDiaria: number;
  rol: 'usuario' | 'admin';
  createdAt: Date;
}

export const COLORES_DISPONIBLES = [
  { id: 'purple', name: 'Morado', hex: '#8B5CF6', emoji: '🟣' },
  { id: 'blue', name: 'Azul', hex: '#3B82F6', emoji: '🔵' },
  { id: 'green', name: 'Verde', hex: '#10B981', emoji: '🟢' },
  { id: 'yellow', name: 'Amarillo', hex: '#F59E0B', emoji: '🟡' },
  { id: 'orange', name: 'Naranja', hex: '#F97316', emoji: '🟠' },
  { id: 'red', name: 'Rojo', hex: '#EF4444', emoji: '🔴' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899', emoji: '💗' },
  { id: 'cyan', name: 'Cyan', hex: '#06B6D4', emoji: '🩵' },
] as const;

export const AVATARES_DISPONIBLES = [
  '😊', '🦊', '🐱', '🦁', '🐼', '🦄', '🐲', '🦅',
  '🐺', '🦋', '🌟', '⚡', '🔥', '💎', '🎯', '🚀',
];

export const SONIDOS_DISPONIBLES = [
  { id: 'bell', name: 'Campana', emoji: '🔔' },
  { id: 'chime', name: 'Tintineo', emoji: '✨' },
  { id: 'alert', name: 'Alerta', emoji: '🚨' },
  { id: 'success', name: 'Éxito', emoji: '🎉' },
  { id: 'pop', name: 'Pop', emoji: '💫' },
];

// ============================================
// CRONÓMETRO
// ============================================

export interface ConfigCronometro {
  duracionMinutos: number;
  alertaAmarilla: number; // porcentaje
  alertaNaranja: number;
  alertaRoja: number;
  sonidoFinal: boolean;
  vibracion: boolean;
}

export type EstadoCronometro = 'idle' | 'running' | 'paused' | 'finished';
export type ColorCronometro = 'green' | 'yellow' | 'orange' | 'red';

// ============================================
// RONDAS Y GUÍAS
// ============================================

export interface RondaGuias {
  id: string;
  numero: number;
  usuarioId: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  tiempoTotal: number;
  pedidosIniciales: number;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  revisado: number;
}

export interface RegistroNovedades {
  id: string;
  usuarioId: string;
  fecha: string;
  hora: string;
  solucionadas: number;
  revisadas: number;
  devolucion: number;
  cliente: number;
  transportadora: number;
  litper: number;
}

// ============================================
// NOTAS FLOTANTES
// ============================================

export interface NotaFlotante {
  id: string;
  usuarioId: string;
  contenido: string;
  color: 'default' | 'yellow' | 'green' | 'red' | 'blue';
  posicion: { x: number; y: number };
  tamaño: { width: number; height: number };
  siempreVisible: boolean;
  bloqueada: boolean;
  minimizada: boolean;
  oculta: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// GAMIFICACIÓN
// ============================================

export interface PerfilGamificacion {
  usuarioId: string;
  xp: number;
  nivel: number;
  rachaActual: number;
  mejorRacha: number;
  guiasTotales: number;
  logroIds: string[];
  avatarDesbloqueados: string[];
  coloresDesbloqueados: string[];
  sonidosDesbloqueados: string[];
}

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  xpRecompensa: number;
  condicion: {
    tipo: 'guias' | 'racha' | 'meta' | 'tiempo' | 'perfecto';
    valor: number;
  };
  desbloqueado: boolean;
  fechaDesbloqueo?: Date;
}

export const LOGROS_DISPONIBLES: Omit<Logro, 'desbloqueado' | 'fechaDesbloqueo'>[] = [
  { id: 'racha5', nombre: 'Racha de Fuego', descripcion: '5 días seguidos trabajando', icono: '🔥', xpRecompensa: 100, condicion: { tipo: 'racha', valor: 5 } },
  { id: 'racha10', nombre: 'Imparable', descripcion: '10 días seguidos trabajando', icono: '⚡', xpRecompensa: 250, condicion: { tipo: 'racha', valor: 10 } },
  { id: 'racha30', nombre: 'Máquina', descripcion: '30 días seguidos trabajando', icono: '🤖', xpRecompensa: 500, condicion: { tipo: 'racha', valor: 30 } },
  { id: 'guias50', nombre: 'Velocista', descripcion: '50 guías en un día', icono: '🏃', xpRecompensa: 150, condicion: { tipo: 'guias', valor: 50 } },
  { id: 'guias100', nombre: 'Súper Velocista', descripcion: '100 guías en un día', icono: '🚀', xpRecompensa: 300, condicion: { tipo: 'guias', valor: 100 } },
  { id: 'guias1000', nombre: 'Veterano', descripcion: '1000 guías totales', icono: '🎖️', xpRecompensa: 500, condicion: { tipo: 'guias', valor: 1000 } },
  { id: 'meta100', nombre: 'Perfeccionista', descripcion: '100% de meta cumplida', icono: '🎯', xpRecompensa: 100, condicion: { tipo: 'meta', valor: 100 } },
  { id: 'perfecto', nombre: 'Sin Errores', descripcion: '0 cancelaciones en el día', icono: '✨', xpRecompensa: 75, condicion: { tipo: 'perfecto', valor: 0 } },
  { id: 'campeon', nombre: 'Campeón Semanal', descripcion: 'Más guías de la semana', icono: '🏆', xpRecompensa: 200, condicion: { tipo: 'guias', valor: 0 } },
  { id: 'leyenda', nombre: 'Leyenda', descripcion: 'Alcanzar nivel 20', icono: '👑', xpRecompensa: 1000, condicion: { tipo: 'guias', valor: 0 } },
];

export const NIVELES = [
  { nivel: 1, nombre: 'Novato', xpRequerido: 0 },
  { nivel: 2, nombre: 'Aprendiz', xpRequerido: 100 },
  { nivel: 3, nombre: 'Iniciado', xpRequerido: 250 },
  { nivel: 4, nombre: 'Competente', xpRequerido: 500 },
  { nivel: 5, nombre: 'Hábil', xpRequerido: 800 },
  { nivel: 6, nombre: 'Profesional', xpRequerido: 1200 },
  { nivel: 7, nombre: 'Experto', xpRequerido: 1700 },
  { nivel: 8, nombre: 'Maestro', xpRequerido: 2300 },
  { nivel: 9, nombre: 'Gran Maestro', xpRequerido: 3000 },
  { nivel: 10, nombre: 'Elite', xpRequerido: 4000 },
  { nivel: 11, nombre: 'Veterano', xpRequerido: 5000 },
  { nivel: 12, nombre: 'Héroe', xpRequerido: 6500 },
  { nivel: 13, nombre: 'Campeón', xpRequerido: 8000 },
  { nivel: 14, nombre: 'Conquistador', xpRequerido: 10000 },
  { nivel: 15, nombre: 'Titán', xpRequerido: 12500 },
  { nivel: 16, nombre: 'Mítico', xpRequerido: 15000 },
  { nivel: 17, nombre: 'Legendario', xpRequerido: 18000 },
  { nivel: 18, nombre: 'Inmortal', xpRequerido: 22000 },
  { nivel: 19, nombre: 'Divino', xpRequerido: 27000 },
  { nivel: 20, nombre: 'Leyenda', xpRequerido: 35000 },
];

// ============================================
// ALERTAS IA
// ============================================

export interface AlertaIA {
  id: string;
  tipo: 'warning' | 'success' | 'info' | 'tip';
  mensaje: string;
  usuarioId?: string;
  timestamp: Date;
  leida: boolean;
}

export interface RecomendacionIA {
  id: string;
  tipo: 'productividad' | 'meta' | 'descanso' | 'mejora';
  titulo: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  usuarioId?: string;
}

// ============================================
// REPORTES ADMIN
// ============================================

export interface ReporteUsuario {
  usuarioId: string;
  nombre: string;
  color: string;
  guiasHoy: number;
  guiasSemana: number;
  guiasMes: number;
  tiempoPromedio: number;
  tasaExito: number;
  tendencia: 'up' | 'down' | 'stable';
  cambio: number;
}

export interface ReporteGeneral {
  fecha: string;
  totalGuias: number;
  totalUsuarios: number;
  promedioGuiasPorUsuario: number;
  mejorUsuario: string;
  horasPico: string[];
  comparativoAyer: number;
}
