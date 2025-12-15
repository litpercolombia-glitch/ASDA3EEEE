/**
 * 🎮 LITPER PROCESOS - GAMING EDITION
 * Sistema de Control de Procesos Logísticos con Gamificación Completa
 *
 * Features:
 * - Ventana flotante arrastrable (Mission Control)
 * - Sistema de XP, Niveles y Combos
 * - Ranking del equipo en tiempo real
 * - Medallas y logros desbloqueables
 * - Power-ups y bonificaciones
 * - Tips de productividad
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users,
  Crown,
  Package,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Save,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Award,
  Target,
  Zap,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  User,
  Truck,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Gift,
  Snowflake,
  Crosshair,
  Rocket,
  Medal,
  Gamepad2,
  X,
  Minimize2,
  Maximize2,
  Pin,
  PinOff,
  Move,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Timer,
  GripVertical,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// =====================================
// TIPOS E INTERFACES - GAMIFICACIÓN
// =====================================
interface ProcesosLitperTabProps {
  selectedCountry?: string;
}

interface Usuario {
  id: string;
  nombre: string;
  avatar?: string;
  xp: number;
  nivel: number;
  racha: number;
  ultimaActividad: string;
  medallas: string[];
  guiasTotales: number;
  tiempoPromedioHistorico: number;
  mejorTiempo: number;
  combosMaximos: number;
}

interface RondaGuias {
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
  tiempoPromedio: number;
  xpGanado: number;
  comboMaximo: number;
}

interface RegistroNovedades {
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

interface ConfiguracionCronometro {
  tiempoPorRonda: number;
  tiempoPromedioGuia: number;
  alertaTemprana: number;
  alertaCritica: number;
  sonidoActivo: boolean;
  notificacionesActivas: boolean;
  mensajesMotivacionales: boolean;
  metaDiaria: number;
}

interface Medalla {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  requisito: string;
  xpRecompensa: number;
  desbloqueada: boolean;
  progreso: number;
  objetivo: number;
}

interface PowerUp {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  activo: boolean;
  duracion: number;
  efecto: string;
}

interface WidgetPosition {
  x: number;
  y: number;
}

// =====================================
// CONSTANTES
// =====================================
const STORAGE_KEY_RONDAS = 'litper_procesos_rondas';
const STORAGE_KEY_NOVEDADES = 'litper_procesos_novedades';
const STORAGE_KEY_CONFIG = 'litper_procesos_config';
const STORAGE_KEY_USUARIOS = 'litper_procesos_usuarios_gaming';
const STORAGE_KEY_WIDGET = 'litper_procesos_widget_pos';

// Sistema de niveles
const NIVELES = [
  { nivel: 1, nombre: 'Novato', xpMin: 0, xpMax: 100, color: 'from-gray-400 to-gray-500' },
  { nivel: 2, nombre: 'Novato', xpMin: 100, xpMax: 200, color: 'from-gray-400 to-gray-500' },
  { nivel: 3, nombre: 'Novato', xpMin: 200, xpMax: 350, color: 'from-gray-400 to-gray-500' },
  { nivel: 4, nombre: 'Novato', xpMin: 350, xpMax: 500, color: 'from-gray-400 to-gray-500' },
  { nivel: 5, nombre: 'Novato', xpMin: 500, xpMax: 700, color: 'from-gray-400 to-gray-500' },
  { nivel: 6, nombre: 'Aprendiz', xpMin: 700, xpMax: 1000, color: 'from-green-400 to-green-500' },
  { nivel: 7, nombre: 'Aprendiz', xpMin: 1000, xpMax: 1300, color: 'from-green-400 to-green-500' },
  { nivel: 8, nombre: 'Aprendiz', xpMin: 1300, xpMax: 1600, color: 'from-green-400 to-green-500' },
  { nivel: 9, nombre: 'Aprendiz', xpMin: 1600, xpMax: 2000, color: 'from-green-400 to-green-500' },
  { nivel: 10, nombre: 'Aprendiz', xpMin: 2000, xpMax: 2500, color: 'from-green-400 to-green-500' },
  { nivel: 11, nombre: 'Experto', xpMin: 2500, xpMax: 3000, color: 'from-blue-400 to-blue-500' },
  { nivel: 12, nombre: 'Experto', xpMin: 3000, xpMax: 3600, color: 'from-blue-400 to-blue-500' },
  { nivel: 13, nombre: 'Experto', xpMin: 3600, xpMax: 4200, color: 'from-blue-400 to-blue-500' },
  { nivel: 14, nombre: 'Experto', xpMin: 4200, xpMax: 5000, color: 'from-blue-400 to-blue-500' },
  { nivel: 15, nombre: 'Experto', xpMin: 5000, xpMax: 6000, color: 'from-blue-400 to-blue-500' },
  { nivel: 16, nombre: 'Maestro', xpMin: 6000, xpMax: 7000, color: 'from-purple-400 to-purple-500' },
  { nivel: 17, nombre: 'Maestro', xpMin: 7000, xpMax: 8000, color: 'from-purple-400 to-purple-500' },
  { nivel: 18, nombre: 'Maestro', xpMin: 8000, xpMax: 9000, color: 'from-purple-400 to-purple-500' },
  { nivel: 19, nombre: 'Maestro', xpMin: 9000, xpMax: 10000, color: 'from-purple-400 to-purple-500' },
  { nivel: 20, nombre: 'Maestro', xpMin: 10000, xpMax: 12000, color: 'from-purple-400 to-purple-500' },
  { nivel: 21, nombre: 'Leyenda', xpMin: 12000, xpMax: 14000, color: 'from-amber-400 to-amber-500' },
  { nivel: 22, nombre: 'Leyenda', xpMin: 14000, xpMax: 16000, color: 'from-amber-400 to-amber-500' },
  { nivel: 23, nombre: 'Leyenda', xpMin: 16000, xpMax: 18000, color: 'from-amber-400 to-amber-500' },
  { nivel: 24, nombre: 'Leyenda', xpMin: 18000, xpMax: 20000, color: 'from-amber-400 to-amber-500' },
  { nivel: 25, nombre: 'Leyenda', xpMin: 20000, xpMax: 25000, color: 'from-amber-400 to-amber-500' },
  { nivel: 26, nombre: 'ELITE LITPER', xpMin: 25000, xpMax: 999999, color: 'from-yellow-400 to-yellow-500' },
];

const MEDALLAS_DISPONIBLES: Medalla[] = [
  { id: 'velocista', nombre: 'Velocista', icono: '🥇', descripcion: '50 guías procesadas en menos de 2 min', requisito: 'guias_rapidas', xpRecompensa: 500, desbloqueada: false, progreso: 0, objetivo: 50 },
  { id: 'maratonista', nombre: 'Maratonista', icono: '🏃', descripcion: '100 guías en un solo día', requisito: 'guias_dia', xpRecompensa: 1000, desbloqueada: false, progreso: 0, objetivo: 100 },
  { id: 'francotirador', nombre: 'Francotirador', icono: '🎯', descripcion: '0 cancelados en 1 semana', requisito: 'sin_cancelados', xpRecompensa: 750, desbloqueada: false, progreso: 0, objetivo: 7 },
  { id: 'en_llamas', nombre: 'En Llamas', icono: '🔥', descripcion: 'Racha de 7 días consecutivos', requisito: 'racha_dias', xpRecompensa: 1000, desbloqueada: false, progreso: 0, objetivo: 7 },
  { id: 'rayo', nombre: 'Rayo', icono: '⚡', descripcion: 'Mejor tiempo del equipo', requisito: 'mejor_tiempo', xpRecompensa: 500, desbloqueada: false, progreso: 0, objetivo: 1 },
  { id: 'rey_dia', nombre: 'Rey del Día', icono: '👑', descripcion: '#1 en el ranking diario', requisito: 'ranking_1', xpRecompensa: 300, desbloqueada: false, progreso: 0, objetivo: 1 },
  { id: 'diamante', nombre: 'Diamante', icono: '💎', descripcion: 'Alcanzar nivel 25', requisito: 'nivel_25', xpRecompensa: 2000, desbloqueada: false, progreso: 0, objetivo: 25 },
  { id: 'constante', nombre: 'Constante', icono: '🥈', descripcion: '5 rondas sin pausar', requisito: 'sin_pausas', xpRecompensa: 400, desbloqueada: false, progreso: 0, objetivo: 5 },
  { id: 'perfeccionista', nombre: 'Perfeccionista', icono: '🏅', descripcion: '10 rondas con 0 errores', requisito: 'sin_errores', xpRecompensa: 600, desbloqueada: false, progreso: 0, objetivo: 10 },
  { id: 'imparable', nombre: 'Imparable', icono: '🚀', descripcion: 'Combo x5 alcanzado', requisito: 'combo_5', xpRecompensa: 800, desbloqueada: false, progreso: 0, objetivo: 1 },
];

const POWER_UPS: PowerUp[] = [
  { id: 'turbo', nombre: 'Turbo x2', icono: '🚀', descripcion: 'Duplica XP por 5 minutos', activo: false, duracion: 300, efecto: 'xp_x2' },
  { id: 'congelar', nombre: 'Congelar', icono: '❄️', descripcion: 'Pausa el tiempo sin perder combo', activo: false, duracion: 60, efecto: 'freeze' },
  { id: 'precision', nombre: 'Precisión', icono: '🎯', descripcion: '+50% XP en guías rápidas', activo: false, duracion: 180, efecto: 'precision' },
];

const TIPS_PRODUCTIVIDAD = [
  "💡 Técnica Pomodoro: Trabaja 25 min intensos, descansa 5 min. Tu cronómetro ya está configurado para esto.",
  "⏱️ Regla de los 2 minutos: Si una guía toma menos de 2 min, hazla de inmediato.",
  "📦 Batch Processing: Agrupa guías similares para procesarlas más rápido.",
  "🎯 Evita multitasking: Una guía a la vez = mejor tiempo promedio.",
  "💧 Hidratación: Bebe agua cada hora para mantener la concentración.",
  "🧘 Micro-descansos: Cada 50 guías, estira los brazos por 30 segundos.",
  "🎯 Meta clara: Visualiza tu objetivo diario antes de empezar.",
  "🔕 Elimina distracciones: Silencia notificaciones no esenciales durante las rondas.",
  "🎉 Celebra pequeños logros: Cada ronda completada es una victoria.",
  "📈 Compite contigo mismo: Intenta superar tu récord de ayer.",
];

const USUARIOS_DEFAULT: Usuario[] = [
  { id: '1', nombre: 'EVAN', xp: 680, nivel: 12, racha: 5, ultimaActividad: new Date().toISOString(), medallas: ['velocista'], guiasTotales: 245, tiempoPromedioHistorico: 2.4, mejorTiempo: 1.2, combosMaximos: 3 },
  { id: '2', nombre: 'MARIA', xp: 850, nivel: 15, racha: 8, ultimaActividad: new Date().toISOString(), medallas: ['velocista', 'constante'], guiasTotales: 312, tiempoPromedioHistorico: 2.1, mejorTiempo: 1.0, combosMaximos: 5 },
  { id: '3', nombre: 'CARLOS', xp: 520, nivel: 10, racha: 3, ultimaActividad: new Date().toISOString(), medallas: [], guiasTotales: 189, tiempoPromedioHistorico: 2.8, mejorTiempo: 1.5, combosMaximos: 2 },
  { id: '4', nombre: 'ANA', xp: 410, nivel: 8, racha: 2, ultimaActividad: new Date().toISOString(), medallas: [], guiasTotales: 156, tiempoPromedioHistorico: 3.1, mejorTiempo: 1.8, combosMaximos: 2 },
  { id: '5', nombre: 'PEDRO', xp: 350, nivel: 6, racha: 1, ultimaActividad: new Date().toISOString(), medallas: [], guiasTotales: 98, tiempoPromedioHistorico: 3.5, mejorTiempo: 2.0, combosMaximos: 1 },
];

const CONFIG_DEFAULT: ConfiguracionCronometro = {
  tiempoPorRonda: 25,
  tiempoPromedioGuia: 3,
  alertaTemprana: 150,
  alertaCritica: 240,
  sonidoActivo: true,
  notificacionesActivas: true,
  mensajesMotivacionales: true,
  metaDiaria: 60,
};

const MENSAJES_MOTIVACIONALES = [
  "💪 ¡Tú puedes! Solo un poco más rápido y rompes tu récord.",
  "🚀 ¡Vamos equipo Litper! Cada guía nos acerca al objetivo.",
  "⭐ ¡Eres crack! Recuerda: eficiencia + calidad = éxito.",
  "🎯 ¡Enfócate! Estás a punto de terminar esta guía.",
  "🏆 ¡Campeón/a! El equipo Litper cuenta contigo.",
  "💡 Tip: Si es muy compleja, márcala como 'Difícil' y continúa.",
  "🌟 ¡Excelente trabajo! Mantén ese ritmo ganador.",
  "⚡ ¡Velocidad Litper activada! Tú lo logras.",
  "🔥 ¡COMBO ACTIVO! No pierdas el ritmo.",
  "💎 ¡Vas por buen camino para subir de nivel!",
];

// =====================================
// HELPERS
// =====================================
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to storage:', e);
  }
};

const getNivelInfo = (xp: number) => {
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (xp >= NIVELES[i].xpMin) {
      const nivelActual = NIVELES[i];
      const xpEnNivel = xp - nivelActual.xpMin;
      const xpParaSiguiente = nivelActual.xpMax - nivelActual.xpMin;
      const progreso = (xpEnNivel / xpParaSiguiente) * 100;
      return { ...nivelActual, xpEnNivel, xpParaSiguiente, progreso };
    }
  }
  return { ...NIVELES[0], xpEnNivel: 0, xpParaSiguiente: 100, progreso: 0 };
};

const calcularXP = (guiasRealizadas: number, tiempoPromedio: number, cancelados: number, combo: number): number => {
  let xp = guiasRealizadas * 10; // Base: 10 XP por guía

  // Bonus por velocidad
  if (tiempoPromedio < 2) xp += guiasRealizadas * 5;
  else if (tiempoPromedio < 3) xp += guiasRealizadas * 2;

  // Penalización por cancelados
  xp -= cancelados * 3;

  // Multiplicador por combo
  xp = Math.floor(xp * (1 + (combo - 1) * 0.1));

  // Bonus por ronda completa
  xp += 50;

  // Bonus si no hubo cancelados
  if (cancelados === 0) xp += 25;

  return Math.max(0, xp);
};

// =====================================
// COMPONENTE: MINI WIDGET FLOTANTE
// =====================================
const FloatingWidget: React.FC<{
  usuario: Usuario;
  tiempoActual: number;
  cronometroActivo: boolean;
  realizado: number;
  cancelado: number;
  agendado: number;
  dificiles: number;
  pendientes: number;
  combo: number;
  metaDiaria: number;
  guiasHoy: number;
  onToggleCronometro: () => void;
  onGuardar: () => void;
  onExpandir: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  position: WidgetPosition;
  onPositionChange: (pos: WidgetPosition) => void;
  alertaTemprana: number;
  alertaCritica: number;
}> = ({
  usuario,
  tiempoActual,
  cronometroActivo,
  realizado,
  cancelado,
  agendado,
  dificiles,
  pendientes,
  combo,
  metaDiaria,
  guiasHoy,
  onToggleCronometro,
  onGuardar,
  onExpandir,
  isPinned,
  onTogglePin,
  onClose,
  position,
  onPositionChange,
  alertaTemprana,
  alertaCritica,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.widget-control')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      onPositionChange({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  let timerColor = 'text-emerald-400';
  let timerBg = 'bg-emerald-500/20';
  let statusText = 'NORMAL';
  if (tiempoActual >= alertaCritica) {
    timerColor = 'text-red-400';
    timerBg = 'bg-red-500/20';
    statusText = 'CRÍTICO';
  } else if (tiempoActual >= alertaTemprana) {
    timerColor = 'text-amber-400';
    timerBg = 'bg-amber-500/20';
    statusText = 'ALERTA';
  }

  const nivelInfo = getNivelInfo(usuario.xp);
  const progresoMeta = Math.min((guiasHoy / metaDiaria) * 100, 100);

  return (
    <div
      ref={widgetRef}
      className={`fixed z-50 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden transition-shadow ${
        isDragging ? 'cursor-grabbing shadow-cyan-500/20' : 'cursor-grab'
      } ${isPinned ? 'ring-2 ring-cyan-500' : ''}`}
      style={{ left: position.x, top: position.y, width: '280px' }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-white" />
          <span className="font-bold text-white text-sm">LITPER</span>
        </div>
        <div className="flex items-center gap-1 widget-control">
          <button
            onClick={onTogglePin}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isPinned ? 'Desfijar' : 'Fijar'}
          >
            {isPinned ? <PinOff className="w-3 h-3 text-white" /> : <Pin className="w-3 h-3 text-white" />}
          </button>
          <button
            onClick={onExpandir}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Expandir"
          >
            <Maximize2 className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Cerrar"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* Timer Central */}
      <div className="p-4">
        <div className={`${timerBg} rounded-xl p-3 text-center mb-3`}>
          <div className={`text-3xl font-mono font-bold ${timerColor}`}>
            {formatTime(tiempoActual)}
          </div>
          <div className={`text-xs font-medium ${timerColor} flex items-center justify-center gap-1`}>
            {tiempoActual >= alertaCritica ? (
              <span className="animate-pulse">🔴</span>
            ) : tiempoActual >= alertaTemprana ? (
              <span>🟡</span>
            ) : (
              <span>🟢</span>
            )}
            {cronometroActivo ? 'EN RONDA' : statusText}
          </div>
        </div>

        {/* Contadores Mini */}
        <div className="grid grid-cols-6 gap-1 mb-3">
          <div className="bg-emerald-500/20 rounded-lg p-2 text-center">
            <div className="text-emerald-400 text-xs">✅</div>
            <div className="text-white font-bold text-sm">{realizado}</div>
          </div>
          <div className="bg-red-500/20 rounded-lg p-2 text-center">
            <div className="text-red-400 text-xs">❌</div>
            <div className="text-white font-bold text-sm">{cancelado}</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg p-2 text-center">
            <div className="text-blue-400 text-xs">📅</div>
            <div className="text-white font-bold text-sm">{agendado}</div>
          </div>
          <div className="bg-amber-500/20 rounded-lg p-2 text-center">
            <div className="text-amber-400 text-xs">⚠️</div>
            <div className="text-white font-bold text-sm">{dificiles}</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-2 text-center">
            <div className="text-purple-400 text-xs">⏳</div>
            <div className="text-white font-bold text-sm">{pendientes}</div>
          </div>
          <div className="bg-slate-500/20 rounded-lg p-2 text-center">
            <div className="text-slate-400 text-xs">👁️</div>
            <div className="text-white font-bold text-sm">0</div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-2 mb-3 widget-control">
          <button
            onClick={onToggleCronometro}
            className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition-all ${
              cronometroActivo
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {cronometroActivo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={onGuardar}
            className="flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-600 text-white transition-all"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-slate-300">RACHA: {usuario.racha}</span>
          </div>
          {combo > 1 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 rounded-full animate-pulse">
              <Zap className="w-3 h-3 text-white" />
              <span className="text-white font-bold">x{combo}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-slate-300">XP: {usuario.xp.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress Bar Meta */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Meta: {guiasHoy}/{metaDiaria}</span>
            <span>{Math.round(progresoMeta)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progresoMeta}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE: CONTADOR GAMING
// =====================================
const GamingCounter: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: string;
  color: string;
  bgColor: string;
  min?: number;
}> = ({ label, value, onChange, icon, color, bgColor, min = 0 }) => (
  <div className={`${bgColor} rounded-xl p-3 transition-all hover:scale-[1.02]`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className={`font-medium text-sm ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Minus className={`w-4 h-4 ${color}`} />
        </button>
        <span className={`w-12 text-center font-bold text-xl ${color}`}>{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <Plus className={`w-4 h-4 ${color}`} />
        </button>
      </div>
    </div>
  </div>
);

// =====================================
// COMPONENTE: CRONÓMETRO GAMING
// =====================================
const GamingTimer: React.FC<{
  seconds: number;
  maxSeconds: number;
  alertaTemprana: number;
  alertaCritica: number;
  isRunning: boolean;
  combo: number;
}> = ({ seconds, maxSeconds, alertaTemprana, alertaCritica, isRunning, combo }) => {
  const progress = Math.min((seconds / maxSeconds) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let color = 'text-emerald-400';
  let strokeColor = 'stroke-emerald-500';
  let glowColor = 'shadow-emerald-500/50';
  let statusEmoji = '🟢';

  if (seconds >= alertaCritica) {
    color = 'text-red-400';
    strokeColor = 'stroke-red-500';
    glowColor = 'shadow-red-500/50';
    statusEmoji = '🔴';
  } else if (seconds >= alertaTemprana) {
    color = 'text-amber-400';
    strokeColor = 'stroke-amber-500';
    glowColor = 'shadow-amber-500/50';
    statusEmoji = '🟡';
  }

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full blur-xl opacity-30 ${glowColor}`} />

      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${strokeColor} transition-all duration-300`}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-mono font-bold ${color}`}>
            {formatTime(seconds)}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span>{statusEmoji}</span>
            {isRunning && (
              <span className={`text-xs ${color} animate-pulse`}>EN CURSO</span>
            )}
          </div>
          {combo > 1 && (
            <div className="flex items-center gap-1 mt-1 bg-gradient-to-r from-orange-500 to-red-500 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">COMBO x{combo}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE: RANKING
// =====================================
const RankingCard: React.FC<{
  usuarios: Usuario[];
  usuarioActualId: string;
  rondas: RondaGuias[];
}> = ({ usuarios, usuarioActualId, rondas }) => {
  const hoy = new Date().toLocaleDateString('es-CO');

  const ranking = usuarios.map(usuario => {
    const rondasHoy = rondas.filter(r => r.usuarioId === usuario.id && r.fecha === hoy);
    const guiasHoy = rondasHoy.reduce((acc, r) => acc + r.realizado, 0);
    const tiempoPromedio = rondasHoy.length > 0
      ? rondasHoy.reduce((acc, r) => acc + r.tiempoPromedio, 0) / rondasHoy.length
      : 0;
    const xpHoy = rondasHoy.reduce((acc, r) => acc + r.xpGanado, 0);

    return {
      ...usuario,
      guiasHoy,
      tiempoPromedio,
      xpHoy,
    };
  }).sort((a, b) => b.guiasHoy - a.guiasHoy);

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const usuarioActual = ranking.find(u => u.id === usuarioActualId);
  const lider = ranking[0];
  const diferencia = usuarioActual ? lider.guiasHoy - usuarioActual.guiasHoy : 0;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-white">RANKING DEL EQUIPO - HOY</h3>
      </div>

      <div className="space-y-2">
        {ranking.map((usuario, index) => {
          const nivelInfo = getNivelInfo(usuario.xp);
          const isCurrentUser = usuario.id === usuarioActualId;
          const barWidth = lider.guiasHoy > 0 ? (usuario.guiasHoy / lider.guiasHoy) * 100 : 0;

          return (
            <div
              key={usuario.id}
              className={`relative rounded-xl p-3 transition-all ${
                isCurrentUser
                  ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/50'
                  : 'bg-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">{getMedalIcon(index)}</span>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-white font-bold`}>
                    {usuario.nombre.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{usuario.nombre}</span>
                      {isCurrentUser && (
                        <span className="text-xs bg-cyan-500 text-white px-1.5 py-0.5 rounded">TÚ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>Lvl {usuario.nivel}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{usuario.guiasHoy} guías</div>
                  <div className="text-xs text-slate-400">
                    {usuario.tiempoPromedio > 0 ? usuario.tiempoPromedio.toFixed(1) : '0.0'} min | {usuario.xpHoy} XP
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-600' : 'bg-slate-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {usuarioActual && diferencia > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-2 text-sm">
            <Lightbulb className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300">
              ¡Solo <span className="font-bold text-white">{diferencia} guías</span> más para alcanzar a {lider.nombre}!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================
// COMPONENTE: MEDALLAS
// =====================================
const MedallasPanel: React.FC<{
  medallas: Medalla[];
  usuarioMedallas: string[];
}> = ({ medallas, usuarioMedallas }) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Medal className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-white">LOGROS Y MEDALLAS</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {medallas.map((medalla) => {
          const desbloqueada = usuarioMedallas.includes(medalla.id);
          return (
            <div
              key={medalla.id}
              className={`rounded-xl p-3 transition-all ${
                desbloqueada
                  ? 'bg-gradient-to-br from-amber-600/30 to-yellow-600/30 border border-amber-500/50'
                  : 'bg-slate-700/30 opacity-60'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-2xl ${!desbloqueada && 'grayscale'}`}>{medalla.icono}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{medalla.nombre}</div>
                  <div className="text-xs text-slate-400 line-clamp-2">{medalla.descripcion}</div>
                  {!desbloqueada && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                        <span>{medalla.progreso}/{medalla.objetivo}</span>
                      </div>
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${(medalla.progreso / medalla.objetivo) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {desbloqueada && (
                    <div className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      +{medalla.xpRecompensa} XP
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE: POWER-UPS
// =====================================
const PowerUpsPanel: React.FC<{
  powerUps: PowerUp[];
  onActivar: (id: string) => void;
}> = ({ powerUps, onActivar }) => {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-white">POWER-UPS DISPONIBLES</h3>
      </div>

      <div className="flex gap-2">
        {powerUps.map((powerUp) => (
          <button
            key={powerUp.id}
            onClick={() => onActivar(powerUp.id)}
            disabled={powerUp.activo}
            className={`flex-1 rounded-xl p-3 transition-all ${
              powerUp.activo
                ? 'bg-gradient-to-br from-cyan-600 to-blue-600 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900'
                : 'bg-slate-700/50 hover:bg-slate-700 hover:scale-105'
            }`}
          >
            <div className="text-2xl mb-1">{powerUp.icono}</div>
            <div className="text-xs font-bold text-white">{powerUp.nombre}</div>
            {powerUp.activo && (
              <div className="text-xs text-cyan-300 animate-pulse">ACTIVO</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE: TIP DE PRODUCTIVIDAD
// =====================================
const TipProductividad: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  return (
    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm text-purple-200 mb-2">{TIPS_PRODUCTIVIDAD[tipIndex]}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTipIndex((prev) => (prev - 1 + TIPS_PRODUCTIVIDAD.length) % TIPS_PRODUCTIVIDAD.length)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" /> Anterior
            </button>
            <span className="text-xs text-purple-500">
              {tipIndex + 1}/{TIPS_PRODUCTIVIDAD.length}
            </span>
            <button
              onClick={() => setTipIndex((prev) => (prev + 1) % TIPS_PRODUCTIVIDAD.length)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =====================================
// COMPONENTE PRINCIPAL
// =====================================
export const ProcesosLitperTab: React.FC<ProcesosLitperTabProps> = ({ selectedCountry }) => {
  // Estados principales
  const [modo, setModo] = useState<'selector' | 'usuario' | 'admin' | 'gaming'>('selector');
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<'guias' | 'novedades' | null>(null);

  // Estados de datos
  const [rondas, setRondas] = useState<RondaGuias[]>([]);
  const [novedades, setNovedades] = useState<RegistroNovedades[]>([]);
  const [config, setConfig] = useState<ConfiguracionCronometro>(CONFIG_DEFAULT);
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_DEFAULT);

  // Estados del cronómetro
  const [tiempoActual, setTiempoActual] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [rondaActual, setRondaActual] = useState(1);

  // Estados del formulario de guías
  const [pedidosIniciales, setPedidosIniciales] = useState(0);
  const [realizado, setRealizado] = useState(0);
  const [cancelado, setCancelado] = useState(0);
  const [agendado, setAgendado] = useState(0);
  const [dificiles, setDificiles] = useState(0);
  const [pendientes, setPendientes] = useState(0);
  const [revisado, setRevisado] = useState(0);

  // Estados de gamificación
  const [combo, setCombo] = useState(1);
  const [guiasRapidas, setGuiasRapidas] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUp[]>(POWER_UPS);
  const [medallas, setMedallas] = useState<Medalla[]>(MEDALLAS_DISPONIBLES);

  // Estados del widget
  const [showWidget, setShowWidget] = useState(false);
  const [widgetExpanded, setWidgetExpanded] = useState(false);
  const [widgetPinned, setWidgetPinned] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>({ x: 20, y: 100 });

  // Estados de UI
  const [showMensaje, setShowMensaje] = useState(false);
  const [mensajeActual, setMensajeActual] = useState('');
  const [vistaAdmin, setVistaAdmin] = useState<'hoy' | 'semana' | 'equipo' | 'config' | 'ranking'>('hoy');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [nuevoNivel, setNuevoNivel] = useState(0);

  // Estados del formulario de novedades
  const [solucionadas, setSolucionadas] = useState(0);
  const [revisadas, setRevisadas] = useState(0);
  const [devolucion, setDevolucion] = useState(0);
  const [clienteNov, setClienteNov] = useState(0);
  const [transportadoraNov, setTransportadoraNov] = useState(0);
  const [litperNov, setLitperNov] = useState(0);

  // Cargar datos al montar
  useEffect(() => {
    setRondas(loadFromStorage(STORAGE_KEY_RONDAS, []));
    setNovedades(loadFromStorage(STORAGE_KEY_NOVEDADES, []));
    setConfig(loadFromStorage(STORAGE_KEY_CONFIG, CONFIG_DEFAULT));
    setUsuarios(loadFromStorage(STORAGE_KEY_USUARIOS, USUARIOS_DEFAULT));
    setWidgetPosition(loadFromStorage(STORAGE_KEY_WIDGET, { x: 20, y: 100 }));
  }, []);

  // Guardar datos
  useEffect(() => { saveToStorage(STORAGE_KEY_RONDAS, rondas); }, [rondas]);
  useEffect(() => { saveToStorage(STORAGE_KEY_NOVEDADES, novedades); }, [novedades]);
  useEffect(() => { saveToStorage(STORAGE_KEY_CONFIG, config); }, [config]);
  useEffect(() => { saveToStorage(STORAGE_KEY_USUARIOS, usuarios); }, [usuarios]);
  useEffect(() => { saveToStorage(STORAGE_KEY_WIDGET, widgetPosition); }, [widgetPosition]);

  // Cronómetro con sistema de combos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cronometroActivo) {
      interval = setInterval(() => {
        setTiempoActual((prev) => {
          const newTime = prev + 1;

          // Verificar combo (si supera 4 min, pierde combo)
          if (newTime >= 240 && combo > 1) {
            setCombo(1);
            setGuiasRapidas(0);
          }

          // Mostrar mensaje motivacional
          if (config.mensajesMotivacionales && newTime === config.alertaCritica) {
            const mensaje = MENSAJES_MOTIVACIONALES[Math.floor(Math.random() * MENSAJES_MOTIVACIONALES.length)];
            setMensajeActual(mensaje);
            setShowMensaje(true);
            setTimeout(() => setShowMensaje(false), 5000);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cronometroActivo, config.mensajesMotivacionales, config.alertaCritica, combo]);

  // Calcular guías de hoy
  const guiasHoy = useMemo(() => {
    if (!usuarioActual) return 0;
    const hoy = new Date().toLocaleDateString('es-CO');
    return rondas
      .filter(r => r.usuarioId === usuarioActual.id && r.fecha === hoy)
      .reduce((acc, r) => acc + r.realizado, 0);
  }, [rondas, usuarioActual]);

  // Tiempo promedio
  const tiempoPromedio = useMemo(() => {
    const totalProcesados = realizado + cancelado + agendado;
    if (totalProcesados === 0 || tiempoActual === 0) return 0;
    return tiempoActual / 60 / totalProcesados;
  }, [realizado, cancelado, agendado, tiempoActual]);

  // Actualizar combo cuando se procesa una guía rápida
  const procesarGuiaRapida = useCallback(() => {
    if (tiempoPromedio < 2 && tiempoPromedio > 0) {
      setGuiasRapidas(prev => {
        const nuevas = prev + 1;
        if (nuevas >= 10) {
          setCombo(5);
        } else if (nuevas >= 5) {
          setCombo(3);
        } else if (nuevas >= 3) {
          setCombo(2);
        }
        return nuevas;
      });
    }
  }, [tiempoPromedio]);

  // Finalizar ronda con gamificación
  const finalizarRonda = () => {
    if (!usuarioActual) return;

    const xpGanado = calcularXP(realizado, tiempoPromedio, cancelado, combo);
    const nivelAnterior = usuarioActual.nivel;

    const nuevaRonda: RondaGuias = {
      id: `ronda-${Date.now()}`,
      numero: rondaActual,
      usuarioId: usuarioActual.id,
      fecha: new Date().toLocaleDateString('es-CO'),
      horaInicio: new Date(Date.now() - tiempoActual * 1000).toLocaleTimeString('es-CO'),
      horaFin: new Date().toLocaleTimeString('es-CO'),
      tiempoTotal: tiempoActual,
      pedidosIniciales,
      realizado,
      cancelado,
      agendado,
      dificiles,
      pendientes,
      revisado,
      tiempoPromedio: parseFloat(tiempoPromedio.toFixed(2)) || 0,
      xpGanado,
      comboMaximo: combo,
    };

    setRondas(prev => [...prev, nuevaRonda]);

    // Actualizar usuario con XP
    const nuevoXP = usuarioActual.xp + xpGanado;
    const nuevasGuiasTotales = usuarioActual.guiasTotales + realizado;
    const nuevoNivelInfo = getNivelInfo(nuevoXP);

    setUsuarios(prev => prev.map(u =>
      u.id === usuarioActual.id
        ? {
            ...u,
            xp: nuevoXP,
            nivel: nuevoNivelInfo.nivel,
            guiasTotales: nuevasGuiasTotales,
            combosMaximos: Math.max(u.combosMaximos, combo),
          }
        : u
    ));

    setUsuarioActual(prev => prev ? {
      ...prev,
      xp: nuevoXP,
      nivel: nuevoNivelInfo.nivel,
      guiasTotales: nuevasGuiasTotales,
      combosMaximos: Math.max(prev.combosMaximos, combo),
    } : null);

    // Check level up
    if (nuevoNivelInfo.nivel > nivelAnterior) {
      setNuevoNivel(nuevoNivelInfo.nivel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    // Mostrar XP ganado
    setMensajeActual(`🎉 +${xpGanado} XP ganados! ${combo > 1 ? `(COMBO x${combo})` : ''}`);
    setShowMensaje(true);
    setTimeout(() => setShowMensaje(false), 3000);

    // Resetear
    setRondaActual(prev => prev + 1);
    setTiempoActual(0);
    setCronometroActivo(false);
    setPedidosIniciales(0);
    setRealizado(0);
    setCancelado(0);
    setAgendado(0);
    setDificiles(0);
    setPendientes(0);
    setRevisado(0);
    setCombo(1);
    setGuiasRapidas(0);
  };

  // Guardar novedades
  const guardarNovedades = () => {
    if (!usuarioActual) return;

    const nuevoRegistro: RegistroNovedades = {
      id: `nov-${Date.now()}`,
      usuarioId: usuarioActual.id,
      fecha: new Date().toLocaleDateString('es-CO'),
      hora: new Date().toLocaleTimeString('es-CO'),
      solucionadas,
      revisadas,
      devolucion,
      cliente: clienteNov,
      transportadora: transportadoraNov,
      litper: litperNov,
    };

    setNovedades(prev => [...prev, nuevoRegistro]);

    // Bonus XP por novedades solucionadas
    const xpBonus = solucionadas * 5;
    if (xpBonus > 0 && usuarioActual) {
      const nuevoXP = usuarioActual.xp + xpBonus;
      setUsuarios(prev => prev.map(u =>
        u.id === usuarioActual.id ? { ...u, xp: nuevoXP } : u
      ));
      setUsuarioActual(prev => prev ? { ...prev, xp: nuevoXP } : null);

      setMensajeActual(`✅ +${xpBonus} XP por novedades solucionadas!`);
      setShowMensaje(true);
      setTimeout(() => setShowMensaje(false), 3000);
    }

    setSolucionadas(0);
    setRevisadas(0);
    setDevolucion(0);
    setClienteNov(0);
    setTransportadoraNov(0);
    setLitperNov(0);
  };

  // Activar power-up
  const activarPowerUp = (id: string) => {
    setPowerUps(prev => prev.map(p =>
      p.id === id ? { ...p, activo: true } : p
    ));

    // Desactivar después de la duración
    const powerUp = powerUps.find(p => p.id === id);
    if (powerUp) {
      setTimeout(() => {
        setPowerUps(prev => prev.map(p =>
          p.id === id ? { ...p, activo: false } : p
        ));
      }, powerUp.duracion * 1000);
    }
  };

  // Estadísticas del día
  const estadisticasHoy = useMemo(() => {
    const hoy = new Date().toLocaleDateString('es-CO');
    const rondasHoy = rondas.filter(r => r.fecha === hoy);
    const novedadesHoy = novedades.filter(n => n.fecha === hoy);

    return {
      totalRondas: rondasHoy.length,
      totalPedidos: rondasHoy.reduce((acc, r) => acc + r.pedidosIniciales, 0),
      totalRealizado: rondasHoy.reduce((acc, r) => acc + r.realizado, 0),
      totalCancelado: rondasHoy.reduce((acc, r) => acc + r.cancelado, 0),
      totalAgendado: rondasHoy.reduce((acc, r) => acc + r.agendado, 0),
      totalDificiles: rondasHoy.reduce((acc, r) => acc + r.dificiles, 0),
      promedioGeneral: rondasHoy.length > 0
        ? (rondasHoy.reduce((acc, r) => acc + r.tiempoPromedio, 0) / rondasHoy.length).toFixed(2)
        : '0',
      xpTotal: rondasHoy.reduce((acc, r) => acc + r.xpGanado, 0),
      novedadesSolucionadas: novedadesHoy.reduce((acc, n) => acc + n.solucionadas, 0),
    };
  }, [rondas, novedades]);

  // Exportar Excel
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    const rondasData = [
      ['REGISTRO DE RONDAS - LITPER PROCESOS GAMING'],
      [''],
      ['Fecha', 'Usuario', 'Ronda', 'Tiempo', 'Pedidos', 'Realizado', 'Cancelado', 'T.Promedio', 'XP Ganado', 'Combo Max'],
      ...rondas.map(r => [
        r.fecha,
        usuarios.find(u => u.id === r.usuarioId)?.nombre || 'N/A',
        r.numero,
        formatTime(r.tiempoTotal),
        r.pedidosIniciales,
        r.realizado,
        r.cancelado,
        r.tiempoPromedio.toFixed(2) + ' min',
        r.xpGanado,
        r.comboMaximo,
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rondasData), 'Rondas');

    const rankingData = [
      ['RANKING DE USUARIOS'],
      [''],
      ['Posición', 'Usuario', 'Nivel', 'XP Total', 'Guías Totales', 'Mejor Tiempo', 'Racha'],
      ...usuarios
        .sort((a, b) => b.xp - a.xp)
        .map((u, i) => [
          i + 1,
          u.nombre,
          u.nivel,
          u.xp,
          u.guiasTotales,
          u.mejorTiempo + ' min',
          u.racha + ' días',
        ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rankingData), 'Ranking');

    XLSX.writeFile(wb, `Litper_Gaming_${new Date().toLocaleDateString('es-CO')}.xlsx`);
  };

  // =====================================
  // RENDERS
  // =====================================

  // Level Up Animation
  if (showLevelUp) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="text-center animate-bounce">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2">¡NIVEL UP!</h1>
          <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            NIVEL {nuevoNivel}
          </div>
          <p className="text-xl text-slate-300 mt-4">{getNivelInfo(usuarioActual?.xp || 0).nombre}</p>
        </div>
      </div>
    );
  }

  // Mensaje flotante
  const mensajeFlotante = showMensaje && (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
      {mensajeActual}
    </div>
  );

  // Widget flotante
  const widgetFlotante = showWidget && usuarioActual && !widgetExpanded && (
    <FloatingWidget
      usuario={usuarioActual}
      tiempoActual={tiempoActual}
      cronometroActivo={cronometroActivo}
      realizado={realizado}
      cancelado={cancelado}
      agendado={agendado}
      dificiles={dificiles}
      pendientes={pendientes}
      combo={combo}
      metaDiaria={config.metaDiaria}
      guiasHoy={guiasHoy}
      onToggleCronometro={() => setCronometroActivo(!cronometroActivo)}
      onGuardar={finalizarRonda}
      onExpandir={() => setWidgetExpanded(true)}
      isPinned={widgetPinned}
      onTogglePin={() => setWidgetPinned(!widgetPinned)}
      onClose={() => setShowWidget(false)}
      position={widgetPosition}
      onPositionChange={setWidgetPosition}
      alertaTemprana={config.alertaTemprana}
      alertaCritica={config.alertaCritica}
    />
  );

  // SELECTOR DE MODO
  if (modo === 'selector') {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {mensajeFlotante}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-500/30 animate-pulse">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            LITPER PROCESOS
          </h1>
          <p className="text-slate-400 mb-2">Sistema de control de procesos logísticos</p>
          <p className="text-cyan-400 text-sm mb-8 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            GAMING EDITION
            <Sparkles className="w-4 h-4" />
          </p>

          <h2 className="text-lg font-bold text-slate-300 mb-6">SELECCIONA TU MODO</h2>

          <div className="flex gap-6 justify-center">
            <button
              onClick={() => setModo('usuario')}
              className="group bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all border border-slate-700 hover:border-cyan-500 w-52"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">USUARIO</h3>
              <p className="text-sm text-slate-400">LOGÍSTICO</p>
              <p className="text-xs text-cyan-400 mt-2">+ Sistema XP</p>
            </button>

            <button
              onClick={() => setModo('admin')}
              className="group bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 transition-all border border-slate-700 hover:border-amber-500 w-52"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">ADMIN</h3>
              <p className="text-sm text-slate-400">GERENCIA</p>
              <p className="text-xs text-amber-400 mt-2">+ Ranking</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SELECCIÓN DE USUARIO
  if (modo === 'usuario' && !usuarioActual) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 border border-slate-700">
          <button
            onClick={() => setModo('selector')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30">
              <span className="text-4xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-white">¡Hola! ¿Quién eres?</h2>
            <p className="text-sm text-slate-400 mt-1">Selecciona tu perfil para continuar</p>
          </div>

          <div className="space-y-3">
            {usuarios.map((usuario) => {
              const nivelInfo = getNivelInfo(usuario.xp);
              return (
                <button
                  key={usuario.id}
                  onClick={() => {
                    setUsuarioActual(usuario);
                    setShowWidget(true);
                  }}
                  className="w-full p-4 rounded-xl border border-slate-600 hover:border-cyan-500 bg-slate-700/50 hover:bg-slate-700 transition-all flex items-center gap-4 group"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {usuario.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg">{usuario.nombre}</span>
                      <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full">
                        Lvl {usuario.nivel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        {usuario.xp.toLocaleString()} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {usuario.racha} días
                      </span>
                    </div>
                    <div className="mt-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${nivelInfo.color}`}
                        style={{ width: `${nivelInfo.progreso}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // SELECCIÓN DE TIPO DE REGISTRO
  if (modo === 'usuario' && usuarioActual && !tipoRegistro) {
    const nivelInfo = getNivelInfo(usuarioActual.xp);

    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {mensajeFlotante}
        {widgetFlotante}

        <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-xl max-w-lg w-full mx-4 border border-slate-700">
          <button
            onClick={() => setUsuarioActual(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Cambiar usuario
          </button>

          {/* User Card */}
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl p-4 mb-6 border border-cyan-500/30">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                {usuarioActual.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xl">{usuarioActual.nombre}</span>
                  <span className="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
                    {nivelInfo.nombre}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-300 mt-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>Nivel {usuarioActual.nivel}</span>
                  <span className="text-slate-500 mx-1">•</span>
                  <span>{usuarioActual.xp.toLocaleString()} XP</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{nivelInfo.xpEnNivel} / {nivelInfo.xpParaSiguiente} XP</span>
                    <span>{Math.round(nivelInfo.progreso)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${nivelInfo.color} transition-all`}
                      style={{ width: `${nivelInfo.progreso}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-white">{usuarioActual.guiasTotales}</div>
                <div className="text-xs text-slate-400">Guías Total</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-orange-400">{usuarioActual.racha}</div>
                <div className="text-xs text-slate-400">Racha</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-purple-400">x{usuarioActual.combosMaximos}</div>
                <div className="text-xs text-slate-400">Max Combo</div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-300 text-center mb-4">¿Qué vas a registrar?</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTipoRegistro('guias')}
              className="group bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all hover:scale-105"
            >
              <Package className="w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg">Generación</h3>
              <p className="text-sm opacity-80">Guías</p>
              <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-1">
                +XP por guía
              </div>
            </button>

            <button
              onClick={() => setTipoRegistro('novedades')}
              className="group bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:scale-105"
            >
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-lg">Novedades</h3>
              <p className="text-sm opacity-80">Gestión</p>
              <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-1">
                +XP por solución
              </div>
            </button>
          </div>

          <TipProductividad />
        </div>
      </div>
    );
  }

  // FORMULARIO GAMING DE GUÍAS
  if (modo === 'usuario' && tipoRegistro === 'guias' && usuarioActual) {
    const nivelInfo = getNivelInfo(usuarioActual.xp);
    const progresoMeta = Math.min((guiasHoy / config.metaDiaria) * 100, 100);

    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {mensajeFlotante}
        {widgetFlotante}

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setTipoRegistro(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWidget(!showWidget)}
                className={`p-2 rounded-lg transition-colors ${showWidget ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
              >
                <Gamepad2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card de Usuario y Misión */}
              <div className="grid grid-cols-2 gap-4">
                {/* Usuario */}
                <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-white font-bold shadow-lg`}>
                      {usuarioActual.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">{usuarioActual.nombre}</div>
                      <div className="text-sm text-slate-400">Nivel {usuarioActual.nivel} - {nivelInfo.nombre}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>XP: {usuarioActual.xp.toLocaleString()}</span>
                      <span>{Math.round(nivelInfo.progreso)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${nivelInfo.color}`} style={{ width: `${nivelInfo.progreso}%` }} />
                    </div>
                  </div>
                </div>

                {/* Misión del Día */}
                <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="font-bold text-white">MISIÓN DEL DÍA</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{guiasHoy}/{config.metaDiaria}</div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${progresoMeta}%` }} />
                  </div>
                  <div className="text-xs text-purple-300 mt-2">
                    {progresoMeta >= 100 ? '🎉 ¡MISIÓN CUMPLIDA!' : `Faltan ${config.metaDiaria - guiasHoy} guías`}
                  </div>
                </div>
              </div>

              {/* Cronómetro Gaming */}
              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Timer className="w-6 h-6 text-cyan-400" />
                    RONDA {rondaActual}
                  </h2>
                  {combo > 1 && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 rounded-full animate-pulse">
                      <Flame className="w-5 h-5 text-white" />
                      <span className="text-white font-bold">COMBO x{combo}</span>
                      <span className="text-white/80 text-sm">(+{(combo - 1) * 10}% XP)</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <GamingTimer
                    seconds={tiempoActual}
                    maxSeconds={config.tiempoPorRonda * 60}
                    alertaTemprana={config.alertaTemprana}
                    alertaCritica={config.alertaCritica}
                    isRunning={cronometroActivo}
                    combo={combo}
                  />

                  {/* Leyenda de tiempos */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="flex items-center gap-1 text-emerald-400">🟢 &lt; 2:30 min</span>
                    <span className="flex items-center gap-1 text-amber-400">🟡 2:30-4:00 min</span>
                    <span className="flex items-center gap-1 text-red-400">🔴 &gt; 4:00 min</span>
                  </div>

                  {/* Controles */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setCronometroActivo(!cronometroActivo)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        cronometroActivo
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {cronometroActivo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {cronometroActivo ? 'PAUSAR' : 'INICIAR'}
                    </button>
                    <button
                      onClick={() => { setTiempoActual(0); setCronometroActivo(false); }}
                      className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={finalizarRonda}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all"
                    >
                      <Save className="w-5 h-5" />
                      GUARDAR
                    </button>
                  </div>
                </div>
              </div>

              {/* Contadores Gaming */}
              <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 border border-slate-700">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  CONTADORES DE GUÍAS
                </h3>

                {/* Pedidos iniciales */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Pedidos Iniciales</label>
                  <input
                    type="number"
                    value={pedidosIniciales || ''}
                    onChange={(e) => setPedidosIniciales(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <GamingCounter label="Realizado" value={realizado} onChange={setRealizado} icon="✅" color="text-emerald-400" bgColor="bg-emerald-500/20" />
                  <GamingCounter label="Cancelado" value={cancelado} onChange={setCancelado} icon="❌" color="text-red-400" bgColor="bg-red-500/20" />
                  <GamingCounter label="Agendado" value={agendado} onChange={setAgendado} icon="📅" color="text-blue-400" bgColor="bg-blue-500/20" />
                  <GamingCounter label="Difíciles" value={dificiles} onChange={setDificiles} icon="⚠️" color="text-amber-400" bgColor="bg-amber-500/20" />
                  <GamingCounter label="Pendientes" value={pendientes} onChange={setPendientes} icon="⏳" color="text-purple-400" bgColor="bg-purple-500/20" />
                  <GamingCounter label="Revisado" value={revisado} onChange={setRevisado} icon="👁️" color="text-slate-400" bgColor="bg-slate-500/20" />
                </div>

                {/* Tiempo promedio */}
                <div className="mt-4 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl p-4 text-center border border-cyan-500/30">
                  <p className="text-sm text-slate-400">Tiempo Promedio por Guía</p>
                  <p className="text-4xl font-bold text-cyan-400">
                    {tiempoPromedio.toFixed(2)} <span className="text-lg">min</span>
                  </p>
                  {tiempoPromedio > 0 && tiempoPromedio < 2 && (
                    <p className="text-xs text-emerald-400 mt-1">🚀 ¡Velocidad increíble! +XP bonus</p>
                  )}
                </div>
              </div>
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              {/* Ranking */}
              <RankingCard usuarios={usuarios} usuarioActualId={usuarioActual.id} rondas={rondas} />

              {/* Power-Ups */}
              <PowerUpsPanel powerUps={powerUps} onActivar={activarPowerUp} />

              {/* Tip */}
              <TipProductividad />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FORMULARIO DE NOVEDADES
  if (modo === 'usuario' && tipoRegistro === 'novedades' && usuarioActual) {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        {mensajeFlotante}

        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setTipoRegistro(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver
            </button>
          </div>

          <div className="bg-slate-800/80 backdrop-blur rounded-2xl shadow-xl overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">REGISTRO DE NOVEDADES</h2>
                  <p className="text-sm opacity-80">{usuarioActual.nombre} | {new Date().toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wide">Estado de Gestión</h3>
                <GamingCounter label="Solucionadas" value={solucionadas} onChange={setSolucionadas} icon="✅" color="text-emerald-400" bgColor="bg-emerald-500/20" />
                <GamingCounter label="Revisadas" value={revisadas} onChange={setRevisadas} icon="👁️" color="text-blue-400" bgColor="bg-blue-500/20" />
                <GamingCounter label="Devolución" value={devolucion} onChange={setDevolucion} icon="🔄" color="text-purple-400" bgColor="bg-purple-500/20" />
              </div>

              <hr className="border-slate-700" />

              <div className="space-y-3">
                <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wide">📍 Origen del Problema</h3>
                <GamingCounter label="Cliente" value={clienteNov} onChange={setClienteNov} icon="👤" color="text-cyan-400" bgColor="bg-cyan-500/20" />
                <GamingCounter label="Transportadora" value={transportadoraNov} onChange={setTransportadoraNov} icon="🚚" color="text-amber-400" bgColor="bg-amber-500/20" />
                <GamingCounter label="Litper" value={litperNov} onChange={setLitperNov} icon="🏢" color="text-red-400" bgColor="bg-red-500/20" />
              </div>

              {solucionadas > 0 && (
                <div className="bg-emerald-500/20 rounded-xl p-3 border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm">💎 Ganarás +{solucionadas * 5} XP por novedades solucionadas</p>
                </div>
              )}

              <button
                onClick={guardarNovedades}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                GUARDAR REGISTRO
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MODO ADMIN
  if (modo === 'admin') {
    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setModo('selector')} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-500" />
                  PANEL DE CONTROL
                </h1>
                <p className="text-sm text-slate-400">LITPER Procesos - Gaming Edition</p>
              </div>
            </div>
            <button
              onClick={exportarExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            {[
              { id: 'hoy', label: '📅 HOY' },
              { id: 'ranking', label: '🏆 RANKING' },
              { id: 'equipo', label: '👥 EQUIPO' },
              { id: 'config', label: '⚙️ CONFIG' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setVistaAdmin(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  vistaAdmin === tab.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {vistaAdmin === 'hoy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Rondas</span>
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-white">{estadisticasHoy.totalRondas}</p>
                </div>
                <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Realizadas</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-400">{estadisticasHoy.totalRealizado}</p>
                </div>
                <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Canceladas</span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-400">{estadisticasHoy.totalCancelado}</p>
                </div>
                <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">T. Promedio</span>
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-purple-400">{estadisticasHoy.promedioGeneral}<span className="text-sm"> min</span></p>
                </div>
                <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">XP Total</span>
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">{estadisticasHoy.xpTotal}</p>
                </div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="font-bold text-white">Rondas de Hoy</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-400">Usuario</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">Ronda</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">Tiempo</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">Realizado</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">Cancel.</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">T.Prom</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">XP</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-400">Combo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {rondas
                        .filter(r => r.fecha === new Date().toLocaleDateString('es-CO'))
                        .map((ronda) => (
                          <tr key={ronda.id} className="hover:bg-slate-700/30">
                            <td className="px-4 py-3 font-medium text-white">
                              {usuarios.find(u => u.id === ronda.usuarioId)?.nombre}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-300">{ronda.numero}</td>
                            <td className="px-4 py-3 text-center text-slate-300">{formatTime(ronda.tiempoTotal)}</td>
                            <td className="px-4 py-3 text-center text-emerald-400 font-bold">{ronda.realizado}</td>
                            <td className="px-4 py-3 text-center text-red-400">{ronda.cancelado}</td>
                            <td className="px-4 py-3 text-center text-slate-300">{ronda.tiempoPromedio.toFixed(2)} min</td>
                            <td className="px-4 py-3 text-center text-yellow-400 font-bold">+{ronda.xpGanado}</td>
                            <td className="px-4 py-3 text-center">
                              {ronda.comboMaximo > 1 && (
                                <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs">
                                  x{ronda.comboMaximo}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vistaAdmin === 'ranking' && (
            <div className="max-w-2xl mx-auto">
              <RankingCard usuarios={usuarios} usuarioActualId="" rondas={rondas} />

              <div className="mt-6">
                <MedallasPanel medallas={medallas} usuarioMedallas={[]} />
              </div>
            </div>
          )}

          {vistaAdmin === 'equipo' && (
            <div className="grid gap-4">
              {usuarios.map((usuario) => {
                const nivelInfo = getNivelInfo(usuario.xp);
                const rondasUsuario = rondas.filter(r => r.usuarioId === usuario.id);
                const totalRealizado = rondasUsuario.reduce((acc, r) => acc + r.realizado, 0);

                return (
                  <div key={usuario.id} className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${nivelInfo.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                          {usuario.nombre.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">{usuario.nombre}</h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              Lvl {usuario.nivel}
                            </span>
                            <span>{usuario.xp.toLocaleString()} XP</span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-4 h-4 text-orange-400" />
                              {usuario.racha} días
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-400">{usuario.guiasTotales}</p>
                        <p className="text-xs text-slate-400">guías totales</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-slate-400">Mejor Tiempo</p>
                        <p className="font-bold text-white">{usuario.mejorTiempo} min</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">T. Promedio</p>
                        <p className="font-bold text-white">{usuario.tiempoPromedioHistorico} min</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Max Combo</p>
                        <p className="font-bold text-orange-400">x{usuario.combosMaximos}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Medallas</p>
                        <p className="font-bold text-amber-400">{usuario.medallas.length}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {vistaAdmin === 'config' && (
            <div className="max-w-lg mx-auto">
              <div className="bg-slate-800/80 backdrop-blur rounded-xl p-6 border border-slate-700 space-y-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  Configuración del Sistema
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meta diaria de guías</label>
                    <input
                      type="number"
                      value={config.metaDiaria}
                      onChange={(e) => setConfig({ ...config, metaDiaria: parseInt(e.target.value) || 60 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Tiempo por ronda (minutos)</label>
                    <input
                      type="number"
                      value={config.tiempoPorRonda}
                      onChange={(e) => setConfig({ ...config, tiempoPorRonda: parseInt(e.target.value) || 25 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Alerta temprana (segundos)</label>
                    <input
                      type="number"
                      value={config.alertaTemprana}
                      onChange={(e) => setConfig({ ...config, alertaTemprana: parseInt(e.target.value) || 150 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Alerta crítica (segundos)</label>
                    <input
                      type="number"
                      value={config.alertaCritica}
                      onChange={(e) => setConfig({ ...config, alertaCritica: parseInt(e.target.value) || 240 })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-700">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.sonidoActivo}
                        onChange={(e) => setConfig({ ...config, sonidoActivo: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700"
                      />
                      <span className="text-slate-300">Activar sonidos</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.mensajesMotivacionales}
                        onChange={(e) => setConfig({ ...config, mensajesMotivacionales: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-700"
                      />
                      <span className="text-slate-300">Mensajes motivacionales</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => saveToStorage(STORAGE_KEY_CONFIG, config)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
                >
                  GUARDAR CONFIGURACIÓN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ProcesosLitperTab;
